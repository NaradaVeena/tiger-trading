# 🐯 Tiger Portfolio — Trade Selection Criteria

**Purpose:** This document defines the EXACT criteria used to select trades for the 11 AM proforma. Every trade proposal must reference this document and show how it passes each gate. No exceptions.

**Skills referenced:**
- `skills/technical-analysis-mtf/SKILL.md` — Brian Shannon's multiple timeframe framework (stage identification, MA alignment, volume analysis, R/R assessment)
- `skills/investment-research/SKILL.md` — 6-pillar fundamental DD framework
- `portfolio/RULES.md` — hard position sizing and entry rules

---

## The Three Gates

Every trade must pass ALL THREE gates. If any gate fails, no trade.

### Gate 1: Fundamental Qualification ✅
**Source:** Thesis DB + `skills/investment-research/SKILL.md`

The ticker must have an ACTIVE thesis in the portfolio database. This means it has already passed the 6-pillar DD:
1. Growth & margins (revenue trajectory, gross margin trend)
2. Customer concentration (no single customer >50% without documented risk acceptance)
3. Moat analysis (switching costs, barriers to entry, defensibility)
4. Management quality (founder-led preferred, CEO tenure, insider ownership)
5. Competitive positioning (market share, differentiation)
6. Bull/bear/invalidation (specific thesis-killing triggers documented)

**How to check:** `node portfolio/cli.js status` → thesis table shows ticker with status = 'active'

**Gate 1 fail = no trade.** Pipeline/watch names don't get proformas until promoted.

---

### Gate 2: Technical Qualification (Shannon Framework) 📊
**Source:** `skills/technical-analysis-mtf/SKILL.md`

Run the chart tool: `node tools/stock-chart.js TICKER 1d 6mo`

Then evaluate these criteria IN ORDER:

#### 2a. Stage Identification
- **PASS:** Stage 2 (markup) on BOTH daily and weekly timeframes
- **CONDITIONAL PASS:** Stage 1 (accumulation) with evidence of transition to Stage 2 (higher lows forming, MA crossover beginning)
- **FAIL:** Stage 3 (distribution) or Stage 4 (decline) on either timeframe

**How to determine stage:**
- Stage 2 = higher highs + higher lows, SMA50 > SMA200, both rising
- Stage 4 = lower highs + lower lows, price below declining SMA50
- When in doubt, defer to the weekly timeframe (longer-term trend has more force)

#### 2b. Moving Average Alignment & Slope
- **Check alignment:** Price > SMA20 > SMA50 > SMA200 (ideal bullish stack)
- **Check slopes:** All MAs must have positive slope. Compute 20-day slope change for SMA50 and SMA200.
- **MA slope ≥ MA level:** A steeply rising 200-day reduces extension risk. Flat/declining 200-day amplifies it. State both the distance AND the slope.
- **Death cross (SMA50 < SMA200) = automatic FAIL** for new entries

#### 2c. Extension Risk
- **Compute:** `(Price / SMA200 - 1) × 100` = distance from 200-day MA
- **Thresholds (adjusted for slope):**
  - <15%: Normal — no extension concern
  - 15-30% with rising slopes: Acceptable — note the risk but don't disqualify
  - 30%+ with rising slopes: Elevated — reduce position size to starter only
  - 30%+ with flat/declining slopes: FAIL — do not enter
- **Always state the number.** "Extended" without a percentage is banned.

#### 2d. Volume Character
- **Healthy:** Expanding volume on rallies, contracting volume on pullbacks
- **Warning:** Heavy volume reversal candles at highs (distribution signal)
- **FAIL:** Earnings gap reversal (beat + ATH + reversal on >30% above-avg volume) = wait for reclaim of the high before entry

#### 2e. Support/Resistance & Polarity
- **Entry must be at or near a confirmed support level** (VP node, MA, prior S/R)
- **Check polarity flips:** Former resistance now acting as support = bullish confirmation. Former support now acting as resistance = bearish confirmation.
- **VP levels:** POC = strongest support/resistance. VAH/VAL = value area boundaries. Outside value area = thin air.
- **No entries in thin air** (price above VAH with no VP support underneath)

