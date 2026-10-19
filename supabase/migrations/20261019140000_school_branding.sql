-- Branding en public.schools (columnas + RPC + Storage).
--
-- IMPORTANTE: en SQL Editor, current_user debe ser postgres (NO authenticated).
-- Si select current_user = authenticated, ejecuta antes:
--   reset role;
-- (session_user=postgres + current_user=authenticated → no eres owner al ALTER).

reset role;

alter table public.schools
  add column if not exists background_url text;

alter table public.schools
  add column if not exists logo_ficha_url text;

comment on column public.schools.background_url is
  'URL pública del fondo de selección de curso. Null = asset demo.';
comment on column public.schools.logo_ficha_url is
  'URL pública del logo de fichas. Null = logo EduColor.';

-- Platform admin puede leer cualquier colegio.
create or replace function public.is_school_member(p_school_id uuid)
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
        and (m.role = 'owner' or coalesce(m.is_active, true) = true)
    );
$$;

-- Firma nueva → DROP obligatorio.
drop function if exists public.admin_list_schools();

create function public.admin_list_schools()
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  created_at timestamptz,
  owner_email text,
  background_url text,
  logo_ficha_url text
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
    p.email,
    s.background_url,
    s.logo_ficha_url
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

-- Storage (si falla el INSERT, crea el bucket en Dashboard → Storage → Public).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-branding',
  'school-branding',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists school_branding_select_public on storage.objects;
create policy school_branding_select_public
  on storage.objects for select
  using (bucket_id = 'school-branding');

drop policy if exists school_branding_insert_owner on storage.objects;
create policy school_branding_insert_owner
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'school-branding'
    and public.is_school_owner(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );

drop policy if exists school_branding_update_owner on storage.objects;
create policy school_branding_update_owner
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'school-branding'
    and public.is_school_owner(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    )
  )
  with check (
    bucket_id = 'school-branding'
    and public.is_school_owner(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );

drop policy if exists school_branding_delete_owner on storage.objects;
create policy school_branding_delete_owner
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'school-branding'
    and public.is_school_owner(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );
