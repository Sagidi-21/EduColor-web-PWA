# Problemas (P1) - Cierre renderer PWA - Implementation Plan

## Task 1: Migrar layout OPERACIÓN a fila y slots 1/2 dígitos con etiquetas D/U

- **Status**: `completed`
- **Priority**: high
- **Depends On**: None
- **Completion Evidence**:
  - Row `prob__op-row` implementada: operand a + opSym + operand b + `=` + `prob__answer-slots` (1/2 slots según `String(answer).length`).
  - Etiquetas `D`/`U` renderizadas condicionalmente sobre cada slot cuando `isTwoDigits`.
  - Layout vertical eliminado (no existen clases `prob__vertical*` en el código).
  - Corregido bug de Hooks Rules: `safeStory/safeQuestion/solutionText` movidos antes de los early returns.
  - `npm run lint` exit 0 (0 errores); `typecheck` 0 errores; `npm test` 565/565.

## Task 2: Aplicar colores por tema en tarjetas del selector

- **Status**: `completed`
- **Priority**: high
- **Depends On**: None
- **Completion Evidence**:
  - Array `THEMES` tiene `color` por tema (var(--color-primary), #22c55e, #f59e0b, #10b981).
  - `.prob__theme-card` renderiza `style={{ "--theme-color": t.color }}`.
  - CSS: `border: 3px solid var(--theme-color)`, `hover` con `color-mix(12%) + scale(1.04)`, `:active scale(0.97)`.
  - `.prob__theme-label` usa `var(--theme-color)` para el texto.
  - `npm run format:check` + Prettier OK sobre los 3 archivos afectados.

## Task 3: Alinear estados y transiciones (score+alreadyFailed, timeout 1500, Restart mantiene tema)

- **Status**: `completed`
- **Priority**: high
- **Depends On**: Task 1
- **Completion Evidence**:
  - `correctCount` incrementa solo si `!s.alreadyFailed` (línea submitDigits callback).
  - `alreadyFailed = true` al primer fallo; reseteado a `false` al avanzar (`handleNext`).
  - Autoavance correct: `setTimeout(handleNext, 1500)` (líneas 195-199).
  - `handleRestart()` usa `session.theme` → nueva sesión mantiene tema, no vuelve al selector.
  - Estado inicial `exercises: []`, `theme: null` (líneas 63-73). 10 ejercicios solo se generan tras `startSession(t.id)`.
  - Pipeline verde: `format:check` + `lint` + `typecheck` + `npm test` (565 tests).

## Task 4: Preparar seguridad y comentario sobre sanitización preventiva

- **Status**: `completed`
- **Priority**: medium
- **Depends On**: None
- **Completion Evidence**:
  - Función `sanitizeText` definida en ProblemaScreen.tsx (líneas 37-43): elimina HTML, `javascript:` y atributos `on*=`.
  - `safeStory`, `safeQuestion` y `solutionText` se computan mediante `sanitizeText(...)` sobre los literales del core.
  - Comentario líneas 285-288 antes de la sección ejercicio: "NOTE: story, question y solutionTemplate hoy se generan con literales internos del core... sanitización ya evita XSS por HTML, `javascript:` o atributos on*=".
  - `npm run format:check` exit 0 sobre ProblemaScreen.tsx.

## Task 5: Añadir smoke test de ProblemaScreen (selector + flujo 1 ejercicio)

- **Status**: `completed`
- **Priority**: medium
- **Depends On**: Tasks 1, 2, 3
- **Completion Evidence**:
  - Archivo creado: `src/features/matematicas/problemas/ProblemaScreen.test.tsx`.
  - 5 tests (5/5 passed):
    1. TR-2.1 — selector inicial 4 tarjetas de tema + `--theme-color` inline distintas.
    2. TR-3.1 — estado inicial sin OPERACIÓN/SOLUCIÓN; tras startSession aparecen los bloques.
    3. TR-1.2 — no existe clase `prob__vertical*` después de seleccionar tema (layout vertical eliminado).
    4. Flujo end-to-end: click Deportes → introduce dígitos correctos via Numpad (orden U→D) → Confirm → renderiza "¡Muy bien! ⭐".
    5. TR-4.1 — el source de ProblemaScreen.tsx contiene comentario alusión a `sanitizeText` + literales del core.
  - `npx vitest run ...ProblemaScreen.test.tsx` exit 0 (5 passed).
  - `npm run lint` 0 errores sobre el archivo; `format:check` OK; `typecheck` OK; `npm test` 570/570.

## Task 6: Actualizar INVENTARIO_MIGRACION_ACTIVIDADES.md fila problemas

- **Status**: `completed`
- **Priority**: high
- **Depends On**: Tasks 1, 2, 3, 4, 5
- **Completion Evidence**:
  - Línea `problemas` del inventario actualizada:
    - `Tests actuales`: `15` (14 core + 1 smoke renderer).
    - `Recursos`: `Textos (story/question) auditados. Literales del core; sanitización preventiva aplicada en comentario de renderer para caso de parámetros externos futuros.`
    - `Prioridad`: `✅ P1 migrada — motor, renderer (ProblemaScreen), selector tema, operación fila, D/U, Numpad, DigitCell (ML), ActionButtons, SummaryScreen, audio, 14 tests core + 1 smoke renderer; validación manual pedagógica pendiente en pizarra.`
  - Grep por la línea `problemas` en INVENTARIO muestra `✅ P1 migrada`.
  - Archivo formateado: `npx prettier --write docs/INVENTARIO_MIGRACION_ACTIVIDADES.md` → `format:check` exit 0.

## Task 7: Validación estática + tests de suite completa

- **Status**: `completed`
- **Priority**: high
- **Depends On**: All others
- **Completion Evidence**:
  - TR-7.1 `format:check`: ✅ `All matched files use Prettier code style!` (exit 0).
  - TR-7.2 `lint`: ✅ exit 0, 0 warnings en archivos tocados.
  - TR-7.3 `typecheck`: ✅ `tsc -b` exit 0, 0 diagnostics.
  - TR-7.4 `npm test` (Vitest): ✅ `Test Files 54 passed (54)`, `Tests 570 passed (570)`.
  - TR-7.5 Rubric (fidelidad pedagógica y legibilidad en pizarra): PENDIENTE de validación manual en pizarra/tableta y feedback pedagógico. Threshold >= 4. Evidencia: screenshots selector / ejercicio 1-2 dígitos / SummaryScreen por realizar por el usuario final.
