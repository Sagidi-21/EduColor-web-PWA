# Auth: correos, lockout y alertas (mapa de flujos)

Documento **canónico** de qué correos y avisos existen en el piloto, quién los
envía y qué ve el usuario. Las guías de configuración viven aparte; aquí está
el mapa.

| Tema                         | Documento                                                            |
| ---------------------------- | -------------------------------------------------------------------- |
| Activar Resend (ops lockout) | [OPS_ALERTS_RESEND.md](./ops/OPS_ALERTS_RESEND.md)                   |
| Activar / comprobar Sentry   | [SENTRY_SETUP.md](./ops/SENTRY_SETUP.md)                             |
| Decisiones                   | [DECISIONES.md](./DECISIONES.md) D-036–D-039                         |
| Checklist calidad            | [CHECKLIST_CALIDAD_AUTH.md](./ops/CHECKLIST_CALIDAD_AUTH.md) D12–D16 |
| Amenazas                     | [THREAT_MODEL.md](./ops/THREAT_MODEL.md)                             |

---

## Qué no se mezcla

| Señal                      | Canal                       | Para qué                                |
| -------------------------- | --------------------------- | --------------------------------------- |
| Fallos / lockout de login  | Chip Seguridad + Resend ops | Seguridad / fuerza bruta                |
| Enlace de contraseña nueva | Supabase Auth (SMTP Free)   | Usuario define contraseña nueva (D-036) |
| Rotura de la PWA (JS)      | **Sentry**                  | Errores de aplicación, no login         |
| Deploy / infra Netlify     | Dashboard Netlify           | Builds, dominio, env                    |

Sentry **no** sustituye Resend ni Auth. Resend **no** sustituye Auth.

---

## Flujos implementados

### A. Entrar al Colegio — intento fallido (1.º y 2.º)

1. UI → Edge `school-login` con email + contraseña.
2. Credenciales inválidas (o usuario sin acceso activo) → mensaje genérico
   **«Credenciales inválidas.»**
3. Se incrementa `fail_count` en `auth_login_guards` (clave = email normalizado).
4. Se registra evento `login_fail` en `auth_security_events`.
5. **No** hay correo al usuario ni a ops.

### B. Entrar al Colegio — 3.er fallo → lockout (D-037 + D16)

1. Tras el 3.er fallo se activa bloqueo **15 minutos** (`locked_until`).
2. UI muestra el mensaje de lockout (espera 15 min + aviso de que, **si el email
   está registrado**, llegará enlace de contraseña nueva).
3. Eventos: `login_fail` + `login_lockout` (el lockout solo al **activar** el
   bloqueo, no en reintentos posteriores).
4. **Dos correos distintos** (solo al activar el bloqueo):

| Correo                       | Quién lo envía                          | Destinatario                | Condición                                   |
| ---------------------------- | --------------------------------------- | --------------------------- | ------------------------------------------- |
| Contraseña nueva (recovery)  | Supabase Auth (`resetPasswordForEmail`) | El email que intentó entrar | Solo si la cuenta **existe** en Auth        |
| Aviso ops «bloqueo de login» | Resend desde Edge `school-login`        | `OPS_ALERT_EMAILS`          | Si hay `RESEND_API_KEY`; no gasta cupo Auth |

5. Cuerpo del aviso ops (piloto): email intentado, prefijo de `ip_hash`
   (auditoría; la IP en claro **no** se envía), minutos de bloqueo. El hash
   completo vive en BD (`auth_login_guards.ip_hash`); el contador de bloqueo es
   por **email**, no por IP (D-037).

6. **4.º intento (y siguientes) mientras dura el bloqueo:** el servidor responde
   otra vez el mensaje de lockout **sin** validar contraseña, **sin** sumar
   fallos, **sin** alargar el bloqueo y **sin** reenviar correos.

### C. «Olvidé la contraseña» (D-037)

1. Desde Entrar al Colegio → botón **Olvidé la contraseña**.
2. Mensaje UI **neutro** (no revela si el email existe).
3. Auth envía correo de reset si la cuenta existe; **no** aplica ni modifica
   lockout por sí solo.
4. Enlace → pantalla unificada de contraseña nueva (`SetPasswordScreen`,
   `src=forgot`).
5. Tras guardar OK → se limpia el guard de ese email (`clear-login-guard`) y
   popup «Contraseña actualizada».

### D. Enlace de recovery / lockout → contraseña nueva (D-036, DT-027)

1. El usuario abre el enlace del correo (`/?setPassword=1&src=lockout|forgot|…`).
2. Auth verifica el token (one-shot del proveedor).
3. La huella en `password_recovery_consumptions` se escribe **después** de
   guardar la contraseña nueva (no al abrir el enlace), para no quemar el flujo
   por filtros de correo / Strict Mode.
