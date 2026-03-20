-- ================================================================
-- Migration 050: AI Generations tracking table
-- Tracks every AI generation for quota enforcement and cost analytics
-- ================================================================

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL,         -- 'offer', 'market_analysis', 'content', 'ads', 'funnel', 'brand', 'call_analysis', 'agent_chat', 'scoring', 'audit', etc.
  model TEXT NOT NULL DEFAULT 'sonnet',  -- 'haiku' | 'sonnet'
  input_tokens INT,
  output_tokens INT,
  cost_usd NUMERIC(10,6),               -- actual cost in USD
  cached_tokens INT DEFAULT 0,           -- tokens served from prompt cache
  is_cron BOOLEAN DEFAULT FALSE,         -- true = background CRON, not counted in user quota
  metadata JSONB,                        -- additional context (funnel_id, offer_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast monthly count per user (the primary quota query)
CREATE INDEX IF NOT EXISTS idx_ai_gen_user_month
  ON ai_generations(user_id, created_at);

-- Index for analytics by generation type
CREATE INDEX IF NOT EXISTS idx_ai_gen_type
  ON ai_generations(generation_type);

-- Index for filtering out CRONs in quota counting
CREATE INDEX IF NOT EXISTS idx_ai_gen_user_nocron
  ON ai_generations(user_id, created_at) WHERE is_cron = FALSE;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generations" ON ai_generations;
CREATE POLICY "Users can view own generations" ON ai_generations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generations" ON ai_generations;
CREATE POLICY "Users can insert own generations" ON ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all (for analytics dashboard)
DROP POLICY IF EXISTS "Admins can view all generations" ON ai_generations;
CREATE POLICY "Admins can view all generations" ON ai_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
