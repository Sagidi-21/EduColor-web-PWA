-- Unicidad de nombre de colegio (sin distinguir mayúsculas) y helpers de registro.
-- Email único: lo garantiza auth.users; el helper consulta profiles para feedback temprano.

-- Normalizar y bloquear nombres duplicados
create unique index if not exists schools_name_unique_ci
  on public.schools (lower(trim(name)));

create or replace function public.is_school_name_taken(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schools
    where lower(trim(name)) = lower(trim(p_name))
  );
$$;

comment on function public.is_school_name_taken is
  'Comprueba si ya existe un colegio con ese nombre (case-insensitive). Usable en registro.';

create or replace function public.is_registration_email_taken(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where email is not null
      and lower(trim(email)) = lower(trim(p_email))
  );
$$;

comment on function public.is_registration_email_taken is
  'Comprueba si el email ya tiene perfil (cuenta). Usable en registro.';

grant execute on function public.is_school_name_taken(text) to anon, authenticated;
grant execute on function public.is_registration_email_taken(text) to anon, authenticated;
