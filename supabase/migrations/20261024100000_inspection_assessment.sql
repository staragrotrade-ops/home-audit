-- The report summary required by AS 4349.1 Appendix C and AS 4349.3: overall
-- condition, incidence of major and minor defects, timber pest risk and the
-- recommended interval to the next timber pest inspection, plus further
-- inspections recommended and conditions on the day. One row per job,
-- written by the inspector app (newest edit wins, like defects).
-- Safe to run more than once.

create table if not exists public.inspection_assessments (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  building_condition text,
  major_incidence text,
  minor_incidence text,
  pest_risk text,
  pest_interval_months integer,
  further_inspections text[] not null default '{}',
  weather text,
  occupancy text,
  summary text,
  client_updated_at timestamptz not null,
  updated_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  sync_rev bigint not null default nextval('public.inspection_sync_rev_seq'),
  updated_at timestamptz not null default now(),
  constraint inspection_assessments_condition_check check (
    building_condition is null or building_condition in ('above_average', 'average', 'below_average')
  ),
  constraint inspection_assessments_incidence_check check (
    (major_incidence is null or major_incidence in ('low', 'typical', 'high'))
    and (minor_incidence is null or minor_incidence in ('low', 'typical', 'high'))
  ),
  constraint inspection_assessments_pest_check check (
    (pest_risk is null or pest_risk in ('low', 'moderate', 'high', 'extreme'))
    and (pest_interval_months is null or pest_interval_months between 1 and 24)
  ),
  constraint inspection_assessments_text_check check (
    char_length(coalesce(weather, '')) <= 200
    and char_length(coalesce(occupancy, '')) <= 200
    and char_length(coalesce(summary, '')) <= 4000
    and cardinality(further_inspections) <= 20
  )
);

drop trigger if exists inspection_assessments_bump_rev on public.inspection_assessments;
create trigger inspection_assessments_bump_rev
before update on public.inspection_assessments
for each row execute function private.bump_sync_rev();

alter table public.inspection_assessments enable row level security;
revoke all on table public.inspection_assessments from anon, authenticated;
drop policy if exists inspection_assessments_select_assigned on public.inspection_assessments;
create policy inspection_assessments_select_assigned on public.inspection_assessments
for select to authenticated using (private.can_view_job(job_id));
grant select on public.inspection_assessments to authenticated;

create or replace function public.app_save_assessment(
  p_actor_user_id uuid,
  p_job_id uuid,
  p_assessment jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_client_at timestamptz := (p_assessment->>'clientUpdatedAt')::timestamptz;
  v_existing public.inspection_assessments%rowtype;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  select * into v_existing from public.inspection_assessments where job_id = p_job_id for update;
  if found and v_existing.client_updated_at > v_client_at then
    return jsonb_build_object('applied', false, 'stale', true);
  end if;

  insert into public.inspection_assessments (
    job_id, building_condition, major_incidence, minor_incidence, pest_risk,
    pest_interval_months, further_inspections, weather, occupancy, summary,
    client_updated_at, updated_by_staff_id
  ) values (
    p_job_id,
    nullif(p_assessment->>'buildingCondition', ''),
    nullif(p_assessment->>'majorIncidence', ''),
    nullif(p_assessment->>'minorIncidence', ''),
    nullif(p_assessment->>'pestRisk', ''),
    (p_assessment->>'pestIntervalMonths')::integer,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_assessment->'furtherInspections', '[]'::jsonb))), '{}'),
    nullif(p_assessment->>'weather', ''),
    nullif(p_assessment->>'occupancy', ''),
    nullif(p_assessment->>'summary', ''),
    v_client_at, v_staff.id
  )
  on conflict (job_id) do update set
    building_condition = excluded.building_condition,
    major_incidence = excluded.major_incidence,
    minor_incidence = excluded.minor_incidence,
    pest_risk = excluded.pest_risk,
    pest_interval_months = excluded.pest_interval_months,
    further_inspections = excluded.further_inspections,
    weather = excluded.weather,
    occupancy = excluded.occupancy,
    summary = excluded.summary,
    client_updated_at = excluded.client_updated_at,
    updated_by_staff_id = excluded.updated_by_staff_id;

  insert into public.audit_events (job_id, event_type, actor_type, actor_id, event_data)
  values (p_job_id, 'app_assessment_saved', 'staff', v_staff.id::text, '{}'::jsonb);
  return jsonb_build_object('applied', true, 'stale', false);
end;
$$;

revoke all on function public.app_save_assessment(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.app_save_assessment(uuid, uuid, jsonb) to service_role;
