-- Feature 2.4 — Paliers de Croissance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS growth_recommendations JSONB;
COMMENT ON COLUMN profiles.growth_recommendations IS 'Cached AI growth tier recommendations (GrowthRecommendationsResult)';

-- Feature 2.5 — Extraction Mémoire Claude
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interview_state JSONB;
COMMENT ON COLUMN profiles.interview_state IS 'Knowledge interview progress (resumable) — { status, current_question, answers, started_at, updated_at }';
