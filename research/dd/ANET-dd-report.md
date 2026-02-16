# ANET — Arista Networks | Full Due Diligence Report

**Date:** February 16, 2026
**Analyst:** Narada (Tiger Portfolio)
**Status:** Watchlist Candidate

---

## Core Thesis

Arista Networks is the dominant Ethernet networking platform for hyperscale data centers and is now the primary beneficiary of the AI infrastructure buildout, riding the 400G/800G upgrade cycle as Ethernet displaces InfiniBand for AI back-end fabrics. With a $9B revenue base growing 29% YoY, a 64% gross margin software-like business model built on merchant silicon, and a TAM expanding from $50B to $100B+ by 2029 (AI networking + campus), Arista is a rare compounder with both secular tailwinds and a widening moat via EOS.

---

## Key Metrics (as of Q4 2025 / FY2025)

| Metric | Value |
|---|---|
| **Q4 2025 Revenue** | $2.488B (+28.9% YoY) |
| **FY2025 Revenue** | $9.006B (+28.6% YoY) |
| **FY2024 Revenue** | $7.0B (+19.5% YoY) |
| **GAAP Gross Margin (FY2025)** | 64.1% (flat YoY) |
| **GAAP Gross Margin (Q4 2025)** | 62.9% |
| **Non-GAAP Operating Margin** | ~47% |
| **Q4 2025 Net Income** | $956M (38.4% of revenue) |
| **Cash on Hand** | $10.74B (+29.4% YoY) |
| **Revenue Backlog** | $6.8B |
| **FY2026 Revenue Guidance** | $11.25B (+25% YoY) |
| **AI Networking Revenue (FY2025)** | ~$1.63B |
| **AI Networking Target (FY2026)** | $3.25B (doubling) |
| **Campus Networking (FY2025)** | ~$815M |
| **Campus Networking Target (FY2026)** | ~$1.25B |
| **Trailing P/E** | ~52x |
| **Forward P/E** | ~43x |
| **Market Cap** | ~$165B (at ~$131/share) |
| **Cumulative Ports Shipped** | 150M+ |
| **Total Customers** | ~11,000 |

---

## Pillar 1: Growth & Margins

### Revenue Trajectory
- **Q4 2025:** $2.488B, +28.9% YoY, +7.8% QoQ — strong acceleration
- **FY2025:** $9.006B, +28.6% YoY — just crossed the $9B mark
- **FY2024:** $7.0B, +19.5% YoY
- **FY2023:** $5.86B, +33.8% YoY
- Guidance: **$11.25B for FY2026** (+25%), implying the $10B milestone will be hit ~2 years early

### Revenue by Segment (FY2025)
- **Cloud Titans (hyperscalers):** 48% → $4.32B (+28.6% YoY)
- **Enterprise & Financial:** 32% → $2.88B (+17.6% YoY)
- **Service Providers & Neocloud:** 20% → $1.8B (+51.3% YoY) — includes Apple, Oracle

### Product vs Services
- Q4 2025 product revenue: ~$2.1B (+30.3% YoY)
- Q4 2025 services revenue: $392M (+21.6% YoY)
- Software & services combined: 17.1% of revenue ($425M, +20.4% YoY)

### Margin Profile
- **GAAP Gross Margin:** 64.1% (FY2025, flat vs FY2024) — remarkably stable despite component inflation
- **Q4 2025 GM:** 62.9% (slight sequential compression from 64.6% in Q3, driven by product mix)
- **Non-GAAP Operating Margin:** ~47% — elite among hardware companies
- **Net margin:** 38.4% in Q4 — software-company territory
- **Historical GM trend:** 61.1% (2022) → 61.9% (2023) → 64.1% (2024) → 64.1% (2025) — expanding then stabilizing

### Assessment
🟢 **Outstanding.** ~29% growth at $9B scale with 64% gross margins is exceptional. The business has software-like economics built on hardware. Guidance for 25% growth to $11.25B shows durability. AI networking doubling to $3.25B is the growth engine.

---

## Pillar 2: Customer Concentration

### Top Customers (FY2025)
- **Microsoft:** 26% of revenue → $2.34B (+67.2% YoY)
- **Meta Platforms:** 16% of revenue → $1.44B (+40.9% YoY)
- **Combined:** 42% of total revenue from two customers

### Concentration Risk Rating: 🔴 HIGH

