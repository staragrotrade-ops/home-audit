create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to service_role;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email extensions.citext not null unique,
  mobile text not null,
  conveyancer_email extensions.citext,
  agent_email extensions.citext,
  xero_contact_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address_key text not null unique,
  full_address text not null,
  suburb text,
  postcode text,
  property_type text,
  storeys text,
  bedrooms smallint,
  bathrooms smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_postcode_format check (postcode is null or postcode ~ '^\d{4}$'),
  constraint properties_bedrooms_range check (bedrooms is null or bedrooms between 0 and 30),
  constraint properties_bathrooms_range check (bathrooms is null or bathrooms between 0 and 30)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  service_family text not null,
  inspection_type text,
  new_home_stages text[] not null default '{}',
  status text not null default 'quote_received',
  customer_id uuid not null references public.customers(id),
  property_id uuid not null references public.properties(id),
  customer_snapshot jsonb not null default '{}'::jsonb,
  property_snapshot jsonb not null default '{}'::jsonb,
  quote_inputs jsonb not null default '{}'::jsonb,
  quote_status text not null default 'pending_review',
  quote_subtotal numeric(12, 2),
  gst numeric(12, 2),
  quote_total numeric(12, 2),
  pricing_rule_version text,
  payment_status text not null default 'not_requested',
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  xero_invoice_id text,
  calendar_event_id text,
  builder_name text,
  expected_ready_date date,
  preferred_date_1 date,
  preferred_date_2 date,
  deadline date,
  flexible_booking boolean not null default false,
  access_contact text,
  access_notes text,
  source_self_reported text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_service_family_check check (service_family in ('existing_home', 'new_home')),
  constraint jobs_status_check check (
    status in (
      'quote_received',
      'awaiting_customer',
      'awaiting_payment',
      'paid',
      'scheduling',
      'confirmed',
      'inspected',
      'report_sent',
      'completed',
      'cancelled'
    )
  ),
  constraint jobs_quote_status_check check (
    quote_status in ('pending_review', 'manual_review', 'quoted', 'accepted', 'declined', 'expired')
  ),
  constraint jobs_payment_status_check check (
    payment_status in ('not_requested', 'pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),
  constraint jobs_service_scope_check check (
    (service_family = 'existing_home' and nullif(inspection_type, '') is not null)
    or
    (service_family = 'new_home' and cardinality(new_home_stages) > 0)
  )
);

create table public.job_attribution (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  first_landing_url text,
  first_referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  google_click_id text,
  normalized_source text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'proposed',
  starts_at timestamptz,
  ends_at timestamptz,
  calendar_event_id text,
  proposed_by text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_status_check check (status in ('proposed', 'confirmed', 'rescheduled', 'cancelled', 'completed'))
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider text not null default 'stripe',
  provider_event_id text unique,
  provider_payment_id text,
  status text not null,
  amount numeric(12, 2),
  currency text not null default 'aud',
  raw_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  channel text not null,
  template_key text,
  recipient text,
  provider_message_id text,
  status text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  job_id uuid references public.jobs(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system',
  actor_id text,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index jobs_customer_id_idx on public.jobs(customer_id);
create index jobs_property_id_idx on public.jobs(property_id);
create index jobs_status_created_at_idx on public.jobs(status, created_at desc);
create index jobs_service_family_created_at_idx on public.jobs(service_family, created_at desc);
create index jobs_payment_status_idx on public.jobs(payment_status);
create index appointments_job_id_idx on public.appointments(job_id);
create index payments_job_id_idx on public.payments(job_id);
create index communications_job_id_idx on public.communications(job_id);
create index audit_events_job_id_created_at_idx on public.audit_events(job_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger customers_set_updated_at
before update on public.customers
for each row execute function private.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute function private.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function private.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function private.set_updated_at();

alter table public.customers enable row level security;
alter table public.properties enable row level security;
alter table public.jobs enable row level security;
alter table public.job_attribution enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.communications enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.properties from anon, authenticated;
revoke all on table public.jobs from anon, authenticated;
revoke all on table public.job_attribution from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.communications from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

create or replace function public.create_quote_job(payload jsonb)
returns table(job_id uuid, public_reference text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_property_id uuid;
  v_job_id uuid;
  v_reference text;
  v_address_key text;
  v_attribution jsonb := coalesce(payload -> 'attribution', '{}'::jsonb);
  v_stages text[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(payload -> 'new_home_stages', '[]'::jsonb))),
    '{}'::text[]
  );
begin
  insert into public.customers (
    first_name,
    last_name,
    email,
    mobile,
    conveyancer_email,
    agent_email
  ) values (
    payload ->> 'first_name',
    payload ->> 'last_name',
    payload ->> 'email',
    payload ->> 'mobile',
    nullif(payload ->> 'conveyancer_email', ''),
    nullif(payload ->> 'agent_email', '')
  )
  on conflict (email) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    mobile = excluded.mobile,
    conveyancer_email = coalesce(excluded.conveyancer_email, public.customers.conveyancer_email),
    agent_email = coalesce(excluded.agent_email, public.customers.agent_email)
  returning id into v_customer_id;

  v_address_key := lower(regexp_replace(trim(payload ->> 'property_address'), '\s+', ' ', 'g'))
    || '|'
    || coalesce(payload ->> 'postcode', '');

  insert into public.properties (
    address_key,
    full_address,
    suburb,
    postcode,
    property_type,
    storeys,
    bedrooms,
    bathrooms
  ) values (
    v_address_key,
    payload ->> 'property_address',
    nullif(payload ->> 'suburb', ''),
    nullif(payload ->> 'postcode', ''),
    nullif(payload ->> 'property_type', ''),
    nullif(payload ->> 'storeys', ''),
    nullif(payload ->> 'bedrooms', '')::smallint,
    nullif(payload ->> 'bathrooms', '')::smallint
  )
  on conflict (address_key) do update set
    full_address = excluded.full_address,
    suburb = coalesce(excluded.suburb, public.properties.suburb),
    postcode = coalesce(excluded.postcode, public.properties.postcode),
    property_type = coalesce(excluded.property_type, public.properties.property_type),
    storeys = coalesce(excluded.storeys, public.properties.storeys),
    bedrooms = coalesce(excluded.bedrooms, public.properties.bedrooms),
    bathrooms = coalesce(excluded.bathrooms, public.properties.bathrooms)
  returning id into v_property_id;

  v_reference := 'HA-'
    || to_char(current_date, 'YYYYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.jobs (
    public_reference,
    service_family,
    inspection_type,
    new_home_stages,
    customer_id,
    property_id,
    customer_snapshot,
    property_snapshot,
    quote_inputs,
    builder_name,
    expected_ready_date,
    preferred_date_1,
    preferred_date_2,
    deadline,
    flexible_booking,
    access_contact,
    access_notes,
    source_self_reported
  ) values (
    v_reference,
    payload ->> 'service_family',
    nullif(payload ->> 'inspection_type', ''),
    v_stages,
    v_customer_id,
    v_property_id,
    jsonb_build_object(
      'first_name', payload ->> 'first_name',
      'last_name', payload ->> 'last_name',
      'email', payload ->> 'email',
      'mobile', payload ->> 'mobile',
      'conveyancer_email', payload ->> 'conveyancer_email',
      'agent_email', payload ->> 'agent_email'
    ),
    jsonb_build_object(
      'address', payload ->> 'property_address',
      'suburb', payload ->> 'suburb',
      'postcode', payload ->> 'postcode',
      'property_type', payload ->> 'property_type',
      'storeys', payload ->> 'storeys',
      'bedrooms', payload ->> 'bedrooms',
      'bathrooms', payload ->> 'bathrooms'
    ),
    payload - 'attribution' - 'website',
    nullif(payload ->> 'builder_name', ''),
    nullif(payload ->> 'expected_ready_date', '')::date,
    nullif(payload ->> 'preferred_date_1', '')::date,
    nullif(payload ->> 'preferred_date_2', '')::date,
    nullif(payload ->> 'deadline', '')::date,
    coalesce((payload ->> 'flexible_booking')::boolean, false),
    nullif(payload ->> 'access_contact', ''),
    nullif(payload ->> 'access_notes', ''),
    nullif(payload ->> 'source_self_reported', '')
  )
  returning id into v_job_id;

  insert into public.job_attribution (
    job_id,
    first_landing_url,
    first_referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    google_click_id,
    normalized_source
  ) values (
    v_job_id,
    nullif(v_attribution ->> 'first_landing_url', ''),
    nullif(v_attribution ->> 'first_referrer', ''),
    nullif(v_attribution ->> 'utm_source', ''),
    nullif(v_attribution ->> 'utm_medium', ''),
    nullif(v_attribution ->> 'utm_campaign', ''),
    nullif(v_attribution ->> 'utm_term', ''),
    nullif(v_attribution ->> 'utm_content', ''),
    nullif(v_attribution ->> 'google_click_id', ''),
    case
      when lower(coalesce(v_attribution ->> 'first_referrer', '')) like '%chatgpt.com%' then 'chatgpt'
      when lower(coalesce(v_attribution ->> 'first_referrer', '')) like '%claude.ai%' then 'claude'
      when lower(coalesce(v_attribution ->> 'first_referrer', '')) like '%perplexity.ai%' then 'perplexity'
      when lower(coalesce(v_attribution ->> 'utm_source', '')) <> '' then lower(v_attribution ->> 'utm_source')
      when coalesce(v_attribution ->> 'google_click_id', '') <> '' then 'google_ads'
      else null
    end
  );

  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values (
    v_job_id,
    'quote_request_created',
    'customer',
    jsonb_build_object('service_family', payload ->> 'service_family')
  );

  return query select v_job_id, v_reference;
end;
$$;

revoke all on function public.create_quote_job(jsonb) from public;
revoke all on function public.create_quote_job(jsonb) from anon, authenticated;
grant execute on function public.create_quote_job(jsonb) to service_role;
