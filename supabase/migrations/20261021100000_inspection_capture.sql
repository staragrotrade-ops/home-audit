-- Building & pest inspection capture for the Home Audit Inspector app.
--
-- 1. Permissions: field inspectors capture; only admins and staff with
--    can_issue_reports may issue a report. Fieldwork goes to "in_review".
-- 2. Floorplans per job (from the listing, the customer, admin or onsite).
-- 3. Defects pinned on a floorplan, linked to a root cause, routed to a trade
--    and quantified so a tradie can price it.
-- 4. Defect photos (private bucket).
-- 5. Description templates ranked by how often they are used.
-- 6. Trade job leads: defects grouped per job and trade, for the future
--    repair-quote and tradie platform.
--
-- All writes from the app go through security-definer functions callable only
-- by service_role (the website API checks the inspector first). Inspectors
-- may read rows of the jobs they can see.

-- 1. Permissions ------------------------------------------------------------

alter table public.staff
  add column if not exists can_issue_reports boolean not null default false;

grant select (can_issue_reports) on public.staff to authenticated;

alter table public.jobs drop constraint if exists jobs_report_status_check;
alter table public.jobs
  add constraint jobs_report_status_check check (
    report_status in ('not_started', 'drafting', 'in_review', 'issued')
  );

create or replace function private.staff_can_issue(p_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where id = p_staff_id and active and (role = 'admin' or can_issue_reports)
  )
$$;

revoke all on function private.staff_can_issue(uuid) from public;

-- Shared check used by every app write below.
create or replace function private.app_actor_for_job(p_actor_user_id uuid, p_job_id uuid)
returns public.staff
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
begin
  select * into v_staff from public.staff where auth_user_id = p_actor_user_id and active;
  if not found then raise exception 'This user is not an active inspector.'; end if;
  if v_staff.role <> 'admin' and not exists (
    select 1 from public.job_assignments where job_id = p_job_id and staff_id = v_staff.id
  ) then
    raise exception 'Job not found or not assigned to this inspector.';
  end if;
  return v_staff;
end;
$$;

revoke all on function private.app_actor_for_job(uuid, uuid) from public;

-- Field inspectors may register a report only if they may issue; everyone
-- else submits fieldwork for review.
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
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  if not private.staff_can_issue(v_staff.id) then
    raise exception 'Your account can submit fieldwork but cannot issue reports.';
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

-- The progress function learns "in_review"; still forward-only.
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
  v_order text[] := array['not_started', 'drafting', 'in_review', 'issued'];
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then raise exception 'Job not found.'; end if;

  if p_inspection_status is not null then
    if array_position(array['not_started', 'on_site', 'inspected'], p_inspection_status) is null then
      raise exception 'Invalid inspection status.';
    end if;
    if array_position(array['not_started', 'on_site', 'inspected'], p_inspection_status)
       < array_position(array['not_started', 'on_site', 'inspected'], v_job.inspection_status) then
      raise exception 'Inspection status can only move forward.';
    end if;
    v_job.inspection_status := p_inspection_status;
  end if;

  if p_report_status is not null then
    if array_position(v_order, p_report_status) is null then raise exception 'Invalid report status.'; end if;
    if array_position(v_order, p_report_status) < array_position(v_order, v_job.report_status) then
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

-- 2. Floorplans ---------------------------------------------------------------

alter table public.jobs
  add column if not exists floorplan_fetch_status text,
  add column if not exists floorplan_fetch_at timestamptz,
  add column if not exists floorplan_fetch_note text;

alter table public.jobs drop constraint if exists jobs_floorplan_fetch_status_check;
alter table public.jobs
  add constraint jobs_floorplan_fetch_status_check check (
    floorplan_fetch_status is null or floorplan_fetch_status in ('found', 'not_found', 'blocked', 'failed')
  );

