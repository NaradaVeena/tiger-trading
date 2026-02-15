# Fabrinet (FN) — Investor Due Diligence Deep Dive
**Date: February 14, 2026**

---

## 1. Gross Margins — The Economics of Contract Manufacturing

### Current Margins
Fabrinet's gross margins are **thin but stable** — this is by design, not a flaw:

| Fiscal Year | Gross Margin | Operating Margin | Net Margin |
|---|---|---|---|
| FY2021 | 11.78% | 8.02% | 7.89% |
| FY2022 | 12.31% | 9.05% | 8.86% |
| FY2023 | 12.71% | 9.78% | 9.37% |
| FY2024 | 12.35% | 9.64% | 10.27% |
| FY2025 | 12.09% | 9.53% | 9.72% |
| TTM (Dec '25) | 12.01% | 9.70% | 9.69% |

*Source: S&P Global via StockAnalysis.com*

**Q2 FY2025:** 12.4% gross margin (down from 12.7% in Q1, per earnings call)
**Q1 FY2026:** 12.3% gross margin (down 30bps sequentially from FX headwinds + merit increases)

### Peer Comparison
- **Jabil (JBL):** ~8-9% gross margin, 4-5% operating margin
- **Flex (FLEX):** ~8% gross margin, 4-5% operating margin
- **Celestica (CLS):** ~10-12% gross margin
- **Foxconn:** 5-6% gross margin, 2-3% operating margin

**Key insight:** Fabrinet's operating margins (~10%) are **2-3x higher** than broad-based EMS players like Jabil/Flex/Foxconn (2-4%). This is because FN specializes in high-precision optical assembly where tolerances are measured in microns, commanding premium pricing vs. commodity electronics assembly.

### Is NVIDIA Squeezing Margins?
**Not really — but the model is inherently low-margin by design.** Fabrinet is a contract manufacturer. It doesn't own the IP or the designs. The value chain economics:

1. **NVIDIA designs** its own optical transceivers (via its acquisition of Mellanox and partnership with TFC Optical Communication, a Chinese design house)
2. **Fabrinet manufactures** them with precision assembly, testing, and quality control
3. **NVIDIA captures the IP premium** while FN earns a manufacturing margin

The 12% gross margin isn't "squeezed" — it's the structural reality of contract manufacturing. What makes FN special is that this 12% is **higher than peers** and remarkably **stable** (within a ~1% band for 5+ years), reflecting pricing power from specialization. Revenue growth, not margin expansion, is the story — FN compounds earnings through volume leverage.

---

## 2. NVIDIA Reliance — Customer Concentration Risk

### The Numbers
| Fiscal Year | NVIDIA as % of Revenue | NVIDIA Revenue (est.) |
|---|---|---|
| FY2023 | ~12.5% | ~$330M |
| FY2024 | **~35%** | **~$1.01B** |
| FY2025 | Estimated 30-40% | ~$1.0-1.4B |

*Source: Fabrinet 10-K (FY2024), optics.org reporting*

NVIDIA went from a modest customer to FN's **largest customer** in just one year, driven by the explosive ramp of 800G transceivers for AI clusters. In the FY2024 10-K, Cisco was the only other >10% customer.

By Q1 FY2026, the company disclosed that **3 customers = 51.5% of revenue** (up from 2 customers at 52.6% a year ago). NVIDIA is almost certainly the largest of these three.

### Diversification Efforts
FN is actively diversifying:
- **AWS partnership** (announced March 2025) — first direct hyperscaler relationship, with warrant for up to 1% of shares
- **DCI revenue** (Ciena, coherent ZR products) — grew 92% YoY to $138M in Q1 FY2026, now 14% of revenue
- **HPC category** — new $15M/quarter program ramping, expected to "scale considerably"
- **Telecom recovery** — record $412M in Q1 FY2026, up 59% YoY

### What If NVIDIA Leaves?
Three scenarios:
1. **NVIDIA switches to a different CM:** Unlikely near-term. Requalification takes 6-12+ months and costs millions in time-to-market delay. FN has sole-source status for a reason — 99.7% precision yields in optical packaging are hard to replicate.
2. **NVIDIA brings production in-house:** Extremely unlikely. NVIDIA is a fabless chip designer, not a manufacturer. They don't own factories and have no incentive to build clean rooms for optical assembly.
3. **NVIDIA diversifies suppliers (most likely):** Already happening. Coherent (COHR) was named a second source for NVIDIA's optical needs (previously sole-sourced to Fabrinet). Chinese vendors Innolight and Eoptolink supply ~60% of NVIDIA's merchant 800G transceiver volume. But FN serves a specific role — manufacturing NVIDIA's **in-house designed** transceivers, which is different from the merchant market.

**The real risk isn't NVIDIA leaving — it's NVIDIA's self-production expanding.** NVIDIA's current self-production rate (using the TFC-Fabrinet solution) accounts for 15-20% of its total optical module volume. NVIDIA aims to increase this to 50%+ by the mature stage of 1.6T (2026+). This is **bullish for Fabrinet** — more self-production = more volume through FN's factories.

---

## 3. Who Made Optical Transceivers for NVIDIA's Older Chips?

### The Supply Chain History

**400G era (InfiniBand NDR, ~2022-2023):**
- **Innolight** — dominant merchant supplier for 400G OSFP DR4 modules
- **Eoptolink** — secondary Chinese supplier
- **Fabrinet** — manufactured NVIDIA's in-house designed modules (via TFC Optical partnership)
- Note: Fabrinet was already in the picture but NVIDIA's self-production was a smaller share

**800G era (InfiniBand NDR/XDR, GB200, ~2024-2025):**
- **Innolight** — largest share of merchant 800G market (~40% global share)
- **Coherent** — took the #1 position for 800G specifically (per Cignal AI, Jan 2025)
- **Fabrinet/NVIDIA self-production** — third-largest source of 800G modules
- **Eoptolink** — ~20% of NVIDIA's 800G LPO orders
- **Lumentum** — smaller share, vertically integrated laser supply

**1.6T era (InfiniBand XDR, Blackwell Ultra, ~2025-2026+):**
- **Fabrinet** — primary manufacturing partner for NVIDIA's in-house 1.6T designs
- **Innolight, Eoptolink** — qualifying 1.6T merchant modules
- **Coherent, Lumentum** — Western suppliers providing ~40% of volume

**Key insight:** Fabrinet has been manufacturing for NVIDIA across multiple generations, but its importance has grown dramatically as NVIDIA expanded its self-designed transceiver program. Before that, NVIDIA primarily bought merchant transceivers from Innolight, Coherent, and others.

---

## 4. Who Makes Transceivers for AMD, Broadcom, Marvell?

### The Broader Ecosystem

**AMD:**
- AMD's networking play is through its **Pensando acquisition** (DPUs/SmartNICs) and participation in **UALink** (scale-up interconnect standard competing with NVLink)
- AMD does NOT self-design optical transceivers like NVIDIA does
- AMD-based systems use **standard merchant transceivers** from Innolight, Coherent, Eoptolink, Lumentum, etc.
- AMD relies on **Broadcom switching silicon** (Memory Fabric) rather than proprietary optical networking
- **Fabrinet has no known direct AMD transceiver relationship** — AMD customers buy standard pluggables from the merchant market

**Broadcom:**
- Broadcom is primarily a **DSP/switching silicon supplier** (Tomahawk 5 at 51.2T) — they design the chips INSIDE transceivers, not the transceivers themselves
- Broadcom DOES sell its own optical transceivers through the **legacy Avago/Broadcom fiber optics division** — these are manufactured in-house
- Broadcom's transceiver business is smaller than their silicon business
- Major transceiver makers (Innolight, Coherent, Eoptolink) buy Broadcom DSPs to put into their modules

**Marvell:**
- Marvell provides DSPs (Ara family) used inside transceivers — near-duopoly with Broadcom
- Marvell also has its own **COLORZ pluggable coherent transceivers** (800ZR/ZR+ for DCI), using Marvell silicon photonics — these are manufactured by contract partners including **Fabrinet**
- Marvell's coherent DSP + silicon photonics platform is a key differentiator

**Intel:**
- Intel's optical business was largely through **Intel Silicon Photonics** (Santa Clara)
- Intel sold/wound down much of its optical transceiver business
- Intel's remaining optical components serve niche markets

**The merchant transceiver market is dominated by:**
1. **Innolight** (~40% of 800G market share) — Chinese, Thailand manufacturing
2. **Coherent** (#1 in 800G specifically) — US-based, designs + manufactures
3. **Eoptolink** — Chinese, strong NVIDIA relationship
4. **Lumentum/Cloud Light** — acquired Cloud Light to re-enter datacom
5. **AAOI (Applied Optoelectronics)** — smaller player, Microsoft relationship
6. **Source Photonics, Accelink** — Chinese, smaller market share

---

## 5. FN vs COHR (Coherent) — The Actual Competitive Landscape

### They're Not Really Competitors — They're in Different Parts of the Value Chain

**Fabrinet = Contract Manufacturer (CM)**
- Doesn't design transceivers
- Manufactures for others (NVIDIA, Lumentum, Marvell, etc.)
- Gets paid a manufacturing fee; doesn't own the end product

**Coherent = Vertically Integrated Designer + Manufacturer**
- Designs its OWN transceiver products (800G, 1.6T)
- Manufactures them in its own facilities
- Sells under its own brand to hyperscalers and OEMs
- Also supplies key **components** (InP lasers) to other transceiver makers

### So How Does FN Claim "100% Market Share" in 1.6T?
**This claim (if made) refers specifically to NVIDIA's self-designed 1.6T transceivers, not the total 1.6T market.** Here's the breakdown:

The 1.6T transceiver market has two tracks:
1. **NVIDIA self-designed modules** → manufactured by **Fabrinet** (via TFC Optical design partnership) → FN may have near-100% share of THIS specific stream
2. **Merchant 1.6T modules** → designed and sold by **Coherent, Innolight, Eoptolink, Lumentum** → Fabrinet has 0% share of these (they're not FN's products)

**The COHR-FN relationship is actually symbiotic:**
- **Coherent was Fabrinet's customer** historically — FN manufactured transceivers for Coherent (and its predecessors Finisar, II-VI)
- Coherent was recently named as a **second source** supplier for NVIDIA's AI systems (previously sole-sourced to Fabrinet) — this is where they compete
- But Coherent designs its own modules while FN only manufactures NVIDIA's designs — different competitive position

**The real competitive landscape for 1.6T:**
| Vendor | Role | Share of 1.6T Market |
|---|---|---|
| Innolight | Design + manufacture | Expected largest share (~35-40%) |
| Coherent | Design + manufacture | Significant (Western #1) |
| Eoptolink | Design + manufacture | Growing share |
| Fabrinet/NVIDIA | Manufacture (FN) + Design (NVIDIA/TFC) | 15-20% of NVIDIA's total optical needs |
| Lumentum/Cloud Light | Design + manufacture | Emerging |

---

## 6. "Asset Light" Claim — How Real Is It?

### The CapEx Picture

| Fiscal Year | Revenue | CapEx | CapEx/Revenue |
|---|---|---|---|
| FY2021 | $1,879M | $46M | **2.5%** |
| FY2022 | $2,262M | $90M | **4.0%** |
| FY2023 | $2,645M | $61M | **2.3%** |
| FY2024 | $2,883M | $48M | **1.6%** |
| FY2025 | $3,419M | $121M | **3.5%** |
| TTM (Dec '25) | $3,893M | $176M | **4.5%** |

*Source: S&P Global via StockAnalysis.com. FY2025-TTM elevated due to Building 10 construction.*

**Normal-state capex/revenue: ~2-3%.** The current 4.5% is elevated due to the $110M+ Building 10 construction (2M sq ft expansion). This is a one-time capacity investment.

### Peer Comparison

| Company | Business | Typical CapEx/Revenue |
|---|---|---|
| **Fabrinet** | Precision optical CM | **2-3%** (normal), 4.5% (building phase) |
| **Jabil** | Broad EMS | 2-3% |
| **Flex** | Broad EMS | 2-3% |
| **Celestica** | EMS/HPS | 1.5-2.5% |
| **Foxconn** | Mass assembly | 3-5% |
| **Coherent** | Vertically integrated optics | **8-12%** |
| **Lumentum** | Laser/optics design + mfg | **6-10%** |

### Why "Asset Light" Is Somewhat Valid

1. **Customers fund the equipment:** Fabrinet's model is that **customers often provide or pay for specialized manufacturing equipment.** The clean rooms and factories are Fabrinet's, but much of the specialized optical assembly/test equipment is customer-owned or customer-funded. This is explicitly described in their 10-K — customers install their IP-protected equipment in FN's facilities.

2. **Thailand cost advantage:** Land and construction costs in Chonburi, Thailand are a fraction of what comparable facilities cost in the US, Japan, or even China. Building 10's 2M sq ft cost ~$110M — compare that to what a semiconductor fab costs.

3. **No IP/R&D spend:** FN spends essentially **$0 on R&D.** They don't design products. Compare to Coherent (~10-12% of revenue on R&D) or Lumentum (~15%). This is what makes FN fundamentally different from typical optical companies.

4. **Working capital, not fixed assets, is the main capital use:** FN's balance sheet is dominated by inventory and receivables, not PP&E. As of Dec 2025: $969M cash, zero debt.

### But Let's Be Honest...
FN **does** operate factories and clean rooms. Calling it "asset light" compared to a software company is absurd. But compared to **vertically integrated optical companies** (Coherent, Lumentum) that must invest in fabs, lasers, and R&D, Fabrinet IS relatively asset light. The better framing is: **"asset efficient" — high revenue per dollar of fixed assets, funded partly by customer-provided equipment.**

---

## Key Risks Summary

1. **NVIDIA concentration** — 30-40% of revenue; single-customer risk is real even if switching costs are high
2. **Margin compression** — 12% gross margin leaves little room for error; FX, labor inflation, or pricing pressure could squeeze
3. **Chinese competition** — Innolight/Eoptolink are taking share in the merchant transceiver market, potentially limiting FN's growth with non-NVIDIA customers
4. **Technology risk** — Co-packaged optics (CPO) could eventually reduce demand for pluggable transceivers that FN specializes in assembling (though this is 2027+ at the earliest)
5. **Valuation** — Trading at 47x earnings (as of late 2025), pricing in significant growth acceleration

## Bull Case
- AI supercycle drives multi-year demand for 1.6T → 3.2T transceivers
- Building 10 enables $5B+ revenue capacity
- AWS partnership + HPC diversify customer base
- NVIDIA self-production increasing = more volume through FN
- Irreplaceable precision manufacturing moat with 99.7% yields

---

*Sources: Fabrinet 10-K filings, earnings call transcripts (Q1 FY2026, Q2 FY2025), StockAnalysis.com (S&P Global data), Cignal AI, iamfabian.substack.com (optical market analysis), deepfundamental.substack.com, optics.org, investingwhisperer.com, everyticker.com (formerly BeyondSPX)*
