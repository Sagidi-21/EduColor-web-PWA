-- pgcrypto (gen_random_bytes, digest) vive en el esquema `extensions` en Supabase:
-- con search_path = public las RPC fallaban con 42883 (la API lo devuelve como 404).
-- owner_list_staff hace UPDATE, así que no puede ser STABLE (daba 400).

alter function public.owner_create_teacher_invite(uuid, text, text, text, text)
  set search_path = public, extensions;

alter function public.peek_teacher_invite(text)
  set search_path = public, extensions;

alter function public.complete_teacher_invite(text, uuid)
  set search_path = public, extensions;

alter function public.owner_list_staff(uuid) volatile;

notify pgrst, 'reload schema';
