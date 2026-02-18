# Nokia (NOK) — AI Infrastructure Deep Dive
## Date: February 18, 2026

---

## 1. BUSINESS OVERVIEW

**What Nokia actually is today:** A Finnish telecom infrastructure company (~€30.8B market cap) that has pivoted from mobile phones to network infrastructure equipment. Think of them as a plumbing company for telecommunications and increasingly for data centers.

### Revenue Breakdown (FY 2025 — €19.9B total, +2% YoY constant currency)

| Segment | FY 2025 Revenue | % of Total | YoY Growth |
|---------|----------------|-----------|------------|
| Network Infrastructure | €7.99B | ~40% | +9% (CC) |
| Mobile Networks | €7.81B | ~39% | Flat |
| Cloud & Network Services | €2.61B | ~13% | +6% |
| Nokia Technologies (patents) | €1.50B | ~8% | -21% |

**Key financial metrics (FY 2025):**
- Comparable operating profit: €2.0B (down 22% YoY) — margin 10.2%
- Comparable gross margin: 45.1% (down 200bps YoY)
- Q4 comparable gross margin: 48.1% (improving trend)
- Free cash flow: €1.5B (+36% YoY), FCF conversion 72%
- Net cash: €3.4B (strong balance sheet, D/E ~0.33x)
- Comparable EPS: €0.29 (down 26% YoY)
- Investment-grade: BBB+ (S&P), Baa2 (Moody's)

**Recent corporate actions:**
- **Infinera acquisition** ($2.3B, completed Feb 2025) — optical networking specialist with hyperscaler relationships
- **NVIDIA $1B equity investment** (Oct 2025) — 2.9% stake at $6.01/share, strategic partnership for AI-native RAN and 6G
- **New strategy** (Capital Markets Day, Nov 2025) — consolidating into 2 segments: Network Infrastructure + Mobile Infrastructure
- **2028 target:** €2.7–3.2B comparable operating profit (up to 60% increase from 2025)

---

## 2. AI INFRASTRUCTURE ANGLE

### Where Nokia fits in the AI datacenter buildout:

**Nokia's AI/DC relevance falls into THREE areas:**

**A. Optical Transport (DCI — Data Center Interconnect) — PRIMARY**
- This is the real AI play. Post-Infinera acquisition, Nokia is a top-3 optical networking vendor globally
- Optical Networks grew **14% FY25, 17% in Q4** — the fastest-growing sub-segment
- AI/Cloud customers now account for **14% of Network Infrastructure net sales** (~$1.1B+ run rate)
- Infinera brought deep hyperscaler relationships — 9 of 10 largest cloud providers now use Nokia technology
- Products: PSE-6s coherent DSP, high-capacity C+L band systems for inter-DC connectivity

**B. Datacenter Switching (IP Networks) — EMERGING**
- Nokia 7220 IXR and 7250 IXR switch families — targeting AI fabric networking
- New 7220 IXR-H6 (800G Ethernet, shipping Q1 2026) designed specifically for AI data centers
- SR Linux NOS (Service Router Linux) — open, programmable network OS gaining traction
- Event-Driven Automation (EDA) platform for DC lifecycle management
- Partnership with Supermicro for integrated AI-optimized DC networking solutions
- Ultra Ethernet Consortium (UEC) member — demonstrated UET traffic on Nokia switches (Oct 2025)

**C. NVIDIA Partnership — STRATEGIC VALIDATION**
- NVIDIA's $1B investment is a powerful signal: Jensen doesn't invest in commodity plays
- Joint work on AI-native RAN, 6G platforms on NVIDIA hardware
- This is more about telco AI (RAN optimization) than datacenter fabric, but opens doors

### How Nokia compares to peers in DC networking:

| Vendor | DC Switching Share | AI Fabric Focus | Moat |
|--------|-------------------|-----------------|------|
| **Arista** | ~21% (#1 with hyperscalers) | Deep — primary AI fabric vendor | Software (EOS), hyperscaler lock-in |
| **Cisco** | ~30% (total switch market) | Broad but losing AI fabric share | Scale, installed base |
| **NVIDIA Spectrum-X** | Rising fast (~rivaling Arista Q1'25) | Purpose-built for AI training | Vertical integration with GPUs |
| **Nokia** | **<5% in DC switching** | Emerging — nascent | Optical + IP combo, SR Linux differentiation |

**Honest assessment:** Nokia is NOT competing head-to-head with Arista or NVIDIA Spectrum-X in AI datacenter fabric switching. That's not where their AI story is. Their AI angle is **optical transport between data centers** (DCI) and increasingly **within mega-campuses**. This is a real, growing market — but it's a different layer of the stack.

---

## 3. FUNDAMENTAL DD — 6 PILLARS

### Pillar 1: Growth & Margins
- **Revenue trajectory:** €19.9B FY25 (+2% CC), guided flat-to-modest growth FY26
- **Network Infrastructure (the AI piece):** Growing 9% — the bright spot
- **Mobile Networks (39% of revenue):** Flat — mature, commoditizing
- **Gross margin:** 45.1% comparable (FY25), declining from 47.1% prior year due to product mix
- **Q4 showed improvement** to 48.1% — suggesting mix is shifting favorably
- **Operating margin:** 10.2% comparable — mediocre for a tech company
- **2028 target:** 13-17% operating margin in Network Infrastructure
- **Verdict:** Slow grower with one fast-growing segment. Not an AI growth story — it's an AI optionality story on a legacy base.

### Pillar 2: Customer Concentration
- **CSPs (traditional telcos):** Still the majority of revenue — AT&T, Verizon, Deutsche Telekom, etc.
- **Hyperscalers/Cloud:** Growing to 14% of Network Infrastructure (~$1.1B) — Microsoft, Google, Amazon, Meta
- **9 of 10 top cloud providers** are Nokia customers (post-Infinera)
- **Risk:** Still heavily dependent on telco capex cycles, which are notoriously lumpy
- **Positive:** Diversifying toward cloud/AI customers reduces single-customer risk

### Pillar 3: Moat Analysis
- **Patents/IP:** ~20,000 patent families, strong licensing business (Nokia Technologies)
- **Optical networking depth:** Post-Infinera, Nokia has deep vertical integration in coherent optics (PSE-6s DSP)
- **SR Linux NOS:** Open, microservices-based network OS — differentiated vs. legacy NOS but unproven at scale in DC
- **R&D scale:** €4B+ annual R&D spend — significant, but spread across mobile + infrastructure
- **Switching moats are WEAK:** No hyperscaler lock-in, minimal installed base in DC switching vs. Arista
- **Verdict:** Moderate moat in optical transport, weak moat in DC switching, strong patent portfolio

### Pillar 4: Management Quality
- **CEO Justin Hotard** (since April 2025) — ex-HPE, Hewlett Packard Enterprise's server/HPC division
  - Datacenter DNA is promising — understands hyperscaler buying behavior
  - Driving simplification: 4 segments → 2 segments
  - Early but showing strategic clarity (Infinera deal, NVIDIA partnership happened under watch)
- **CFO Marco Wirén** — conservative, disciplined on guidance
- **Board quality:** NVIDIA now has a seat at the table (2.9% stake)
- **Concern:** Nokia has a history of overpromising and underdelivering. Multiple prior "transformation" stories
- **Verdict:** New management looks competent; track record TBD. NVIDIA endorsement is meaningful.

### Pillar 5: Competitive Positioning
- **In optical DCI:** Strong #2-3 position globally (behind Ciena, alongside Huawei). Infinera was a bolt-on that strengthened this
- **In DC switching:** Distant challenger. Not in Gartner Leaders quadrant for DC switches (Cisco, Arista, Juniper, Huawei lead)
- **In mobile networks:** #2-3 globally behind Ericsson and Huawei (but Huawei banned in many Western markets)
- **In private wireless:** 1,000+ enterprise deployments — niche but growing
- **Differentiation:** Only vendor offering end-to-end optical + IP + automation for DC networking
- **Verdict:** Strong in optical transport, competitive in mobile, marginal in DC switching

### Pillar 6: Bull / Bear / Invalidation

**Bull case ($9-10+ by 2027):**
- AI datacenter buildout drives optical DCI spending to $15B+ TAM by 2028
- Nokia captures disproportionate share via Infinera integration + NVIDIA partnership
- DC switching gains traction with SR Linux + 800G product cycle
- Mobile Networks stabilizes; 6G cycle begins 2028+
- Operating leverage kicks in: 15%+ margins by 2028
- Multiple re-rates from "legacy telco" to "AI infrastructure"

**Bear case ($4-5):**
- AI capex slows or concentrates on GPU/compute, not networking
- Arista and Cisco dominate DC switching; Nokia can't break in
- Mobile Networks continues secular decline; 5G cycle is over
- Infinera integration dilutes margins without delivering revenue synergies
- Nokia Technologies licensing revenue erodes as patents expire
- Management executes another failed transformation

**Invalidation triggers:**
- AI/Cloud revenue growth decelerates below 10% for 2 consecutive quarters
- Loss of major hyperscaler optical contracts
- Gross margin consistently below 43%
- NVIDIA sells its stake

---

## 4. ELEPHANT RISK

**Who could vertically integrate Nokia's function?**

- **NVIDIA** — Already building Spectrum-X for DC fabric. Could they do optical? Less likely — optics is a different physics game. More likely they remain a partner (hence the investment)
- **Broadcom** — Builds merchant silicon for switches; could vertically integrate switching + optics (already has Tomahawk + optical DSP capabilities). This is the REAL threat
- **Hyperscalers themselves** — Google, Meta, Microsoft all design custom switches. Could they do optical? Some already do (Google DCI). Nokia's optical depth is harder to replicate than switching
- **Ciena** — Direct optical competitor, but smaller and not integrating into switching

**Moat against vertical integration:**
- Optical coherent DSP design is genuinely hard (small club: Nokia/Infinera, Ciena, Huawei, Marvell)
- Hyperscalers prefer multi-vendor optical supply chains for leverage
- End-to-end optical + IP + automation is a harder stack to replicate than just switching
- **But:** Nokia's DC switching moat is thin — anyone with Broadcom/Marvell silicon can build a switch

---

## 5. TECHNICAL SNAPSHOT

| Metric | Value |
|--------|-------|
| **Current price (NYSE)** | ~$7.04 (Feb 16, 2026) |
| **52-week range** | $4.00 – $8.19 |
| **Position in range** | 72% (upper half) |
| **Fair value estimate** | €5.43 (Simply Wall St) — stock trades above at €5.83 |
| **P/E (comparable)** | ~37.7x — elevated |
| **Dividend yield** | ~2.1% |
| **Market cap** | ~$33B / €30.8B |

**Stage analysis (Shannon framework):**
- Stock ran from ~$4 (early 2025) to $8.19 (late Oct 2025 on NVIDIA news), pulled back to ~$6.30 after Q4 guidance miss
- Currently consolidating around $7.00 — appears to be in **Stage 2 (advancing)** with a pullback/consolidation phase
- The $8.19 NVIDIA-spike high needs to be retested and cleared for continuation
- Support at ~$6.00-6.30 (post-earnings low)

**Key SMAs:** Stock likely above 200-day SMA (which would be around $5.50-6.00 given the 2025 run), likely near or slightly above 50-day SMA (~$6.50-7.00 range)

**Analyst consensus:** JPMorgan raised PT to $8.20 (Overweight). Santander upgraded. Average target ~$7.01 per MarketBeat.

---

## 6. DOES NOKIA FIT A CONCENTRATED AI INFRASTRUCTURE PORTFOLIO?

### Honest Assessment:

**Nokia is NOT a picks-and-shovels AI infrastructure play with a hardware moat.** Here's why:

1. **Only ~14% of Network Infrastructure revenue ($1.1B) comes from AI/Cloud customers.** On a total company basis, that's roughly **5-6% of total revenue.** The other 94% is legacy telco.

2. **In DC switching (the hot AI networking market), Nokia is a marginal player.** They're not in the same league as Arista (21% share, hyperscaler incumbent) or NVIDIA Spectrum-X (vertically integrated with GPUs).

3. **The real AI angle is optical DCI** — a legitimate, growing market, but Nokia is one of several players (Ciena is the pure-play). It's not a moated position.

4. **The NVIDIA partnership is impressive but overhyped.** NVIDIA invested $1B at $6.01/share — a modest 2.9% stake. The strategic collaboration is mainly about 6G/RAN AI, not datacenter networking. NVIDIA has similar partnerships with many companies.

5. **Valuation is stretched for what you're getting:** P/E of 37.7x for a company with declining operating profit (-22% YoY), flat-to-low-single-digit revenue growth, and a 2-3 year runway to maybe hit 15% operating margins.

6. **This is fundamentally a legacy telecom equipment company with AI optionality.** The optionality is real (Infinera, NVIDIA, optical/DC switching products), but it's early-stage and unproven at scale.

### What Nokia IS good for:
- A **value play** on AI infrastructure at a lower price point than Arista ($7 vs. $100+)
- Exposure to **optical DCI buildout** (real tailwind)
- An **NVIDIA-endorsed** telecom infrastructure play (validation)
- **Decent balance sheet** (net cash, investment grade, dividend)
- Possible **multiple re-rating** if AI/Cloud revenue accelerates to 20%+ of total

### What it's NOT:
- A core holding in a concentrated AI infrastructure portfolio
- A high-conviction picks-and-shovels play (too much legacy telco dilution)
- A competitor to Arista or NVIDIA in the AI fabric buildout

---

## VERDICT: WATCH (Not Buy, Not Pass)

**Rating: WATCH — with a potential upgrade to BUY on pullback to $5.50-6.00**

**Reasoning:**
- The AI optionality is real but small (5-6% of total revenue)
- The NVIDIA endorsement is meaningful but not decisive
- Valuation at 37.7x P/E doesn't compensate you for execution risk on a turnaround story
- For a **concentrated** AI infrastructure portfolio, you want companies where AI is 50%+ of the thesis, not 5-6%
- If you already hold Arista (pure AI networking), Vertiv (power/cooling), and NVIDIA (compute), Nokia adds marginal AI exposure with a lot of telco baggage

**Would consider adding if:**
- Stock pulls back to $5.50-6.00 range (25-30x forward PE)
- AI/Cloud revenue crosses 20% of Network Infrastructure revenue
- DC switching product gains a named hyperscaler win
- 2026 results show operating margin expansion toward 12%+

**Better alternatives for concentrated AI infrastructure:**
- **Arista Networks (ANET)** — pure-play AI datacenter networking
- **Ciena (CIEN)** — pure-play optical for DC interconnect (more focused AI exposure than Nokia)
- **Vertiv (VRT)** — power/cooling infrastructure
- **Celestica (CLS)** — HW manufacturing for AI infrastructure

---

*Nokia is an interesting company going through genuine transformation, but for a concentrated portfolio, "interesting" isn't enough. You need conviction, and Nokia's AI story is too diluted by legacy telco to warrant a core position today.*
