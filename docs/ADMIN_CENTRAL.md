# Central de administración (platform admin)

Misma app y mismo login. Si tu email está en `platform_admins`, tras entrar ves la **Central**.

## Alcance (recorte consciente)

**Sí (producto EduColor):**

- Listar colegios activos / desactivados
- Chip **Pendientes** → aceptar / rechazar solicitudes
- Entrar en un colegio **como OW**
- Desactivar / eliminar con doble confirmación

**No (usan herramientas gratis, no pantallas propias):**

- Consola de ciberataques → chip Seguridad OK/KO = resumen 24 h + ir a **Supabase**
- Correo ops en cada **lockout** → Resend ([OPS_ALERTS_RESEND.md](./OPS_ALERTS_RESEND.md)); no Sentry
- Pantalla de roturas → chip Sin Fallos; errores de app → **Sentry** ([SENTRY_SETUP.md](./SENTRY_SETUP.md)) + Netlify
- Mapa de flujos (login, correos, Sentry): [AUTH_ALERTAS_Y_CORREOS.md](./AUTH_ALERTAS_Y_CORREOS.md)

## Cómo crear el admin (una vez)

1. Crea un usuario en Supabase → Authentication → Users (o regístrate en la app).
2. En SQL Editor (no uses `INSERT` directo: la tabla está cerrada a propósito):

```sql
select public.add_platform_admin('tu-email-admin@ejemplo.com');
```

3. Login con ese email → debes ver **Administrador**.

## Migración / Edge

- `supabase/migrations/20261019130000_platform_admin.sql`
- `supabase/migrations/20261019140000_school_branding.sql` (columnas `background_url` / `logo_ficha_url` + bucket Storage `school-branding`)
- Redesplegar Edge `school-login` (admins sin membresía de colegio).

Las altas nuevas de «Registrar Colegio» quedan `pending` hasta que las aceptes.

## SQL Editor: `must be owner of table …`

Aunque `pg_tables.tableowner` diga `postgres`, el Editor a menudo ejecuta con
**`current_user = authenticated`** (`session_user` sigue siendo `postgres`).
En ese modo **no puedes** `ALTER TABLE` / DDL sobre tablas tuyas →
`ERROR: 42501: must be owner of table …`.

**Arreglo:** en el **mismo Run** (cada Run vuelve a `authenticated`):

```sql
reset role;
-- … aquí el ALTER / migración completa …
select current_user;  -- debe ser postgres
```

Comprobar rol antes de DDL:

```sql
select current_user, session_user;
```

Si hay selector de rol / «Run as» en el Editor, déjalo en **postgres**.

## Table Editor: “permission denied”

Tablas como `password_recovery_consumptions`, `auth_login_guards`, `auth_security_events` y
`platform_admins` **no se abren en Table Editor** a propósito (la app tampoco puede
leerlas por API). No es que estén rotas.

Para ver datos, usa **SQL Editor**:

```sql
select * from public.auth_security_events order by created_at desc limit 50;
select * from public.platform_admins;
```
