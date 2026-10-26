# Features

Pantallas y componentes React organizados por caso de uso: actividades,
sesiones, fichas, inicio y configuración docente.

- Puede importar desde `core`, `shared` y `platform` mediante contratos públicos.
- No contiene reglas matemáticas, generadores ni validadores de actividad.
- Cada feature debe mantener su estado de interfaz separado de la lógica de
  dominio que corresponde a `core`.

Las pantallas de Matemáticas viven en `src/features/matematicas/`. El estado de
cada actividad migrada está en `docs/ops/INVENTARIO_MIGRACION_ACTIVIDADES.md`.
