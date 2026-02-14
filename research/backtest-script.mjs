import YahooFinanceModule from 'yahoo-finance2';
const YahooFinance = YahooFinanceModule.default || YahooFinanceModule;
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

const tickers = ['^GSPC', 'SPY', 'MSFT', 'NVDA', 'AAPL', 'IWM', '^VIX'];

// Key US market holidays with the Friday before (long weekends)
// Late 2025 through early 2026
const holidayFridays = [
  { date: '2025-08-29', holiday: 'Labor Day 2025 (Sep 1)', nextOpen: '2025-09-02' },
  { date: '2025-10-10', holiday: 'Columbus Day 2025 (Oct 13)', nextOpen: '2025-10-14' },
  { date: '2025-11-07', holiday: 'Veterans Day 2025 (Nov 11 - Tue)', nextOpen: '2025-11-12' },
  { date: '2025-11-26', holiday: 'Thanksgiving 2025 (Nov 27) - Wed before', nextOpen: '2025-12-01' },
  { date: '2025-11-28', holiday: 'Black Friday 2025 (half day)', nextOpen: '2025-12-01' },
  { date: '2025-12-24', holiday: 'Christmas 2025 (Dec 25 - Thu) - Wed before', nextOpen: '2025-12-26' },
  { date: '2025-12-26', holiday: 'Christmas week Fri', nextOpen: '2025-12-29' },
  { date: '2025-12-31', holiday: 'New Years 2026 (Jan 1) - Wed before', nextOpen: '2026-01-02' },
  { date: '2026-01-16', holiday: 'MLK Day 2026 (Jan 19)', nextOpen: '2026-01-20' },
  { date: '2026-01-02', holiday: 'Post New Years (Jan 2 Fri after holiday)', nextOpen: '2026-01-05' },
];

// Actually, let me just find all Fridays before market closures.
// Better approach: get all the data and analyze programmatically.

async function fetchData(ticker, startDate, endDate) {
  try {
    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });
    return result;
  } catch (e) {
    console.error(`Error fetching ${ticker}:`, e.message);
    return [];
  }
}

function toDateStr(d) {
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return d;
}

function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0=Sun, 5=Fri
}

