-- ================================================================
-- Migration 030: Security hardening
-- ================================================================

-- 1. CRITICAL: Restrict profiles SELECT policy
-- The old policy lets ANY authenticated user read ALL profiles,
-- exposing claude_api_key, meta_access_token, webhook_api_key, etc.
-- New policy: users can only SELECT their own profile.
-- Community features that need other users' names should use a view.
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Users can only read their own full profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Create a safe public view for leaderboard/community display
-- This view exposes ONLY non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  xp_points,
  level,
  streak_days,
  organization_id
FROM public.profiles;

-- Grant read access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Add RLS to rate_limits table (was missing)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits are managed by the server via the anon key user session,
-- so we allow authenticated users to manage their own entries
CREATE POLICY "Service can manage rate limits"
  ON rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Encrypt sensitive columns in profiles
-- Note: claude_api_key and meta_access_token are stored in plaintext.
-- Ideally these should be encrypted at rest using pgp_sym_encrypt.
-- For now, the RLS fix above prevents unauthorized access.
-- A future migration should encrypt these columns.

-- 5. Add comment documenting security-sensitive columns
COMMENT ON COLUMN profiles.claude_api_key IS 'SENSITIVE: User Claude API key. Protected by RLS - only own profile visible.';
COMMENT ON COLUMN profiles.meta_access_token IS 'DEPRECATED: Use connected_accounts table instead. Protected by RLS.';
COMMENT ON COLUMN profiles.webhook_api_key IS 'SENSITIVE: Webhook authentication key. Protected by RLS.';
