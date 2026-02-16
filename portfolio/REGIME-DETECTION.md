# 🐯 Regime Detection & Indicator Scoring System

**Proposed by:** Poorna B  
**Date:** Feb 16, 2026  
**Status:** IMPLEMENTED — backfilled from historical data, live results below

---

## The Core Insight

Different market regimes favor different indicators. A trending market rewards momentum indicators (MA crossovers, MACD, ADX). A mean-reverting market rewards oscillators (RSI extremes, Bollinger Band reversals). When the indicators that were "working" stop working, it signals we've entered a different regime — and our trade selection criteria need to adapt.

**The danger of ignoring regimes:** If we blindly apply the same Shannon Stage 2 + MA alignment framework in a choppy, mean-reverting market, we'll get whipsawed. Conversely, if we switch to mean-reversion in a strong trend, we'll sell winners too early and buy losers too soon.

---

## Four Market Regimes

| Regime | Characteristics | What Works | What Fails |
|--------|----------------|------------|------------|
| **Trending Up** | Higher highs/lows, expanding breadth, MAs fanning out | MA alignment, MACD, breakouts, "buy the dip" | RSI overbought sells, mean-reversion shorts |
| **Trending Down** | Lower highs/lows, contracting breadth, MAs compressing | Short setups, "sell the rip", breakdown entries | RSI oversold buys, MA support bounces |
| **Range/Chop** | Flat MAs, price oscillating around a mean, false breakouts | RSI extremes, support/resistance bounces, Bollinger reversals | MA crossovers (whipsaw), breakout entries (fail) |
| **High Volatility Transition** | Wide daily ranges, gap-and-reverse days, VIX spike | Cash, reduced size, wider stops | Tight stops (get hunted), trend-following (false signals) |

---

## Indicators to Score (6 Signals)

For each watchlist ticker, score these signals daily on a 1/0 (correct/incorrect) basis:

### 1. MA Trend Signal
- **Signal logic:** If SMA20 > SMA50 > SMA200 (bullish stack) → expect price up next N days
- **Score:** Did price close higher 5 days later? 1 = yes, 0 = no
- **Works in:** Trending regimes
- **Fails in:** Chop (whipsaw around MAs)

### 2. RSI Mean-Reversion Signal  
- **Signal logic:** RSI < 35 → expect bounce. RSI > 65 → expect pullback.
- **Score:** Did price reverse in the expected direction within 5 days? 1 = yes, 0 = no
- **Works in:** Range/chop regimes
- **Fails in:** Strong trends (RSI stays overbought for weeks in Stage 2)

### 3. MACD Momentum Signal
- **Signal logic:** MACD histogram positive and rising → expect continuation up. Negative and falling → expect continuation down.
- **Score:** Did price continue in signal direction 5 days later? 1 = yes, 0 = no
- **Works in:** Trending regimes
- **Fails in:** Chop (oscillates around zero line)

### 4. Volume Confirmation Signal
- **Signal logic:** If price up on above-average volume → expect follow-through. If price up on below-average volume → expect failure.
- **Score:** Did the follow-through/failure happen within 5 days? 1 = yes, 0 = no
- **Works in:** All regimes (volume is regime-neutral)
- **Fails in:** Rarely — volume is the most reliable confirmer

### 5. Support/Resistance Signal
- **Signal logic:** Price at identified VP POC or MA support → expect bounce. Price at resistance → expect rejection.
- **Score:** Did the level hold within 5 days? 1 = yes, 0 = no
- **Works in:** Range/chop regimes (levels respected)
- **Fails in:** Strong trends (levels get blown through)

### 6. Breakout Signal
- **Signal logic:** Price breaks above prior resistance on above-average volume → expect continuation.
- **Score:** Did price stay above the breakout level 5 days later? 1 = yes, 0 = no
- **Works in:** Trending regimes
- **Fails in:** Chop (false breakouts)

---

## Scoring Methodology

### Rolling Window
- **Window:** 20 trading days (1 month)
- **Update:** Daily at market close
- **Per ticker:** Each indicator gets a rolling accuracy % (correct signals / total signals in window)

### Regime Classification Logic

