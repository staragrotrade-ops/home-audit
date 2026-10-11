-- Instant quotes, Stripe payment and booking workflow (release 0.8.0).
-- Apply after 20261011120000_admin_analytics_and_app.sql.

-- 1. Job fields -------------------------------------------------------------

alter table public.jobs
  add column if not exists price_guide_band text not null default '',
  add column if not exists listing_url text,
  add column if not exists travel_minutes integer,
  add column if not exists travel_distance_m integer,
  add column if not exists pricing_decision text,
  add column if not exists pricing_reasons text[] not null default '{}',
  add column if not exists paid_at timestamptz,
  add column if not exists paid_notified_at timestamptz,
  add column if not exists buyer_situation text,
  add column if not exists access_choice text,
  add column if not exists access_other_name text,
  add column if not exists access_other_phone text,
  add column if not exists details_submitted_at timestamptz,
  add column if not exists agent_name text,
  add column if not exists agent_agency text,
  add column if not exists agent_phone text,
  add column if not exists agent_email extensions.citext,
  add column if not exists listing_price_guide text,
  add column if not exists listing_checked_at timestamptz,
  add column if not exists agent_texted_at timestamptz,
  add column if not exists booking_notified_at timestamptz,
  add column if not exists review_requested_at timestamptz;

alter table public.jobs
  add constraint jobs_price_guide_band_check check (
    price_guide_band in ('', 'up_to_1_5m', 'over_1_5m', 'unknown')
  ),
  add constraint jobs_listing_url_check check (
    listing_url is null or listing_url ~ '^https?://'
  ),
  add constraint jobs_pricing_decision_check check (
    pricing_decision is null or pricing_decision in ('instant', 'manual')
  ),
  add constraint jobs_buyer_situation_check check (
    buyer_situation is null or buyer_situation in (
      'buying_signed', 'buying_not_signed', 'auction', 'bought_settled', 'bought_not_settled'
    )
  ),
  add constraint jobs_access_choice_check check (
    access_choice is null or access_choice in ('agent', 'customer', 'other')
  );

-- 2. Customer links ---------------------------------------------------------
-- The customer's order page is reached by a random link. Only a SHA-256 of
-- each link token is stored; several can be valid for one job (the first
-- quote, later emails).

create table public.job_access_tokens (
  token_hash text primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  purpose text not null default 'order',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days',
  constraint job_access_tokens_hash_check check (token_hash ~ '^[a-f0-9]{64}$')
);

create index job_access_tokens_job_idx on public.job_access_tokens (job_id);

alter table public.job_access_tokens enable row level security;
revoke all on table public.job_access_tokens from anon, authenticated;

-- 3. Payments ---------------------------------------------------------------

alter table public.payments
  add column if not exists checkout_session_id text unique,
  add column if not exists amount_cents integer;

-- At most one payment page in progress per job: the row is created before
-- the Stripe session, so two quick clicks cannot open two pages.
create unique index payments_one_pending_per_job
  on public.payments (job_id)
  where status = 'pending';

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
revoke all on table public.stripe_events from anon, authenticated;

-- Records a verified, paid Stripe Checkout session. Returns:
--   'paid'      the job is now paid (first payment)
--   'already'   this session was recorded before (Stripe retry)
--   'duplicate' the job was already paid by another session: refund it
--   'mismatch'  the amount differs from the job's current price: check it
-- Only 'paid' changes the job. Money received in the other cases is kept on
-- the payment row and in the audit log (Payment amount mismatch / duplicate)
-- for the owner to resolve.
create or replace function public.mark_job_paid(
  p_job_id uuid,
  p_session_id text,
  p_amount_cents integer,
  p_payment_intent_id text default null,
  p_payment_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_job public.jobs%rowtype;
  v_outcome text;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then raise exception 'Job not found.'; end if;

  select * into v_payment
  from public.payments
  where checkout_session_id = p_session_id
  for update;

  -- The session id is saved just after Stripe creates the session. If that
  -- save failed, find the row from the payment id carried in the metadata.
  if not found and p_payment_id is not null then
    select * into v_payment
    from public.payments
    where id = p_payment_id and job_id = p_job_id and checkout_session_id is null
    for update;
    if found then
      update public.payments set checkout_session_id = p_session_id where id = v_payment.id;
    end if;
  end if;

  if not found then raise exception 'Payment record not found.'; end if;
  if v_payment.job_id <> p_job_id then raise exception 'Payment job mismatch.'; end if;
  if v_payment.status in ('paid', 'paid_duplicate', 'paid_mismatch') then return 'already'; end if;

  if v_job.payment_status = 'paid' then
    v_outcome := 'duplicate';
  elsif v_payment.amount_cents is distinct from p_amount_cents
    or round(coalesce(v_job.quote_total, 0) * 100)::integer <> p_amount_cents then
    v_outcome := 'mismatch';
  else
    v_outcome := 'paid';
  end if;

  update public.payments set
    status = case v_outcome
      when 'paid' then 'paid'
      when 'duplicate' then 'paid_duplicate'
      else 'paid_mismatch'
    end,
    provider_payment_id = coalesce(p_payment_intent_id, provider_payment_id)
  where id = v_payment.id;

  if v_outcome = 'paid' then
    update public.jobs set
      payment_status = 'paid',
      paid_at = coalesce(paid_at, now()),
      quote_status = 'accepted',
      status = case
        when status in ('quote_received', 'awaiting_customer', 'awaiting_payment') then 'scheduling'
        else status
      end
    where id = p_job_id;
  end if;

  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values (
    p_job_id,
    case v_outcome
      when 'paid' then 'payment_received'
      when 'duplicate' then 'duplicate_payment'
      else 'payment_amount_mismatch'
    end,
    'stripe',
    jsonb_build_object('session_id', p_session_id, 'amount_cents', p_amount_cents)
  );

  return v_outcome;
end;
$$;

revoke all on function public.mark_job_paid(uuid, text, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.mark_job_paid(uuid, text, integer, text, uuid) to service_role;

-- 4. Inspector app feed: booking details the inspector needs ----------------

grant select (
  buyer_situation, access_choice, access_other_name, access_other_phone,
  agent_name, agent_agency, agent_phone, agent_email, listing_url
) on public.jobs to authenticated;

create or replace view public.inspector_job_feed
with (security_invoker = true)
as
select
  j.id,
  j.public_reference,
  j.service_family,
  j.inspection_type,
  j.new_home_stages,
  j.status,
  j.payment_status,
  j.inspection_status,
  j.report_status,
  j.confirmed_start,
  j.confirmed_end,
  j.preferred_date_1,
  j.preferred_date_2,
  j.deadline,
  j.flexible_booking,
  j.builder_name,
  j.expected_ready_date,
  j.access_contact,
  j.access_notes,
  j.is_test,
  j.created_at,
  j.updated_at,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name,
  c.email as customer_email,
  c.mobile as customer_mobile,
  p.full_address,
  p.suburb,
  p.postcode,
  p.property_type,
  p.storeys,
  p.bedrooms,
  p.bathrooms,
  j.buyer_situation,
  j.access_choice,
  j.access_other_name,
  j.access_other_phone,
  j.agent_name,
  j.agent_agency,
  j.agent_phone,
  j.agent_email,
  j.listing_url
from public.jobs j
join public.customers c on c.id = j.customer_id
join public.properties p on p.id = j.property_id
where j.archived_at is null;

revoke all on table public.inspector_job_feed from anon, authenticated;
grant select on table public.inspector_job_feed to authenticated;
