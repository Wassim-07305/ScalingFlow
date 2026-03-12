-- =====================================================
-- Migration: Integration fields + Competitor analysis enrichment
-- Description: Add GHL, Stripe Connect fields to profiles + competitor_analysis JSONB to market_analyses
-- =====================================================

-- Add integration fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ghl_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- Add full competitor analysis JSONB to market_analyses
-- Stores enriched data: ad insights, content insights, benchmarks
ALTER TABLE market_analyses
  ADD COLUMN IF NOT EXISTS competitor_analysis JSONB;

-- Comments
COMMENT ON COLUMN profiles.ghl_webhook_url IS 'GoHighLevel webhook URL for outbound lead sync';
COMMENT ON COLUMN profiles.stripe_connect_account_id IS 'Stripe Connect account ID for user business revenue tracking';
COMMENT ON COLUMN market_analyses.competitor_analysis IS 'Full AI competitor analysis with ad/content insights and benchmarks';
