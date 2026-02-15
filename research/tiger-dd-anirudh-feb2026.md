# Tiger Portfolio — Due Diligence Report
### Prepared for Anirudh | February 14, 2026

---

## 1. Growth & Margins Overview

| Ticker | Company | YoY Rev Growth | Gross Margin | Notes |
|--------|---------|---------------|-------------|-------|
| **CRDO** | Credo Technology | **+272%** | ~62-64% | Hypergrowth, AEC dominance |
| **ALAB** | Astera Labs | **+92%** | 75.7% | Connectivity/CXL leader |
| **FN** | Fabrinet | **+36%** | 12.4% | Contract mfg (structural) |
| **NVT** | nVent Electric | **+35%** | ~38.6% | Liquid cooling for DCs |
| **PWR** | Quanta Services | **+24%** | ~15% | Services model (structural) |
| **COHR** | Coherent Corp | **+17-22%** | 36.9-39% | Optical/photonics |

FN and PWR have structurally lower margins by design — FN is contract manufacturing, PWR is electrical services. Their edge is asset efficiency and scale, not margin expansion.

---

## 2. Customer Concentration Risk

| Ticker | Largest Customer | Top Customer % | Risk Level |
|--------|-----------------|---------------|------------|
| **CRDO** | Amazon (not MSFT) | 42% (was 86% at peak) | 🔴 High but improving |
| **ALAB** | Amazon (AWS) | Top 3 = ~80% | 🔴 High |
| **FN** | NVIDIA | ~35% (top 2 >50%) | 🔴 High |
| **COHR** | Diversified | No single >12% | 🟢 Healthy |
| **NVT** | Diversified | No single >12% | 🟢 Healthy |
| **PWR** | Diversified | No single >12% | 🟢 Healthy |

**CRDO detail:** Amazon is actually the #1 customer (confirmed via AWS CEO photos of Trainium racks with Credo cables). Concentration peaked at 86% in FQ3 FY25, now down to 42% with 4 customers >10% (Amazon 42%, likely Microsoft 24%, xAI 16%, Meta 11%). A 5th hyperscaler started initial revenue in FQ2 FY26. Trend is clearly improving but still very concentrated in AI capex.

**ALAB detail:** Amazon relationship deepened with a **$6.5B cumulative purchase warrant** (3.26M shares at $142.82, expires 2033). Microsoft confirmed for CXL memory. Google, NVIDIA, AMD, Intel all confirmed partners. Expanding from 1 to 3+ hyperscalers for Scorpio switches in 2026.

**FN detail:** NVIDIA at 35% is the key risk, but the relationship is actually deepening — NVIDIA's goal to increase self-production of optical modules from 15-20% → 50%+ is *bullish* for FN since FN manufactures those in-house designs. AWS partnership and DCI growth are diversifying.

---

## 3. Space Datacenters Impact (Elon's Plans)

**Bottom line: Not a real threat. 20+ years away at minimum.**

Per ESPI (European Space Policy Institute), competitive space datacenters are decades out. Key reasons:

- **Cooling is HARDER in space**, not easier — no fluid convection, only radiative cooling. NVT's liquid cooling expertise could actually be *more* valuable in space.
- Starship hasn't reached stable orbit yet for cargo missions at the scale needed.
- Electronic components degrade within ~5 years from radiation exposure.
- No repair or maintenance capability exists in orbit.
- The economics don't work — terrestrial DCs cost ~$10-15/watt, space would be orders of magnitude higher.

**Impact by ticker:**
- **NVT:** Cooling needed MORE in space, not less. No threat.
- **ALAB/CRDO:** Chip-to-chip connectivity is physics-agnostic — needed whether racks are on Earth or in orbit. No threat.
- **FN:** Optical interconnects needed regardless of location. No threat.

This is sci-fi on Musk's timeline. Our picks are safe.

---

## 4. ALAB Deep Dive

### What caused the ~49% stock decline?

- **All-time high:** $251.88 (Sept 18, 2025), intraday peak $262.90
- **Current:** ~$129-134 (Feb 14, 2026)
- **Drivers:**
  - Valuation compression from extreme multiples (100x+ P/E)
  - Q3 earnings selloff (Nov 2025) despite beating consensus — buy-side whisper numbers were higher
  - Fresh **10% drop post-Q4 earnings** (Feb 10-11, 2026) on margin compression guidance and CFO departure
  - Rising opex from acquisitions and Israel R&D expansion
- **NOT a fundamental deterioration** — revenue still growing 92% YoY with 75.7% gross margins

### CFO Departure

- **Mike Tate** retiring, effective March 2, 2026 (notified Feb 4)
- **Successor:** Desmond Lynch, current CFO of Rambus — $500K base + $9M equity package
- 8-K explicitly states "no disagreements" and "not related to operations, policies, or practices"
- Tate staying on as Strategic Advisor to CEO through Sept 2026
- **Assessment:** Orderly transition. Suboptimal timing alongside earnings, but no red flags.

### Fraud Concerns

**🟢 Clean bill of health.** No SEC investigations, no short seller reports (Hindenburg/Muddy Waters/Citron), no class-action lawsuits, no auditor changes, no whistleblower complaints. Warrant accounting is complex but legitimate.

### Hyperscaler Adoption

| Hyperscaler | Status | Products |
|-------------|--------|----------|
| **Amazon (AWS)** | ✅ Major customer | Smart fabric switches, signal conditioning, optical engines. $6.5B warrant. |
| **Microsoft (Azure)** | ✅ Confirmed | First-ever CXL memory deployment (Leo controllers for M-Series VMs) |
| **Google** | ✅ Confirmed partner | — |
| **NVIDIA** | ✅ Confirmed partner | — |
| **AMD, Intel** | ✅ Confirmed partners | — |

