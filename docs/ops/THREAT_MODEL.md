# Modelo de amenazas (piloto) — EduColor PWA

Documento corto de Fase 12 (checklist G2). Lenguaje de producto; sin SIEM propio.

**Fecha:** 2026-10-19.

## Qué protegemos

- Cuentas de **profesorado** y **owner** (email + contraseña).
- Datos de **colegios** (nombre, estado pending/active/disabled, branding).
- Membresías e invitaciones de docentes.
- Eventos de seguridad de login (`auth_security_events`, lockouts).
- Archivos de branding en Storage (`school-branding`).

## Qué no hay (alcance piloto)

- **No** se guardan datos de alumnos ni resultados individuales en la nube (D-028).
- El uso de aula (actividades, fichas) sigue siendo local en el dispositivo.

## Dónde vive cada pieza

```text
Navegador (PWA Netlify)
    → Supabase Auth (sesión)
    → Postgres + RLS (colegios, membresías)
    → Edge Functions (login, invites, manage-teacher, recovery)
    → Storage (fondo / logo ficha)
```

Admin Central: mismos login y app; emails en `platform_admins`.

## Riesgos principales y respuesta

| Riesgo                                 | Mitigación actual                                             |
| -------------------------------------- | ------------------------------------------------------------- |
| Fuerza bruta en login                  | Lockout 3 fallos / 15 min por email (D-037); mensaje genérico |
| Enumeración de cuentas                 | Mensajes neutros; recovery sin confirmar si el email existe   |
| Enlace de contraseña reutilizado       | Auth one-shot + huella tras guardar (DT-027)                  |
| Filtros de correo que queman el enlace | Mensaje de caducidad; pedir enlace nuevo                      |
| Acceso a datos de otro colegio         | RLS + roles owner/docente activo                              |
| DEMO sin cuenta                        | Riesgo de producto **aceptado** (soft gate)                   |
| Secretos en el cliente                 | Solo URL + anon/publishable; service_role solo en Edge        |
| Dependencias vulnerables               | Dependabot semanal (G4)                                       |
| Fallos / lockouts sin vigilancia       | Chip Seguridad 24 h + correo ops Resend (D16)                 |

## Controles ya hechos

- CSP y headers en Netlify (`public/_headers`), incl. Storage Supabase.
- Edge `school-login` con guardas y logs minimizados.
- Admin Central: aprobar colegios, actuar como OW; sin consola SIEM propia.
- E2E staff F1–F6 + Vitest de flujos staff.

## Pendiente consciente (no bloquea piloto)

- MFA owner (G3) — después del piloto.
- SMTP Auth propio — solo si el cupo Free 2 correos/h no basta.

Sentry (errores de app) está integrado; ver [SENTRY_SETUP.md](./SENTRY_SETUP.md)
y el mapa [AUTH_ALERTAS_Y_CORREOS.md](../AUTH_ALERTAS_Y_CORREOS.md).

## Referencias

- [CHECKLIST_CALIDAD_AUTH.md](./CHECKLIST_CALIDAD_AUTH.md)
- [ADMIN_CENTRAL.md](./ADMIN_CENTRAL.md)
- [AUTH_ALERTAS_Y_CORREOS.md](../AUTH_ALERTAS_Y_CORREOS.md)
- [OPS_ALERTS_RESEND.md](./OPS_ALERTS_RESEND.md)
- [SENTRY_SETUP.md](./SENTRY_SETUP.md)
- [DEUDA_TECNICA.md](../DEUDA_TECNICA.md) DT-028
