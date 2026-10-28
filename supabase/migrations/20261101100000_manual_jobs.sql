-- Jobs taken by phone or in person: created in admin, invoiced and paid
-- outside the website (bank transfer, cash, card in person). The owner marks
-- the payment by hand. Safe to run more than once.

alter table public.jobs add column if not exists manual_payment_method text;
alter table public.jobs add column if not exists manual_payment_amount numeric(10, 2);
alter table public.jobs add column if not exists manual_payment_reference text;
alter table public.jobs drop constraint if exists jobs_manual_payment_method_check;
alter table public.jobs add constraint jobs_manual_payment_method_check check (
  manual_payment_method is null or manual_payment_method in ('bank_transfer', 'cash', 'card', 'other')
);

-- Creates a quoted job from the admin form (customer, property, price).
create or replace function public.create_manual_job(p jsonb)
returns table(job_id uuid, public_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_property_id uuid;
  v_job_id uuid;
  v_reference text;
  v_family text := coalesce(p ->> 'service_family', 'existing_home');
  v_stages text[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(p -> 'new_home_stages', '[]'::jsonb))), '{}'::text[]);
  v_total numeric := (p ->> 'price')::numeric;
  v_translation boolean := coalesce((p ->> 'translation_zh')::boolean, false);
  v_fee numeric := coalesce((p ->> 'translation_fee')::numeric, 0);
begin
  if v_total is null or v_total <= 0 or v_total > 20000 then raise exception 'Enter the price including GST.'; end if;
  if coalesce(p ->> 'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter the customer''s email.'; end if;
  if coalesce(trim(p ->> 'address'), '') = '' then raise exception 'Enter the property address.'; end if;
  if v_translation then v_total := v_total + v_fee; end if;

  insert into public.customers (first_name, last_name, email, mobile)
  values (trim(p ->> 'first_name'), trim(p ->> 'last_name'), lower(trim(p ->> 'email')), coalesce(trim(p ->> 'mobile'), ''))
  on conflict (email) do update set email = public.customers.email
  returning id into v_customer_id;

  insert into public.properties (address_key, full_address, suburb, postcode, property_type)
  values (
    lower(regexp_replace(trim(p ->> 'address'), '\s+', ' ', 'g')) || '|' || coalesce(p ->> 'postcode', ''),
    trim(p ->> 'address'), nullif(trim(p ->> 'suburb'), ''), nullif(trim(p ->> 'postcode'), ''),
    nullif(p ->> 'property_type', '')
  )
  on conflict (address_key) do update set
    full_address = excluded.full_address,
    suburb = coalesce(excluded.suburb, public.properties.suburb),
    postcode = coalesce(excluded.postcode, public.properties.postcode)
  returning id into v_property_id;

  v_reference := 'HA-'
    || to_char((now() at time zone 'Australia/Melbourne')::date, 'YYYYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.jobs (
    public_reference, service_family, inspection_type, new_home_stages,
    customer_id, property_id, customer_snapshot, property_snapshot, quote_inputs,
    status, quote_status, pricing_decision, quote_subtotal, gst, quote_total,
    intake_channel, preferred_date_1, internal_notes, translation_zh, translation_fee,
    privacy_consent_at
  ) values (
    v_reference, v_family,
    case when v_family = 'new_home' then null else coalesce(nullif(p ->> 'inspection_type', ''), 'building_and_pest') end,
    case when v_family = 'new_home' then v_stages else '{}'::text[] end,
    v_customer_id, v_property_id,
    jsonb_build_object(
      'first_name', trim(p ->> 'first_name'), 'last_name', trim(p ->> 'last_name'),
      'email', lower(trim(p ->> 'email')), 'mobile', coalesce(trim(p ->> 'mobile'), '')
    ),
    jsonb_build_object(
      'address', trim(p ->> 'address'), 'suburb', nullif(trim(p ->> 'suburb'), ''),
      'postcode', nullif(trim(p ->> 'postcode'), ''), 'property_type', nullif(p ->> 'property_type', '')
    ),
    jsonb_build_object('manual', true),
    'awaiting_payment', 'quoted', 'manual',
    v_total - round(v_total / 11, 2), round(v_total / 11, 2), v_total,
    'phone', nullif(p ->> 'preferred_date', '')::date, nullif(trim(p ->> 'notes'), ''),
    v_translation, case when v_translation then v_fee else 0 end,
    now()
  )
  returning id into v_job_id;

  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values (v_job_id, 'job_created_manually', 'admin', jsonb_build_object('total', v_total));
  return query select v_job_id, v_reference;
end;
$$;

revoke all on function public.create_manual_job(jsonb) from public, anon, authenticated;
grant execute on function public.create_manual_job(jsonb) to service_role;

-- Marks a job paid (or not paid) by hand. Online (Stripe) payments cannot be
-- undone here.
create or replace function public.set_manual_payment(
  p_job_id uuid,
  p_paid boolean,
  p_method text default null,
  p_amount numeric default null,
  p_reference text default null,
  p_paid_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs%rowtype;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then raise exception 'Job not found.'; end if;
  if exists (select 1 from public.payments where job_id = p_job_id and status = 'paid') then
    raise exception 'This job was paid online; change it in Stripe instead.';
  end if;
  if p_paid then
    if p_method is null or p_method not in ('bank_transfer', 'cash', 'card', 'other') then
      raise exception 'Choose how it was paid.';
    end if;
    if p_amount is null or p_amount <= 0 then raise exception 'Enter the amount received.'; end if;
    update public.jobs set
      payment_status = 'paid',
      paid_at = coalesce(p_paid_at, now()),
      manual_payment_method = p_method,
      manual_payment_amount = p_amount,
      manual_payment_reference = nullif(trim(coalesce(p_reference, '')), ''),
      status = case when status in ('quote_received', 'awaiting_customer', 'awaiting_payment') then 'paid' else status end
    where id = p_job_id;
  else
    update public.jobs set
      payment_status = 'not_requested',
      paid_at = null,
      manual_payment_method = null,
      manual_payment_amount = null,
      manual_payment_reference = null,
      status = case when status = 'paid' then 'awaiting_payment' else status end
    where id = p_job_id;
  end if;
  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values (
    p_job_id, case when p_paid then 'manual_payment_recorded' else 'manual_payment_removed' end, 'admin',
    jsonb_build_object('method', p_method, 'amount', p_amount, 'reference', p_reference)
  );
  return jsonb_build_object('paid', p_paid);
end;
$$;

revoke all on function public.set_manual_payment(uuid, boolean, text, numeric, text, timestamptz) from public, anon, authenticated;
grant execute on function public.set_manual_payment(uuid, boolean, text, numeric, text, timestamptz) to service_role;