### Historical Context
- Microsoft has been a 10%+ customer since Arista went public (2014)
- Meta joined the 10% club in 2019
- Meta burned Arista in 2020-2021 when it skipped the 200G generation — caused a visible revenue dip
- **2026 outlook:** Arista expects 1-2 additional customers to cross the 10% threshold (likely Oracle, Apple, or a neocloud), which would diversify concentration

### Mitigating Factors
- Despite concentration, these are the most capex-rich companies on Earth — not going away
- AI capex cycle ensures multi-year spending commitments from hyperscalers
- Enterprise/Financial segment at 32% provides meaningful diversification
- Customer count approaching 11,000 — broad base outside top 2
- Neocloud segment (+51% YoY) is the fastest-growing and adds diversification

### Risk Assessment
The Meta skip in 2020-21 is the canonical example of concentration risk materializing. However, the structural position has improved: more customers approaching 10%+ threshold, campus expanding the enterprise base, and AI capex is a multi-year cycle. Still, a Microsoft budget pause would crater the stock.

---

## Pillar 3: Moat Analysis

### Moat Classification: WIDE

#### 1. EOS (Extensible Operating System) — Switching Costs
- **Single binary image** across all platforms — dramatically simplifies operations vs. Cisco's fragmented IOS/IOS-XE/NX-OS/IOS-XR
- Linux-based, single process space, in-memory state — allows non-disruptive upgrades
- Customers build automation, monitoring, and tooling around EOS APIs
- Once deployed at scale (10,000+ switches), rip-and-replace costs are prohibitive
- EOS is the primary reason cloud titans chose Arista over Cisco

#### 2. Merchant Silicon Strategy — Cost & Speed Advantage
- Uses Broadcom Memory (Memory chiplets) and other merchant silicon vs. Cisco's expensive custom ASICs
- Faster time-to-market on new speed generations (400G, 800G)
- Lower cost structure enables aggressive pricing while maintaining 64% gross margins
- Cisco's Silicon One response validates Arista's approach but took years to develop

#### 3. Cloud Titan Relationships — Network Effects
- Being the incumbent at Microsoft, Meta, and other hyperscalers creates a reference architecture effect
- New cloud builders (neoclouds) default to Arista because that's what the cloud titans run
- This is a flywheel: more deployments → more EOS features → more customers → larger ecosystem

#### 4. NOS Agnosticism
- Arista lets hyperscalers run their own network operating systems on Arista hardware
- This flexibility means Arista wins deals that NOS-locked competitors cannot
- Paradoxically, being willing to let customers NOT use EOS strengthens the relationship

#### 5. Software-Defined Networking Stack
- CloudVision (network management/telemetry), DANZ (monitoring), AVA (AI-driven analytics)
- These layers create additional stickiness beyond the switch hardware

### Why Can't Cisco/Juniper/Broadcom Compete Effectively?
- **Cisco:** Legacy codebase (NX-OS) is fragmented. Silicon One is catching up but 5+ years behind. Cisco's sales model (large sales teams, channel partners) has higher costs. Cisco has ~$55B in networking revenue but is losing share in high-speed DC switching.
- **Juniper:** Acquired by HPE (2024). Strong in service provider, but lacks cloud titan relationships. QFX line is distant #3 in DC switching.
- **Broadcom:** Supplies the silicon TO Arista — they're a supplier, not a competitor in branded switches (they do enable whitebox competitors)
- **Nvidia (Spectrum-X):** The real emerging threat. But by early 2026, Ethernet has captured 65%+ of new AI back-end deployments. Arista partners WITH Nvidia on many deployments.

---

## Pillar 4: Management

### Jayshree Ullal — CEO & Chairperson
- **Background:** Born London, raised New Delhi. MSEE from Santa Clara University. 15+ years at Cisco as SVP of Data Center, Server & Storage before joining Arista in 2008.
- **Tenure:** CEO since 2008 (~18 years). Led Arista from pre-revenue to $9B.
- **Track Record:** IPO in 2014 at ~$43/share → now ~$131 post-splits. Grew revenue from $361M (2013) to $9B (2025) — 25x in 12 years.
- **Board role:** Also serves on Snowflake's board.
- **Reputation:** Widely regarded as one of the best tech CEOs. No-nonsense operator. Sets ambitious targets and consistently beats them (e.g., $750M AI target → achieved $1.63B; originally said $10B by 2028 → hit it 2 years early).
- **Ownership:** ~5% of ANET (~$8B+ at current prices)

