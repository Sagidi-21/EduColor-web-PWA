# Problemas (P1) - Cierre del renderer PWA - Product Requirements Document

## Overview

- **Summary**: Completar y validar el renderer PWA `ProblemaScreen.tsx` de la actividad `problemas` (problemas verbales de suma y resta) siguiendo el guion de `electron-reference`, ajustándolo a los componentes dumpling PWA (`ActivityHeader`, `SummaryScreen`, `Numpad`, `DigitCell` + `InputModeToggle`, `ActionButtons`). Actualizar el inventario de migración marcando `problemas` como ✅ P1 migrada.
- **Purpose**: Cerrar el bloque P1 del inventario. Hasta hoy `problemas` está marcado como `P1` pendiente a pesar de tener core + tests + renderer a medio hacer. Tras este cierre solo quedarán `counting` e `igualdad` para completar la primera ola compartida.
- **Target Users**: Alumnado de 1.º y 2.º de Primaria; profesorado que valida la actividad en pizarra digital.

## Goals

- Paridad de guion y flujo entre `electron-reference/src/renderer/src/core/engines/problemas/ProblemaRenderer.tsx` y `src/features/matematicas/problemas/ProblemaScreen.tsx`.
- Cumplir todas las "reglas antes de migrar" de `docs/INVENTARIO_MIGRACION_ACTIVIDADES.md` (localizar recursos/tests, evidencia concreta, no marcar como migrada antes de Definition of Done).
- Pasar `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` (Vitest) sin errores.
- 0 advertencias de ESLint / Prettier en los archivos tocados.

## Non-Goals

- NO tocar el core `src/core/activities/problemas.ts` ni sus tests (`problemas.test.ts`) a menos que haya una discrepancia bloqueante. El core ya está auditado y se marca como fuente de verdad junto a `electron-reference/src/renderer/src/core/engines/problemas/engine.ts`.
- NO añadir `playwright.config.ts` ni convertir `tests/portal-diagnostics.spec.ts` en un test real en este hito (deuda técnica DT-009).
- NO cambiar el registro de catálogo ni el `engine-registry` para `problemas`; solo auditar que los IDs coinciden.
- NO añadir PDFs, DOCX, ni ficheros imprimibles. Eso pertenece a Fase 8 del ROADMAP.

## Background & Context

- Reglas generales del proyecto (project_memory.md):
  - En migración de actividades **prohibido inventar lógica**. Se sigue el guion de `electron-reference` y luego la capa Dumpling PWA.
  - Preferencia por limpiar Prettier/ESLint antes de empezar trabajo nuevo.
  - Sanitización obligatoria en entradas de texto libre (no aplica aquí, pero sí para evitar XSS por datos que vengan de `story` / `question` si algún día se parametrizan desde el backend — en este PR todas vienen del core puro).
- Estado previo (2026-09-23):
  - `src/core/activities/problemas.ts` = ✅ core (10 ejercicios/sesión, temas deportes/animales/clase/naturaleza, easy→suma, medium/hard/expert→suma+resta, determinista por seed).
  - `src/core/activities/problemas.test.ts` = ✅ 14 tests unitarios pasando.
  - `engine-registry.ts` registra `problemas` como engineId disponible.
  - `engine-screens.tsx` tiene un `lazy` import hacia `./problemas/ProblemaScreen`.
  - `src/features/matematicas/problemas/ProblemaScreen.tsx` existe pero tiene 5 desviaciones:
    1. Usa layout vertical (operación alineada columnas) en lugar del horizontal de Electron (operación en fila `a op b = slots` con cajas grandes).
    2. El selector de tema no aplica `--theme-color` por tarjeta (Electron cambia borde/hover por tema).
    3. No hay etiquetas `D`/`U` (decenas/unidades) cuando la respuesta tiene 2 dígitos.
    4. En modo canvas (`DigitCell`) solo muestra 1 canvas activo para el dígito actual por columna; Electron renderiza 1 canvas por slot siempre, con estado `idle/correct/wrong` en cada uno.
    5. Composición del slot count: PWA actual usa `numCols` (igual que algoritmo vertical de suma), Electron usa 1 o 2 slots estrictamente por longitud de `answer`.
