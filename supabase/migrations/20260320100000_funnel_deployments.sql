-- Migration: funnel_deployments table (Feature #57 — Custom Domain Deploy)
-- Tracks each funnel deployment: subdomain or custom domain, Vercel API state, DNS/SSL status

create table if not exists funnel_deployments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  funnel_id uuid references funnels(id) on delete cascade not null,
  domain text,                      -- subdomain URL, e.g. mon-offre.scalingflow.io
  custom_domain text,               -- user-provided domain, e.g. offre.tonsite.com
  vercel_deployment_id text,
  deploy_status text default 'pending',   -- pending | active | error
  ssl_status text default 'pending',      -- pending | active
  dns_verified boolean default false,
  html_pages jsonb,
  meta_pixel_id text,
  seo_config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One active deployment per funnel at a time (upsert on conflict)
create unique index if not exists idx_funnel_deployments_funnel_id
  on funnel_deployments (funnel_id);

-- Fast lookup by custom domain (for middleware resolution)
create index if not exists idx_funnel_deployments_custom_domain
  on funnel_deployments (custom_domain) where custom_domain is not null;

alter table funnel_deployments enable row level security;

do $$ begin
  create policy "Users manage own deployments"
    on funnel_deployments for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- updated_at auto-update trigger
create or replace function update_funnel_deployment_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_funnel_deployments_updated on funnel_deployments;
create trigger trg_funnel_deployments_updated
  before update on funnel_deployments
  for each row execute function update_funnel_deployment_updated_at();
