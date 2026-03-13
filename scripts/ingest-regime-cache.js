const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { SMA, RSI, MACD } = require('technicalindicators');

const db = new Database('portfolio/data/portfolio.db');
const [,, cacheDir] = process.argv;
if (!cacheDir) {
  console.error('Usage: node ingest-regime-cache.js CACHE_DIR');
  process.exit(1);
}

const FUTURE_DAYS = 5;
const ACCURACY_WINDOW = 20;

function getInd(indArr, offset, i) {
  if (i < offset || i - offset >= indArr.length) return null;
  return indArr[i - offset];
}
function avgLast(values, period = 20) {
  if (values.length < period) return 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + (b || 0), 0) / period;
}
function updatePendingOutcomes(ticker, dates, closes) {
  const pending = db.prepare(`SELECT * FROM indicator_scores WHERE ticker = ? AND outcome IS NULL ORDER BY date`).all(ticker);
  const updateStmt = db.prepare(`UPDATE indicator_scores SET outcome = ?, outcome_date = ? WHERE id = ?`);
  let updated = 0;
  for (const row of pending) {
    const entryIdx = dates.indexOf(row.date);
    if (entryIdx === -1) continue;
    const targetIdx = entryIdx + FUTURE_DAYS;
    if (targetIdx >= closes.length) continue;
    const entryClose = closes[entryIdx];
    const futureClose = closes[targetIdx];
    let outcome = null;
    if (row.signal_direction === 'bullish') outcome = futureClose > entryClose ? 1 : 0;
    else if (row.signal_direction === 'bearish') outcome = futureClose < entryClose ? 1 : 0;
    if (outcome != null) {
      updateStmt.run(outcome, dates[targetIdx], row.id);
      updated++;
    }
  }
  return updated;
}
function computeAccuracies(ticker) {
  const indicators = ['ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'];
  const accuracies = {};
  for (const ind of indicators) {
    const rows = db.prepare(`SELECT outcome FROM indicator_scores WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL ORDER BY date DESC LIMIT ?`).all(ticker, ind, ACCURACY_WINDOW);
    accuracies[ind] = rows.length ? rows.filter(r => r.outcome === 1).length / rows.length : 0.5;
  }
  return accuracies;
}
function classifyRegime(accuracies) {
  const trend_avg = (accuracies.ma_trend + accuracies.macd_momentum + accuracies.breakout) / 3;
  const meanrev_avg = (accuracies.rsi_reversion + accuracies.sr_hold + (1 - accuracies.breakout)) / 3;
  let regime = 'mixed';
  if (trend_avg > 0.60 && meanrev_avg < 0.50) regime = 'trending';
  else if (trend_avg < 0.50 && meanrev_avg > 0.60) regime = 'chop';
  else if (trend_avg < 0.50 && meanrev_avg < 0.50) regime = 'transition';
  else if (trend_avg > 0.55 && meanrev_avg > 0.55) regime = 'goldilocks';
  return { trend_avg, meanrev_avg, regime };
}