### Andy Bechtolsheim — Co-Founder & Former Chairman/Chief Architect
- **Background:** Co-founded Sun Microsystems, early Google investor ($100K check that became billions). Co-founded Arista in 2004 with David Cheriton and Kenneth Duda.
- **Ownership:** ~17% stake (~$28B value, earmarked for heirs)
- **⚠️ Red Flag — SEC Settlement (2024):** Settled insider trading charges related to purchases of Acacia Communications stock ahead of Cisco's acquisition. Paid ~$1M penalty. **Prohibited from serving as officer or director.** Stepped down as Chairman.
- **Current role:** No longer officer/director. Still a major shareholder. Kenneth Duda remains as CTO.

### Kenneth Duda — CTO & Co-Founder
- The architect of EOS. Stanford PhD. Hands-on technical leader.
- His continued presence ensures engineering excellence and culture continuity.

### Insider Ownership Summary
- Ullal: ~5%
- Bechtolsheim: ~17% (passive, no board role)
- David Cheriton (co-founder): significant stake (Stanford professor, early Google investor)
- **Combined founder/CEO ownership: 22%+** — extremely aligned with shareholders

### Assessment
🟢 **Excellent management.** Jayshree Ullal is an elite CEO with a flawless operating track record. The Bechtolsheim SEC issue is a blemish but doesn't affect operations (he's no longer involved in governance). Founder ownership at 22%+ is outstanding alignment.

---

## Pillar 5: Competitive Landscape

### Data Center Switching Market Share
- **Total DC Ethernet switching market:** ~$18B (2025), growing to ~$23B by 2031
- **Arista:** #1 in branded DC Ethernet switching market share. #1 in 100G, 200G, 400G, and 800G switching. Q1 2025 DC Ethernet share: ~21.3%.
- **Cisco:** Still #1 in total enterprise networking (~$55B overall), but losing share in high-speed DC switching. Silicon One closing the gap but behind.
- **Nvidia:** Emerged as a major DC Ethernet seller (Spectrum-X + Mellanox heritage). Passed Cisco in DC Ethernet in Q1 2025. Arista's primary competitive concern.
- **Juniper/HPE:** Distant #3. More service provider focused. HPE acquisition may help or hurt.
- **Whitebox (ODMs):** Celestica, Delta, etc. — gaining share, especially for hyperscalers' commodity tier.

### AI Networking Specifically
- **Ethernet vs. InfiniBand:** Ethernet has captured 65%+ of new AI back-end deployments by early 2026, up from near-zero in 2023. This is a massive win for Arista.
- **Ultra Ethernet Consortium (UEC):** Arista is a founding member. Industry push to make Ethernet competitive with InfiniBand for AI workloads (lossless, low-latency).
- **800G production:** Ramped in 2025. 800G port shipments tripled sequentially in Q2 2025. Arista leads in 800G branded market share.
- **1.6T roadmap:** Arista mentioned 1.6 terabit migration as imminent in Q4 2025 call. Co-designed AI rack systems coming.
- **AI revenue trajectory:** $1.63B (2025) → $3.25B guided (2026) — doubling. This is the primary growth vector.

