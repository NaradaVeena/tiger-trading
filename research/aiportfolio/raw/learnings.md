# Tiger Portfolio — Learnings Log

## Process Discipline (Permanent Rules)
- **Conversations are ephemeral.** Any decision or framework change MUST be documented in the appropriate file (TRADE-SELECTION.md, REGIME-DETECTION.md, RULES.md, CONTEXT.md) AND wired into the relevant cron job. If it's not in a file that a cron reads, it doesn't exist.
- **DB is single source of truth for watchlist.** Never hardcode ticker lists in cron jobs, context files, or skills. Query the thesis table.
- **Verify the full chain.** When adding a new capability: (1) document it, (2) wire it into the cron, (3) verify the cron reads the doc, (4) verify the cron queries the data.

## Feb 14, 2026 (Inception)
- Portfolio created. $100K all cash. SMH benchmark at $407.72.
- Kedar's VP analysis on ALAB: POC $89.23 (long-term), VAH $182.75, VAL $84.78. Current price in thin air below value area.
- Kedar: "for short-term trade, r/r here is low but rules for trading may not apply if doing long term"
- Lesson: Two different games. Long-term hold vs short-term trade have different entry criteria. But no reason to be sloppy about entries either way.

## Feb 15, 2026
- Anirudh's DD questions led to 4 parallel research agents. Key findings:
  - CRDO's biggest customer is Amazon, NOT Microsoft (was 86% at peak, now 42%)
  - ALAB: no fraud red flags. 49% drop = valuation compression from 100x+ P/E, not fundamentals. CFO departure orderly.
  - FN vs COHR: different value chain layers (COHR designs, FN manufactures NVDA's designs). "100% share" = NVDA self-designed 1.6T only.
  - Space datacenters (Elon): not a threat. 20+ years away. Cooling HARDER in space.
- Anirudh's top 3 for 3-year hold: values founder-led + moat durability. My picks: ALAB, CRDO, NVT.
- Amazon ALAB warrant details: 3.26M shares at $142.82, expires Feb 2033, vests on $6.5B purchases.
- Poorna confirmed TA-focused. Shared ALAB breakdown chart. Wants SMA 5/20/50/200 on all charts.
- Poorna's framework: "Fundamentals say what to buy, technicals say when to buy. Alert on contradictory signals."
- Current contradiction: ALAB fundamentals say buy, technicals say wait. Below all SMAs, below VP value area.
- Vamsee = process maven. Wants plan-first workflow, token efficiency, insight loops, maintained skills.
- Vamsi: "Don't let benchmark chase influence picks or rush cash deployment."
- GLW (Corning) suggested by Poorna — validated in expansion screen as top 4 pick (Meta $6B deal).
- VP feature built into chart tool. Visual polish pass done in browser.
- Context silo architecture designed to prevent cross-thread contamination.
- **"News follows price"** (Poorna, Feb 16): Surprises tend to happen in the direction of price action. News aligning with stage = confirmation. News contradicting stage = real signal worth investigating. Baked into TRADE-SELECTION.md scorecard.
- **Conversations are ephemeral** — if you say "I'll bake this in," do it NOW or it doesn't exist. Don't promise future work without immediately writing to a persistent file that a cron reads.
- **"Price has memory"** (Poorna, Feb 16): High-volume levels = trapped participants. Breakouts through major VP nodes are explosive because trapped supply/demand clears. Failed breakouts at volume nodes are equally significant. Baked into TRADE-SELECTION.md Gate 2e (S/R + Polarity).
