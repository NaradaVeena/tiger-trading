#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'portfolio.db');
const db = new Database(dbPath);

console.log('🗄️  Initializing portfolio database...');

// Create tables
db.exec(`
-- Current positions
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL, -- 'stock', 'call', 'put', 'leap'
  shares REAL DEFAULT 0,
  avg_cost REAL DEFAULT 0,
  current_price REAL DEFAULT 0,
  market_value REAL DEFAULT 0,
  unrealized_pnl REAL DEFAULT 0,
  unrealized_pnl_pct REAL DEFAULT 0,
  first_entry DATE,
  last_updated DATETIME,
  status TEXT DEFAULT 'open', -- 'open', 'closed'
  notes TEXT
);

-- All trades (proforma and locked)
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL, -- 'buy', 'sell'
  type TEXT NOT NULL, -- 'stock', 'call', 'put', 'leap'
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'proforma', -- 'proforma', 'locked', 'cancelled'
  reasoning TEXT,
  thesis TEXT,
  chart_grade TEXT,
  risk_reward TEXT,
  proforma_price REAL, -- price when proposed at 11 AM
  locked_price REAL, -- actual price locked at 2 PM
  locked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  category TEXT, -- 'market', 'position', 'thesis', 'review', 'lesson'
  ticker TEXT, -- optional, for position-specific entries
  entry TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Thesis tracking per ticker
CREATE TABLE IF NOT EXISTS thesis (
  id INTEGER PRIMARY KEY,
  ticker TEXT NOT NULL,
  company TEXT,
  thesis TEXT NOT NULL,
  category TEXT, -- 'core', 'growth', 'watch', 'short'
  status TEXT DEFAULT 'active', -- 'active', 'weakened', 'invalidated', 'upgraded'
  key_metrics TEXT, -- JSON string
  catalysts TEXT, -- JSON string  
  invalidation TEXT, -- what would kill the thesis
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio snapshots for historical tracking
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  total_value REAL,
  cash REAL,
  invested REAL,
  unrealized_pnl REAL,
  realized_pnl REAL,
  day_pnl REAL,
  positions_json TEXT, -- JSON snapshot of all positions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// Insert initial config
const insertConfig = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
insertConfig.run('starting_capital', '100000');
insertConfig.run('cash', '100000');
insertConfig.run('portfolio_name', 'Tiger Portfolio');
insertConfig.run('created_date', '2026-02-14');

console.log('✅ Database tables created successfully');

// Insert initial thesis entries
const insertThesis = db.prepare(`
  INSERT INTO thesis (ticker, company, thesis, category, status, created_at, updated_at) 
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const thesisData = [
  ['ALAB', 'Astera Labs', 'PCIe/CXL/Ethernet connectivity leader. 115% rev growth, 74% GM, Amazon $466M warrant. Post-earnings selloff (Feb 10) created accumulation zone.', 'core', 'active'],
  ['NVT', 'nVent Electric', 'NVIDIA liquid cooling partner. 28x fwd P/E, $2.3B backlog (3x YoY), 30% rev growth. Testing $115-121 resistance.', 'core', 'active'],
  ['FN', 'Fabrinet', 'Sole manufacturer 1.6T optical transceivers for NVIDIA Blackwell. 100% market share. Asset-light model.', 'core', 'active'],
  ['CRDO', 'Credo Technology', '88% AEC market share, 173% FY26 rev growth. Sitting on 200d SMA at $122.', 'growth', 'active'],
  ['COHR', 'Coherent Corp', '4x book-to-bill, InP vertical integration. Chart has thin structure above $121.', 'watch', 'weakened'],
  ['PWR', 'Quanta Services', 'Largest electrical contractor, 68K workers, $39.2B backlog. Near ATH, 76x P/E.', 'watch', 'weakened']
];

thesisData.forEach(([ticker, company, thesis, category, status]) => {
  insertThesis.run(ticker, company, thesis, category, status);
});

console.log('✅ Initial thesis entries added');

// Insert initial journal entry
const insertJournal = db.prepare(`
  INSERT INTO journal (date, time, category, entry, created_at)
  VALUES (date('now'), time('now'), ?, ?, datetime('now'))
`);

insertJournal.run('market', 'Portfolio created. $100K starting capital. Tiger cub approach: concentrated, high-conviction AI infrastructure plays. Phase 1 entries planned for Tuesday Feb 17. ALAB is top pick post-earnings washout.');

console.log('✅ Initial journal entry added');

db.close();
console.log('🎉 Portfolio database initialized successfully!');