PRAGMA foreign_keys = ON;

-- OPJC application migration: member resources
-- Safe to run against both opjc-uat and opjc-prod.
-- Re-running is safe because all objects use IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'link'
    CHECK (resource_type IN ('link','file')),
  url TEXT,
  file_key TEXT,
  file_name TEXT,
  mime_type TEXT,
  active INTEGER NOT NULL DEFAULT 1
    CHECK (active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_active_category_sort
  ON resources(active, category, sort_order, title);
