-- ============================================
-- SCALINGFLOW — SCHEMA INITIAL
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'coach')),

  -- Onboarding data
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  skills TEXT[],
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  current_revenue INTEGER,
  target_revenue INTEGER,
  industries TEXT[],
  objectives TEXT[],
  budget_monthly INTEGER,

  -- Business data
  selected_market TEXT,
  market_viability_score INTEGER,
  niche TEXT,

  -- Gamification
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  badges TEXT[],

  -- Progression
  global_progress FLOAT DEFAULT 0,

  -- Settings
  show_on_leaderboard BOOLEAN DEFAULT TRUE,
  show_revenue BOOLEAN DEFAULT FALSE,

  -- Stripe
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active',

  -- Meta Ads
  meta_access_token TEXT,
  meta_ad_account_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKET ANALYSIS
-- ============================================

CREATE TABLE IF NOT EXISTS public.market_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  market_name TEXT NOT NULL,
  market_description TEXT,
  problems TEXT[],
  opportunities TEXT[],
  competitors JSONB,
  demand_signals JSONB,
  viability_score INTEGER,
  recommended_positioning TEXT,
  target_avatar JSONB,

  ai_raw_response JSONB,
  selected BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OFFERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  market_analysis_id UUID REFERENCES public.market_analyses(id),

  offer_name TEXT NOT NULL,
  positioning TEXT,
  unique_mechanism TEXT,
  pricing_strategy JSONB,
  guarantees JSONB,
  no_brainer_element TEXT,
  risk_reversal TEXT,

  delivery_structure JSONB,
  oto_offer JSONB,
  full_document TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active')),
  ai_raw_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNNELS
-- ============================================

CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES public.offers(id),

  funnel_name TEXT NOT NULL,
  custom_domain TEXT,

  optin_page JSONB,
  vsl_page JSONB,
  thankyou_page JSONB,
  ab_variants JSONB,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),

  total_visits INTEGER DEFAULT 0,
  total_optins INTEGER DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES ASSETS
-- ============================================

CREATE TABLE IF NOT EXISTS public.sales_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES public.offers(id),

  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'vsl_script', 'thankyou_video_script', 'case_study',
    'email_sequence', 'sms_sequence', 'sales_letter',
    'pitch_deck', 'sales_script', 'lead_magnet'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active')),
  ai_raw_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADS & CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS public.ad_creatives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  creative_type TEXT NOT NULL CHECK (creative_type IN ('image', 'video_script', 'carousel')),
  ad_copy TEXT NOT NULL,
  headline TEXT,
  hook TEXT,
  cta TEXT,
  image_url TEXT,
  video_script TEXT,

  target_audience TEXT,
  angle TEXT,

  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  spend FLOAT DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpa FLOAT DEFAULT 0,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'active', 'paused', 'stopped')),
  meta_ad_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  campaign_name TEXT NOT NULL,
  campaign_type TEXT CHECK (campaign_type IN ('awareness', 'traffic', 'conversions', 'retargeting')),
  daily_budget FLOAT,
  total_budget FLOAT,

  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  audience_config JSONB,

  total_spend FLOAT DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  roas FLOAT DEFAULT 0,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  ai_recommendations JSONB,

  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_pieces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  content_type TEXT NOT NULL CHECK (content_type IN (
    'instagram_post', 'instagram_reel', 'instagram_story', 'instagram_carousel',
    'youtube_video', 'youtube_short',
    'linkedin_post',
    'tiktok_video',
    'blog_post'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  hook TEXT,
  hashtags TEXT[],
  media_urls TEXT[],

  scheduled_date DATE,
  published BOOLEAN DEFAULT FALSE,
  published_url TEXT,

  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACADEMY & VIDEOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.academy_modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  module_name TEXT NOT NULL,
  module_slug TEXT UNIQUE NOT NULL,
  module_description TEXT,
  module_order INTEGER NOT NULL,
  icon TEXT,
  color TEXT,

  total_videos INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academy_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  video_order INTEGER NOT NULL,

  resources JSONB,
  related_saas_module TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.academy_videos(id) ON DELETE CASCADE NOT NULL,

  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMPTZ,
  watch_percentage FLOAT DEFAULT 0,

  UNIQUE(user_id, video_id)
);

-- ============================================
-- ROADMAP & TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  title TEXT NOT NULL,
  description TEXT,
  milestone_order INTEGER NOT NULL,
  badge_name TEXT,
  icon TEXT,
  avg_days_to_reach INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE NOT NULL,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, milestone_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN ('action', 'video', 'review', 'launch')),

  related_module TEXT,
  related_video_id UUID REFERENCES public.academy_videos(id),
  related_milestone_id UUID REFERENCES public.milestones(id),

  estimated_minutes INTEGER,
  due_date DATE,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  task_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  category TEXT NOT NULL CHECK (category IN ('general', 'wins', 'questions', 'feedback', 'offers', 'ads')),
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[],

  pinned BOOLEAN DEFAULT FALSE,
  auto_generated BOOLEAN DEFAULT FALSE,

  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- LEADERBOARD
