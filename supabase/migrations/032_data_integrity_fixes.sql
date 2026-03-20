-- ================================================================
-- Migration 030: Data integrity & security fixes
-- Addresses: missing RLS, dangling FKs, missing indexes, sensitive data exposure
-- ================================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. ENABLE RLS ON TABLES THAT ARE MISSING IT
-- ═══════════════════════════════════════════════════════════════

-- academy_modules: RLS policies exist but RLS was never enabled
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;

-- academy_videos: same issue
ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;

-- milestones: same issue
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- rate_limits: no RLS at all — service-role only table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No user-facing policies: rate_limits should only be accessed via service_role key

-- ═══════════════════════════════════════════════════════════════
-- 1b. ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════

-- content_pieces: ai_raw_response column used in code but missing from schema
ALTER TABLE public.content_pieces ADD COLUMN IF NOT EXISTS ai_raw_response JSONB;

-- ═══════════════════════════════════════════════════════════════
-- 2. FIX DANGLING FOREIGN KEYS (add ON DELETE SET NULL)
-- ═══════════════════════════════════════════════════════════════

-- offers.market_analysis_id: if market_analysis is deleted, set to NULL (don't orphan the offer)
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_market_analysis_id_fkey;
ALTER TABLE public.offers ADD CONSTRAINT offers_market_analysis_id_fkey
  FOREIGN KEY (market_analysis_id) REFERENCES public.market_analyses(id) ON DELETE SET NULL;

-- funnels.offer_id: if offer is deleted, set to NULL
ALTER TABLE public.funnels DROP CONSTRAINT IF EXISTS funnels_offer_id_fkey;
ALTER TABLE public.funnels ADD CONSTRAINT funnels_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- sales_assets.offer_id: if offer is deleted, set to NULL
ALTER TABLE public.sales_assets DROP CONSTRAINT IF EXISTS sales_assets_offer_id_fkey;
ALTER TABLE public.sales_assets ADD CONSTRAINT sales_assets_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- brand_identities.offer_id: if offer is deleted, set to NULL
ALTER TABLE public.brand_identities DROP CONSTRAINT IF EXISTS brand_identities_offer_id_fkey;
ALTER TABLE public.brand_identities ADD CONSTRAINT brand_identities_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- tasks.related_video_id: if video deleted, set to NULL
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_related_video_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_related_video_id_fkey
  FOREIGN KEY (related_video_id) REFERENCES public.academy_videos(id) ON DELETE SET NULL;

-- tasks.related_milestone_id: if milestone deleted, set to NULL
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_related_milestone_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_related_milestone_id_fkey
  FOREIGN KEY (related_milestone_id) REFERENCES public.milestones(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. ADD MISSING INDEXES ON FREQUENTLY QUERIED COLUMNS
-- ═══════════════════════════════════════════════════════════════

-- market_analyses: queried by user_id + selected
CREATE INDEX IF NOT EXISTS idx_market_analyses_user ON public.market_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_market_analyses_selected ON public.market_analyses(user_id, selected);

-- offers: queried by user_id
CREATE INDEX IF NOT EXISTS idx_offers_user ON public.offers(user_id);

-- funnels: queried by user_id
CREATE INDEX IF NOT EXISTS idx_funnels_user ON public.funnels(user_id);

-- sales_assets: queried by user_id + asset_type
CREATE INDEX IF NOT EXISTS idx_sales_assets_user ON public.sales_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_assets_type ON public.sales_assets(user_id, asset_type);

-- ad_creatives: queried by user_id
CREATE INDEX IF NOT EXISTS idx_ad_creatives_user ON public.ad_creatives(user_id);

-- ad_campaigns: queried by user_id
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user ON public.ad_campaigns(user_id);

-- content_pieces: queried by user_id + content_type
CREATE INDEX IF NOT EXISTS idx_content_pieces_user ON public.content_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_type ON public.content_pieces(user_id, content_type);

-- tasks: queried by user_id + completed
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(user_id, completed);

-- notifications: queried by user_id + read
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- video_progress: queried by user_id
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON public.video_progress(user_id);

-- leaderboard_scores: queried for ranking
CREATE INDEX IF NOT EXISTS idx_leaderboard_composite ON public.leaderboard_scores(composite_score DESC);

-- community_posts: queried for feed ordering
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);

-- community_comments: queried by post_id
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id);

-- push_subscriptions: queried by user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- connected_accounts: queried by user_id + provider
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_provider ON public.connected_accounts(user_id, provider);

-- ═══════════════════════════════════════════════════════════════
-- 4. FIX LEADERBOARD RLS — users should only UPDATE own scores
-- ═══════════════════════════════════════════════════════════════

-- Currently leaderboard_scores only has SELECT for all + no INSERT/UPDATE policies.
-- The handle_new_user() trigger uses SECURITY DEFINER so it bypasses RLS for INSERT.
-- Add UPDATE policy so users can update their own scores (from xp-engine).
DROP POLICY IF EXISTS "Users can update own leaderboard" ON public.leaderboard_scores;
CREATE POLICY "Users can update own leaderboard" ON public.leaderboard_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. RATE LIMITS CLEANUP FUNCTION
-- ═══════════════════════════════════════════════════════════════

-- Automatic cleanup of expired rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE reset_at < NOW();
END;
$$;
