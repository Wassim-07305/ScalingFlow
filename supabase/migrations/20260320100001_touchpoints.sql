-- Feature 2.1: Multi-Touch Attribution
-- Creates the touchpoints table for tracking the full visitor journey

create table if not exists touchpoints (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,        -- cookie/fingerprint anonyme avant auth
  user_id uuid references profiles(id) on delete set null,  -- lié après conversion/login
  lead_id uuid,  -- lié quand le visitor devient lead (FK ajoutée après si pipeline_leads existe)
  source text not null,             -- utm_source ou 'organic', 'direct', 'referral'
  medium text,                      -- utm_medium
  campaign text,                    -- utm_campaign
  content text,                     -- utm_content (= creative_id)
  term text,                        -- utm_term
  meta_ad_id text,                  -- ID pub Meta si disponible
  meta_adset_id text,
  meta_campaign_id text,
  referrer text,                    -- URL referrer complète
  landing_page text,                -- URL de la page d'atterrissage
  event_type text not null default 'pageview',  -- pageview, opt_in, call_booked, purchase
  channel text,                     -- computed: meta_ads, google_ads, organic_social, email, direct, referral
  created_at timestamptz default now()
);

create index if not exists idx_touchpoints_visitor on touchpoints(visitor_id);
create index if not exists idx_touchpoints_user on touchpoints(user_id);
create index if not exists idx_touchpoints_lead on touchpoints(lead_id);
create index if not exists idx_touchpoints_created on touchpoints(created_at desc);

-- RLS
alter table touchpoints enable row level security;

do $$ begin
  create policy "Users can view own touchpoints" on touchpoints for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert touchpoints" on touchpoints for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can update touchpoints" on touchpoints for update using (true);
exception when duplicate_object then null;
end $$;

-- FK optionnelle vers pipeline_leads (créée si la table existe)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'pipeline_leads' and table_schema = 'public') then
    alter table touchpoints
      add constraint fk_touchpoints_lead
      foreign key (lead_id) references pipeline_leads(id) on delete set null;
  end if;
end $$;

-- Note: purge touchpoints older than 12 months via Supabase scheduled function:
-- DELETE FROM touchpoints WHERE created_at < now() - interval '12 months';
-- Set up in Supabase Dashboard > Database > Scheduled Triggers (pg_cron)

-- ─── Extend payment_attributions with journey data ───────────────────────────

alter table payment_attributions
  add column if not exists first_touch_source text,
  add column if not exists first_touch_channel text,
  add column if not exists last_touch_source text,
  add column if not exists last_touch_channel text,
  add column if not exists journey_json jsonb;
