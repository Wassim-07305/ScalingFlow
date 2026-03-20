-- ============================================
-- SYSTÈME D'AFFILIATION SCALINGFLOW
-- Sprint : Affiliation avec commissions, tracking, payouts
-- ============================================

-- ─── 1. Programme d'affiliation ──────────────────────────────────────────────

create table if not exists affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete set null,
  name text not null default 'Programme Partenaire',
  commission_type text not null default 'recurring' check (commission_type in ('one_time', 'recurring', 'tiered')),
  commission_rate numeric(5,2) not null default 20.00,
  recurring_months int default 12,
  cookie_duration_days int default 90,
  min_payout numeric(10,2) default 50.00,
  payout_frequency text default 'monthly' check (payout_frequency in ('monthly', 'biweekly')),
  terms_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── 2. Affiliés ─────────────────────────────────────────────────────────────

create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  program_id uuid references affiliate_programs(id) on delete cascade not null,
  affiliate_code text unique not null,
  referral_link text not null,
  stripe_account_id text,                               -- Stripe Connect Express account ID
  status text default 'active' check (status in ('pending', 'active', 'suspended', 'banned')),
  tier text default 'standard' check (tier in ('standard', 'silver', 'gold', 'platinum')),
  custom_commission_rate numeric(5,2),
  total_earned numeric(10,2) default 0,
  total_paid numeric(10,2) default 0,
  total_referrals int default 0,
  total_conversions int default 0,
  created_at timestamptz default now(),
  unique(user_id, program_id)
);

-- ─── 3. Payouts (avant commissions car commissions référence payouts) ─────────

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete cascade not null,
  amount numeric(10,2) not null,
  currency text default 'eur',
  method text default 'stripe' check (method in ('stripe', 'bank_transfer', 'paypal')),
  stripe_transfer_id text,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  commissions_included uuid[],
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- ─── 4. Referrals ─────────────────────────────────────────────────────────────

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete cascade not null,
  visitor_id text not null,
  referred_user_id uuid references profiles(id) on delete set null,
  landing_page text,
  ip_hash text,
  status text default 'clicked' check (status in ('clicked', 'signed_up', 'converted', 'churned')),
  signed_up_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz default now()
);

