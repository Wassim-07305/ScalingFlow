-- Persistent rate limiting table (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by key
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (key);

-- Auto-cleanup: delete expired entries every hour via pg_cron or manual call
-- For now, the application cleans up expired entries on each check.
