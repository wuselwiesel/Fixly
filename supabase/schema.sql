-- Fixly: household sharing schema
-- Run once in the Supabase SQL editor of the "fixly" project.
-- Order: extensions -> tables -> RLS policies -> functions/triggers -> RPCs
-- (tables first, in FK dependency order, so later policies can reference any table)

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. TABLES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  personal_sharing_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  scope text not null default 'personal' check (scope in ('personal', 'household')),
  name text not null,
  description text,
  category_id uuid not null references public.categories(id),
  type text not null check (type in ('subscription', 'contract', 'fixed', 'other')),
  amount numeric not null check (amount >= 0),
  interval text not null check (interval in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly', 'custom')),
  custom_interval_days integer,
  next_payment date not null,
  payment_method text,
  provider text,
  website text,
  contract_start date,
  contract_end date,
  cancellation_period_days integer,
  auto_renew boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  notes text,
  is_favorite boolean not null default false,
  split jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_scope_needs_household check (
    (scope = 'household' and household_id is not null) or (scope = 'personal')
  )
);

create table public.price_changes (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.costs(id) on delete cascade,
  old_amount numeric not null,
  new_amount numeric not null,
  changed_at timestamptz not null default now()
);

create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  interval text not null check (interval in ('monthly', 'yearly', 'once')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.costs enable row level security;
alter table public.price_changes enable row level security;
alter table public.income enable row level security;

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

-- profiles
create policy "profiles: read own row"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: read household co-members (limited)"
  on public.profiles for select
  using (
    exists (
      select 1 from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid() and hm2.user_id = profiles.id
    )
  );

create policy "profiles: update own row"
  on public.profiles for update
  using (id = auth.uid());

-- categories
create policy "categories: owner crud"
  on public.categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- households
create policy "households: members can select"
  on public.households for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id and hm.user_id = auth.uid()
    )
  );

create policy "households: owner can update"
  on public.households for update
  using (owner_id = auth.uid());

create policy "households: owner can delete"
  on public.households for delete
  using (owner_id = auth.uid());

-- household_members
create policy "household_members: members can select"
  on public.household_members for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_members.household_id and hm.user_id = auth.uid()
    )
  );

create policy "household_members: owner or self can remove"
  on public.household_members for delete
  using (
    exists (
      select 1 from public.households h
      where h.id = household_members.household_id and h.owner_id = auth.uid()
    )
    or user_id = auth.uid() -- a member can remove themselves (leave)
  );

-- household_invites
create policy "household_invites: owner can select"
  on public.household_invites for select
  using (
    exists (
      select 1 from public.households h
      where h.id = household_invites.household_id and h.owner_id = auth.uid()
    )
  );

create policy "household_invites: owner can delete"
  on public.household_invites for delete
  using (
    exists (
      select 1 from public.households h
      where h.id = household_invites.household_id and h.owner_id = auth.uid()
    )
  );

-- costs
create policy "costs: select own or shared"
  on public.costs for select
  using (
    user_id = auth.uid()
    or (
      scope = 'household'
      and household_id in (select household_id from public.household_members where user_id = auth.uid())
    )
    or (
      scope = 'personal'
      and exists (
        select 1
        from public.household_members mine
        join public.household_members theirs
          on mine.household_id = theirs.household_id
        join public.profiles owner on owner.id = costs.user_id
        where mine.user_id = auth.uid()
          and theirs.user_id = costs.user_id
          and owner.personal_sharing_enabled = true
      )
    )
  );

create policy "costs: insert own"
  on public.costs for insert
  with check (
    user_id = auth.uid()
    and (
      scope = 'personal'
      or (scope = 'household' and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    )
  );

create policy "costs: update own or household"
  on public.costs for update
  using (
    user_id = auth.uid()
    or (
      scope = 'household'
      and household_id in (select household_id from public.household_members where user_id = auth.uid())
    )
  );

create policy "costs: delete own or household"
  on public.costs for delete
  using (
    user_id = auth.uid()
    or (
      scope = 'household'
      and household_id in (select household_id from public.household_members where user_id = auth.uid())
    )
  );

-- price_changes (visibility mirrors the parent cost)
create policy "price_changes: visible via parent cost"
  on public.price_changes for select
  using (
    exists (select 1 from public.costs c where c.id = price_changes.cost_id)
  );

create policy "price_changes: insert via parent cost ownership"
  on public.price_changes for insert
  with check (
    exists (
      select 1 from public.costs c
      where c.id = price_changes.cost_id
        and (
          c.user_id = auth.uid()
          or (c.scope = 'household' and c.household_id in (
            select household_id from public.household_members where user_id = auth.uid()
          ))
        )
    )
  );

-- income
create policy "income: owner crud"
  on public.income for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================================

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, icon, is_custom) values
    (p_user_id, 'Wohnen', 'var(--color-chart-1)', 'Home', false),
    (p_user_id, 'Energie', 'var(--color-chart-4)', 'Zap', false),
    (p_user_id, 'Versicherungen', 'var(--color-chart-2)', 'ShieldCheck', false),
    (p_user_id, 'Mobilität', 'var(--color-chart-5)', 'Car', false),
    (p_user_id, 'Kommunikation', 'var(--color-chart-3)', 'Smartphone', false),
    (p_user_id, 'Streaming & Unterhaltung', 'var(--color-chart-6)', 'Clapperboard', false),
    (p_user_id, 'Software & Apps', 'var(--color-chart-1)', 'AppWindow', false),
    (p_user_id, 'Mitgliedschaften', 'var(--color-chart-2)', 'Users', false),
    (p_user_id, 'Finanzen', 'var(--color-chart-4)', 'Landmark', false),
    (p_user_id, 'Familie', 'var(--color-chart-3)', 'Heart', false),
    (p_user_id, 'Haustiere', 'var(--color-chart-5)', 'PawPrint', false),
    (p_user_id, 'Gesundheit', 'var(--color-chart-6)', 'Stethoscope', false),
    (p_user_id, 'Sonstiges', 'var(--color-chart-2)', 'MoreHorizontal', false);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger costs_set_updated_at
  before update on public.costs
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. HOUSEHOLD RPCs (security definer, avoid broad direct-table access)
-- ============================================================

create or replace function public.create_household(p_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  insert into public.households (name, owner_id) values (p_name, auth.uid())
  returning * into h;

  insert into public.household_members (household_id, user_id, role)
  values (h.id, auth.uid(), 'owner');

  return h;
end;
$$;

create or replace function public.create_invite(p_household_id uuid, p_ttl_hours int default 168)
returns public.household_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.household_invites;
begin
  if not exists (
    select 1 from public.households where id = p_household_id and owner_id = auth.uid()
  ) then
    raise exception 'Only the household owner can create invites';
  end if;

  insert into public.household_invites (household_id, code, created_by, expires_at)
  values (
    p_household_id,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    auth.uid(),
    now() + (p_ttl_hours || ' hours')::interval
  )
  returning * into inv;

  return inv;
end;
$$;

create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.household_invites;
begin
  select * into inv from public.household_invites
    where code = upper(p_code) and used_at is null and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  if exists (
    select 1 from public.household_members
    where household_id = inv.household_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this household';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, auth.uid(), 'member');

  update public.household_invites set used_by = auth.uid(), used_at = now() where id = inv.id;

  return inv.household_id;
end;
$$;
