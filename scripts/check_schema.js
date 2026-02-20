const Database = require('better-sqlite3');
const db = new Database('portfolio/data/portfolio.db');

try {
  const scores = db.prepare("PRAGMA table_info(indicator_scores)").all();
  const summary = db.prepare("PRAGMA table_info(regime_summary)").all();
  
  if (scores.length > 0) {
      console.log('indicator_scores table exists.');
  } else {
      console.log('indicator_scores table MISSING.');
  }
  
  if (summary.length > 0) {
      console.log('regime_summary table exists.');
  } else {
      console.log('regime_summary table MISSING.');
  }

} catch (err) {
  console.error(err);
}
