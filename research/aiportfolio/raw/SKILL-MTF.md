---
name: technical-analysis-multiple-timeframes
description: "Apply Brian Shannon's multiple timeframe technical analysis framework to evaluate stocks. Use this skill whenever the user asks to analyze a stock technically, evaluate chart patterns, identify market stages, assess trend strength, determine support/resistance levels, analyze volume patterns, interpret moving averages, find entry/exit points, or perform any kind of technical analysis on equities. Also trigger when the user mentions terms like 'stage analysis', 'accumulation', 'distribution', 'markup', 'decline', 'breakout', 'pullback', 'moving average alignment', or 'multiple timeframes'. This skill should be used even for casual questions like 'what does the chart look like' or 'is this a good entry point'."
---

# Technical Analysis Using Multiple Timeframes

This skill encodes Brian Shannon's momentum-based trend trading methodology. The core philosophy: enter a stock as it begins a renewed trending campaign within a primary trend, with low risk and high profit potential.

## Two Essential Questions for Every Trade

Before any trade, answer:
1. **Where has the stock come from?** — Identify support (longs) or resistance (shorts) to determine risk and set stops based on objective price observation.
2. **Where does the stock have the potential to go?** — Determine approximate price targets where the stock could travel.

**Only take the trade when profit potential is sufficient relative to perceived risk (minimum 3:1 ratio).** Buy on strength as renewed momentum begins. Sell short on weakness as renewed downward momentum begins.

## Three Foundational Principles

1. **The market is a discounting mechanism** — it anticipates future events. Analysis must be anticipatory, not reactionary. Use market structure to determine potential future outcomes.
2. **Prices move in trends** — once established, a trend is more likely to continue than reverse. This is the basis of trend identification and participation.
3. **History rhymes** — similar patterns repeat, but the exact pattern rarely recurs. Always account for all possible outcomes and have a predetermined exit level.

## Core Framework: The Four Market Stages

Read `references/four-stages.md` for detailed stage identification rules, moving average signatures, volume characteristics, and trading strategies for each stage.

**Quick Stage Reference:**
- **Stage 1 (Accumulation):** Post-decline base building. MAs crossing, flat/declining long-term MA. No trend edge — stay out or watch for late-stage clues.
- **Stage 2 (Markup/Uptrend):** Higher highs, higher lows. Short-term MA > intermediate MA > long-term MA, all rising. Trade the long side aggressively.
- **Stage 3 (Distribution):** Post-uptrend topping. MA crossovers begin, volatility without progress. Reduce exposure, tighten stops, prepare for breakdown.
- **Stage 4 (Decline/Downtrend):** Lower highs, lower lows. Short-term MA < intermediate MA < long-term MA, all declining. Trade short or stay out.

## Multiple Timeframe Alignment

The highest-probability trades occur when trends align across multiple timeframes. When in doubt about trend direction, defer to the next larger timeframe.

**Key principles:**
- Longer-term trends exert the most force
- Short-term corrections within a longer-term trend typically resolve in the direction of the longer-term trend
- The lowest-risk, highest-probability trades come when trading in the direction of the primary trend
- For short-term traders (1-10 days), the primary trend is found on the daily timeframe
- For long-term investors, weekly and monthly timeframes are most relevant

**Required timeframes for analysis (minimum 3):**
- **Monthly** — primary secular trend context (Stage identification, wave structure)
- **Weekly** — intermediate momentum, correction vs reversal determination
- **Daily** — entry/exit timing, near-term structure

Do NOT skip the monthly timeframe. It provides critical context for whether a correction is normal within a secular trend or the beginning of a structural reversal.

Read `references/trends-and-timeframes.md` for trend identification, trend lines, corrections, and consolidation analysis.

## Support and Resistance

Read `references/support-resistance.md` for detailed rules on identifying, evaluating, and trading around support and resistance levels.

