-- D-029/D-030: invitaciones de profesorado + membresía activa + nombres.

create extension if not exists pgcrypto;

alter table public.school_memberships
  add column if not exists is_active boolean not null default true,
  add column if not exists first_name text,
  add column if not exists last_name_1 text,
  add column if not exists last_name_2 text;

create type public.school_invite_status as enum (
  'pending',
  'accepted',
  'expired',
  'cancelled'
);

create table if not exists public.school_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name_1 text not null,
  last_name_2 text not null default '',
  token_hash text not null unique,
  status public.school_invite_status not null default 'pending',
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null,
  constraint school_invites_email_len check (char_length(trim(email)) between 5 and 254),
  constraint school_invites_name_len check (char_length(trim(first_name)) between 1 and 80),
  constraint school_invites_ln1_len check (char_length(trim(last_name_1)) between 1 and 80),
  constraint school_invites_ln2_len check (char_length(last_name_2) <= 80)
);

create index if not exists school_invites_school_idx on public.school_invites (school_id);
create index if not exists school_invites_email_ci_idx on public.school_invites (lower(trim(email)));

alter table public.school_invites enable row level security;

-- Solo el owner del colegio ve/gestiona invitaciones (vía RPC security definer en la práctica).
create policy school_invites_select_owner
  on public.school_invites for select
  using (public.is_school_owner(school_id));

revoke all on table public.school_invites from anon, authenticated;
grant select on table public.school_invites to authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.get_my_school_role(p_school_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role::text
  from public.school_memberships m
  where m.school_id = p_school_id
    and m.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_school_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.owner_create_teacher_invite(
  p_school_id uuid,
  p_email text,
  p_first_name text,
  p_last_name_1 text,
  p_last_name_2 text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_fn text := trim(p_first_name);
  v_ln1 text := trim(p_last_name_1);
  v_ln2 text := coalesce(trim(p_last_name_2), '');
  v_token text;
  v_hash text;
  v_id uuid;
  v_expires timestamptz := now() + interval '72 hours';
  v_count int;
  v_oldest timestamptz;
  v_next timestamptz;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_school_owner(p_school_id) then
    raise exception 'not owner';
  end if;

  if char_length(v_fn) < 1 or char_length(v_fn) > 80
     or char_length(v_ln1) < 1 or char_length(v_ln1) > 80
     or char_length(v_ln2) > 80
     or char_length(v_email) < 5 or char_length(v_email) > 254 then
    raise exception 'invalid fields';
  end if;

  if exists (
    select 1 from public.profiles p where p.id = v_user and lower(trim(coalesce(p.email, ''))) = v_email
  ) then
    raise exception 'cannot invite self';
  end if;

  -- Rate limit: 4 / hora por colegio
  select count(*), min(created_at)
    into v_count, v_oldest
  from public.school_invites
  where school_id = p_school_id
    and created_at > now() - interval '1 hour';

  if v_count >= 4 then
    v_next := v_oldest + interval '1 hour';
    raise exception 'invite rate limit:%', to_char(v_next at time zone 'Europe/Madrid', 'HH24:MI');
  end if;

  if exists (
    select 1 from public.profiles p where lower(trim(coalesce(p.email, ''))) = v_email
  ) or exists (
    select 1 from public.school_invites i
    where lower(trim(i.email)) = v_email
      and i.status = 'pending'
      and i.expires_at > now()
  ) then
    raise exception 'email unavailable';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.school_invites (
    school_id, email, first_name, last_name_1, last_name_2,
    token_hash, status, invited_by, expires_at
  ) values (
    p_school_id, v_email, v_fn, v_ln1, v_ln2,
    v_hash, 'pending', v_user, v_expires
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'email', v_email,
    'expires_at', v_expires
  );
end;
$$;

grant execute on function public.owner_create_teacher_invite(uuid, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.owner_list_staff(p_school_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pending jsonb;
  v_accepted jsonb;
begin
  if auth.uid() is null or not public.is_school_owner(p_school_id) then
    raise exception 'not owner';
  end if;

  -- Caducar pendientes vencidas (best-effort)
  update public.school_invites
  set status = 'expired'
  where school_id = p_school_id
    and status = 'pending'
    and expires_at <= now();

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.created_at desc), '[]'::jsonb)
    into v_pending
  from (
    select id, email, first_name, last_name_1, last_name_2,
           created_at as sent_at, expires_at, status
    from public.school_invites
    where school_id = p_school_id and status = 'pending'
  ) x;

  select coalesce(jsonb_agg(row_to_json(y)::jsonb order by y.accepted_at desc nulls last), '[]'::jsonb)
    into v_accepted
  from (
    select m.id as membership_id, m.user_id, m.is_active,
           m.first_name, m.last_name_1, m.last_name_2,
           p.email,
           coalesce(i.accepted_at, m.created_at) as accepted_at,
           i.created_at as sent_at
    from public.school_memberships m
    join public.profiles p on p.id = m.user_id
    left join public.school_invites i
      on i.accepted_user_id = m.user_id and i.school_id = m.school_id and i.status = 'accepted'
    where m.school_id = p_school_id
      and m.role = 'teacher'
  ) y;

  return jsonb_build_object('pending', v_pending, 'accepted', v_accepted);
end;
$$;

grant execute on function public.owner_list_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.owner_cancel_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
begin
  select school_id into v_school from public.school_invites where id = p_invite_id;
  if v_school is null or not public.is_school_owner(v_school) then
    raise exception 'not owner';
  end if;
  update public.school_invites
  set status = 'cancelled'
  where id = p_invite_id and status = 'pending';
end;
$$;

grant execute on function public.owner_cancel_invite(uuid) to authenticated;

create or replace function public.owner_set_teacher_active(p_membership_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
  v_role public.school_role;
begin
  select school_id, role into v_school, v_role
  from public.school_memberships where id = p_membership_id;
  if v_school is null or not public.is_school_owner(v_school) then
    raise exception 'not owner';
  end if;
  if v_role <> 'teacher' then
    raise exception 'not a teacher';
  end if;
  update public.school_memberships set is_active = p_active where id = p_membership_id;
end;
$$;

grant execute on function public.owner_set_teacher_active(uuid, boolean) to authenticated;

create or replace function public.owner_remove_teacher(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
  v_role public.school_role;
  v_user uuid;
begin
  select school_id, role, user_id into v_school, v_role, v_user
  from public.school_memberships where id = p_membership_id;
  if v_school is null or not public.is_school_owner(v_school) then
    raise exception 'not owner';
  end if;
  if v_role <> 'teacher' then
    raise exception 'not a teacher';
  end if;
  delete from public.school_memberships where id = p_membership_id;
end;
$$;

grant execute on function public.owner_remove_teacher(uuid) to authenticated;
