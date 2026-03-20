-- ================================================================
-- Migration 051: Monthly AI reports archive
-- Stores aggregated monthly AI cost reports for historical tracking
-- ================================================================

CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month TEXT NOT NULL,      -- format: '2026-03'
  report_data JSONB NOT NULL,      -- full aggregated report snapshot
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_month)
);

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert reports
DROP POLICY IF EXISTS "Admins can view reports" ON monthly_reports;
CREATE POLICY "Admins can view reports" ON monthly_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert reports" ON monthly_reports;
CREATE POLICY "Admins can insert reports" ON monthly_reports FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
