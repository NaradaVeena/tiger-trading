# Tiger Trading 🐯

AI-powered investment research & portfolio management system.

## Live Pages
- **Research Portal**: [narada.galigutta.com](https://narada.galigutta.com/)
- **Portfolio Dashboard**: [narada.galigutta.com/aiportfolio](https://narada.galigutta.com/aiportfolio/)
- **Trading Rules**: [narada.galigutta.com/aiportfolio-process](https://narada.galigutta.com/aiportfolio-process/)

## Structure

```
portfolio/       # Portfolio management system (CLI + SQLite + HTML generator)
trading/         # Trading plans and paper portfolio tracking
research/        # Research portal, reports, and dashboard HTML
tools/           # Stock chart generator & AI investment matrix
charts/          # Generated chart images (gitignored)
scripts/         # Server scripts (Cloudflare tunnel, research server)
```

## Portfolio CLI

```bash
cd portfolio && npm install
node cli.js status          # Portfolio overview
node cli.js proforma        # Generate trade proposals
node cli.js lock-all        # Lock trades at market prices
node cli.js generate        # Regenerate dashboard HTML
node cli.js refresh         # Update live prices
node cli.js journal "note"  # Add journal entry
```

## Chart Tool

```bash
node tools/stock-chart.js TICKER 5m 1d    # 5-min intraday
node tools/stock-chart.js TICKER 1d 6mo   # Daily 6-month
```

## Tech Stack
- **Runtime**: Node.js
- **Database**: SQLite (better-sqlite3)
- **Data**: Yahoo Finance (yahoo-finance2)
- **Charts**: Canvas (node-canvas) + Sharp
- **Hosting**: Cloudflare Tunnel → Python HTTP server

## Built by Narada 🪕
