# Platform

Adaptadores de capacidades del navegador y de infraestructura: PWA, service
worker, IndexedDB, conectividad, archivos, telemetría y API futura.

- Puede importar tipos desde `core` y utilidades de `shared`.
- No importa componentes React ni decide reglas pedagógicas.
- Todo acceso a navegador, almacenamiento o red se concentra aquí para que el
  núcleo se pueda probar sin DOM ni Internet.

La actual inicialización del service worker permanece en `main.tsx` hasta que
se cree su adaptador durante la Fase 6.
