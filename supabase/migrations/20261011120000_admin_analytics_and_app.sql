-- Admin dashboard, first-party visitor analytics and the inspector app API
-- (release 0.7.0). Apply after the two earlier migrations, in order.
--
-- 1. Jobs gain intake, lifecycle and inspection/report progress fields.
-- 2. A shared rate limit replaces the per-instance memory limiter.
-- 3. Visitor analytics: analytics_events + page_activity, written only by the
--    server with the service role. No IP address is stored.
-- 4. Staff (inspector logins through Supabase Auth) and job assignments.
--    Inspectors read only the jobs assigned to them, through RLS.
-- 5. Issued inspection reports in a private storage bucket.

-- 1. Jobs ------------------------------------------------------------------

alter table public.jobs
  add column if not exists intake_channel text not null default 'web_form',
  add column if not exists analytics_session_id uuid,
  add column if not exists is_test boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists inspection_status text not null default 'not_started',
  add column if not exists report_status text not null default 'not_started',
  add column if not exists confirmed_start timestamptz,
  add column if not exists confirmed_end timestamptz;

alter table public.jobs
  add constraint jobs_intake_channel_check check (
    intake_channel in ('web_form', 'email_handoff', 'phone', 'app_manual')
  ),
  add constraint jobs_inspection_status_check check (
    inspection_status in ('not_started', 'on_site', 'inspected')
  ),
  add constraint jobs_report_status_check check (
    report_status in ('not_started', 'drafting', 'issued')
  ),
  add constraint jobs_confirmed_window_check check (
    confirmed_end is null or confirmed_start is null or confirmed_end > confirmed_start
  );

create index if not exists jobs_archived_created_idx on public.jobs (archived_at, created_at desc);
create index if not exists jobs_analytics_session_idx on public.jobs (analytics_session_id);

-- 2. Shared rate limit -----------------------------------------------------

create table private.rate_limits (
  bucket text not null,
  client_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, client_hash, window_start)
);

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_client_hash text,
  p_window_seconds integer,
  p_max_hits integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_hits integer;
begin
  if p_client_hash !~ '^[a-f0-9]{64}$' or p_window_seconds < 10 or p_max_hits < 1 then
    raise exception 'Invalid rate limit request.';
  end if;

  insert into private.rate_limits (bucket, client_hash, window_start, hits)
  values (p_bucket, p_client_hash, v_window, 1)
  on conflict (bucket, client_hash, window_start)
  do update set hits = private.rate_limits.hits + 1
  returning hits into v_hits;

  -- Old windows are only useful for the current check.
  delete from private.rate_limits
  where window_start < now() - make_interval(secs => greatest(p_window_seconds, 3600) * 2);

  return v_hits <= p_max_hits;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

-- 3. Visitor analytics -----------------------------------------------------

create table public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_name text not null,
  event_key text not null default '',
  path text not null default '',
  landing_path text not null default '',
  referrer text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  device text not null default '',
  country text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_name_check check (event_name ~ '^[a-z_]{3,40}$'),
  constraint analytics_events_device_check check (device in ('', 'mobile', 'tablet', 'desktop')),
  constraint analytics_events_unique unique (session_id, event_name, event_key)
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_session_idx on public.analytics_events (session_id, created_at);
create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);

create table public.page_activity (
  session_id uuid not null,
  page_instance_id uuid not null,
  path text not null,
  active_seconds integer not null default 0,
  heartbeat_count integer not null default 0,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  exited_at timestamptz,
  exit_reason text,
  primary key (session_id, page_instance_id),
  constraint page_activity_seconds_check check (active_seconds between 0 and 86400)
);

create index page_activity_started_idx on public.page_activity (started_at desc);

alter table public.analytics_events enable row level security;
alter table public.page_activity enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
revoke all on table public.page_activity from anon, authenticated;