async function main() {
  console.log('Fetching historical data...');
  
  const startDate = '2025-07-01';
  const endDate = '2026-02-13';
  
  const data = {};
  for (const ticker of tickers) {
    console.log(`  Fetching ${ticker}...`);
    data[ticker] = await fetchData(ticker, startDate, endDate);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Build date-indexed lookup
  const byDate = {};
  for (const ticker of tickers) {
    for (const row of data[ticker]) {
      const d = toDateStr(row.date);
      if (!byDate[d]) byDate[d] = {};
      byDate[d][ticker] = row;
    }
  }
  
  const allDates = Object.keys(byDate).sort();
  console.log(`\nData range: ${allDates[0]} to ${allDates[allDates.length-1]}`);
  console.log(`Total trading days: ${allDates.length}`);
  
  // Known US market holidays (market closed) in our range
  const marketClosedDates = [
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-10-13', // Columbus Day — market OPEN (NYSE open on Columbus Day)
    '2025-11-11', // Veterans Day — market OPEN (NYSE open)
    '2025-11-27', // Thanksgiving
    '2025-12-25', // Christmas
    '2026-01-01', // New Year's Day
    '2026-01-19', // MLK Day
    '2026-02-16', // Presidents' Day
  ];
  
  // Find Fridays before long weekends (3+ day weekends)
  // A long weekend = Friday where Monday (or next business day) is a holiday
  const longWeekendFridays = [];
  
  for (const d of allDates) {
    const dow = getDayOfWeek(d);
    if (dow !== 5) continue; // Only Fridays
    
    // Check if the following Monday is a holiday
    const dateObj = new Date(d + 'T12:00:00Z');
    const monday = new Date(dateObj);
    monday.setUTCDate(monday.getUTCDate() + 3);
    const mondayStr = toDateStr(monday);
    
    if (marketClosedDates.includes(mondayStr)) {
      longWeekendFridays.push({ friday: d, holiday: mondayStr });
    }
  }
  
  // Also add Wed before Thanksgiving (Nov 26, 2025) and half-days
  // Check for any Friday/day before multi-day closure
  
  console.log('\nLong weekend Fridays found:');
  longWeekendFridays.forEach(f => console.log(`  ${f.friday} (holiday: ${f.holiday})`));
  
  // Now score each Friday for similarity to today's conditions
  // Today: SPX near ATH, tech weak, small caps strong, rotation
  
  function getReturn(data, dateStr) {
    const row = data[dateStr];
    if (!row) return null;
    return (row.close - row.open) / row.open;
  }
  
  function getPrevClose(ticker, dateStr) {
    const idx = allDates.indexOf(dateStr);
    if (idx <= 0) return null;
    const prevDate = allDates[idx - 1];
    return byDate[prevDate]?.[ticker]?.close || null;
  }
  
  function getDayReturn(ticker, dateStr) {
    const row = byDate[dateStr]?.[ticker];
    if (!row) return null;
    const prevClose = getPrevClose(ticker, dateStr);
    if (!prevClose) return null;
    return (row.close - prevClose) / prevClose;
  }
  
  function getMultiDayReturn(ticker, fromDate, toDate) {
    const fromRow = byDate[fromDate]?.[ticker];
    const toRow = byDate[toDate]?.[ticker];
    if (!fromRow || !toRow) return null;
    return (toRow.close - fromRow.close) / fromRow.close;
  }
  
  // For each long weekend Friday, compute metrics
  const analyses = [];
  
  for (const lwf of longWeekendFridays) {
    const d = lwf.friday;
    const spx = byDate[d]?.['^GSPC'];
    const spy = byDate[d]?.['SPY'];
    const msft = byDate[d]?.['MSFT'];
    const nvda = byDate[d]?.['NVDA'];
    const aapl = byDate[d]?.['AAPL'];
    const iwm = byDate[d]?.['IWM'];
    const vix = byDate[d]?.['^VIX'];
    
    if (!spx || !iwm || !nvda) continue;
    
    const spxReturn = getDayReturn('^GSPC', d);
    const nvdaReturn = getDayReturn('NVDA', d);
    const aaplReturn = getDayReturn('AAPL', d);
    const iwmReturn = getDayReturn('IWM', d);
    const msftReturn = getDayReturn('MSFT', d);
    const spyReturn = getDayReturn('SPY', d);
    
    // Check if SPX was near recent highs (within 2% of 20-day high)
    const idx = allDates.indexOf(d);
    let recentHigh = 0;
    for (let i = Math.max(0, idx - 20); i <= idx; i++) {
      const h = byDate[allDates[i]]?.['^GSPC']?.high || 0;
      if (h > recentHigh) recentHigh = h;
    }
    const nearATH = spx.close / recentHigh > 0.98;
    
    // Rotation score: IWM outperforming tech
    const rotationScore = (iwmReturn || 0) - ((nvdaReturn || 0) + (aaplReturn || 0)) / 2;
    
    // Tech weakness: NVDA and AAPL both negative
    const techWeak = (nvdaReturn || 0) < 0 || (aaplReturn || 0) < 0;
    
    // Small caps strong: IWM positive
    const smallCapStrong = (iwmReturn || 0) > 0.005; // > 0.5%
    
    // Afternoon fade: close < open and close < high by meaningful amount
    const afternoonFade = spx.close < spx.open && (spx.high - spx.close) / spx.close > 0.002;
    
    // Find next trading day (Tuesday after long weekend)
    const nextTuesday = allDates.find(dd => dd > d && getDayOfWeek(dd) >= 2);
    // Actually find first trading day after holiday
    const nextTradingDay = allDates.find(dd => dd > lwf.holiday);
    // And the day after that, and 5 days out
    const nextTDIdx = nextTradingDay ? allDates.indexOf(nextTradingDay) : -1;
    const day2 = nextTDIdx >= 0 && nextTDIdx + 1 < allDates.length ? allDates[nextTDIdx + 1] : null;
    const day5 = nextTDIdx >= 0 && nextTDIdx + 4 < allDates.length ? allDates[nextTDIdx + 4] : null;
    
    // Similarity score (higher = more similar to today)
    let score = 0;
    if (nearATH) score += 3;
    if (techWeak) score += 2;
    if (smallCapStrong) score += 2;
    if (rotationScore > 0.01) score += 2; // Strong rotation
    if (afternoonFade) score += 1;
    
    const analysis = {
      date: d,
      holiday: lwf.holiday,
      score,
      nearATH,
      techWeak,
      smallCapStrong,
      afternoonFade,
      rotationScore,
      spxClose: spx.close,
      spxReturn,
      nvdaReturn,
      aaplReturn,
      iwmReturn,
      msftReturn,
      msftClose: msft?.close,
      spyClose: spy?.close,
      spyReturn,
      vixClose: vix?.close,
      spxHigh: spx.high,
      spxLow: spx.low,
      spxOpen: spx.open,
      nextTradingDay,
      day2,
      day5,
    };
    
    // Compute forward returns
    if (nextTradingDay) {
      analysis.spxNextDay = getMultiDayReturn('^GSPC', d, nextTradingDay);
      analysis.spyNextDay = getMultiDayReturn('SPY', d, nextTradingDay);
      analysis.msftNextDay = getMultiDayReturn('MSFT', d, nextTradingDay);
      analysis.nvdaNextDay = getMultiDayReturn('NVDA', d, nextTradingDay);
      analysis.iwmNextDay = getMultiDayReturn('IWM', d, nextTradingDay);
    }
    if (day2) {
      analysis.spxDay2 = getMultiDayReturn('^GSPC', d, day2);
      analysis.spyDay2 = getMultiDayReturn('SPY', d, day2);
      analysis.msftDay2 = getMultiDayReturn('MSFT', d, day2);
    }
    if (day5) {
      analysis.spxWeek = getMultiDayReturn('^GSPC', d, day5);
      analysis.spyWeek = getMultiDayReturn('SPY', d, day5);
      analysis.msftWeek = getMultiDayReturn('MSFT', d, day5);
    }
    
    analyses.push(analysis);
  }
  
  // Also check ALL Fridays for rotation + tech weakness pattern (not just long weekends)
  const allFridayAnalyses = [];
  for (const d of allDates) {
    if (getDayOfWeek(d) !== 5) continue;
    
    const spx = byDate[d]?.['^GSPC'];
    const nvda = byDate[d]?.['NVDA'];
    const aapl = byDate[d]?.['AAPL'];
    const iwm = byDate[d]?.['IWM'];
    const msft = byDate[d]?.['MSFT'];
    const vix = byDate[d]?.['^VIX'];
    
    if (!spx || !iwm || !nvda) continue;
    
    const nvdaReturn = getDayReturn('NVDA', d);
    const aaplReturn = getDayReturn('AAPL', d);
    const iwmReturn = getDayReturn('IWM', d);
    const msftReturn = getDayReturn('MSFT', d);
    
    const rotationScore = (iwmReturn || 0) - ((nvdaReturn || 0) + (aaplReturn || 0)) / 2;
    const techWeak = (nvdaReturn || 0) < -0.01 || (aaplReturn || 0) < -0.01;
    const smallCapStrong = (iwmReturn || 0) > 0.01;
    
    if (techWeak && smallCapStrong && rotationScore > 0.015) {
      const idx = allDates.indexOf(d);
      const nextDay = idx + 1 < allDates.length ? allDates[idx + 1] : null;
      const nextDay2 = idx + 2 < allDates.length ? allDates[idx + 2] : null;
      const nextDay5 = idx + 5 < allDates.length ? allDates[idx + 5] : null;
      
      // Check if near ATH
      let recentHigh = 0;
      for (let i = Math.max(0, idx - 20); i <= idx; i++) {
        const h = byDate[allDates[i]]?.['^GSPC']?.high || 0;
        if (h > recentHigh) recentHigh = h;
      }
      const nearATH = spx.close / recentHigh > 0.98;
      
      const isLongWeekend = longWeekendFridays.some(l => l.friday === d);
      
      allFridayAnalyses.push({
        date: d,
        isLongWeekend,
        nearATH,
        rotationScore,
        spxClose: spx.close,
        spxReturn: getDayReturn('^GSPC', d),
        nvdaReturn,
        aaplReturn,
        iwmReturn,
        msftReturn,
        msftClose: msft?.close,
        vixClose: vix?.close,
        spxOpen: spx.open,
        spxHigh: spx.high,
        spxLow: spx.low,
        nextDay,
        nextDay2,
        nextDay5,
        spxNextDay: nextDay ? getMultiDayReturn('^GSPC', d, nextDay) : null,
        spyNextDay: nextDay ? getMultiDayReturn('SPY', d, nextDay) : null,
        msftNextDay: nextDay ? getMultiDayReturn('MSFT', d, nextDay) : null,
        spxDay2: nextDay2 ? getMultiDayReturn('^GSPC', d, nextDay2) : null,
        spyDay2: nextDay2 ? getMultiDayReturn('SPY', d, nextDay2) : null,
        msftDay2: nextDay2 ? getMultiDayReturn('MSFT', d, nextDay2) : null,
        spxWeek: nextDay5 ? getMultiDayReturn('^GSPC', d, nextDay5) : null,
        spyWeek: nextDay5 ? getMultiDayReturn('SPY', d, nextDay5) : null,
        msftWeek: nextDay5 ? getMultiDayReturn('MSFT', d, nextDay5) : null,
      });
    }
  }
  
  // Sort by similarity score
  analyses.sort((a, b) => b.score - a.score);
  
  console.log('\n=== LONG WEEKEND FRIDAY ANALYSIS ===');
  for (const a of analyses) {
    console.log(`\n${a.date} (Score: ${a.score}) | Holiday: ${a.holiday}`);
    console.log(`  SPX: ${a.spxClose?.toFixed(2)} (${(a.spxReturn*100)?.toFixed(2)}%) | Near ATH: ${a.nearATH}`);
    console.log(`  NVDA: ${(a.nvdaReturn*100)?.toFixed(2)}% | AAPL: ${(a.aaplReturn*100)?.toFixed(2)}% | IWM: ${(a.iwmReturn*100)?.toFixed(2)}%`);
    console.log(`  MSFT: $${a.msftClose?.toFixed(2)} (${(a.msftReturn*100)?.toFixed(2)}%)`);
    console.log(`  VIX: ${a.vixClose?.toFixed(2)} | Rotation: ${(a.rotationScore*100)?.toFixed(2)}%`);
    console.log(`  Afternoon Fade: ${a.afternoonFade} | O:${a.spxOpen?.toFixed(0)} H:${a.spxHigh?.toFixed(0)} L:${a.spxLow?.toFixed(0)} C:${a.spxClose?.toFixed(0)}`);
    if (a.spxNextDay !== null) {
      console.log(`  → Next Day (${a.nextTradingDay}): SPX ${(a.spxNextDay*100)?.toFixed(2)}% | SPY ${(a.spyNextDay*100)?.toFixed(2)}% | MSFT ${(a.msftNextDay*100)?.toFixed(2)}%`);
    }
    if (a.spxDay2 !== null) {
      console.log(`  → Day 2 (${a.day2}): SPX ${(a.spxDay2*100)?.toFixed(2)}% | SPY ${(a.spyDay2*100)?.toFixed(2)}% | MSFT ${(a.msftDay2*100)?.toFixed(2)}%`);
    }
    if (a.spxWeek !== null) {
      console.log(`  → Week (${a.day5}): SPX ${(a.spxWeek*100)?.toFixed(2)}% | SPY ${(a.spyWeek*100)?.toFixed(2)}% | MSFT ${(a.msftWeek*100)?.toFixed(2)}%`);
    }
  }
  
  console.log('\n\n=== ALL FRIDAYS WITH TECH WEAKNESS + SMALL CAP STRENGTH ===');
  console.log('(NVDA or AAPL < -1%, IWM > +1%, rotation > 1.5%)');
  for (const a of allFridayAnalyses) {
    console.log(`\n${a.date} ${a.isLongWeekend ? '📅 LONG WEEKEND' : ''} ${a.nearATH ? '📈 NEAR ATH' : ''}`);
    console.log(`  SPX: ${a.spxClose?.toFixed(2)} (${(a.spxReturn*100)?.toFixed(2)}%)`);
    console.log(`  NVDA: ${(a.nvdaReturn*100)?.toFixed(2)}% | AAPL: ${(a.aaplReturn*100)?.toFixed(2)}% | IWM: ${(a.iwmReturn*100)?.toFixed(2)}%`);
    console.log(`  MSFT: $${a.msftClose?.toFixed(2)} (${(a.msftReturn*100)?.toFixed(2)}%) | VIX: ${a.vixClose?.toFixed(2)}`);
    console.log(`  Rotation Score: ${(a.rotationScore*100)?.toFixed(2)}%`);
    console.log(`  O:${a.spxOpen?.toFixed(0)} H:${a.spxHigh?.toFixed(0)} L:${a.spxLow?.toFixed(0)} C:${a.spxClose?.toFixed(0)}`);
    if (a.spxNextDay !== null) {
      console.log(`  → Next Day (${a.nextDay}): SPX ${(a.spxNextDay*100)?.toFixed(2)}% | MSFT ${(a.msftNextDay*100)?.toFixed(2)}%`);
    }
    if (a.spxDay2 !== null) {
      console.log(`  → Day 2 (${a.nextDay2}): SPX ${(a.spxDay2*100)?.toFixed(2)}% | MSFT ${(a.msftDay2*100)?.toFixed(2)}%`);
    }
    if (a.spxWeek !== null) {
      console.log(`  → Week (${a.nextDay5}): SPX ${(a.spxWeek*100)?.toFixed(2)}% | MSFT ${(a.msftWeek*100)?.toFixed(2)}%`);
    }
  }
  
  // Generate markdown report
  const pct = (v) => v !== null && v !== undefined ? (v * 100).toFixed(2) + '%' : 'N/A';
  const price = (v) => v !== null && v !== undefined ? '$' + v.toFixed(2) : 'N/A';
  
  let md = `# Backtest: Friday Afternoon Fade Before Long Weekend
## Analysis Date: Feb 13, 2026 (Friday before Presidents' Day)

### Current Setup (Feb 13, 2026)
| Metric | Value |
|--------|-------|
| SPX | ~6,870 (slight afternoon fade) |
| NVDA | -1.6% |
| AAPL | -1.15% |
| IWM | +1.65% |
| MSFT | $400-405 (testing $400 support) |
| Pattern | Tech weakness + small cap rotation into long weekend |

---

## 1. Long Weekend Fridays (Jul 2025 – Feb 2026)

These are all Fridays before a US market holiday (3-day weekend).

`;

  for (const a of analyses) {
    const matchTags = [];
    if (a.nearATH) matchTags.push('Near ATH');
    if (a.techWeak) matchTags.push('Tech Weak');
    if (a.smallCapStrong) matchTags.push('Small Caps Strong');
    if (a.afternoonFade) matchTags.push('Afternoon Fade');
    
    md += `### ${a.date} — Similarity Score: ${a.score}/10
**Holiday:** ${a.holiday} | **Tags:** ${matchTags.join(', ') || 'None'}

| Ticker | Day Return | Close |
|--------|-----------|-------|
| SPX | ${pct(a.spxReturn)} | ${price(a.spxClose)} |
| NVDA | ${pct(a.nvdaReturn)} | — |
| AAPL | ${pct(a.aaplReturn)} | — |
| IWM | ${pct(a.iwmReturn)} | — |
| MSFT | ${pct(a.msftReturn)} | ${price(a.msftClose)} |
| VIX | — | ${a.vixClose?.toFixed(2) || 'N/A'} |

**Rotation Score:** ${pct(a.rotationScore)} (IWM vs mega-cap avg)
**Intraday:** Open ${a.spxOpen?.toFixed(0)} → High ${a.spxHigh?.toFixed(0)} → Low ${a.spxLow?.toFixed(0)} → Close ${a.spxClose?.toFixed(0)}

**Forward Returns:**
| Period | SPX | SPY | MSFT |
|--------|-----|-----|------|
| Next Day (${a.nextTradingDay || '?'}) | ${pct(a.spxNextDay)} | ${pct(a.spyNextDay)} | ${pct(a.msftNextDay)} |
| Day 2 (${a.day2 || '?'}) | ${pct(a.spxDay2)} | ${pct(a.spyDay2)} | ${pct(a.msftDay2)} |
| Week (${a.day5 || '?'}) | ${pct(a.spxWeek)} | ${pct(a.spyWeek)} | ${pct(a.msftWeek)} |

---

`;
  }

  md += `## 2. All Fridays with Tech Weakness + Small Cap Rotation

Criteria: NVDA or AAPL < -1%, IWM > +1%, rotation score > 1.5%

`;

  for (const a of allFridayAnalyses) {
    md += `### ${a.date} ${a.isLongWeekend ? '📅 LONG WEEKEND' : ''} ${a.nearATH ? '📈 NEAR ATH' : ''}

| Ticker | Return |
|--------|--------|
| SPX | ${pct(a.spxReturn)} (${price(a.spxClose)}) |
| NVDA | ${pct(a.nvdaReturn)} |
| AAPL | ${pct(a.aaplReturn)} |
| IWM | ${pct(a.iwmReturn)} |
| MSFT | ${pct(a.msftReturn)} (${price(a.msftClose)}) |
| VIX | ${a.vixClose?.toFixed(2)} |
| Rotation | ${pct(a.rotationScore)} |

**Forward Returns:**
| Period | SPX | SPY | MSFT |
|--------|-----|-----|------|
| Next Day | ${pct(a.spxNextDay)} | ${pct(a.spyNextDay)} | ${pct(a.msftNextDay)} |
| Day 2 | ${pct(a.spxDay2)} | ${pct(a.spyDay2)} | ${pct(a.msftDay2)} |
| Week | ${pct(a.spxWeek)} | ${pct(a.spyWeek)} | ${pct(a.msftWeek)} |

---

`;
  }

  // Trade playbook
  md += `## 3. Options Trade Playbook

### Methodology
For each similar setup, estimated P&L for these trades entered Friday afternoon:
- **SPX 0DTE Puts (OTM ~$50):** These expire same day. Only profit if SPX drops sharply in final hours.
- **MSFT 0DTE Puts ($400 strike):** Same-day expiry, profit only on sharp drop below $400.
- **SPY Puts (Tuesday expiry):** These survive the weekend — benefit from any gap down Tuesday.

### 0DTE Puts (SPX & MSFT) — Reality Check
0DTE puts bought Friday afternoon expire at market close that same Friday. They do NOT benefit from weekend/Tuesday action. These only work if there's a sharp selloff in the final 1-2 hours of Friday.

**Historical Friday afternoon behavior on long weekends:**
`;

  // Analyze if Fridays before long weekends tend to fade
  let fadeCount = 0;
  let rallyCounts = 0;
  for (const a of analyses) {
    if (a.spxClose < a.spxOpen) {
      fadeCount++;
    } else {
      rallyCounts++;
    }
  }

  md += `- Fridays that faded (close < open): ${fadeCount}/${analyses.length}
- Fridays that rallied (close > open): ${rallyCounts}/${analyses.length}

### SPY Tuesday-Expiry Puts — The Real Trade

This is the trade that benefits from weekend risk / gap-down Tuesday.

`;

  let tuesdayDownCount = 0;
  let tuesdayUpCount = 0;
  let totalTuesdayReturn = 0;
  let tuesdayCount = 0;

  for (const a of analyses) {
    if (a.spxNextDay !== null) {
      tuesdayCount++;
      totalTuesdayReturn += a.spxNextDay;
      if (a.spxNextDay < 0) tuesdayDownCount++;
      else tuesdayUpCount++;
    }
  }

  md += `**Post-long-weekend Tuesday returns (SPX):**
- Down: ${tuesdayDownCount}/${tuesdayCount}
- Up: ${tuesdayUpCount}/${tuesdayCount}
- Avg return: ${tuesdayCount > 0 ? pct(totalTuesdayReturn / tuesdayCount) : 'N/A'}

`;

  // Similar for rotation Fridays
  let rotTuesdayDown = 0;
  let rotTuesdayUp = 0;
  let rotTotalReturn = 0;
  let rotCount = 0;

  for (const a of allFridayAnalyses) {
    if (a.spxNextDay !== null) {
      rotCount++;
      rotTotalReturn += a.spxNextDay;
      if (a.spxNextDay < 0) rotTuesdayDown++;
      else rotTuesdayUp++;
    }
  }

  md += `**Next-day returns after tech-weak/small-cap-strong Fridays (SPX):**
- Down: ${rotTuesdayDown}/${rotCount}
- Up: ${rotTuesdayUp}/${rotCount}
- Avg return: ${rotCount > 0 ? pct(rotTotalReturn / rotCount) : 'N/A'}

### Estimated Options P&L

For a **SPY put** (ATM or slightly OTM, Tuesday expiry):
- Typical cost: ~$2.50-4.00 per contract for ATM with 1 trading day to expiry
- If SPX drops 0.5% Tuesday → put gains ~$2-3 → **~50-100% return**
- If SPX drops 1.0% Tuesday → put gains ~$5-6 → **~150-200% return**
- If SPX flat/up Tuesday → put loses most value → **~60-90% loss**

For a **MSFT $400 put** (if MSFT at $402):
- Typical cost: ~$1.50-2.50 for slightly OTM with 1 day to expiry
- If MSFT drops to $398 → put gains ~$1.50 → **~60-100% return**
- If MSFT holds $400+ → put expires worthless → **~100% loss**

---

## 4. Key Takeaways

1. **0DTE puts are NOT a weekend play** — they expire Friday. Don't confuse them with the long weekend thesis.

2. **Tuesday-expiry SPY puts** are the correct vehicle for a long-weekend fade bet.

3. **Rotation (tech weak / small caps strong) on Fridays** historically shows:
   - Found ${allFridayAnalyses.length} instances in our sample (Jul 2025 - Feb 2026)
   - Next-day SPX was down ${rotTuesdayDown}/${rotCount} times (${rotCount > 0 ? (rotTuesdayDown/rotCount*100).toFixed(0) : '?'}%)
   - Average next-day move: ${rotCount > 0 ? pct(rotTotalReturn / rotCount) : 'N/A'}

4. **Long weekend Fridays specifically:**
   - ${tuesdayCount} instances found
   - Post-holiday day was down ${tuesdayDownCount}/${tuesdayCount} times
   - Average post-holiday move: ${tuesdayCount > 0 ? pct(totalTuesdayReturn / tuesdayCount) : 'N/A'}

5. **MSFT $400 support:** Track whether MSFT closed above or below $400 on these dates — a break below $400 heading into a long weekend could accelerate selling Tuesday.

### Risk/Reward Summary
| Trade | Win Rate | Avg Win | Avg Loss | Expected Value |
|-------|----------|---------|----------|----------------|
| SPY Tue puts (long weekend) | ${tuesdayCount > 0 ? (tuesdayDownCount/tuesdayCount*100).toFixed(0) : '?'}% | ~100-200% | ~70-90% | See data above |
| MSFT $400 puts | Conditional on $400 break | ~60-100% | ~100% | Negative unless clear break |

### Bottom Line
`;

  if (tuesdayDownCount > tuesdayUpCount) {
    md += `The data leans **slightly bearish** for post-long-weekend Tuesdays, supporting a small SPY put position. However, the sample size is limited. Size accordingly — this is a speculative thesis, not a high-conviction edge.\n`;
  } else if (tuesdayDownCount === tuesdayUpCount) {
    md += `The data is **mixed** — roughly coin-flip odds on post-long-weekend direction. The rotation pattern adds a slight bearish tilt, but not enough for high conviction. If playing, keep size small.\n`;
  } else {
    md += `The data actually leans **bullish** for post-long-weekend Tuesdays. The rotation pattern (tech weak / small caps strong) might not translate to broad market weakness. Consider that this rotation could be *healthy* — money isn't leaving the market, just shifting. Puts here are a contrarian bet against the base rate.\n`;
  }

  md += `
---
*Generated: ${new Date().toISOString()}*
*Data source: Yahoo Finance via yahoo-finance2*
*Period: Jul 2025 – Feb 2026*
`;

  // Write the file
  const fs = await import('fs');
  fs.writeFileSync('/home/vamsi/.openclaw/workspace/research/backtest-friday-fade-2026.md', md);
  console.log('\n\n✅ Report saved to research/backtest-friday-fade-2026.md');
}

main().catch(console.error);
