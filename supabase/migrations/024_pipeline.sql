-- ================================================================
-- Migration 024: CRM Pipeline tables
-- ================================================================

-- ─── pipeline_leads ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_leads (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text,
  phone       text,
  source      text,
  status      text NOT NULL DEFAULT 'nouveau'
    CHECK (status IN (
      'nouveau', 'engage', 'call_booke', 'no_show',
      'follow_up', 'depot_pose', 'close', 'perdu'
    )),
  notes       text,
  amount      numeric DEFAULT 0,
  assigned_to text,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_user     ON pipeline_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_status   ON pipeline_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_created  ON pipeline_leads(created_at DESC);

-- RLS
ALTER TABLE pipeline_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads"
  ON pipeline_leads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leads"
  ON pipeline_leads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
  ON pipeline_leads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own leads"
  ON pipeline_leads FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_pipeline_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_leads_updated_at
  BEFORE UPDATE ON pipeline_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_leads_updated_at();

-- ─── pipeline_activities ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_activities (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     uuid NOT NULL REFERENCES pipeline_leads(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  old_status  text,
  new_status  text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_lead    ON pipeline_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_user    ON pipeline_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_created ON pipeline_activities(created_at DESC);

-- RLS
ALTER TABLE pipeline_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipeline activities"
  ON pipeline_activities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pipeline activities"
  ON pipeline_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());
