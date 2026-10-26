-- Defect library: inspectors add their own wording from the app. Saving a
-- defect adds it to the shared library (unless the same title already exists
-- for that element), so it can be applied with one tap later.
-- Safe to run more than once.

create or replace function public.app_save_defect_templates(
  p_actor_user_id uuid,
  p_templates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff%rowtype;
  v_item jsonb;
  v_id uuid;
  v_title text;
  v_saved uuid[] := '{}';
  v_duplicate jsonb := '{}'::jsonb;
  v_existing uuid;
begin
  select * into v_staff from public.staff where auth_user_id = p_actor_user_id and active;
  if not found then raise exception 'This user is not an active inspector.'; end if;
  if jsonb_typeof(p_templates) <> 'array' or jsonb_array_length(p_templates) > 50 then
    raise exception 'Send between 0 and 50 descriptions at a time.';
  end if;

  for v_item in select * from jsonb_array_elements(p_templates) loop
    v_id := (v_item->>'id')::uuid;
    v_title := btrim(v_item->>'title');
    -- Already uploaded (a retry): nothing to do.
    if exists (select 1 from public.defect_templates where id = v_id) then
      v_saved := v_saved || v_id;
      continue;
    end if;
    -- Same title for the same element: keep the existing wording and tell the
    -- phone which one to use instead.
    select id into v_existing from public.defect_templates
    where element_key = v_item->>'elementKey' and lower(title) = lower(v_title) and active
    limit 1;
    if found then
      v_duplicate := v_duplicate || jsonb_build_object(v_id::text, v_existing);
      continue;
    end if;
    insert into public.defect_templates (
      id, element_key, severity, title, observation, recommendation, created_by_staff_id
    ) values (
      v_id, v_item->>'elementKey', v_item->>'severity', v_title,
      btrim(v_item->>'observation'), nullif(btrim(coalesce(v_item->>'recommendation', '')), ''),
      v_staff.id
    );
    v_saved := v_saved || v_id;
  end loop;

  return jsonb_build_object('saved', to_jsonb(v_saved), 'duplicates', v_duplicate);
end;
$$;

revoke all on function public.app_save_defect_templates(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.app_save_defect_templates(uuid, jsonb) to service_role;
