-- Report transfer: an agent passes on a QR code / link; another buyer pays
-- $250 + GST and gets the report in their own name. The app now uploads the
-- report as a template without the client's name plus where the name goes
-- (name_slots); the website prints the name in. Customers confirm a code sent
-- to their email before downloading. Safe to run more than once.

alter table public.inspection_reports add column if not exists template_path text;
alter table public.inspection_reports add column if not exists name_slots jsonb;
alter table public.inspection_reports add column if not exists client_name text;

alter table public.jobs add column if not exists transfer_of_report_id uuid
  references public.inspection_reports(id) on delete set null;

alter table public.jobs drop constraint if exists jobs_intake_channel_check;
alter table public.jobs add constraint jobs_intake_channel_check check (
  intake_channel in ('web_form', 'email_handoff', 'phone', 'app_manual', 'report_transfer')
);
alter table public.jobs drop constraint if exists jobs_pricing_decision_check;
alter table public.jobs add constraint jobs_pricing_decision_check check (
  pricing_decision is null or pricing_decision in ('instant', 'manual', 'transfer')
);

-- One public code per inspected job; the QR code points to /r/<code>.
create table if not exists public.report_transfer_links (
  code text primary key,
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  price_cents integer not null default 27500,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint report_transfer_links_code_check check (code ~ '^[A-Za-z0-9]{10}$'),
  constraint report_transfer_links_price_check check (price_cents between 100 and 500000)
);
alter table public.report_transfer_links enable row level security;
revoke all on table public.report_transfer_links from anon, authenticated;

-- Download codes emailed to the customer (only a hash is kept).
create table if not exists public.report_download_codes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  code_hash text not null,
  sent_to text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null default now() + interval '15 minutes',
  created_at timestamptz not null default now(),
  constraint report_download_codes_hash_check check (code_hash ~ '^[a-f0-9]{64}$')
);
create index if not exists report_download_codes_job_idx on public.report_download_codes (job_id, created_at desc);
alter table public.report_download_codes enable row level security;
revoke all on table public.report_download_codes from anon, authenticated;

-- The app reads jobs through this view with column grants; the filter below
-- needs intake_channel too.
grant select (intake_channel) on public.jobs to authenticated;

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
where j.archived_at is null
  -- Report transfers are paperwork for the office, not field jobs.
  and j.intake_channel <> 'report_transfer';

revoke all on table public.inspector_job_feed from anon, authenticated;
grant select on table public.inspector_job_feed to authenticated;

-- Creates the new buyer's order for a transfer (not paid yet). Only while
-- the transfer window is open: 30 days after the inspection, matching the
-- report's own advice to re-inspect after 30 days.
create or replace function public.create_transfer_job(p_code text, p_customer jsonb)
returns table(job_id uuid, public_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.report_transfer_links%rowtype;
  v_source public.jobs%rowtype;
  v_report public.inspection_reports%rowtype;
  v_customer_id uuid;
  v_job_id uuid;
  v_reference text;
  v_inspected timestamptz;
  v_total numeric;
begin
  select * into v_link from public.report_transfer_links where code = p_code and active;
  if not found then raise exception 'This report is not available for transfer.'; end if;
  select * into v_source from public.jobs where id = v_link.job_id;
  if v_source.status = 'cancelled' then raise exception 'This report is not available for transfer.'; end if;
  select * into v_report from public.inspection_reports
  where inspection_reports.job_id = v_source.id and status = 'issued' and template_path is not null
  order by issued_at desc limit 1;
  if not found then raise exception 'This report is not available for transfer.'; end if;
  v_inspected := coalesce(v_source.confirmed_start, v_report.issued_at);
  if now() > v_inspected + interval '30 days' then
    raise exception 'The transfer period for this report has ended. Please book a new inspection.';
  end if;
  if coalesce(p_customer ->> 'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  insert into public.customers (first_name, last_name, email, mobile)
  values (p_customer ->> 'first_name', p_customer ->> 'last_name', lower(p_customer ->> 'email'), p_customer ->> 'mobile')
  on conflict (email) do update set email = public.customers.email
  returning id into v_customer_id;

  v_reference := 'HA-'
    || to_char((now() at time zone 'Australia/Melbourne')::date, 'YYYYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_total := v_link.price_cents / 100.0;

  insert into public.jobs (
    public_reference, service_family, inspection_type, new_home_stages,
    customer_id, property_id, customer_snapshot, property_snapshot, quote_inputs,
    status, quote_status, pricing_decision, quote_subtotal, gst, quote_total,
    intake_channel, is_test, transfer_of_report_id, privacy_consent_at
  ) values (
    v_reference, v_source.service_family, v_source.inspection_type, v_source.new_home_stages,
    v_customer_id, v_source.property_id,
    jsonb_build_object(
      'first_name', p_customer ->> 'first_name',
      'last_name', p_customer ->> 'last_name',
      'email', lower(p_customer ->> 'email'),
      'mobile', p_customer ->> 'mobile'
    ),
    v_source.property_snapshot,
    jsonb_build_object('transfer_of_job', v_source.public_reference, 'inspected_at', v_inspected),
    'awaiting_payment', 'quoted', 'transfer',
    round(v_total / 1.1, 2), v_total - round(v_total / 1.1, 2), v_total,
    'report_transfer', v_source.is_test, v_report.id, now()
  )
  returning id into v_job_id;

  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values
    (v_job_id, 'transfer_requested', 'customer', jsonb_build_object('source', v_source.public_reference)),
    (v_source.id, 'transfer_requested', 'customer', jsonb_build_object('new_job', v_reference));

  return query select v_job_id, v_reference;
end;
$$;

revoke all on function public.create_transfer_job(text, jsonb) from public, anon, authenticated;
grant execute on function public.create_transfer_job(text, jsonb) to service_role;
