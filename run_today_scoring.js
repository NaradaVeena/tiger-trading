const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'portfolio/data/portfolio.db'));
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const todayStr = '2026-02-23';

// 1. Get active tickers from DB
const tickersRaw = db.prepare("SELECT ticker FROM thesis WHERE status IN ('active','weakened')").all();
const TICKERS = tickersRaw.map(t => t.ticker);
console.log(`Scoring tickers: ${TICKERS.join(', ')}`);

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
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = [];
  for (let i = 0; i < ema12.length; i++) {
    if (i >= 25) macdLine.push(ema12[i] - ema26[i]);
    else macdLine.push(null);
  }
  const validMacd = macdLine.filter(x => x !== null);
  const signalLine = ema(validMacd, 9);
  const macdHist = validMacd[validMacd.length - 1] - signalLine[signalLine.length - 1];
  return macdHist;
}

const insertScore = db.prepare(`
  INSERT OR REPLACE INTO indicator_scores 
  (date, ticker, indicator, signal_direction, signal_value)
  VALUES (?, ?, ?, ?, ?)
`);

const insertRegime = db.prepare(`
  INSERT OR REPLACE INTO regime_summary
  (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const prevRegimeStmt = db.prepare(`SELECT regime FROM regime_summary WHERE ticker = ? AND date < ? ORDER BY date DESC LIMIT 1`);

async function main() {
  let regimeChanges = [];

  for (const ticker of TICKERS) {
    const endDate = new Date('2026-02-24'); // exclusive
    const startDate = new Date('2025-01-01');
    let data;
    try {
      data = await yahooFinance.historical(ticker, { period1: startDate, period2: endDate });
    } catch (e) {
      console.log(`Error fetching ${ticker}`, e.message);
      continue;
    }
    if (!data || data.length < 200) {
      console.log(`Not enough data for ${ticker}`);
      continue;
    }

    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const rsi = computeRSI(closes, 14);
    const macd = computeMACD(closes);
    
    const lastClose = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2];
    const lastVol = volumes[volumes.length - 1];
    const avgVol = sma(volumes, 20);

    // 1. MA Trend
    let maSignal = 'neutral';
    if (lastClose > sma20 && sma20 > sma50 && sma50 > sma200) maSignal = 'bullish';
    else if (lastClose < sma20 && sma20 < sma50 && sma50 < sma200) maSignal = 'bearish';
    insertScore.run(todayStr, ticker, 'ma_trend', maSignal, lastClose);

    // 2. RSI Reversion
    let rsiSignal = 'neutral';
    if (rsi < 35) rsiSignal = 'bullish';
    else if (rsi > 65) rsiSignal = 'bearish';
    insertScore.run(todayStr, ticker, 'rsi_reversion', rsiSignal, rsi);

    // 3. MACD Momentum
    let macdSignal = 'neutral';
    if (macd > 0) macdSignal = 'bullish';
    else if (macd < 0) macdSignal = 'bearish';
    insertScore.run(todayStr, ticker, 'macd_momentum', macdSignal, macd);

    // 4. Volume Confirm
    let volSignal = 'neutral';
    if (lastClose > prevClose && lastVol > avgVol) volSignal = 'bullish';
    else if (lastClose < prevClose && lastVol > avgVol) volSignal = 'bearish';
    insertScore.run(todayStr, ticker, 'volume_confirm', volSignal, lastVol);

    // 5 & 6. SR Hold & Breakout (using neutral for today)
    insertScore.run(todayStr, ticker, 'sr_hold', 'neutral', lastClose);
    insertScore.run(todayStr, ticker, 'breakout', 'neutral', lastClose);

    const getAcc = (ind) => {
        const rows = db.prepare(`SELECT outcome FROM indicator_scores WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL ORDER BY date DESC LIMIT 20`).all(ticker, ind);
        if (rows.length === 0) return 0.5;
        const correct = rows.filter(r => r.outcome === 1).length;
        return correct / rows.length;
    };

    const ma_acc = getAcc('ma_trend');
    const rsi_acc = getAcc('rsi_reversion');
    const macd_acc = getAcc('macd_momentum');
    const vol_acc = getAcc('volume_confirm');
    const sr_acc = getAcc('sr_hold');
    const bo_acc = getAcc('breakout');

    const trend_avg = (ma_acc + macd_acc + bo_acc) / 3;
    const meanrev_avg = (rsi_acc + sr_acc + (1 - bo_acc)) / 3;

    let regime = 'Mixed';
    if (trend_avg > 0.6 && meanrev_avg < 0.5) regime = 'Trending ✅';
    else if (trend_avg < 0.5 && meanrev_avg > 0.6) regime = 'Chop 🔄';
    else if (trend_avg < 0.5 && meanrev_avg < 0.5) regime = 'Transition ⚠️';
    else if (trend_avg > 0.55 && meanrev_avg > 0.55) regime = 'Goldilocks 🎯';
    
    insertRegime.run(todayStr, ticker, ma_acc, rsi_acc, macd_acc, vol_acc, sr_acc, bo_acc, trend_avg, meanrev_avg, regime);

    const prev = prevRegimeStmt.get(ticker, todayStr);
    if (prev && prev.regime !== regime) {
      regimeChanges.push(`${ticker}: ${prev.regime} -> ${regime}`);
    }
  }

  console.log("Regime updates complete.");
  if (regimeChanges.length > 0) {
    console.log("CHANGES DETECTED:");
    console.log(regimeChanges.join('\n'));
  } else {
    console.log("No regime changes detected.");
  }
}

main().catch(console.error);