create table public.job_floorplans (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  level_label text not null default 'Ground floor',
  sort_order integer not null default 0,
  storage_path text not null unique,
  content_type text not null,
  size_bytes integer not null,
  width_px integer,
  height_px integer,
  source text not null,
  source_url text,
  status text not null default 'active',
  uploaded_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_floorplans_source_check check (source in ('listing', 'customer', 'admin', 'onsite')),
  constraint job_floorplans_status_check check (status in ('active', 'removed')),
  constraint job_floorplans_type_check check (
    content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  constraint job_floorplans_size_check check (size_bytes between 1 and 20971520),
  constraint job_floorplans_level_check check (char_length(level_label) between 1 and 60)
);

create index job_floorplans_job_idx on public.job_floorplans (job_id, status, sort_order);

create trigger job_floorplans_set_updated_at
before update on public.job_floorplans
for each row execute function private.set_updated_at();

alter table public.job_floorplans enable row level security;
revoke all on table public.job_floorplans from anon, authenticated;
create policy job_floorplans_select_assigned on public.job_floorplans
for select to authenticated using (private.can_view_job(job_id));
grant select (
  id, job_id, level_label, sort_order, content_type, size_bytes, width_px, height_px,
  source, status, created_at, updated_at
) on public.job_floorplans to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-floorplans', 'job-floorplans', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- 3. Defects -----------------------------------------------------------------

-- One rising number across all capture rows: the app asks "what changed
-- since revision N" and never misses an edit made on another phone.
create sequence if not exists public.inspection_sync_rev_seq;

create or replace function private.bump_sync_rev()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sync_rev := nextval('public.inspection_sync_rev_seq');
  new.updated_at := now();
  return new;
end;
$$;

create table public.defect_templates (
  id uuid primary key default gen_random_uuid(),
  element_key text not null,
  severity text not null,
  title text not null,
  observation text not null,
  recommendation text,
  use_count integer not null default 0,
  last_used_at timestamptz,
  active boolean not null default true,
  created_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  sync_rev bigint not null default nextval('public.inspection_sync_rev_seq'),
  updated_at timestamptz not null default now(),
  constraint defect_templates_title_check check (char_length(title) between 2 and 120),
  constraint defect_templates_observation_check check (char_length(observation) between 2 and 2000),
  constraint defect_templates_element_check check (element_key ~ '^[a-z0-9_]{2,40}$')
);

create index defect_templates_element_idx on public.defect_templates (element_key, use_count desc);

create trigger defect_templates_bump_rev
before update on public.defect_templates
for each row execute function private.bump_sync_rev();

create table public.inspection_defects (
  -- Generated by the phone so offline edits have a stable identity.
  id uuid primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  floorplan_id uuid references public.job_floorplans(id) on delete set null,
  pin_x numeric(6, 5),
  pin_y numeric(6, 5),
  location_label text,
  element_key text not null,
  category text not null,
  severity text not null,
  title text not null,
  observation text not null default '',
  recommendation text,
  trade_key text not null,
  quantity numeric(10, 2),
  quantity_unit text,
  root_cause_id uuid references public.inspection_defects(id) on delete set null,
  template_id uuid references public.defect_templates(id) on delete set null,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  client_updated_at timestamptz not null,
  created_by_staff_id uuid references public.staff(id) on delete set null,
  updated_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  sync_rev bigint not null default nextval('public.inspection_sync_rev_seq'),
  updated_at timestamptz not null default now(),
  constraint inspection_defects_pin_check check (
    (pin_x is null and pin_y is null)
    or (pin_x between 0 and 1 and pin_y between 0 and 1 and floorplan_id is not null)
  ),
  constraint inspection_defects_category_check check (category in ('building', 'timber_pest')),
  constraint inspection_defects_severity_check check (severity in (
    'major_defect', 'minor_defect', 'safety_hazard', 'further_investigation',
    'active_termites', 'termite_damage', 'timber_pest_other', 'conducive_condition'
  )),
  constraint inspection_defects_element_check check (element_key ~ '^[a-z0-9_]{2,40}$'),
  constraint inspection_defects_trade_check check (trade_key ~ '^[a-z0-9_]{2,40}$'),
  constraint inspection_defects_title_check check (char_length(title) between 1 and 160),
  constraint inspection_defects_text_check check (
    char_length(observation) <= 4000 and char_length(coalesce(recommendation, '')) <= 2000
    and char_length(coalesce(location_label, '')) <= 120
  ),
  constraint inspection_defects_quantity_check check (
    quantity is null or (quantity >= 0 and quantity_unit is not null and char_length(quantity_unit) <= 20)
  ),
  constraint inspection_defects_not_own_cause check (root_cause_id is null or root_cause_id <> id)
);

create index inspection_defects_job_idx on public.inspection_defects (job_id, sync_rev);
create index inspection_defects_root_idx on public.inspection_defects (root_cause_id);
create index inspection_defects_trade_idx on public.inspection_defects (job_id, trade_key) where deleted_at is null;

create trigger inspection_defects_bump_rev
before update on public.inspection_defects
for each row execute function private.bump_sync_rev();

alter table public.inspection_defects enable row level security;
alter table public.defect_templates enable row level security;
revoke all on table public.inspection_defects from anon, authenticated;
revoke all on table public.defect_templates from anon, authenticated;

create policy inspection_defects_select_assigned on public.inspection_defects
for select to authenticated using (private.can_view_job(job_id));
create policy defect_templates_select_staff on public.defect_templates
for select to authenticated using (private.current_staff_id() is not null);

grant select on public.inspection_defects to authenticated;
grant select (
  id, element_key, severity, title, observation, recommendation, use_count,
  last_used_at, active, sync_rev, updated_at
) on public.defect_templates to authenticated;

-- 4. Photos ------------------------------------------------------------------

create table public.inspection_photos (
  id uuid primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  defect_id uuid references public.inspection_defects(id) on delete cascade,
  storage_path text not null unique,
  content_type text not null default 'image/jpeg',
  size_bytes integer not null,
  sha256 text not null,
  width_px integer,
  height_px integer,
  caption text,
  source text not null default 'camera',
  captured_at timestamptz not null,
  captured_by_staff_id uuid references public.staff(id) on delete set null,
  uploaded_at timestamptz,
  deleted_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  sync_rev bigint not null default nextval('public.inspection_sync_rev_seq'),
  updated_at timestamptz not null default now(),
  constraint inspection_photos_source_check check (source in ('camera', 'gallery')),
  constraint inspection_photos_type_check check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint inspection_photos_size_check check (size_bytes between 1 and 15728640),
  constraint inspection_photos_sha_check check (sha256 ~ '^[a-f0-9]{64}$'),
  constraint inspection_photos_caption_check check (char_length(coalesce(caption, '')) <= 300)
);

create index inspection_photos_job_idx on public.inspection_photos (job_id, sync_rev);
create index inspection_photos_defect_idx on public.inspection_photos (defect_id);

create trigger inspection_photos_bump_rev
before update on public.inspection_photos
for each row execute function private.bump_sync_rev();

alter table public.inspection_photos enable row level security;
revoke all on table public.inspection_photos from anon, authenticated;
create policy inspection_photos_select_assigned on public.inspection_photos
for select to authenticated using (private.can_view_job(job_id));
grant select (
  id, job_id, defect_id, content_type, size_bytes, sha256, width_px, height_px, caption,
  source, captured_at, captured_by_staff_id, uploaded_at, deleted_at, sort_order, sync_rev, updated_at
) on public.inspection_photos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-photos', 'inspection-photos', false, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 5. App write functions -----------------------------------------------------

-- Upserts a batch of defects from one phone. Last edit wins per defect,
-- judged by the phone's own edit time; a stale edit is reported, not applied.
create or replace function public.app_sync_defects(
  p_actor_user_id uuid,
  p_job_id uuid,
  p_defects jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_item jsonb;
  v_existing public.inspection_defects%rowtype;
  v_applied uuid[] := '{}';
  v_stale uuid[] := '{}';
  v_id uuid;
  v_root uuid;
  v_template uuid;
  v_floorplan uuid;
  v_client_at timestamptz;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  if jsonb_typeof(p_defects) <> 'array' or jsonb_array_length(p_defects) > 200 then
    raise exception 'Send between 0 and 200 defects at a time.';
  end if;

  -- Pass 1 writes the rows without root links, so a batch may refer to a
  -- cause that arrives in the same batch. Pass 2 sets the links.
  for v_item in select * from jsonb_array_elements(p_defects) loop
    v_id := (v_item->>'id')::uuid;
    v_client_at := (v_item->>'clientUpdatedAt')::timestamptz;
    v_template := nullif(v_item->>'templateId', '')::uuid;
    v_floorplan := nullif(v_item->>'floorplanId', '')::uuid;

    select * into v_existing from public.inspection_defects where id = v_id for update;
    if found then
      if v_existing.job_id <> p_job_id then raise exception 'Defect belongs to another job.'; end if;
      if v_existing.client_updated_at > v_client_at then
        v_stale := v_stale || v_id;
        continue;
      end if;
    end if;

    if v_floorplan is not null and not exists (
      select 1 from public.job_floorplans where id = v_floorplan and job_id = p_job_id
    ) then
      raise exception 'Floorplan does not belong to this job.';
    end if;
    if v_template is not null and not exists (select 1 from public.defect_templates where id = v_template) then
      v_template := null;
    end if;

    insert into public.inspection_defects as d (
      id, job_id, floorplan_id, pin_x, pin_y, location_label, element_key, category, severity,
      title, observation, recommendation, trade_key, quantity, quantity_unit, template_id,
      sort_order, deleted_at, client_updated_at, created_by_staff_id, updated_by_staff_id
    ) values (
      v_id, p_job_id, v_floorplan,
      (v_item->>'pinX')::numeric, (v_item->>'pinY')::numeric,
      nullif(v_item->>'locationLabel', ''),
      v_item->>'elementKey', v_item->>'category', v_item->>'severity',
      v_item->>'title', coalesce(v_item->>'observation', ''), nullif(v_item->>'recommendation', ''),
      v_item->>'tradeKey', (v_item->>'quantity')::numeric, nullif(v_item->>'quantityUnit', ''),
      v_template, coalesce((v_item->>'sortOrder')::integer, 0),
      case when (v_item->>'deleted')::boolean then coalesce(v_existing.deleted_at, now()) else null end,
      v_client_at, v_staff.id, v_staff.id
    )
    on conflict (id) do update set
      floorplan_id = excluded.floorplan_id,
      pin_x = excluded.pin_x,
      pin_y = excluded.pin_y,
      location_label = excluded.location_label,
      element_key = excluded.element_key,
      category = excluded.category,
      severity = excluded.severity,
      title = excluded.title,
      observation = excluded.observation,
      recommendation = excluded.recommendation,
      trade_key = excluded.trade_key,
      quantity = excluded.quantity,
      quantity_unit = excluded.quantity_unit,
      template_id = excluded.template_id,
      sort_order = excluded.sort_order,
      deleted_at = excluded.deleted_at,
      client_updated_at = excluded.client_updated_at,
      updated_by_staff_id = excluded.updated_by_staff_id;

    -- A template counts as used once per defect, when first applied.
    if v_template is not null and (v_existing.id is null or v_existing.template_id is distinct from v_template) then
      update public.defect_templates
      set use_count = use_count + 1, last_used_at = now()
      where id = v_template;
    end if;

    v_applied := v_applied || v_id;
    v_existing := null;
  end loop;

  for v_item in select * from jsonb_array_elements(p_defects) loop
    v_id := (v_item->>'id')::uuid;
    if not v_id = any(v_applied) then continue; end if;
    v_root := nullif(v_item->>'rootCauseId', '')::uuid;
    if v_root is not null then
      -- Causes are one level deep: a cause cannot itself point to a cause,
      -- and must be on the same job.
      if not exists (
        select 1 from public.inspection_defects
        where id = v_root and job_id = p_job_id and root_cause_id is null and id <> v_id
      ) then
        raise exception 'The linked root cause is not a top-level defect on this job.';
      end if;
      if exists (select 1 from public.inspection_defects where root_cause_id = v_id and deleted_at is null) then
        raise exception 'A defect that is a root cause cannot be linked to another cause.';
      end if;
    end if;
    update public.inspection_defects set root_cause_id = v_root
    where id = v_id and root_cause_id is distinct from v_root;
  end loop;

  if cardinality(v_applied) > 0 then
    insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
    values (
      p_job_id, 'app_defects_synced', 'staff', v_staff.id::text,
      jsonb_build_object('applied', cardinality(v_applied), 'stale', cardinality(v_stale))
    );
  end if;

  return jsonb_build_object('applied', to_jsonb(v_applied), 'stale', to_jsonb(v_stale));
end;
$$;

revoke all on function public.app_sync_defects(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.app_sync_defects(uuid, uuid, jsonb) to service_role;

-- Registers a photo row before upload (idempotent by id) and later marks it
-- uploaded once the server has seen the file.
create or replace function public.app_register_photo(
  p_actor_user_id uuid,
  p_job_id uuid,
  p_photo jsonb,
  p_storage_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_id uuid := (p_photo->>'id')::uuid;
  v_defect uuid := nullif(p_photo->>'defectId', '')::uuid;
  v_existing public.inspection_photos%rowtype;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  if v_defect is not null and not exists (
    select 1 from public.inspection_defects where id = v_defect and job_id = p_job_id
  ) then
    raise exception 'Sync the defect before its photos.';
  end if;

  select * into v_existing from public.inspection_photos where id = v_id;
  if found then
    if v_existing.job_id <> p_job_id then raise exception 'Photo belongs to another job.'; end if;
    return jsonb_build_object('id', v_id, 'storagePath', v_existing.storage_path, 'uploaded', v_existing.uploaded_at is not null);
  end if;

  insert into public.inspection_photos (
    id, job_id, defect_id, storage_path, content_type, size_bytes, sha256, width_px, height_px,
    caption, source, captured_at, captured_by_staff_id, sort_order
  ) values (
    v_id, p_job_id, v_defect, p_storage_path,
    coalesce(p_photo->>'contentType', 'image/jpeg'),
    (p_photo->>'sizeBytes')::integer, lower(p_photo->>'sha256'),
    (p_photo->>'widthPx')::integer, (p_photo->>'heightPx')::integer,
    nullif(p_photo->>'caption', ''), coalesce(p_photo->>'source', 'camera'),
    (p_photo->>'capturedAt')::timestamptz, v_staff.id,
    coalesce((p_photo->>'sortOrder')::integer, 0)
  );
  return jsonb_build_object('id', v_id, 'storagePath', p_storage_path, 'uploaded', false);
end;
$$;

revoke all on function public.app_register_photo(uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.app_register_photo(uuid, uuid, jsonb, text) to service_role;

-- Field inspector hands the job to a reviewer.
create or replace function public.app_submit_fieldwork(p_actor_user_id uuid, p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_missing integer;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  select count(*) into v_missing from public.inspection_photos
  where job_id = p_job_id and deleted_at is null and uploaded_at is null;
  if v_missing > 0 then
    raise exception '% photo(s) are still uploading. Keep the app open with signal and try again.', v_missing;
  end if;

  update public.jobs set
    inspection_status = 'inspected',
    report_status = case when report_status in ('not_started', 'drafting') then 'in_review' else report_status end,
    status = case when status in ('paid', 'scheduling', 'confirmed') then 'inspected' else status end
  where id = p_job_id;

  insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
  values (p_job_id, 'fieldwork_submitted', 'staff', v_staff.id::text, '{}'::jsonb);
  return jsonb_build_object('id', p_job_id, 'reportStatus', 'in_review');
end;
$$;

revoke all on function public.app_submit_fieldwork(uuid, uuid) from public, anon, authenticated;
grant execute on function public.app_submit_fieldwork(uuid, uuid) to service_role;

-- 6. Trade job leads ---------------------------------------------------------

-- One row per job and trade: what a tradie would quote on. Root-cause
-- symptoms ride with their cause so the trade fixing the cause sees them.
create or replace view public.trade_job_leads
with (security_invoker = true)
as
select
  d.job_id,
  coalesce(root.trade_key, d.trade_key) as trade_key,
  count(*) filter (where d.root_cause_id is null) as defect_count,
  count(*) filter (where d.root_cause_id is not null) as symptom_count,
  bool_or(d.severity in ('major_defect', 'safety_hazard', 'active_termites')) as has_urgent,
  jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'element', d.element_key,
      'severity', d.severity,
      'title', d.title,
      'location', d.location_label,
      'quantity', d.quantity,
      'unit', d.quantity_unit,
      'rootCauseId', d.root_cause_id
    ) order by d.root_cause_id nulls first, d.sort_order
  ) as items,
  max(d.updated_at) as updated_at
from public.inspection_defects d
left join public.inspection_defects root on root.id = d.root_cause_id and root.deleted_at is null
where d.deleted_at is null
group by d.job_id, coalesce(root.trade_key, d.trade_key);

revoke all on table public.trade_job_leads from anon, authenticated;
grant select on table public.trade_job_leads to service_role;

-- 7. Starter templates (counts grow with use) --------------------------------

insert into public.defect_templates (element_key, severity, title, observation, recommendation) values
  ('roof_tile', 'minor_defect', 'Cracked roof tiles', 'Cracked roof tiles were observed.', 'Engage a roofer to replace the cracked tiles to prevent water entry.'),
  ('roof_tile', 'minor_defect', 'Displaced roof tiles', 'Displaced / slipped roof tiles were observed.', 'Engage a roofer to re-seat or refix the displaced tiles.'),
  ('ridge_capping', 'minor_defect', 'Deteriorated ridge pointing', 'The pointing to the ridge / hip capping is cracked and deteriorating.', 'Engage a roofer to rebed and repoint the affected capping.'),
  ('gutter', 'minor_defect', 'Gutters blocked with debris', 'Gutters contain leaf litter and debris, restricting flow.', 'Clean gutters and consider gutter guards; recheck falls after cleaning.'),
  ('gutter', 'minor_defect', 'Rusted / leaking gutters', 'Corrosion and evidence of leaking were observed to the gutters.', 'Engage a roof plumber to repair or replace the affected gutter sections.'),
  ('downpipe', 'minor_defect', 'Downpipe not connected to stormwater', 'A downpipe discharges onto the ground and is not connected to the stormwater system.', 'Engage a plumber / drainer to connect the downpipe to the stormwater system.'),
  ('flashing', 'minor_defect', 'Flashing lifted or deteriorated', 'Flashings are lifted, cracked or deteriorated.', 'Engage a roofer to refix or replace the flashings.'),
  ('ceiling', 'minor_defect', 'Water staining to ceiling', 'Water staining was observed to the ceiling lining.', 'Investigate and rectify the source of moisture, then repair the lining. Moisture readings recommended.'),
  ('ceiling', 'minor_defect', 'Cracking to ceiling lining', 'Cracking was observed to the ceiling lining / cornice joints.', 'Engage a plasterer to repair and repaint; monitor for further movement.'),
  ('internal_wall', 'minor_defect', 'Minor cracking to wall linings', 'Minor cracking was observed to the wall linings.', 'Repair and repaint; monitor for further movement.'),
  ('brickwork', 'minor_defect', 'Cracking to brickwork', 'Cracking was observed to the external brickwork.', 'Monitor the cracking; if it widens, obtain advice from a structural engineer.'),
  ('shower', 'major_defect', 'Leaking shower recess', 'Elevated moisture readings / water damage adjacent to the shower indicate a leak.', 'Engage a licensed waterproofer / plumber to investigate and repair the shower waterproofing.'),
  ('wet_area_tiling', 'minor_defect', 'Deteriorated grout / silicone', 'Grout and silicone joints in the wet area are cracked or deteriorated.', 'Regrout and reseal the affected joints to prevent water entry.'),
  ('stumps', 'major_defect', 'Stumps out of plumb / sinking', 'Stumps were observed to be out of plumb or showing signs of settlement.', 'Engage a builder / restumper to assess and rectify; a structural engineer may be required.'),
  ('subfloor_moisture', 'minor_defect', 'Poor subfloor ventilation', 'Subfloor ventilation is limited and the subfloor appears damp.', 'Improve cross-flow ventilation and site drainage to reduce subfloor moisture.'),
  ('smoke_alarm', 'safety_hazard', 'Smoke alarm missing or not working', 'Smoke alarms were missing or did not respond to testing.', 'Engage a licensed electrician to install compliant smoke alarms.'),
  ('balustrade', 'safety_hazard', 'Balustrade loose or non-compliant', 'The balustrade is loose and / or has openings that do not meet current safety requirements.', 'Engage a builder to repair or upgrade the balustrade.'),
  ('stormwater', 'minor_defect', 'Ground falling towards building', 'The ground surface falls towards the building, directing water to the footings.', 'Regrade the ground to fall away from the building and improve surface drainage.'),
  ('termite_activity', 'active_termites', 'Active subterranean termites', 'Live subterranean termites were found.', 'Do not disturb. Engage a licensed pest controller immediately for treatment, then a builder to assess timber damage.'),
  ('termite_activity', 'termite_damage', 'Termite damage observed', 'Damage consistent with previous termite activity was observed.', 'Engage a licensed pest controller to confirm whether activity is current and a builder to assess timber damage.'),
  ('timber_decay', 'timber_pest_other', 'Wood decay to timber', 'Fungal decay (wood rot) was observed in timber members.', 'Replace decayed timber and rectify the moisture source.'),
  ('subfloor_moisture', 'conducive_condition', 'Excessive moisture conducive to termites', 'Excess moisture was observed, which is conducive to timber pest activity.', 'Rectify drainage / leaks and improve ventilation.'),
  ('weep_vents', 'conducive_condition', 'Weep holes / vents covered', 'Weep holes or subfloor vents are covered by soil, paving or garden beds.', 'Lower the ground level or clear the vents to keep them unobstructed.')
on conflict do nothing;
