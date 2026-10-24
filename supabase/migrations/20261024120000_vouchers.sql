-- Building & Pest vouchers (owner decision 2026-10-24). The 137B website
-- (ownerbuilderinspection.melbourne, same company GXH Consultancy Pty Ltd)
-- issues a $30 (incl. GST) voucher to its customers 7 days after their 137B
-- report is delivered, for a Home Audit building and pest inspection when
-- they buy their next home. Codes are issued here, through
-- POST /api/vouchers/issue (shared secret), so this site is the only place
-- that knows whether a code is still valid.
--
-- One use per code: a code is claimed by the quote it was entered on and
-- redeemed when that order is paid. Safe to run more than once.

create table if not exists public.vouchers (
  code text primary key,
  amount_cents integer not null,
  expires_at timestamptz not null,
  source text not null,
  source_reference text not null,
  issued_to_email text,
  claimed_job_id uuid references public.jobs(id) on delete set null,
  claimed_at timestamptz,
  redeemed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint vouchers_code_check check (code ~ '^[A-Z0-9-]{6,32}$'),
  constraint vouchers_amount_check check (amount_cents between 100 and 50000),
  constraint vouchers_source_check check (source in ('137b'))
);

-- One voucher per 137B job, so a resend returns the same code.
create unique index if not exists vouchers_source_reference_key
  on public.vouchers (source, source_reference);
create unique index if not exists vouchers_claimed_job_key
  on public.vouchers (claimed_job_id) where claimed_job_id is not null;

alter table public.vouchers enable row level security;
revoke all on public.vouchers from anon, authenticated;

alter table public.jobs add column if not exists voucher_code text;
alter table public.jobs add column if not exists voucher_discount_cents integer;
