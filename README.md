# EduColor web PWA

Aplicación web progresiva (PWA) de **EduColor** para Matemáticas de **1.º y 2.º de Primaria**: pizarra digital interactiva, generador de fichas imprimibles y acceso multi-colegio para profesorado (sin datos de alumnado en esta versión).

Este repositorio es el entregable técnico del **TFM**: la PWA EduColor tal como
se despliega y se usa en el piloto.

## Qué es la app (visión rápida)

| Capacidad                 | Descripción breve                                                       |
| ------------------------- | ----------------------------------------------------------------------- |
| Catálogo matemático       | **62** actividades (pizarra + fichas)                                   |
| Sesión de aula            | Ejercicios, corrección, resumen; uso orientado a pizarra digital        |
| Fichas PDF                | Generación de fichas para imprimir desde el mismo catálogo              |
| Identidad / colegios      | Alta de centro, login, invitaciones de docentes, Admin Central (piloto) |
| DEMO                      | Entrada sin cuenta con catálogo limitado (escaparate)                   |
| Reconocimiento de dígitos | Entrada manuscrita en algunas actividades (TensorFlow.js en el cliente) |
| Observabilidad            | Sentry (errores JS), chip Seguridad + Resend (lockouts)                 |

Stack principal: **React 18 + TypeScript + Vite**, PWA (`vite-plugin-pwa`), **Supabase** (Auth, Postgres, Edge Functions, Storage), despliegue en **Netlify**, **Sentry** (errores JS de la PWA) y **Resend** (avisos ops de lockout).

Decisiones de producto: [`docs/DECISIONES.md`](docs/DECISIONES.md). Mapa de alertas/correos: [`docs/AUTH_ALERTAS_Y_CORREOS.md`](docs/AUTH_ALERTAS_Y_CORREOS.md).

## Estructura del proyecto

```text
EduColor-web-PWA/
├── src/
│   ├── app/           # Composición del arranque (AppShell, boot, sesión)
│   ├── core/          # Dominio (activities/content) + núcleo de producto (contexts, transiciones)
│   ├── features/      # Pantallas y UI React (home, matemáticas, auth, admin…)
│   ├── platform/      # Supabase, PWA, red, reconocimiento de dígitos
│   ├── manifests/     # Contratos versionados de actividades / currículo
│   ├── shared/        # Componentes y utilidades transversales
│   └── server/        # Servidor local del Compañero IA (dev)
├── supabase/          # SQL, Edge Functions, políticas (Supabase)
├── docs/              # Doc de producto (TFM) + docs/ops/ (runbooks internos)
├── tests/             # E2E (Playwright)
├── test-support/      # Tests de apoyo (p. ej. Edge content)
├── public/            # Estáticos PWA (iconos, etc.)
├── package.json       # Scripts npm
├── vite.config.ts     # Build Vite + PWA
└── README.md          # Este documento
```

Detalle de capas y dependencias: [`docs/ARQUITECTURA_INICIAL.md`](docs/ARQUITECTURA_INICIAL.md).

## Requisitos

