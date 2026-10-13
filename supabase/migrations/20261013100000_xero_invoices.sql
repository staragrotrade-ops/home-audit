-- Xero: paid invoices for jobs paid online (release 0.9.0).
-- Apply after 20261012100000_instant_quotes_and_booking.sql.

-- Encrypted OAuth tokens for connected services (Xero). Server only.
create table public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account_key text not null,
  account_name text,
  credentials jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (provider, account_key)
);

-- One Xero invoice (and its payment) per job.
create table public.xero_records (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  contact_id text,
  invoice_id text,
  invoice_number text,
  payment_id text,
  emailed_at timestamptz,
  synced_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.integration_accounts enable row level security;
alter table public.xero_records enable row level security;
revoke all on table public.integration_accounts from anon, authenticated;
revoke all on table public.xero_records from anon, authenticated;