#### 2f. Risk/Reward Ratio
- **Minimum 3:1 R/R** per Shannon framework
- **How to compute:**
  - Entry = current price or identified entry zone
  - Stop = below nearest confirmed support (VP node, MA, polarity level). Must have SPECIFIC price.
  - Target = next resistance level (VP node, prior high, measured move). Must have SPECIFIC price.
  - R/R = (Target - Entry) / (Entry - Stop)
- **If R/R < 3:1:** State what price WOULD give 3:1 and set that as the entry trigger
- **Cherry-picking targets to force 3:1 is banned.** Use the natural next resistance level.

**Gate 2 scoring:**
| Criteria | Pass | Conditional | Fail |
|----------|------|-------------|------|
| Stage | Stage 2 both TFs | Stage 1→2 transition | Stage 3 or 4 |
| MA alignment | Full bullish stack | 1 MA out of order | Death cross |
| Extension | <30% or slopes justify | 30%+ rising slopes | 30%+ flat slopes |
| Volume | Healthy pattern | Neutral | Distribution signal |
| S/R + Polarity | At confirmed support | Near support | In thin air |
| R/R | ≥ 3:1 | 2.5-3:1 with slope adj | < 2.5:1 |

**Gate 2 pass = 5+ criteria pass/conditional, 0 fails.**

---

### Gate 3: Portfolio Fit 🎯
**Source:** `portfolio/RULES.md`

Even if Gates 1 & 2 pass, the trade must fit the portfolio:

- **Position limit:** No single position > 25% of portfolio
- **Sizing:** Starter = 3-5%, Core = 15-25%. First entry is always a starter.
- **Cash management:** Don't deploy >50% of remaining cash in one day
- **Correlation check:** If we already hold 3+ names in the same sub-sector, adding another increases concentration risk. Note it.
- **Heat check:** Total portfolio heat (sum of position risk) should not exceed 15% of portfolio value

---

## Proforma Output Format

Every proforma proposal MUST include this scorecard:

```
## [TICKER] — [ACTION] [SHARES] @ $[PRICE]

### Gate 1: Fundamental ✅/❌
- Thesis status: [active/weakened/pipeline]
- Key thesis: [one line]

### Gate 2: Technical Scorecard
| Criteria | Result | Detail |
|----------|--------|--------|
| Stage (D/W) | ✅/❌ | Stage 2/2, Stage 1→2, etc. |
| MA alignment | ✅/⚠️/❌ | Price vs SMA20/50/200 + slopes |
| Extension | ✅/⚠️/❌ | X% above 200d, slope +Y% |
| Volume | ✅/⚠️/❌ | Pattern description |
| S/R + Polarity | ✅/⚠️/❌ | Entry level + what confirms it |
| R/R | ✅/⚠️/❌ | Entry/Stop/Target = X:1 |
| **Score** | **X/6** | |

### Gate 3: Portfolio Fit
- Position size: $X (Y% of portfolio)
- Cash after: $X (Y%)
- Correlation: [notes]

### Decision: PROPOSE / PASS / WATCH
- If PASS: What specific condition would flip this to PROPOSE?
- If WATCH: What level triggers re-evaluation?
```

---

## What This Means for the Proforma Cron

The 11 AM cron job (`tiger-proforma-11am`) must:
1. Read this document (`portfolio/TRADE-SELECTION.md`)
2. Read `contexts/tiger/CONTEXT.md` for current portfolio state
3. Read `portfolio/RULES.md` for hard rules
4. For each watchlist ticker, run the chart tool and score against Gate 2
5. Only propose trades that pass all 3 gates
6. For names that DON'T pass, state which gate failed and what would change it

**No surprises.** Every proforma is traceable to this criteria.

---

## Analyst Consensus Note
Per Poorna's correction (Feb 16, 2026): Analyst consensus is a DATA POINT, not a gate. It can be a **contrary indicator** — when price significantly exceeds consensus, it may signal re-rating ahead, not overvaluation. Never use consensus as a price ceiling for target-setting. Do note large divergences between price and consensus in the scorecard for discussion purposes.

---

*Last updated: Feb 16, 2026*
*Referenced skills: technical-analysis-mtf, investment-research*
*Referenced rules: portfolio/RULES.md*
