#!/usr/bin/env node
/**
 * Score regime indicators for a single ticker
 * Usage: node scripts/score-regime-ticker.js TICKER
 */

const yf = require('yahoo-finance2');
const Database = require('better-sqlite3');
const path = require('path');

const TICKER = process.argv[2];
if (!TICKER) {
  console.error('Usage: node scripts/score-regime-ticker.js TICKER');
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'portfolio', 'data', 'portfolio.db');
const db = new Database(dbPath);

const TODAY = new Date().toISOString().split('T')[0];

async function getHistoricalData(symbol, days = 30) {
  try {
    const quote = await yf.quote(symbol);
    const chart = await yf.chart(symbol, {
      period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      interval: '1d'
    });
    return { quote, chart };
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err.message);
    return null;
  }
}

function computeSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function computeMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) return null;
  
  // Simplified MACD: EMA(fast) - EMA(slow)
  const ema = (data, period) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };
  
  const fastEma = ema(prices, fast);
  const slowEma = ema(prices, slow);
  return fastEma - slowEma;
}

function computeAvgVolume(volumes, period = 20) {
  if (volumes.length < period) return null;
  const slice = volumes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

async function scoreTicker(ticker) {
  console.log(`\n=== Scoring ${ticker} ===`);
  
  const data = await getHistoricalData(ticker, 30);
  if (!data || !data.chart || data.chart.length < 25) {
    console.log(`Insufficient data for ${ticker}`);
    return null;
  }
  
  const closes = data.chart.map(d => d.close);
  const volumes = data.chart.map(d => d.volume);
  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2];
  const currentVol = volumes[volumes.length - 1];
  
  // Compute indicators
  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const sma200 = computeSMA(closes, 200);
  const rsi = computeRSI(closes);
  const macd = computeMACD(closes);
  const avgVol = computeAvgVolume(volumes);
  
  console.log(`Price: $${currentPrice.toFixed(2)} (${((currentPrice - prevPrice) / prevPrice * 100).toFixed(2)}%)`);
  console.log(`SMA20: ${sma20?.toFixed(2)}, SMA50: ${sma50?.toFixed(2)}, SMA200: ${sma200?.toFixed(2)}`);
  console.log(`RSI: ${rsi?.toFixed(2)}, MACD: ${macd?.toFixed(4)}, AvgVol: ${avgVol?.toLocaleString()}`);
  
  // Score indicators (simplified - outcome will be scored 5 days later)
  const scores = [];
  
  // 1. MA Trend Signal
  const maBullish = sma20 > sma50 && sma50 > sma200;
  const maDirection = maBullish ? 'bullish' : (sma20 < sma50 && sma50 < sma200 ? 'bearish' : 'neutral');
  scores.push({
    indicator: 'ma_trend',
    signal_direction: maDirection,
    signal_value: maBullish ? 1 : 0
  });
  
  // 2. RSI Mean-Reversion Signal
  let rsiDirection = 'neutral';
  if (rsi < 35) rsiDirection = 'bullish';
  else if (rsi > 65) rsiDirection = 'bearish';
  scores.push({
    indicator: 'rsi_reversion',
    signal_direction: rsiDirection,
    signal_value: rsi || 50
  });
  
  // 3. MACD Momentum Signal
  const macdDirection = macd > 0 ? 'bullish' : (macd < 0 ? 'bearish' : 'neutral');
  scores.push({
    indicator: 'macd_momentum',
    signal_direction: macdDirection,
    signal_value: macd || 0
  });
  
  // 4. Volume Confirmation Signal
  const volRatio = currentVol / avgVol;
  const priceUp = currentPrice > prevPrice;
  let volDirection = 'neutral';
  if (priceUp && volRatio > 1.2) volDirection = 'bullish';
  else if (!priceUp && volRatio > 1.2) volDirection = 'bearish';
  else if (priceUp && volRatio < 0.8) volDirection = 'bearish';
  else if (!priceUp && volRatio < 0.8) volDirection = 'bullish';
  scores.push({
    indicator: 'volume_confirm',
    signal_direction: volDirection,
    signal_value: volRatio
  });
  
  // 5. S/R Hold Signal (simplified - check if near SMA20)
  const distFromSMA20 = Math.abs(currentPrice - sma20) / sma20;
  const srDirection = distFromSMA20 < 0.03 ? (priceUp ? 'bullish' : 'bearish') : 'neutral';
  scores.push({
    indicator: 'sr_hold',
    signal_direction: srDirection,
    signal_value: distFromSMA20
  });
  
  // 6. Breakout Signal (check if breaking above recent high)
  const recentHigh = Math.max(...closes.slice(-10));
  const breakoutDirection = currentPrice >= recentHigh ? 'bullish' : 'neutral';
  scores.push({
    indicator: 'breakout',
    signal_direction: breakoutDirection,
    signal_value: currentPrice / recentHigh
  });
  
  // Insert into DB
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO indicator_scores 
    (date, ticker, indicator, signal_direction, signal_value, outcome, outcome_date)
    VALUES (?, ?, ?, ?, ?, NULL, NULL)
  `);
  
  const insertMany = db.transaction((ticker, scores) => {
    for (const s of scores) {
      insertStmt.run(TODAY, ticker, s.indicator, s.signal_direction, s.signal_value);
    }
  });
  
  insertMany(ticker, scores);
  console.log(`✅ Inserted ${scores.length} indicator scores for ${ticker}`);
  
  return { ticker, scores, currentPrice };
}

scoreTicker(TICKER).catch(console.error);
