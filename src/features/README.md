# Features

Pantallas y componentes React organizados por caso de uso: actividades,
sesiones, fichas, inicio y configuración docente.

- Puede importar desde `core`, `shared` y `platform` mediante contratos públicos.
- No contiene reglas matemáticas, generadores ni validadores de actividad.
- Cada feature debe mantener su estado de interfaz separado de la lógica de
  dominio que corresponde a `core`.

El renderer del vertical slice de conteo permanece temporalmente en `App.tsx`.
Se moverá a esta capa al iniciar la migración del catálogo en la Fase 2.
