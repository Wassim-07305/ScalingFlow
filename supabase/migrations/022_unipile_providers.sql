-- ================================================================
-- Migration 022: Add Unipile provider types to connected_accounts
-- ================================================================

-- Drop the existing provider CHECK constraint and replace with an
-- extended one that includes Unipile-managed provider keys.

ALTER TABLE connected_accounts
  DROP CONSTRAINT IF EXISTS connected_accounts_provider_check;

ALTER TABLE connected_accounts
  ADD CONSTRAINT connected_accounts_provider_check
  CHECK (provider IN (
    -- Direct OAuth providers
    'meta', 'google', 'linkedin', 'tiktok', 'instagram', 'stripe_connect', 'ghl',
    -- Unipile-managed providers
    'unipile_linkedin', 'unipile_whatsapp', 'unipile_instagram',
    'unipile_messenger', 'unipile_telegram', 'unipile_twitter',
    'unipile_mail', 'unipile_google', 'unipile_outlook', 'unipile_imap'
  ));

-- Make access_token nullable for Unipile accounts (tokens managed by Unipile)
ALTER TABLE connected_accounts
  ALTER COLUMN access_token DROP NOT NULL;