- Inventario actual `INVENTARIO_MIGRACION_ACTIVIDADES.md` fila `problemas`:
  - Generador: `Sí` (confirmado).
  - Tests actuales Electron: `0` (Electron no tenía test directo; el core PWA ya aporta 14).
  - Recursos: `Textos: revisar` (Textos ya están en el core, es safe de marcar como revisados).
  - Prioridad: `P1`.
  - Estado anterior: `P1` (sin ✅).

## Functional Requirements

- **FR-1** (Selector de tema): El renderer debe empezar en una pantalla de selector de 4 temas (Deportes ⚽, Animales 🐾, Clase ✏️, Naturaleza 🌿) con colores de borde/hover por tema como en `electron-reference ProblemaRenderer.tsx#L14-L38 y ProblemaRenderer.css#L176-L247`.
- **FR-2** (Sesión determinista): Al seleccionar un tema se llama a `generateSession(difficulty, seed, theme)` y se generan 10 ejercicios. Si seed es el mismo → misma sesión (ya en core, pero debe observarse en UI).
- **FR-3** (Cabecera): Todas las pantallas (selector, ejercicio, resumen) usan `ActivityHeader` Dumpling con `onExit`, `gradeTitle`, `unitTitle = activity.title`, `mascotUrl`, `difficultyStars` y —en modo ejercicio— `progress = (currentIndex+1)/total`.
- **FR-4** (Modos de entrada): Debe soportar `mode ∈ {"numpad", "canvas"}` vía `useInputMode()` e `InputModeToggle`, igual que `OperationsScreen`. En footer, modo `numpad` renderiza `Numpad`; en `canvas`, cada slot de dígito respuesta es un `LazyDigitCell` con su `state`, `value`, `isActive` propio.
- **FR-5** (Layout de ejercicio): En modo ejercicio se renderiza:
  - Tarjeta `prob__card` con `emoji` (52 px) + `story` (17 px semibold) + `question` (17 px extrabold violeta #6d28d9).
  - Bloque `OPERACIÓN` en fila: `a [prob__num-box] opSym [prob__num-box] = [prob__answer-slots]`. Tamaños y espaciado igual a Electron.
  - Bloque `SOLUCIÓN` con texto plantilla con `___` (en idle) o con valor real reemplazado y clase `prob__solution-text--filled` en correct.
  - Estados del stage: `ops__stage--correct` (verde degradado + `¡Muy bien! ⭐`), `ops__stage--wrong` (rojo degradado).
- **FR-6** (Slots de dígitos): El número de slots de respuesta es estrictamente 1 o 2, según `String(answer).length`. Si son 2, debe mostrar etiquetas `D` / `U` encima de cada slot, como Electron.
- **FR-7** (Validación):
  - Con `Numpad`: confirmar cuando se pulse Confirm y todos los slots llenos.
  - Con `DigitCell`: confirmar tras el último dígito (callback de `onConfirm` del último slot).
  - Se usa `validateAnswer(ex, combined)` (del core) tras hacer `digitValues.join("").trim()` — ya está validado.
  - Feedback sonoro vía `playFeedback(isCorrect)` (ya en capa Dumpling).
  - Si falla una vez, `alreadyFailed = true` → no suma punto al reintentar (mismo comportamiento que Electron).
- **FR-8** (Transiciones y avanzar):
  - En correcto: `setTimeout(handleNext, 1500)` (Electron 1500ms, PWA actual ya lo cumple).
  - En wrong: renderiza `ActionButtons(onRetry, onNext)` (ya en PWA).
- **FR-9** (Summary / Repetir): Al acabar los 10 ejercicios, se renderiza `SummaryScreen` con `SessionResult {total, correct, duration}`. `onRestart` debe regenerar sesión con el mismo `theme` del selector (no resetear tema a null).

## Non-Functional Requirements

- **NFR-1** (Calidad estática): En los archivos tocados (`ProblemaScreen.tsx`, `ProblemaScreen.css`, `INVENTARIO_MIGRACION_ACTIVIDADES.md`), pasar `prettier --check`, ESLint sin warnings/errors, `tsc -b` 0 errores.
- **NFR-2** (Tests): `npm test` debe pasar con 0 tests fallando (incluye los 14 tests de problemas existentes).
- **NFR-3** (Seguridad): No renderizar `story`/`question` sin sanitizar si en el futuro vinieran de fuente externa. Mientras vengan del core interno de `generateSession` (strings estáticos) no hay riesgo; documentar en comentario del ProblemaScreen que se recomienda `sanitizeText` si se paramétriza.
- **NFR-4** (Responsividad): El layout no debe romperse en anchos ≥ 360 px (móvil) hasta ≥ 1600 px (pizarra). Los tamaños de fuentes/cajas ya usan `clamp(...)` en el CSS actual; mantener y adaptar la nueva fila OPERACIÓN con clamp.

## Constraints

- **Technical**:
  - Seguir fielmente el guion de Electron y luego la capa Dumpling. **No inventar estados** (hard constraint de project_memory.md).
  - Reutilizar componentes Dumpling ya creados: `ActivityHeader`, `SummaryScreen`, `Numpad`, `LazyDigitCell`, `InputModeToggle`, `useInputMode`, `ActionButtons`, `playFeedback`. NO hacer implementaciones paralelas.
  - Lazy import ya configurado en `engine-screens.tsx` → no hay que añadir imports eager.
- **Business**:
  - Mantener 10 ejercicios por sesión (COUNT=10 en core), no más/menos.
  - Fácil/medio/difícil/expert = mismo comportamiento de rangos y operación que core.
- **Dependencies**:
  - `src/core/activities/problemas.ts` (fuente de verdad).
  - `electron-reference/Colegio/src/renderer/src/core/engines/problemas/` (referencia de layout y flujo).

## Assumptions

- El profesor aprueba mantener la desviación menor de usar `ActivityHeader` + `progress` (Dumpling) en lugar de `ExerciseHeader` de Electron (misma decisión que se tomó para suma/resta/contar/ordenar).
- El `levelId` no es necesario en ProblemaScreen (como en operaciones; el core usa solo difficulty). Si más adelante se liga currículo, se parametriza sin romper el signature actual de `EngineScreenProps`.

## Acceptance Criteria

### AC-1: Paridad de flujo frente a ProblemaRenderer.tsx de Electron

- **Type**: `rule`
- **Given**: `ProblemaScreen.tsx` con cualquier dificultad y seed fija.
- **When**: Se recorre la secuencia `Seleccionar tema → 10 ejercicios → Summary`.
- **Then**: Los cambios de estado son: 1) tema fijado y 10 ejercicios generados tras `startSession(theme)`; 2) cada ejercicio valida con `validateAnswer()`; 3) score solo crece si acierto a la primera; 4) al 10º ejercicio correcto o al pulsar Next en wrong se llega a Summary. El orden del core (determinista por seed) coincide con Electron misma seed+theme+dificultad.
- **Pass Condition**: (a) Código no difiere en semántica de estados con Electron (revisión por pares); (b) 2 semillas distintas reproducen 10 ejercicios iguales entre el core PWA y `electron-reference`'s `engine.ts`; (c) Test de componente que recorra 10 ejercicios por mock devuelve `finished.correct === score_esperado`.
- **Evidence**: Archivos `ProblemaScreen.tsx` fuentes; test `npm test` passing; diff semántico de estado documentado en `tasks.md` completion evidence.

