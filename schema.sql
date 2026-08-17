CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person TEXT NOT NULL,
  action_type TEXT NOT NULL,      -- 'cleaning' or 'trash'
  details TEXT NOT NULL,          -- JSON array, e.g. ["kitchen","bathroom"]
  entry_date TEXT NOT NULL,       -- YYYY-MM-DD
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_date ON logs (entry_date DESC, created_at DESC);
