-- Add schwartz_analysis column to store the full Schwartz analysis JSON result
ALTER TABLE market_analyses
  ADD COLUMN IF NOT EXISTS schwartz_analysis JSONB;

-- Add comment for documentation
COMMENT ON COLUMN market_analyses.schwartz_analysis IS 'Full Schwartz market sophistication analysis result from AI';
