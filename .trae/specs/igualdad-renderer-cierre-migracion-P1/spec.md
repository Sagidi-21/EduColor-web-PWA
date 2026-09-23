# Specification: Cierre renderer `igualdad` P1

## 1. Problem

El renderer PWA `IgualdadScreen` (core `igualdad`, P1) existe en código pero su estado no está cerrado ni verificado contra el guion de `electron-reference`. No tiene smoke tests, no hay pipeline cerrado y no figura en el inventario de migración como ✅ P1 migrada. Esto impide cerrar el último motor P1 del roadmap y acumularlo junto al resto para la validación manual en pizarra de golpe.

## 2. Users & Goals

- **Docente / niño usuario final** del catálogo: completar la actividad "Igualdad de sumandos" (a + b = ___) con fidelidad pedagógica igual a la versión Electron, imágenes por categoría para "resultado", feedback correcto/equivocado, scoring y resumen final.
- **Equipo EduColor**: cerrar el inventario P1 completamente (último renderer con generador listo), mantener `electron-reference` como fuente de verdad absoluta y pasar a la fase de validación manual pedagógica en batch.
- **Validador / QA**: asegurar 0 errores de lint/Prettier/typecheck y tests Vitest 100% verdes antes del commit.

## 3. Non-Goals

- No se implementa `mode="canvas"` con DigitCell (Electron no lo usa; Igualdad es selector de opciones, no ingreso de dígitos). Si existe `useInputMode` se ignora o mockea en tests pero no se consume.
- No se inventan tipos, opciones ni distractores del core. `igualdad.ts` es fuente de verdad y no se toca.
- No se cambia la API de core (validateAnswer, generateSession) ni su configuración por dificultad.
- No se añaden tests E2E Playwright (queda reservado `tests/` para E2E; D-015).
- No se realiza la validación pedagógica manual en esta tarea; queda acumulada con `suma`, `resta`, `numeracion1119`, `ordenar`, `seriesNumericas`, `vecinosNumero`, `problemas` para batch posterior.

## 4. Functional Requirements (FR)

| ID    | Rule/Rubric | Text                                                                                                                                                        |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | `rule`      | IgualdadScreen renderiza 10 ejercicios tras `generateSession(difficulty, seed)`. 0 ejercicios iniciales o current null → retorna `null`.                    |
| FR-2  | `rule`      | Para cada dificultad, el tipo de ejercicio coincide con el core: easy=resultado, medium=resultado+sumando, hard=+descomposicion, expert=mixed.              |
| FR-3  | `rule`      | Tipo `resultado` renderiza fila de imágenes `a` copias de `imageUrl` + `+` + `b` copias, siempre que `imageUrl != ""`. expert → sin imágenes.               |
| FR-4  | `rule`      | Fórmula por tipo (mapeo PWA vs core): resultado=`a + b = ___`, sumando=`___ + b = c`, descomposicion=`c = ___ + ___`. Revealed=`correct` muestra respuesta. |
| FR-5  | `rule`      | Opciones: 4 botones tipo `number`/`string`. descomposicion muestra `a + b` (espaciado). disabled cuando `answerState!=idle`.                                |
| FR-6  | `rule`      | Selección correcta → `igl__stage--correct`, opción `--correct`, `playFeedback(true)`, `¡Muy bien! 🎉` celebration + `setTimeout(handleNext, 900)`.          |
| FR-7  | `rule`      | Selección equivocada → `igl__stage--wrong`, opción `--wrong`, `playFeedback(false)`, `ActionButtons onRetry/onNext`. Sin autoavance.                        |
| FR-8  | `rule`      | Scoring `correctCount` sube solo si `ok && !alreadyFailed`. `alreadyFailed=true` al primer fallo; `false` al avanzar.                                       |
| FR-9  | `rule`      | Al terminar 10/10 se renderiza `SummaryScreen(result)` con `onRestart` = `freshSession` misma difficulty + seed, `onExit = props.onExit`.                   |
| FR-10 | `rule`      | `SummaryScreen.onRestart` **no** cambia difficulty ni vuelve al selector; conserva `seed/gradeTitle`.                                                       |

## 5. Non-Functional Requirements (NFR)

