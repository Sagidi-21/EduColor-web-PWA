# EduColor web PWA

Nueva plataforma web progresiva de EduColor. El proyecto Electron original se mantiene intacto como referencia funcional y fuente de migración selectiva.

## Requisitos locales

- Node.js 22 LTS.
- npm (incluido con Node.js).
- Chrome o Edge actual para desarrollar. La validación definitiva de ambos en la pizarra real se realizará en la Fase 4.

## Arranque local

```bash
npm ci
npm run dev
```

Vite mostrará una dirección local, normalmente `http://localhost:5173`. Abrirla en Chrome o Edge. Para detener el servidor, usar `Ctrl+C` en la terminal.

Para instalar dependencias nuevas durante desarrollo se usa `npm install`; para reproducir exactamente las dependencias bloqueadas se usa `npm ci`.

## Verificación antes de publicar cambios

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

También se puede aplicar el formato automáticamente con `npm run format` y las correcciones seguras de lint con `npm run lint:fix`. GitHub ejecuta las mismas comprobaciones en cada cambio enviado a `main`.

## Navegadores y pizarra

- **Objetivo V1:** Chrome y Edge actuales en un portátil Windows conectado por HDMI y USB Touch a la pizarra digital.
- **Estado actual:** compatible como objetivo de desarrollo; pendiente de validación física de toque, arrastre, pantalla completa, rendimiento e instalación PWA en la Fase 4.
- **No comprometido todavía:** Safari, Firefox, tabletas y dispositivos Android.

## Scripts disponibles

| Comando                | Uso                                               |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Inicia la aplicación local.                       |
| `npm run format`       | Aplica el formato del proyecto.                   |
| `npm run format:check` | Comprueba formato sin modificar archivos.         |
| `npm run lint`         | Detecta errores de calidad estática.              |
| `npm run lint:fix`     | Intenta corregir automáticamente errores de lint. |
| `npm run typecheck`    | Comprueba los tipos de TypeScript.                |
| `npm test`             | Ejecuta pruebas automatizadas.                    |
| `npm run build`        | Genera la build de producción.                    |

Consulta [la arquitectura inicial](docs/ARQUITECTURA_INICIAL.md), el [roadmap operativo auditado](docs/ROADMAP_AUDITADO.md), el [plan de ejecución detallado](docs/ROADMAP_DE_EJECUCION_DETALLADO.md) y el [estado actual del proyecto](docs/ESTADO_DEL_PROYECTO.md).
