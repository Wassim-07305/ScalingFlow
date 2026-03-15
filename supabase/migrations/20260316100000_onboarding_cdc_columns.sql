-- ═══════════════════════════════════════════════════════════════
-- Migration: CDC Onboarding complet — nouvelles colonnes profil
-- Ajout des champs manquants du Cahier des Charges pour l'onboarding
-- ═══════════════════════════════════════════════════════════════

-- Compétences par catégories (CDC Étape 0.2b — 7 catégories avec niveaux)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vault_skills JSONB DEFAULT '[]'::jsonb;

-- Expertise profonde (CDC Étape 0.3 — 4 questions)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expertise_profonde JSONB DEFAULT '{}'::jsonb;

-- Réponses parcours-spécifiques (CDC Phase 1 — questions A1/A2/A3/B/C)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parcours_answers JSONB DEFAULT '{}'::jsonb;

-- Heures par semaine (CDC Q-0.5.3)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hours_per_week INTEGER DEFAULT 0;

-- Deadline premier client (CDC Q-0.5.4)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deadline TEXT;

-- Préférence équipe (CDC Q-0.5.5)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_preference TEXT;

-- Clients payants (CDC Q-0.3.6)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_paying_clients TEXT;
