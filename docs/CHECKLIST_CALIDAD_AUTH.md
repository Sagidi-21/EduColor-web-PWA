# Checklist de calidad — Auth / producción (D-028)

Marca cada ítem. Estado verificado en local el 2026-10-17 donde se indica.

## A. Supabase — esquema

| #   | Ítem                                                | Cómo comprobar                                           | Estado |
| --- | --------------------------------------------------- | -------------------------------------------------------- | ------ |
| A1  | Migración base `schools` / `profiles` / memberships | Table Editor: existen las 3 tablas                       | [x]    |
| A2  | `create_school_as_owner`                            | SQL: `\df create_school_as_owner` o Database → Functions | [x]    |
| A3  | `memberships_select_own`                            | Policies de `school_memberships`                         | [x]    |
| A4  | Índice único nombre colegio                         | `schools_name_unique_ci` en Indexes                      | [x]    |
| A5  | `auth_security_events` + `log_auth_security_event`  | Tabla + Function tras hardening OWASP                    | [x]    |

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
| C1  | Solo `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` en `.env` | Nunca Secret / service_role           | [ ]                 |
| C2  | Ping Auth OK                                                  | `node scripts/ping-supabase.mjs`      | [x] OK (2026-10-17) |
| C3  | Netlify env: mismas vars Publishable                          | Site settings → Environment variables | [ ]                 |
| C4  | Secret key **no** está en Netlify ni en el repo               | Buscar `service_role` / Secret        | [ ]                 |

## D. Flujo funcional (prueba manual)

| #   | Ítem                                | Esperado                                                   | Estado |
| --- | ----------------------------------- | ---------------------------------------------------------- | ------ |
| D1  | Registrar colegio (password válida) | Aviso de confirmar email; **sin** entrar aún               | [ ]    |
| D2  | Abrir enlace del correo             | Vuelve a la app / sesión                                   | [ ]    |
| D3  | Filas en BD                         | `profiles` + `schools` + `school_memberships`              | [ ]    |
| D4  | Home                                | Nombre del colegio (no placeholder)                        | [ ]    |
| D5  | Login fallido                       | Mensaje genérico «credenciales no son correctas»           | [x]    |
| D6  | Password débil en registro          | Botón gris desactivado + tip; sin submit inválido          | [x]    |
| D7  | Nombre/email duplicado              | Mensaje genérico en pantalla (sin falso “revisa el email”) | [x]    |
| D8  | DEMO                                | Catálogo limitado; salir al registro                       | [x]    |

## E. Producción Netlify (cuando despliegues)

| #   | Ítem                                      | Estado |
| --- | ----------------------------------------- | ------ |
| E1  | Build con las env de Supabase             | [ ]    |
| E2  | Site URL Supabase = URL Netlify           | [ ]    |
| E3  | Redirect Netlify en allow-list            | [ ]    |
| E4  | Probar registro real desde la URL pública | [ ]    |

## Notas

- DEMO / soft gate es riesgo de producto aceptado.
- MFA y alertas sobre `auth_security_events` → fase siguiente.
