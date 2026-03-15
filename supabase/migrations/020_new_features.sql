-- ═══════════════════════════════════════════════════════════
-- Migration 020: New feature tables for CDC completion
-- ═══════════════════════════════════════════════════════════

-- Add unique_mechanism_details to offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS unique_mechanism_details jsonb;

-- Revenue tracking table (#65)
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  source text, -- 'meta_ads', 'instagram', 'youtube', 'organic', 'referral', 'other'
  campaign_name text,
  creative_name text,
  audience_name text,
  channel text,
  notes text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_user ON revenue_entries(user_id);
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own revenue" ON revenue_entries
  FOR ALL USING (auth.uid() = user_id);

-- Sales call logs (#76, #77)
CREATE TABLE IF NOT EXISTS sales_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  call_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer,
  outcome text, -- 'closing', 'no_show', 'objection', 'follow_up', 'disqualified'
  revenue numeric DEFAULT 0,
  main_objection text,
  lead_source text,
  notes text,
  ai_score integer, -- /70 scoring
  ai_feedback jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_calls_user ON sales_call_logs(user_id);
ALTER TABLE sales_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calls" ON sales_call_logs
  FOR ALL USING (auth.uid() = user_id);

-- Ad automation config (#69-72)
CREATE TABLE IF NOT EXISTS ad_automation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cpa_max numeric DEFAULT 30,
  roas_min numeric DEFAULT 2,
  ctr_min numeric DEFAULT 1,
  frequency_max numeric DEFAULT 2.5,
  scale_increment numeric DEFAULT 20,
  scaling_rules jsonb DEFAULT '[]'::jsonb,
  enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_automation_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad config" ON ad_automation_config
  FOR ALL USING (auth.uid() = user_id);

-- Ad automation decision log (#70)
CREATE TABLE IF NOT EXISTS ad_automation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL, -- 'cut', 'scale', 'reallocate', 'fatigue', 'rollback'
  creative_name text,
  campaign_name text,
  reason text,
  details jsonb,
  status text DEFAULT 'pending', -- 'pending', 'applied', 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_auto_log_user ON ad_automation_log(user_id);
ALTER TABLE ad_automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad log" ON ad_automation_log
  FOR ALL USING (auth.uid() = user_id);

-- Pre-launch checklist status (#60)
CREATE TABLE IF NOT EXISTS launch_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  offer_ready boolean DEFAULT false,
  funnel_ready boolean DEFAULT false,
  market_validated boolean DEFAULT false,
  brand_ready boolean DEFAULT false,
  pixel_installed boolean DEFAULT false,
  integrations_ready boolean DEFAULT false,
  content_ready boolean DEFAULT false,
  audience_ready boolean DEFAULT false,
  all_passed boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklist" ON launch_checklist
  FOR ALL USING (auth.uid() = user_id);

-- Content batch history (#73)
CREATE TABLE IF NOT EXISTS content_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_number integer,
  year integer,
  content_pieces jsonb NOT NULL DEFAULT '[]'::jsonb,
  performance_input text,
  objections_input text,
  ai_raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_batches_user ON content_batches(user_id);
ALTER TABLE content_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own batches" ON content_batches
  FOR ALL USING (auth.uid() = user_id);

-- Meta audiences created (#58)
CREATE TABLE IF NOT EXISTS meta_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meta_audience_id text, -- ID from Meta API
  name text NOT NULL,
  temperature text NOT NULL, -- 'cold', 'warm', 'hot', 'exclusion'
  targeting_spec jsonb,
  status text DEFAULT 'draft', -- 'draft', 'active', 'error'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_audiences_user ON meta_audiences(user_id);
ALTER TABLE meta_audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own audiences" ON meta_audiences
  FOR ALL USING (auth.uid() = user_id);