### AC-2: Layout OPERACIÓN en fila (horizontales) como Electron

- **Type**: `rule`
- **Given**: Pantalla ejercicio de Problemas con `op=suma` y `answer=12` (2 dígitos).
- **When**: Se renderiza la zona OPERACIÓN.
- **Then**: Debe verse, de izquierda a derecha: `[caja grande a] [+] [caja grande b] [=] [slot D | slot U]`, cada uno con clase `prob__num-box`, `prob__op-sym`, `prob__answer-slots`, `prob__dab-slot` + etiqueta `D/U` sobre el slot izquierdo/derecho. No hay layout en columnas verticales.
- **Pass Condition**: Inspección visual + 1 rule de testing por texto (cada elemento visible del row se encuentra en el DOM renderizado).
- **Evidence**: Snapshot o tests de renderizado en `ProblemaScreen.test.tsx` si aplica; screenshot local o evidencia de revisión visual manual.

### AC-3: Tarjetas de tema con color por tema

- **Type**: `rule`
- **Given**: Pantalla selector de tema inicial.
- **When**: Se muestran las 4 tarjetas.
- **Then**: Cada `prob__theme-card` recibe `--theme-color: var(--color-primary)/#22c55e/#f59e0b/#10b981` en CSS inline (como referencia). Hover aplica `color-mix(in srgb, var(--theme-color) 12%, transparent)` y hover transform `scale(1.04)` / active `0.97`.
- **Pass Condition**: DOM renderizado contiene 4 botones con atributo `style` que contiene `--theme-color`.
- **Evidence**: Test unitario de render del selector + revisión visual.

