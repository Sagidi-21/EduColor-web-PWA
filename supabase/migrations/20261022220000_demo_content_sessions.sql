-- D0: sesiones demo + allowlist de actividades (contenido vía Edge).
-- RLS cerrado: anon/authenticated sin policies ni grants de tabla.
-- NO aplicar en remoto desde este trabajo local; solo artefacto de repo.

create table if not exists public.demo_allowed_activities (
  activity_id text primary key
);

comment on table public.demo_allowed_activities is
  'IDs permitidos en sesión demo. Fuente de verdad en servidor (P2).';

insert into public.demo_allowed_activities (activity_id) values
  ('counting'),
  ('comparison'),
  ('ordenar'),
  ('seriesNumericas'),
  ('relacionar'),
  ('amigos10'),
  ('leftRight'),
  ('multiplicacion')
on conflict (activity_id) do nothing;

create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  ip_hash text
);

create index if not exists demo_sessions_expires_at_idx
  on public.demo_sessions (expires_at);

comment on table public.demo_sessions is
  'Sesiones demo opacas (token hasheado). Solo service_role / Edge.';

alter table public.demo_allowed_activities enable row level security;
alter table public.demo_sessions enable row level security;

revoke all on table public.demo_allowed_activities from public, anon, authenticated;
revoke all on table public.demo_sessions from public, anon, authenticated;

grant select, insert, update, delete on table public.demo_allowed_activities to service_role;
grant select, insert, update, delete on table public.demo_sessions to service_role;
