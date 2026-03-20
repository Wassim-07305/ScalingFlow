-- ================================================================
-- Migration 030: Fix integration constraints
-- 1. Add 'google_calendar' to connected_accounts provider CHECK
-- 2. Add 'cold', 'warm', 'hot', 'exclusion', 'targeting' to
--    meta_audiences audience_type CHECK
-- ================================================================

-- 1. Extend provider constraint to include google_calendar
ALTER TABLE connected_accounts
  DROP CONSTRAINT IF EXISTS connected_accounts_provider_check;

ALTER TABLE connected_accounts
  ADD CONSTRAINT connected_accounts_provider_check
  CHECK (provider IN (
    -- Direct OAuth providers
    'meta', 'google', 'google_calendar', 'linkedin', 'tiktok',
    'instagram', 'stripe_connect', 'ghl',
    -- Unipile-managed providers
    'unipile_linkedin', 'unipile_whatsapp', 'unipile_instagram',
    'unipile_messenger', 'unipile_telegram', 'unipile_twitter',
    'unipile_mail', 'unipile_google', 'unipile_outlook', 'unipile_imap'
  )) NOT VALID;

-- 2. Extend audience_type constraint to include audience builder types
ALTER TABLE meta_audiences
  DROP CONSTRAINT IF EXISTS meta_audiences_audience_type_check;

ALTER TABLE meta_audiences
  ADD CONSTRAINT meta_audiences_audience_type_check
  CHECK (audience_type IN (
    'custom', 'lookalike', 'saved',
    'cold', 'warm', 'hot', 'exclusion'
  )) NOT VALID;

-- 3. Extend audience status constraint to include 'targeting' (interest-based)
ALTER TABLE meta_audiences
  DROP CONSTRAINT IF EXISTS meta_audiences_status_check;

ALTER TABLE meta_audiences
  ADD CONSTRAINT meta_audiences_status_check
  CHECK (status IN ('draft', 'ready', 'active', 'error', 'targeting')) NOT VALID;
