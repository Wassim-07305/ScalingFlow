-- ================================================================
-- Migration 033: Enforce ON DELETE CASCADE for client & pipeline tables
-- Fixes orphaned rows when a client or pipeline_lead is deleted.
-- The original CREATE TABLE IF NOT EXISTS may have been a no-op if
-- the tables already existed without CASCADE constraints.
-- ================================================================

-- ─── client_deals.client_id → clients(id) ──────────────────────
ALTER TABLE client_deals DROP CONSTRAINT IF EXISTS client_deals_client_id_fkey;
ALTER TABLE client_deals ADD CONSTRAINT client_deals_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ─── client_activities.client_id → clients(id) ─────────────────
ALTER TABLE client_activities DROP CONSTRAINT IF EXISTS client_activities_client_id_fkey;
ALTER TABLE client_activities ADD CONSTRAINT client_activities_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ─── pipeline_activities.lead_id → pipeline_leads(id) ──────────
ALTER TABLE pipeline_activities DROP CONSTRAINT IF EXISTS pipeline_activities_lead_id_fkey;
ALTER TABLE pipeline_activities ADD CONSTRAINT pipeline_activities_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES pipeline_leads(id) ON DELETE CASCADE;
