-- ================================================================
-- Migration 016: Full OAuth integrations + Whitelabel multi-tenant
-- ================================================================

-- 1. Connected accounts table for all OAuth providers
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  provider TEXT NOT NULL CHECK (provider IN (
    'meta', 'google', 'linkedin', 'tiktok', 'instagram', 'stripe_connect', 'ghl'
  )),

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Provider-specific data
  provider_account_id TEXT,    -- e.g. Meta ad account ID, Stripe account ID
  provider_user_id TEXT,       -- e.g. Facebook user ID
  provider_username TEXT,      -- e.g. Instagram handle
  scopes TEXT[],               -- granted scopes
  metadata JSONB DEFAULT '{}', -- extra provider data

  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own connected accounts" ON connected_accounts;
CREATE POLICY "Users can view own connected accounts" ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own connected accounts" ON connected_accounts;
CREATE POLICY "Users can insert own connected accounts" ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connected accounts" ON connected_accounts;
CREATE POLICY "Users can update own connected accounts" ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own connected accounts" ON connected_accounts;
CREATE POLICY "Users can delete own connected accounts" ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Add webhook_api_key to profiles (referenced but missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_api_key TEXT UNIQUE;

-- 3. Whitelabel / Multi-tenant tables
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT UNIQUE,

  -- Branding
  primary_color TEXT DEFAULT '#34D399',
  accent_color TEXT DEFAULT '#10B981',
  brand_name TEXT,

  -- Settings
  features JSONB DEFAULT '{}',         -- feature flags
  limits JSONB DEFAULT '{}',           -- plan limits (users, generations, etc.)

  owner_id UUID NOT NULL REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view their org" ON organizations;
CREATE POLICY "Org members can view their org" ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Org owners can update their org" ON organizations;
CREATE POLICY "Org owners can update their org" ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON organizations;
CREATE POLICY "Authenticated users can create orgs" ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view members" ON organization_members;
CREATE POLICY "Org members can view members" ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Org admins can manage members" ON organization_members;
CREATE POLICY "Org admins can manage members" ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Link profiles to organizations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 4. Meta custom audiences table
CREATE TABLE IF NOT EXISTS meta_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  meta_audience_id TEXT,        -- ID returned by Meta API
  name TEXT NOT NULL,
  description TEXT,
  audience_type TEXT NOT NULL CHECK (audience_type IN (
    'custom', 'lookalike', 'saved'
  )),
  subtype TEXT,                 -- WEBSITE, ENGAGEMENT, CUSTOMER_FILE, etc.
  source_data JSONB,           -- audience rules / source config
  approximate_count INTEGER,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'active', 'error')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_audiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own audiences" ON meta_audiences;
CREATE POLICY "Users can manage own audiences" ON meta_audiences FOR ALL
  USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_audiences_user ON meta_audiences(user_id);
