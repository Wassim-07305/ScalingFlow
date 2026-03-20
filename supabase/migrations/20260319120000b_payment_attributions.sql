-- Migration: payment_attributions
-- Track which ad creative / campaign generated each Stripe payment

CREATE TABLE IF NOT EXISTS payment_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,
  stripe_session_id TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  -- UTM attribution params
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,  -- typically the creative name / ad creative id
  utm_term TEXT,
  -- Meta-specific click identifier
  fbclid TEXT,
  -- Parsed Meta ad hierarchy IDs (extracted from utm_content if formatted as campaign:{id}|adset:{id}|ad:{id})
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE payment_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own payment attributions" ON payment_attributions;
CREATE POLICY "Users see own payment attributions" ON payment_attributions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (webhook uses service role key)
DROP POLICY IF EXISTS "Service role can insert payment attributions" ON payment_attributions;
CREATE POLICY "Service role can insert payment attributions" ON payment_attributions FOR INSERT
  WITH CHECK (true);

-- Indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_payment_attributions_user_id ON payment_attributions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attributions_utm_campaign ON payment_attributions (utm_campaign);
CREATE INDEX IF NOT EXISTS idx_payment_attributions_utm_content ON payment_attributions (utm_content);
CREATE INDEX IF NOT EXISTS idx_payment_attributions_created_at ON payment_attributions (created_at);