Scorpio switches expanding from 1 hyperscaler to 3+ in 2026.

---

## 5. FN (Fabrinet) Deep Dive

### Gross Margins

- **~12% gross margin, ~10% operating margin** — stable in a 1% band for 5+ years
- This is 2-3x higher than broad EMS peers (Jabil/Flex at 4-5% operating)
- 12% IS the structural contract manufacturing margin — this isn't being "squeezed" by NVIDIA
- FN's edge is precision optical specialization, not IP ownership
- **$0 R&D spend** — customers fund the engineering, FN executes

### NVIDIA Reliance

- NVIDIA = **35% of FY2024 revenue** (up from 12.5% prior year)
- Top 3 customers = 51.5% of Q1 FY2026 revenue
- **Key insight:** NVIDIA wants to increase in-house optical module production from 15-20% → 50%+. This is actually BULLISH for FN because FN is who manufactures NVIDIA's self-designed modules.
- AWS partnership and DCI (data center interconnect) growth are diversifying revenue.

### Optical Transceiver Landscape

**Who made transceivers for NVIDIA's older chips?**
- 400G era: **Innolight** dominated merchant transceivers
- 800G era: **Coherent** took #1 merchant position
- FN manufactured NVIDIA's smaller self-designed portion — this role has grown dramatically

**Who makes transceivers for AMD and others?**
- AMD does NOT self-design transceivers — AMD systems use standard merchant modules (Innolight, Coherent)
- Broadcom and Marvell supply DSP silicon that goes INSIDE transceivers (different layer)
- Marvell has its own COLORZ coherent modules (partly manufactured by Fabrinet)

### FN vs COHR — Different Parts of the Value Chain

This is the critical distinction:
- **Coherent** = designs + manufactures its own branded transceivers (vertical)
- **Fabrinet** = contract manufactures NVIDIA's in-house designs (horizontal)
- Any "100% market share" claim refers ONLY to NVIDIA's self-designed 1.6T stream, not the total transceiver market
- Coherent is actually a **Fabrinet customer** for some products AND an emerging NVIDIA second source
- They're both partner and emerging competitor — complex relationship

### "Asset Light" Claim

- Normal-state capex: **2-3% of revenue** (currently 4.5% due to Building 10 expansion)
- Compare: Coherent 8-12%, Lumentum 6-10%
- Why lower: customers often provide/fund specialized equipment, $0 R&D, Thailand construction costs are a fraction of US
- **Zero debt, $969M cash**
- Better described as **"asset efficient"** than truly "asset light"

---

## 6. CRDO (Credo Technology) Deep Dive

### Customer Concentration History

| Quarter | Largest Customer | % of Revenue | # of >10% Customers |
|---------|-----------------|-------------|---------------------|
| FQ2 FY25 (Oct '24) | Amazon | ~25-30% | 3 |
| FQ3 FY25 (Jan '25) | Amazon | **86%** | 1 (extreme ramp) |
| FQ4 FY25 (May '25) | Amazon | **61%** | 3 (61%, 12%, 11%) |
| FQ1 FY26 (Aug '25) | Amazon | ~35% | 3 |
| FQ2 FY26 (Nov '25) | Amazon | **42%** | 4 (42%, 24%, 16%, 11%) |

**Full FY2025 10-K:** One customer = 67% of total annual revenue.

### Confirmed Hyperscaler Customers

1. **Amazon/AWS** — #1 by far (AECs for AI clusters, Trainium racks)
2. **Microsoft/Azure** — #2 or #3, >10% revenue
3. **xAI (Musk)** — Colossus data center uses Credo purple AEC cables
4. **Meta** — Ramped to >10% in FQ2 FY26 (confirmed via OCP rack photos)
5. **5th hyperscaler** — Initial revenue started FQ2 FY26 (possibly Google or Oracle)

### Product Mix

- **AECs (Active Electrical Cables):** ~90%+ of product revenue — the bread and butter
- **Line card retimers:** Networking OEMs, hyperscalers
- **Optical DSPs:** 10+ optical module vendors
- **SerDes IP licensing:** <5% of revenue, deprioritized
- **PCIe retimers:** New product, first ODM commitment, production revenue expected CY2026

### Market Position

- **88% market share in AECs** (650 Group estimate) — massive moat
- Provides pricing power and high switching costs
- But 93% of revenue still comes from just 4 hyperscalers — this is fundamentally an AI capex cycle play

---

## Summary: Risk Matrix

| Ticker | Growth | Margins | Concentration | Space DC Risk | Overall |
|--------|--------|---------|---------------|---------------|---------|
| **ALAB** | 🟢 92% | 🟢 75.7% | 🟡 High but diversifying | 🟢 None | Strong pick |
| **CRDO** | 🟢 272% | 🟢 62% | 🔴 Very high (improving) | 🟢 None | High risk/reward |
| **FN** | 🟢 36% | 🟡 12% (structural) | 🟡 NVDA 35% | 🟢 None | Solid, watch NVDA |
| **NVT** | 🟢 35% | 🟢 38.6% | 🟢 Diversified | 🟢 None (bullish) | Clean profile |
| **COHR** | 🟡 17-22% | 🟢 37-39% | 🟢 Diversified | 🟢 None | Weakened chart |
| **PWR** | 🟡 24% | 🟡 15% (structural) | 🟢 Diversified | 🟢 None | Near ATH, pricey |

---

*Report compiled by Narada 🪕 | Tiger Portfolio | February 14, 2026*
*Dashboard: narada.galigutta.com/aiportfolio/*
