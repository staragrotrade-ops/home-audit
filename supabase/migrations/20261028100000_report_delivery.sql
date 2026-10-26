-- Report delivery: issuing a report no longer marks the job "Report sent".
-- The report is sent to the customer with "Send to customer" (website admin
-- or the app); the customer downloads it from their order page, and each
-- download is counted. Safe to run more than once.

alter table public.inspection_reports add column if not exists sent_at timestamptz;
alter table public.inspection_reports add column if not exists sent_to text;
alter table public.inspection_reports add column if not exists sent_by_staff_id uuid references public.staff(id) on delete set null;
alter table public.inspection_reports add column if not exists download_count integer not null default 0;
alter table public.inspection_reports add column if not exists first_downloaded_at timestamptz;
alter table public.inspection_reports add column if not exists last_downloaded_at timestamptz;

-- Issuing: the job is "Inspected" until the report is actually sent.
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
    status = case when status in ('paid', 'scheduling', 'confirmed') then 'inspected' else status end
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

-- Correct jobs marked "Report sent" only because a report was issued from
-- the app (none of their reports has been sent through the website).
update public.jobs j set status = 'inspected'
where j.status = 'report_sent'
  and exists (select 1 from public.inspection_reports r where r.job_id = j.id)
  and not exists (select 1 from public.inspection_reports r where r.job_id = j.id and r.sent_at is not null);

-- Records that the current report was emailed to the customer.
create or replace function public.mark_report_sent(
  p_report_id uuid,
  p_sent_to text,
  p_staff_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.inspection_reports%rowtype;
begin
  select * into v_report from public.inspection_reports where id = p_report_id for update;
  if not found or v_report.status <> 'issued' then
    raise exception 'Only the current issued report can be sent.';
  end if;
  update public.inspection_reports
  set sent_at = now(), sent_to = p_sent_to, sent_by_staff_id = p_staff_id
  where id = p_report_id;
  update public.jobs
  set status = case when status in ('paid', 'scheduling', 'confirmed', 'inspected') then 'report_sent' else status end
  where id = v_report.job_id;
  insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
  values (
    v_report.job_id, 'report_sent',
    case when p_staff_id is null then 'admin' else 'staff' end,
    p_staff_id::text,
    jsonb_build_object('report_id', p_report_id, 'version', v_report.version_label, 'to', p_sent_to)
  );
  return jsonb_build_object('id', p_report_id, 'sentAt', now());
end;
$$;

revoke all on function public.mark_report_sent(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.mark_report_sent(uuid, text, uuid) to service_role;

-- The app may send only as an assigned inspector who may issue reports.
create or replace function public.app_report_sender(p_actor_user_id uuid, p_job_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  if not private.staff_can_issue(v_staff.id) then
    raise exception 'Your account cannot send reports to customers.';
  end if;
  return v_staff.id;
end;
$$;

revoke all on function public.app_report_sender(uuid, uuid) from public, anon, authenticated;
grant execute on function public.app_report_sender(uuid, uuid) to service_role;

-- Counts the customer's downloads (proof of delivery).
create or replace function public.record_report_download(p_report_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.inspection_reports
  set download_count = download_count + 1,
      first_downloaded_at = coalesce(first_downloaded_at, now()),
      last_downloaded_at = now()
  where id = p_report_id;
$$;

revoke all on function public.record_report_download(uuid) from public, anon, authenticated;
grant execute on function public.record_report_download(uuid) to service_role;
