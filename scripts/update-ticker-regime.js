const Database = require('better-sqlite3');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { SMA, RSI, MACD } = require('technicalindicators');

const db = new Database('portfolio/data/portfolio.db');

// --- Configuration ---
const FUTURE_DAYS = 5; 
const ACCURACY_WINDOW = 20; 

// --- Helper Functions ---

function calculateSMA(values, period) {
  return SMA.calculate({ period, values });
}

function calculateRSI(values, period = 14) {
  return RSI.calculate({ period, values });
}

function calculateMACD(values) {
  return MACD.calculate({
    values,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
}

function getAvgVolume(volumes, period = 20) {
  if (volumes.length < period) return 0;
  const slice = volumes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

async function processTicker(ticker) {
  console.log(`Processing ${ticker}...`);
  
  // 1. Fetch Data
  let result;
  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years back
    
    // chart() returns { meta, quotes }
    result = await yahooFinance.chart(ticker, { 
        interval: '1d', 
        period1: startDate.toISOString().split('T')[0]
    });
  } catch (e) {
    console.error(`Error fetching data for ${ticker}: ${e.message}`);
    return null;
  }

  if (!result || !result.quotes || result.quotes.length < 200) {
    console.warn(`Insufficient data for ${ticker}`);
    return null;
  }

  const quotes = result.quotes.filter(q => q.close !== null && q.close !== undefined);
  const closes = quotes.map(r => r.close);
  const highs = quotes.map(r => r.high);
  const lows = quotes.map(r => r.low);
  const volumes = quotes.map(r => r.volume);
  // yahoo-finance2 chart returns Date objects
  const dates = quotes.map(r => r.date.toISOString().split('T')[0]);

  // Calculate Indicators
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);

  // Helper to align
  const getInd = (indArr, offset, i) => {
    if (i < offset || i - offset >= indArr.length) return null;
    return indArr[i - offset];
  };

  const lastIdx = closes.length - 1;
  const todayDate = dates[lastIdx];
  
  console.log(`  Latest date for ${ticker}: ${todayDate}`);

  // --- Step 1: Score Past Signals ---
  const pending = db.prepare(`
    SELECT * FROM indicator_scores 
    WHERE ticker = ? AND outcome IS NULL AND date <= date(?, '-${FUTURE_DAYS} days')
  `).all(ticker, todayDate);

  const updateStmt = db.prepare(`
    UPDATE indicator_scores 
    SET outcome = ?, outcome_date = ? 
    WHERE id = ?
  `);

  let updatedCount = 0;
  for (const row of pending) {
    const entryIdx = dates.indexOf(row.date);
    if (entryIdx === -1) continue; 

    const targetIdx = entryIdx + FUTURE_DAYS;
    if (targetIdx > lastIdx) continue; // Waiting for future

    const futureClose = closes[targetIdx];
    const entryClose = closes[entryIdx];
    
    let outcome = null;
    if (row.signal_direction === 'bullish') {
      outcome = futureClose > entryClose ? 1 : 0;
    } else if (row.signal_direction === 'bearish') {
      outcome = futureClose < entryClose ? 1 : 0;
    }

    if (outcome !== null) {
        updateStmt.run(outcome, dates[targetIdx], row.id);
        updatedCount++;
    }
  }
  if (updatedCount > 0) console.log(`  Updated ${updatedCount} past signals.`);

  // --- Step 2: Generate Today's Signals ---
  const existingToday = db.prepare('SELECT count(*) as c FROM indicator_scores WHERE ticker = ? AND date = ?').get(ticker, todayDate);
  
  if (existingToday.c === 0) {
    const i = lastIdx;
    
    const s20 = getInd(sma20, 19, i);
    const s50 = getInd(sma50, 49, i);
    const s200 = getInd(sma200, 199, i);
    const rVal = getInd(rsi, 14, i);
    const mVal = getInd(macd, 25, i); 
    const mPrev = getInd(macd, 25, i-1);
    
    const vol = volumes[i];
    const avgVol = getAvgVolume(volumes.slice(0, i+1), 20);
    
    // 1. MA Trend
    let ma_sig = 'neutral';
    if (s20 && s50 && s200) {
      if (s20 > s50 && s50 > s200) ma_sig = 'bullish';
      else if (s20 < s50 && s50 < s200) ma_sig = 'bearish';
    }

    // 2. RSI Reversion
    let rsi_sig = 'neutral';
    if (rVal) {
      if (rVal < 35) rsi_sig = 'bullish'; 
      else if (rVal > 65) rsi_sig = 'bearish'; 
    }

    // 3. MACD Momentum
    let macd_sig = 'neutral';
    if (mVal && mPrev) {
      if (mVal.histogram > 0 && mVal.histogram > mPrev.histogram) macd_sig = 'bullish';
      else if (mVal.histogram < 0 && mVal.histogram < mPrev.histogram) macd_sig = 'bearish';
    }

    // 4. Volume Confirm
    let vol_sig = 'neutral';
    const priceChange = closes[i] - closes[i-1];
    if (vol > avgVol) {
      if (priceChange > 0) vol_sig = 'bullish';
      else if (priceChange < 0) vol_sig = 'bearish';
    }

    // 5. SR Hold
    let sr_sig = 'neutral';
    if (s50 && lows[i] <= s50 * 1.01 && lows[i] >= s50 * 0.99 && closes[i] > s50) sr_sig = 'bullish';
    if (s200 && lows[i] <= s200 * 1.01 && lows[i] >= s200 * 0.99 && closes[i] > s200) sr_sig = 'bullish';

    // 6. Breakout
    let bo_sig = 'neutral';
    const prevHighs = highs.slice(i-20, i);
    const maxPrevHigh = Math.max(...prevHighs);
    if (closes[i] > maxPrevHigh && vol > avgVol) bo_sig = 'bullish';
    
    const insertSignal = db.prepare(`
      INSERT OR IGNORE INTO indicator_scores (date, ticker, indicator, signal_direction, signal_value, outcome)
      VALUES (?, ?, ?, ?, ?, NULL)
    `);

    const signals = [
      { name: 'ma_trend', dir: ma_sig, val: s20 || 0 },
      { name: 'rsi_reversion', dir: rsi_sig, val: rVal || 0 },
      { name: 'macd_momentum', dir: macd_sig, val: mVal ? mVal.histogram : 0 },
      { name: 'volume_confirm', dir: vol_sig, val: vol },
      { name: 'sr_hold', dir: sr_sig, val: lows[i] },
      { name: 'breakout', dir: bo_sig, val: closes[i] }
    ];

    const txn = db.transaction((sigs) => {
        for (const s of sigs) {
          insertSignal.run(todayDate, ticker, s.name, s.dir, s.val);
        }
    });
    txn(signals);
    console.log(`  Generated signals for ${todayDate}.`);
  } else {
    console.log(`  Signals already exist for ${todayDate}.`);
  }

  // --- Step 3: Update Regime ---
  const indicators = ['ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'];
  let accuracies = {};
  
  for (const ind of indicators) {
    const rows = db.prepare(`
      SELECT outcome FROM indicator_scores
      WHERE ticker = ? AND indicator = ? AND outcome IS NOT NULL
      ORDER BY date DESC
      LIMIT ?
    `).all(ticker, ind, ACCURACY_WINDOW);
    
    if (rows.length === 0) {
      accuracies[ind] = 0.5; 
    } else {
      const correct = rows.filter(r => r.outcome === 1).length;
      accuracies[ind] = correct / rows.length;
    }
  }

  // (rsi + sr + (1 - breakout)) / 3 (Assuming Breakout Failure = Mean Reversion success)
  const trend_avg = (accuracies['ma_trend'] + accuracies['macd_momentum'] + accuracies['breakout']) / 3;
  const meanrev_avg_calc = (accuracies['rsi_reversion'] + accuracies['sr_hold'] + (1 - accuracies['breakout'])) / 3;

  let regime = 'mixed';
  if (trend_avg > 0.60 && meanrev_avg_calc < 0.50) regime = 'trending';
  else if (trend_avg < 0.50 && meanrev_avg_calc > 0.60) regime = 'chop';
  else if (trend_avg < 0.50 && meanrev_avg_calc < 0.50) regime = 'transition';
  else if (trend_avg > 0.55 && meanrev_avg_calc > 0.55) regime = 'goldilocks';

  const insertRegime = db.prepare(`
    INSERT OR REPLACE INTO regime_summary 
    (date, ticker, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc, trend_avg, meanrev_avg, regime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRegime.run(
    todayDate, ticker,
    accuracies['ma_trend'], accuracies['rsi_reversion'], accuracies['macd_momentum'],
    accuracies['volume_confirm'], accuracies['sr_hold'], accuracies['breakout'],
    trend_avg, meanrev_avg_calc, regime
  );

  return { ticker, regime, trend_avg, meanrev_avg_calc };
}

(async () => {
  try {
    const tickers = db.prepare("SELECT ticker FROM thesis WHERE status IN ('active', 'weakened')").all().map(r => r.ticker);
    
    if (tickers.length === 0) {
      console.log('No active tickers found.');
      return;
    }

    console.log(`Found ${tickers.length} tickers: ${tickers.join(', ')}`);
    
    const results = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (const ticker of tickers) {
        // Get strict previous regime (not today)
        const prevRegimeRow = db.prepare("SELECT regime FROM regime_summary WHERE ticker = ? AND date < ? ORDER BY date DESC LIMIT 1").get(ticker, today);
        const res = await processTicker(ticker);
        
        if (res) {
            results.push({
                ticker: res.ticker,
                regime: res.regime,
                trend_avg: res.trend_avg,
                meanrev_avg_calc: res.meanrev_avg_calc,
                prevRegime: prevRegimeRow ? prevRegimeRow.regime : 'none'
            });
        }
    }

    console.log('\n--- Regime Changes ---');
    let changes = 0;
    for (const r of results) {
        if (r.regime !== r.prevRegime) {
            console.log(`${r.ticker}: ${r.prevRegime} -> ${r.regime}`);
            changes++;
        }
    }
    if (changes === 0) console.log('No regime changes detected.');

    // Print full table for debug/report
    console.log('\n--- Current Regimes ---');
    console.table(results.map(r => ({
        Ticker: r.ticker,
        Regime: r.regime,
        TrendAcc: r.trend_avg.toFixed(2),
        MeanRevAcc: r.meanrev_avg_calc.toFixed(2)
    })));

  } catch (err) {
    console.error('Fatal error:', err);
  }
})();
