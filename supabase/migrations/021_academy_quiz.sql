CREATE TABLE IF NOT EXISTS academy_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  module_id text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON academy_quiz_results(user_id);
ALTER TABLE academy_quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quiz results" ON academy_quiz_results FOR ALL USING (auth.uid() = user_id);
