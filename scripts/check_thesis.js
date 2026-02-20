const Database = require('better-sqlite3');
const db = new Database('portfolio/data/portfolio.db');

try {
  const info = db.prepare("PRAGMA table_info(thesis)").all();
  console.log(info);
} catch (err) {
  console.error(err);
}
