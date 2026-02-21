
const Database = require('better-sqlite3');
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF(); // Instantiate the class

const TI = require('technicalindicators');

// Configure DB
const dbPath = '/home/vamsi/tiger-trading/portfolio/data/portfolio.db';
const db = new Database(dbPath);

// Tickers
const TICKERS = ['ALAB', 'NVT', 'FN', 'CRDO', 'COHR', 'PWR', 'TSEM', 'ANET', 'LITE', 'GLW', 'VRT'];

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS indicator_scores (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    ticker TEXT NOT NULL,
    indicator TEXT NOT NULL,
    signal_direction TEXT,
    signal_value REAL,
    outcome INTEGER,
    outcome_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date, ticker, indicator)
  );
  
  CREATE TABLE IF NOT EXISTS regime_summary (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    ticker TEXT NOT NULL,
    ma_trend_acc REAL,
    rsi_reversion_acc REAL,
    macd_momentum_acc REAL,
    volume_confirm_acc REAL,
    sr_hold_acc REAL,
    breakout_acc REAL,
    trend_avg REAL,
    meanrev_avg REAL,
    regime TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date, ticker)
  );
`);

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function processTicker(ticker) {
  // console.log(`Processing ${ticker}...`); // reduce noise
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 400); 
  
  let quotes;
  try {
    quotes = await yahooFinance.historical(ticker, { period1: startDate, period2: endDate });
  } catch (e) {
    console.error(`Error fetching ${ticker}:`, e.message);
    return null;
  }
  
  if (!quotes || quotes.length < 200) {
    console.warn(`Not enough data for ${ticker}`);
    return null;
  }

  const closes = quotes.map(q => q.close);
  const highs = quotes.map(q => q.high);
  const volumes = quotes.map(q => q.volume);
  
  const sma20 = TI.SMA.calculate({ period: 20, values: closes });
  const sma50 = TI.SMA.calculate({ period: 50, values: closes });
  const sma200 = TI.SMA.calculate({ period: 200, values: closes });
  const rsi = TI.RSI.calculate({ period: 14, values: closes });
  const macd = TI.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
  const volSma20 = TI.SMA.calculate({ period: 20, values: volumes });

  const getVal = (arr, i, period) => {
    const idx = i - (period - 1);
    return (idx >= 0 && idx < arr.length) ? arr[idx] : null;
  };
  
  const getMACD = (i) => {
    const idx = i - 25; 
    return (idx >= 0 && idx < macd.length) ? macd[idx] : null;
  };

  const startIndex = Math.max(200, quotes.length - 35); // Look back 35 days to be safe
  
  for (let i = startIndex; i < quotes.length; i++) {
    const today = quotes[i];
    const dateStr = formatDate(today.date);
    const prev = quotes[i-1];
    
    const close = today.close;
    const vol = today.volume;
    const s20 = getVal(sma20, i, 20);
    const s50 = getVal(sma50, i, 50);
    const s200 = getVal(sma200, i, 200);
    const rVal = getVal(rsi, i, 14);
    const mVal = getMACD(i);
    const vAvg = getVal(volSma20, i, 20);
    
    const pastHighs = highs.slice(i-20, i);
    const resistance20 = Math.max(...pastHighs);
    
    const signals = {};
    
    // 1. MA Trend
    if (s20 && s50 && s200) {
      if (s20 > s50 && s50 > s200) {
        signals['ma_trend'] = { direction: 'bullish', value: s20, target: 'up' };
      }
    }
    
    // 2. RSI Reversion
    if (rVal) {
      if (rVal < 35) signals['rsi_reversion'] = { direction: 'bullish', value: rVal, target: 'up' };
      else if (rVal > 65) signals['rsi_reversion'] = { direction: 'bearish', value: rVal, target: 'down' };
    }
    
    // 3. MACD Momentum
    if (mVal) {
      const prevM = getMACD(i-1);
      if (prevM) {
        if (mVal.histogram > 0 && mVal.histogram > prevM.histogram) 
          signals['macd_momentum'] = { direction: 'bullish', value: mVal.histogram, target: 'up' };
        else if (mVal.histogram < 0 && mVal.histogram < prevM.histogram) 
          signals['macd_momentum'] = { direction: 'bearish', value: mVal.histogram, target: 'down' };
      }
    }
    
    // 4. Volume Confirm
    if (vAvg && prev) {
      if (close > prev.close) { 
        if (vol > vAvg) signals['volume_confirm'] = { direction: 'bullish', value: vol, target: 'up' };
        else signals['volume_confirm'] = { direction: 'bearish', value: vol, target: 'down' };
      }
    }
    
    // 5. SR Hold
    if (s50 && today.low <= s50 && today.high >= s50) {
       if (close > s50) signals['sr_hold'] = { direction: 'bullish', value: s50, target: 'hold_above', level: s50 };
       else signals['sr_hold'] = { direction: 'bearish', value: s50, target: 'hold_below', level: s50 };
    } else if (s200 && today.low <= s200 && today.high >= s200) {
       if (close > s200) signals['sr_hold'] = { direction: 'bullish', value: s200, target: 'hold_above', level: s200 };
       else signals['sr_hold'] = { direction: 'bearish', value: s200, target: 'hold_below', level: s200 };
    }
    
    // 6. Breakout
    if (vAvg && close > resistance20 && vol > vAvg) {
       signals['breakout'] = { direction: 'bullish', value: close, target: 'hold_above', level: resistance20 };
    }
    
    // Outcome
    const futureIdx = i + 5;
    const future = (futureIdx < quotes.length) ? quotes[futureIdx] : null;
    const outcomeDate = future ? formatDate(future.date) : null;
    
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO indicator_scores (date, ticker, indicator, signal_direction, signal_value, outcome, outcome_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const [key, sig] of Object.entries(signals)) {
      let outcome = null;
      if (future) {
        if (key === 'ma_trend') outcome = (future.close > close) ? 1 : 0;
        else if (key === 'rsi_reversion') outcome = ((sig.target === 'up' && future.close > close) || (sig.target === 'down' && future.close < close)) ? 1 : 0;
        else if (key === 'macd_momentum') outcome = ((sig.target === 'up' && future.close > close) || (sig.target === 'down' && future.close < close)) ? 1 : 0;
        else if (key === 'volume_confirm') outcome = ((sig.target === 'up' && future.close > close) || (sig.target === 'down' && future.close < close)) ? 1 : 0;
        else if (key === 'sr_hold') outcome = ((sig.target === 'hold_above' && future.close > sig.level) || (sig.target === 'hold_below' && future.close < sig.level)) ? 1 : 0;
        else if (key === 'breakout') outcome = (future.close > sig.level) ? 1 : 0;
      }
      insertStmt.run(dateStr, ticker, key, sig.direction, sig.value, outcome, outcomeDate);
    }
  }
  
  // Calculate Regime
  const indicators = ['ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'];
  const accScores = {};
  
  for (const ind of indicators) {
    const rows = db.prepare(`
      SELECT outcome FROM indicator_scores 
      WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL 
      ORDER BY date DESC LIMIT 20
    `).all(ticker, ind);
    
    accScores[ind] = (rows.length > 0) ? (rows.filter(r => r.outcome === 1).length / rows.length) : 0;
  }
  
  const trend_avg = (accScores['ma_trend'] + accScores['macd_momentum'] + accScores['breakout']) / 3;
  const meanrev_avg = (accScores['rsi_reversion'] + accScores['sr_hold']) / 2;
  
  let regime = 'Transition';
  if (trend_avg > 0.60 && meanrev_avg < 0.50) regime = 'Trending';
  else if (trend_avg < 0.50 && meanrev_avg > 0.60) regime = 'Chop';
  else if (trend_avg > 0.55 && meanrev_avg > 0.55) regime = 'Goldilocks';
  else if (trend_avg < 0.50 && meanrev_avg < 0.50) regime = 'Transition';
  else regime = 'Mixed';
  
  const todayDate = formatDate(quotes[quotes.length-1].date);
  
  db.prepare(`
    INSERT OR REPLACE INTO regime_summary 
    (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    todayDate, ticker, 
    accScores['ma_trend'], accScores['rsi_reversion'], accScores['macd_momentum'], 
    accScores['volume_confirm'], accScores['sr_hold'], accScores['breakout'],
    trend_avg, meanrev_avg, regime
  );
  
  const prevRow = db.prepare(`
    SELECT regime FROM regime_summary 
    WHERE ticker = ? AND date < ? 
    ORDER BY date DESC LIMIT 1
  `).get(ticker, todayDate);
  
  const prevRegime = prevRow ? prevRow.regime : 'New';
  
  return {
    ticker,
    regime,
    prevRegime,
    trend_avg: (trend_avg * 100).toFixed(1) + '%',
    meanrev_avg: (meanrev_avg * 100).toFixed(1) + '%',
    change: (regime !== prevRegime) ? `${prevRegime} -> ${regime}` : null
  };
}

async function main() {
  const summary = [];
  for (const t of TICKERS) {
    const res = await processTicker(t);
    if (res) summary.push(res);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(console.error);
