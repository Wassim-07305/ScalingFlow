-- Add publishing columns to funnels table
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published_slug text UNIQUE;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS custom_domain text;

-- Index for fast public funnel lookup
CREATE INDEX IF NOT EXISTS idx_funnels_published_slug ON funnels (published_slug) WHERE published = true;

-- Allow public read access to published funnels (for /f/[slug] page)
DROP POLICY IF EXISTS "Public can read published funnels" ON funnels;
CREATE POLICY "Public can read published funnels" ON funnels FOR SELECT
  USING (published = true);
