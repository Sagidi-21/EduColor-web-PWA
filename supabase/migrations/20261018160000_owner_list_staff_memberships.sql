-- Reaplicar listado de docentes sin INNER JOIN a profiles.
-- Si 181410 no se aplicó en el proyecto remoto, el chip «aceptadas» omitía
-- profesores con membresía (y Auth) pero sin fila en public.profiles.

create or replace function public.owner_list_staff(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_pending jsonb;
  v_accepted jsonb;
begin
  if auth.uid() is null or not public.is_school_owner(p_school_id) then
    raise exception 'not owner';
  end if;

  update public.school_invites
  set status = 'expired'
  where school_id = p_school_id
    and status = 'pending'
    and expires_at <= now();

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.sent_at desc), '[]'::jsonb)
    into v_pending
  from (
    select id, email, first_name, last_name_1, last_name_2,
           created_at as sent_at, expires_at, status
    from public.school_invites
    where school_id = p_school_id and status = 'pending'
  ) x;

  select coalesce(jsonb_agg(row_to_json(y)::jsonb order by y.accepted_at desc nulls last), '[]'::jsonb)
    into v_accepted
  from (
    select m.id as membership_id,
           m.user_id,
           coalesce(m.is_active, true) as is_active,
           coalesce(nullif(trim(m.first_name), ''), i.first_name) as first_name,
           coalesce(nullif(trim(m.last_name_1), ''), i.last_name_1) as last_name_1,
           coalesce(nullif(trim(m.last_name_2), ''), i.last_name_2, '') as last_name_2,
           coalesce(
             nullif(trim(p.email), ''),
             nullif(trim(i.email), ''),
             nullif(trim(au.email), '')
           ) as email,
           coalesce(i.accepted_at, m.created_at) as accepted_at,
           i.created_at as sent_at
    from public.school_memberships m
    left join public.profiles p on p.id = m.user_id
    left join auth.users au on au.id = m.user_id
    left join lateral (
      select inv.email, inv.first_name, inv.last_name_1, inv.last_name_2,
             inv.accepted_at, inv.created_at
      from public.school_invites inv
      where inv.school_id = m.school_id
        and inv.accepted_user_id = m.user_id
        and inv.status = 'accepted'
      order by inv.accepted_at desc nulls last
      limit 1
    ) i on true
    where m.school_id = p_school_id
      and m.role = 'teacher'
  ) y;

  return jsonb_build_object('pending', v_pending, 'accepted', v_accepted);
end;
$$;

grant execute on function public.owner_list_staff(uuid) to authenticated;

-- Perfiles huérfanos: crear fila si el trigger no corrió (admin.createUser).
insert into public.profiles (id, email, display_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- complete_teacher_invite: upsert de perfil (UPDATE 0 filas no basta).
create or replace function public.complete_teacher_invite(p_token text, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_hash text;
  v_row public.school_invites%rowtype;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_row
  from public.school_invites
  where token_hash = v_hash
  for update;

  if not found then
    raise exception 'invalid token';
  end if;

  if v_row.status = 'accepted' and v_row.accepted_user_id = v_uid then
    return jsonb_build_object('ok', true, 'school_id', v_row.school_id, 'already', true);
  end if;

  if v_row.status <> 'pending' or v_row.expires_at <= now() then
    if v_row.status = 'pending' then
      update public.school_invites set status = 'expired' where id = v_row.id;
    end if;
    raise exception 'invite expired';
  end if;

  select lower(trim(coalesce(email, ''))) into v_email
  from public.profiles
  where id = v_uid;

  if v_email is null or v_email = '' then
    select lower(trim(coalesce(email, ''))) into v_email
    from auth.users
    where id = v_uid;
  end if;

  if v_email is distinct from lower(trim(v_row.email)) then
    raise exception 'email mismatch';
  end if;

  insert into public.school_memberships (
    school_id, user_id, role, is_active, first_name, last_name_1, last_name_2
  ) values (
    v_row.school_id, v_uid, 'teacher', true,
    v_row.first_name, v_row.last_name_1, v_row.last_name_2
  )
  on conflict (school_id, user_id) do update
    set role = 'teacher',
        is_active = true,
        first_name = excluded.first_name,
        last_name_1 = excluded.last_name_1,
        last_name_2 = excluded.last_name_2;

  insert into public.profiles (id, email, display_name)
  values (
    v_uid,
    v_row.email,
    trim(both from concat_ws(' ', v_row.first_name, v_row.last_name_1, nullif(v_row.last_name_2, '')))
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now();

  update public.school_invites
    set status = 'accepted',
        accepted_at = now(),
        accepted_user_id = v_uid
    where id = v_row.id;

  return jsonb_build_object('ok', true, 'school_id', v_row.school_id);
end;
$$;

revoke all on function public.complete_teacher_invite(text, uuid) from public;
grant execute on function public.complete_teacher_invite(text, uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
