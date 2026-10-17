-- Crear colegio + membresía owner en una sola operación (evita fallo RLS:
-- INSERT … RETURNING en schools exige SELECT, pero aún no hay membership).

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

  insert into public.school_memberships (school_id, user_id, role)
  values (v_school.id, v_user, 'owner');

  return v_school;
end;
$$;

revoke all on function public.create_school_as_owner(text) from public;
grant execute on function public.create_school_as_owner(text) to authenticated;

comment on function public.create_school_as_owner(text) is
  'Alta de colegio + owner en un solo paso (bypass del hueco RLS en RETURNING).';