### Campus Networking — New TAM
- Entered campus switching market in 2023 (challenging Cisco's stronghold)
- $815M in campus revenue in 2025, targeting $1.25B in 2026
- Campus TAM is ~$20B+ annually — Arista has <5% share today
- Unified EOS across DC and campus is the value proposition
- Long runway: every 1% of campus TAM = ~$200M incremental revenue

### TAM Expansion
- Arista's estimated TAM: $50B (2023) → $70B (2028) → $100B+ (2029)
- Driven by AI networking, campus, and edge/branch expansion
- Current $9B revenue = single-digit % penetration of TAM

---

## Pillar 6: Bull / Bear / Invalidation

### 🐂 Bull Case (5 Points)

1. **AI networking is a multi-year supercycle.** $1.63B → $3.25B → potentially $5B+ by 2027. Ethernet is winning vs. InfiniBand. Every new AI cluster needs Arista spine switches. 800G/1.6T upgrade cycles provide years of demand.

2. **Software margins on hardware revenue.** 64% gross margins with merchant silicon is structurally advantaged. As software/services mix increases (subscriptions, CloudVision, AVA), margins could expand further toward 67-70%.

3. **Campus is a new $20B+ TAM.** Arista has barely scratched the surface (<5% share). Unified EOS across DC+campus is a compelling proposition vs. Cisco's fragmented stack. $815M → $1.25B → potentially $3-4B in 3-5 years.

4. **Customer base diversifying.** Neoclouds (+51% YoY) are the fastest-growing segment. 1-2 additional 10%+ customers expected in 2026. Enterprise base provides ballast.

5. **$10.74B cash hoard with no debt.** Can pre-buy components (strategic advantage in tight supply), make acquisitions, and return capital via buybacks — all while self-funding growth.

### 🐻 Bear Case (5 Points)

1. **Customer concentration is severe.** Microsoft (26%) + Meta (16%) = 42% of revenue. A single budget pause from Microsoft would materially impact results. Meta already proved this risk in 2020-21.

2. **Valuation is demanding.** At 52x trailing P/E and 43x forward P/E, any growth deceleration gets punished severely. If AI capex cycle pauses, multiple compression from 50x to 30x = 40% drawdown.

3. **Nvidia Spectrum-X / NVLink threat.** Nvidia is vertically integrating networking into its GPU ecosystem. NVLink for ultra-high-bandwidth GPU-to-GPU, Spectrum-X for Ethernet. If Nvidia captures the back-end AI networking market, Arista's $3.25B AI target is at risk.

4. **Merchant silicon dependency.** Arista relies on Broadcom for switching ASICs. Broadcom has pricing power and could raise costs or prioritize its own customers. Broadcom's own networking ambitions (custom silicon for hyperscalers) could create channel conflict.

5. **Gross margin pressure in Q4 2025.** 62.9% GM in Q4 (vs. 64.6% in Q3) suggests product mix shifting toward lower-margin hardware-heavy AI deployments. If AI networking drives gross margins toward 60%, the "software-like" premium multiple erodes.

### ❌ Thesis Invalidation Triggers

1. **Microsoft or Meta revenue concentration drops >25% in a single year** — would indicate loss of a major customer relationship or budget reprioritization away from Arista (repeat of the 2020-21 Meta incident at larger scale).

2. **Gross margins compress below 60% for two consecutive quarters** — would indicate loss of pricing power, ASP degradation from whitebox competition, or Broadcom extracting more value from the supply chain. Kills the "software on hardware" thesis.

3. **AI networking revenue misses $3B in FY2026** — significant miss vs. $3.25B target would indicate Ethernet is losing share to InfiniBand/NVLink or that Nvidia Spectrum-X is winning, undermining the core AI growth catalyst.

4. **Cisco or Nvidia captures >30% share in 800G/1.6T DC Ethernet switching** — would indicate Arista's moat in high-speed switching is narrowing. Currently Arista leads; if share erodes meaningfully, the switching-cost moat narrative weakens.

---

## AI Infrastructure Supply Chain Position

Arista sits in a critical position in the AI infrastructure stack:

```
[GPU/Accelerators] → NVIDIA, AMD, custom ASICs
        ↓
[Networking Fabric] → ★ ARISTA (EOS + merchant silicon switches) ★
        ↓
[Storage/Memory] → Flash, HBM, DDR5
        ↓
[Compute/Servers] → Dell, HPE, Supermicro, ODMs
        ↓
[Cloud Platform] → Azure, AWS, Meta, Google, Neoclouds
```

**Key insight:** Every AI cluster needs networking. Whether you use NVIDIA GPUs, AMD MI-series, or custom TPUs/ASICs, they all need Ethernet switches to connect them. Arista is **GPU-agnostic** — it benefits regardless of which accelerator wins. This makes ANET a "picks and shovels" play on AI with less binary risk than GPU makers.

**Specific AI networking products:**
- **7800R series:** High-radix spine switches for AI clusters (400G/800G)
- **7060X series:** Leaf switches for AI racks
- **Etherlink:** AI-optimized Ethernet fabric with adaptive routing, congestion control
- **AVA (Autonomous Virtual Assist):** AI-driven network operations
- **CloudVision:** Centralized network management for AI/cloud infrastructure

---

## Verdict

**WATCH — Strong candidate for Tiger Portfolio watchlist.**

Arista is one of the highest-quality growth stories in tech infrastructure. The combination of 29% revenue growth, 64% gross margins, $10.7B cash, elite management, and exposure to the AI networking supercycle makes this a compelling long-term compounder.

**Key concerns keeping it at WATCH vs. BUY:**
- Valuation at 52x P/E requires continued execution perfection
- 42% customer concentration in Microsoft + Meta is a genuine risk
- Q4 GM compression (62.9%) needs monitoring — is it mix or structural?
- The stock declined ~4% on the strong Q4 report, suggesting high expectations are priced in

**Ideal entry:** Pullback to 40x forward P/E (~$115 area) or any significant customer scare that doesn't impair the fundamental thesis. Cash is a position.

---

*Report prepared for Tiger Portfolio internal use. Last updated: February 16, 2026.*
