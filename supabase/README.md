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

## Auth — confirmación de email

En **Authentication → Providers (Iniciar sesión / Proveedores) → Email**:

- **Confirm email / Confirmar correo electrónico** → **ON** (obligatorio en prod).
- Tras “Registrar colegio”, la app pide abrir el enlace del correo; el colegio
  se crea al primer acceso con sesión confirmada (`create_school_as_owner`).

### Plantilla del correo (marca EduColor)

Supabase no lee plantillas del repo: hay que pegarlas en el panel.

1. **Authentication → Emails → Confirm signup** (o Email Templates).
2. **Subject / Asunto:**

   ```text
   Confirma tu colegio en EduColor
   ```

3. **Body / Cuerpo:** copia el HTML de
   [`docs/email/confirm-signup.html`](../docs/email/confirm-signup.html)
   (incluye logo, nombre **EduColor** y fondo de Welcome).
4. Guarda.

Las imágenes usan `{{ .SiteURL }}`:

- `{{ .SiteURL }}/brand/educolor-mark.png` — logo (Welcome)
- `{{ .SiteURL }}/brand/welcome-bg.png` — fondo Welcome

En **Authentication → URL Configuration**, **Site URL** debe ser el dominio
real de la app (Netlify o `http://localhost:5173` en local). Tras desplegar,
esas rutas viven en `public/brand/`.

### Caducidad del enlace de confirmación (registro colegio) — 1 hora

En **Authentication → Settings** (o Email), busca **OTP / Mailer OTP expiration**
(o “Email OTP Expiration”) y pon **3600** segundos (1 hora).

- El enlace de confirmación de Supabase es de **un solo uso**.
- Si el usuario pincha un enlace **caducado o ya usado**, la app muestra un
  error en la pantalla de login (no deja sesión abierta). Debe volver a
  registrar el colegio o contactar soporte; no hay “reenviar enlace” self-serve
  en V1 para el alta de centro.

## Checklist producción (OWASP Top 10:2025 — A02)

1. **URL Configuration:** Site URL = dominio Netlify (`https://….netlify.app`).
2. **Redirect URLs:** Netlify `/**` + `http://localhost:5173/**` (solo entornos reales).
3. Solo **Publishable / anon key** en Netlify (nunca la Secret key).
4. Ejecutar migraciones, incluida `20261017230000_owasp_auth_hardening.sql`
   (revoca sondeo email/nombre + tabla `auth_security_events`).
5. Auth → Rate limits revisados; Confirm email ON.
6. Opcional en Auth → Password: longitud mínima ≥ 8 (la app exige
   8–24 + mayúsc/minúsc/número/símbolo).
7. **Mailer OTP expiration = 3600** (1 hora) — se configura en el panel de Supabase.

## Alcance aceptado (producto)

- **DEMO / soft gate** (usar la app sin cuenta) es decisión de producto: la
  pizarra demo no expone datos de otros colegios. No sustituye auth para dueños.
