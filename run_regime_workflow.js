const Database = require('better-sqlite3');
const path = require('path');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const dbPath = path.join(__dirname, 'portfolio/data/portfolio.db');
const db = new Database(dbPath);

const TODAY = '2026-03-03';
const YESTERDAY = '2026-03-02';

// 1. Get active tickers from thesis table
const tickersRaw = db.prepare("SELECT ticker FROM thesis WHERE status IN ('active', 'weakened') ORDER BY ticker").all();
const TICKERS = tickersRaw.map(t => t.ticker);
console.log(`=== REGIME SCORING WORKFLOW FOR ${TODAY} ===`);
console.log(`Active tickers: ${TICKERS.join(', ')}\n`);

// Helpers
function sma(arr, period) {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period || 0.0001;
  const avgLoss = losses / period || 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function computeMACD(closes) {
  function ema(data, period) {
    const k = 2 / (period + 1);
    let result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  }
  if (closes.length < 35) return { histogram: null, prevHistogram: null };
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signal[i]);
  return { histogram: hist[hist.length - 1], prevHistogram: hist[hist.length - 2] };
}

const insertScore = db.prepare(`
  INSERT OR REPLACE INTO indicator_scores 
  (date, ticker, indicator, signal_direction, signal_value, outcome, outcome_date)
  VALUES (?, ?, ?, ?, ?, NULL, NULL)
`);

