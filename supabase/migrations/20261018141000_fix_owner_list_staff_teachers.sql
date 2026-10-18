-- Listado de docentes: no depender de INNER JOIN a profiles (si falta perfil, el chip
-- contaba mal o la fila no salía). Email desde profiles o desde la invitación aceptada.

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
           m.is_active,
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

notify pgrst, 'reload schema';
