-- Permitir dar de alta el primer admin (y siguientes) sin abrir INSERT a authenticated.
-- Desde SQL Editor: select public.add_platform_admin('tu@email.com');

grant select, insert, update, delete on table public.platform_admins to postgres;
grant select, insert, update, delete on table public.platform_admins to service_role;

create or replace function public.add_platform_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_is_super boolean := current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin');
begin
  if v_email is null or v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'invalid email';
  end if;

  -- Bootstrap: tabla vacía, o ya eres admin (JWT), o ejecutas como rol de consola Supabase.
  if exists (select 1 from public.platform_admins)
     and not public.is_platform_admin()
     and not v_is_super then
    raise exception 'Not allowed to add platform admin';
  end if;

  insert into public.platform_admins (email_norm)
  values (v_email)
  on conflict (email_norm) do nothing;

  return v_email;
end;
$$;

revoke all on function public.add_platform_admin(text) from public;
grant execute on function public.add_platform_admin(text) to postgres, service_role, authenticated;

comment on function public.add_platform_admin(text) is
  'Alta de platform admin. SQL Editor / service_role / primer bootstrap / admin JWT.';

notify pgrst, 'reload schema';
