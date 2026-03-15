-- ============================================================
-- 023 — Gestion des clients (CRM léger)
-- ============================================================

-- ─── Enum : statut client ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('prospect', 'actif', 'inactif', 'churne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Enum : statut deal ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM (
    'nouveau',
    'engage',
    'call_booke',
    'no_show',
    'follow_up',
    'depot_pose',
    'close',
    'perdu'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table : clients ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text,
  phone       text,
  company     text,
  status      client_status NOT NULL DEFAULT 'prospect',
  notes       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status  ON clients(user_id, status);

-- ─── Table : client_deals ────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_deals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  status      deal_status NOT NULL DEFAULT 'nouveau',
  closed_at   timestamptz,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_deals_client_id ON client_deals(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deals_user_id   ON client_deals(user_id);

-- ─── Table : client_activities ───────────────────────────────
CREATE TABLE IF NOT EXISTS client_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  description text NOT NULL,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_user_id   ON client_activities(user_id);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_deals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activities  ENABLE ROW LEVEL SECURITY;

-- clients
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE USING (auth.uid() = user_id);

-- client_deals
CREATE POLICY "Users can view own deals"
  ON client_deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals"
  ON client_deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals"
  ON client_deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals"
  ON client_deals FOR DELETE USING (auth.uid() = user_id);

-- client_activities
CREATE POLICY "Users can view own activities"
  ON client_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities"
  ON client_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities"
  ON client_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities"
  ON client_activities FOR DELETE USING (auth.uid() = user_id);

-- ─── Trigger : updated_at auto ───────────────────────────────
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
