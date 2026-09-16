# Plan Definitivo de Resolución de Deuda Técnica y Estabilización

## Objetivo

Ejecutar la resolución de la deuda técnica en 5 fases estructuradas, garantizando no-regresión por fase, contratos semánticos flexibles (DT-004), code-splitting real verificado para TensorFlow.js (DT-007) y evidencia estructurada de cierre.

## Orden de Ejecución Definitivo

Fase 1 (DT-005 + Docs) → Fase 2 (DT-006) → Fase 3 (DT-004) → Fase 4 (DT-003) → Fase 5 (DT-007) → Validación Completa → Cierre Documental.

---

## Fases y Criterios de No-Regresión

### Fase 1 — DT-005 (Limpieza) + Documentación

- **Acciones:** Eliminar variables/imports no utilizados (`themes`, `IgualdadType`, `validateAnswer`). Actualizar nomenclatura y numeración en `docs/DEUDA_TECNICA.md`.
- **No-regresión:** `npm run lint` (0 errores) y `npm run typecheck`.

### Fase 2 — DT-006 (setState en useEffect)

- **Acciones:** Refactorizar `Numeracion1119Screen.tsx` para evitar llamadas a `setState` dentro de `useEffect` cuando el estado puede derivarse directamente o actualizarse en respuesta al evento que origina el cambio.
- **No-regresión:** Ejecutar tests específicos de numeración (`npx vitest run numeracion1119`).

### Fase 3 — DT-004 (Contrato semántico de entrada)

- **Acciones:** Definir contrato semántico común (`InputMode`, `value`, `onChange`, `onDelete`, `onSubmit`, `focus`) manteniendo libertad de implementación visual según el motor.
- **No-regresión:** Ejecutar tests de los motores afectados (operaciones, problemas, numeración).

### Fase 4 — DT-003 (Adaptador de sonido unificado)

- **Acciones:** Extraer capa de adaptador de audio entre engines y reproductor (`playCorrect` / `playWrong`).
- **No-regresión:** Verificar sonido en `comparison`, `ordenar` y `problemas` sus tests unitarios.

### Fase 5 — DT-007 (Optimización y Code-Splitting de TensorFlow.js)

- **Acciones:** Aplicar `React.lazy` para aislar `DigitCell` y TensorFlow.js en un chunk perezoso independiente del entrypoint inicial.
- **Criterio definitivo DT-007:** TensorFlow.js y `DigitCell` no deben formar parte del grafo de carga inicial; deben aparecer en un chunk solicitado únicamente cuando se accede a la funcionalidad correspondiente.
- **Validación específica DT-007:**
  - Inspeccionar `dist/assets` tras `npm run build`.
  - Identificar el chunk lazy de TensorFlow.js.
  - Verificar que el entrypoint inicial no lo solicita directamente.
  - Comprobar funcionamiento operativo de `DigitCell`.

---

## Plantilla de Evidencia de Cierre en `DEUDA_TECNICA.md`

Al cerrar cada DT, se registrará:

- **Estado:** Resuelta
- **Fecha:** YYYY-MM-DD
- **Implementación:** `<archivo / commit / PR>`
- **Validación:** `<comandos y pruebas>`
- _(Para DT-007 adicionalmente)_: Tamaño de bundle inicial, nombre de chunk lazy, verificación de no-solicitud en carga inicial y prueba de DigitCell.

## Criterios de Cierre Global

- `npm run lint` → 0 errores
- `npm run typecheck` → 0 errores
- `npm run test` → 120+ tests pasando
- `npm run build` → Success con code-splitting real verificado en `dist/assets`.
