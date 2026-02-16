# Tiger Portfolio — Execution Context
**Last updated:** Feb 15, 2026, 6:35 PM EST

## Objective
Beat SMH (VanEck Semiconductor ETF) over 3-5 years through concentrated, high-conviction AI infrastructure picks. $100K starting capital. Inception: Feb 14, 2026.

## Benchmark
- **SMH** @ $407.72 (inception price)
- Track only. Do NOT chase benchmark components or rush to deploy cash. Cash is a position.

## Current Portfolio State
- **Total Value:** $100,000
- **Cash:** $100,000 (100%)
- **Positions:** None (all cash)
- **Heat:** 0%
- **Alpha vs SMH:** 0.00%
- **Pending Proformas:** NVT BUY 44 shares @ $113.25 ($4,983)

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

## Current Technical Snapshot (Feb 15, 2026)
| Ticker | Price | SMA5 | SMA20 | SMA50 | SMA200 | RSI | VP POC | VP VAH | VP VAL |
|--------|-------|------|-------|-------|--------|-----|--------|--------|--------|
| ALAB | $129.32 | $154.03 | $161.97 | $163.06 | $149.32* | 38.8 | $144.79 | $188.06 | $138.94 |
| CRDO | $121.44 | — | $126.05 | — | — | 45.3 | $141.04 | $157.98 | $118.11 |

*SMA200 from 1y chart. Others from 6mo/3mo.

Markets closed Mon Feb 16 (Presidents' Day). First real trading day: Tuesday Feb 17.