| ID    | Rule/Rubric | Text                                                                                                                                                                                              |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | `rule`      | `IgualdadScreen.tsx` sigue el contrato `EngineScreenProps` y usa solo componentes reutilizados: `ActivityHeader`, `SummaryScreen`, `ActionButtons`.                                               |
| NFR-2 | `rule`      | No hay reglas de Hooks rotas (React Hooks Rules). Ningún `useMemo/useCallback/useState/useEffect` después de `early return` (`finished` / `!current`).                                            |
| NFR-3 | `rule`      | `img alt=""` para imágenes de categoría para cumplir a11y. Sin texto que pida interpretación estética.                                                                                            |
| NFR-4 | `rule`      | Pipeline 0 errores. `format:check`, `lint`, `typecheck`, `npm test` exit 0.                                                                                                                       |
| NFR-5 | `rule`      | Prettier formatea docs/ y source/. 0 warnings en ESLint.                                                                                                                                          |
| NFR-6 | `rubric`    | Fidelidad visual vs Electron (IgualdadRenderer.css). Scale 1-5: 1=divergente; 3=similar gaps/fuentes distintos; 5=idéntico. Threshold >= 4. Evidencia: screenshots lado a lado (pendiente batch). |
| NFR-7 | `rule`      | Test count: al menos 12 core + 5 smoke renderer = 17 tests para igualdad.                                                                                                                         |
| NFR-8 | `rule`      | Inventario actualizado: `igualdad` = `✅ P1 migrada` con tests (12+5 smoke) y descripción de estado.                                                                                              |

## 6. Constraints

- **Fuente de verdad estricta**: Seguir el guion de `electron-reference/Colegio/src/renderer/src/core/engines/igualdad/IgualdadRenderer.tsx` y `.css`. Excepción: mapeo de tipos inglés→español (`result`→`resultado`, `addend`→`sumando`, `decompose`→`descomposicion`) ya que el core PWA usa nombres ES; mapeo auditado y cerrado, no se tocan los nombres.
- **No inventar lógica**: Valores como `setTimeout(900)`, `alreadyFailed`, `4 options` están en Electron y no se modifican.
- **Husky pre-commit/pre-push**: Se ejecuta en commit; si detecta errores hay que corregirlos antes de push.
- **Exclusión Vitest carpeta tests/**: (D-015) ya configurado en `vite.config.ts`. No mover smoke tests a `tests/`.
- **Seguridad**: `imageUrl` sale de `pickImage` con rutas de `src/assets/objects/...`; sanitización no es estrictamente necesaria pero se aconseja `alt=""`.

## 7. Dependencies

- Core: `src/core/activities/igualdad.ts` (exporta `generateSession`, `validateAnswer`, `IgualdadExercise`, `IgualdadType`).
- Core tests: `src/core/activities/igualdad.test.ts` (12 tests existentes, no se tocan).
- Componentes Dumpling: `ActivityHeader`, `SummaryScreen`, `ActionButtons`.
- Assets `src/assets/objects/{coches,flores,globos,manzanas,minions,monstruos,pajaros}` (coinciden con `IMAGE_CATEGORIES` de `objectImages.ts`; usado por `pickImage`).
- Smoke tests dependen de `@testing-library/react` y `happy-dom` (configurados).

## 8. Assumptions

- `useInputMode` no se usa en Igualdad. En tests se mockea si el storage causa errores; en renderer se puede omitir importación.
- `seed` pasado por `EngineScreenProps` es entero estable (ej: 12345, 42) para repetibilidad de tests.
- `gradeTitle`, `difficultyStars`, `mascotUrl` son opcionales; si `undefined` se dejan defaults de `ActivityHeader`.
- `ActionButtons` ya implementa onRetry/onNext con iconos/estilos coherentes; no se cambian.

## 9. Open Questions

- ¿Se debe renderizar `type "sumando"` con imágenes al igual que "resultado"? La referencia NO lo hace (solo `type === "result" && imageUrl`). Se sigue ESTA regla (solo resultado renderiza img row).

## 10. Acceptance Criteria (AC)

| ID   | Type     | Statement                                                                                                                                                                                                                   |
| ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | `rule`   | `npm test` exit 0 sobre `igualdad.test.ts + IgualdadScreen.test.tsx`.                                                                                                                                                       |
| AC-2 | `rule`   | `npm run lint` exit 0, 0 warnings sobre archivos tocados.                                                                                                                                                                   |
| AC-3 | `rule`   | `npm run typecheck` exit 0, 0 diagnostics.                                                                                                                                                                                  |
| AC-4 | `rule`   | `npm run format:check` exit 0 (docs/ y source/).                                                                                                                                                                            |
| AC-5 | `rule`   | `IgualdadScreen.test.tsx` smoke tests: 5 tests pasan → verifica tipos de dificultad, imageUrl en expert/non-expert, flujo correcto renderiza `¡Muy bien! 🎉`, scoring `alreadyFailed` no sube, Restart conserva difficulty. |
| AC-6 | `rule`   | Hooks Rules intacto: ninguno de `use*` está tras `if (finished)` o `if (!current) return null`. Verificado por ESLint rule `react-hooks/rules-of-hooks`.                                                                    |
| AC-7 | `rule`   | INVENTARIO_MIGRACION_ACTIVIDADES.md línea `igualdad` empieza por `✅ P1 migrada`.                                                                                                                                           |
| AC-8 | `rubric` | Fidelidad visual y pedagógica vs Electron. Scale 1-5, threshold >= 4. (Pendiente validación manual batch.)                                                                                                                  |
