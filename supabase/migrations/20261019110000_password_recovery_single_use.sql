-- Enlace de contraseña nueva: huella de un solo uso al completar el cambio
-- (no al abrir: Auth verify ya es one-shot; filtros de correo quemaban el enlace).

create table if not exists public.password_recovery_consumptions (
  fingerprint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint password_recovery_fingerprint_len check (char_length(fingerprint) between 16 and 128)
);

comment on table public.password_recovery_consumptions is
  'Huellas de tokens recovery ya abiertos. Un fingerprint = un enlace de un solo uso.';

alter table public.password_recovery_consumptions enable row level security;

create or replace function public.consume_password_recovery(p_fingerprint text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_fp text := lower(trim(coalesce(p_fingerprint, '')));
  v_owner uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not authenticated');
  end if;

  if char_length(v_fp) < 16 or char_length(v_fp) > 128 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select user_id into v_owner
  from public.password_recovery_consumptions
  where fingerprint = v_fp;

  if found then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;

  insert into public.password_recovery_consumptions (fingerprint, user_id)
  values (v_fp, v_uid);

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
end;
$$;

revoke all on function public.consume_password_recovery(text) from public;
grant execute on function public.consume_password_recovery(text) to authenticated;

notify pgrst, 'reload schema';