create or replace function public.record_page_activity(
  p_session_id uuid,
  p_page_instance_id uuid,
  p_path text,
  p_active_seconds integer,
  p_action text,
  p_exit_reason text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_seconds integer := greatest(0, least(coalesce(p_active_seconds, 0), 60));
begin
  if p_action not in ('start', 'heartbeat', 'visibility', 'exit') then
    raise exception 'Invalid activity action.';
  end if;

  insert into public.page_activity as activity (
    session_id, page_instance_id, path, active_seconds, heartbeat_count,
    exited_at, exit_reason
  ) values (
    p_session_id,
    p_page_instance_id,
    left(coalesce(p_path, ''), 300),
    v_seconds,
    case when p_action = 'heartbeat' then 1 else 0 end,
    case when p_action = 'exit' then now() else null end,
    case when p_action = 'exit' then left(p_exit_reason, 40) else null end
  )
  on conflict (session_id, page_instance_id) do update set
    active_seconds = least(activity.active_seconds + excluded.active_seconds, 86400),
    heartbeat_count = activity.heartbeat_count + excluded.heartbeat_count,
    last_seen_at = now(),
    exited_at = coalesce(excluded.exited_at, activity.exited_at),
    exit_reason = coalesce(excluded.exit_reason, activity.exit_reason);
end;
$$;

revoke all on function public.record_page_activity(uuid, uuid, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.record_page_activity(uuid, uuid, text, integer, text, text) to service_role;

-- Where a visit came from, from its first event.
create or replace function private.traffic_source(p_referrer text, p_utm_source text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(p_utm_source, '') <> '' then lower(p_utm_source)
    when coalesce(p_referrer, '') = '' then 'Direct'
    when p_referrer ~* '://([a-z0-9-]+\.)*google\.' then 'Google'
    when p_referrer ~* '://([a-z0-9-]+\.)*bing\.com' then 'Bing'
    when p_referrer ~* '://([a-z0-9-]+\.)*duckduckgo\.com' then 'DuckDuckGo'
    when p_referrer ~* '://([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.me)' then 'Facebook'
    when p_referrer ~* '://([a-z0-9-]+\.)*instagram\.com' then 'Instagram'
    when p_referrer ~* '://([a-z0-9-]+\.)*linkedin\.com' then 'LinkedIn'
    when p_referrer ~* '://([a-z0-9-]+\.)*(chatgpt\.com|openai\.com)' then 'ChatGPT'
    when p_referrer ~* '://([a-z0-9-]+\.)*claude\.ai' then 'Claude'
    when p_referrer ~* '://([a-z0-9-]+\.)*perplexity\.ai' then 'Perplexity'
    when p_referrer ~* '://([a-z0-9-]+\.)*gemini\.google' then 'Gemini'
    when p_referrer ~* '://([a-z0-9-]+\.)*homeaudit\.com\.au' then 'Direct'
    else coalesce(substring(p_referrer from '://(?:www\.)?([^/:]+)'), 'Other')
  end
$$;

-- One row per visit (browser tab session).
create or replace view public.analytics_sessions
with (security_invoker = true)
as
with first_event as (
  select distinct on (session_id)
    session_id, landing_path, referrer, utm_source, device, country
  from public.analytics_events
  order by session_id, created_at
),
event_stats as (
  select
    session_id,
    min(created_at) as first_seen_at,
    max(created_at) as last_seen_at,
    count(*) filter (where event_name = 'page_view') as page_views,
    bool_or(event_name = 'quote_started') as quote_started,
    bool_or(event_name in ('quote_submitted', 'quote_email_handoff')) as quote_requested,
    bool_or(event_name in ('phone_clicked', 'email_clicked')) as contact_clicked
  from public.analytics_events
  group by session_id
),
activity as (
  select session_id, sum(active_seconds)::integer as active_seconds
  from public.page_activity
  group by session_id
)
select
  s.session_id,
  s.first_seen_at,
  s.last_seen_at,
  f.landing_path,
  f.referrer,
  f.utm_source,
  private.traffic_source(f.referrer, f.utm_source) as source,
  f.device,
  f.country,
  s.page_views,
  coalesce(a.active_seconds, 0) as active_seconds,
  s.quote_started,
  s.quote_requested,
  s.contact_clicked
from event_stats s
join first_event f using (session_id)
left join activity a using (session_id);

revoke all on table public.analytics_sessions from anon, authenticated;
grant select on table public.analytics_sessions to service_role;
grant usage on schema private to service_role;
grant execute on function private.traffic_source(text, text) to service_role;

create or replace function public.get_analytics_summary(p_since timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with sessions as (
    select * from public.analytics_sessions where first_seen_at >= p_since
  ),
  views as (
    select path, session_id
    from public.analytics_events
    where event_name = 'page_view' and created_at >= p_since
  ),
  path_time as (
    select path, sum(active_seconds)::bigint as seconds, count(*) as instances
    from public.page_activity
    where started_at >= p_since
    group by path
  )
  select jsonb_build_object(
    'visitors', (select count(*) from sessions),
    'pageViews', (select count(*) from views),
    'activeSeconds', (select coalesce(sum(active_seconds), 0) from sessions),
    'quoteStarted', (select count(*) from sessions where quote_started),
    'quoteRequested', (select count(*) from sessions where quote_requested),
    'contactClicked', (select count(*) from sessions where contact_clicked),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors) order by day)
      from (
        select (first_seen_at at time zone 'Australia/Melbourne')::date as day, count(*) as visitors
        from sessions group by 1
      ) d
    ), '[]'::jsonb),
    'topPages', coalesce((
      select jsonb_agg(row_to_json(p) order by p.views desc)
      from (
        select v.path, count(*) as views, count(distinct v.session_id) as visitors,
          coalesce(max(t.seconds) / nullif(max(t.instances), 0), 0) as "avgSeconds"
        from views v left join path_time t using (path)
        group by v.path
        order by count(*) desc
        limit 20
      ) p
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(row_to_json(s) order by s.visitors desc)
      from (
        select source, count(*) as visitors,
          count(*) filter (where quote_requested) as quotes
        from sessions group by source order by count(*) desc limit 15
      ) s
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(row_to_json(d) order by d.visitors desc)
      from (
        select coalesce(nullif(device, ''), 'unknown') as device, count(*) as visitors
        from sessions group by 1
      ) d
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(row_to_json(c) order by c.visitors desc)
      from (
        select coalesce(nullif(country, ''), '??') as country, count(*) as visitors
        from sessions group by 1 order by count(*) desc limit 10
      ) c
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.get_analytics_summary(timestamptz) from public, anon, authenticated;
grant execute on function public.get_analytics_summary(timestamptz) to service_role;

-- 4. Staff and assignments -------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  display_name text not null,
  role text not null default 'inspector',
  active boolean not null default true,
  registration_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_role_check check (role in ('admin', 'inspector'))
);

create trigger staff_set_updated_at
before update on public.staff
for each row execute function private.set_updated_at();

create table public.job_assignments (
  job_id uuid not null references public.jobs(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (job_id, staff_id)
);

create index job_assignments_staff_idx on public.job_assignments (staff_id);

create or replace function private.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.staff where auth_user_id = auth.uid() and active
$$;

create or replace function private.current_staff_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where auth_user_id = auth.uid() and active and role = 'admin'
  )
$$;

create or replace function private.can_view_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_staff_is_admin()
    or exists (
      select 1 from public.job_assignments a
      where a.job_id = p_job_id and a.staff_id = private.current_staff_id()
    )
$$;

grant usage on schema private to authenticated;
revoke all on function private.current_staff_id() from public;
revoke all on function private.current_staff_is_admin() from public;
revoke all on function private.can_view_job(uuid) from public;
grant execute on function private.current_staff_id() to authenticated;
grant execute on function private.current_staff_is_admin() to authenticated;
grant execute on function private.can_view_job(uuid) to authenticated;

alter table public.staff enable row level security;
alter table public.job_assignments enable row level security;
revoke all on table public.staff from anon, authenticated;
revoke all on table public.job_assignments from anon, authenticated;

create policy staff_select_self_or_admin on public.staff
for select to authenticated
using (auth_user_id = auth.uid() or private.current_staff_is_admin());

create policy assignments_select_own_or_admin on public.job_assignments
for select to authenticated
using (staff_id = private.current_staff_id() or private.current_staff_is_admin());

create policy jobs_select_assigned on public.jobs
for select to authenticated
using (private.can_view_job(id));

create policy customers_select_assigned on public.customers
for select to authenticated
using (exists (
  select 1 from public.jobs j where j.customer_id = customers.id and private.can_view_job(j.id)
));

create policy properties_select_assigned on public.properties
for select to authenticated
using (exists (
  select 1 from public.jobs j where j.property_id = properties.id and private.can_view_job(j.id)
));

-- Inspectors only receive the columns the app needs. Prices, payment
-- provider ids and internal notes stay server-side.
grant select (id, auth_user_id, email, display_name, role, active, registration_number)
  on public.staff to authenticated;
grant select (job_id, staff_id, assigned_at) on public.job_assignments to authenticated;
grant select (
  id, public_reference, service_family, inspection_type, new_home_stages, status,
  payment_status, customer_id, property_id, builder_name, expected_ready_date,
  preferred_date_1, preferred_date_2, deadline, flexible_booking, access_contact,
  access_notes, is_test, archived_at, inspection_status, report_status,
  confirmed_start, confirmed_end, created_at, updated_at
) on public.jobs to authenticated;
grant select (id, first_name, last_name, email, mobile) on public.customers to authenticated;
grant select (
  id, full_address, suburb, postcode, property_type, storeys, bedrooms, bathrooms
) on public.properties to authenticated;

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
  p.bathrooms
from public.jobs j
join public.customers c on c.id = j.customer_id
join public.properties p on p.id = j.property_id
where j.archived_at is null;

revoke all on table public.inspector_job_feed from anon, authenticated;
grant select on table public.inspector_job_feed to authenticated;

-- The app moves inspection and report progress forward only.
create or replace function public.app_update_job_progress(
  p_actor_user_id uuid,
  p_job_id uuid,
  p_inspection_status text default null,
  p_report_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_job public.jobs%rowtype;
  v_inspection_rank integer;
  v_report_rank integer;
begin
  select * into v_staff from public.staff where auth_user_id = p_actor_user_id and active;
  if not found then raise exception 'This user is not an active inspector.'; end if;

  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then raise exception 'Job not found.'; end if;

  if v_staff.role <> 'admin' and not exists (
    select 1 from public.job_assignments where job_id = p_job_id and staff_id = v_staff.id
  ) then
    raise exception 'Job not found or not assigned to this inspector.';
  end if;

  if p_inspection_status is not null then
    v_inspection_rank := array_position(array['not_started', 'on_site', 'inspected'], p_inspection_status);
    if v_inspection_rank is null then raise exception 'Invalid inspection status.'; end if;
    if v_inspection_rank < array_position(array['not_started', 'on_site', 'inspected'], v_job.inspection_status) then
      raise exception 'Inspection status can only move forward.';
    end if;
    v_job.inspection_status := p_inspection_status;
  end if;

  if p_report_status is not null then
    v_report_rank := array_position(array['not_started', 'drafting', 'issued'], p_report_status);
    if v_report_rank is null then raise exception 'Invalid report status.'; end if;
    if v_report_rank < array_position(array['not_started', 'drafting', 'issued'], v_job.report_status) then
      raise exception 'Report status can only move forward.';
    end if;
    if p_report_status = 'issued' then
      raise exception 'Reports are marked issued when the PDF is registered.';
    end if;
    v_job.report_status := p_report_status;
  end if;

  update public.jobs set
    inspection_status = v_job.inspection_status,
    report_status = v_job.report_status,
    status = case
      when v_job.inspection_status = 'inspected' and status in ('paid', 'scheduling', 'confirmed') then 'inspected'
      else status
    end
  where id = p_job_id;

  insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
  values (
    p_job_id, 'app_progress_updated', 'staff', v_staff.id::text,
    jsonb_build_object('inspection_status', v_job.inspection_status, 'report_status', v_job.report_status)
  );

  return jsonb_build_object(
    'id', p_job_id,
    'inspectionStatus', v_job.inspection_status,
    'reportStatus', v_job.report_status
  );
end;
$$;

revoke all on function public.app_update_job_progress(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.app_update_job_progress(uuid, uuid, text, text) to service_role;

-- 5. Issued reports --------------------------------------------------------

create table public.inspection_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  report_kind text not null,
  version_label text not null,
  storage_path text not null unique,
  size_bytes integer not null,
  sha256 text,
  status text not null default 'issued',
  issued_at timestamptz not null default now(),
  issued_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inspection_reports_kind_check check (
    report_kind in ('building', 'timber_pest', 'building_and_pest', 'new_home_stage', 'pci', 'other')
  ),
  constraint inspection_reports_version_check check (version_label ~ '^v[1-9][0-9]*$'),
  constraint inspection_reports_status_check check (status in ('issued', 'superseded', 'withdrawn')),
  constraint inspection_reports_sha_check check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  constraint inspection_reports_size_check check (size_bytes between 1 and 52428800),
  constraint inspection_reports_version_unique unique (job_id, report_kind, version_label)
);

create index inspection_reports_job_idx on public.inspection_reports (job_id, issued_at desc);

alter table public.inspection_reports enable row level security;
revoke all on table public.inspection_reports from anon, authenticated;

create policy inspection_reports_select_assigned on public.inspection_reports
for select to authenticated
using (private.can_view_job(job_id));

grant select (
  id, job_id, report_kind, version_label, size_bytes, sha256, status, issued_at, issued_by_staff_id
) on public.inspection_reports to authenticated;

create or replace function public.register_inspection_report(
  p_actor_user_id uuid,
  p_job_id uuid,
  p_report_kind text,
  p_version_label text,
  p_storage_path text,
  p_size_bytes integer,
  p_sha256 text,
  p_issued_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_report_id uuid;
begin
  select * into v_staff from public.staff where auth_user_id = p_actor_user_id and active;
  if not found then raise exception 'This user is not an active inspector.'; end if;

  if v_staff.role <> 'admin' and not exists (
    select 1 from public.job_assignments where job_id = p_job_id and staff_id = v_staff.id
  ) then
    raise exception 'Job not found or not assigned to this inspector.';
  end if;

  if left(p_storage_path, length(p_job_id::text) + 1) <> p_job_id::text || '/' then
    raise exception 'Report path does not belong to this job.';
  end if;

  update public.inspection_reports
  set status = 'superseded'
  where job_id = p_job_id and report_kind = p_report_kind and status = 'issued';

  insert into public.inspection_reports (
    job_id, report_kind, version_label, storage_path, size_bytes, sha256,
    issued_at, issued_by_staff_id
  ) values (
    p_job_id, p_report_kind, p_version_label, p_storage_path, p_size_bytes,
    lower(p_sha256), coalesce(p_issued_at, now()), v_staff.id
  )
  returning id into v_report_id;

  update public.jobs set
    report_status = 'issued',
    inspection_status = 'inspected',
    status = case when status in ('paid', 'scheduling', 'confirmed', 'inspected') then 'report_sent' else status end
  where id = p_job_id;

  insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
  values (
    p_job_id, 'report_issued', 'staff', v_staff.id::text,
    jsonb_build_object('report_id', v_report_id, 'kind', p_report_kind, 'version', p_version_label)
  );

  return jsonb_build_object('id', v_report_id, 'versionLabel', p_version_label);
end;
$$;

revoke all on function public.register_inspection_report(uuid, uuid, text, text, text, integer, text, timestamptz) from public, anon, authenticated;
grant execute on function public.register_inspection_report(uuid, uuid, text, text, text, integer, text, timestamptz) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-reports', 'inspection-reports', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;
