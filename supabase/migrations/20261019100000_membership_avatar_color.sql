-- Color de avatar por membresía (único dentro del colegio). Owner = Azul Marino fijo.

alter table public.school_memberships
  add column if not exists avatar_color text;

alter table public.school_memberships
  drop constraint if exists school_memberships_avatar_color_hex;

alter table public.school_memberships
  add constraint school_memberships_avatar_color_hex
  check (
    avatar_color is null
    or avatar_color ~ '^#[0-9A-Fa-f]{6}$'
  );

create unique index if not exists school_memberships_school_avatar_color_uidx
  on public.school_memberships (school_id, lower(avatar_color))
  where avatar_color is not null;

comment on column public.school_memberships.avatar_color is
  'HEX #RRGGBB del avatar. Único por colegio; owner usa #001F3F.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.normalize_avatar_hex(p_color text)
returns text
language plpgsql
immutable
as $$
declare
  v text := upper(trim(coalesce(p_color, '')));
begin
  if v = '' then
    return null;
  end if;
  if left(v, 1) <> '#' then
    v := '#' || v;
  end if;
  if v !~ '^#[0-9A-F]{6}$' then
    return null;
  end if;
  return v;
end;
$$;

-- Conversión HSL → HEX (sin extensión).
create or replace function public.hsl_to_hex(p_h int, p_s int, p_l int)
returns text
language plpgsql
immutable
as $$
declare
  h numeric := mod(p_h::numeric, 360);
  s numeric := greatest(0, least(100, p_s)) / 100.0;
  l numeric := greatest(0, least(100, p_l)) / 100.0;
  c numeric;
  x numeric;
  m numeric;
  r numeric;
  g numeric;
  b numeric;
  hp numeric;
  ri int;
  gi int;
  bi int;
begin
  if h < 0 then h := h + 360; end if;
  c := (1 - abs(2 * l - 1)) * s;
  hp := h / 60.0;
  x := c * (1 - abs(mod(hp, 2) - 1));
  m := l - c / 2;
  if hp < 1 then r := c; g := x; b := 0;
  elsif hp < 2 then r := x; g := c; b := 0;
  elsif hp < 3 then r := 0; g := c; b := x;
  elsif hp < 4 then r := 0; g := x; b := c;
  elsif hp < 5 then r := x; g := 0; b := c;
  else r := c; g := 0; b := x;
  end if;
  ri := round((r + m) * 255)::int;
  gi := round((g + m) * 255)::int;
  bi := round((b + m) * 255)::int;
  return '#' || lpad(to_hex(ri), 2, '0') || lpad(to_hex(gi), 2, '0') || lpad(to_hex(bi), 2, '0');
end;
$$;

