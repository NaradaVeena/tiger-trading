import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import Database from 'better-sqlite3';

const db = new Database('portfolio/data/portfolio.db');
const TICKERS = ['ALAB', 'NVT', 'FN', 'CRDO', 'COHR', 'PWR', 'TSEM', 'ANET'];

// Helper: compute SMA
function sma(arr, period) {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Helper: compute RSI
function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Helper: compute MACD histogram
function computeMACD(closes) {
  // EMA helper
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
  INSERT OR REPLACE INTO indicator_scores (date, ticker, indicator, signal_direction, signal_value, outcome, outcome_date)
  VALUES (?, ?, ?, ?, ?, NULL, NULL)
`);

const insertRegime = db.prepare(`
  INSERT OR REPLACE INTO regime_summary (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const results = [];

for (const ticker of TICKERS) {
  try {
    // Fetch ~250 trading days for SMA200
    const endDate = new Date('2026-02-18');
    const startDate = new Date('2025-02-01');
    
    const data = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
    });

    if (!data || data.length === 0) {
      console.error(`No data for ${ticker}`);
      continue;
    }

    // Sort by date ascending
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const dates = data.map(d => d.date);
    
    // Use most recent trading day
    const latestIdx = data.length - 1;
    const latestDate = dates[latestIdx];
    const dateStr = latestDate.toISOString().split('T')[0];
    const latestClose = closes[latestIdx];
    const prevClose = closes[latestIdx - 1];
    const latestVolume = volumes[latestIdx];

    console.log(`\n${ticker}: Using date ${dateStr}, close=${latestClose.toFixed(2)}`);

    const signals = {};

    // 1. MA Trend
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    let maTrend = 'neutral';
    let maTrendVal = 0;
    if (sma20 && sma50 && sma200) {
      if (sma20 > sma50 && sma50 > sma200) { maTrend = 'bullish'; maTrendVal = 1; }
      else if (sma20 < sma50 && sma50 < sma200) { maTrend = 'bearish'; maTrendVal = -1; }
      console.log(`  MA: SMA20=${sma20.toFixed(2)} SMA50=${sma50.toFixed(2)} SMA200=${sma200.toFixed(2)} → ${maTrend}`);
    } else {
      console.log(`  MA: insufficient data for SMAs → neutral`);
    }
    signals.ma_trend = maTrend;
    insertScore.run(dateStr, ticker, 'ma_trend', maTrend, maTrendVal);

    // 2. RSI Reversion
    const rsi = computeRSI(closes);
    let rsiSignal = 'neutral', rsiVal = rsi || 50;
    if (rsi !== null) {
      if (rsi < 35) { rsiSignal = 'bullish'; }
      else if (rsi > 65) { rsiSignal = 'bearish'; }
      console.log(`  RSI: ${rsi.toFixed(2)} → ${rsiSignal}`);
    }
    signals.rsi_reversion = rsiSignal;
    insertScore.run(dateStr, ticker, 'rsi_reversion', rsiSignal, rsiVal);

    // 3. MACD Momentum
    const { histogram, prevHistogram } = computeMACD(closes);
    let macdSignal = 'neutral', macdVal = histogram || 0;
    if (histogram !== null && prevHistogram !== null) {
      if (histogram > 0 && histogram > prevHistogram) { macdSignal = 'bullish'; }
      else if (histogram < 0 && histogram < prevHistogram) { macdSignal = 'bearish'; }
      console.log(`  MACD hist: ${histogram.toFixed(4)} prev: ${prevHistogram.toFixed(4)} → ${macdSignal}`);
    }
    signals.macd_momentum = macdSignal;
    insertScore.run(dateStr, ticker, 'macd_momentum', macdSignal, macdVal);

    // 4. Volume Confirm
    const vol20Avg = sma(volumes, 20);
    let volSignal = 'neutral', volVal = 0;
    if (vol20Avg) {
      const priceUp = latestClose > prevClose;
      const highVol = latestVolume > vol20Avg;
      volVal = latestVolume / vol20Avg;
      if (priceUp && highVol) { volSignal = 'bullish'; }
      else if (priceUp && !highVol) { volSignal = 'bearish'; }
      else if (!priceUp && highVol) { volSignal = 'bearish'; }
      else { volSignal = 'neutral'; }
      console.log(`  Volume: ${latestVolume.toLocaleString()} vs avg ${Math.round(vol20Avg).toLocaleString()} (${(volVal).toFixed(2)}x), price ${priceUp ? 'up' : 'down'} → ${volSignal}`);
    }
    signals.volume_confirm = volSignal;
    insertScore.run(dateStr, ticker, 'volume_confirm', volSignal, volVal);

    // 5. SR Hold
    let srSignal = 'neutral', srVal = 0;
    if (sma50 && sma200) {
      const distSma50 = Math.abs(latestClose - sma50) / sma50;
      const distSma200 = Math.abs(latestClose - sma200) / sma200;
      srVal = Math.min(distSma50, distSma200);
      if (distSma50 <= 0.02) {
        srSignal = latestClose >= sma50 ? 'bullish' : 'bearish';
        console.log(`  SR: within ${(distSma50 * 100).toFixed(1)}% of SMA50 → ${srSignal}`);
      } else if (distSma200 <= 0.02) {
        srSignal = latestClose >= sma200 ? 'bullish' : 'bearish';
        console.log(`  SR: within ${(distSma200 * 100).toFixed(1)}% of SMA200 → ${srSignal}`);
      } else {
        console.log(`  SR: not near support (SMA50 dist=${(distSma50*100).toFixed(1)}%, SMA200 dist=${(distSma200*100).toFixed(1)}%) → neutral`);
      }
    }
    signals.sr_hold = srSignal;
    insertScore.run(dateStr, ticker, 'sr_hold', srSignal, srVal);

    // 6. Breakout
    const last20Highs = data.slice(-21, -1).map(d => d.high);
    const high20 = Math.max(...last20Highs);
    let boSignal = 'neutral', boVal = 0;
    if (vol20Avg) {
      boVal = data[latestIdx].high / high20;
      if (data[latestIdx].high > high20 && latestVolume > vol20Avg) {
        boSignal = 'bullish';
      }
      console.log(`  Breakout: high=${data[latestIdx].high.toFixed(2)} vs 20d high=${high20.toFixed(2)}, vol ${latestVolume > vol20Avg ? 'above' : 'below'} avg → ${boSignal}`);
    }
    signals.breakout = boSignal;
    insertScore.run(dateStr, ticker, 'breakout', boSignal, boVal);

    // Regime summary - query last 20 outcomes per indicator
    const indicators = ['ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'];
    const accMap = {};
    for (const ind of indicators) {
      const rows = db.prepare(`
        SELECT outcome FROM indicator_scores 
        WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL
        ORDER BY date DESC LIMIT 20
      `).all(ticker, ind);
      if (rows.length > 0) {
        accMap[ind] = rows.reduce((s, r) => s + r.outcome, 0) / rows.length;
      } else {
        accMap[ind] = 0.5; // default when no history
      }
    }

    const trendAvg = (accMap.ma_trend + accMap.macd_momentum + accMap.breakout) / 3;
    const meanrevAvg = (accMap.rsi_reversion + accMap.sr_hold) / 2;

    let regime;
    if (trendAvg > 0.60 && meanrevAvg < 0.50) regime = 'trending';
    else if (trendAvg < 0.50 && meanrevAvg > 0.60) regime = 'chop';
    else if (trendAvg < 0.50 && meanrevAvg < 0.50) regime = 'transition';
    else if (trendAvg > 0.55 && meanrevAvg > 0.55) regime = 'goldilocks';
    else regime = 'mixed';

    insertRegime.run(dateStr, ticker, accMap.ma_trend, accMap.rsi_reversion, accMap.macd_momentum, accMap.volume_confirm, accMap.sr_hold, accMap.breakout, trendAvg, meanrevAvg, regime);

    results.push({ ticker, date: dateStr, ...signals, regime, trendAvg: trendAvg.toFixed(2), meanrevAvg: meanrevAvg.toFixed(2) });

  } catch (err) {
    console.error(`Error processing ${ticker}:`, err.message);
  }
}

// Print summary table
console.log('\n' + '='.repeat(120));
console.log('REGIME INDICATOR SCORING SUMMARY');
console.log('='.repeat(120));
console.log(
  'Ticker'.padEnd(8) +
  'Date'.padEnd(13) +
  'MA Trend'.padEnd(11) +
  'RSI'.padEnd(11) +
  'MACD'.padEnd(11) +
  'Volume'.padEnd(11) +
  'SR Hold'.padEnd(11) +
  'Breakout'.padEnd(11) +
  'TrAvg'.padEnd(7) +
  'MRAvg'.padEnd(7) +
  'Regime'
);
console.log('-'.repeat(120));
for (const r of results) {
  console.log(
    r.ticker.padEnd(8) +
    r.date.padEnd(13) +
    r.ma_trend.padEnd(11) +
    r.rsi_reversion.padEnd(11) +
    r.macd_momentum.padEnd(11) +
    r.volume_confirm.padEnd(11) +
    r.sr_hold.padEnd(11) +
    r.breakout.padEnd(11) +
    r.trendAvg.padEnd(7) +
    r.meanrevAvg.padEnd(7) +
    r.regime
  );
}
console.log('='.repeat(120));

db.close();
