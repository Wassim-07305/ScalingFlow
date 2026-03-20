-- =====================================================
-- Migration: Ads Automation Tables (#69, #70, #72)
-- Description: Tables pour le monitoring, décisions auto et scaling progressif
-- =====================================================

-- ─── Table: ad_alerts (Monitoring continu #69) ──────────────────
CREATE TABLE IF NOT EXISTS public.ad_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,

  creative_name TEXT,
  campaign_name TEXT,

  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_ctr', 'high_cpc', 'high_frequency', 'low_roas', 'high_cpm', 'anomaly')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),

  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10, 4) NOT NULL,
  threshold_value DECIMAL(10, 4) NOT NULL,
  message TEXT NOT NULL,

  -- KPI snapshot au moment de l'alerte
  kpi_snapshot JSONB,

  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_alerts_user_created
  ON public.ad_alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_alerts_unresolved
  ON public.ad_alerts(user_id, resolved, created_at DESC);

ALTER TABLE public.ad_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ad alerts" ON public.ad_alerts;
CREATE POLICY "Users manage own ad alerts" ON public.ad_alerts FOR ALL USING (auth.uid() = user_id);

-- ─── Table: ad_decisions (Décisions automatiques #70) ───────────
CREATE TABLE IF NOT EXISTS public.ad_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,

  creative_name TEXT,
  campaign_name TEXT,

  decision_type TEXT NOT NULL CHECK (decision_type IN ('pause', 'scale', 'maintain', 'creative_fatigue', 'reallocate', 'rollback')),
  reason TEXT NOT NULL,
  details TEXT,

  -- Métriques au moment de la décision
  metrics_snapshot JSONB,

  -- Action Meta API
  meta_action TEXT,
  meta_action_payload JSONB,
  meta_action_result JSONB,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled', 'failed')),
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_decisions_user_created
  ON public.ad_decisions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_decisions_status
  ON public.ad_decisions(user_id, status, created_at DESC);

ALTER TABLE public.ad_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ad decisions" ON public.ad_decisions;
CREATE POLICY "Users manage own ad decisions" ON public.ad_decisions FOR ALL USING (auth.uid() = user_id);

-- ─── Table: ad_scaling_history (Scaling progressif #72) ─────────
CREATE TABLE IF NOT EXISTS public.ad_scaling_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  adset_id TEXT,

  creative_name TEXT,
  campaign_name TEXT,

  tier_level INTEGER NOT NULL DEFAULT 1,
  previous_budget DECIMAL(10, 2) NOT NULL,
  new_budget DECIMAL(10, 2) NOT NULL,
  scale_percent DECIMAL(5, 2) NOT NULL,

  roas_at_scale DECIMAL(5, 2),
  roas_after_24h DECIMAL(5, 2),
  roas_threshold DECIMAL(5, 2) NOT NULL DEFAULT 1.5,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'validated', 'rollback', 'failed')),
  rollback_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,

  meta_action_result JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ad_scaling_user_created
  ON public.ad_scaling_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_scaling_pending_check
  ON public.ad_scaling_history(status, check_at)
  WHERE status = 'active';

ALTER TABLE public.ad_scaling_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ad scaling history" ON public.ad_scaling_history;
CREATE POLICY "Users manage own ad scaling history" ON public.ad_scaling_history FOR ALL USING (auth.uid() = user_id);

-- ─── Table: ad_automation_config (paramètres par utilisateur) ───
CREATE TABLE IF NOT EXISTS public.ad_automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  enabled BOOLEAN DEFAULT FALSE,

  -- Seuils monitoring
  ctr_min DECIMAL(5, 2) DEFAULT 1.0,
  cpc_max DECIMAL(10, 2) DEFAULT 2.0,
  cpm_max DECIMAL(10, 2) DEFAULT 15.0,
  frequency_max DECIMAL(5, 2) DEFAULT 2.5,
  roas_min DECIMAL(5, 2) DEFAULT 1.0,

  -- Seuils décisions auto
  winner_roas_min DECIMAL(5, 2) DEFAULT 2.0,
  winner_ctr_min DECIMAL(5, 2) DEFAULT 2.0,
  winner_spend_min DECIMAL(10, 2) DEFAULT 50.0,
  loser_roas_max DECIMAL(5, 2) DEFAULT 0.5,
  loser_min_impressions INTEGER DEFAULT 100,
  fatigue_frequency_max DECIMAL(5, 2) DEFAULT 3.0,
  fatigue_ctr_drop_percent DECIMAL(5, 2) DEFAULT 30.0,

  -- Seuils scaling
  scale_increment_percent DECIMAL(5, 2) DEFAULT 20.0,
  scale_roas_threshold DECIMAL(5, 2) DEFAULT 1.5,
  scale_max_budget DECIMAL(10, 2) DEFAULT 1000.0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ad_automation_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ad automation config" ON public.ad_automation_config;
CREATE POLICY "Users manage own ad automation config" ON public.ad_automation_config FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ad_automation_config_updated_at ON public.ad_automation_config;
CREATE TRIGGER update_ad_automation_config_updated_at
  BEFORE UPDATE ON public.ad_automation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Commentaires
COMMENT ON TABLE public.ad_alerts IS 'Alertes de monitoring des créatives publicitaires';
COMMENT ON TABLE public.ad_decisions IS 'Décisions automatiques (pause, scale, fatigue, etc.)';
COMMENT ON TABLE public.ad_scaling_history IS 'Historique du scaling progressif par palier';
COMMENT ON TABLE public.ad_automation_config IS 'Configuration des seuils d''automatisation par utilisateur';