const insertSignal = db.prepare(`INSERT OR REPLACE INTO indicator_scores (date, ticker, indicator, signal_direction, signal_value, outcome) VALUES (?, ?, ?, ?, ?, NULL)`);
const insertRegime = db.prepare(`INSERT OR REPLACE INTO regime_summary (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json')).sort();
const results = [];
const failures = [];
for (const file of files) {
  try {
    const { ticker, quotes } = JSON.parse(fs.readFileSync(path.join(cacheDir, file), 'utf8'));
    if (!quotes || quotes.length < 200) throw new Error(`Insufficient data (${quotes ? quotes.length : 0})`);
    const closes = quotes.map(q => q.close);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    const volumes = quotes.map(q => q.volume);
    const dates = quotes.map(q => q.date);
    const sma20 = SMA.calculate({ period: 20, values: closes });
    const sma50 = SMA.calculate({ period: 50, values: closes });
    const sma200 = SMA.calculate({ period: 200, values: closes });
    const rsi = RSI.calculate({ period: 14, values: closes });
    const macd = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const i = closes.length - 1;
    const todayDate = dates[i];
    const s20 = getInd(sma20, 19, i);
    const s50 = getInd(sma50, 49, i);
    const s200 = getInd(sma200, 199, i);
    const rVal = getInd(rsi, 14, i);
    const mVal = getInd(macd, 25, i);
    const mPrev = getInd(macd, 25, i - 1);
    const vol = volumes[i];
    const avgVol = avgLast(volumes.slice(0, i + 1), 20);

    let ma_sig = 'neutral';
    if (s20 && s50 && s200) {
      if (s20 > s50 && s50 > s200) ma_sig = 'bullish';
      else if (s20 < s50 && s50 < s200) ma_sig = 'bearish';
    }
    let rsi_sig = 'neutral';
    if (rVal != null) {
      if (rVal < 35) rsi_sig = 'bullish';
      else if (rVal > 65) rsi_sig = 'bearish';
    }
    let macd_sig = 'neutral';
    if (mVal && mPrev) {
      if (mVal.histogram > 0 && mVal.histogram > mPrev.histogram) macd_sig = 'bullish';
      else if (mVal.histogram < 0 && mVal.histogram < mPrev.histogram) macd_sig = 'bearish';
    }
    let vol_sig = 'neutral';
    const priceChange = closes[i] - closes[i - 1];
    if (vol > avgVol) {
      if (priceChange > 0) vol_sig = 'bullish';
      else if (priceChange < 0) vol_sig = 'bearish';
    }
    let sr_sig = 'neutral';
    if (s50 && lows[i] <= s50 * 1.01 && lows[i] >= s50 * 0.99 && closes[i] > s50) sr_sig = 'bullish';
    if (s200 && lows[i] <= s200 * 1.01 && lows[i] >= s200 * 0.99 && closes[i] > s200) sr_sig = 'bullish';
    let bo_sig = 'neutral';
    const prevHighs = highs.slice(i - 20, i);
    const maxPrevHigh = Math.max(...prevHighs);
    if (closes[i] > maxPrevHigh && vol > avgVol) bo_sig = 'bullish';

    const prevRow = db.prepare("SELECT regime FROM regime_summary WHERE ticker = ? AND date < ? ORDER BY date DESC LIMIT 1").get(ticker, todayDate);
    const prevRegime = prevRow ? prevRow.regime : null;
    const updatedPending = updatePendingOutcomes(ticker, dates, closes);
    const indicators = [
      ['ma_trend', ma_sig, s20 || 0],
      ['rsi_reversion', rsi_sig, rVal || 0],
      ['macd_momentum', macd_sig, mVal ? mVal.histogram : 0],
      ['volume_confirm', vol_sig, vol],
      ['sr_hold', sr_sig, lows[i]],
      ['breakout', bo_sig, closes[i]]
    ];
    for (const [name, dir, val] of indicators) insertSignal.run(todayDate, ticker, name, dir, val);
    const accuracies = computeAccuracies(ticker);
    const { trend_avg, meanrev_avg, regime } = classifyRegime(accuracies);
    insertRegime.run(todayDate, ticker, accuracies.ma_trend, accuracies.rsi_reversion, accuracies.macd_momentum, accuracies.volume_confirm, accuracies.sr_hold, accuracies.breakout, trend_avg, meanrev_avg, regime);
    results.push({ ticker, date: todayDate, regime, prevRegime, changed: !!(prevRegime && prevRegime !== regime), trend_avg, meanrev_avg, updatedPending, rsi: rVal });
  } catch (e) {
    failures.push({ file, error: e.message });
  }
}
const changes = results.filter(r => r.changed).map(r => ({ ticker: r.ticker, from: r.prevRegime, to: r.regime }));
console.log(JSON.stringify({ processed: results.length, failures, changes, results: results.map(r => ({ ticker: r.ticker, date: r.date, regime: r.regime, prevRegime: r.prevRegime, trend_avg: Number(r.trend_avg.toFixed(4)), meanrev_avg: Number(r.meanrev_avg.toFixed(4)), updatedPending: r.updatedPending, rsi: r.rsi == null ? null : Number(r.rsi.toFixed(2)) })) }, null, 2));
db.close();