- **Node.js 22 LTS** (recomendado) y **npm**
- Git
- Navegador **Chrome** o **Edge** (ver [Navegadores y pizarra](#navegadores-y-pizarra))

## Obtener el código

```bash
git clone https://github.com/Sagidi-21/EduColor-web-PWA.git
cd EduColor-web-PWA
```

Si el repositorio se entrega como ZIP: descomprimir y abrir la carpeta raíz en una terminal.

## Variables de entorno (local)

1. Copia el ejemplo:

```bash
cp .env.example .env
```

En Windows (PowerShell): `Copy-Item .env.example .env`

2. Rellena al menos (claves **publishable / anon**, nunca la `service_role`):

| Variable                 | Uso                                       | ¿Obligatoria para arrancar?                                               |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Proyecto Supabase                         | No para UI/DEMO; sí para login real                                       |
| `VITE_SUPABASE_ANON_KEY` | Clave anon / publishable                  | Igual                                                                     |
| `HF_TOKEN`               | Generación de mascota (Hugging Face)      | No (solo feature Compañero IA)                                            |
| `VITE_SENTRY_DSN`        | Sentry (ya integrado en código y en prod) | No en local: sin DSN la app arranca igual; en Netlify sí está configurado |

Sin Supabase puedes revisar la interfaz y la **DEMO**. El login de colegio y Admin Central requieren un proyecto Supabase configurado (ver `docs/ops/CHECKLIST_CALIDAD_AUTH.md`).

**No** subas `.env` ni secretos de Edge (`RESEND_*`, service role) al repositorio.

## Despliegue (producción)

URL estable del piloto: **[https://peppy-cactus-71f921.netlify.app](https://peppy-cactus-71f921.netlify.app)** (Netlify).

## Credenciales de prueba (tribunal / revisión TFM)

Cuenta de colegio de demostración en el entorno de producción:

| Campo      | Valor                        |
| ---------- | ---------------------------- |
| Colegio    | BigSchoolTFM                 |
| Usuario    | `sagidiappcursor2@gmail.com` |
| Contraseña | `.6RXSUuyphZYz4!`            |

Entrar con **Entrar al Colegio** (no el registro). Si el centro está pendiente de aceptación por Admin Central, verás la pantalla de solicitud en revisión hasta que un platform admin lo active.

## Arranque local

Instalación reproducible:

```bash
npm ci
```

Desarrollo (Vite + servidor Express local del Compañero IA):

```bash
npm run dev
```

Abre la URL que indique Vite, normalmente **http://localhost:5173**. Detener: `Ctrl+C`.

Solo el cliente Vite (sin servidor de mascota):

```bash
npm run dev:client
```

## Comprobar calidad (antes de revisar / entregar)

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

| Comando                 | Uso                                   |
| ----------------------- | ------------------------------------- |
| `npm run format`        | Formatea el código                    |
| `npm run lint:fix`      | Correcciones automáticas de ESLint    |
| `npm run test:coverage` | Cobertura Vitest                      |
| `npm run test:e2e`      | Playwright (opcional; ver vars E2E)   |
| `npm run preview`       | Sirve la build de producción en local |

GitHub Actions ejecuta las comprobaciones principales al enviar cambios a `main`.

## Documentación del proyecto (revisión TFM)

| Documento                                                                                                 | Contenido                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`docs/ARQUITECTURA_INICIAL.md`](docs/ARQUITECTURA_INICIAL.md)                                            | Capas, dominio vs núcleo UI, composición `src/app/` |
| [`docs/DECISIONES.md`](docs/DECISIONES.md)                                                                | Decisiones de producto/técnicas                     |
| [`docs/AUTH_ALERTAS_Y_CORREOS.md`](docs/AUTH_ALERTAS_Y_CORREOS.md)                                        | Mapa de lockout, correos Auth/Resend y Sentry       |
| [`docs/DEUDA_TECNICA.md`](docs/DEUDA_TECNICA.md)                                                          | Deuda técnica (MVP sin filas abiertas)              |
| [`docs/COMPONENTES_COMPARTIDOS.md`](docs/COMPONENTES_COMPARTIDOS.md)                                      | Componentes reutilizables                           |
| [Slides (Drive)](https://drive.google.com/drive/folders/1dfHOtTUi4VPFsQmXB8UxU9kCb50opmPx?usp=drive_link) | Presentación HTML del TFM (fuera del repo)          |

Runbooks, planes de ejecución, checklists y estado operativo: carpeta [`docs/ops/`](docs/ops/).

## Navegadores y pizarra

Esta es la **primera versión** de EduColor como PWA. En aula se usa con
**Chrome o Edge** en un **portátil Windows** conectado a la pizarra digital
(HDMI o USB Touch). Se abre en el navegador; no hay que instalar nada en la
pizarra.

| Entorno                              | En esta primera versión        |
| ------------------------------------ | ------------------------------ |
| Chrome / Edge (Windows, aula)        | Entorno soportado              |
| Safari, Firefox                      | No soportados                  |
| Tabletas / Android / iOS             | No soportados                  |
| Toque y pantalla completa en pizarra | Previstos en el diseño de aula |

La app desplegada en Netlify se puede revisar en Chrome o Edge de escritorio
sin pizarra física.

## Alcance de esta primera versión

Incluye Matemáticas 1.º/2.º, profesorado, pizarra, fichas, sesiones de aula y
reconocimiento de dígitos. **No** incluye datos de alumnos, familias ni tareas
individuales. El acceso multi-colegio gestiona centros y docentes.