Score the 6 indicators into two groups:
- **Trend indicators:** MA Trend + MACD Momentum + Breakout (3 signals)
- **Mean-reversion indicators:** RSI + S/R + (inverse of Breakout failure rate) (3 signals)

| Trend Avg Accuracy | Mean-Rev Avg Accuracy | Regime Call |
|--------------------|-----------------------|-------------|
| > 60% | < 50% | **Trending** ✅ — use Shannon framework aggressively |
| < 50% | > 60% | **Range/Chop** 🔄 — shift to mean-reversion entries |
| < 50% | < 50% | **High Vol Transition** ⚠️ — reduce size, widen stops, cash up |
| > 55% | > 55% | **Goldilocks** 🎯 — most indicators working, deploy confidently |

### Regime Change Alert
When the rolling accuracy of the DOMINANT group (whichever was working) drops below 50% for 5 consecutive days → **REGIME CHANGE SIGNAL**

This gets flagged in the weekly report and the daily proforma notes.

---

## Implementation Status

**Backfilled from historical data** (1 year, 8 tickers, ~45 scored days each after SMA200 lookback).

### DB Schema (LIVE)
```sql
-- Raw indicator signals + outcomes
CREATE TABLE indicator_scores (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  ticker TEXT NOT NULL,
  indicator TEXT NOT NULL,     -- 'ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'
  signal_direction TEXT,       -- 'bullish', 'bearish', 'neutral'
  signal_value REAL,           -- the indicator value that generated the signal
  outcome INTEGER,             -- 1 = correct, 0 = incorrect
  outcome_date TEXT,           -- when the outcome was scored (5 days forward)
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date, ticker, indicator)
);

-- Rolling 20-day regime classification
CREATE TABLE regime_summary (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  ticker TEXT NOT NULL,
  ma_trend_acc REAL,
  rsi_reversion_acc REAL,
  macd_momentum_acc REAL,
  volume_confirm_acc REAL,
  sr_hold_acc REAL,
  breakout_acc REAL,
  trend_avg REAL,              -- avg of MA + MACD + Breakout accuracy
  meanrev_avg REAL,            -- avg of RSI + S/R accuracy
  regime TEXT,                 -- 'trending', 'chop', 'transition', 'goldilocks', 'mixed'
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date, ticker)
);
```

### Query Current Regimes
```javascript
cd /home/vamsi/tiger-trading && node -e "
const db = require('better-sqlite3')('portfolio/data/portfolio.db');
const regimes = db.prepare('SELECT ticker, regime, trend_avg, meanrev_avg, ma_trend_acc, rsi_reversion_acc, macd_momentum_acc, volume_confirm_acc, sr_hold_acc, breakout_acc FROM regime_summary WHERE date = (SELECT MAX(date) FROM regime_summary) ORDER BY ticker').all();
regimes.forEach(r => console.log(JSON.stringify(r)));
"
```

### Integration with Proforma Cron
The 11 AM proforma reads current regime and adjusts Gate 2 weights:
- **Trending:** MA alignment and MACD are HIGH-CONFIDENCE. RSI overbought is LOW-CONFIDENCE (trends persist).
- **Chop:** RSI extremes and S/R levels are HIGH-CONFIDENCE. MA crossovers are LOW-CONFIDENCE (whipsaw).
- **Transition:** ALL indicators LOW-CONFIDENCE. Reduce position sizes, require 4:1 R/R instead of 3:1.
- **Goldilocks:** Most indicators working. Deploy with standard 3:1 criteria.

---

## What Changes in Practice

**Today (no regime awareness):**
> "NVT passes Gate 2 — Stage 2, MAs aligned, RSI 54. Propose entry."

**With regime awareness:**
> "NVT passes Gate 2 — Stage 2, MAs aligned, RSI 54. **Regime: Trending (MA signal 72% accurate, breakout 65% accurate over 20d).** MA alignment is a HIGH-CONFIDENCE signal in current regime. Propose entry."

OR:

> "NVT passes Gate 2 — Stage 2, MAs aligned, RSI 54. **Regime: Chop (MA signal 38% accurate, RSI reversion 71% accurate over 20d).** ⚠️ MA alignment is LOW-CONFIDENCE in current regime — breakouts failing. Wait for RSI < 40 pullback to support instead."

