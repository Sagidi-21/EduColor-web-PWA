-- Platform admin (Central EduColor): allowlist por email + estado de colegio.
-- Entrar como OW: is_school_owner también es true si is_platform_admin().

create table if not exists public.platform_admins (
  email_norm text primary key,
  created_at timestamptz not null default now(),
  constraint platform_admins_email_len check (char_length(email_norm) between 5 and 254)
);

comment on table public.platform_admins is
  'Emails (minúsculas) con acceso a la Central de administración. Insertar a mano en SQL.';

alter table public.platform_admins enable row level security;
revoke all on table public.platform_admins from public, anon, authenticated;
grant select on table public.platform_admins to authenticated;

-- Solo el propio admin puede leer su fila (para el flag en cliente).
create policy platform_admins_select_self on public.platform_admins
  for select to authenticated
  using (email_norm = lower(trim(coalesce(auth.jwt() ->> 'email', ''))));

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.email_norm = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to anon, authenticated;

-- Estado del colegio: pending (solicitud) | active | disabled
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'schools' and column_name = 'status'
  ) then
    alter table public.schools
      add column status text not null default 'active'
        check (status in ('pending', 'active', 'disabled'));
  end if;
end $$;

comment on column public.schools.status is
  'pending = espera aprobación admin; active = operativo; disabled = pausado por admin.';

update public.schools set status = 'active' where status is null or status = '';

-- Altas nuevas quedan pendientes de aprobación (resto igual que avatar migration).
create or replace function public.create_school_as_owner(p_name text)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(p_name);
  v_slug text;
  v_school public.schools;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid school name';
  end if;

  if exists (
    select 1 from public.school_memberships m where m.user_id = v_user
  ) then
    raise exception 'already belongs to a school';
  end if;

  if exists (
    select 1 from public.schools s where lower(trim(s.name)) = lower(v_name)
  ) then
    raise exception 'schools_name_unique';
  end if;

  v_slug := lower(regexp_replace(
    regexp_replace(
      translate(
        v_name,
        'áàäâãéèëêíìïîóòöôõúùüûñÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑ',
        'aaaaaeeeeiiiiooooouuuunAAAAAEEEEIIIIOOOOOUUUUN'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '(^-|-$)',
    '',
    'g'
  ));
  if v_slug = '' or v_slug is null then
    v_slug := 'colegio';
  end if;
  v_slug := left(v_slug, 40) || '-' || substr(replace(v_user::text, '-', ''), 1, 8);

  insert into public.schools (name, slug, status)
  values (v_name, v_slug, 'pending')
  returning * into v_school;

  insert into public.school_memberships (school_id, user_id, role, avatar_color)
  values (v_school.id, v_user, 'owner', '#001F3F');

  return v_school;
end;
$$;

-- Owner real O platform admin (entrar a un colegio como OW).
create or replace function public.is_school_owner(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.school_memberships m
      where m.school_id = p_school_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    );
$$;

-- Acceso app: admin plataforma siempre; resto con membresía activa (y colegio no disabled).
create or replace function public.session_has_app_access(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;
  if exists (
    select 1 from public.platform_admins a
    where a.email_norm = lower(trim(coalesce(
      (select u.email from auth.users u where u.id = p_user_id),
      ''
    )))
  ) then
    return true;
  end if;
  return exists (
    select 1
    from public.school_memberships m
    join public.schools s on s.id = m.school_id
    where m.user_id = p_user_id
      and s.status <> 'disabled'
      and (m.role = 'owner' or coalesce(m.is_active, true) = true)
  );
end;
$$;

revoke all on function public.session_has_app_access(uuid) from public;
grant execute on function public.session_has_app_access(uuid) to authenticated;

create or replace function public.admin_list_schools()
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  created_at timestamptz,
  owner_email text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not platform admin';
  end if;
  return query
  select
    s.id,
    s.name,
    s.slug,
    s.status,
    s.created_at,
    p.email
  from public.schools s
  left join public.school_memberships m
    on m.school_id = s.id and m.role = 'owner'
  left join public.profiles p on p.id = m.user_id
  order by
    case s.status when 'pending' then 0 when 'active' then 1 else 2 end,
    s.created_at desc;
end;
$$;

revoke all on function public.admin_list_schools() from public;
grant execute on function public.admin_list_schools() to authenticated;

create or replace function public.admin_set_school_status(p_school_id uuid, p_status text)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school public.schools;
  v_status text := lower(trim(p_status));
begin
  if not public.is_platform_admin() then
    raise exception 'Not platform admin';
  end if;
  if v_status not in ('pending', 'active', 'disabled') then
    raise exception 'Invalid status';
  end if;
  update public.schools
  set status = v_status, updated_at = now()
  where id = p_school_id
  returning * into v_school;
  if v_school.id is null then
    raise exception 'School not found';
  end if;
  return v_school;
end;
$$;

revoke all on function public.admin_set_school_status(uuid, text) from public;
grant execute on function public.admin_set_school_status(uuid, text) to authenticated;

create or replace function public.admin_delete_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not platform admin';
  end if;
  delete from public.schools where id = p_school_id;
end;
$$;

revoke all on function public.admin_delete_school(uuid) from public;
grant execute on function public.admin_delete_school(uuid) to authenticated;

create or replace function public.admin_list_security_events(p_limit int default 50)
returns table (
  id uuid,
  event_type text,
  context text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not platform admin';
  end if;
  return query
  select e.id, e.event_type, e.context, e.created_at
  from public.auth_security_events e
  order by e.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

revoke all on function public.admin_list_security_events(int) from public;
grant execute on function public.admin_list_security_events(int) to authenticated;

notify pgrst, 'reload schema';
