#!/usr/bin/env node

const Database = require('better-sqlite3');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'portfolio.db');
const db = new Database(dbPath);

// Helper functions
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  return (value * 100).toFixed(2) + '%';
}

const TZ = 'America/New_York';

function getCurrentDateTime() {
  const now = new Date();
  return `${now.toLocaleDateString('en-CA', { timeZone: TZ })} ${now.toLocaleTimeString('en-US', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function getCurrentDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('en-US', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function getQuote(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      price: quote.regularMarketPrice,
      ask: quote.ask || quote.regularMarketPrice,
      bid: quote.bid || quote.regularMarketPrice
    };
  } catch (error) {
    console.error(`❌ Failed to get quote for ${ticker}:`, error.message);
    return null;
  }
}

// Database helpers
function getConfig(key) {
  const stmt = db.prepare('SELECT value FROM config WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

function setConfig(key, value) {
  const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}

// Commands
async function status() {
  console.log('🐯 Tiger Portfolio Status\n');
  
  const startingCapital = parseFloat(getConfig('starting_capital'));
  const cash = parseFloat(getConfig('cash'));
  const portfolioName = getConfig('portfolio_name');
  
  // Get all open positions
  const positions = db.prepare(`
    SELECT * FROM positions WHERE status = 'open'
  `).all();
  
  let totalInvested = 0;
  positions.forEach(pos => {
    totalInvested += pos.market_value || 0;
  });
  
  const totalValue = cash + totalInvested;
  const totalPnL = totalValue - startingCapital;
  const totalPnLPct = totalPnL / startingCapital;
  
  console.log(`Portfolio: ${portfolioName}`);
  console.log(`Starting Capital: ${formatCurrency(startingCapital)}`);
  console.log(`Current Value: ${formatCurrency(totalValue)} (${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}, ${formatPercent(totalPnLPct)})`);
  console.log(`Cash: ${formatCurrency(cash)}`);
  console.log(`Invested: ${formatCurrency(totalInvested)}`);
  console.log(`Positions: ${positions.length}`);
  console.log(`Portfolio Heat: ${formatPercent(totalInvested / totalValue)}`);
  
  // Show benchmark comparison
  const benchmarkTicker = getConfig('benchmark_ticker');
  const benchmarkInceptionPrice = parseFloat(getConfig('benchmark_inception_price') || '0');
  if (benchmarkTicker && benchmarkInceptionPrice > 0) {
    const latestBenchmark = db.prepare('SELECT * FROM benchmark WHERE ticker = ? ORDER BY date DESC LIMIT 1').get(benchmarkTicker);
    if (latestBenchmark) {
      const alpha = totalPnLPct - latestBenchmark.return_pct;
      console.log(`\nBenchmark: ${benchmarkTicker} ${formatCurrency(latestBenchmark.price)} (${latestBenchmark.return_pct >= 0 ? '+' : ''}${formatPercent(latestBenchmark.return_pct)})`);
      console.log(`Alpha: ${alpha >= 0 ? '+' : ''}${formatPercent(alpha)}`);
    }
  }
  console.log('');
  
  if (positions.length > 0) {
    console.log('Current Positions:');
    console.table(positions.map(pos => ({
      Ticker: pos.ticker,
      Type: pos.type,
      Shares: pos.shares,
      'Avg Cost': formatCurrency(pos.avg_cost),
      'Current Price': formatCurrency(pos.current_price),
      'Market Value': formatCurrency(pos.market_value),
      'P&L': formatCurrency(pos.unrealized_pnl),
      'P&L %': formatPercent(pos.unrealized_pnl_pct)
    })));
  }
}

async function addProforma(action, ticker, type, quantity, price, reasoning) {
  const total = quantity * price;
  
  const stmt = db.prepare(`
    INSERT INTO trades (date, time, ticker, action, type, quantity, price, total, status, reasoning, proforma_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proforma', ?, ?, ?)
  `);
  
  const tradeId = stmt.run(
    getCurrentDate(),
    getCurrentTime(),
    ticker,
    action,
    type,
    quantity,
    price,
    total,
    reasoning,
    price,
    getCurrentDateTime()
  ).lastInsertRowid;
  
  console.log(`✅ Proforma trade added (ID: ${tradeId})`);
  console.log(`${action.toUpperCase()} ${quantity} ${ticker} ${type} @ ${formatCurrency(price)} = ${formatCurrency(total)}`);
  console.log(`Reasoning: ${reasoning}`);
}

function listProformas() {
  const proformas = db.prepare(`
    SELECT * FROM trades WHERE status = 'proforma' ORDER BY created_at DESC
  `).all();
  
  if (proformas.length === 0) {
    console.log('No pending proforma trades');
    return;
  }
  
  console.log('Pending Proforma Trades:\n');
  console.table(proformas.map(trade => ({
    ID: trade.id,
    Date: trade.date,
    Time: trade.time,
    Ticker: trade.ticker,
    Action: trade.action.toUpperCase(),
    Type: trade.type,
    Quantity: trade.quantity,
    Price: formatCurrency(trade.price),
    Total: formatCurrency(trade.total),
    Reasoning: trade.reasoning
  })));
}

async function lockTrade(tradeId, lockPrice = null) {
  const trade = db.prepare("SELECT * FROM trades WHERE id = ? AND status = 'proforma'").get(tradeId);
  
  if (!trade) {
    console.log(`❌ Proforma trade ${tradeId} not found`);
    return;
  }
  
  let finalPrice = lockPrice;
  if (!lockPrice) {
    console.log(`Getting current market price for ${trade.ticker}...`);
    const quote = await getQuote(trade.ticker);
    if (!quote) {
      console.log('❌ Failed to get market price');
      return;
    }
    // Use ask for buys, bid for sells (worst case scenario)
    finalPrice = trade.action === 'buy' ? quote.ask : quote.bid;
  }
  
  const finalTotal = trade.quantity * finalPrice;
  
  // Update trade status
  const stmt = db.prepare(`
    UPDATE trades SET status = 'locked', locked_price = ?, total = ?, locked_at = ?
    WHERE id = ?
  `);
  
  stmt.run(finalPrice, finalTotal, getCurrentDateTime(), tradeId);
  
  // Update cash and positions
  const cash = parseFloat(getConfig('cash'));
  
  if (trade.action === 'buy') {
    const newCash = cash - finalTotal;
    setConfig('cash', newCash.toString());
    
    // Update or create position
    updatePosition(trade.ticker, trade.type, trade.quantity, finalPrice, trade.action);
  } else {
    const newCash = cash + finalTotal;
    setConfig('cash', newCash.toString());
    
    // Update position
    updatePosition(trade.ticker, trade.type, -trade.quantity, finalPrice, trade.action);
  }
  
  console.log(`✅ Trade ${tradeId} locked at ${formatCurrency(finalPrice)}`);
  console.log(`${trade.action.toUpperCase()} ${trade.quantity} ${trade.ticker} ${trade.type}`);
  console.log(`Proforma: ${formatCurrency(trade.proforma_price)} → Locked: ${formatCurrency(finalPrice)}`);
  console.log(`Total: ${formatCurrency(finalTotal)}`);
}

async function lockAllTrades() {
  const proformas = db.prepare("SELECT * FROM trades WHERE status = 'proforma'").all();
  
  if (proformas.length === 0) {
    console.log('No proforma trades to lock');
    return;
  }
  
  console.log(`Locking ${proformas.length} proforma trades...`);
  
  for (const trade of proformas) {
    console.log(`\nLocking trade ${trade.id}: ${trade.action} ${trade.quantity} ${trade.ticker}`);
    await lockTrade(trade.id);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All proforma trades locked');
}

function cancelTrade(tradeId) {
  const result = db.prepare(`
    UPDATE trades SET status = 'cancelled' WHERE id = ? AND status = 'proforma'
  `).run(tradeId);
  
  if (result.changes === 0) {
    console.log(`❌ Proforma trade ${tradeId} not found`);
  } else {
    console.log(`✅ Proforma trade ${tradeId} cancelled`);
  }
}

function updatePosition(ticker, type, quantity, price, action) {
  const existing = db.prepare(`
    SELECT * FROM positions WHERE ticker = ? AND type = ? AND status = 'open'
  `).get(ticker, type);
  
  if (existing) {
    let newShares, newAvgCost;
    
    if (action === 'buy') {
      newShares = existing.shares + quantity;
      newAvgCost = ((existing.shares * existing.avg_cost) + (quantity * price)) / newShares;
    } else {
      newShares = existing.shares - quantity;
      newAvgCost = existing.avg_cost; // Keep same avg cost on sells
    }
    
    if (newShares <= 0) {
      // Close position
      db.prepare('UPDATE positions SET status = "closed" WHERE id = ?').run(existing.id);
    } else {
      // Update position
      db.prepare(`
        UPDATE positions SET shares = ?, avg_cost = ?, last_updated = ?
        WHERE id = ?
      `).run(newShares, newAvgCost, getCurrentDateTime(), existing.id);
    }
  } else if (action === 'buy') {
    // Create new position
    db.prepare(`
      INSERT INTO positions (ticker, type, shares, avg_cost, first_entry, last_updated, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `).run(ticker, type, quantity, price, getCurrentDate(), getCurrentDateTime());
  }
}

function addJournalEntry(entry, category = null, ticker = null) {
  const stmt = db.prepare(`
    INSERT INTO journal (date, time, category, ticker, entry, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(getCurrentDate(), getCurrentTime(), category, ticker, entry, getCurrentDateTime());
  console.log('✅ Journal entry added');
}

function updateThesis(ticker, status = null, update = null) {
  const existing = db.prepare('SELECT * FROM thesis WHERE ticker = ?').get(ticker);
  
  if (!existing) {
    console.log(`❌ No thesis found for ${ticker}`);
    return;
  }
  
  let newThesis = existing.thesis;
  if (update) {
    newThesis = update;
  }
  
  const stmt = db.prepare(`
    UPDATE thesis SET thesis = ?, status = ?, updated_at = ?
    WHERE ticker = ?
  `);
  
  stmt.run(newThesis, status || existing.status, getCurrentDateTime(), ticker);
  console.log(`✅ Thesis updated for ${ticker}`);
}

async function refreshPrices() {
  const positions = db.prepare("SELECT * FROM positions WHERE status = 'open'").all();
  
  if (positions.length === 0) {
    console.log('No open positions to refresh');
    return;
  }
  
  console.log('Refreshing prices for all positions...');
  
  for (const position of positions) {
    console.log(`Getting price for ${position.ticker}...`);
    const quote = await getQuote(position.ticker);
    
    if (quote) {
      const marketValue = position.shares * quote.price;
      const unrealizedPnL = marketValue - (position.shares * position.avg_cost);
      const unrealizedPnLPct = unrealizedPnL / (position.shares * position.avg_cost);
      
      db.prepare(`
        UPDATE positions SET 
          current_price = ?,
          market_value = ?,
          unrealized_pnl = ?,
          unrealized_pnl_pct = ?,
          last_updated = ?
        WHERE id = ?
      `).run(quote.price, marketValue, unrealizedPnL, unrealizedPnLPct, getCurrentDateTime(), position.id);
      
      console.log(`✅ ${position.ticker}: ${formatCurrency(quote.price)}`);
    } else {
      console.log(`❌ Failed to update ${position.ticker}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ All prices refreshed');
}

async function generateHTML() {
  console.log('🎨 Generating HTML dashboard...');
  
  const htmlGenerator = require('./html-generator.js');
  await htmlGenerator.generate();
  
  console.log('✅ HTML dashboard generated at /home/vamsi/.openclaw/workspace/research/aiportfolio/index.html');
}

function showHistory(ticker = null) {
  let query = "SELECT * FROM trades WHERE status != 'proforma' ORDER BY date DESC, time DESC";
  let params = [];
  
  if (ticker) {
    query = "SELECT * FROM trades WHERE ticker = ? AND status != 'proforma' ORDER BY date DESC, time DESC";
    params = [ticker];
  }
  
  const trades = db.prepare(query).all(...params);
  
  if (trades.length === 0) {
    console.log(ticker ? `No trade history for ${ticker}` : 'No trade history');
    return;
  }
  
  console.log(ticker ? `Trade History for ${ticker}:` : 'Trade History:');
  console.table(trades.map(trade => ({
    ID: trade.id,
    Date: trade.date,
    Time: trade.time,
    Ticker: trade.ticker,
    Action: trade.action.toUpperCase(),
    Type: trade.type,
    Quantity: trade.quantity,
    'Proforma Price': formatCurrency(trade.proforma_price || trade.price),
    'Locked Price': formatCurrency(trade.locked_price || trade.price),
    Total: formatCurrency(trade.total),
    Status: trade.status.toUpperCase(),
    Reasoning: trade.reasoning
  })));
}

function showPnL() {
  const positions = db.prepare("SELECT * FROM positions WHERE status = 'open'").all();
  const startingCapital = parseFloat(getConfig('starting_capital'));
  const cash = parseFloat(getConfig('cash'));
  
  let totalUnrealizedPnL = 0;
  let totalInvested = 0;
  
  positions.forEach(pos => {
    totalUnrealizedPnL += pos.unrealized_pnl || 0;
    totalInvested += pos.market_value || 0;
  });
  
  const totalValue = cash + totalInvested;
  const totalPnL = totalValue - startingCapital;
  
  console.log('💰 Portfolio P&L Summary\n');
  console.log(`Starting Capital: ${formatCurrency(startingCapital)}`);
  console.log(`Current Value: ${formatCurrency(totalValue)}`);
  console.log(`Total P&L: ${formatCurrency(totalPnL)} (${formatPercent(totalPnL / startingCapital)})`);
  console.log(`Unrealized P&L: ${formatCurrency(totalUnrealizedPnL)}`);
  console.log(`Cash: ${formatCurrency(cash)}\n`);
  
  if (positions.length > 0) {
    console.log('Position P&L:');
    console.table(positions.map(pos => ({
      Ticker: pos.ticker,
      Shares: pos.shares,
      'Avg Cost': formatCurrency(pos.avg_cost),
      'Current Price': formatCurrency(pos.current_price),
      'Market Value': formatCurrency(pos.market_value),
      'Unrealized P&L': formatCurrency(pos.unrealized_pnl),
      'Unrealized %': formatPercent(pos.unrealized_pnl_pct)
    })));
  }
}

async function takeSnapshot() {
  const positions = db.prepare("SELECT * FROM positions WHERE status = 'open'").all();
  const cash = parseFloat(getConfig('cash'));
  const startingCapital = parseFloat(getConfig('starting_capital'));
  const benchmarkInceptionPrice = parseFloat(getConfig('benchmark_inception_price') || '0');
  const benchmarkTicker = getConfig('benchmark_ticker') || 'SMH';
  
  let totalInvested = 0;
  let totalUnrealizedPnL = 0;
  
  positions.forEach(pos => {
    totalInvested += pos.market_value || 0;
    totalUnrealizedPnL += pos.unrealized_pnl || 0;
  });
  
  const totalValue = cash + totalInvested;
  const portfolioReturnPct = (totalValue - startingCapital) / startingCapital;
  
  // Get benchmark price
  let benchmarkPrice = 0;
  let benchmarkReturnPct = 0;
  
  if (benchmarkInceptionPrice > 0) {
    try {
      const quote = await getQuote(benchmarkTicker);
      if (quote) {
        benchmarkPrice = quote.price;
        benchmarkReturnPct = (benchmarkPrice - benchmarkInceptionPrice) / benchmarkInceptionPrice;
        
        // Only update benchmark if we got a better price than what's already stored
        // (avoids overwriting intraday price with stale after-hours/pre-market data)
        const existing = db.prepare('SELECT price, return_pct FROM benchmark WHERE date = ? AND ticker = ?').get(getCurrentDate(), benchmarkTicker);
        if (!existing) {
          db.prepare(`
            INSERT INTO benchmark (date, ticker, price, return_pct)
            VALUES (?, ?, ?, ?)
          `).run(getCurrentDate(), benchmarkTicker, benchmarkPrice, benchmarkReturnPct);
        } else {
          // Only overwrite during regular market hours (9:30 AM - 4:00 PM ET, weekdays)
          const now = new Date();
          const etHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }));
          const etMin = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', minute: '2-digit' }));
          const etDay = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short' }) === 'Sat' || now.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short' }) === 'Sun' ? 0 : 1);
          const marketOpen = etDay === 1 && ((etHour === 9 && etMin >= 30) || (etHour >= 10 && etHour < 16));
          if (marketOpen) {
            db.prepare(`UPDATE benchmark SET price = ?, return_pct = ? WHERE date = ? AND ticker = ?`).run(benchmarkPrice, benchmarkReturnPct, getCurrentDate(), benchmarkTicker);
          } else {
            // Use existing data instead of overwriting with stale price
            benchmarkPrice = existing.price;
            benchmarkReturnPct = existing.return_pct;
            console.log(`ℹ️ Using existing ${benchmarkTicker} price $${existing.price.toFixed(2)} (market closed)`);
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Could not fetch ${benchmarkTicker} price: ${e.message}`);
    }
  }
  
  // Delete existing snapshot for today (upsert behavior)
  db.prepare('DELETE FROM snapshots WHERE date = ?').run(getCurrentDate());
  
  const stmt = db.prepare(`
    INSERT INTO snapshots (date, total_value, cash, invested, unrealized_pnl, positions_json, benchmark_price, benchmark_return_pct, portfolio_return_pct, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    getCurrentDate(),
    totalValue,
    cash,
    totalInvested,
    totalUnrealizedPnL,
    JSON.stringify(positions),
    benchmarkPrice,
    benchmarkReturnPct,
    portfolioReturnPct,
    getCurrentDateTime()
  );
  
  console.log(`✅ Portfolio snapshot taken for ${getCurrentDate()}`);
  console.log(`Total Value: ${formatCurrency(totalValue)} (${formatPercent(portfolioReturnPct)})`);
  if (benchmarkPrice > 0) {
    console.log(`${benchmarkTicker}: ${formatCurrency(benchmarkPrice)} (${formatPercent(benchmarkReturnPct)})`);
    const alpha = portfolioReturnPct - benchmarkReturnPct;
    console.log(`Alpha vs ${benchmarkTicker}: ${alpha >= 0 ? '+' : ''}${formatPercent(alpha)}`);
  }
}

async function dailyReview() {
  console.log('📊 Daily Portfolio Review\n');
  
  await refreshPrices();
  console.log('\n');
  
  await status();
  console.log('\n');
  
  takeSnapshot();
  console.log('\n');
  
  await generateHTML();
  
  console.log('\n✅ Daily review complete');
}

// Main CLI handler
async function main() {
  const [,, command, ...args] = process.argv;
  
  try {
    switch (command) {
      case 'status':
        await status();
        break;
        
      case 'proforma':
        if (args.length < 5) {
          console.log('Usage: proforma <buy/sell> <ticker> <type> <quantity> <price> [reasoning]');
          process.exit(1);
        }
        const [action, ticker, type, quantity, price, ...reasoningParts] = args;
        const reasoning = reasoningParts.join(' ') || '';
        await addProforma(action, ticker.toUpperCase(), type, parseFloat(quantity), parseFloat(price), reasoning);
        break;
        
      case 'proformas':
        listProformas();
        break;
        
      case 'lock':
        if (args.length < 1) {
          console.log('Usage: lock <trade_id> [--price <price>]');
          process.exit(1);
        }
        const tradeId = parseInt(args[0]);
        const priceIndex = args.indexOf('--price');
        const lockPrice = priceIndex !== -1 ? parseFloat(args[priceIndex + 1]) : null;
        await lockTrade(tradeId, lockPrice);
        break;
        
      case 'lock-all':
        await lockAllTrades();
        break;
        
      case 'cancel':
        if (args.length < 1) {
          console.log('Usage: cancel <trade_id>');
          process.exit(1);
        }
        cancelTrade(parseInt(args[0]));
        break;
        
      case 'journal':
        if (args.length < 1) {
          console.log('Usage: journal "<entry>" [--category <category>] [--ticker <ticker>]');
          process.exit(1);
        }
        const entry = args[0];
        const categoryIndex = args.indexOf('--category');
        const tickerIndex = args.indexOf('--ticker');
        const category = categoryIndex !== -1 ? args[categoryIndex + 1] : null;
        const tickerArg = tickerIndex !== -1 ? args[tickerIndex + 1] : null;
        addJournalEntry(entry, category, tickerArg);
        break;
        
      case 'thesis':
        if (args.length < 1) {
          console.log('Usage: thesis <ticker> [--status <status>] [--update "<update>"]');
          process.exit(1);
        }
        const thesisTicker = args[0].toUpperCase();
        const statusIndex = args.indexOf('--status');
        const updateIndex = args.indexOf('--update');
        const newStatus = statusIndex !== -1 ? args[statusIndex + 1] : null;
        const updateText = updateIndex !== -1 ? args[updateIndex + 1] : null;
        updateThesis(thesisTicker, newStatus, updateText);
        break;
        
      case 'refresh':
        await refreshPrices();
        break;
        
      case 'generate':
        await generateHTML();
        break;
        
      case 'history':
        showHistory(args[0] ? args[0].toUpperCase() : null);
        break;
        
      case 'pnl':
        showPnL();
        break;
        
      case 'snapshot':
        takeSnapshot();
        break;
        
      case 'daily-review':
        await dailyReview();
        break;
        
      default:
        console.log('🐯 Tiger Portfolio Management System');
        console.log('\nAvailable commands:');
        console.log('  status              - Portfolio overview');
        console.log('  proforma           - Add proforma trade');
        console.log('  proformas          - List pending proformas');
        console.log('  lock <id>          - Lock proforma trade');
        console.log('  lock-all           - Lock all proformas');
        console.log('  cancel <id>        - Cancel proforma');
        console.log('  journal            - Add journal entry');
        console.log('  thesis             - Update thesis');
        console.log('  refresh            - Update all prices');
        console.log('  generate           - Generate HTML dashboard');
        console.log('  history [ticker]   - Show trade history');
        console.log('  pnl                - Show P&L summary');
        console.log('  snapshot           - Take portfolio snapshot');
        console.log('  daily-review       - Full daily workflow');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { db, formatCurrency, formatPercent };