-- ─── 5. Commissions ───────────────────────────────────────────────────────────

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete cascade not null,
  referral_id uuid references referrals(id) on delete cascade not null,
  payment_id text,
  amount numeric(10,2) not null,
  commission_rate numeric(5,2) not null,
  source_amount numeric(10,2) not null,
  currency text default 'eur',
  status text default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  period_start date,
  period_end date,
  approved_at timestamptz,
  paid_at timestamptz,
  payout_id uuid references payouts(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── 6. Ajout referred_by dans profiles ───────────────────────────────────────

alter table profiles
  add column if not exists referred_by text;          -- stocke l'affiliate_code

-- ─── 7. Index ─────────────────────────────────────────────────────────────────

create index if not exists idx_affiliate_programs_owner on affiliate_programs(owner_id);
create index if not exists idx_affiliates_code on affiliates(affiliate_code);
create index if not exists idx_affiliates_user on affiliates(user_id);
create index if not exists idx_affiliates_program on affiliates(program_id);
create index if not exists idx_referrals_affiliate on referrals(affiliate_id);
create index if not exists idx_referrals_visitor on referrals(visitor_id);
create index if not exists idx_referrals_referred_user on referrals(referred_user_id);
create index if not exists idx_commissions_affiliate on commissions(affiliate_id);
create index if not exists idx_commissions_referral on commissions(referral_id);
create index if not exists idx_commissions_status on commissions(status);
create index if not exists idx_commissions_created on commissions(created_at desc);
create index if not exists idx_payouts_affiliate on payouts(affiliate_id);
create index if not exists idx_payouts_status on payouts(status);

-- ─── 8. RLS ───────────────────────────────────────────────────────────────────

alter table affiliate_programs enable row level security;
alter table affiliates enable row level security;
alter table referrals enable row level security;
alter table commissions enable row level security;
alter table payouts enable row level security;

-- affiliate_programs
DROP POLICY IF EXISTS "Owner can manage their affiliate program" ON affiliate_programs;
CREATE POLICY "Owner can manage their affiliate program" ON affiliate_programs for all
  using (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all affiliate programs" ON affiliate_programs;
CREATE POLICY "Admins can view all affiliate programs" ON affiliate_programs for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Active programs are publicly readable" ON affiliate_programs;
CREATE POLICY "Active programs are publicly readable" ON affiliate_programs for select
  using (is_active = true);

-- affiliates
DROP POLICY IF EXISTS "Affiliates can view their own record" ON affiliates;
CREATE POLICY "Affiliates can view their own record" ON affiliates for select
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Affiliates can update their own record (limited)" ON affiliates;
CREATE POLICY "Affiliates can update their own record (limited)" ON affiliates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "Program owners can view all affiliates of their program" ON affiliates;
CREATE POLICY "Program owners can view all affiliates of their program" ON affiliates for select
  using (
    exists (
      select 1 from affiliate_programs
      where id = affiliates.program_id
        and owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Program owners can manage affiliates of their program" ON affiliates;
CREATE POLICY "Program owners can manage affiliates of their program" ON affiliates for update
  using (
    exists (
      select 1 from affiliate_programs
      where id = affiliates.program_id
        and owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all affiliates" ON affiliates;
CREATE POLICY "Admins can manage all affiliates" ON affiliates for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert affiliates" ON affiliates;
CREATE POLICY "Service role can insert affiliates" ON affiliates for insert
  with check (true);

-- referrals
DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON referrals;
CREATE POLICY "Affiliates can view their own referrals" ON referrals for select
  using (
    exists (
      select 1 from affiliates
      where id = referrals.affiliate_id
        and user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Program owners can view referrals of their program" ON referrals;
CREATE POLICY "Program owners can view referrals of their program" ON referrals for select
  using (
    exists (
      select 1 from affiliates a
      join affiliate_programs p on p.id = a.program_id
      where a.id = referrals.affiliate_id
        and p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;
CREATE POLICY "Admins can view all referrals" ON referrals for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert and update referrals" ON referrals;
CREATE POLICY "Service role can insert and update referrals" ON referrals for insert
  with check (true);

DROP POLICY IF EXISTS "Service role can update referrals" ON referrals;
CREATE POLICY "Service role can update referrals" ON referrals for update
  using (true);

-- commissions
DROP POLICY IF EXISTS "Affiliates can view their own commissions" ON commissions;
CREATE POLICY "Affiliates can view their own commissions" ON commissions for select
  using (
    exists (
      select 1 from affiliates
      where id = commissions.affiliate_id
        and user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Program owners can view commissions of their program" ON commissions;
CREATE POLICY "Program owners can view commissions of their program" ON commissions for select
  using (
    exists (
      select 1 from affiliates a
      join affiliate_programs p on p.id = a.program_id
      where a.id = commissions.affiliate_id
        and p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all commissions" ON commissions;
CREATE POLICY "Admins can manage all commissions" ON commissions for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert commissions" ON commissions;
CREATE POLICY "Service role can insert commissions" ON commissions for insert
  with check (true);

DROP POLICY IF EXISTS "Service role can update commissions" ON commissions;
CREATE POLICY "Service role can update commissions" ON commissions for update
  using (true);

-- payouts
DROP POLICY IF EXISTS "Affiliates can view their own payouts" ON payouts;
CREATE POLICY "Affiliates can view their own payouts" ON payouts for select
  using (
    exists (
      select 1 from affiliates
      where id = payouts.affiliate_id
        and user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Program owners can view payouts of their program" ON payouts;
CREATE POLICY "Program owners can view payouts of their program" ON payouts for select
  using (
    exists (
      select 1 from affiliates a
      join affiliate_programs p on p.id = a.program_id
      where a.id = payouts.affiliate_id
        and p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;
CREATE POLICY "Admins can manage all payouts" ON payouts for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert and update payouts" ON payouts;
CREATE POLICY "Service role can insert and update payouts" ON payouts for insert
  with check (true);

DROP POLICY IF EXISTS "Service role can update payouts" ON payouts;
CREATE POLICY "Service role can update payouts" ON payouts for update
  using (true);

-- ─── 9. Trigger updated_at pour affiliate_programs ───────────────────────────

DROP TRIGGER IF EXISTS set_updated_at_affiliate_programs ON affiliate_programs;
create trigger set_updated_at_affiliate_programs
  before update on affiliate_programs
  for each row execute function update_updated_at();

-- ─── 10. Programme par défaut (sera créé via API au 1er usage) ───────────────
-- Note: Le programme est créé automatiquement via /api/affiliates/register
-- pour le premier owner (admin) ou via les settings owner.
