# Supabase (EduColor)

Esquema de la base de datos remota según **D-028**:

- Sin datos de alumnos.
- Solo **colegios** y **profesorado** (y el dueño del colegio).
- Auth de usuarios = Supabase Auth.

## Dónde vive el SQL

Los ficheros en `migrations/` **se quedan en el repositorio**. No se borran tras
ejecutarlos: son la fuente de verdad del esquema (igual que el código de la app).

| Acción | Qué hacer |
| ------ | --------- |
| Primera vez | Abrir Supabase → **SQL Editor** → pegar el contenido de la migración → **Run** |
| Cambios futuros | Añadir un fichero nuevo `migrations/YYYYMMDDHHMMSS_descripcion.sql` y ejecutarlo |

## Cómo aplicar la primera migración

1. Abre tu proyecto en [supabase.com](https://supabase.com).
2. Menú **SQL** → **New query**.
3. Abre `migrations/20261017120000_schools_and_teachers.sql`, copia todo y pégalo.
4. Pulsa **Run**. Si sale OK, las tablas y políticas RLS ya están creadas.

## Variables de entorno (después, para la app)

En el mismo `.env` de la raíz del repo (junto a `HF_TOKEN`; no se sube a git):

```
VITE_SUPABASE_URL=https://TU-REFERENCE.supabase.co
VITE_SUPABASE_ANON_KEY=tu_publishable_key
```

- URL = `https://` + Project reference + `.supabase.co`
- Clave = **Publishable key** (no la Secret key)

## Probar la conexión

```bash
node scripts/ping-supabase.mjs
```

Si responde `OK: conectado a Supabase (Auth responde)`, el `.env` es correcto.
No lee la tabla `schools`: anon no tiene SELECT (RLS); eso es intencional.
Cliente en código: `src/platform/supabase/client.ts`.
Pantalla de acceso: `src/features/auth/SchoolAccessScreen.tsx`.

## Auth (desarrollo)

En **Authentication → Providers → Email**, para pruebas locales puedes desactivar
“Confirm email”. Si está activo, tras “Registrar colegio” hay que confirmar el
correo y luego Entrar; el colegio se crea al primer login con sesión.
