# Tiger Portfolio — Learnings

## 2026-02-13
- Don't do math in prose — let the database handle arithmetic
- LEAPS on extended charts = paying premium to lose (theta decay while waiting for pullback)
- Volume profile is the single best tool for avoiding whale traps

## 2026-02-14
- Key levels documented for all watchlist tickers
- Cash is a position — no rush to deploy

## 2026-02-16
- Regime detection system designed and backfilled
- Different indicators work in different regimes — don't apply trending tools in chop
- News follows price (Poorna): surprises happen in the direction of price action
- Analyst consensus is a data point, not a gate — can be contrary indicator
- "Price has memory" — high-volume levels represent trapped participants

## 2026-02-17
- Presidents' Day was Feb 16 (Monday) — markets closed. Feb 17 (Tuesday) markets open.
- Daily update incorrectly labeled Feb 17 as Presidents' Day — corrected.
- Regime data was stale (last update Feb 6) — needs regular daily updates.
- ALAB continuing Stage 4 decline (-4% on Feb 17), confirming "news follows price" thesis.
- NVT showing strength (+2.9%), approaching $121 breakout level.
- **Analysis theater kills portfolios.** 11 AM cron analyzed tickers for 3 days without executing `cli.js proforma`. Process must execute, not just evaluate.
- **Don't trade on after-hours headlines.** NVIDIA-Meta deal looked like ANET displacement at first glance. Deeper research revealed dual-fabric architecture (DSF vs NSF) — complementary, not competitive.
- **Verify sub-agent claims against primary sources.** Sub-agents reported NVIDIA as current #1 in DC Ethernet revenue; actual data shows briefly #1 in Q2 2025, now #3. Don't repeat peak numbers as current state.
- **Not all DC switches are fungible.** Scheduled fabric (Arista DSF/7700R4) vs whitebox ASIC (Spectrum-X in FBOSS) serve fundamentally different roles. Market share numbers that lump them together are misleading.
- **Kedar: daily channel break, not intraday.** Don't react to intraday wicks. Wait for daily close below channel to confirm break. Discipline > speed.
- **After substantive group discussions, prompt for thesis evolution updates.** Don't let conversation insights evaporate — persist to thesis DB + evolution log.
- **"Dancing with elephants" (Poorna):** Every watchlist name sells to hyperscalers/NVIDIA. Any elephant can decide to make its own shovels. Elephant risk must be a standing section in every thesis — who could vertically integrate, and what's the moat against it? Added to Gate 1 in TRADE-SELECTION.md.
