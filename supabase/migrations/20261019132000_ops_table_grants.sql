-- Tablas de seguridad: cerradas a anon/authenticated (correcto).
-- El Table Editor de Supabase a veces consulta como rol de consola sin GRANT → "permission denied".
-- Damos SELECT a roles de operaciones; la API de la app sigue sin poder leerlas.

grant select on table public.password_recovery_consumptions to postgres, service_role;
grant select on table public.auth_login_guards to postgres, service_role;
grant select on table public.auth_security_events to postgres, service_role;
grant select on table public.platform_admins to postgres, service_role;

-- Por si el dashboard usa este rol (proyectos nuevos).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    execute 'grant select on table public.password_recovery_consumptions to supabase_admin';
    execute 'grant select on table public.auth_login_guards to supabase_admin';
    execute 'grant select on table public.auth_security_events to supabase_admin';
    execute 'grant select on table public.platform_admins to supabase_admin';
  end if;
end $$;