**Critical rules:**
- Once broken, support tends to act as resistance; once broken, resistance tends to act as support (Polarity Principle)
- **Actively check for polarity flips in every analysis.** Don't just list S/R levels — identify which ones have recently flipped roles and what that confirms. A former resistance level that holds as support on a pullback is a *bullish confirmation* that the breakout was real. Missing this leads to bearish bias errors.
- Strength of S/R influenced by: time to form, volume during formation, and recency
- The more times a level is tested, the more likely it is to break
- Use S/R to determine potential levels of buying/selling imbalances, not as exact buy/sell triggers

## Volume Analysis

Read `references/volume-analysis.md` for complete volume interpretation rules across all four stages.

**Key volume rules:**
- Volume confirms or rejects price direction — it is NOT a timing signal
- Healthy uptrend: increasing volume on rallies, diminishing volume on pullbacks
- Rallies on decreasing volume = suspect; volume expanding on pullbacks = question trend strength
- Big volume without further price progress in trend direction = distribution/accumulation signal
- Large volume after extended trending often signals exhaustion and turning point

## Volume Profile Integration

When Volume Profile data is available (POC, VAH, VAL), incorporate it into S/R analysis:
- **POC (Point of Control):** Highest-volume price node — acts as a magnet. Strong support/resistance.
- **VAH/VAL (Value Area High/Low):** The 70% value area boundaries. Price outside the value area is in "thin air" — less support, more volatile.
- **Confluence:** VP levels that align with MAs or horizontal S/R are highest-conviction zones. Example: POC + SMA200 at the same price = institutional-grade support.
- **Thin VP zones:** Price ranges with minimal volume history = air pockets. Breakdowns through thin VP accelerate because there are no natural buyers.

## Moving Averages

Read `references/moving-averages.md` for moving average interpretation and usage rules.

**Key MA rules:**
- MAs help identify trends; they are not buy/sell signals on their own
- **MA slope is as important or MORE important than MA level.** A stock 50% above a steeply rising 200-day is structurally different from one 50% above a flat 200-day. The rising slope means the "gravitational pull" is itself moving up rapidly, reducing effective extension risk. Always assess slope alongside distance.
- MA crossovers represent indecision — a time to be out of the market, not to initiate trades
- The slope of longer-term MAs indicates the dominant trend; failed rallies are more likely when the longer-term MA has a negative slope
- Price action ultimately determines all buy/sell decisions; MAs and volume provide supporting context

**Death Cross / Golden Cross:**
- Death cross (50-day crosses below 200-day) = confirmed intermediate weakness. Per Shannon, this is a period of indecision — do NOT initiate new longs during a death cross.
- Golden cross (50-day crosses back above 200-day) = intermediate trend turning bullish. Confirmation signal, not entry signal — wait for pullback after golden cross.
- Always check the **slope of the 200-day** independently. A death cross with a still-rising 200-day is less bearish than one with a declining 200-day.

## Intraday Price Action (Candle Structure)

Do NOT just look at the daily candle color. Examine the intraday structure:

**Gap Analysis:**
- **Gap-and-go:** Opens with a gap, continues in the gap direction, closes near highs. Strong signal — institutional conviction.
- **Gap-and-fade:** Opens with a gap, reverses intraday, closes well below the open (for gap-ups) or well above (for gap-downs). This is a **rejection signal** — sellers (or buyers) showed up at the gap level. Upper/lower wicks tell the story.
- **Gap-and-fill:** Price returns to fill the gap entirely. Negates the gap signal. Watch whether the gap-fill level then acts as support (bullish) or fails (bearish).

**Key candle patterns to flag:**
- Long upper wick on a rally day = sellers emerged at higher prices (supply)
- Long lower wick on a selloff day = buyers emerged at lower prices (demand)
- Wide-range reversal candle on high volume = potential exhaustion / turning point
- Doji after extended move = indecision, potential reversal

**Earnings gaps deserve extra scrutiny.** A stock that gaps up on earnings but closes well below the open ("gap and fade") means the market evaluated the news and decided it wasn't good enough at that price. This is a more bearish signal than a simple down day.

## Insider Activity & Institutional Flow

Technical analysis does not exist in a vacuum. Two smart-money signals to incorporate:

