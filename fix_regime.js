const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'portfolio/data/portfolio.db'));

db.prepare("UPDATE regime_summary SET regime = 'Trending' WHERE regime LIKE 'Trending%' AND date='2026-02-23'").run();
db.prepare("UPDATE regime_summary SET regime = 'Chop' WHERE regime LIKE 'Chop%' AND date='2026-02-23'").run();
db.prepare("UPDATE regime_summary SET regime = 'Mixed' WHERE regime LIKE 'Mixed%' AND date='2026-02-23'").run();
db.prepare("UPDATE regime_summary SET regime = 'Transition' WHERE regime LIKE 'Transition%' AND date='2026-02-23'").run();
db.prepare("UPDATE regime_summary SET regime = 'Goldilocks' WHERE regime LIKE 'Goldilocks%' AND date='2026-02-23'").run();

const todayStr = '2026-02-23';
const tickers = db.prepare("SELECT DISTINCT ticker FROM regime_summary WHERE date = ?").all(todayStr).map(t => t.ticker);
let changes = [];
for (const t of tickers) {
  const current = db.prepare("SELECT regime FROM regime_summary WHERE ticker=? AND date=?").get(t, todayStr);
  const prev = db.prepare("SELECT regime FROM regime_summary WHERE ticker=? AND date<? ORDER BY date DESC LIMIT 1").get(t, todayStr);
  if (current && prev && current.regime.toLowerCase() !== prev.regime.toLowerCase()) {
    changes.push(`${t}: ${prev.regime} -> ${current.regime}`);
  }
}
console.log("Real changes:", changes);
