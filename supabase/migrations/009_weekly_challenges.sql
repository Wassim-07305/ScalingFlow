-- =====================================================
-- Migration: Weekly Challenges (Defis hebdomadaires)
-- Description: Table pour tracker les defis completes
-- =====================================================

-- Table pour les completions de defis
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_key TEXT NOT NULL,
  week_key TEXT NOT NULL, -- Format: "2026-W10" (annee-semaine)
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un utilisateur ne peut completer un defi qu'une fois par semaine
  UNIQUE(user_id, challenge_key, week_key)
);

-- Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_week
  ON challenge_completions(user_id, week_key);

-- RLS : chaque utilisateur ne voit que ses propres completions
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenge completions" ON challenge_completions;
CREATE POLICY "Users can view their own challenge completions" ON challenge_completions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenge completions" ON challenge_completions;
CREATE POLICY "Users can insert their own challenge completions" ON challenge_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE challenge_completions IS 'Historique des defis hebdomadaires completes par les utilisateurs';
COMMENT ON COLUMN challenge_completions.challenge_key IS 'Identifiant du defi (ex: offers_week, content_week)';
COMMENT ON COLUMN challenge_completions.week_key IS 'Cle de la semaine au format YYYY-WNN';
COMMENT ON COLUMN challenge_completions.xp_awarded IS 'Points XP attribues pour ce defi';