**Insider selling during uptrends:**
- Significant insider selling during a Stage 2 advance or positive news cycle = potential distribution signal
- "Smart money selling to dumb money" — institutions reducing while retail is buying
- Not all insider selling is bearish (planned sales, diversification), but **clusters of insider sells near highs** warrant caution
- Cross-reference with volume: insider selling + distribution volume pattern = high-conviction warning

**Institutional accumulation during bases:**
- Rising institutional ownership during a Stage 1 base = smart money accumulating ahead of a move
- 13F filings lag by 45 days — use as confirmation, not timing

## Emotional Discipline

Emotions are the enemy in trading. The market cycle of emotions runs: Disbelief → Hope → Optimism → Belief → Thrill → Euphoria → Complacency → Anxiety → Denial → Panic → Capitulation → Anger → Depression → Disbelief.

Recognize emotional influence on your decisions and refocus on price action. Do not allow emotions into the decision-making process.

## How to Apply This Skill

When analyzing a stock:

1. **Start with the monthly chart** — identify the secular trend and wave structure. Is this a primary uptrend, downtrend, or range?
2. **Move to the weekly chart** — identify the current stage, intermediate momentum (RSI, MACD, ADX), and whether the correction/advance is normal within the monthly context
3. **Zoom to the daily chart** — identify near-term stage, MA alignment, and entry/exit timing
4. **Check MA crossovers** — any death cross or golden cross? What's the slope of the 200-day?
5. **Examine intraday candle structure** — any gap-and-fade patterns? Wicks telling a different story than the candle body?
6. **Assess volume patterns** — does volume confirm the current price action? Any distribution or exhaustion signals?
7. **Integrate Volume Profile** — where are the high-volume nodes (support) and thin air (risk)?
8. **Locate key support and resistance levels** — combine horizontal S/R, VP levels, and dynamic MA levels
9. **Check insider/institutional activity** — any smart-money signals that confirm or contradict the chart?
10. **Determine risk/reward** — where is the stop (recent swing low/high) and where is the target (next S/R level)? **Must be at least 3:1.** If it's not, define the price level where it WOULD be 3:1 and set alerts.
11. **Provide a clear recommendation** — stage, trend direction, key levels, and whether conditions favor a trade. Be honest about what's ambiguous.

## Multi-Timeframe Alignment Scoring

Rate alignment as:
- **Full alignment (3/3):** Monthly, weekly, daily all confirm same direction. Highest probability.
- **Partial alignment (2/3):** Two timeframes agree, one is ambiguous or transitioning. Actionable with tighter risk management.
- **No alignment (<2/3):** Timeframes conflict. Stay out. "When in doubt, stay out."

Present alignment in a table:

| Timeframe | Stage | Trend | MAs | Volume | Bias |
|-----------|-------|-------|-----|--------|------|
| Monthly   |       |       |     |        |      |
| Weekly    |       |       |     |        |      |
| Daily     |       |       |     |        |      |

## Anti-Patterns (Mistakes to Avoid)

1. **Skipping the monthly timeframe.** Missing the secular context leads to wrong stage identification.
2. **Calling a daily candle bullish without checking intraday action.** A green candle that opened at the high and closed near the low is NOT bullish.
3. **Ignoring death crosses.** "MA crossovers represent indecision" — respect this.
4. **Treating the 200-day SMA as support when price is below it.** If price has broken below the 200-day, it becomes resistance until reclaimed.
5. **Cherry-picking the R/R scenario that works.** If the natural stop and natural target don't give 3:1, the trade doesn't qualify. Don't widen the target or tighten the stop to make the math work.
6. **Being too bullish too early on stage transitions.** "Early Stage 2" is not "confirmed Stage 2." Wait for the MA stack to fully align and for price to hold above the breakout level on a retest.
7. **Ignoring insider selling patterns.** Technical and smart-money signals that agree are high conviction. Divergences (chart says buy, insiders say sell) warrant extra caution.

## Extension Risk Assessment

Quantify how extended a stock is from key moving averages:

**200-day MA distance:**
- <15% above: Normal Stage 2 positioning
- 15-30% above: Extended — pullback risk elevated
- 30%+ above: Extreme extension — "the further a stock travels from a valid level of support, the riskier purchases are regardless of trend maturity"

