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
- Pantalla de roturas → chip Sin Fallos = aviso; más adelante **Sentry** + Netlify

## Cómo crear el admin (una vez)

1. Crea un usuario en Supabase → Authentication → Users (o regístrate en la app).
2. En SQL Editor (no uses `INSERT` directo: la tabla está cerrada a propósito):

```sql
select public.add_platform_admin('tu-email-admin@ejemplo.com');
```

3. Login con ese email → debes ver **Administrador**.

## Migración / Edge

- `supabase/migrations/20261019130000_platform_admin.sql`
- Redesplegar Edge `school-login` (admins sin membresía de colegio).

Las altas nuevas de «Registrar Colegio» quedan `pending` hasta que las aceptes.

## Table Editor: “permission denied”

Tablas como `password_recovery_consumptions`, `auth_login_guards`, `auth_security_events` y
`platform_admins` **no se abren en Table Editor** a propósito (la app tampoco puede
leerlas por API). No es que estén rotas.

Para ver datos, usa **SQL Editor**:

```sql
select * from public.auth_security_events order by created_at desc limit 50;
select * from public.platform_admins;
```
