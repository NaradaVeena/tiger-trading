#!/usr/bin/env node
/**
 * AI Investment Matrix Chart
 * Plots companies on a 2D matrix: Opportunity (Y) vs Obviousness (X)
 * Quadrants: Hidden Gems (top-left), Consensus Winners (top-right), 
 *            Contrarian Bets (bottom-left), Avoid (bottom-right)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const outputDir = '/home/vamsi/.openclaw/workspace/charts';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Data: [ticker, name, obviousness (1-10), opportunity (1-10), category, type]
// type: 'long' or 'short'
const companies = [
  // === LONGS ===
  // Infrastructure - Hidden Gems
  ['MOD', 'Modine Mfg', 2, 8.5, 'Infra', 'long'],
  ['FN', 'Fabrinet', 2.5, 8, 'Infra', 'long'],
  ['CRDO', 'Credo Tech', 3, 8.5, 'Infra', 'long'],
  ['POET', 'POET Tech', 1.5, 7, 'Infra', 'long'],
  ['NVT', 'nVent Electric', 2.5, 7, 'Infra', 'long'],
  ['ETR', 'Entergy', 2, 6.5, 'Infra', 'long'],
  ['BE', 'Bloom Energy', 3.5, 7, 'Infra', 'long'],
  ['APLD', 'Applied Digital', 3, 7.5, 'Infra', 'long'],
  ['ALAB', 'Astera Labs', 4, 8, 'Infra', 'long'],
  ['MU', 'Micron', 6, 7, 'Infra', 'long'],
  ['VRT', 'Vertiv', 7, 7.5, 'Infra', 'long'],
  
  // Software & Data
  ['INOD', 'Innodata', 2, 9, 'Software', 'long'],
  ['PATH', 'UiPath', 4, 7.5, 'Software', 'long'],
  ['TASK', 'TaskUs', 2.5, 7.5, 'Software', 'long'],
  ['TRI', 'Thomson Reuters', 4, 8, 'Software', 'long'],
  ['RELX', 'RELX', 4, 7.5, 'Software', 'long'],
  ['ESTC', 'Elastic', 5, 7, 'Software', 'long'],
  
  // Demand Side - Transformed Industries
  ['CERT', 'Certara', 1.5, 9, 'Demand', 'long'],
  ['BAH', 'Booz Allen', 3, 8.5, 'Demand', 'long'],
  ['PTC', 'PTC Inc', 2.5, 8, 'Demand', 'long'],
  ['TEM', 'Tempus AI', 3.5, 8, 'Demand', 'long'],
  ['ROK', 'Rockwell Auto', 4, 7, 'Demand', 'long'],
  ['VRSK', 'Verisk', 3.5, 7.5, 'Demand', 'long'],
  ['NCNO', 'nCino', 2, 7.5, 'Demand', 'long'],
  ['DUOL', 'Duolingo', 5, 7.5, 'Demand', 'long'],
  ['CACI', 'CACI Intl', 3, 7, 'Demand', 'long'],
  ['G', 'Genpact', 3, 7, 'Demand', 'long'],
  ['RXRX', 'Recursion', 3.5, 6.5, 'Demand', 'long'],
  ['GETY', 'Getty Images', 3, 6.5, 'Demand', 'long'],
  
  // === SHORTS ===
  ['CNDT', 'Conduent', 2, 9, 'Short', 'short'],
  ['RHI', 'Robert Half', 3, 8.5, 'Short', 'short'],
  ['CNXC', 'Concentrix', 3, 8.5, 'Short', 'short'],
  ['INTU', 'Intuit', 6, 7.5, 'Short', 'short'],
  ['ZD', 'Ziff Davis', 2.5, 8, 'Short', 'short'],
  ['WIT', 'Wipro', 5, 7.5, 'Short', 'short'],
  ['FVRR', 'Fiverr', 4, 7.5, 'Short', 'short'],
  ['NRDY', 'Nerdy', 2, 8, 'Short', 'short'],
  ['KFRC', 'Kforce', 2, 7.5, 'Short', 'short'],
  ['MNDY', 'Monday.com', 4.5, 6.5, 'Short', 'short'],
];

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawChart() {
  const width = 2400;
  const height = 1600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const margin = { top: 180, right: 420, bottom: 170, left: 180 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const midX = margin.left + chartW / 2;

  const opportunities = companies.map((c) => c[3]);
  const minOpp = Math.min(...opportunities);
  const maxOpp = Math.max(...opportunities);
  const yPadding = 0.4;
  let yMin = Math.max(0, Math.floor((minOpp - yPadding) * 2) / 2);
  let yMax = Math.min(10, Math.ceil((maxOpp + yPadding) * 2) / 2);
  if (yMax - yMin < 2) {
    yMin = Math.max(0, yMin - 0.5);
    yMax = Math.min(10, yMax + 0.5);
  }

  // Background
  ctx.fillStyle = '#0c111a';
  ctx.fillRect(0, 0, width, height);

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, 'rgba(47,129,247,0.04)');
  bgGrad.addColorStop(1, 'rgba(22,163,74,0.03)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Chart frame
  ctx.fillStyle = 'rgba(14,20,31,0.85)';
  roundedRect(ctx, margin.left - 1, margin.top - 1, chartW + 2, chartH + 2, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(139,148,158,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Focused backgrounds: only low-vs-high obviousness split (no empty lower half)
  ctx.fillStyle = 'rgba(38, 166, 91, 0.11)';
  ctx.fillRect(margin.left, margin.top, chartW / 2, chartH);
  ctx.fillStyle = 'rgba(52, 152, 219, 0.11)';
  ctx.fillRect(midX, margin.top, chartW / 2, chartH);

  // Grid lines
  ctx.strokeStyle = 'rgba(139,148,158,0.16)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 9; i++) {
    const x = margin.left + (i / 10) * chartW;
    const y = margin.top + (i / 10) * chartH;
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + chartH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + chartW, y);
    ctx.stroke();
  }

  // Mid-line (obviousness split)
  ctx.strokeStyle = 'rgba(180,190,210,0.55)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(midX, margin.top);
  ctx.lineTo(midX, margin.top + chartH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Section labels
  ctx.font = '700 30px Inter, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#7ae4a0';
  ctx.fillText('LOW-OBVIOUSNESS IDEAS', margin.left + chartW / 4, margin.top + 48);
  ctx.fillStyle = '#79bcff';
  ctx.fillText('HIGH-OBVIOUSNESS IDEAS', midX + chartW / 4, margin.top + 48);
  ctx.globalAlpha = 1;

  // Axis scales
  const xScale = (v) => margin.left + (Math.max(0, Math.min(10, v)) / 10) * chartW;
  const yScale = (v) =>
    margin.top + chartH - ((Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * chartH;

  // Tick labels
  ctx.font = '500 16px Inter, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(220,228,238,0.68)';
  for (let i = 1; i <= 10; i++) {
    const x = margin.left + (i / 10) * chartW;
    ctx.textAlign = 'center';
    ctx.fillText(String(i), x, margin.top + chartH + 26);
  }

  const yTickStep = yMax - yMin <= 4 ? 0.5 : 1;
  for (let v = yMin; v <= yMax + 1e-9; v += yTickStep) {
    const y = yScale(v);
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(yTickStep === 0.5 ? 1 : 0), margin.left - 16, y + 6);
  }

  // Axis labels
  ctx.fillStyle = '#c8d2df';
  ctx.font = '700 24px Inter, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBVIOUSNESS  →', margin.left + chartW / 2, height - 52);
  ctx.save();
  ctx.translate(58, margin.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`OPPORTUNITY SCORE (${yMin.toFixed(1)} - ${yMax.toFixed(1)})  →`, 0, 0);
  ctx.restore();

  // Category colors
  const colors = {
    Infra: '#f7b731',
    Software: '#5da9ff',
    Demand: '#43d680',
    Short: '#ff6b60',
  };

  const points = companies
    .map(([ticker, name, obvious, opp, cat, type]) => ({
      ticker,
      name,
      obvious,
      opp,
      cat,
      type,
      color: colors[cat],
      x: xScale(obvious),
      y: yScale(opp),
    }))
    .sort((a, b) => b.opp - a.opp);

  // Draw points
  for (const p of points) {
    const radius = p.type === 'short' ? 10 : 11;
    if (p.type === 'short') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - radius);
      ctx.lineTo(p.x - radius, p.y + radius);
      ctx.lineTo(p.x + radius, p.y + radius);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  // Collision-aware label placement
  ctx.font = '700 18px Inter, "Segoe UI", sans-serif';
  const occupied = [];
  const labelPaddingX = 9;
  const labelPaddingY = 6;
  const labelH = 18 + labelPaddingY * 2;

  const candidates = [
    { dx: 18, dy: -18, align: 'left' },
    { dx: 18, dy: 18, align: 'left' },
    { dx: -18, dy: -18, align: 'right' },
    { dx: -18, dy: 18, align: 'right' },
    { dx: 0, dy: -25, align: 'center' },
    { dx: 0, dy: 26, align: 'center' },
  ];

  for (const p of points) {
    const textW = ctx.measureText(p.ticker).width;
    let best = null;

    for (const c of candidates) {
      let x = p.x + c.dx;
      const y = p.y + c.dy;
      if (c.align === 'right') x -= textW + labelPaddingX * 2;
      if (c.align === 'center') x -= (textW + labelPaddingX * 2) / 2;

      const box = { x, y, w: textW + labelPaddingX * 2, h: labelH };

      let score = 0;
      if (box.x < margin.left || box.x + box.w > margin.left + chartW || box.y < margin.top || box.y + box.h > margin.top + chartH) {
        score += 10000;
      }
      for (const o of occupied) {
        if (intersects(box, o)) score += 1200;
      }
      const dist = Math.hypot(c.dx, c.dy);
      score += dist * 2;

      if (!best || score < best.score) {
        best = { score, box };
      }
    }

    // Connector
    ctx.strokeStyle = 'rgba(210,220,235,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(best.box.x + best.box.w / 2, best.box.y + best.box.h / 2);
    ctx.stroke();

    // Label background
    roundedRect(ctx, best.box.x, best.box.y, best.box.w, best.box.h, 6);
    ctx.fillStyle = 'rgba(10,14,22,0.9)';
    ctx.fill();
    ctx.strokeStyle = `${p.color}99`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label text
    ctx.fillStyle = '#e8edf4';
    ctx.textAlign = 'left';
    ctx.fillText(p.ticker, best.box.x + labelPaddingX, best.box.y + labelPaddingY + 14);

    occupied.push({
      x: best.box.x - 2,
      y: best.box.y - 2,
      w: best.box.w + 4,
      h: best.box.h + 4,
    });
  }

  // Title
  ctx.fillStyle = '#eef4ff';
  ctx.textAlign = 'left';
  ctx.font = '700 44px Inter, "Segoe UI", sans-serif';
  ctx.fillText('AI Revolution: Non-Obvious Investment Matrix', margin.left, 68);
  ctx.font = '500 22px Inter, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(203,214,228,0.9)';
  ctx.fillText('Narada Research · February 13, 2026 · 40 companies across 4 themes', margin.left, 104);

  // Legend panel
  const legendX = width - margin.right + 52;
  const legendY = margin.top + 24;
  const legendW = margin.right - 84;
  const legendH = 252;
  roundedRect(ctx, legendX, legendY, legendW, legendH, 12);
  ctx.fillStyle = 'rgba(14,20,30,0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(139,148,158,0.45)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#dce5f2';
  ctx.font = '700 22px Inter, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Legend', legendX + 20, legendY + 34);
  ctx.font = '500 16px Inter, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(220,228,238,0.82)';
  ctx.fillText('Circles: long ideas', legendX + 20, legendY + 58);
  ctx.fillText('Triangles: short ideas', legendX + 20, legendY + 80);

  const items = [
    ['Infrastructure', colors.Infra],
    ['Software & Data', colors.Software],
    ['Demand Side', colors.Demand],
    ['Short Book', colors.Short],
  ];

  items.forEach(([label, color], i) => {
    const y = legendY + 116 + i * 32;
    if (label === 'Short Book') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(legendX + 24, y - 9);
      ctx.lineTo(legendX + 15, y + 8);
      ctx.lineTo(legendX + 33, y + 8);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX + 24, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d4deea';
    ctx.font = '600 17px Inter, "Segoe UI", sans-serif';
    ctx.fillText(label, legendX + 44, y + 5);
  });

  return canvas;
}

const canvas = drawChart();
const filename = `AI_Investment_Matrix_${Date.now()}.png`;
const filepath = path.join(outputDir, filename);
const latestPath = path.join(outputDir, 'AI_Investment_Matrix_latest.png');
fs.writeFileSync(filepath, canvas.toBuffer('image/png'));
fs.writeFileSync(latestPath, canvas.toBuffer('image/png'));
console.log(`Chart saved: ${filepath}`);
console.log(`Chart saved: ${latestPath}`);