---

## Open Questions for the Group

1. **5-day forward look** — is this the right window for scoring? Longer (10d) captures more but is slower to detect changes. Shorter (3d) is noisier but faster.
2. **Per-ticker vs market-wide regime?** Propose per-ticker (each stock can be in its own regime) PLUS market-wide (SPY/QQQ as the macro regime). Trade selection uses the intersection.
3. **How much should regime override the 3-gate system?** Proposal: regime adjusts the WEIGHTS within Gate 2, not the gates themselves. A "chop regime" doesn't skip Gate 2 — it changes which indicators get more weight.
4. **Minimum data before regime calls?** Need 20 trading days of scores before the system can make reliable calls. That means ~4 weeks of data collection before it's useful.

---

---

## Macro Regime Layer (Added Feb 16)

Per Poorna's insight: "Rising tide lifts all boats." We need market-wide context alongside per-ticker regimes.

### Two Macro Dimensions

**1. Monetary Conditions (Loose vs Tight)**
Measured via 20-day trends in:
- **10Y Treasury yield (^TNX):** Falling = loosening, rising = tightening
- **US Dollar Index (DX-Y.NYB):** Weakening = loosening, strengthening = tightening
- **TLT (20+ yr bonds):** Rising = rates falling = loosening
- **VIX level:** <18 = loose, >25 = tight

Score: -1 (tight) to +1 (loose). Classification: >0.25 = loose, <-0.25 = tight, else neutral.

**2. Market Sentiment (Risk-On vs Risk-Off)**
Measured via 20-day trends in ratios:
- **IWM/SPY:** Small caps outperforming = risk-on
- **XLK/XLU:** Tech over utilities = risk-on
- **XLK/XLP:** Tech over staples = risk-on (Poorna's observation: staples rallying like memes = risk-off)
- **HYG/LQD:** High yield over IG bonds = risk-on
- **GLD/SPY:** Gold outperforming = risk-OFF (inverted)

Score: -1 (risk-off) to +1 (risk-on). Classification: >0.25 = risk-on, <-0.25 = risk-off, else neutral.

### Combined Macro Regime

| Monetary | Sentiment | Macro Regime | Portfolio Action |
|----------|-----------|-------------|------------------|
| Loose | Risk-on | **BULLISH** 🟢 | Lean in. Deploy cash. Standard 3:1 R/R. |
| Loose | Risk-off | **CAUTIOUS** 🟡 | Money available but hiding. Deploy selectively, smaller starters. |
| Tight | Risk-on | **CAUTIOUS** 🟡 | Fighting the Fed. Dangerous. Tighter stops, 4:1 R/R. |
| Tight | Risk-off | **BEARISH** 🔴 | Preserve capital. Cash > positions. Only highest-conviction. |
| Neutral | Any / Any | **NEUTRAL** ⚪ | Standard criteria. |

### Current State (as of Feb 13, 2026)
**CAUTIOUS** — Monetary conditions are LOOSE (yields falling, dollar weakening, score +75%) but sentiment is RISK-OFF (gold outperforming, staples/utilities leading over tech, small caps lagging, score -60%). This confirms Poorna's observation: money is available but rotating into defensive sectors.

### DB Table
```sql
macro_regime (date, spy_price, tlt_price, iwm_price, hyg_price, lqd_price,
  xlk_price, xlp_price, xlu_price, gld_price, dxy_price, tnx_yield, vix_price,
  iwm_spy_ratio, xlk_xlu_ratio, xlk_xlp_ratio, hyg_lqd_ratio, gld_spy_ratio,
  monetary_score, sentiment_score, monetary_regime, sentiment_regime, macro_regime)
```

### Integration with Trade Selection
The 11 AM proforma reads macro regime from DB. Combined with per-ticker regime:
- **Macro BULLISH + Ticker TRENDING:** Maximum conviction. Full position sizing.
- **Macro CAUTIOUS + Ticker GOLDILOCKS:** Starters only. Wait for confirmation.
- **Macro BEARISH + any ticker regime:** Cash. Only add if 5:1 R/R.

*Last updated: Feb 16, 2026*