Always state the percentage distance from the 200-day MA explicitly. This makes extension risk tangible rather than vague ("well above" is lazy — give the number).

**Analyst consensus — data point, not gospel:**
- Analyst consensus is wrong more often than right — it's a lagging indicator that follows price, not leads it
- When price significantly *exceeds* consensus, it can be a **contrary bullish indicator** — the street hasn't caught up to what the market is pricing in, and re-rating is ahead
- When price is far *below* consensus, it can similarly mean the street is too optimistic
- Include an analyst landscape table when data is available for context, but never use consensus as a price ceiling or floor
- Treat large divergences between price and consensus as a signal to investigate *why* the gap exists, not as proof the stock is over/undervalued

## Earnings Gap Reversal Signal

A specific high-conviction distribution pattern:
- Stock gaps UP on earnings beat
- Hits new high intraday
- Reverses and closes well below the open (long upper wick)
- Volume is significantly above average (>30%)

This is "smart money selling to dumb money" — institutions using the liquidity of positive news to distribute positions. Per Shannon: "positive news stories, stock splits, analyst upgrades are released but rally attempts are met with supply from large holders paring positions."

**How to weight it:**
- Single earnings reversal = yellow flag, not a sell signal
- Earnings reversal + subsequent failure to reclaim the high = Stage 3 warning
- Earnings reversal + heavy volume on further declines = distribution confirmed

Also watch for **island reversals** — if a gap-up reversal is followed by a gap-down, the stock becomes isolated above recent prices, creating a bearish island pattern.

## Output Format

Every analysis should include:

### 1. Header
```
# [TICKER] — [Company Name] Technical Analysis
**Last Updated**: [Date]
**Current Price**: [Price] | **52-Week Range**: [Low] – [High]
**Market Cap**: [Cap]
**50-Day MA**: [Value] | **200-Day MA**: [Value] | **Distance from 200d**: [X%]
```

### 2. Executive Summary
2-3 sentences: overall stage, bias, actionable or not, key risk.

### 3. Timeframe Analysis (3 sections)

Each timeframe gets:
- **Trend Direction/Quality**
- **Key Observations** (MAs, price structure, volume)
- **Major Levels**
- **Educational Note** — what this specific timeframe teaches us about the stock's current position. Not generic TA education — specific to THIS chart. Example: "The 43% extension from the 200-day MA means mean reversion creates gravitational pull, making new entries at this level carry elevated risk relative to reward."

#### 📊 Monthly Chart (Long-term Structure)
#### 📈 Weekly Chart (Intermediate Momentum)
#### 📉 Daily Chart (Near-term Context)

### 4. Technical Alignment Assessment
Multi-timeframe alignment table + narrative on how timeframes agree or conflict.

| Timeframe | Stage | Trend | MAs | Volume | Bias |
|-----------|-------|-------|-----|--------|------|
| Monthly   |       |       |     |        |      |
| Weekly    |       |       |     |        |      |
| Daily     |       |       |     |        |      |

### 5. Key Levels to Monitor
- **Resistance** table (descending) with level, significance, and what happens if breached
- **Support** table (ascending) with level, significance, and what happens if lost
- **Moving Average Framework** table with MA, level, slope, and interpretation

### 6. R/R Scenarios
At least 2 entry scenarios with explicit stop, target, and ratio. Mark pass/fail vs 3:1.

### 7. Analyst Landscape (when available)
Table of recent ratings, price targets, dates. Note consensus average and implied upside/downside.

### 8. Research Considerations
3-5 questions or observations that connect technical structure to fundamental context. Bridge the chart to the business — capacity ramps, legal disputes, customer concentration, earnings trajectory, etc. This is where TA meets reality.

### 9. Limitations & Context
- Data precision caveats (MA calculation differences across platforms)
- Extraordinary conditions (parabolic moves, macro events, sector rotation)
- Indicator limitations (what data wasn't available)
- Next catalyst dates (earnings, ex-dividend, etc.)
- Standard disclaimer

### 10. Recommendation
Clear verdict with:
- Action plan (entry, stop, targets)
- Invalidation level (what kills the thesis)
- Shannon Framework Alignment Score (factor-by-factor table)
