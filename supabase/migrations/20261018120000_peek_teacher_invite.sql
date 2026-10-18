-- D-029: vista previa pública de invitación (token en claro → hash) + cierre de accept
-- tras crear el usuario Auth (Edge Function / service role o sesión del docente).

create or replace function public.peek_teacher_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row public.school_invites%rowtype;
  v_school_name text;
begin
  if p_token is null or char_length(trim(p_token)) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_row
  from public.school_invites
  where token_hash = v_hash
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_row.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'reason', 'cancelled');
  end if;

  if v_row.status = 'accepted' then
    return jsonb_build_object('ok', false, 'reason', 'accepted');
  end if;

  if v_row.status <> 'pending' or v_row.expires_at <= now() then
    update public.school_invites
      set status = 'expired'
      where id = v_row.id and status = 'pending';
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select s.name into v_school_name
  from public.schools s
  where s.id = v_row.school_id;

  return jsonb_build_object(
    'ok', true,
    'invite_id', v_row.id,
    'school_id', v_row.school_id,
    'school_name', coalesce(v_school_name, 'Colegio'),
    'email', v_row.email,
    'first_name', v_row.first_name,
    'last_name_1', v_row.last_name_1,
    'last_name_2', v_row.last_name_2,
    'expires_at', v_row.expires_at
  );
end;
$$;

revoke all on function public.peek_teacher_invite(text) from public;
grant execute on function public.peek_teacher_invite(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Marca invitación aceptada + membresía teacher. Pensada para llamarse con
-- service_role (Edge) o por el propio usuario Auth cuyo email coincide.
create or replace function public.complete_teacher_invite(
  p_token text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row public.school_invites%rowtype;
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_token is null or char_length(trim(p_token)) < 16 then
    raise exception 'invalid token';
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

  update public.profiles
    set display_name = trim(both from concat_ws(' ', v_row.first_name, v_row.last_name_1, nullif(v_row.last_name_2, ''))),
        email = v_row.email,
        updated_at = now()
    where id = v_uid;

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
