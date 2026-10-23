# Edge content — soporte de pruebas

Única fuente del motor/handlers: `supabase/functions/_shared/`.

Los tests de esta carpeta importan ese código para paridad y authz.
No hay espejo bajo `src/`: el cliente solo usa `src/platform/content-api/contentClient.ts`.
