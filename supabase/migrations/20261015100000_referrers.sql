-- Referral partners (conveyancers, solicitors, buyer's agents, mortgage
-- brokers, selling agents, past customers and others), their referral links
-- (?ref=CODE), commission settings, and which referrer each job belongs to.
-- Additive and safe to run twice.

create table if not exists public.referrers (
  id uuid primary key default gen_random_uuid(),
  referrer_type text not null default 'other',
  name text not null,
  agency text,
  branch text,
  mobile text,
  email text,
  ref_code text not null unique,
  status text not null default 'pending',
  source text not null default 'admin',
  notes text,
  commission_type text,
  commission_cents integer,
  commission_percent numeric(5, 2),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrers_type_check check (referrer_type in (
    'conveyancer_solicitor', 'buyers_agent', 'mortgage_broker',
    'selling_agent', 'past_customer', 'other'
  )),
  constraint referrers_status_check check (status in ('pending', 'active', 'disabled')),
  constraint referrers_source_check check (source in ('admin', 'self')),
  constraint referrers_code_check check (ref_code ~ '^[a-z0-9]{3,12}$'),
  constraint referrers_name_length check (char_length(name) between 2 and 120),
  constraint referrers_commission_check check (
    (commission_type is null and commission_cents is null and commission_percent is null)
    or (commission_type = 'fixed' and commission_cents between 0 and 1000000 and commission_percent is null)
    or (commission_type = 'percent' and commission_percent between 0 and 100 and commission_cents is null)
  )
);

create index if not exists referrers_status_idx on public.referrers (status, created_at desc);

alter table public.referrers enable row level security;
revoke all on table public.referrers from anon, authenticated;

-- The referral code the customer arrived with (last link clicked within 90
-- days), and the owner's override for phoned-in referrals.
alter table public.jobs
  add column if not exists ref_code text,
  add column if not exists referrer_override_id uuid references public.referrers(id) on delete set null,
  add column if not exists referrer_override_none boolean not null default false;

create index if not exists jobs_ref_code_idx on public.jobs (ref_code) where ref_code is not null;

-- Visits that came through a referral link.
alter table public.analytics_events
  add column if not exists ref_code text not null default '';

create index if not exists analytics_events_ref_idx
  on public.analytics_events (ref_code, created_at)
  where ref_code <> '';
