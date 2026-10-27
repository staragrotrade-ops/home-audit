-- Chinese translation of the report: a $50 add-on chosen on the order page
-- before payment. The app makes the Chinese copy when the report is issued;
-- the customer downloads it next to the English report. Safe to run more
-- than once.

alter table public.jobs add column if not exists translation_zh boolean not null default false;
alter table public.jobs add column if not exists translation_fee numeric(10, 2) not null default 0;

-- The app reads jobs through the feed with column grants.
grant select (translation_zh) on public.jobs to authenticated;

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
  j.listing_url,
  j.translation_zh
from public.jobs j
join public.customers c on c.id = j.customer_id
join public.properties p on p.id = j.property_id
where j.archived_at is null
  -- Report transfers are paperwork for the office, not field jobs.
  and j.intake_channel <> 'report_transfer';

revoke all on table public.inspector_job_feed from anon, authenticated;
grant select on table public.inspector_job_feed to authenticated;

alter table public.inspection_reports add column if not exists zh_path text;
alter table public.inspection_reports add column if not exists zh_template_path text;
alter table public.inspection_reports add column if not exists zh_name_slots jsonb;

-- Translated text is kept so the standard wording is translated once.
create table if not exists public.translation_cache (
  hash text primary key,
  lang text not null,
  translated text not null,
  created_at timestamptz not null default now(),
  constraint translation_cache_hash_check check (hash ~ '^[a-f0-9]{64}$')
);
alter table public.translation_cache enable row level security;
revoke all on table public.translation_cache from anon, authenticated;

-- Turns the add-on on or off before payment and moves the price with it.
create or replace function public.set_order_translation(p_job_id uuid, p_on boolean, p_fee numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs%rowtype;
  v_delta numeric;
  v_gst numeric;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_job.payment_status = 'paid' then raise exception 'This order is already paid.'; end if;
  if v_job.quote_status <> 'quoted' or v_job.quote_total is null then
    raise exception 'The price is not ready yet.';
  end if;
  if v_job.translation_zh = p_on then
    return jsonb_build_object('translationZh', p_on, 'total', v_job.quote_total);
  end if;
  v_delta := case when p_on then p_fee else -v_job.translation_fee end;
  v_gst := round(v_delta / 11, 2);
  update public.jobs set
    translation_zh = p_on,
    translation_fee = case when p_on then p_fee else 0 end,
    quote_total = quote_total + v_delta,
    gst = coalesce(gst, 0) + v_gst,
    quote_subtotal = coalesce(quote_subtotal, 0) + (v_delta - v_gst)
  where id = p_job_id;
  insert into public.audit_events (job_id, event_type, actor_type, event_data)
  values (p_job_id, 'translation_' || case when p_on then 'added' else 'removed' end, 'customer',
    jsonb_build_object('fee', p_fee));
  return jsonb_build_object('translationZh', p_on, 'total', v_job.quote_total + v_delta);
end;
$$;

revoke all on function public.set_order_translation(uuid, boolean, numeric) from public, anon, authenticated;
grant execute on function public.set_order_translation(uuid, boolean, numeric) to service_role;
