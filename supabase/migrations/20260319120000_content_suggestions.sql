-- Migration: Feature 1.4 + 1.5 — Table content_suggestions
-- Suggestions IA hebdomadaires avec statuts et boucle de feedback

CREATE TABLE IF NOT EXISTS content_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,         -- reel | carousel | story | post | youtube
  script jsonb NOT NULL DEFAULT '{}', -- { hook, script, hashtags, best_posting_time, title, duration, chapters? }
  source_insight text,                -- "Basé sur hook ads #3 (CTR 2.1%)" / "Objection fréquente : prix"
  angle text,                         -- educatif | objection | backstage | cas_client | hook_viral
  pillar text,                        -- know | like | trust | conversion
  reasoning text,                     -- justification IA
  week_of date NOT NULL,              -- lundi de la semaine concernée
  status text NOT NULL DEFAULT 'suggested', -- suggested | accepted | rejected | published
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_user_week
  ON content_suggestions(user_id, week_of DESC);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_status
  ON content_suggestions(user_id, status);

-- RLS
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own suggestions" ON content_suggestions
  FOR ALL USING (auth.uid() = user_id);
