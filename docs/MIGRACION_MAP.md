# Mapa de Migración

Registro de dónde acaban los componentes de la aplicación original en la nueva arquitectura PWA.

| Archivo / Componente Original | Destino en la PWA | Comentarios |
| :--- | :--- | :--- |
| `window.api` (Electron) | `src/platform/*` | Servicios de plataforma web (IndexedDB, Web Audio) |
| React Components (Desktop) | `src/features/*` | Adaptados a responsive y touch-first |
| `src/renderer/src/core/engines/comparison/ComparisonRenderer.tsx` | `src/features/matematicas/comparison/ComparisonScreen.tsx` | Migrado |
| `src/renderer/src/core/engines/ordering/*` | `src/core/activities/ordering.ts` | Generador extraído de React |
