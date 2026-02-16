#!/usr/bin/env node
// Export regime data from DB to JSON for portal consumption
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'portfolio', 'data', 'portfolio.db'));

const regimes = db.prepare(`
  SELECT ticker, regime, trend_avg, meanrev_avg, 
         ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, 
         volume_confirm_acc, sr_hold_acc, breakout_acc, date
  FROM regime_summary 
  WHERE date = (SELECT MAX(date) FROM regime_summary) 
  ORDER BY ticker
`).all();

// Round floats for cleaner display
const clean = regimes.map(r => ({
  ticker: r.ticker,
  regime: r.regime,
  date: r.date,
  trend_avg: r.trend_avg ? Math.round(r.trend_avg * 100) : null,
  meanrev_avg: r.meanrev_avg ? Math.round(r.meanrev_avg * 100) : null,
  indicators: {
    ma_trend: r.ma_trend_acc ? Math.round(r.ma_trend_acc * 100) : null,
    rsi_reversion: r.rsi_reversion_acc ? Math.round(r.rsi_reversion_acc * 100) : null,
    macd_momentum: r.macd_momentum_acc ? Math.round(r.macd_momentum_acc * 100) : null,
    volume_confirm: r.volume_confirm_acc ? Math.round(r.volume_confirm_acc * 100) : null,
    sr_hold: r.sr_hold_acc ? Math.round(r.sr_hold_acc * 100) : null,
    breakout: r.breakout_acc ? Math.round(r.breakout_acc * 100) : null,
  }
}));

// Macro regime data
const macro = db.prepare(`
  SELECT date, monetary_regime, sentiment_regime, macro_regime,
         monetary_score, sentiment_score, vix_price, tnx_yield,
         spy_price, xlk_price, xlp_price, xlu_price, gld_price, iwm_price
  FROM macro_regime ORDER BY date DESC LIMIT 20
`).all();

const latestMacro = macro[0] || {};
const macroHistory = macro.reverse().map(m => ({
  date: m.date,
  monetary: m.monetary_regime,
  sentiment: m.sentiment_regime,
  macro: m.macro_regime,
  vix: m.vix_price ? Math.round(m.vix_price * 10) / 10 : null,
  tnx: m.tnx_yield ? Math.round(m.tnx_yield * 100) / 100 : null,
}));

const output = {
  updated: new Date().toISOString(),
  regimes: clean,
  macro: {
    current: {
      date: latestMacro.date,
      monetary: latestMacro.monetary_regime,
      sentiment: latestMacro.sentiment_regime,
      regime: latestMacro.macro_regime,
      monetary_score: latestMacro.monetary_score ? Math.round(latestMacro.monetary_score * 100) : 0,
      sentiment_score: latestMacro.sentiment_score ? Math.round(latestMacro.sentiment_score * 100) : 0,
      vix: latestMacro.vix_price ? Math.round(latestMacro.vix_price * 10) / 10 : null,
      tnx: latestMacro.tnx_yield ? Math.round(latestMacro.tnx_yield * 100) / 100 : null,
    },
    history: macroHistory,
  }
};

const outPath = path.join(__dirname, '..', 'research', 'aiportfolio', 'data', 'regime.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log('Exported regime data for', clean.length, 'tickers to', outPath);

db.close();
