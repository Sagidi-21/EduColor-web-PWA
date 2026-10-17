-- EduColor — colegios y profesorado (D-028)
-- Sin datos de alumnos. Ejecutar una vez en SQL Editor de Supabase.
-- Este fichero permanece en el repo como historial del esquema.

-- ---------------------------------------------------------------------------
-- Perfil ligado a auth.users (todo el que inicia sesión: dueño o profesor)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuario Auth (dueño de colegio o profesor). Sin datos de menores.';

-- ---------------------------------------------------------------------------
-- Colegios inscritos en EduColor
-- ---------------------------------------------------------------------------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_name_len check (char_length(trim(name)) between 2 and 120)
);

comment on table public.schools is 'Centros inscritos. No contiene alumnos ni progreso.';

create index schools_slug_idx on public.schools (slug);

-- ---------------------------------------------------------------------------
-- Membresía: dueño del colegio (owner) o profesor (teacher)
-- ---------------------------------------------------------------------------
create type public.school_role as enum ('owner', 'teacher');

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.school_role not null,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

comment on table public.school_memberships is 'Quién pertenece a qué colegio y con qué rol.';

create index school_memberships_user_idx on public.school_memberships (user_id);
create index school_memberships_school_idx on public.school_memberships (school_id);

-- ---------------------------------------------------------------------------
-- Al registrarse un usuario Auth, crear fila en profiles
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_school_owner(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;

-- profiles: cada uno ve/edita el suyo; miembros del mismo colegio pueden ver nombre/email
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_select_same_school
  on public.profiles for select
  using (
    exists (
      select 1
      from public.school_memberships me
      join public.school_memberships other
        on other.school_id = me.school_id
      where me.user_id = auth.uid()
        and other.user_id = profiles.id
    )
  );

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- schools: ver solo colegios a los que perteneces
create policy schools_select_member
  on public.schools for select
  using (public.is_school_member(id));

-- Crear colegio: cualquier usuario autenticado (luego se le añade como owner en la app)
create policy schools_insert_authenticated
  on public.schools for insert
  to authenticated
  with check (true);

create policy schools_update_owner
  on public.schools for update
  using (public.is_school_owner(id))
  with check (public.is_school_owner(id));

create policy schools_delete_owner
  on public.schools for delete
  using (public.is_school_owner(id));

-- memberships
create policy memberships_select_same_school
  on public.school_memberships for select
  using (public.is_school_member(school_id));

-- El dueño da de alta profesores; también puedes insertarte como owner al crear el colegio
create policy memberships_insert_owner_or_self_owner
  on public.school_memberships for insert
  to authenticated
  with check (
    public.is_school_owner(school_id)
    or (user_id = auth.uid() and role = 'owner')
  );

create policy memberships_update_owner
  on public.school_memberships for update
  using (public.is_school_owner(school_id))
  with check (public.is_school_owner(school_id));

create policy memberships_delete_owner
  on public.school_memberships for delete
  using (public.is_school_owner(school_id));

-- ---------------------------------------------------------------------------
-- Grants (API de datos; RLS sigue filtrando filas)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.schools to authenticated;
grant select, insert, update, delete on public.school_memberships to authenticated;
