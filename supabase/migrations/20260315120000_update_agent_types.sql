-- Migration: update agent_type CHECK constraint to match CDC #86-92 specialized agents
-- Old types: strategist, copywriter, ad_expert, sales_coach, content_creator, funnel_expert, analytics, growth_hacker, general
-- New types: general, offre, funnel, ads, vente, contenu, strategie, recherche

-- 1. Drop old constraint first so UPDATEs are not blocked
ALTER TABLE public.agent_conversations DROP CONSTRAINT IF EXISTS agent_conversations_agent_type_check;

-- 2. Map old agent types to new ones
UPDATE public.agent_conversations SET agent_type = 'strategie' WHERE agent_type IN ('strategist', 'growth_hacker');
UPDATE public.agent_conversations SET agent_type = 'funnel' WHERE agent_type IN ('copywriter', 'funnel_expert');
UPDATE public.agent_conversations SET agent_type = 'ads' WHERE agent_type IN ('ad_expert', 'analytics');
UPDATE public.agent_conversations SET agent_type = 'vente' WHERE agent_type = 'sales_coach';
UPDATE public.agent_conversations SET agent_type = 'contenu' WHERE agent_type = 'content_creator';

-- 3. Add new constraint
ALTER TABLE public.agent_conversations ADD CONSTRAINT agent_conversations_agent_type_check
  CHECK (agent_type IN ('general', 'offre', 'funnel', 'ads', 'vente', 'contenu', 'strategie', 'recherche')) NOT VALID;
