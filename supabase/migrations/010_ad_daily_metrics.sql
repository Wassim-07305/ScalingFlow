-- =====================================================
-- Migration: Ad Daily Metrics (Métriques quotidiennes)
-- Description: Table pour stocker les métriques ads par jour
-- =====================================================

-- Table pour les metriques quotidiennes des ads
CREATE TABLE IF NOT EXISTS ad_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend DECIMAL(10, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  roas DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ctr DECIMAL(5, 2) NOT NULL DEFAULT 0,
  cpm DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cpa DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une seule entree par utilisateur par jour
  UNIQUE(user_id, date)
);

-- Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_ad_daily_metrics_user_date
  ON ad_daily_metrics(user_id, date DESC);

-- RLS
ALTER TABLE ad_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ad metrics"
  ON ad_daily_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad metrics"
  ON ad_daily_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad metrics"
  ON ad_daily_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_ad_daily_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ad_daily_metrics_updated_at
  BEFORE UPDATE ON ad_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_ad_daily_metrics_updated_at();

-- Commentaires
COMMENT ON TABLE ad_daily_metrics IS 'Metriques publicitaires quotidiennes par utilisateur';
COMMENT ON COLUMN ad_daily_metrics.roas IS 'Return on Ad Spend (retour sur investissement publicitaire)';
COMMENT ON COLUMN ad_daily_metrics.ctr IS 'Click-Through Rate en pourcentage';
COMMENT ON COLUMN ad_daily_metrics.cpm IS 'Cost Per Mille (cout pour 1000 impressions)';
COMMENT ON COLUMN ad_daily_metrics.cpa IS 'Cost Per Acquisition (cout par conversion)';
