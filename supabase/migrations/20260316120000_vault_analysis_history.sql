-- Ajouter la colonne vault_analysis_history pour le versioning des analyses vault
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS vault_analysis_history jsonb DEFAULT '[]'::jsonb;

-- Commentaire pour documentation
COMMENT ON COLUMN profiles.vault_analysis_history IS 'Historique des analyses vault avec timestamps et deltas entre versions';
