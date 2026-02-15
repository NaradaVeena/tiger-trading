#!/usr/bin/env node
/**
 * Stock Chart Generator
 * Generates candlestick charts with volume, VWAP, SMA20, EMA9/21, trendlines, RSI, MACD
 * Usage: node stock-chart.js MSFT [interval] [range]
 * Intervals: 1m, 5m, 15m, 30m, 1h, 1d
 * Range: 1d, 5d, 1mo, 3mo, 6mo, 1y
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { VWAP, SMA, EMA, RSI, MACD } = require('technicalindicators');

const symbol = process.argv[2] || 'MSFT';
const interval = process.argv[3] || '5m';
const range = process.argv[4] || '1d';
const outputDir = '/home/vamsi/.openclaw/workspace/charts';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function fetchData() {
  const result = await yahooFinance.chart(symbol, {
    period1: getStartDate(range),
    interval: interval,
  });
  let quotes = result.quotes.filter(q => q.open && q.close && q.high && q.low);
  
  // Filter to regular trading hours for intraday intervals
  if (['1m', '5m', '15m', '30m'].includes(interval)) {
    quotes = quotes.filter(q => {
      const d = new Date(q.date);
      const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const h = et.getHours();
      const m = et.getMinutes();
      const mins = h * 60 + m;
      return mins >= 570 && mins <= 960; // 9:30 AM - 4:00 PM ET
    });
  }
  
  return quotes;
}

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case '1d': now.setDate(now.getDate() - 1); break;
    case '5d': now.setDate(now.getDate() - 5); break;
    case '1mo': now.setMonth(now.getMonth() - 1); break;
    case '3mo': now.setMonth(now.getMonth() - 3); break;
    case '6mo': now.setMonth(now.getMonth() - 6); break;
    case '1y': now.setFullYear(now.getFullYear() - 1); break;
    default: now.setDate(now.getDate() - 1);
  }
  return now;
}

function calcVWAP(data) {
  let cumVolPrice = 0;
  let cumVol = 0;
  return data.map(d => {
    const typical = (d.high + d.low + d.close) / 3;
    cumVolPrice += typical * (d.volume || 0);
    cumVol += (d.volume || 0);
    return cumVol > 0 ? cumVolPrice / cumVol : typical;
  });
}

function calcSMA(data, period) {
  const closes = data.map(d => d.close);
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function calcEMA(data, period) {
  const closes = data.map(d => d.close);
  const emaValues = EMA.calculate({ period, values: closes });
  // Pad front with nulls
  const pad = closes.length - emaValues.length;
  return Array(pad).fill(null).concat(emaValues);
}

function calcRSI(data, period) {
  const closes = data.map(d => d.close);
  const rsiValues = RSI.calculate({ period, values: closes });
  const pad = closes.length - rsiValues.length;
  return Array(pad).fill(null).concat(rsiValues);
}

function calcMACD(data) {
  const closes = data.map(d => d.close);
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const pad = closes.length - macdValues.length;
  return Array(pad).fill(null).concat(macdValues);
}

function findTrendlines(data) {
  const lines = [];
  if (data.length < 10) return lines;

  const swingHighs = [];
  const swingLows = [];
  const lookback = 5;

  for (let i = lookback; i < data.length - lookback; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (data[i].high <= data[i - j].high || data[i].high <= data[i + j].high) isHigh = false;
      if (data[i].low >= data[i - j].low || data[i].low >= data[i + j].low) isLow = false;
    }
    if (isHigh) swingHighs.push({ idx: i, val: data[i].high });
    if (isLow) swingLows.push({ idx: i, val: data[i].low });
  }

  if (swingHighs.length >= 2) {
    const [a, b] = swingHighs.slice(-2);
    lines.push({ type: 'resistance', x1: a.idx, y1: a.val, x2: b.idx, y2: b.val });
  }
  if (swingLows.length >= 2) {
    const [a, b] = swingLows.slice(-2);
    lines.push({ type: 'support', x1: a.idx, y1: a.val, x2: b.idx, y2: b.val });
  }

  return lines;
}

function drawLine(ctx, xScale, yScale, values, color, lineWidth, dash) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  let started = false;
  values.forEach((v, i) => {
    if (v === null || v === undefined) return;
    const x = xScale(i);
    const y = yScale(v);
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function calcVolumeProfile(data, numBins = 60) {
  const prices = data.flatMap(d => [d.high, d.low]);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const binSize = (priceMax - priceMin) / numBins;
  const bins = Array(numBins).fill(0);

  // For each candle, distribute volume across bins
  data.forEach(d => {
    if (!d.volume || d.volume === 0) return;
    const vol = d.volume;
    const lo = d.low, hi = d.high, cl = d.close;

    // Find bins this candle spans
    const binLo = Math.max(0, Math.floor((lo - priceMin) / binSize));
    const binHi = Math.min(numBins - 1, Math.floor((hi - priceMin) / binSize));
    const closeBin = Math.min(numBins - 1, Math.max(0, Math.floor((cl - priceMin) / binSize)));
    const binsInRange = binHi - binLo + 1;

    // Weight toward close: 60% to close bin, 40% uniform
    const closeWeight = 0.6 * vol;
    const uniformWeight = 0.4 * vol / binsInRange;

    for (let b = binLo; b <= binHi; b++) {
      bins[b] += uniformWeight;
    }
    bins[closeBin] += closeWeight;
  });

  // POC: bin with highest volume
  let pocIdx = 0;
  for (let i = 1; i < numBins; i++) {
    if (bins[i] > bins[pocIdx]) pocIdx = i;
  }
  const pocPrice = priceMin + (pocIdx + 0.5) * binSize;

  // Value Area (70%): expand from POC outward
  const totalVol = bins.reduce((a, b) => a + b, 0);
  const targetVol = totalVol * 0.70;
  let vaVol = bins[pocIdx];
  let vaLo = pocIdx, vaHi = pocIdx;

  while (vaVol < targetVol && (vaLo > 0 || vaHi < numBins - 1)) {
    const downVol = vaLo > 0 ? bins[vaLo - 1] : -1;
    const upVol = vaHi < numBins - 1 ? bins[vaHi + 1] : -1;
    if (downVol >= upVol) { vaLo--; vaVol += bins[vaLo]; }
    else { vaHi++; vaVol += bins[vaHi]; }
  }

  const vahPrice = priceMin + (vaHi + 1) * binSize;
  const valPrice = priceMin + vaLo * binSize;

  // HVN/LVN
  const avgBinVol = totalVol / numBins;

  return {
    bins, binSize, priceMin, priceMax, numBins,
    poc: pocPrice, pocIdx,
    vah: vahPrice, val: valPrice, vaLo, vaHi,
    avgBinVol,
  };
}

function drawChart(data, vwap, sma20, ema9, ema21, trendlines, rsi, macd) {
  const width = 1200;
  const height = 1000;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Layout — 4 panels: price (45%), volume (15%), RSI (15%), MACD (15%), gaps + margins
  const margin = { top: 50, right: 80, bottom: 50, left: 80 };
  const usable = height - margin.top - margin.bottom;
  const gap = 12;
  const priceH = usable * 0.42;
  const volH = usable * 0.14;
  const rsiH = usable * 0.17;
  const macdH = usable * 0.17;

  const priceTop = margin.top;
  const volTop = priceTop + priceH + gap;
  const rsiTop = volTop + volH + gap;
  const macdTop = rsiTop + rsiH + gap;

  // Price range
  const prices = data.flatMap(d => [d.high, d.low]);
  let priceMin = Math.min(...prices);
  let priceMax = Math.max(...prices);
  const pricePad = (priceMax - priceMin) * 0.05;
  priceMin -= pricePad;
  priceMax += pricePad;

  // Volume range
  const maxVol = Math.max(...data.map(d => d.volume || 0));

  // Scale functions
  const xScale = (i) => margin.left + (i / (data.length - 1)) * (width - margin.left - margin.right);
  const yScale = (p) => priceTop + priceH - ((p - priceMin) / (priceMax - priceMin)) * priceH;
  const vScale = (v) => volTop + volH - (v / maxVol) * volH;

  const candleW = Math.max(2, Math.min(12, (width - margin.left - margin.right) / data.length * 0.7));

  // --- Grid lines for price panel ---
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  const priceStep = niceStep(priceMax - priceMin, 6);
  for (let p = Math.ceil(priceMin / priceStep) * priceStep; p <= priceMax; p += priceStep) {
    const y = yScale(p);
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.textAlign = 'right';
    ctx.fillText(p.toFixed(2), margin.left - 8, y + 4);
  }

  // --- Volume bars ---
  data.forEach((d, i) => {
    if (!d.volume) return;
    const x = xScale(i);
    const h = (d.volume / maxVol) * volH;
    ctx.fillStyle = d.close >= d.open ? 'rgba(38, 166, 91, 0.5)' : 'rgba(231, 76, 60, 0.5)';
    ctx.fillRect(x - candleW / 2, volTop + volH - h, candleW, h);
  });

  // Volume label
  ctx.fillStyle = '#555'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('VOL', margin.left, volTop + 10);

  // --- Candlesticks ---
  data.forEach((d, i) => {
    const x = xScale(i);
    const isGreen = d.close >= d.open;
    const color = isGreen ? '#26a65b' : '#e74c3c';

    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, yScale(d.high)); ctx.lineTo(x, yScale(d.low)); ctx.stroke();

    ctx.fillStyle = color;
    const bodyTop = yScale(Math.max(d.open, d.close));
    const bodyBot = yScale(Math.min(d.open, d.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
  });

  // --- Overlay lines on price panel ---
  // VWAP
  drawLine(ctx, xScale, yScale, vwap, '#f39c12', 2);
  // SMA 20
  drawLine(ctx, xScale, yScale, sma20, '#3498db', 1.5, [4, 2]);
  // EMA 9
  drawLine(ctx, xScale, yScale, ema9, '#00e5ff', 1.5);
  // EMA 21
  drawLine(ctx, xScale, yScale, ema21, '#e040fb', 1.5);

  // --- Trendlines ---
  trendlines.forEach(line => {
    ctx.strokeStyle = line.type === 'resistance' ? '#e74c3c' : '#26a65b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    const slope = (line.y2 - line.y1) / (line.x2 - line.x1);
    const extEnd = data.length - 1;
    const yEnd = line.y2 + slope * (extEnd - line.x2);
    ctx.moveTo(xScale(line.x1), yScale(line.y1));
    ctx.lineTo(xScale(extEnd), yScale(yEnd));
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // ====================== VOLUME PROFILE ======================
  const vp = calcVolumeProfile(data);
  const vpMaxVol = Math.max(...vp.bins);
  const vpWidth = (width - margin.left - margin.right) * 0.30; // 30% of chart width (wider for readability)
  const vpRight = width - margin.right;
  const vpLeft = vpRight - vpWidth;

  // Value Area shading (VAL to VAH) — more visible
  const vaTopY = yScale(vp.vah);
  const vaBotY = yScale(vp.val);
  ctx.fillStyle = 'rgba(138, 100, 220, 0.15)';
  ctx.fillRect(margin.left, vaTopY, width - margin.left - margin.right, vaBotY - vaTopY);
  // VA border lines
  ctx.strokeStyle = 'rgba(138, 100, 220, 0.4)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(margin.left, vaTopY); ctx.lineTo(vpLeft, vaTopY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(margin.left, vaBotY); ctx.lineTo(vpLeft, vaBotY); ctx.stroke();
  ctx.setLineDash([]);

  // Draw VP bins as horizontal bars from right edge
  for (let i = 0; i < vp.numBins; i++) {
    const binVol = vp.bins[i];
    if (binVol === 0) continue;
    const binBottom = vp.priceMin + i * vp.binSize;
    const binTop = binBottom + vp.binSize;
    const y1 = yScale(binTop);
    const y2 = yScale(binBottom);
    const barW = (binVol / vpMaxVol) * vpWidth;
    const barH = Math.max(2, y2 - y1 - 1); // minimum 2px height for visibility

    const isPoc = i === vp.pocIdx;
    const inVA = i >= vp.vaLo && i <= vp.vaHi;

    if (isPoc) {
      ctx.fillStyle = 'rgba(255, 235, 59, 0.85)'; // bright yellow for POC
    } else if (inVA) {
      ctx.fillStyle = 'rgba(120, 80, 220, 0.50)'; // purple for value area (more opaque)
    } else {
      ctx.fillStyle = 'rgba(80, 120, 200, 0.35)'; // blue for outside VA (more opaque)
    }

    ctx.fillRect(vpRight - barW, y1, barW, barH);
    
    // Subtle outline on bars for definition
    if (barW > 3) {
      ctx.strokeStyle = isPoc ? 'rgba(255, 235, 59, 0.4)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(vpRight - barW, y1, barW, barH);
    }
  }

  // POC horizontal dashed line — full width, more visible
  ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(margin.left, yScale(vp.poc));
  ctx.lineTo(vpLeft, yScale(vp.poc));
  ctx.stroke();
  ctx.setLineDash([]);

  // VP labels on right side — larger font, smart positioning to avoid overlap
  const labelFontSize = 11;
  ctx.font = `bold ${labelFontSize}px monospace`;
  ctx.textAlign = 'left';
  
  // Calculate label positions and prevent overlap
  const labelPositions = [
    { text: `POC ${vp.poc.toFixed(2)}`, y: yScale(vp.poc), color: '#ffeb3b' },
    { text: `VAH ${vp.vah.toFixed(2)}`, y: yScale(vp.vah), color: '#c0a0f0' },
    { text: `VAL ${vp.val.toFixed(2)}`, y: yScale(vp.val), color: '#c0a0f0' }
  ];
  
  // Sort by Y position and push apart if overlapping
  labelPositions.sort((a, b) => a.y - b.y);
  const minGap = labelFontSize + 4;
  for (let i = 1; i < labelPositions.length; i++) {
    if (labelPositions[i].y - labelPositions[i-1].y < minGap) {
      labelPositions[i].y = labelPositions[i-1].y + minGap;
    }
  }
  
  labelPositions.forEach(lbl => {
    // Background pill for readability
    const metrics = ctx.measureText(lbl.text);
    ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    ctx.fillRect(vpRight + 1, lbl.y - labelFontSize + 2, metrics.width + 6, labelFontSize + 4);
    // Text
    ctx.fillStyle = lbl.color;
    ctx.fillText(lbl.text, vpRight + 4, lbl.y + 3);
  });

  // --- Current price line ---
  const lastPrice = data[data.length - 1].close;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(margin.left, yScale(lastPrice)); ctx.lineTo(width - margin.right, yScale(lastPrice)); ctx.stroke();
  ctx.setLineDash([]);

  // Current price label
  ctx.fillStyle = '#fff';
  ctx.fillRect(width - margin.right + 2, yScale(lastPrice) - 10, 72, 20);
  ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
  ctx.fillText(lastPrice.toFixed(2), width - margin.right + 6, yScale(lastPrice) + 4);

  // ====================== RSI PANEL ======================
  const rsiYScale = (v) => rsiTop + rsiH - ((v - 0) / 100) * rsiH;

  // RSI background box
  ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 0.5;
  ctx.strokeRect(margin.left, rsiTop, width - margin.left - margin.right, rsiH);

  // Overbought / oversold lines
  [30, 50, 70].forEach(level => {
    const y = rsiYScale(level);
    ctx.strokeStyle = level === 50 ? '#333' : '#444';
    ctx.lineWidth = 0.5;
    ctx.setLineDash(level === 50 ? [2, 4] : [4, 2]);
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(String(level), margin.left - 5, y + 3);
  });

  // RSI line — color segments based on overbought/oversold
  for (let i = 1; i < rsi.length; i++) {
    if (rsi[i] === null || rsi[i - 1] === null) continue;
    const val = rsi[i];
    let color = '#a29bfe'; // neutral purple
    if (val >= 70) color = '#e74c3c'; // overbought red
    else if (val <= 30) color = '#26a65b'; // oversold green

    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xScale(i - 1), rsiYScale(rsi[i - 1]));
    ctx.lineTo(xScale(i), rsiYScale(rsi[i]));
    ctx.stroke();
  }

  // RSI label
  ctx.fillStyle = '#a29bfe'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('RSI(14)', margin.left + 4, rsiTop + 12);
  const lastRSI = rsi.filter(v => v !== null).slice(-1)[0];
  if (lastRSI !== undefined) {
    ctx.fillText(lastRSI.toFixed(1), margin.left + 70, rsiTop + 12);
  }

  // ====================== MACD PANEL ======================
  // Filter valid MACD values
  const validMacd = macd.filter(v => v !== null && v.MACD !== undefined);
  if (validMacd.length > 0) {
    const allMacdVals = validMacd.flatMap(v => [v.MACD || 0, v.signal || 0, v.histogram || 0]);
    let macdMax = Math.max(...allMacdVals.map(Math.abs));
    if (macdMax === 0) macdMax = 1;
    macdMax *= 1.1; // padding

    const macdYScale = (v) => macdTop + macdH / 2 - (v / macdMax) * (macdH / 2);
    const zeroY = macdYScale(0);

    // MACD background box
    ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 0.5;
    ctx.strokeRect(margin.left, macdTop, width - margin.left - margin.right, macdH);

    // Zero line
    ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(margin.left, zeroY); ctx.lineTo(width - margin.right, zeroY); ctx.stroke();
    ctx.setLineDash([]);

    // Histogram bars
    macd.forEach((v, i) => {
      if (v === null || v.histogram === undefined) return;
      const x = xScale(i);
      const h = v.histogram;
      const barH = Math.abs(macdYScale(h) - zeroY);
      ctx.fillStyle = h >= 0 ? 'rgba(38, 166, 91, 0.6)' : 'rgba(231, 76, 60, 0.6)';
      const y = h >= 0 ? zeroY - barH : zeroY;
      ctx.fillRect(x - candleW / 2, y, candleW, barH);
    });

    // MACD line
    const macdLine = macd.map(v => (v !== null && v.MACD !== undefined) ? v.MACD : null);
    drawLine(ctx, xScale, macdYScale, macdLine, '#00bcd4', 1.5);

    // Signal line
    const signalLine = macd.map(v => (v !== null && v.signal !== undefined) ? v.signal : null);
    drawLine(ctx, xScale, macdYScale, signalLine, '#ff7043', 1.5);

    // MACD label
    ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('MACD(12,26,9)', margin.left + 4, macdTop + 12);

    // MACD axis labels
    ctx.fillStyle = '#555'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(macdMax.toFixed(2), margin.left - 5, macdTop + 10);
    ctx.fillText((-macdMax).toFixed(2), margin.left - 5, macdTop + macdH);
    ctx.fillText('0', margin.left - 5, zeroY + 3);
  }

  // ====================== X-AXIS TIME LABELS ======================
  ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  const labelInterval = Math.max(1, Math.floor(data.length / 10));
  data.forEach((d, i) => {
    if (i % labelInterval !== 0) return;
    const date = new Date(d.date);
    let label;
    if (['1m', '5m', '15m', '30m'].includes(interval)) {
      label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    ctx.fillText(label, xScale(i), height - margin.bottom + 20);
  });

  // ====================== TITLE ======================
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'left';
  const change = lastPrice - data[0].open;
  const changePct = (change / data[0].open * 100).toFixed(2);
  const changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct}%)`;
  ctx.fillText(`${symbol}  ${lastPrice.toFixed(2)}  ${changeStr}`, margin.left, 30);

  ctx.font = '12px monospace'; ctx.fillStyle = '#888';
  ctx.fillText(`${interval} candles · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`, margin.left, 45);

  // ====================== LEGEND ======================
  const legendX = width - margin.right - 420;
  ctx.font = '11px monospace';
  const items = [
    { color: '#f39c12', label: 'VWAP' },
    { color: '#3498db', label: 'SMA20' },
    { color: '#00e5ff', label: 'EMA9' },
    { color: '#e040fb', label: 'EMA21' },
    { color: '#26a65b', label: 'Support' },
    { color: '#e74c3c', label: 'Resist' },
  ];
  items.forEach((item, idx) => {
    const x = legendX + idx * 70;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, 20, 14, 3);
    ctx.fillText(item.label, x + 18, 25);
  });

  return canvas;
}

function niceStep(range, targetSteps) {
  const rough = range / targetSteps;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step;
  if (norm <= 1.5) step = 1;
  else if (norm <= 3) step = 2;
  else if (norm <= 7) step = 5;
  else step = 10;
  return step * pow;
}

async function main() {
  try {
    console.log(`Fetching ${symbol} ${interval} data...`);
    const data = await fetchData();
    
    if (data.length === 0) {
      console.error('No data returned');
      process.exit(1);
    }

    console.log(`Got ${data.length} candles`);
    
    const vwap = calcVWAP(data);
    const sma20 = calcSMA(data, 20);
    const ema9 = calcEMA(data, 9);
    const ema21 = calcEMA(data, 21);
    const trendlines = findTrendlines(data);
    const rsi = calcRSI(data, 14);
    const macdData = calcMACD(data);

    const canvas = drawChart(data, vwap, sma20, ema9, ema21, trendlines, rsi, macdData);
    
    const filename = `${symbol}_${interval}_${range}_${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    
    // Print summary
    const last = data[data.length - 1];
    const first = data[0];
    const lastRSI = rsi.filter(v => v !== null).slice(-1)[0];
    const lastMACD = macdData.filter(v => v !== null && v.MACD !== undefined).slice(-1)[0];

    console.log(`\n--- ${symbol} Summary ---`);
    console.log(`Last: $${last.close.toFixed(2)} | Open: $${first.open.toFixed(2)}`);
    console.log(`Day Range: $${Math.min(...data.map(d => d.low)).toFixed(2)} - $${Math.max(...data.map(d => d.high)).toFixed(2)}`);
    console.log(`VWAP: $${vwap[vwap.length - 1].toFixed(2)}`);
    if (sma20[sma20.length - 1]) console.log(`SMA20: $${sma20[sma20.length - 1].toFixed(2)}`);
    if (ema9[ema9.length - 1]) console.log(`EMA9: $${ema9[ema9.length - 1].toFixed(2)}`);
    if (ema21[ema21.length - 1]) console.log(`EMA21: $${ema21[ema21.length - 1].toFixed(2)}`);
    if (lastRSI) console.log(`RSI(14): ${lastRSI.toFixed(1)}`);
    if (lastMACD) console.log(`MACD: ${lastMACD.MACD.toFixed(3)} | Signal: ${lastMACD.signal.toFixed(3)} | Hist: ${lastMACD.histogram.toFixed(3)}`);
    const vp = calcVolumeProfile(data);
    console.log(`VP POC: $${vp.poc.toFixed(2)}`);
    console.log(`VP VAH: $${vp.vah.toFixed(2)}`);
    console.log(`VP VAL: $${vp.val.toFixed(2)}`);
    console.log(`Trendlines: ${trendlines.length} found`);
    console.log(`\nChart saved: ${filepath}`);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
