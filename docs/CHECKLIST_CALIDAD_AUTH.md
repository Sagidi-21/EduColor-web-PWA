# Checklist de calidad — Auth / producción (D-028 / Fase 10)

Marca cada ítem. Actualizado 2026-10-19. Detalle de producto: D-028–D-037.
Estado del proyecto: [ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md).

## A. Supabase — esquema

| #   | Ítem                                                     | Cómo comprobar                                           | Estado |
| --- | -------------------------------------------------------- | -------------------------------------------------------- | ------ |
| A1  | Migración base `schools` / `profiles` / memberships      | Table Editor: existen las 3 tablas                       | [x]    |
| A2  | `create_school_as_owner`                                 | SQL: `\df create_school_as_owner` o Database → Functions | [x]    |
| A3  | `memberships_select_own`                                 | Policies de `school_memberships`                         | [x]    |
| A4  | Índice único nombre colegio                              | `schools_name_unique_ci` en Indexes                      | [x]    |
| A5  | `auth_security_events` + `log_auth_security_event`       | Tabla + Function tras hardening OWASP                    | [x]    |
| A6  | Invites + staff RPCs (`owner_*`, `peek_*`, `complete_*`) | Functions + migraciones `20261018*`                      | [x]    |
| A7  | `is_school_member` exige docente activo                  | Migración `…_member_requires_active`                     | [x]    |
| A8  | `owner_list_staff` sin INNER JOIN a profiles             | Migración `…_owner_list_staff_memberships`               | [x]    |
| A9  | `avatar_color` + unicidad por colegio                    | Migración `…_membership_avatar_color`                    | [x]    |
| A10 | Recovery un solo uso (`password_recovery_consumptions`)  | Migración `…_password_recovery_single_use`               | [x]    |

## B. Supabase — Auth (panel)

| #   | Ítem                               | Dónde                                                                  | Estado                                           |
| --- | ---------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| B1  | Confirm email **ON**               | Auth → Iniciar sesión / Proveedores → Email                            | [x]                                              |
| B2  | Permitir registros **ON**          | Misma pantalla                                                         | [x]                                              |
| B3  | Anónimos **OFF**                   | Misma pantalla                                                         | [x]                                              |
| B4  | Site URL correcto                  | Auth → Configuración de URL                                            | [x] local `http://localhost:5173` / prod Netlify |
| B5  | Redirect URLs                      | Incluye `http://localhost:5173/**` y (prod) `https://*.netlify.app/**` | [x] local + Netlify                              |
| B6  | Rate limits revisados              | Auth → Límites de velocidad (defaults OK para MVP; SMTP Free = 2/h)    | [x]                                              |
| B7  | Password min length ≥ 8 (opcional) | Auth → Providers / Password settings                                   | [x]                                              |

## C. Secrets y entorno

| #   | Ítem                                                          | Cómo                                  | Estado              |
| --- | ------------------------------------------------------------- | ------------------------------------- | ------------------- |
| C1  | Solo `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` en `.env` | Nunca Secret / service_role           | [x]                 |
| C2  | Ping Auth OK                                                  | `node scripts/ping-supabase.mjs`      | [x] OK (2026-10-17) |
| C3  | Netlify env: mismas vars Publishable                          | Site settings → Environment variables | [x]                 |
| C4  | Secret key **no** está en Netlify ni en el repo               | Buscar `service_role` / Secret        | [x]                 |

## D. Flujo funcional (prueba manual / local)

| #   | Ítem                                | Esperado                                                        | Estado                                                     |
| --- | ----------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| D1  | Registrar colegio (password válida) | Aviso de confirmar email; **sin** entrar aún                    | [x] local                                                  |
| D2  | Abrir enlace del correo             | Vuelve a la app / sesión                                        | [x] local                                                  |
| D3  | Filas en BD                         | `profiles` + `schools` + `school_memberships`                   | [x] local                                                  |
| D4  | Home                                | Nombre del colegio (no placeholder de alta)                     | [x] local                                                  |
| D5  | Login fallido / desactivado         | **«Credenciales inválidas.»**                                   | [x]                                                        |
| D6  | Password débil en registro          | Botón gris desactivado + tip; sin submit inválido               | [x]                                                        |
| D7  | Nombre/email duplicado              | Mensaje genérico en pantalla (sin falso “revisa el email”)      | [x]                                                        |
| D8  | DEMO                                | Catálogo limitado; salir al registro                            | [x]                                                        |
| D9  | Invitar docente → link `?invite=`   | Registrar Docente + popup → Entrar al Colegio (login)           | [x] local                                                  |
| D10 | Desactivar / eliminar con sesión    | Corte inmediato; re-login = credenciales inválidas              | [x] local                                                  |
| D11 | Chips Profesorado                   | pendientes / aceptadas / activos / desactivados coherentes      | [x] local                                                  |
| D12 | Cambiar contraseña (nueva)          | D-036 — pantalla + popup «Contraseña actualizada»               | [x] código; re-probar popup en prod cuando haya cupo email |
| D13 | Lockout 3 fallos / 15 min           | D-037 — «Demasiadas credenciales inválidas. Espera 15 minutos.» | [x]                                                        |
| D14 | Correo al 3.er fallo (si existe)    | D-037 — con aviso de intentos + enlace                          | [x]                                                        |
| D15 | Olvidé la contraseña                | D-037 — correo neutro; enlace **un solo uso** al abrir          | [x] enlace reutilizado OK; popup éxito pendiente re-probar |
| D16 | Correo/pantalla admin de fallos     | Email fijo ops — **más adelante**                               | [ ]                                                        |
| D17 | Avatar + Cerrar Sesión en home      | Bola (OW / iniciales) + botón en banner inferior                | [x]                                                        |

## E. Producción Netlify (build con Auth)

La build publicada debe ser la PWA **con gate de login** (Welcome → acceso
colegio), no el despliegue antiguo “sin cuenta”.

| #   | Ítem                                            | Estado                                                                    |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| E1  | Build con las env de Supabase                   | [x]                                                                       |
| E2  | Site URL Supabase = URL Netlify                 | [x]                                                                       |
| E3  | Redirect Netlify en allow-list                  | [x]                                                                       |
| E4  | Probar registro/login real desde la URL pública | [x]                                                                       |
| E5  | Edge Functions desplegadas en el proyecto       | [x] accept, manage, school-login, request-new-password, clear-login-guard |
| E6  | Deploy automático en push a `main`              | [x]                                                                       |

## F. Orden de trabajo (2026-10-19)

1. ~~D-036/D-037 + Netlify Auth~~ (hecho).
2. Re-probar popup contraseña en prod (cupo email Free 2/h) → marcar D12/D15 al 100 %.
3. **E2E** staff (Playwright + Supabase de prueba).
4. **SMTP propio** si hace falta más de 2 correos Auth/hora.
5. Admin email fijo + pantalla de fallos (D16).

## Notas

- DEMO / soft gate es riesgo de producto aceptado.
- MFA / CSP completa → Fase 12.
- No se “recuperan” contraseñas antiguas: siempre se **elige una nueva** (D-036).
- Lockout: contador **email + IP**; solo pantalla Entrar al Colegio (D-037).
- SMTP integrado Free: **2 emails Auth/hora** (proyecto); esperar o SMTP custom.
