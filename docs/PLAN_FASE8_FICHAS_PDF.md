# Plan Fase 8 — Generador de Fichas PDF (Web-only)

## Objetivo

Permitir al profesor generar fichas imprimibles (A4) y hoja de soluciones para
cualquier de las 62 actividades, **100% client-side, offline-capable**, usando
HTML/CSS print + `window.print()`.

---

## Entregables (ítems roadmap)

- [x] **87** Generador de fichas (contrato `GeneratorDef` listo en `types.ts`)
- [x] **88** Plantilla A4
- [x] **89** Ficha alumno (sin soluciones)
- [x] **90** Ficha soluciones (con soluciones)
- [x] **91** Semilla reproducible
- [x] **92** Generación PDF
- [x] **172** Tests PDF

---

## Arquitectura

```
src/core/ficha/
├── types.ts
├── generators/
│   ├── registry.ts             # createGenerator / getGenerator
│   ├── session-engines.ts      # adaptadores 62 actividades → sesión
│   ├── mapSessionToSheet.ts    # SessionExercise → SheetExercise
│   └── index.ts
├── renderers/
│   ├── alumno.tsx
│   ├── soluciones.tsx
│   ├── components/             # Header, Footer, ExerciseRenderer, …
│   └── print.css
├── pdf.ts                      # window.print() / ventana de impresión
├── fichaGenerator.ts           # orquestador + localStorage
└── index.ts

src/features/ficha/
├── FichaModal.tsx              # UI desde catálogo
└── FichaPreviewScreen.tsx      # /ficha-preview?activity=suma&mode=alumno
```

---

## Fases de implementación

### Fase 8.1 — Fundación (Tipos + Registry genérico) ✅

- [x] `src/core/ficha/types.ts`
- [x] `src/core/ficha/generators/registry.ts`
- [x] `src/core/ficha/generators/session-engines.ts`
- [x] `src/core/ficha/generators/index.ts`
- [x] Test: `getGenerator('suma').generate({...})` → `OperationSheetExercise[]`

### Fase 8.2 — Renderers HTML/CSS (Plantilla A4) ✅

- [x] `print.css` (A4, grid 2 columnas, `@media print`)
- [x] Componentes compartidos (Header, Footer, ExerciseCard, …)
- [x] `alumno.tsx` / `soluciones.tsx`
- [x] Preview: `/ficha-preview?activity=suma&mode=alumno`

### Fase 8.3 — Mappers por familia ✅

- [x] Mapper único con switch por `activityId` (`mapSessionToSheet.ts`)
- [x] Renderers específicos: operation, counting, comparison, tresSumandos,
      algoritmoVertical, tablaNumerica + QuestionRenderer genérico
- [x] Cobertura de las 62 actividades del catálogo (test de generación)

### Fase 8.4 — Generación PDF ✅

- [x] `pdf.ts` → ventana + `window.print()` (guardar como PDF del sistema)
- [x] `fichaGenerator.ts` → `generateFicha` / `downloadFicha` + última seed en
      localStorage
- [x] UI: botón **Generar ficha** en `DifficultyReveal` + `FichaModal`

### Fase 8.5 — Tests ✅

- [x] Unit: `registry`, `mapSessionToSheet`, `fichaGenerator`, `pdf`
- [x] Reproducibilidad: misma seed → mismo HTML
- [x] Generación smoke de las 62 actividades
- [ ] Visual regression Playwright (opcional / seguimiento): no bloquea V1;
      la preview manual en `/ficha-preview` cubre validación visual

---

## Criterios de done

- [x] 62 actividades generan ficha A4
- [x] Alumno + Soluciones por actividad
- [x] Misma seed = misma ficha (test)
- [x] Funciona offline (sin red; solo `window.print`)
- [x] Print preview vía `/ficha-preview` + diálogo nativo
- [x] Tests unitarios verdes (`npx vitest run src/core/ficha`)
- [x] Sin dependencias Node en runtime (`pdf-lib` no añadido)

---

## Cómo usarlo

1. Catálogo → elegir actividad → **Generar ficha**
2. Elegir count / seed / alumno|soluciones → **Imprimir / PDF** o **Vista previa**
3. Preview directa:
   `/ficha-preview?activity=suma&mode=alumno&difficulty=easy&count=10&seed=42`

---

## Estado actual (2026-10-09) — FASE 8 COMPLETADA

| Ítem                    | Estado | Comentario                                  |
| ----------------------- | ------ | ------------------------------------------- |
| **87** Generador        | ✅     | `types` + `getGenerator` + `sessionEngines` |
| **88** Plantilla A4     | ✅     | `print.css` + componentes                   |
| **89** Ficha alumno     | ✅     | `FichaAlumno`                               |
| **90** Ficha soluciones | ✅     | `FichaSoluciones`                           |
| **91** Semilla          | ✅     | Determinista + persistencia localStorage    |
| **92** PDF              | ✅     | `downloadFicha` → print dialog              |
| **172** Tests           | ✅     | 27 tests en `src/core/ficha`                |

**Pendiente menor (no bloquea):** snapshots Playwright de PDF visual.

**Revisión manual:** checklist en [`REVISION_MANUAL_FICHAS.md`](./REVISION_MANUAL_FICHAS.md)
(marcar `[x]` al validar cada actividad en preview/print).
