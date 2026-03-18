const Database = require('better-sqlite3');
const YahooFinance = require('yahoo-finance2').default;
const { SMA, RSI, MACD } = require('technicalindicators');

const db = new Database('portfolio/data/portfolio.db');
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

const TICKERS = (process.env.TICKERS || 'PWR,TSEM,ANET,LITE,GLW,VRT')
  .split(',')
  .map(s => s.trim().toUpperCase())
  .filter(Boolean);

const FUTURE_DAYS = 5;
const REGIME_WINDOW_DAYS = 20;
const SUPPORT_TOLERANCE = 0.01; // 1%
const HOLD_TOLERANCE = 0.005;   // 0.5%

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function avg(values) {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getAligned(indicatorArray, periodOffset, i) {
  const idx = i - periodOffset;
  return idx >= 0 && idx < indicatorArray.length ? indicatorArray[idx] : null;
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function computeSignalsForIndex(i, quotes, series) {
  const { closes, highs, lows, volumes, sma20, sma50, sma200, rsi14, macd } = series;

  const close = closes[i];
  const prevClose = i > 0 ? closes[i - 1] : null;
  const high = highs[i];
  const low = lows[i];
  const volume = volumes[i];

  const s20 = getAligned(sma20, 19, i);
  const s50 = getAligned(sma50, 49, i);
  const s200 = getAligned(sma200, 199, i);
  const rsi = getAligned(rsi14, 14, i);
  const macdNow = getAligned(macd, 25, i);
  const macdPrev = getAligned(macd, 25, i - 1);

  const prev20Volumes = i >= 20 ? volumes.slice(i - 20, i) : [];
  const avgVol20 = avg(prev20Volumes);
  const prev20Highs = i >= 20 ? highs.slice(i - 20, i) : [];
  const resistance20 = prev20Highs.length ? Math.max(...prev20Highs) : null;

  const signals = [];

  // 1. MA Trend: stacked MAs imply continuation 5 days later
  let maDirection = 'neutral';
  if (s20 !== null && s50 !== null && s200 !== null) {
    if (s20 > s50 && s50 > s200) maDirection = 'bullish';
    else if (s20 < s50 && s50 < s200) maDirection = 'bearish';
  }
  signals.push({
    indicator: 'ma_trend',
    signal_direction: maDirection,
    signal_value: safeNumber(s20, close),
    meta: { entryClose: close }
  });

  // 2. RSI Reversion: oversold bounce / overbought pullback within 5 days
  let rsiDirection = 'neutral';
  if (rsi !== null) {
    if (rsi < 35) rsiDirection = 'bullish';
    else if (rsi > 65) rsiDirection = 'bearish';
  }
  signals.push({
    indicator: 'rsi_reversion',
    signal_direction: rsiDirection,
    signal_value: safeNumber(rsi, 50),
    meta: { entryClose: close }
  });

  // 3. MACD Momentum: histogram positive/rising or negative/falling
  let macdDirection = 'neutral';
  const histogram = macdNow ? macdNow.histogram : null;
  if (macdNow && macdPrev) {
    if (macdNow.histogram > 0 && macdNow.histogram > macdPrev.histogram) macdDirection = 'bullish';
    else if (macdNow.histogram < 0 && macdNow.histogram < macdPrev.histogram) macdDirection = 'bearish';
  }
  signals.push({
    indicator: 'macd_momentum',
    signal_direction: macdDirection,
    signal_value: safeNumber(histogram, 0),
    meta: { entryClose: close }
  });

  // 4. Volume Confirmation: above-average move should follow through; below-average move should fail
  let volumeDirection = 'neutral';
  if (avgVol20 !== null && prevClose !== null) {
    if (close > prevClose) volumeDirection = volume > avgVol20 ? 'bullish' : 'bearish';
    else if (close < prevClose) volumeDirection = volume > avgVol20 ? 'bearish' : 'bullish';
  }
  signals.push({
    indicator: 'volume_confirm',
    signal_direction: volumeDirection,
    signal_value: avgVol20 ? volume / avgVol20 : safeNumber(volume, 0),
    meta: { entryClose: close }
  });

  // 5. Support/Resistance Hold: approximate with MA50 / MA200 levels
  let srDirection = 'neutral';
  let srLevel = null;
  const srCandidates = [s50, s200]
    .filter(level => level !== null)
    .map(level => ({
      level,
      dist: Math.abs(close - level) / level,
      touched: (low <= level && high >= level) || (Math.abs(close - level) / level <= SUPPORT_TOLERANCE)
    }))
    .filter(c => c.touched)
    .sort((a, b) => a.dist - b.dist);

  if (srCandidates.length > 0) {
    srLevel = srCandidates[0].level;
    if (close > srLevel) srDirection = 'bullish';
    else if (close < srLevel) srDirection = 'bearish';
  }
  signals.push({
    indicator: 'sr_hold',
    signal_direction: srDirection,
    signal_value: safeNumber(srLevel, close),
    meta: { level: srLevel }
  });

  // 6. Breakout: close above prior 20-day resistance on above-average volume
  let breakoutDirection = 'neutral';
  if (resistance20 !== null && avgVol20 !== null && close > resistance20 && volume > avgVol20) {
    breakoutDirection = 'bullish';
  }
  signals.push({
    indicator: 'breakout',
    signal_direction: breakoutDirection,
    signal_value: safeNumber(resistance20, close),
    meta: { breakoutLevel: resistance20 }
  });

  return signals;
}

function scoreSignal(signal, i, quotes) {
  if (!signal || signal.signal_direction === 'neutral') return null;
  const futureIdx = i + FUTURE_DAYS;
  if (futureIdx >= quotes.length) return { outcome: null, outcome_date: null };

  const entry = quotes[i];
  const future = quotes[futureIdx];
  const futureWindow = quotes.slice(i + 1, futureIdx + 1);
  const futureCloses = futureWindow.map(q => q.close);
  const futureHighs = futureWindow.map(q => q.high);
  const futureLows = futureWindow.map(q => q.low);

  let outcome = null;

  switch (signal.indicator) {
    case 'ma_trend':
    case 'macd_momentum':
    case 'volume_confirm':
      outcome = signal.signal_direction === 'bullish'
        ? (future.close > entry.close ? 1 : 0)
        : (future.close < entry.close ? 1 : 0);
      break;

    case 'rsi_reversion':
      outcome = signal.signal_direction === 'bullish'
        ? (Math.max(...futureCloses) > entry.close ? 1 : 0)
        : (Math.min(...futureCloses) < entry.close ? 1 : 0);
      break;

    case 'sr_hold': {
      const level = signal.meta && Number.isFinite(signal.meta.level) ? signal.meta.level : null;
      if (!level) {
        outcome = null;
      } else if (signal.signal_direction === 'bullish') {
        outcome = Math.min(...futureLows) >= level * (1 - HOLD_TOLERANCE) ? 1 : 0;
      } else {
        outcome = Math.max(...futureHighs) <= level * (1 + HOLD_TOLERANCE) ? 1 : 0;
      }
      break;
    }

    case 'breakout': {
      const breakoutLevel = signal.meta && Number.isFinite(signal.meta.breakoutLevel) ? signal.meta.breakoutLevel : null;
      if (!breakoutLevel) {
        outcome = null;
      } else {
        outcome = future.close > breakoutLevel ? 1 : 0;
      }
      break;
    }

    default:
      outcome = null;
  }

  return { outcome, outcome_date: fmtDate(future.date) };
}

function classifyRegime(acc) {
  const trendAvg = (acc.ma_trend + acc.macd_momentum + acc.breakout) / 3;
  const meanrevAvg = (acc.rsi_reversion + acc.sr_hold + (1 - acc.breakout)) / 3;

  let regime = 'mixed';
  if (trendAvg > 0.60 && meanrevAvg < 0.50) regime = 'trending';
  else if (trendAvg < 0.50 && meanrevAvg > 0.60) regime = 'chop';
  else if (trendAvg < 0.50 && meanrevAvg < 0.50) regime = 'transition';
  else if (trendAvg > 0.55 && meanrevAvg > 0.55) regime = 'goldilocks';

  return { trendAvg, meanrevAvg, regime };
}

async function fetchQuotes(ticker) {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const result = await yahooFinance.chart(ticker, {
    interval: '1d',
    period1: fmtDate(startDate)
  });

  const quotes = (result.quotes || [])
    .filter(q => q && q.date && q.close != null && q.high != null && q.low != null && q.volume != null)
    .sort((a, b) => a.date - b.date);

  if (quotes.length < 205) {
    throw new Error(`insufficient history (${quotes.length} bars)`);
  }

  return quotes;
}

async function processTicker(ticker) {
  const quotes = await fetchQuotes(ticker);
  const dates = quotes.map(q => fmtDate(q.date));
  const closes = quotes.map(q => q.close);
  const highs = quotes.map(q => q.high);
  const lows = quotes.map(q => q.low);
  const volumes = quotes.map(q => q.volume);

  const sma20 = SMA.calculate({ period: 20, values: closes });
  const sma50 = SMA.calculate({ period: 50, values: closes });
  const sma200 = SMA.calculate({ period: 200, values: closes });
  const rsi14 = RSI.calculate({ period: 14, values: closes });
  const macd = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  const series = { closes, highs, lows, volumes, sma20, sma50, sma200, rsi14, macd };
  const startIndex = 199;

  const scoreRows = [];
  const rowsByDate = new Map();

  for (let i = startIndex; i < quotes.length; i++) {
    const date = dates[i];
    const signals = computeSignalsForIndex(i, quotes, series).map(signal => {
      const scored = scoreSignal(signal, i, quotes);
      return {
        date,
        ticker,
        indicator: signal.indicator,
        signal_direction: signal.signal_direction,
        signal_value: signal.signal_value,
        outcome: scored ? scored.outcome : null,
        outcome_date: scored ? scored.outcome_date : null
      };
    });

    rowsByDate.set(date, signals);
    scoreRows.push(...signals);
  }

  const insertScore = db.prepare(`
    INSERT OR REPLACE INTO indicator_scores
    (date, ticker, indicator, signal_direction, signal_value, outcome, outcome_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRegime = db.prepare(`
    INSERT OR REPLACE INTO regime_summary
    (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const writeTxn = db.transaction(() => {
    for (const row of scoreRows) {
      insertScore.run(
        row.date,
        row.ticker,
        row.indicator,
        row.signal_direction,
        row.signal_value,
        row.outcome,
        row.outcome_date
      );
    }
  });
  writeTxn();

  const indicatorNames = ['ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'];
  const regimeRows = [];

  for (let i = startIndex; i < dates.length; i++) {
    const windowStart = Math.max(startIndex, i - (REGIME_WINDOW_DAYS - 1));
    const windowDates = dates.slice(windowStart, i + 1);
    const windowRows = windowDates.flatMap(d => rowsByDate.get(d) || []);

    const acc = {};
    for (const indicator of indicatorNames) {
      const rows = windowRows.filter(r => r.indicator === indicator && r.outcome !== null);
      if (rows.length === 0) {
        acc[indicator] = 0.5;
      } else {
        const wins = rows.reduce((sum, r) => sum + (r.outcome === 1 ? 1 : 0), 0);
        acc[indicator] = wins / rows.length;
      }
    }

    const { trendAvg, meanrevAvg, regime } = classifyRegime(acc);
    const date = dates[i];
    regimeRows.push({
      date,
      ticker,
      ma_trend_acc: acc.ma_trend,
      rsi_reversion_acc: acc.rsi_reversion,
      macd_momentum_acc: acc.macd_momentum,
      volume_confirm_acc: acc.volume_confirm,
      sr_hold_acc: acc.sr_hold,
      breakout_acc: acc.breakout,
      trend_avg: trendAvg,
      meanrev_avg: meanrevAvg,
      regime
    });
  }

  const regimeTxn = db.transaction(() => {
    for (const row of regimeRows) {
      insertRegime.run(
        row.date,
        row.ticker,
        row.ma_trend_acc,
        row.rsi_reversion_acc,
        row.macd_momentum_acc,
        row.volume_confirm_acc,
        row.sr_hold_acc,
        row.breakout_acc,
        row.trend_avg,
        row.meanrev_avg,
        row.regime
      );
    }
  });
  regimeTxn();

  const today = regimeRows[regimeRows.length - 1];
  const yesterday = regimeRows[regimeRows.length - 2] || null;

  return {
    ticker,
    date: today.date,
    previous_date: yesterday ? yesterday.date : null,
    regime: today.regime,
    previous_regime: yesterday ? yesterday.regime : null,
    changed: yesterday ? today.regime !== yesterday.regime : false,
    trend_avg: Number(today.trend_avg.toFixed(4)),
    meanrev_avg: Number(today.meanrev_avg.toFixed(4)),
    accuracies: {
      ma_trend: Number(today.ma_trend_acc.toFixed(4)),
      rsi_reversion: Number(today.rsi_reversion_acc.toFixed(4)),
      macd_momentum: Number(today.macd_momentum_acc.toFixed(4)),
      volume_confirm: Number(today.volume_confirm_acc.toFixed(4)),
      sr_hold: Number(today.sr_hold_acc.toFixed(4)),
      breakout: Number(today.breakout_acc.toFixed(4))
    }
  };
}

(async () => {
  const results = [];
  for (const ticker of TICKERS) {
    try {
      const result = await processTicker(ticker);
      results.push(result);
    } catch (err) {
      results.push({ ticker, error: err.message });
    }
  }

  console.log(JSON.stringify(results, null, 2));
})();
