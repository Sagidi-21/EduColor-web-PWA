-- Permitir que cada usuario lea sus propias membresías (antes solo vía is_school_member).
create policy memberships_select_own
  on public.school_memberships for select
  using (user_id = auth.uid());
