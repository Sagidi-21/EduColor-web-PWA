-- D-037: lockout login (email normalizado + IP) — 3 fallos → 15 minutos.
-- Solo service_role / RPCs security definer; sin SELECT para anon/authenticated.

create table if not exists public.auth_login_guards (
  email_norm text not null,
  ip_hash text not null,
  fail_count integer not null default 0
    check (fail_count >= 0 and fail_count <= 100),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (email_norm, ip_hash)
);

comment on table public.auth_login_guards is
  'D-037: intentos fallidos de Entrar al Colegio por email+IP (hash). Sin PII de IP en claro.';

alter table public.auth_login_guards enable row level security;

revoke all on table public.auth_login_guards from public, anon, authenticated;
grant select, insert, update, delete on table public.auth_login_guards to service_role;

-- Lectura de membresías desde Edge (service_role) para validar acceso tras login.
grant select on table public.school_memberships to service_role;

-- Ampliar tipos de auditoría (A09) para lockout / reset.
create or replace function public.log_auth_security_event(
  p_event_type text,
  p_context text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := lower(trim(p_event_type));
  v_ctx text := nullif(trim(p_context), '');
begin
  if v_type not in (
    'login_fail',
    'signup_fail',
    'school_create_fail',
    'school_create_ok',
    'login_lockout',
    'password_reset_request',
    'password_reset_ok'
  ) then
    return;
  end if;

  if v_ctx is not null then
    v_ctx := left(v_ctx, 240);
  end if;

  insert into public.auth_security_events (event_type, context)
  values (v_type, v_ctx);
end;
$$;

revoke all on function public.log_auth_security_event(text, text) from public;
grant execute on function public.log_auth_security_event(text, text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
