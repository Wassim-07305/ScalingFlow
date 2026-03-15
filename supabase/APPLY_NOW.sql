-- ================================================================
-- MIGRATIONS À APPLIQUER DANS LE SQL EDITOR SUPABASE
-- Projet: mgagpfexswovfzydlqgm (ScalingFlow)
-- Date: 2026-03-15
-- ================================================================

-- ========== MIGRATION 016: connected_accounts + organizations ==========

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  provider TEXT NOT NULL,

  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Provider-specific data
  provider_account_id TEXT,
  provider_user_id TEXT,
  provider_username TEXT,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',

  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Provider CHECK constraint (includes Unipile providers from migration 022)
ALTER TABLE connected_accounts
  ADD CONSTRAINT connected_accounts_provider_check
  CHECK (provider IN (
    'meta', 'google', 'linkedin', 'tiktok', 'instagram', 'stripe_connect', 'ghl',
    'unipile_linkedin', 'unipile_whatsapp', 'unipile_instagram',
    'unipile_messenger', 'unipile_telegram', 'unipile_twitter',
    'unipile_mail', 'unipile_google', 'unipile_outlook', 'unipile_imap'
  ));

-- RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for webhooks (Unipile webhook uses service_role_key)
CREATE POLICY "Service role full access"
  ON connected_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider);

-- Add webhook_api_key to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_api_key TEXT UNIQUE;

-- Organizations (whitelabel) — tables d'abord, policies ensuite
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT UNIQUE,
  primary_color TEXT DEFAULT '#34D399',
  accent_color TEXT DEFAULT '#10B981',
  brand_name TEXT,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- RLS + Policies (organization_members existe maintenant)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Org owners can update their org"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Org admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- Meta audiences
CREATE TABLE IF NOT EXISTS meta_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meta_audience_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('custom', 'lookalike', 'saved')),
  subtype TEXT,
  source_data JSONB,
  approximate_count INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'active', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own audiences"
  ON meta_audiences FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meta_audiences_user ON meta_audiences(user_id);