const insertRegime = db.prepare(`
  INSERT OR REPLACE INTO regime_summary
  (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getPrevRegime = db.prepare(`SELECT regime FROM regime_summary WHERE ticker = ? AND date = ? ORDER BY date DESC LIMIT 1`);

function getAccuracy(ticker, indicator) {
  const rows = db.prepare(`
    SELECT outcome FROM indicator_scores 
    WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL 
    ORDER BY date DESC LIMIT 20
  `).all(ticker, indicator);
  if (rows.length === 0) return 0.5;
  const correct = rows.filter(r => r.outcome === 1).length;
  return correct / rows.length;
}

async function main() {
  const results = [];
  const regimeChanges = [];
  const failures = [];

  for (const ticker of TICKERS) {
    try {
      // Fetch data - need ~250 days for SMA200, plus buffer
      const endDate = new Date('2026-03-04'); // exclusive, includes 03-03
      const startDate = new Date('2025-03-01');
      
      let data;
      try {
        data = await yahooFinance.historical(ticker, {
          period1: startDate,
          period2: endDate,
        });
      } catch (e) {
        throw new Error(`Yahoo Finance error: ${e.message}`);
      }

      if (!data || data.length < 200) {
        throw new Error(`Insufficient data (${data?.length || 0} bars)`);
      }

      // Sort ascending
      data.sort((a, b) => new Date(a.date) - new Date(b.date));

      const closes = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      const highs = data.map(d => d.high);
      
      // Get latest day (should be 2026-03-03)
      const latestIdx = data.length - 1;
      const latestDate = data[latestIdx].date.toISOString().split('T')[0];
      const latestClose = closes[latestIdx];
      const prevClose = closes[latestIdx - 1];
      const latestVolume = volumes[latestIdx];
      const latestHigh = highs[latestIdx];

      if (latestDate !== TODAY) {
        console.log(`⚠️ ${ticker}: Latest data is ${latestDate}, not ${TODAY}. Using available data.`);
      }

      // === SCORE 6 INDICATORS ===
      
      // 1. MA Trend
      const sma20 = sma(closes, 20);
      const sma50 = sma(closes, 50);
      const sma200 = sma(closes, 200);
      let maSignal = 'neutral';
      if (sma20 && sma50 && sma200) {
        if (sma20 > sma50 && sma50 > sma200) maSignal = 'bullish';
        else if (sma20 < sma50 && sma50 < sma200) maSignal = 'bearish';
      }
      insertScore.run(TODAY, ticker, 'ma_trend', maSignal, latestClose);

      // 2. RSI Reversion
      const rsi = computeRSI(closes);
      let rsiSignal = 'neutral';
      if (rsi !== null) {
        if (rsi < 35) rsiSignal = 'bullish';
        else if (rsi > 65) rsiSignal = 'bearish';
      }
      insertScore.run(TODAY, ticker, 'rsi_reversion', rsiSignal, rsi || 50);

      // 3. MACD Momentum
      const { histogram, prevHistogram } = computeMACD(closes);
      let macdSignal = 'neutral';
      if (histogram !== null && prevHistogram !== null) {
        if (histogram > 0 && histogram > prevHistogram) macdSignal = 'bullish';
        else if (histogram < 0 && histogram < prevHistogram) macdSignal = 'bearish';
      }
      insertScore.run(TODAY, ticker, 'macd_momentum', macdSignal, histogram || 0);

      // 4. Volume Confirm
      const vol20Avg = sma(volumes, 20);
      let volSignal = 'neutral';
      if (vol20Avg) {
        const priceUp = latestClose > prevClose;
        const highVol = latestVolume > vol20Avg;
        if (priceUp && highVol) volSignal = 'bullish';
        else if (priceUp && !highVol) volSignal = 'bearish';
        else if (!priceUp && highVol) volSignal = 'bearish';
      }
      insertScore.run(TODAY, ticker, 'volume_confirm', volSignal, latestVolume);

      // 5. SR Hold (near SMA50 or SMA200)
      let srSignal = 'neutral';
      if (sma50 && sma200) {
        const distSma50 = Math.abs(latestClose - sma50) / sma50;
        const distSma200 = Math.abs(latestClose - sma200) / sma200;
        if (distSma50 <= 0.02) {
          srSignal = latestClose >= sma50 ? 'bullish' : 'bearish';
        } else if (distSma200 <= 0.02) {
          srSignal = latestClose >= sma200 ? 'bullish' : 'bearish';
        }
      }
      insertScore.run(TODAY, ticker, 'sr_hold', srSignal, latestClose);

      // 6. Breakout (above 20-day high on volume)
      const last20Highs = data.slice(-21, -1).map(d => d.high);
      const high20 = Math.max(...last20Highs);
      let boSignal = 'neutral';
      if (vol20Avg && latestHigh > high20 && latestVolume > vol20Avg) {
        boSignal = 'bullish';
      }
      insertScore.run(TODAY, ticker, 'breakout', boSignal, latestHigh);

      // === COMPUTE ROLLING ACCURACIES ===
      const ma_acc = getAccuracy(ticker, 'ma_trend');
      const rsi_acc = getAccuracy(ticker, 'rsi_reversion');
      const macd_acc = getAccuracy(ticker, 'macd_momentum');
      const vol_acc = getAccuracy(ticker, 'volume_confirm');
      const sr_acc = getAccuracy(ticker, 'sr_hold');
      const bo_acc = getAccuracy(ticker, 'breakout');

      const trend_avg = (ma_acc + macd_acc + bo_acc) / 3;
      const meanrev_avg = (rsi_acc + sr_acc) / 2;

      // === DETERMINE REGIME ===
      let regime = 'mixed';
      if (trend_avg > 0.60 && meanrev_avg < 0.50) regime = 'trending';
      else if (trend_avg < 0.50 && meanrev_avg > 0.60) regime = 'chop';
      else if (trend_avg < 0.50 && meanrev_avg < 0.50) regime = 'transition';
      else if (trend_avg > 0.55 && meanrev_avg > 0.55) regime = 'goldilocks';

      insertRegime.run(TODAY, ticker, ma_acc, rsi_acc, macd_acc, vol_acc, sr_acc, bo_acc, trend_avg, meanrev_avg, regime);

      // === CHECK FOR REGIME CHANGE ===
      const prevRegime = getPrevRegime.get(ticker, TODAY);
      if (prevRegime && prevRegime.regime !== regime) {
        regimeChanges.push({ ticker, from: prevRegime.regime, to: regime });
      }

      results.push({
        ticker,
        ma_acc: ma_acc.toFixed(2),
        rsi_acc: rsi_acc.toFixed(2),
        macd_acc: macd_acc.toFixed(2),
        vol_acc: vol_acc.toFixed(2),
        sr_acc: sr_acc.toFixed(2),
        bo_acc: bo_acc.toFixed(2),
        trend_avg: trend_avg.toFixed(2),
        meanrev_avg: meanrev_avg.toFixed(2),
        regime
      });

    } catch (err) {
      console.error(`❌ ${ticker}: ${err.message}`);
      failures.push({ ticker, error: err.message });
    }
  }

  // === OUTPUT RESULTS ===
  console.log('\n' + '='.repeat(130));
  console.log('REGIME SCORING RESULTS');
  console.log('='.repeat(130));
  console.log(
    'Ticker'.padEnd(8) +
    'MA'.padEnd(6) +
    'RSI'.padEnd(6) +
    'MACD'.padEnd(6) +
    'Vol'.padEnd(6) +
    'S/R'.padEnd(6) +
    'BO'.padEnd(6) +
    'TrAvg'.padEnd(7) +
    'MRAvg'.padEnd(7) +
    'REGIME'
  );
  console.log('-'.repeat(130));
  
  for (const r of results) {
    const regimeEmoji = r.regime === 'trending' ? '🟢' : 
                        r.regime === 'chop' ? '🟡' : 
                        r.regime === 'transition' ? '⚠️' : 
                        r.regime === 'goldilocks' ? '🎯' : '⚪';
    console.log(
      r.ticker.padEnd(8) +
      r.ma_acc.padEnd(6) +
      r.rsi_acc.padEnd(6) +
      r.macd_acc.padEnd(6) +
      r.vol_acc.padEnd(6) +
      r.sr_acc.padEnd(6) +
      r.bo_acc.padEnd(6) +
      r.trend_avg.padEnd(7) +
      r.meanrev_avg.padEnd(7) +
      `${regimeEmoji} ${r.regime}`
    );
  }
  console.log('='.repeat(130));

  // === SUMMARY ===
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Tickers processed: ${results.length}`);
  console.log(`   Failures: ${failures.length > 0 ? failures.map(f => f.ticker).join(', ') : 'None'}`);
  
  if (regimeChanges.length > 0) {
    console.log(`\n🚨 REGIME CHANGES DETECTED (${regimeChanges.length}):`);
    for (const c of regimeChanges) {
      const emoji = c.to === 'trending' ? '🟢' : c.to === 'chop' ? '🟡' : c.to === 'transition' ? '⚠️' : c.to === 'goldilocks' ? '🎯' : '⚪';
      console.log(`   ${c.ticker}: ${c.from} → ${emoji} ${c.to}`);
    }
  } else {
    console.log(`\n✅ No regime changes detected.`);
  }

  // === TODAY'S REGIME TABLE ===
  console.log(`\n📋 TODAY'S REGIME TABLE (${TODAY}):`);
  const regimeCounts = {};
  for (const r of results) {
    regimeCounts[r.regime] = (regimeCounts[r.regime] || 0) + 1;
  }
  for (const [regime, count] of Object.entries(regimeCounts)) {
    const emoji = regime === 'trending' ? '🟢' : regime === 'chop' ? '🟡' : regime === 'transition' ? '⚠️' : regime === 'goldilocks' ? '🎯' : '⚪';
    console.log(`   ${emoji} ${regime}: ${count} ticker(s)`);
  }

  db.close();
  
  return { results, failures, regimeChanges };
}

main().catch(console.error);
