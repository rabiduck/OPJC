PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS closures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  closure_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Club closed',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_closures_date ON closures(closure_date);
