-- ─── Memory / Vault features ─────────────────────────────────
-- Ajouter la clé API Claude personnelle et le timestamp de mise à jour du vault

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vault_extraction JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS claude_api_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vault_updated_at TIMESTAMPTZ DEFAULT NULL;

-- La clé API ne doit être visible que par l'utilisateur lui-même
-- (les policies RLS existantes sur profiles s'en chargent déjà)
