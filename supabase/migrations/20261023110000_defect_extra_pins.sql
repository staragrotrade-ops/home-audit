-- A defect may be marked at several places on the floorplans (the same
-- defect seen in more than one spot). The first location stays in
-- floorplan_id / pin_x / pin_y; further ones are in extra_pins as
-- [{"floorplanId": uuid, "x": 0..1, "y": 0..1}, …]. Most defects have none.

alter table public.inspection_defects
  add column if not exists extra_pins jsonb not null default '[]'::jsonb;

alter table public.inspection_defects drop constraint if exists inspection_defects_extra_pins_check;
alter table public.inspection_defects
  add constraint inspection_defects_extra_pins_check check (
    jsonb_typeof(extra_pins) = 'array' and jsonb_array_length(extra_pins) <= 50
    and (jsonb_array_length(extra_pins) = 0 or pin_x is not null)
  );

-- True when every extra pin is on a floorplan of the job with 0–1 coordinates.
create or replace function private.extra_pins_valid(p_job_id uuid, p_pins jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(bool_and(
    (pin->>'x') ~ '^[0-9.eE+-]+$' and (pin->>'y') ~ '^[0-9.eE+-]+$'
    and (pin->>'x')::numeric between 0 and 1
    and (pin->>'y')::numeric between 0 and 1
    and exists (
      select 1 from public.job_floorplans f
      where f.job_id = p_job_id and f.id::text = pin->>'floorplanId'
    )
  ), true)
  from jsonb_array_elements(coalesce(p_pins, '[]'::jsonb)) as pin
$$;

revoke all on function private.extra_pins_valid(uuid, jsonb) from public;

-- Same as before, plus extra_pins.
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
  v_extra jsonb;
begin
  v_staff := private.app_actor_for_job(p_actor_user_id, p_job_id);
  if jsonb_typeof(p_defects) <> 'array' or jsonb_array_length(p_defects) > 200 then
    raise exception 'Send between 0 and 200 defects at a time.';
  end if;

  for v_item in select * from jsonb_array_elements(p_defects) loop
    v_id := (v_item->>'id')::uuid;
    v_client_at := (v_item->>'clientUpdatedAt')::timestamptz;
    v_template := nullif(v_item->>'templateId', '')::uuid;
    v_floorplan := nullif(v_item->>'floorplanId', '')::uuid;
    v_extra := coalesce(v_item->'extraPins', '[]'::jsonb);
    if jsonb_typeof(v_extra) <> 'array' then v_extra := '[]'::jsonb; end if;

    select * into v_existing from public.inspection_defects where id = v_id for update;
    if found then
      if v_existing.job_id <> p_job_id then raise exception 'Defect belongs to another job.'; end if;
      if v_existing.client_updated_at > v_client_at then
        v_stale := v_stale || v_id;
        v_existing := null;
        continue;
      end if;
    end if;

    if v_floorplan is not null and not exists (
      select 1 from public.job_floorplans where id = v_floorplan and job_id = p_job_id
    ) then
      raise exception 'Floorplan does not belong to this job.';
    end if;
    if not private.extra_pins_valid(p_job_id, v_extra) then
      raise exception 'A defect location is outside its floorplan or on a floorplan of another job.';
    end if;
    if v_template is not null and not exists (select 1 from public.defect_templates where id = v_template) then
      v_template := null;
    end if;

    insert into public.inspection_defects as d (
      id, job_id, floorplan_id, pin_x, pin_y, extra_pins, location_label, element_key, category, severity,
      title, observation, recommendation, trade_key, quantity, quantity_unit, template_id,
      sort_order, deleted_at, client_updated_at, created_by_staff_id, updated_by_staff_id
    ) values (
      v_id, p_job_id, v_floorplan,
      (v_item->>'pinX')::numeric, (v_item->>'pinY')::numeric, v_extra,
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
      extra_pins = excluded.extra_pins,
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
