#!/usr/bin/env node
// Update macro regime - fetches latest market data and scores monetary/sentiment regime
// Run daily before the 11 AM proforma

const Database = require('better-sqlite3');
const path = require('path');

async function main() {
  // yahoo-finance2 v3 requires constructor
  const { default: YahooFinance } = await import('yahoo-finance2');
  const yf = new YahooFinance();

  const db = new Database(path.join(__dirname, '..', 'portfolio', 'data', 'portfolio.db'));

  // Symbols we need
  const symbols = ['SPY', 'TLT', 'IWM', 'HYG', 'LQD', 'XLK', 'XLP', 'XLU', 'GLD', 'DX-Y.NYB', '^TNX', '^VIX'];

  console.log('Fetching market data...');
  const quotes = {};
  for (const sym of symbols) {
    try {
      const q = await yf.quote(sym);
      quotes[sym] = q.regularMarketPrice || q.regularMarketPreviousClose;
      console.log(`  ${sym}: ${quotes[sym]}`);
    } catch (e) {
      console.error(`  ${sym}: FAILED - ${e.message}`);
    }
  }

  const spy = quotes['SPY'];
  const tlt = quotes['TLT'];
  const iwm = quotes['IWM'];
  const hyg = quotes['HYG'];
  const lqd = quotes['LQD'];
  const xlk = quotes['XLK'];
  const xlp = quotes['XLP'];
  const xlu = quotes['XLU'];
  const gld = quotes['GLD'];
  const dxy = quotes['DX-Y.NYB'];
  const tnx = quotes['^TNX'];
  const vix = quotes['^VIX'];

  if (!spy || !tlt || !xlk) {
    console.error('Missing critical data, aborting');
    process.exit(1);
  }

  // Calculate ratios
  const iwm_spy = iwm / spy;
  const xlk_xlu = xlk / xlu;
  const xlk_xlp = xlk / xlp;
  const hyg_lqd = hyg / lqd;
  const gld_spy = gld / spy;

  // --- MONETARY SCORING ---
  // Get 20-day lookback for trend detection
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 30);
  const prevRows = db.prepare(`
    SELECT tnx_yield, dxy_price, hyg_lqd_ratio FROM macro_regime
    WHERE date >= ? ORDER BY date ASC
  `).all(twentyDaysAgo.toISOString().split('T')[0]);

  let monetary_score = 0;

  // 10Y yield direction (falling = loose, rising = tight)
  if (prevRows.length >= 5) {
    const oldYield = prevRows[0].tnx_yield;
    if (tnx < oldYield * 0.98) monetary_score += 0.5;   // yields falling >2%
    else if (tnx < oldYield) monetary_score += 0.25;      // yields falling slightly
    else if (tnx > oldYield * 1.02) monetary_score -= 0.5; // yields rising >2%
    else if (tnx > oldYield) monetary_score -= 0.25;
  }

  // DXY direction (falling = loose)
  if (prevRows.length >= 5) {
    const oldDxy = prevRows[0].dxy_price;
    if (dxy < oldDxy * 0.98) monetary_score += 0.5;
    else if (dxy < oldDxy) monetary_score += 0.25;
    else if (dxy > oldDxy * 1.02) monetary_score -= 0.5;
    else if (dxy > oldDxy) monetary_score -= 0.25;
  }

  // HYG/LQD spread (high = risk appetite, low = stress)
  if (prevRows.length >= 5) {
    const oldSpread = prevRows[0].hyg_lqd_ratio;
    if (hyg_lqd > oldSpread) monetary_score += 0.25;
    else if (hyg_lqd < oldSpread * 0.99) monetary_score -= 0.25;
  }

  // --- SENTIMENT SCORING ---
  let sentiment_score = 0;

  // VIX level
  if (vix < 15) sentiment_score += 0.4;
  else if (vix < 20) sentiment_score += 0.2;
  else if (vix > 25) sentiment_score -= 0.4;
  else if (vix > 20) sentiment_score -= 0.2;

  // XLK vs XLP (tech vs staples — risk-on vs risk-off)
  if (prevRows.length >= 5) {
    const recentXlkXlp = xlk_xlp;
    // If tech outperforming staples → risk-on
    if (recentXlkXlp > 1.6) sentiment_score += 0.2;
    else if (recentXlkXlp < 1.5) sentiment_score -= 0.2;
  }

  // IWM/SPY (small caps leading = risk-on)
  if (iwm_spy > 0.39) sentiment_score += 0.2;
  else if (iwm_spy < 0.37) sentiment_score -= 0.2;

  // GLD/SPY (gold outperforming = risk-off)
  if (gld_spy > 0.7) sentiment_score -= 0.2;
  else if (gld_spy < 0.6) sentiment_score += 0.2;

  // Classify regimes
  const monetary_regime = monetary_score > 0.25 ? 'loose' : monetary_score < -0.25 ? 'tight' : 'neutral';
  const sentiment_regime = sentiment_score > 0.2 ? 'risk-on' : sentiment_score < -0.2 ? 'risk-off' : 'neutral';

  // Combined macro regime
  let macro_regime;
  if (monetary_regime === 'tight' && sentiment_regime === 'risk-off') macro_regime = 'bearish';
  else if (monetary_regime === 'tight' && sentiment_regime === 'risk-on') macro_regime = 'cautious';
  else if (monetary_regime === 'loose' && sentiment_regime === 'risk-on') macro_regime = 'bullish';
  else if (monetary_regime === 'loose' && sentiment_regime === 'risk-off') macro_regime = 'cautious';
  else macro_regime = 'neutral';

  // Today's date
  const today = new Date().toISOString().split('T')[0];

  // Check if already have today's entry
  const existing = db.prepare('SELECT id FROM macro_regime WHERE date = ?').get(today);

  if (existing) {
    db.prepare(`UPDATE macro_regime SET
      spy_price=?, tlt_price=?, iwm_price=?, hyg_price=?, lqd_price=?,
      xlk_price=?, xlp_price=?, xlu_price=?, gld_price=?, dxy_price=?,
      tnx_yield=?, vix_price=?,
      iwm_spy_ratio=?, xlk_xlu_ratio=?, xlk_xlp_ratio=?, hyg_lqd_ratio=?, gld_spy_ratio=?,
      monetary_score=?, sentiment_score=?, monetary_regime=?, sentiment_regime=?, macro_regime=?,
      created_at=datetime('now')
      WHERE date=?`).run(
      spy, tlt, iwm, hyg, lqd, xlk, xlp, xlu, gld, dxy, tnx, vix,
      iwm_spy, xlk_xlu, xlk_xlp, hyg_lqd, gld_spy,
      monetary_score, sentiment_score, monetary_regime, sentiment_regime, macro_regime,
      today
    );
    console.log(`\nUpdated macro regime for ${today}`);
  } else {
    db.prepare(`INSERT INTO macro_regime (date, spy_price, tlt_price, iwm_price, hyg_price, lqd_price,
      xlk_price, xlp_price, xlu_price, gld_price, dxy_price, tnx_yield, vix_price,
      iwm_spy_ratio, xlk_xlu_ratio, xlk_xlp_ratio, hyg_lqd_ratio, gld_spy_ratio,
      monetary_score, sentiment_score, monetary_regime, sentiment_regime, macro_regime)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      today, spy, tlt, iwm, hyg, lqd, xlk, xlp, xlu, gld, dxy, tnx, vix,
      iwm_spy, xlk_xlu, xlk_xlp, hyg_lqd, gld_spy,
      monetary_score, sentiment_score, monetary_regime, sentiment_regime, macro_regime
    );
    console.log(`\nInserted macro regime for ${today}`);
  }

  console.log(`\nMACRO REGIME: ${macro_regime.toUpperCase()}`);
  console.log(`  Monetary: ${monetary_regime} (${monetary_score >= 0 ? '+' : ''}${monetary_score.toFixed(2)})`);
  console.log(`  Sentiment: ${sentiment_regime} (${sentiment_score >= 0 ? '+' : ''}${sentiment_score.toFixed(2)})`);
  console.log(`  VIX: ${vix} | 10Y: ${tnx} | DXY: ${dxy}`);

  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
