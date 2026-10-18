-- La Edge Function accept-teacher-invite llama peek_teacher_invite con service_role.
-- Tras REVOKE ALL FROM PUBLIC solo quedaba GRANT a anon/authenticated → permission denied.

grant execute on function public.peek_teacher_invite(text) to service_role;

notify pgrst, 'reload schema';
