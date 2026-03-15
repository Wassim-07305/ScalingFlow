-- ================================================================
-- Migration 029: Whitelabel custom onboarding per organization
-- ================================================================

-- Add custom onboarding fields to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS custom_onboarding_steps JSONB,
  ADD COLUMN IF NOT EXISTS custom_welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS custom_prompts JSONB;

-- Comments for documentation
COMMENT ON COLUMN organizations.custom_onboarding_steps IS 'Array of custom onboarding step definitions (jsonb). Nullable — if null, uses default flow.';
COMMENT ON COLUMN organizations.custom_welcome_message IS 'Custom welcome message shown during onboarding step 1. Nullable — if null, uses default.';
COMMENT ON COLUMN organizations.custom_prompts IS 'Custom AI prompt overrides per generation type (jsonb). Nullable — if null, uses default prompts.';
