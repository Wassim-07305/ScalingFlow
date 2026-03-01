-- ============================================
-- MIGRATION 002 — VAULT & PARCOURS
-- Ajout des champs CDC complets pour l'onboarding
-- ============================================

-- Nouvelles colonnes profiles (Vault de competences)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS situation TEXT CHECK (situation IN ('zero', 'salarie', 'freelance', 'entrepreneur')),
  ADD COLUMN IF NOT EXISTS situation_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formations TEXT[],
  ADD COLUMN IF NOT EXISTS parcours TEXT CHECK (parcours IN ('A1', 'A2', 'A3', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS vault_skills JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expertise_answers JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hours_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS deadline TEXT,
  ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS vault_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vault_analysis JSONB;

-- Enrichir market_analyses
ALTER TABLE public.market_analyses
  ADD COLUMN IF NOT EXISTS persona JSONB,
  ADD COLUMN IF NOT EXISTS schwartz_level INTEGER CHECK (schwartz_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT;

-- ============================================
-- TABLE: vault_resources (upload de ressources)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vault_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  resource_type TEXT NOT NULL CHECK (resource_type IN ('doc', 'youtube', 'instagram', 'transcript', 'testimonial', 'other')),
  url TEXT,
  file_path TEXT,
  title TEXT NOT NULL,
  extracted_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vault resources" ON public.vault_resources FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: competitors
-- ============================================

CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  market_analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE CASCADE,

  competitor_name TEXT NOT NULL,
  positioning TEXT,
  pricing TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  gap_opportunity TEXT,
  source TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own competitors" ON public.competitors FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: brand_identities
-- ============================================

CREATE TABLE IF NOT EXISTS public.brand_identities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES public.offers(id),

  brand_names JSONB,
  selected_name TEXT,
  art_direction JSONB,
  logo_concept TEXT,
  brand_kit JSONB,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand identities" ON public.brand_identities FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_brand_identities_updated_at BEFORE UPDATE ON public.brand_identities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TABLE: agent_conversations
-- ============================================

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  agent_type TEXT NOT NULL CHECK (agent_type IN ('strategist', 'copywriter', 'ad_expert', 'sales_coach', 'content_creator', 'funnel_expert', 'analytics', 'growth_hacker', 'general')),
  title TEXT,
  messages JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own agent conversations" ON public.agent_conversations FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON public.agent_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_vault_resources_user ON public.vault_resources (user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_user ON public.competitors (user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_market ON public.competitors (market_analysis_id);
CREATE INDEX IF NOT EXISTS idx_brand_identities_user ON public.brand_identities (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON public.agent_conversations (user_id, agent_type);
