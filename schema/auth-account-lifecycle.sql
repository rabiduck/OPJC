PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS account_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('invite','reset')),
  email TEXT COLLATE NOCASE,
  display_name TEXT,
  user_id INTEGER,
  role TEXT CHECK (role IN ('member','admin')),
  account_scope TEXT NOT NULL DEFAULT 'production' CHECK (account_scope IN ('production','uat_only')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_account_tokens_hash ON account_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_account_tokens_email ON account_tokens(email);
CREATE INDEX IF NOT EXISTS idx_account_tokens_user_id ON account_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_account_tokens_expiry ON account_tokens(expires_at);


CREATE INDEX IF NOT EXISTS idx_account_tokens_scope_type_expiry ON account_tokens(account_scope, type, expires_at);
