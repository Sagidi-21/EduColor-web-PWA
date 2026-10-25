-- D-039: al eliminar/rechazar un colegio se borran también las cuentas Auth
-- de sus miembros (salvo platform admins), para poder re-registrarse con el mismo email.

create or replace function public.admin_delete_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_ids uuid[];
  v_emails text[];
begin
  if not public.is_platform_admin() then
    raise exception 'Not platform admin';
  end if;

  if not exists (select 1 from public.schools s where s.id = p_school_id) then
    raise exception 'School not found';
  end if;

  -- Miembros del colegio que NO son platform admin (el admin central no se borra).
  select coalesce(array_agg(m.user_id), '{}'::uuid[])
  into v_user_ids
  from public.school_memberships m
  join auth.users u on u.id = m.user_id
  where m.school_id = p_school_id
    and not exists (
      select 1
      from public.platform_admins a
      where a.email_norm = lower(trim(coalesce(u.email, '')))
    );

  select coalesce(
    array_agg(distinct lower(trim(u.email))) filter (
      where u.email is not null and trim(u.email) <> ''
    ),
    '{}'::text[]
  )
  into v_emails
  from auth.users u
  where u.id = any (v_user_ids);

  -- Primero el colegio (cascade memberships / invites / branding refs).
  delete from public.schools where id = p_school_id;

  if cardinality(v_emails) > 0 then
    delete from public.auth_login_guards g
    where g.email_norm = any (v_emails);
  end if;

  if cardinality(v_user_ids) > 0 then
    delete from auth.users u where u.id = any (v_user_ids);
  end if;
end;
$$;

comment on function public.admin_delete_school(uuid) is
  'Platform admin: borra colegio y cuentas Auth de sus miembros (no platform admins), liberando emails para re-alta.';

revoke all on function public.admin_delete_school(uuid) from public;
grant execute on function public.admin_delete_school(uuid) to authenticated;