-- ============================================

CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  progress_score INTEGER DEFAULT 0,
  business_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  composite_score INTEGER DEFAULT 0,

  rank_position INTEGER,

  monthly_revenue FLOAT DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('milestone', 'badge', 'community', 'task', 'system', 'win')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,

  read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG (for streaks & heatmap)
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  activity_type TEXT NOT NULL,
  activity_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON public.activity_log (user_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User-owned tables
DROP POLICY IF EXISTS "Users manage own market analyses" ON public.market_analyses;
CREATE POLICY "Users manage own market analyses" ON public.market_analyses FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own offers" ON public.offers;
CREATE POLICY "Users manage own offers" ON public.offers FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own funnels" ON public.funnels;
CREATE POLICY "Users manage own funnels" ON public.funnels FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own sales assets" ON public.sales_assets;
CREATE POLICY "Users manage own sales assets" ON public.sales_assets FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own ad creatives" ON public.ad_creatives;
CREATE POLICY "Users manage own ad creatives" ON public.ad_creatives FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Users manage own ad campaigns" ON public.ad_campaigns FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own content" ON public.content_pieces;
CREATE POLICY "Users manage own content" ON public.content_pieces FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own video progress" ON public.video_progress;
CREATE POLICY "Users manage own video progress" ON public.video_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own milestones" ON public.user_milestones;
CREATE POLICY "Users manage own milestones" ON public.user_milestones FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own activity log" ON public.activity_log;
CREATE POLICY "Users manage own activity log" ON public.activity_log FOR ALL USING (auth.uid() = user_id);

-- Community
DROP POLICY IF EXISTS "Community posts are viewable by all" ON public.community_posts;
CREATE POLICY "Community posts are viewable by all" ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users manage own posts" ON public.community_posts;
CREATE POLICY "Users manage own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own posts" ON public.community_posts;
CREATE POLICY "Users update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own posts" ON public.community_posts;
CREATE POLICY "Users delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments are viewable by all" ON public.community_comments;
CREATE POLICY "Comments are viewable by all" ON public.community_comments FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users manage own comments" ON public.community_comments;
CREATE POLICY "Users manage own comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own comments" ON public.community_comments;
CREATE POLICY "Users delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Likes are viewable by all" ON public.community_likes;
CREATE POLICY "Likes are viewable by all" ON public.community_likes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users manage own likes" ON public.community_likes;
CREATE POLICY "Users manage own likes" ON public.community_likes FOR ALL USING (auth.uid() = user_id);

-- Leaderboard & Academy
DROP POLICY IF EXISTS "Leaderboard viewable by all" ON public.leaderboard_scores;
CREATE POLICY "Leaderboard viewable by all" ON public.leaderboard_scores FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Academy modules viewable by all" ON public.academy_modules;
CREATE POLICY "Academy modules viewable by all" ON public.academy_modules FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Academy videos viewable by all" ON public.academy_videos;
CREATE POLICY "Academy videos viewable by all" ON public.academy_videos FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Milestones viewable by all" ON public.milestones;
CREATE POLICY "Milestones viewable by all" ON public.milestones FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
ON CONFLICT DO NOTHING;

  INSERT INTO public.leaderboard_scores (user_id)
  VALUES (NEW.id)
ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_funnels_updated_at ON public.funnels;
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_sales_assets_updated_at ON public.sales_assets;
CREATE TRIGGER update_sales_assets_updated_at BEFORE UPDATE ON public.sales_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_ad_creatives_updated_at ON public.ad_creatives;
CREATE TRIGGER update_ad_creatives_updated_at BEFORE UPDATE ON public.ad_creatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_ad_campaigns_updated_at ON public.ad_campaigns;
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update streak on activity
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_active DATE;
BEGIN
  SELECT p.last_active_date INTO last_active FROM public.profiles p WHERE p.id = NEW.user_id;

  IF last_active = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles SET streak_days = streak_days + 1, last_active_date = CURRENT_DATE WHERE id = NEW.user_id;
  ELSIF last_active IS NULL OR last_active < CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles SET streak_days = 1, last_active_date = CURRENT_DATE WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_logged ON public.activity_log;
CREATE TRIGGER on_activity_logged
  AFTER INSERT ON public.activity_log
  FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();
