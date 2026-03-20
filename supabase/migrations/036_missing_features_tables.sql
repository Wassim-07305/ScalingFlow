-- Migration: Tables pour F67, F68, F71, F73, F74, F79, F83
-- Bottleneck detection, Smart alerts, Creative cycle, Content auto, Whitelabel, Daily plans

-- ─── Smart alerts (F68) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- procrastination, blank_week, budget_no_roas, streak_broken, funnel_missing
  severity text NOT NULL DEFAULT 'info', -- info, warning, critical
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_user ON smart_alerts(user_id, read, created_at DESC);

-- ─── Content library extensions (F73, F74) ───────────────────
DO $$ BEGIN
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS pillar text;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS reasoning text;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS based_on_performance boolean DEFAULT false;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
  ALTER TABLE content_library ADD COLUMN IF NOT EXISTS best_posting_time text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── Content adaptations (F74) ───────────────────────────────
CREATE TABLE IF NOT EXISTS content_adaptations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy jsonb NOT NULL DEFAULT '{}',
  contents_generated integer DEFAULT 0,
  week_of timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── Ad creatives extensions (F71) ───────────────────────────
DO $$ BEGIN
  ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
  ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS based_on_winner text;
  ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS variation_description text;
  ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS cta text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── Daily plans (F83) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  motivation_message text,
  focus_theme text,
  actions jsonb DEFAULT '[]',
  total_xp integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date DESC);

-- ─── Whitelabel config (F79) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS whitelabel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  brand_name text,
  primary_color text DEFAULT '#34D399',
  accent_color text DEFAULT '#10B981',
  logo_url text,
  favicon_url text,
  custom_domain text,
  email_from_name text,
  report_header text,
  report_footer text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ─── Whitelabel reports (F79) ────────────────────────────────
CREATE TABLE IF NOT EXISTS whitelabel_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'weekly', -- weekly, monthly, campaign
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ─── Funnel leads tracking (F67 bottleneck) ──────────────────
CREATE TABLE IF NOT EXISTS funnel_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funnel_id uuid,
  email text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_leads_user ON funnel_leads(user_id, created_at DESC);

-- ─── Sales calls extensions (F67, F75) ───────────────────────
DO $$ BEGIN
  ALTER TABLE sales_calls ADD COLUMN IF NOT EXISTS objections jsonb DEFAULT '[]';
  ALTER TABLE sales_calls ADD COLUMN IF NOT EXISTS key_moments jsonb DEFAULT '[]';
  ALTER TABLE sales_calls ADD COLUMN IF NOT EXISTS prospect_source text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── Revenue entries (F67) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  source text,
  campaign_id uuid,
  creative_name text,
  audience text,
  channel text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ─── Profile extensions ──────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenue_target text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── RLS policies ────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE smart_alerts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE content_adaptations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE whitelabel_config ENABLE ROW LEVEL SECURITY;
  ALTER TABLE whitelabel_reports ENABLE ROW LEVEL SECURITY;
  ALTER TABLE funnel_leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Smart alerts policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own alerts" ON smart_alerts;
CREATE POLICY "Users see own alerts" ON smart_alerts FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users update own alerts" ON smart_alerts;
CREATE POLICY "Users update own alerts" ON smart_alerts FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Content adaptations policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own adaptations" ON content_adaptations;
CREATE POLICY "Users see own adaptations" ON content_adaptations FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Daily plans policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own plans" ON daily_plans;
CREATE POLICY "Users manage own plans" ON daily_plans FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Whitelabel policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own wl config" ON whitelabel_config;
CREATE POLICY "Users manage own wl config" ON whitelabel_config FOR ALL USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users manage own wl reports" ON whitelabel_reports;
CREATE POLICY "Users manage own wl reports" ON whitelabel_reports FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Funnel leads policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own leads" ON funnel_leads;
CREATE POLICY "Users see own leads" ON funnel_leads FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Revenue entries policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage own revenue" ON revenue_entries;
CREATE POLICY "Users manage own revenue" ON revenue_entries FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
