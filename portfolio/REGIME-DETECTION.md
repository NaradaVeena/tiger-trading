# 🐯 Regime Detection & Indicator Scoring System

**Proposed by:** Poorna B  
**Date:** Feb 16, 2026  
**Status:** PROPOSAL — awaiting group review

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

## Implementation Plan

### Phase 1: Data Collection (Week 1)
- Add `indicator_scores` table to portfolio DB
- Daily cron (after 2 PM lock) computes and stores scores for each ticker
- Schema:
```sql
CREATE TABLE indicator_scores (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  ticker TEXT NOT NULL,
  indicator TEXT NOT NULL,     -- 'ma_trend', 'rsi_reversion', 'macd_momentum', 'volume_confirm', 'sr_hold', 'breakout'
  signal_direction TEXT,       -- 'bullish', 'bearish', 'neutral'
  signal_value REAL,           -- the indicator value that generated the signal
  outcome INTEGER,             -- 1 = correct, 0 = incorrect, NULL = pending (within 5-day window)
  outcome_date TEXT,           -- when the outcome was scored
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Phase 2: Scoring Engine (Week 2)
- Backfill 20 days of historical scores using chart data
- Build rolling accuracy calculator
- Add regime classification logic

### Phase 3: Reporting (Week 3)
- Weekly regime report to Tigerrr group
- Per-ticker indicator heatmap (which indicators are working for which names)
- Regime dashboard widget on the portal

### Phase 4: Integration (Week 4)
- Proforma cron reads current regime before scoring
- Trade selection criteria adjusts based on regime:
  - **Trending:** Weight MA alignment + breakout signals heavily, relax RSI overbought concern
  - **Chop:** Weight RSI extremes + S/R levels, skip breakout entries, tighter targets
  - **Transition:** Reduce position sizes, widen stops, require higher conviction threshold

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

*This is a proposal for group review. Implementation begins after approval.*
