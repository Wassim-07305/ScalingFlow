-- Ajouter la colonne bleeding_neck_pains a market_analyses
ALTER TABLE market_analyses
  ADD COLUMN IF NOT EXISTS bleeding_neck_pains jsonb DEFAULT NULL;

COMMENT ON COLUMN market_analyses.bleeding_neck_pains IS 'Resultat de l''analyse IA des bleeding-neck pains (4 couches)';
