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
2. En SQL Editor:

```sql
insert into public.platform_admins (email_norm)
values (lower(trim('tu-email-admin@ejemplo.com')))
on conflict (email_norm) do nothing;
```

3. Login con ese email → debes ver **Administrador**.

## Migración / Edge

- `supabase/migrations/20261019130000_platform_admin.sql`
- Redesplegar Edge `school-login` (admins sin membresía de colegio).

Las altas nuevas de «Registrar Colegio» quedan `pending` hasta que las aceptes.
