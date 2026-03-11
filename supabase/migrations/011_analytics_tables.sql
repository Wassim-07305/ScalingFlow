-- ─── A/B Tests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  target_sample_size INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  winner TEXT CHECK (winner IN ('A', 'B')),

  variant_a_description TEXT NOT NULL,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_a_traffic INTEGER DEFAULT 0,

  variant_b_description TEXT NOT NULL,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_b_traffic INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AB tests" ON public.ab_tests
  FOR ALL USING (auth.uid() = user_id);

-- ─── LTV/CAC Entries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ltv_cac_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  date TEXT NOT NULL, -- YYYY-MM format
  avg_deal_value NUMERIC NOT NULL DEFAULT 0,
  monthly_churn_rate NUMERIC NOT NULL DEFAULT 0.05,
  monthly_ad_spend NUMERIC NOT NULL DEFAULT 0,
  new_customers INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.ltv_cac_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own LTV/CAC entries" ON public.ltv_cac_entries
  FOR ALL USING (auth.uid() = user_id);

-- ─── Daily Performance Metrics (user-entered) ──────────────
CREATE TABLE IF NOT EXISTS public.daily_performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  date DATE NOT NULL,
  spend NUMERIC NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  clients INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily metrics" ON public.daily_performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- ─── Growth Tier Checkpoints ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.growth_checkpoints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  tier_id TEXT NOT NULL,
  checkpoint TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tier_id, checkpoint)
);

ALTER TABLE public.growth_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own growth checkpoints" ON public.growth_checkpoints
  FOR ALL USING (auth.uid() = user_id);
