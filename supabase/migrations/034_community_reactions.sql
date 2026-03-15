-- Add reactions JSONB column to community_posts
-- Format: { "emoji": ["user_id_1", "user_id_2"], ... }
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;
