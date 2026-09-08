-- OPJC shared auth migration: environment-scoped accounts
-- Existing users and tokens become production-scoped.
-- UAT-created accounts will later be stamped uat_only by the Worker.

ALTER TABLE users
ADD COLUMN account_scope TEXT NOT NULL DEFAULT 'production'
CHECK (account_scope IN ('production','uat_only'));

ALTER TABLE account_tokens
ADD COLUMN account_scope TEXT NOT NULL DEFAULT 'production'
CHECK (account_scope IN ('production','uat_only'));

CREATE INDEX IF NOT EXISTS idx_users_scope_active
ON users(account_scope, active);

CREATE INDEX IF NOT EXISTS idx_account_tokens_scope_type_expiry
ON account_tokens(account_scope, type, expires_at);
