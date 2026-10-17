-- OWASP Top 10:2025 — endurecimiento auth (A07 enumeración, A09 auditoría).

-- ---------------------------------------------------------------------------
-- Revocar helpers de sondeo (email/nombre) si existen en este proyecto.
-- (Puede que nunca se aplicara 20261017190000_*; no debe tumbar esta migración.)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_school_name_taken(text)') is not null then
    execute 'revoke execute on function public.is_school_name_taken(text) from anon, authenticated, public';
  end if;
  if to_regprocedure('public.is_registration_email_taken(text)') is not null then
    execute 'revoke execute on function public.is_registration_email_taken(text) from anon, authenticated, public';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Eventos de seguridad (solo append via RPC; sin SELECT para clientes).
-- Sin contraseñas ni tokens.
-- ---------------------------------------------------------------------------
create table if not exists public.auth_security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  context text,
  constraint auth_security_events_type_len check (char_length(event_type) between 3 and 64),
  constraint auth_security_events_context_len check (context is null or char_length(context) <= 240)
);

comment on table public.auth_security_events is
  'Auditoría mínima de auth (A09). Sin PII sensible; solo tipos de evento.';

alter table public.auth_security_events enable row level security;

-- Sin policies de SELECT/UPDATE/DELETE para authenticated/anon → nadie lee vía API.
-- Insert solo a través de la RPC security definer.

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
    'school_create_ok'
  ) then
    return; -- ignorar tipos desconocidos (no filtrar info)
  end if;

  if v_ctx is not null then
    v_ctx := left(v_ctx, 240);
  end if;

  insert into public.auth_security_events (event_type, context)
  values (v_type, v_ctx);
end;
$$;

revoke all on function public.log_auth_security_event(text, text) from public;
grant execute on function public.log_auth_security_event(text, text) to anon, authenticated;

comment on function public.log_auth_security_event(text, text) is
  'Append-only de eventos de auth desde el cliente (sin lectura).';
