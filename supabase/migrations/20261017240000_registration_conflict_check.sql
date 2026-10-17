-- Comprobación única email|nombre (boolean) para UX de registro.
-- No dice cuál choca; la app muestra mensaje genérico (anti-enumeración A07).

create or replace function public.registration_inputs_unavailable(
  p_email text,
  p_name text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles
      where email is not null
        and lower(trim(email)) = lower(trim(p_email))
    )
    or exists (
      select 1
      from public.schools
      where lower(trim(name)) = lower(trim(p_name))
    );
$$;

revoke all on function public.registration_inputs_unavailable(text, text) from public;
grant execute on function public.registration_inputs_unavailable(text, text) to anon, authenticated;

comment on function public.registration_inputs_unavailable(text, text) is
  'True si el email o el nombre de colegio ya están en uso (sin indicar cuál).';
