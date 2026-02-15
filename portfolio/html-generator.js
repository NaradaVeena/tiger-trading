const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'portfolio.db');
const outputPath = '/home/vamsi/.openclaw/workspace/research/aiportfolio/index.html';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

function formatCurrencyCompact(value) {
  if (value >= 1000000) {
    return '$' + (value/1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + (value/1000).toFixed(0) + 'K';
  } else {
    return formatCurrency(value);
  }
}

function formatPercent(value) {
  return (value * 100).toFixed(2) + '%';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateHTML() {
  const db = new Database(dbPath);
  
  // Get portfolio data
  const startingCapital = parseFloat(db.prepare('SELECT value FROM config WHERE key = ?').get('starting_capital').value);
  const cash = parseFloat(db.prepare('SELECT value FROM config WHERE key = ?').get('cash').value);
  const portfolioName = db.prepare('SELECT value FROM config WHERE key = ?').get('portfolio_name').value;
  const createdDate = db.prepare('SELECT value FROM config WHERE key = ?').get('created_date').value;
  
  // Get positions
  const positions = db.prepare("SELECT * FROM positions WHERE status = 'open' ORDER BY market_value DESC").all();
  
  // Get pending proformas
  const proformas = db.prepare("SELECT * FROM trades WHERE status = 'proforma' ORDER BY created_at DESC").all();
  
  // Get trade history
  const trades = db.prepare("SELECT * FROM trades WHERE status != 'proforma' ORDER BY date DESC, time DESC LIMIT 50").all();
  
  // Get thesis
  const theses = db.prepare('SELECT * FROM thesis ORDER BY ticker').all();
  
  // Get journal entries
  const journal = db.prepare('SELECT * FROM journal ORDER BY date DESC, time DESC LIMIT 20').all();
  
  // Get snapshots for chart
  const snapshots = db.prepare('SELECT * FROM snapshots ORDER BY date ASC').all();
  
  // Get benchmark data
  const benchmarkTicker = db.prepare("SELECT value FROM config WHERE key = 'benchmark_ticker'").get()?.value || 'SMH';
  const benchmarkInceptionPrice = parseFloat(db.prepare("SELECT value FROM config WHERE key = 'benchmark_inception_price'").get()?.value || '0');
  const latestBenchmark = db.prepare('SELECT * FROM benchmark WHERE ticker = ? ORDER BY date DESC LIMIT 1').get(benchmarkTicker);
  
  // Calculate totals
  let totalInvested = 0;
  let totalUnrealizedPnL = 0;
  let totalRealizedPnL = 0;
  
  positions.forEach(pos => {
    totalInvested += pos.market_value || 0;
    totalUnrealizedPnL += pos.unrealized_pnl || 0;
  });
  
  // Calculate realized P&L from completed trades
  const realizedTrades = db.prepare("SELECT SUM(total) as total FROM trades WHERE status = 'locked' AND action = 'sell'").get();
  const realizedBuys = db.prepare("SELECT SUM(total) as total FROM trades WHERE status = 'locked' AND action = 'buy'").get();
  if (realizedTrades.total && realizedBuys.total) {
    totalRealizedPnL = realizedTrades.total - realizedBuys.total;
  }
  
  const totalValue = cash + totalInvested;
  const totalPnL = totalValue - startingCapital;
  const totalPnLPct = totalPnL / startingCapital;
  const portfolioHeat = totalInvested / totalValue;
  
  // Benchmark calculations
  const benchmarkReturn = latestBenchmark ? latestBenchmark.return_pct : 0;
  const alpha = totalPnLPct - benchmarkReturn;
  
  db.close();
  
  // Generate chart data (normalized to % returns for comparison)
  const chartData = snapshots.map((snapshot, index) => {
    return {
      x: index,
      y: snapshot.total_value,
      portfolioReturn: (snapshot.portfolio_return_pct || 0) * 100,
      benchmarkReturn: (snapshot.benchmark_return_pct || 0) * 100,
      date: formatDate(snapshot.date)
    };
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐯 Tiger Portfolio — AI Infrastructure Trading Terminal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-tertiary: #21262d;
            --bg-quaternary: #30363d;
            --text-primary: #f0f6ff;
            --text-secondary: #c9d1d9;
            --text-muted: #8b949e;
            --border: #30363d;
            --green: #238636;
            --red: #da3633;
            --blue: #1f6feb;
            --amber: #d29922;
            --purple: #8b5cf6;
            --terminal-font: 'JetBrains Mono', 'Courier New', monospace;
            --ui-font: 'Inter', -apple-system, sans-serif;
        }

        body {
            font-family: var(--ui-font);
            background: var(--bg-primary);
            color: var(--text-secondary);
            line-height: 1.4;
            overflow-x: auto;
        }

        /* Top Terminal Bar */
        .terminal-bar {
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border);
            padding: 8px 16px;
            position: sticky;
            top: 0;
            z-index: 100;
            font-family: var(--terminal-font);
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .terminal-bar::-webkit-scrollbar {
            display: none;
        }

        .terminal-status {
            display: flex;
            align-items: center;
            gap: 20px;
            min-width: max-content;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .status-value {
            color: var(--text-primary);
            font-weight: 600;
        }

        .status-change.positive {
            color: var(--green);
        }

        .status-change.negative {
            color: var(--red);
        }

        .nav-links {
            margin-left: auto;
        }

        .nav-links a {
            color: var(--text-muted);
            text-decoration: none;
            margin-left: 8px;
            font-weight: 400;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
        }

        .nav-links a:hover {
            color: var(--text-primary);
        }

        .nav-links a.active {
            color: var(--text-primary);
            background: rgba(48, 54, 61, 0.6);
        }

        /* Alert Banner */
        .alert-banner {
            background: rgba(210, 153, 34, 0.15);
            border: 1px solid var(--amber);
            color: var(--amber);
            padding: 12px 20px;
            margin: 0 16px 16px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 16px;
        }

        /* Portfolio Summary Grid */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 1px;
            background: var(--border);
            margin-bottom: 16px;
            border-radius: 6px;
            overflow: hidden;
        }

        .summary-metric {
            background: var(--bg-secondary);
            padding: 12px 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .summary-metric .label {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }

        .summary-metric .value {
            font-family: var(--terminal-font);
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .summary-metric .change {
            font-family: var(--terminal-font);
            font-size: 12px;
            font-weight: 500;
        }

        /* Terminal Panels */
        .terminal-panel {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-bottom: 16px;
            overflow: hidden;
        }

        .panel-header {
            background: var(--bg-tertiary);
            padding: 12px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .panel-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .panel-subtitle {
            font-size: 12px;
            color: var(--text-muted);
        }

        /* Tables */
        .table-wrapper {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--border) transparent;
        }

        .table-wrapper::-webkit-scrollbar {
            height: 6px;
        }

        .table-wrapper::-webkit-scrollbar-track {
            background: var(--bg-secondary);
        }

        .table-wrapper::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }

        .terminal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            min-width: 800px;
        }

        .terminal-table th {
            background: var(--bg-quaternary);
            padding: 10px 12px;
            font-weight: 600;
            color: var(--text-primary);
            text-align: left;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
            border-bottom: 1px solid var(--border);
        }

        .terminal-table th:hover {
            background: #3d444d;
        }

        .terminal-table td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
            font-family: var(--terminal-font);
            font-size: 12px;
        }

        .terminal-table tr:hover {
            background: rgba(56, 139, 253, 0.05);
        }

        .terminal-table tr.gain-row {
            background: rgba(35, 134, 54, 0.05);
        }

        .terminal-table tr.loss-row {
            background: rgba(218, 54, 51, 0.05);
        }

        /* Typography */
        .ticker {
            font-family: var(--terminal-font);
            font-weight: 600;
            color: var(--blue);
            cursor: pointer;
        }

        .ticker:hover {
            text-decoration: underline;
        }

        .currency {
            font-family: var(--terminal-font);
            font-weight: 500;
        }

        .positive {
            color: var(--green);
        }

        .negative {
            color: var(--red);
        }

        .neutral {
            color: var(--text-muted);
        }

        /* Status Badges */
        .status-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-proforma {
            background: rgba(218, 54, 51, 0.2);
            color: var(--red);
        }

        .status-locked {
            background: rgba(35, 134, 54, 0.2);
            color: var(--green);
        }

        .status-cancelled {
            background: rgba(139, 148, 158, 0.2);
            color: var(--text-muted);
        }

        .status-active {
            background: rgba(35, 134, 54, 0.2);
            color: var(--green);
        }

        .status-weakened {
            background: rgba(210, 153, 34, 0.2);
            color: var(--amber);
        }

        .status-invalidated {
            background: rgba(218, 54, 51, 0.2);
            color: var(--red);
        }

        .category-core {
            background: rgba(31, 111, 235, 0.2);
            color: var(--blue);
        }

        .category-growth {
            background: rgba(35, 134, 54, 0.2);
            color: var(--green);
        }

        .category-watch {
            background: rgba(210, 153, 34, 0.2);
            color: var(--amber);
        }

        /* Empty State */
        .empty-state {
            padding: 24px;
            text-align: center;
            color: var(--text-muted);
            font-size: 14px;
            font-style: italic;
        }

        /* Journal */
        .journal-entry {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
        }

        .journal-entry:last-child {
            border-bottom: none;
        }

        .journal-meta {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .journal-content {
            font-size: 13px;
            line-height: 1.5;
        }

        .journal-category {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            background: rgba(139, 107, 246, 0.2);
            color: var(--purple);
            font-weight: 600;
            text-transform: uppercase;
        }

        /* Performance Chart */
        .chart-container {
            padding: 20px;
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chart-placeholder {
            color: var(--text-muted);
            font-style: italic;
            text-align: center;
        }

        /* Footer */
        .terminal-footer {
            margin-top: 32px;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
        }

        /* Mobile Responsive */
        @media (max-width: 1200px) {
            .summary-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 8px;
            }

            .terminal-bar {
                padding: 8px 12px;
                font-size: 12px;
            }

            .terminal-status {
                gap: 12px;
            }

            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .terminal-table th,
            .terminal-table td {
                padding: 6px 8px;
            }

            .nav-links {
                display: none;
            }
        }

        /* Accordion for mobile thesis expansion */
        .thesis-row {
            cursor: pointer;
        }

        .thesis-expanded .thesis-full {
            display: block;
            white-space: pre-wrap;
            max-width: none;
            padding-top: 8px;
            border-top: 1px solid var(--border);
            margin-top: 8px;
            font-size: 11px;
            line-height: 1.4;
        }

        .thesis-truncated {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .thesis-full {
            display: none;
        }
    </style>
</head>
<body>
    <!-- Terminal Status Bar -->
    <div class="terminal-bar">
        <div class="terminal-status">
            <div class="status-item">
                <span>🐯 Tiger Portfolio</span>
            </div>
            <div class="status-item">
                <span class="status-value">${formatCurrencyCompact(totalValue)}</span>
            </div>
            <div class="status-item">
                <span class="status-change ${totalPnL >= 0 ? 'positive' : 'negative'}">
                    ${totalPnL >= 0 ? '+' : ''}${formatCurrencyCompact(totalPnL)} (${formatPercent(totalPnLPct)})
                </span>
            </div>
            <div class="status-item">
                <span>Cash: <span class="status-value">${formatCurrencyCompact(cash)}</span></span>
            </div>
            <div class="status-item">
                <span>Heat: <span class="status-value">${formatPercent(portfolioHeat)}</span></span>
            </div>
            <div class="status-item">
                <span>${benchmarkTicker}: <span class="status-change ${benchmarkReturn >= 0 ? 'positive' : 'negative'}">${benchmarkReturn >= 0 ? '+' : ''}${formatPercent(benchmarkReturn)}</span></span>
            </div>
            <div class="status-item">
                <span>α: <span class="status-change ${alpha >= 0 ? 'positive' : 'negative'}">${alpha >= 0 ? '+' : ''}${formatPercent(alpha)}</span></span>
            </div>
            <div class="nav-links">
                <a href="/aiportfolio/" class="active">📊 Dashboard</a>
                <a href="/aiportfolio/thesis.html">💡 Thesis</a>
                <a href="/aiportfolio/pipeline.html">🔬 Pipeline</a>
                <a href="/aiportfolio-process/">📋 Rules</a>
                <a href="/">🏠 Portal</a>
            </div>
        </div>
    </div>

    ${proformas.length > 0 ? `
    <div class="alert-banner">
        ⚡ ${proformas.length} PROFORMA TRADE${proformas.length > 1 ? 'S' : ''} PENDING — Review before market lock
    </div>
    ` : ''}

    <div class="container">
        <!-- Portfolio Summary Grid -->
        <div class="summary-grid">
            <div class="summary-metric">
                <div class="label">Starting Capital</div>
                <div class="value">${formatCurrencyCompact(startingCapital)}</div>
            </div>
            <div class="summary-metric">
                <div class="label">Current Value</div>
                <div class="value">${formatCurrencyCompact(totalValue)}</div>
            </div>
            <div class="summary-metric">
                <div class="label">Cash</div>
                <div class="value">${formatCurrencyCompact(cash)}</div>
            </div>
            <div class="summary-metric">
                <div class="label">Invested</div>
                <div class="value">${formatCurrencyCompact(totalInvested)}</div>
            </div>
            <div class="summary-metric">
                <div class="label">Unrealized P&L</div>
                <div class="value ${totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}">
                    ${totalUnrealizedPnL >= 0 ? '+' : ''}${formatCurrencyCompact(totalUnrealizedPnL)}
                </div>
            </div>
            <div class="summary-metric">
                <div class="label">Realized P&L</div>
                <div class="value ${totalRealizedPnL >= 0 ? 'positive' : 'negative'}">
                    ${totalRealizedPnL >= 0 ? '+' : ''}${formatCurrencyCompact(totalRealizedPnL)}
                </div>
            </div>
            <div class="summary-metric">
                <div class="label">${benchmarkTicker} Return</div>
                <div class="value ${benchmarkReturn >= 0 ? 'positive' : 'negative'}">
                    ${benchmarkReturn >= 0 ? '+' : ''}${formatPercent(benchmarkReturn)}
                </div>
                <div class="change neutral">${latestBenchmark ? formatCurrency(latestBenchmark.price) : '—'}</div>
            </div>
            <div class="summary-metric">
                <div class="label">Alpha (α)</div>
                <div class="value ${alpha >= 0 ? 'positive' : 'negative'}">
                    ${alpha >= 0 ? '+' : ''}${formatPercent(alpha)}
                </div>
                <div class="change neutral">vs ${benchmarkTicker}</div>
            </div>
        </div>

        <!-- Current Positions -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">📊 Current Positions</div>
            </div>
            ${positions.length > 0 ? `
            <div class="table-wrapper">
                <table class="terminal-table">
                    <thead>
                        <tr>
                            <th onclick="sortTable(this, 0)">Ticker</th>
                            <th onclick="sortTable(this, 1)">Type</th>
                            <th onclick="sortTable(this, 2)" style="text-align: right;">Qty</th>
                            <th onclick="sortTable(this, 3)" style="text-align: right;">Avg Cost</th>
                            <th onclick="sortTable(this, 4)" style="text-align: right;">Current</th>
                            <th onclick="sortTable(this, 5)" style="text-align: right;">Mkt Value</th>
                            <th onclick="sortTable(this, 6)" style="text-align: right;">P&L $</th>
                            <th onclick="sortTable(this, 7)" style="text-align: right;">P&L %</th>
                            <th onclick="sortTable(this, 8)" style="text-align: right;">Weight</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${positions.map(pos => {
                          const weight = totalInvested > 0 ? (pos.market_value / totalInvested) : 0;
                          const pnlClass = (pos.unrealized_pnl || 0) >= 0 ? 'gain-row' : 'loss-row';
                          return `
                        <tr class="${pnlClass}">
                            <td><a href="https://www.tradingview.com/chart/?symbol=${pos.ticker}" target="_blank" class="ticker">${pos.ticker}</a></td>
                            <td>${pos.type}</td>
                            <td style="text-align: right;" class="currency">${pos.shares}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(pos.avg_cost)}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(pos.current_price)}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(pos.market_value)}</td>
                            <td style="text-align: right;" class="currency ${(pos.unrealized_pnl || 0) >= 0 ? 'positive' : 'negative'}">
                                ${(pos.unrealized_pnl || 0) >= 0 ? '+' : ''}${formatCurrency(pos.unrealized_pnl || 0)}
                            </td>
                            <td style="text-align: right;" class="currency ${(pos.unrealized_pnl_pct || 0) >= 0 ? 'positive' : 'negative'}">
                                ${formatPercent(pos.unrealized_pnl_pct || 0)}
                            </td>
                            <td style="text-align: right;" class="currency">${formatPercent(weight)}</td>
                            <td><a href="#" onclick="alert('Trade action not implemented')" style="color: var(--text-muted);">TRADE</a></td>
                        </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : `
            <div class="empty-state">No open positions. ${formatCurrency(cash)} ready to deploy.</div>
            `}
        </div>

        ${proformas.length > 0 ? `
        <!-- Pending Trades -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">🎯 Pending Proforma Trades</div>
            </div>
            <div class="table-wrapper">
                <table class="terminal-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Time</th>
                            <th>Ticker</th>
                            <th>Action</th>
                            <th>Type</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                            <th>Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proformas.map(trade => `
                        <tr>
                            <td class="currency">${trade.id}</td>
                            <td>${formatDateTime(trade.created_at).split(', ')[1]}</td>
                            <td class="ticker">${trade.ticker}</td>
                            <td><span class="status-badge status-proforma">${trade.action.toUpperCase()}</span></td>
                            <td>${trade.type}</td>
                            <td style="text-align: right;" class="currency">${trade.quantity}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(trade.price)}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(trade.total)}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${trade.reasoning || ''}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- Thesis Tracker -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">💡 Thesis Tracker</div>
            </div>
            ${theses.length > 0 ? `
            <div class="table-wrapper">
                <table class="terminal-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Key Thesis</th>
                            <th>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${theses.map(thesis => `
                        <tr class="thesis-row" onclick="toggleThesis(this)">
                            <td><a href="https://www.tradingview.com/chart/?symbol=${thesis.ticker}" target="_blank" class="ticker">${thesis.ticker}</a></td>
                            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${thesis.company || ''}</td>
                            <td><span class="status-badge category-${thesis.category}">${thesis.category?.toUpperCase() || ''}</span></td>
                            <td><span class="status-badge status-${thesis.status}">${thesis.status?.toUpperCase() || ''}</span></td>
                            <td>
                                <div class="thesis-truncated" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${thesis.thesis}</div>
                                <div class="thesis-full">${thesis.thesis}</div>
                            </td>
                            <td>${formatDate(thesis.updated_at)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : `
            <div class="empty-state">No thesis entries found.</div>
            `}
        </div>

        ${trades.length > 0 ? `
        <!-- Trade History -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">📜 Trade History</div>
            </div>
            <div class="table-wrapper">
                <table class="terminal-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Ticker</th>
                            <th>Action</th>
                            <th>Type</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Proforma $</th>
                            <th style="text-align: right;">Locked $</th>
                            <th>Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trades.map(trade => `
                        <tr>
                            <td>${formatDate(trade.date)}</td>
                            <td class="ticker">${trade.ticker}</td>
                            <td><span class="status-badge status-${trade.status}">${trade.action.toUpperCase()}</span></td>
                            <td>${trade.type}</td>
                            <td style="text-align: right;" class="currency">${trade.quantity}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(trade.proforma_price || trade.price)}</td>
                            <td style="text-align: right;" class="currency">${formatCurrency(trade.locked_price || trade.price)}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${trade.reasoning || ''}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        ${snapshots.length > 1 ? `
        <!-- Performance Chart -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">📈 Tiger vs ${benchmarkTicker} — Performance</div>
                <div class="panel-subtitle">Returns since inception (${formatDate(createdDate)})</div>
            </div>
            <div class="chart-container">
                <canvas id="performanceChart" style="width: 100%; height: 200px;"></canvas>
            </div>
            <div style="padding: 0 20px 12px; display: flex; gap: 20px; font-size: 12px;">
                <span style="color: #f97316;">━━ Tiger Portfolio</span>
                <span style="color: #6366f1;">━━ ${benchmarkTicker}</span>
            </div>
        </div>
        ` : `
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">📈 Tiger vs ${benchmarkTicker} — Performance</div>
                <div class="panel-subtitle">Returns since inception (${formatDate(createdDate)})</div>
            </div>
            <div class="chart-container">
                <div class="chart-placeholder">Performance tracking begins with first trade • ${benchmarkTicker} benchmark from ${formatCurrency(benchmarkInceptionPrice)}</div>
            </div>
        </div>
        `}

        <!-- Trading Journal -->
        <div class="terminal-panel">
            <div class="panel-header">
                <div class="panel-title">📝 Trading Journal</div>
            </div>
            ${journal.length > 0 ? journal.map(entry => `
            <div class="journal-entry">
                <div class="journal-meta">
                    <span>${formatDateTime(entry.created_at)}</span>
                    ${entry.category ? `<span class="journal-category">${entry.category.toUpperCase()}</span>` : ''}
                    ${entry.ticker ? `<span class="ticker">${entry.ticker}</span>` : ''}
                </div>
                <div class="journal-content">${entry.entry}</div>
            </div>
            `).join('') : `
            <div class="empty-state">No journal entries found.</div>
            `}
        </div>
    </div>

    <div class="terminal-footer">
        <div>🐯 Tiger Portfolio Management System</div>
        <div>Generated ${formatDateTime(new Date())} • <a href="/aiportfolio-process/" style="color: var(--text-muted);">Rules & Process</a></div>
        <div style="margin-top: 8px; font-size: 11px;">
            For educational purposes only • Not investment advice
        </div>
    </div>

    <script>
        // Table sorting functionality
        function sortTable(header, column) {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            const isNumeric = header.style.textAlign === 'right' || column >= 2;
            
            rows.sort((a, b) => {
                const aVal = a.children[column].textContent.trim();
                const bVal = b.children[column].textContent.trim();
                
                if (isNumeric) {
                    const aNum = parseFloat(aVal.replace(/[^-0-9.]/g, '')) || 0;
                    const bNum = parseFloat(bVal.replace(/[^-0-9.]/g, '')) || 0;
                    return bNum - aNum; // Descending
                } else {
                    return aVal.localeCompare(bVal);
                }
            });
            
            rows.forEach(row => tbody.appendChild(row));
        }

        // Thesis accordion for mobile
        function toggleThesis(row) {
            if (window.innerWidth > 768) return; // Only on mobile
            
            row.classList.toggle('thesis-expanded');
        }

        // Performance chart (% returns comparison)
        ${snapshots.length > 1 ? `
        const canvas = document.getElementById('performanceChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const data = ${JSON.stringify(chartData)};
            
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            const width = rect.width;
            const height = rect.height;
            const padding = 50;
            
            // Get min/max across both series
            const allReturns = data.flatMap(d => [d.portfolioReturn, d.benchmarkReturn]);
            const minReturn = Math.min(...allReturns, 0) - 1;
            const maxReturn = Math.max(...allReturns, 0) + 1;
            const returnRange = maxReturn - minReturn;
            
            function yPos(val) {
                return padding + ((height - 2 * padding) * (maxReturn - val) / returnRange);
            }
            
            function xPos(i) {
                return padding + ((width - 2 * padding) * i / Math.max(data.length - 1, 1));
            }
            
            // Draw grid
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = 0.5;
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillStyle = '#8b949e';
            
            // Zero line
            const zeroY = yPos(0);
            ctx.strokeStyle = '#484f58';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding, zeroY);
            ctx.lineTo(width - padding, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillText('0%', 4, zeroY + 4);
            
            // Grid lines
            ctx.strokeStyle = '#21262d';
            ctx.lineWidth = 0.5;
            const step = returnRange > 20 ? 5 : returnRange > 10 ? 2 : 1;
            for (let v = Math.ceil(minReturn / step) * step; v <= maxReturn; v += step) {
                if (v === 0) continue;
                const y = yPos(v);
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
                ctx.fillText(v.toFixed(0) + '%', 4, y + 4);
            }
            
            // Draw Tiger portfolio line (orange)
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            data.forEach((point, i) => {
                const x = xPos(i);
                const y = yPos(point.portfolioReturn);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            // Draw benchmark line (indigo)
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            data.forEach((point, i) => {
                const x = xPos(i);
                const y = yPos(point.benchmarkReturn);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw date labels
            ctx.fillStyle = '#8b949e';
            if (data.length <= 10) {
                data.forEach((point, i) => {
                    ctx.fillText(point.date, xPos(i) - 15, height - 8);
                });
            } else {
                const labelStep = Math.ceil(data.length / 8);
                data.forEach((point, i) => {
                    if (i % labelStep === 0 || i === data.length - 1) {
                        ctx.fillText(point.date, xPos(i) - 15, height - 8);
                    }
                });
            }
        }
        ` : ''}
    </script>
</body>
</html>
  `;
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write HTML file
  fs.writeFileSync(outputPath, html);
}

module.exports = { generate: generateHTML };