### AC-4: Soporte Numpad + Canvas (2 dígitos) + Decenas/Unidades

- **Type**: `rule`
- **Given**: Una sesión con difficulty=hard (algunos answers=2 dígitos), `mode="numpad"`.
- **When**: Se alterna modo a `canvas` en un ejercicio de 2 dígitos de respuesta.
- **Then**: (a) en numpad, cada dígito se introduce correctamente desde unidades; (b) en canvas hay 2 `LazyDigitCell` activables con sus estados propios (solo 1 a la vez, pero 2 slots pintados); (c) labels `D` y `U` aparecen sobre los slots en ambos modos.
- **Pass Condition**: Test de integración que simule introducir `[1,5]` → answer = 15 → `validateAnswer=true` tras submit.
- **Evidence**: Test file + `npm test` passing.

### AC-5: Inventario actualizado a ✅ P1 migrada

- **Type**: `rule`
- **Given**: `docs/INVENTARIO_MIGRACION_ACTIVIDADES.md` fila `problemas`.
- **When**: Se cierra el hito.
- **Then**: Columna Prioridad muestra `✅ P1 migrada — motor, renderer (ProblemaScreen), SummaryScreen, audio, Numpad, DigitCell, ActionButtons, 14 tests core; validación manual pendiente`. Columna `Generador = Sí`; Columna `Recursos = Textos (story/question) auditados: vienen del core puro, sanitizar solo si se parametriza a futuro`.
- **Pass Condition**: Fila aparece con ✅ y texto acordado. Prettier pasa en el doc.
- **Evidence**: git diff del md.

### AC-6: Calidad estática (lint / prettier / typecheck)

- **Type**: `rule`
- **Given**: Cualquier cambio commitado.
- **When**: Ejecuto `npm run format:check && npm run lint && npm run typecheck`.
- **Then**: Exit code 0, 0 warnings en ESLint, 0 warnings tsc, 0 diferencias prettier.
- **Pass Condition**: Exit 0 en los 3 comandos.
- **Evidence**: `tasks.md` completion evidence con output truncado OK.

### AC-7: Tests unitarios core sin regresiones

- **Type**: `rule`
- **Given**: Rama actual después de cambios.
- **When**: `npm test`.
- **Then**: Todos los tests de `problemas.test.ts` (14) + resto del proyecto pasan, 0 failing.
- **Pass Condition**: Número de tests passing = actual (≥565) y exit 0.
- **Evidence**: Output npm test truncado con resumen.

### AC-8: Fidelidad pedagógica y usabilidad en pizarra (rubric)

- **Type**: `rubric`
- **Dimension**: Fidelidad de layout/legibilidad frente al renderer de referencia, y facilidad de uso en pizarra digital de 55" (1600 px o más).
- **Scale**: 1-5
- **Anchors**: 1 = layout roto o ilegible en pizarra; 3 = usable pero con diferencias notables de tamaños/espaciado vs Electron; 5 = paridad pixel-perfect en el layout y transiciones, slots grandes para dibujar dedo/lápiz.
- **Pass Threshold**: >= 4 (diferencias solo en header por usar ActivityHeader)
- **Evidence**: Revisión manual local + screenshot de cada pantalla. Tamaño mínimo caja de dígito `prob__num-box` = 80 px.

## Open Questions

- [x] ¿Cerrar con `levelId` en ProblemaScreen? Respuesta: No. El core problemas no currícula nivelado todavía (usa solo difficulty). Se añade en el futuro igual que counting.
- [x] ¿Añadir test de componente ProblemaScreen? Respuesta: Sí, mínimo 1 smoke de recorrido de flujo + render del selector y operación en fila para cubrir AC-1 / AC-2 / AC-4 parcial (opcional si el tiempo aprieta, pero recomendado para regresiones).
