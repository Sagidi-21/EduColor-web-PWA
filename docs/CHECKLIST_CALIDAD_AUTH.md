# Checklist de calidad — Auth / producción (D-028 / Fase 10)

Marca cada ítem. Actualizado 2026-10-18. Detalle de producto: D-028–D-036.
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

## B. Supabase — Auth (panel)

| #   | Ítem                               | Dónde                                                                   | Estado                                           |
| --- | ---------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| B1  | Confirm email **ON**               | Auth → Iniciar sesión / Proveedores → Email                             | [x]                                              |
| B2  | Permitir registros **ON**          | Misma pantalla                                                          | [x]                                              |
| B3  | Anónimos **OFF**                   | Misma pantalla                                                          | [x]                                              |
| B4  | Site URL correcto                  | Auth → Configuración de URL                                             | [x] local `http://localhost:5173` / prod Netlify |
| B5  | Redirect URLs                      | Incluye `http://localhost:5173/**` y (prod) `https://TU.netlify.app/**` | [x] local; Netlify pendiente en E                |
| B6  | Rate limits revisados              | Auth → Límites de velocidad (defaults OK para MVP)                      | [x]                                              |
| B7  | Password min length ≥ 8 (opcional) | Auth → Providers / Password settings                                    | [x]                                              |

## C. Secrets y entorno

| #   | Ítem                                                          | Cómo                                  | Estado              |
| --- | ------------------------------------------------------------- | ------------------------------------- | ------------------- |
| C1  | Solo `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` en `.env` | Nunca Secret / service_role           | [ ] verificar       |
| C2  | Ping Auth OK                                                  | `node scripts/ping-supabase.mjs`      | [x] OK (2026-10-17) |
| C3  | Netlify env: mismas vars Publishable                          | Site settings → Environment variables | [ ]                 |
| C4  | Secret key **no** está en Netlify ni en el repo               | Buscar `service_role` / Secret        | [ ] verificar       |

## D. Flujo funcional (prueba manual / local)

| #   | Ítem                                | Esperado                                                   | Estado    |
| --- | ----------------------------------- | ---------------------------------------------------------- | --------- |
| D1  | Registrar colegio (password válida) | Aviso de confirmar email; **sin** entrar aún               | [x] local |
| D2  | Abrir enlace del correo             | Vuelve a la app / sesión                                   | [x] local |
| D3  | Filas en BD                         | `profiles` + `schools` + `school_memberships`              | [x] local |
| D4  | Home                                | Nombre del colegio (no placeholder de alta)                | [x] local |
| D5  | Login fallido / desactivado         | **«Credenciales inválidas.»**                              | [x]       |
| D6  | Password débil en registro          | Botón gris desactivado + tip; sin submit inválido          | [x]       |
| D7  | Nombre/email duplicado              | Mensaje genérico en pantalla (sin falso “revisa el email”) | [x]       |
| D8  | DEMO                                | Catálogo limitado; salir al registro                       | [x]       |
| D9  | Invitar docente → link `?invite=`   | Registrar Docente + popup → Entrar al Colegio (login)      | [x] local |
| D10 | Desactivar / eliminar con sesión    | Corte inmediato; re-login = credenciales inválidas         | [x] local |
| D11 | Chips Profesorado                   | pendientes / aceptadas / activos / desactivados coherentes | [x] local |
| D12 | Cambiar contraseña (nueva)          | D-036 — **pendiente de implementar**                       | [ ]       |

## E. Producción Netlify (build con Auth)

La build publicada debe ser la PWA **con gate de login** (Welcome → acceso
colegio), no el despliegue antiguo “sin cuenta”.

| #   | Ítem                                      | Estado                                    |
| --- | ----------------------------------------- | ----------------------------------------- |
| E1  | Build con las env de Supabase             | [ ]                                       |
| E2  | Site URL Supabase = URL Netlify           | [ ]                                       |
| E3  | Redirect Netlify en allow-list            | [ ]                                       |
| E4  | Probar registro real desde la URL pública | [ ]                                       |
| E5  | Edge Functions desplegadas en el proyecto | [x] accept + manage (local/prod proyecto) |

## F. Orden de trabajo acordado (2026-10-18)

1. Documentación al día (este checklist + ESTADO + D-036) y push.
2. Build / deploy Netlify con Auth (§E).
3. Implementar **cambiar contraseña = nueva** (D-036 / D12).
4. E2E staff (Playwright + Supabase de prueba).

## Notas

- DEMO / soft gate es riesgo de producto aceptado.
- MFA y alertas sobre `auth_security_events` → fase siguiente.
- No se “recuperan” contraseñas antiguas: siempre se **elige una nueva** (D-036).
