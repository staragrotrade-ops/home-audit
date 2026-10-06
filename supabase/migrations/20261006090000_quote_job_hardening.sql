-- Quote intake hardening (release 0.3.2). Apply after the foundation migration.
--
-- 1. Existing customers can no longer be overwritten through the public form.
-- 2. Selections from the other service family are discarded.
-- 3. Privacy consent is recorded on the job.
-- 4. Allowed inspection types and stages are enforced by the database too.
-- 5. Public references use the Melbourne date rather than UTC.

alter table public.jobs
  add column if not exists privacy_consent_at timestamptz;

alter table public.jobs
  add constraint jobs_inspection_type_check check (
    inspection_type is null
    or inspection_type in ('building_and_pest', 'building_only', 'pre_auction')
  );

alter table public.jobs
  add constraint jobs_new_home_stages_check check (
    new_home_stages <@ array['slab', 'frame', 'pre_plaster', 'fixing', 'pci']::text[]
  );

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
  v_family text := payload ->> 'service_family';
  v_stages text[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(payload -> 'new_home_stages', '[]'::jsonb))),
    '{}'::text[]
  );
begin
  -- Keep only the selections that belong to the chosen service family.
  if v_family = 'new_home' then
    payload := payload || jsonb_build_object('inspection_type', '');
  else
    v_stages := '{}'::text[];
    payload := payload || jsonb_build_object(
      'new_home_stages', '[]'::jsonb,
      'builder_name', '',
      'expected_ready_date', ''
    );
  end if;

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
  -- An unauthenticated form must not be able to rewrite an existing
  -- customer's details by reusing their email address. The no-op update only
  -- returns the existing row id; what was submitted this time is kept in
  -- jobs.customer_snapshot for staff to review.
  on conflict (email) do update set
    email = public.customers.email
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
    || to_char((now() at time zone 'Australia/Melbourne')::date, 'YYYYMMDD')
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
    source_self_reported,
    privacy_consent_at
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
    nullif(payload ->> 'source_self_reported', ''),
    case when (payload ->> 'privacy_consent')::boolean then now() else null end
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
