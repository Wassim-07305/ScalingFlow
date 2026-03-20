-- Feature 2.2: Tracking Calls → Lead d'Origine
-- Links call analyses (stored in sales_assets) to pipeline leads

alter table sales_assets
  add column if not exists lead_id uuid;

create index if not exists idx_sales_assets_lead on sales_assets(lead_id);

-- FK optionnelle vers pipeline_leads (créée si la table existe)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'pipeline_leads' and table_schema = 'public') then
    if not exists (
      select 1 from information_schema.table_constraints
      where constraint_name = 'fk_sales_assets_lead' and table_name = 'sales_assets'
    ) then
      alter table sales_assets
        add constraint fk_sales_assets_lead
        foreign key (lead_id) references pipeline_leads(id) on delete set null;
    end if;
  end if;
end $$;
