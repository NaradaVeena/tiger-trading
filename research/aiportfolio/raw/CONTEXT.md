# Tiger Portfolio — Execution Context
**Last updated:** Feb 19, 2026, 2:15 PM EST

## Objective
Beat SMH (VanEck Semiconductor ETF) over 3-5 years through concentrated, high-conviction AI infrastructure picks. $100K starting capital. Inception: Feb 14, 2026.

## Benchmark
- **SMH** @ $407.72 (inception price)
- Track only. Do NOT chase benchmark components or rush to deploy cash. Cash is a position.

## Current Portfolio State
- **Total Value:** $99,788 (-0.21%)
- **Cash:** $94,975 (95.2%)
- **Positions:** ANET (4.8%)
- **Heat:** 4.8%
- **Alpha vs SMH:** -0.28%
- **Pending Proformas:** None

## Watchlist
**Source of truth: portfolio DB thesis table.** Query with:
```
node -e "const db = require('better-sqlite3')('portfolio/data/portfolio.db'); console.log(JSON.stringify(db.prepare(\"SELECT ticker, company, category, status FROM thesis WHERE status IN ('active','weakened')\").all(), null, 2));"
```
Never hardcode ticker lists. When tickers are promoted or removed, the DB is updated and everything downstream reads from it.

## Expansion Pipeline
LITE, GLW (Poorna's pick), VRT — see pipeline.html for details.

## Trade Selection Framework
**CRITICAL:** All trade proposals follow `portfolio/TRADE-SELECTION.md` — the 3-gate system:
1. **Gate 1: Fundamental** — must have active thesis in DB
2. **Gate 2: Technical (Shannon)** — stage, MA alignment+slope, extension, volume, S/R polarity, R/R ≥ 3:1
3. **Gate 3: Portfolio fit** — sizing, cash management, correlation

Skills: `skills/technical-analysis-mtf/SKILL.md` (Shannon framework), `skills/investment-research/SKILL.md` (DD framework)

Every proforma includes a scorecard. No surprises.

## Daily Workflow
1. **11 AM EST (Mon-Fri):** Scan watchlist. Propose proforma trades with reasoning. Post to group.
2. **Group review window:** 11 AM → 2 PM. Group provides feedback.
3. **2 PM EST:** Lock trades at prevailing bid/ask. Update dashboard.
4. **Post-trade:** Journal entry, snapshot, thesis update if needed.

## Decision Framework
**Fundamentals say WHAT to buy. Technicals say WHEN to buy.**
- Never propose a trade without running the chart tool first
- Volume Profile levels (POC/VAH/VAL) determine entry zones — buy at volume nodes, not thin air
- RSI < 30 = oversold (potential entry). RSI > 70 = overbought (potential trim)
- Must pass 6-pillar DD: growth, concentration, moat, management, technicals, bull/bear

## Entry Rules
- Start with 1/3 position (starter) at identified volume node
- Add 2nd tranche on successful retest or base formation
- Keep powder for 3rd tranche if price migrates to lower VP node
- No position > 25% of portfolio
- LEAPS only on oversold names (RSI < 35), never on extended charts
- Don't be whale exit liquidity

## Group Preferences (Who Cares About What)
- **Kedar (Romeo):** TA only. Volume profile > arbitrary targets. Hates sycophancy. "Break and retest and fail to recapture" is his entry pattern. Don't validate every trade, just give data.
- **Poorna:** TA-focused. Wants SMA 5/20/50/200, support/resistance, trendlines across multiple timeframes. "Fundamentals say what, technicals say when." Alert on contradictory signals with opinion.
- **Anirudh:** Deep conviction, long-term hold. Founder-led + moat durability matter most. Asks the right DD questions. Closest to Vamsi's style.
- **Vamsee:** Process maven. Wants structured workflow, token efficiency, insight loops. Maintain skills and improve systematically. Take his recommendations seriously.
- **Undi:** Style unknown.
- **Vamsi:** Mirrors with real money. Patient. Cash is a position. Don't rush entries.

## Anti-Patterns (Hard Lessons)
- **Don't embellish numbers.** Print what the API returns. Period.
- **Don't chase the benchmark.** SMH is the ruler, not the roadmap.
- **Volume nodes matter.** No volume support = no entry. It's a prayer, not a trade.
- **Present plan before executing.** "Here's what I'll research" before burning tokens.
- **Quality of bounce matters more than bounce itself.** Watch HOW price acts at key levels.

## Tools
- **Chart generator:** `cd /home/vamsi/tiger-trading && node tools/stock-chart.js TICKER 1d 6mo`
  - Outputs: Candlesticks, VWAP, SMA5/20/50/200, VP (POC/VAH/VAL), RSI(14), MACD, trendlines, S/R
- **Portfolio CLI:** `cd /home/vamsi/tiger-trading && node portfolio/cli.js <command>`
  - Commands: status, proforma, proformas, lock, lock-all, cancel, refresh, snapshot, generate, journal, pnl
- **Dashboard:** narada.galigutta.com/aiportfolio/

## Signal Group
- **Tigerrr** — can't send directly from cron (base64 ID bug). Write updates to portal + announce to main session.

## Current Technical Snapshot (Feb 19, 2026)
| Ticker | Price | SMA20 | SMA50 | SMA200 | RSI | VP POC | VP VAH | VP VAL | Regime |
|--------|-------|-------|-------|--------|-----|--------|--------|--------|--------|
| ALAB | $154.13 | $161.43 | $163.06* | $149.32* | 40.9 | $142.87 | $190.15 | $139.23 | Chop 🔄 |
| NVT | $116.71 | $113.92 | $108.69 | $99.85 | 59.1 | $112.36 | $116.75 | $99.19 | Chop 🔄 |
| FN | $512.61 | $481.05 | $477.80 | $416.72 | 57.9 | $447.13 | $518.28 | $375.98 | Chop 🔄 |
| CRDO | $128.41 | $122.94 | $138.24 | $117.82 | 49.7 | $151.00 | $165.95 | $124.09 | Mixed |
| COHR | $230.50 | $218.12 | $199.72 | $155.67 | 59.8 | $115.55 | $190.17 | $84.35 | Trending ✅ |
| PWR | $553.10 | $496.52 | $462.46 | $411.38 | 72.7 | $437.99 | $484.25 | $407.68 | Trending ✅ |
| TSEM | $125.81 | $132.61 | $126.03 | $109.12 | 46.3 | $128.40 | $141.10 | $75.06 | Goldilocks 🎯 |
| ANET | $137.50 | $140.08 | $133.57 | $128.89 | 50.2 | $141.83 | $148.97 | $127.12 | Chop 🔄 |
| LITE | $629.69? | $480.93 | $407.85 | $328.12 | 77.2 | $167.52 | $353.82 | $111.20 | Mixed |
| GLW | $131.02 | $116.07 | $100.10 | $84.22 | 71.1 | $88.47 | $96.43 | $70.72 | Mixed |
| VRT | $244.65 | $204.88 | $183.38 | $145.12 | 72.0 | $160.89 | $196.24 | $143.79 | Mixed |

Markets closed Mon Feb 16. Trading week shortened.
