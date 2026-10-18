-- Docente desactivado deja de pasar is_school_member → RLS le corta el acceso al momento.
-- Owner siempre cuenta aunque is_active fuese null en filas antiguas.

create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and (m.role = 'owner' or coalesce(m.is_active, true) = true)
  );
$$;

notify pgrst, 'reload schema';