create or replace function public.allocate_school_avatar_color(p_school_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  -- Paleta amplia; se omiten tonos ya usados en el colegio.
  v_palette text[] := array[
    '#DC2626','#EA580C','#D97706','#CA8A04','#65A30D','#16A34A',
    '#059669','#0D9488','#0891B2','#0284C7','#2563EB','#4F46E5',
    '#7C3AED','#9333EA','#C026D3','#DB2777','#E11D48','#B45309',
    '#15803D','#0F766E','#1D4ED8','#6D28D9','#A21CAF','#BE123C',
    '#F97316','#84CC16','#14B8A6','#3B82F6','#8B5CF6','#EC4899',
    '#78716C','#57534E','#334155','#0F172A','#115E59','#1E3A8A'
  ];
  v_color text;
  v_used text[];
  v_h int;
  v_s int;
  v_l int;
  v_attempt int := 0;
begin
  select coalesce(array_agg(lower(avatar_color)), array[]::text[])
    into v_used
  from public.school_memberships
  where school_id = p_school_id
    and avatar_color is not null;

  foreach v_color in array v_palette loop
    if not (lower(v_color) = any (v_used)) then
      return upper(v_color);
    end if;
  end loop;

  -- Fallback: HSL pseudoaleatorio hasta encontrar hueco.
  while v_attempt < 200 loop
    v_attempt := v_attempt + 1;
    v_h := (v_attempt * 47 + 13) % 360;
    v_s := 55 + (v_attempt % 35);
    v_l := 35 + (v_attempt % 25);
    v_color := public.hsl_to_hex(v_h, v_s, v_l);
    if v_color is not null and not (lower(v_color) = any (v_used)) then
      return upper(v_color);
    end if;
  end loop;

  raise exception 'avatar color exhausted';
end;
$$;

-- ---------------------------------------------------------------------------
-- create_school_as_owner: owner con Azul Marino
-- ---------------------------------------------------------------------------
create or replace function public.create_school_as_owner(p_name text)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(p_name);
  v_slug text;
  v_school public.schools;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'invalid school name';
  end if;

  if exists (
    select 1 from public.school_memberships m where m.user_id = v_user
  ) then
    raise exception 'already belongs to a school';
  end if;

  if exists (
    select 1 from public.schools s where lower(trim(s.name)) = lower(v_name)
  ) then
    raise exception 'schools_name_unique';
  end if;

  v_slug := lower(regexp_replace(
    regexp_replace(
      translate(
        v_name,
        'áàäâãéèëêíìïîóòöôõúùüûñÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑ',
        'aaaaaeeeeiiiiooooouuuunAAAAAEEEEIIIIOOOOOUUUUN'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '(^-|-$)',
    '',
    'g'
  ));
  if v_slug = '' or v_slug is null then
    v_slug := 'colegio';
  end if;
  v_slug := left(v_slug, 40) || '-' || substr(replace(v_user::text, '-', ''), 1, 8);

  insert into public.schools (name, slug)
  values (v_name, v_slug)
  returning * into v_school;

  insert into public.school_memberships (school_id, user_id, role, avatar_color)
  values (v_school.id, v_user, 'owner', '#001F3F');

  return v_school;
end;
$$;

revoke all on function public.create_school_as_owner(text) from public;
grant execute on function public.create_school_as_owner(text) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_teacher_invite: color aleatorio único
-- ---------------------------------------------------------------------------
create or replace function public.complete_teacher_invite(p_token text, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_hash text;
  v_row public.school_invites%rowtype;
  v_email text;
  v_color text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_row
  from public.school_invites
  where token_hash = v_hash
  for update;

  if not found then
    raise exception 'invalid token';
  end if;

  if v_row.status = 'accepted' and v_row.accepted_user_id = v_uid then
    return jsonb_build_object('ok', true, 'school_id', v_row.school_id, 'already', true);
  end if;

  if v_row.status <> 'pending' or v_row.expires_at <= now() then
    if v_row.status = 'pending' then
      update public.school_invites set status = 'expired' where id = v_row.id;
    end if;
    raise exception 'invite expired';
  end if;

  select lower(trim(coalesce(email, ''))) into v_email
  from public.profiles
  where id = v_uid;

  if v_email is null or v_email = '' then
    select lower(trim(coalesce(email, ''))) into v_email
    from auth.users
    where id = v_uid;
  end if;

  if v_email is distinct from lower(trim(v_row.email)) then
    raise exception 'email mismatch';
  end if;

  v_color := public.allocate_school_avatar_color(v_row.school_id);

  insert into public.school_memberships (
    school_id, user_id, role, is_active, first_name, last_name_1, last_name_2, avatar_color
  ) values (
    v_row.school_id, v_uid, 'teacher', true,
    v_row.first_name, v_row.last_name_1, v_row.last_name_2, v_color
  )
  on conflict (school_id, user_id) do update
    set role = 'teacher',
        is_active = true,
        first_name = excluded.first_name,
        last_name_1 = excluded.last_name_1,
        last_name_2 = excluded.last_name_2,
        avatar_color = coalesce(public.school_memberships.avatar_color, excluded.avatar_color);

  insert into public.profiles (id, email, display_name)
  values (
    v_uid,
    v_row.email,
    trim(both from concat_ws(' ', v_row.first_name, v_row.last_name_1, nullif(v_row.last_name_2, '')))
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now();

  update public.school_invites
    set status = 'accepted',
        accepted_at = now(),
        accepted_user_id = v_uid
    where id = v_row.id;

  return jsonb_build_object('ok', true, 'school_id', v_row.school_id);
end;
$$;

revoke all on function public.complete_teacher_invite(text, uuid) from public;
grant execute on function public.complete_teacher_invite(text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- owner_list_staff: incluir avatar_color
-- ---------------------------------------------------------------------------
create or replace function public.owner_list_staff(p_school_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_pending jsonb;
  v_accepted jsonb;
begin
  if auth.uid() is null or not public.is_school_owner(p_school_id) then
    raise exception 'not owner';
  end if;

  update public.school_invites
  set status = 'expired'
  where school_id = p_school_id
    and status = 'pending'
    and expires_at <= now();

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.sent_at desc), '[]'::jsonb)
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
    select m.id as membership_id,
           m.user_id,
           coalesce(m.is_active, true) as is_active,
           coalesce(nullif(trim(m.first_name), ''), i.first_name) as first_name,
           coalesce(nullif(trim(m.last_name_1), ''), i.last_name_1) as last_name_1,
           coalesce(nullif(trim(m.last_name_2), ''), i.last_name_2, '') as last_name_2,
           coalesce(
             nullif(trim(p.email), ''),
             nullif(trim(i.email), ''),
             nullif(trim(au.email), '')
           ) as email,
           coalesce(i.accepted_at, m.created_at) as accepted_at,
           i.created_at as sent_at,
           m.avatar_color
    from public.school_memberships m
    left join public.profiles p on p.id = m.user_id
    left join auth.users au on au.id = m.user_id
    left join lateral (
      select inv.email, inv.first_name, inv.last_name_1, inv.last_name_2,
             inv.accepted_at, inv.created_at
      from public.school_invites inv
      where inv.school_id = m.school_id
        and inv.accepted_user_id = m.user_id
        and inv.status = 'accepted'
      order by inv.accepted_at desc nulls last
      limit 1
    ) i on true
    where m.school_id = p_school_id
      and m.role = 'teacher'
  ) y;

  return jsonb_build_object('pending', v_pending, 'accepted', v_accepted);
end;
$$;

grant execute on function public.owner_list_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Edición de color (solo owner, solo teachers)
-- ---------------------------------------------------------------------------
create or replace function public.owner_update_teacher_avatar_color(
  p_membership_id uuid,
  p_color text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
  v_role public.school_role;
  v_hex text := public.normalize_avatar_hex(p_color);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if v_hex is null then
    raise exception 'invalid avatar color';
  end if;

  select school_id, role into v_school, v_role
  from public.school_memberships
  where id = p_membership_id;

  if not found then
    raise exception 'membership not found';
  end if;

  if not public.is_school_owner(v_school) then
    raise exception 'not owner';
  end if;

  if v_role is distinct from 'teacher' then
    raise exception 'owner avatar locked';
  end if;

  if exists (
    select 1
    from public.school_memberships m
    where m.school_id = v_school
      and m.id <> p_membership_id
      and lower(m.avatar_color) = lower(v_hex)
  ) then
    raise exception 'avatar color taken';
  end if;

  update public.school_memberships
  set avatar_color = v_hex
  where id = p_membership_id;
end;
$$;

revoke all on function public.owner_update_teacher_avatar_color(uuid, text) from public;
grant execute on function public.owner_update_teacher_avatar_color(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------
update public.school_memberships
set avatar_color = '#001F3F'
where role = 'owner'
  and avatar_color is null;

do $$
declare
  r record;
  v_color text;
begin
  for r in
    select id, school_id
    from public.school_memberships
    where role = 'teacher'
      and avatar_color is null
    order by created_at, id
  loop
    v_color := public.allocate_school_avatar_color(r.school_id);
    update public.school_memberships
    set avatar_color = v_color
    where id = r.id;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
