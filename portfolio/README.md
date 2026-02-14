# 🐯 Tiger Portfolio Management System

A comprehensive portfolio management system for AI infrastructure trading. Built with Node.js, SQLite3, and Yahoo Finance integration.

## Features

- **Proforma Trading**: Propose trades at 11 AM, lock at market prices at 2 PM
- **Real-time Price Updates**: Yahoo Finance integration for current pricing
- **Beautiful Dashboard**: Dark-themed HTML dashboard with Bloomberg terminal aesthetic
- **Position Tracking**: Track positions, P&L, and portfolio performance
- **Thesis Management**: Track investment thesis for each ticker
- **Trading Journal**: Record market observations and trade reasoning
- **Portfolio Snapshots**: Historical tracking of portfolio performance

## Quick Start

```bash
# Initialize the system (already done)
node db-init.js

# Check portfolio status
node cli.js status

# Add a proforma trade
node cli.js proforma buy ALAB stock 115 130.00 "Post-earnings accumulation"

# List pending trades
node cli.js proformas

# Lock trades at current market prices
node cli.js lock-all

# Update prices from Yahoo Finance
node cli.js refresh

# Generate HTML dashboard
node cli.js generate

# Full daily workflow
node cli.js daily-review
```

## Dashboard

The HTML dashboard is automatically generated at:
- Local: `/home/vamsi/.openclaw/workspace/research/aiportfolio/index.html`
- Web: https://narada.galigutta.com/aiportfolio/

## Initial Setup

The system is pre-configured with:
- **Starting Capital**: $100,000
- **Cash Position**: $100,000 (ready to invest)
- **Initial Thesis**: 6 AI infrastructure stocks (ALAB, NVT, FN, CRDO, COHR, PWR)

## Architecture

- **Database**: SQLite3 (`data/portfolio.db`)
- **CLI**: Node.js (`cli.js`)
- **HTML Generation**: Static generation (`html-generator.js`)
- **Price Data**: Yahoo Finance API

## Dependencies

- `better-sqlite3`: Synchronous SQLite database
- `yahoo-finance2`: Real-time market data

---

Built for serious portfolio management. Ready to track real money trades.