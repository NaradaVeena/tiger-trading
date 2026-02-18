#!/bin/bash
# Archive today's watchlist charts to a dated directory for the portal
# Usage: bash scripts/archive-daily-charts.sh [YYYY-MM-DD]

set -e

DATE=${1:-$(date +%Y-%m-%d)}
CHARTS_DIR="/home/vamsi/tiger-trading/charts"
ARCHIVE_DIR="/home/vamsi/tiger-trading/research/aiportfolio/charts/$DATE"

mkdir -p "$ARCHIVE_DIR"

# Get watchlist tickers from DB
TICKERS=$(cd /home/vamsi/tiger-trading && node -e "
const db = require('better-sqlite3')('portfolio/data/portfolio.db');
const rows = db.prepare(\"SELECT ticker FROM thesis WHERE status IN ('active','weakened')\").all();
rows.forEach(r => console.log(r.ticker));
db.close();
")

echo "Archiving charts for $DATE..."
echo "Tickers: $TICKERS"

for TICKER in $TICKERS; do
  # Find the most recent 6mo daily chart for this ticker
  LATEST=$(ls -t "$CHARTS_DIR/${TICKER}_1d_6mo_"*.png 2>/dev/null | head -1)
  if [ -n "$LATEST" ]; then
    cp "$LATEST" "$ARCHIVE_DIR/${TICKER}_daily.png"
    echo "  ✅ $TICKER → ${TICKER}_daily.png"
  else
    echo "  ⚠️  $TICKER — no 6mo chart found"
  fi

  # Also grab 1yr if available
  LATEST_1Y=$(ls -t "$CHARTS_DIR/${TICKER}_1d_1y_"*.png 2>/dev/null | head -1)
  if [ -n "$LATEST_1Y" ]; then
    cp "$LATEST_1Y" "$ARCHIVE_DIR/${TICKER}_weekly.png"
    echo "  ✅ $TICKER → ${TICKER}_weekly.png"
  fi
done

# Generate index page for this date
cat > "$ARCHIVE_DIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tiger Charts — DATE_PLACEHOLDER</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
  h1 { color: #f59e0b; margin-bottom: 8px; font-size: 1.5rem; }
  .date { color: #888; margin-bottom: 24px; font-size: 0.9rem; }
  .nav { margin-bottom: 20px; }
  .nav a { color: #f59e0b; text-decoration: none; margin-right: 16px; font-size: 0.85rem; }
  .nav a:hover { text-decoration: underline; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(600px, 1fr)); gap: 16px; }
  .card { background: #141414; border: 1px solid #222; border-radius: 8px; overflow: hidden; }
  .card h3 { padding: 12px 16px 8px; color: #f59e0b; font-size: 1.1rem; }
  .card img { width: 100%; display: block; cursor: pointer; }
  .card img:hover { opacity: 0.9; }
  /* Lightbox */
  .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 100; cursor: pointer; justify-content: center; align-items: center; }
  .lightbox.active { display: flex; }
  .lightbox img { max-width: 95%; max-height: 95%; object-fit: contain; }
</style>
</head>
<body>
<div class="nav">
  <a href="../">← All Dates</a>
  <a href="../../">🐯 Dashboard</a>
</div>
<h1>🐯 Tiger Charts</h1>
<p class="date">DATE_PLACEHOLDER</p>
<div class="grid" id="grid"></div>
<div class="lightbox" id="lightbox" onclick="this.classList.remove('active')">
  <img id="lb-img" src="">
</div>
<script>
const files = FILES_PLACEHOLDER;
const grid = document.getElementById('grid');
files.forEach(f => {
  const ticker = f.replace(/_daily\.png|_weekly\.png/, '');
  const type = f.includes('weekly') ? '(Weekly)' : '(Daily 6mo)';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h3>${ticker} ${type}</h3><img src="${f}" onclick="document.getElementById('lb-img').src=this.src; document.getElementById('lightbox').classList.add('active');">`;
  grid.appendChild(card);
});
</script>
</body>
</html>
HTMLEOF

# Replace placeholders
sed -i "s/DATE_PLACEHOLDER/$DATE/g" "$ARCHIVE_DIR/index.html"

# Build file list
FILES_JSON=$(cd "$ARCHIVE_DIR" && ls *.png 2>/dev/null | sort | while read f; do echo "\"$f\""; done | paste -sd, -)
sed -i "s|FILES_PLACEHOLDER|[$FILES_JSON]|" "$ARCHIVE_DIR/index.html"

# Update dates.json manifest (list of all archived dates, newest first)
CHARTS_ROOT="/home/vamsi/tiger-trading/research/aiportfolio/charts"
(cd "$CHARTS_ROOT" && ls -d 20??-??-?? 2>/dev/null | sort -r | python3 -c "
import sys, json
dates = [line.strip() for line in sys.stdin if line.strip()]
json.dump(dates, sys.stdout)
") > "$CHARTS_ROOT/dates.json"

echo ""
echo "Archive: $ARCHIVE_DIR"
echo "Portal:  https://narada.galigutta.com/aiportfolio/charts/$DATE/"
echo "Done."
