import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import Database from 'better-sqlite3';

const db = new Database('portfolio/data/portfolio.db');
const TICKERS = ['ALAB', 'NVT', 'FN', 'CRDO', 'COHR', 'PWR', 'TSEM', 'ANET'];

// Get current date (latest trading day) and 5 trading days ago
const today = '2026-02-17';  // Latest trading day from the scoring
console.log('Scoring outcomes for signals from 5 trading days ago...');

for (const ticker of TICKERS) {
  try {
    // Get price data for the last 20 days to find 5 trading days ago
    const endDate = new Date('2026-02-18');
    const startDate = new Date('2026-01-20');  // Go back far enough
    
    const data = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
    });

    if (!data || data.length < 10) {
      console.log(`${ticker}: Insufficient data`);
      continue;
    }

    // Sort by date ascending
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find today's close and the close from 5 trading days ago
    const latestIdx = data.length - 1;
    const todayClose = data[latestIdx].close;
    const fiveDaysAgoIdx = Math.max(0, latestIdx - 5);
    const fiveDaysAgoClose = data[fiveDaysAgoIdx].close;
    const fiveDaysAgoDate = data[fiveDaysAgoIdx].date.toISOString().split('T')[0];
    
    console.log(`${ticker}: 5 days ago (${fiveDaysAgoDate}): $${fiveDaysAgoClose.toFixed(2)}, today: $${todayClose.toFixed(2)}`);
    
    // Determine actual direction over the 5-day period
    const actualDirection = todayClose > fiveDaysAgoClose ? 'bullish' : 'bearish';
    
    // Query signals from 5 trading days ago
    const signals = db.prepare(`
      SELECT indicator, signal_direction FROM indicator_scores 
      WHERE ticker = ? AND date = ?
    `).all(ticker, fiveDaysAgoDate);

    if (signals.length === 0) {
      console.log(`  No signals found for ${fiveDaysAgoDate}`);
      continue;
    }

    // Score each signal
    const updateOutcome = db.prepare(`
      UPDATE indicator_scores 
      SET outcome = ?, outcome_date = ?
      WHERE ticker = ? AND date = ? AND indicator = ?
    `);

    for (const signal of signals) {
      let outcome = 0;
      
      if (signal.signal_direction === 'neutral') {
        // Neutral signals get 0.5 (neither right nor wrong)
        outcome = 0.5;
      } else {
        // Directional signals: 1 if correct, 0 if wrong
        outcome = signal.signal_direction === actualDirection ? 1 : 0;
      }
      
      updateOutcome.run(outcome, today, ticker, fiveDaysAgoDate, signal.indicator);
      console.log(`  ${signal.indicator}: predicted ${signal.signal_direction}, actual ${actualDirection} → ${outcome}`);
    }
    
  } catch (err) {
    console.error(`Error processing ${ticker}:`, err.message);
  }
}

console.log('\nOutcome scoring complete!');
db.close();