4. Reusar el mismo enlace tras guardar → rechazado.

### E. Login correcto

1. Sesión OK + acceso a app (owner / docente activo / platform admin / alta con
   `pending_school_name`) → se **borra** el guard de ese email.
2. Entra a Home / Admin Central / **WaitingApproval** (colegio `pending`) según
   rol (D-039).

### E2. Baja o rechazo de colegio (D-039)

1. Platform admin **elimina** o **rechaza** el colegio → RPC `admin_delete_school`.
2. Se borra el colegio (cascade staff/invites) **y** las cuentas Auth de sus
   miembros (no platform admins).
3. Esos emails quedan libres para un **nuevo** «Registrar Colegio» más adelante.

### F. Otros correos Auth (no son lockout)

| Momento                         | Canal Auth       | Notas                               |
| ------------------------------- | ---------------- | ----------------------------------- |
| Alta de colegio (confirm email) | Confirm signup   | Caducidad ~1 h (D-029)              |
| Invitación docente              | Plantilla invite | Owner invita; alta vía Edge (D-031) |
| Invite caducado                 | Informativo      | Sin re-solicitud self-serve         |

Cupo **Supabase Auth Free:** ~**2 correos/hora**. Incluye confirmación, reset
por Olvidé y reset disparado por lockout. El aviso ops Resend **no** cuenta aquí.

### G. Chip Seguridad (Admin Central)

- Resumen **24 h** de `auth_security_events`: fallos de login y lockouts.
- Umbral de producto: OK si fallos &lt; 5 **y** lockouts = 0; si no → KO.
- Detalle fino → Supabase (SQL / logs). No es SIEM propio.

### H. Errores de la PWA → Sentry

Ver sección siguiente y [SENTRY_SETUP.md](./ops/SENTRY_SETUP.md).

---

## Sentry — cómo está integrado

**Rol:** capturar errores de JavaScript de la PWA en el navegador.  
**No** captura lockouts, fallos de login ni avisos ops.

### Piezas en código

| Pieza            | Dónde                                     | Qué hace                                             |
| ---------------- | ----------------------------------------- | ---------------------------------------------------- |
| SDK              | `@sentry/react`                           | Dependencia npm                                      |
| Init condicional | `src/platform/sentry.ts` → `initSentry()` | Solo si existe `VITE_SENTRY_DSN`; sin Replay         |
| Arranque         | `src/main.tsx`                            | `initSentry()` antes de montar la app                |
| ErrorBoundary    | `src/main.tsx`                            | Envuelve `<App />`; fallback «Ha ocurrido un error…» |
| Chip Admin       | `AdminHubScreen` + `isSentryConfigured()` | Hint: conectado vs falta DSN                         |

Configuración típica del init:

- `environment` = `import.meta.env.MODE`
- `browserTracingIntegration()`; `tracesSampleRate` 0,1 en producción, 0 en dev
- Sin Session Replay (aula / pantallas de colegio)

### Entorno

| Dónde   | Variable          | Notas                                               |
| ------- | ----------------- | --------------------------------------------------- |
| Netlify | `VITE_SENTRY_DSN` | Sitio `peppy-cactus-71f921`; hace falta **rebuild** |
| Local   | `.env` (opcional) | Misma variable; reiniciar `npm run dev`             |

Proyecto Sentry del piloto: org `home-x55`, proyecto `educolor-web-pwa`
(plataforma React / `javascript-react`). El DSN es clave **pública de cliente**
(va en el bundle); no subir Auth Tokens al repo.

### Separación con login

```
Usuario falla password 3×  →  Auth reset + Resend ops + chip Seguridad
App lanza excepción JS     →  Sentry Issues (+ email Sentry si lo configuraste)
```

---

## Tablas / Edge relevantes

| Recurso                          | Uso                                               |
| -------------------------------- | ------------------------------------------------- |
| Edge `school-login`              | Login, lockout, reset al 3.er fallo, aviso Resend |
| Edge `clear-login-guard`         | Tras contraseña nueva                             |
| Edge `request-new-password`      | Flujo Olvidé (si aplica vía cliente/Auth)         |
| `auth_login_guards`              | Contador + `locked_until` + `ip_hash`             |
| `auth_security_events`           | Auditoría (fail / lockout / reset request…)       |
| `password_recovery_consumptions` | Huella tras guardar (DT-027)                      |

---

## Comprobar en 2 minutos

1. **Lockout:** 3 contraseñas malas → UI 15 min → correo Auth al email de la
   cuenta (si existe) + correo Resend a ops → chip Seguridad KO.
2. **4.º Entrar:** mismo mensaje, sin correos nuevos.
3. **Olvidé:** mensaje neutro + correo Auth si existe cuenta.
4. **Sentry:** con DSN en el build, chip Sin Fallos / hint «conectado»; un
   error real aparece en Issues.
