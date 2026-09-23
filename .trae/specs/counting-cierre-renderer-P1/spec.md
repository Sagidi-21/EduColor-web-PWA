# Spec — counting — cierre renderer P1 (Fase 2 prioridad 1)

**Nº interno:** SPEC-counting-P1-close-v1  
**Fecha inicial:** 2026-09-23  
**Responsable implementación:** Agente  
**Fuente de verdad (regla estricta):** `electron-reference/Colegio/src/renderer/src/core/engines/counting/engine.ts` + `CountingRenderer.tsx`; **NO inventar lógica ni estados no presentes en Electron.**

---

## 1. Problema

La actividad **`counting`** ("Contamos objetos") está presente en la PWA con:

- Manifiesto `src/manifests/activities/counting.json`
- Núcleo `src/core/activities/counting.ts` + 58 tests Vitest PASSED (incluye 8 niveles curriculares extra)
- Renderer `src/features/matematicas/counting/CountingScreen.tsx` con 8 mecánicas extendidas: `TOUCH`, `GROUP`, `DRAG`, `FILL_TABLE` + `SELECT`, tanto dificultades `easy/medium/hard/expert` como niveles curriculares `1-L1…2-L4`
- Registro lazy loading + routing en `engine-screens.tsx`

Sin embargo, el **Inventario INVENTARIO_MIGRACION_ACTIVIDADES.md fila counting (L20)** sigue marcando:

- **Prioridad:** `P1` (sin el prefijo ✅ migrada)
- **Tests actuales:** `2` (solo los de Electron), no los 58+6 que ya existen en PWA
- **Recursos:** genéricos, sin la detallada lista de categorías usadas por `IMAGE_CATEGORIES` en `src/platform/objectImages` (coches, flores, globos, manzanas, minions, monstruos, pájaros, …).

Esto produce **discrepancia documental** con el resto de P1 cerradas recientemente (`igualdad`, `problemas`, `numeracion4059/6099/999`, `leftRight`, `tresSumandos`, `relacionar`, `comparison`, `ordenar`, `seriesNumericas`, `vecinosNumero`, `numeracion1119`, `suma`, `resta`) y obliga a una auditoría de doble-guion real antes de marcar el cierre.

## 2. Usuarios / Partes implicadas

- Docente de 1.º y 2.º de Primaria: **usa counting como puerta de entrada al módulo de números** (es la actividad con `order: 4` en el manifiesto).
- Alumno/a de aula/pizarra digital: interactúa mediante TOUCH, drag de decenas, Numpad y escritura en DigitCell (LazyDigitCell, code-split TensorFlow).
- Auditora/Agente: requiere trazabilidad exacta con `electron-reference` y cero regresiones en pipeline `format/lint/typecheck/test`.

## 3. Objetivo

**Cerrar técnicamente el último motor P1 compartido pendiente** del roadmap Fase 2 (apartado 118): _"Compartidas 1.º/2.º: conteo, ordenar, comparación, suma/resta, series, vecinos, números, igualdad, recta, lateralidad y problemas simples"_. Tras este spec, todas las 10 actividades del bloque 1 del roadmap tienen `✅ P1 migrada` + 5 tests smoke renderer + pipeline verde.

## 4. No-Goals (explícitos)

- **No** rediseñar layout ni cambiar tamaños de `counting__object` / `counting__option` hoy (validación visual en pizarra se hará en batch pedagógico con los otros 7+ motores).
- **No** tocar el core `counting.ts` ni `counting.test.ts` (58 tests PASSED fuera del scope).
- **No** migrar las mecánicas extendidas `GROUP/DRAG/FILL_TABLE` desde cero — ya existen; la tarea es **auditar** que siguen la semántica Electron básica (idle/correct/wrong, scoring, restart) y documentar las divergencias intencionales en CHANGELOG.
- **No** implementar tests E2E en `tests/` (carpeta reservada a Playwright por decisión D-015).
- **No** ejecutar validación manual pedagógica hoy (item pendiente batch pizarra junto a `suma/resta/ordenar/series/vecinos/numeracion1119/igualdad/problemas`).

---

## 5. Requisitos Funcionales (FR)

> Fuente canónica para cada FR: ficheros `electron-reference/counting/*.tsx` y campos del core PWA `src/core/activities/counting.ts` `PRESET_CONFIGS` y `CURRICULUM_LEVELS`.

- **FR-1 – Dificultades básicas (preset):** Para `difficulty ∈ {easy, medium, hard, expert}` y `seed` dado, el renderer llama a `generateSession(cfg, seed)` donde `cfg = PRESET_CONFIGS[difficulty]`. Los rangos son:
  - easy: `minCount=1, maxCount=5, randomLayout=false, quantity=10`
  - medium: `minCount=1, maxCount=10, randomLayout=true, quantity=10`
  - hard: `minCount=5, maxCount=10, randomLayout=true, quantity=10`
  - expert: `minCount=10, maxCount=20, randomLayout=true, quantity=10`
- **FR-2 – Niveles curriculares (si `levelId`):** Si `levelId ∈ CURRICULUM_LEVELS` (8 niveles `1-L1…1-L4` y `2-L1…2-L4`), se usa `generateSessionForLevel(levelId, seed)` en lugar del preset y se muestra `InputModeToggle` sólo en los niveles con mecanica `FILL_TABLE` (1-L4, 2-L3, 2-L4).
- **FR-3 – Scoring `correctCount`:** `correctCount++` si y solo si respuesta correcta `AND !s.alreadyFailed` (igual que Electron L52). Un segundo intento (Retry) **no** recupera el punto (feedback pedagógico).
- **FR-4 – Avance automático:** Estado `answerState === "correct"` → `setTimeout(handleNext, 900)` (exactamente 900 ms, igual que Electron L88; NO 1200 ms como valor PWA provisional actual).
- **FR-5 – Semántica SummaryScreen Restart:** `setSession({ …, exercises: generateSession(…, Date.now() % 999983) })` sin reutilizar `seed` original (igual que Electron L95). Garantiza 10 ejercicios nuevos por restart con probabilidad 1 (módulo primo grande).
- **FR-6 – Flujo 1 paso por ejercicio (preset):** Para dificultades preset (sin levels), `Exercise` → 1 solo paso con prompt/count de objetos; `currentStepIndex` siempre 0. Para niveles curriculares (1-L2, 2-L2, etc.), se respetan los múltiples steps del core (TENS/UNITS/TOTAL/COMPOSE_NUMBER/COMPOSE).
- **FR-7 – Bloqueo UI mientras feedback:** Todas las opciones `.counting__option` tienen `disabled={answerState !== "idle"}`. Idéntico para celdas de DigitCell y teclas de Numpad.
- **FR-8 – `ActionButtons` / WrongFeedback:** Tras `answerState = "wrong"` se renderiza ActionButtons con `onRetry` y `onNext`. Tras `correct` autoavance 900 ms.
- **FR-9 – a11y imágenes:** Todo `counting__object`, `counting__package-icon`, `counting__ten-bundle-icon` lleva `alt={current.objectLabel}`. NUNCA alt vacío ("") en objetos contables (pautas WCAG 2.1 AA 1.1.1: las imágenes portadoras de contenido educativo necesitan alt descriptivo; las decorativas alt="").
- **FR-10 – Mecánicas extendidas (sólo validar flujo básico):**
  - `TOUCH`: habilitar botones solo cuando `touchedIndices.length === current.count`.
  - `GROUP`: drag decenas a `.counting__containers-zone` → `allTouched` cuando `filledGroupIndices.length === numCompleteGroups`.
  - `DRAG`: drag decenas (groupFrames.isComplete=true) a `data-drop-zone="tens"`, unidades a `"units"`; si soltar en zona equivocada feedback sonoro error.
  - `FILL_TABLE` (canvas mode): celda D y U (1.º) o C/D/U (2.º) con `LazyDigitCell`; numpad mode autoavanza entre celdas tras dígito.
- **FR-11 – Registro y routing:** El motor se carga via `React.lazy` en `engine-screens.tsx` y matchea `engineId === "counting"` con `Suspense fallback`. No hay imports top-level que rompan el code-split.

## 6. Requisitos No-Funcionales (NFR)

- **NFR-1 – Hooks Rules de React (OBLIGATORIO):** Todos los hooks de `CountingScreen.tsx` (`useState`, `useCallback`, `useEffect`, `useMemo`, `useRef`, `useInputMode`) deben declararse ANTES de cualquier early return. Prohibido cualquier hook después de `if (finished || !current)` o `if (!current) return null`.
- **NFR-2 – Calidad código:** 0 warnings de ESLint y TypeScript diagnostics en archivos tocados (`CountingScreen.tsx`, `CountingScreen.css`, `CountingScreen.test.tsx`, `INVENTARIO_MIGRACION_ACTIVIDADES.md`).
- **NFR-3 – Formato Prettier:** `format:check` exit 0 en el worktree después de los cambios aplicados por `tasks.md`.
- **NFR-4 – Cobertura smoke renderer:** 5 tests rule-based en `CountingScreen.test.tsx` (mínimo 5, máximo 8 si uno de ellos es auditoría Hooks). Vitest PASSED 100% sin `skip`.
- **NFR-5 – Audio unificado:** Usar `playFeedback(isCorrect)` y `playPop()` (para TOUCH/GROUP/DRAG drag-drop exitoso) desde `src/features/shared/audioFeedback.ts`; NO imports directos de `playCorrect` de Electron ni `window.api`.
- **NFR-6 – Independencia core:** El renderer NO muta state del core ni exporta side-effects a `src/core/activities/counting.ts`; todo state vive en React `useState` del componente.
- **NFR-7 – Performance DigitCell:** `LazyDigitCell` via `React.lazy` (reutilizado desde `src/features/shared/DigitCell`). TF.js ~890 kB gzipped sólo se carga en pantallas con FILL_TABLE.
- **NFR-8 – Trazabilidad / Documentation Lag:** Inventario actualizado antes de cerrar pipeline; las filas L20, L32, L49, L50, L51, L63, L66, L67 del inventario con contenido duplicado/tabla rota (descubierto en commit 0232026) quedan FUERA del scope de ESTE spec; se anotarán como DT-011 para corrección de inventario batch posterior.
- **NFR-9 – Divergencias documentadas:** Cualquier desviación intencional de `CountingRenderer.tsx` (p.ej. delay 1200 → 900, o existencia de 8 mecánicas vs el 1 original) se anota en `docs/MIGRACION_CHANGELOG.md` siguiendo formato de filas 1-16 existentes.

## 7. Restricciones / Constraints Hard

1. **PROHIBIDO INVENTAR LÓGICA:** Cualquier estado/scoring debe tener contraparte confirmada en `electron-reference/counting/CountingRenderer.tsx` líneas 1-243 **O** en la decisión explícita de la PWA de añadir mecánicas extendidas (GROUP/DRAG/FILL_TABLE), documentada en CHANGELOG.
2. **Timeout 900ms FIJO:** NO cambiar el delay post-correcto a otro valor; la referencia Electron L88 es canónica.
3. **Scoring `alreadyFailed` FIJO:** `ok && !s.alreadyFailed → correctCount++`. No implementar scoring parcial ni penaltis.
4. **Rangos preset FIJOS:** easy 1-5 / medium 1-10 / hard 5-10 / expert 10-20 según `PRESET_CONFIGS` de ambos proyectos.
5. **Imágenes NO placeholder:** Las `imageUrl` proceden de `src/platform/objectImages.ts` (categorías auditadas); **NO** se admiten placeholders `https://coresg-normal…` en counting ni actividades V1.
6. **Husky pre-commit/pre-push:** Cualquier commit creado durante `tasks.md` debe pasar `prettier --write` (pre-commit) y `format:docs:check` (pre-push).

## 8. Dependencias / Assumptions

- ✅ Assumption A1: Core `counting.ts` + 58 tests PASSED (confirmado 2026-09-23 con vitest).
- ✅ Assumption A2: Registro engine-screens confirmado (lazy L35 + routing L146).
- ✅ Assumption A3: Componentes compartidos reutilizados existen: `ActivityHeader`, `SummaryScreen`, `ActionButtons`, `playFeedback`, `LazyDigitCell`, `Numpad`.
- ✅ Assumption A4: Recursos en `src/platform/objectImages.ts` tienen imágenes listas para web (rutas `src/assets/objects/*.png` ya copiadas).
- ⏳ Assumption A5 (pendiente): La validación manual pedagógica (TR-6.5 equivalente) se hará **post-cierre técnico** junto a los otros P1/P2, sin bloquear el cierre.

## 9. Preguntas abiertas

1. **OQ-1 — `alreadyFailed` en pasos múltiples de niveles:** Para ejercicios con 2-4 pasos (1-L2, 2-L2), `alreadyFailed` debe resetearse en cada cambio de `currentStepIndex` (igual que ya hace handleNext de CountingScreen L164 `alreadyFailed: false`) **o** persistir por ejercicio? **Decisión provisional (necesario confirmar):** respetar el comportamiento actual del CountingScreen PWA, ya que en Electron no existe steps múltiples (no hay levels) y no hay contraparte. Documentar en CHANGELOG como divergencia intencional.

---

## 10. Criterios de Aceptación (Acceptance Criteria)

Cada AC se prueba mediante 1 o más Test Requirements (`rule` o `rubric`) en `tasks.md`. Ningún AC tiene tipo distinto a `rule` o `rubric`.

| ID    | Type     | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Evidencia mínima                                                                                                     |
| :---- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `rule`   | Pipeline 4 checks verde: `npm run format:check` exit 0, `npm run lint` exit 0 (0 warnings), `npm run typecheck` exit 0 (0 diagnostics), `npx vitest run src/core/activities/counting.test.ts src/features/matematicas/counting/CountingScreen.test.tsx` exit 0 — 0 failed.                                                                                                                                                                                     | Salida comandos con exit codes + número tests passed                                                                 |
| AC-2  | `rule`   | FR-3 Scoring `alreadyFailed`: tras click opción errónea → Retry → click correcto, `correctCount` no incrementa.                                                                                                                                                                                                                                                                                                                                                | Smoke test CountingScreen: 2 intentos mismo ejercicio + aserción summary `{correct: N}`                              |
| AC-3  | `rule`   | FR-4 Avance automático delay=900ms: grep exacto 1 occurrence `setTimeout(handleNext, 900)` en `CountingScreen.tsx` y NO 1200 ni 1500.                                                                                                                                                                                                                                                                                                                          | Grep L count + diff si aplica                                                                                        |
| AC-4  | `rule`   | FR-5 Restart `Date.now() % 999983` vs reutilizar `seed`: grep 1 occurrence en `handleRestart` + smoke test: montar screen con seed=1 → restart → sesión-2 !== sesión-1 (objectLabel o positions distintas).                                                                                                                                                                                                                                                    | Grep output + test vitest                                                                                            |
| AC-5  | `rule`   | NFR-1 Hooks Rules: 0 hooks declarados DESPUÉS del primer early return (línea con `if (finished                                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                      | !current)`o`if (!current)`). | Auditoría léxica test smoke adicional (igual que IgualdadScreen.test.tsx TR-4.6) |
| AC-6  | `rule`   | NFR-4 ≥5 smoke tests renderer PASSED.                                                                                                                                                                                                                                                                                                                                                                                                                          | Salida Vitest verbose listado 5+ test names con ✓                                                                    |
| AC-7  | `rule`   | FR-9 a11y: Easy seed=12345 renderiza N imágenes `counting__object` y todas tienen `alt === current.objectLabel` (no empty).                                                                                                                                                                                                                                                                                                                                    | Smoke test: `screen.getAllByRole('img')[0].getAttribute('alt') !== '' && === objectLabel`                            |
| AC-8  | `rubric` | Fidelidad pedagógica/visual vs Electron `counting/CountingRenderer.tsx`. Escala 1-5, threshold ≥4. Anclas: 1=layout roto/no options, 2=options sin estilos, 3=objects + options correctas pero sin feedback, 4=parity + feedback, 5=pixel-perfect + celebration.                                                                                                                                                                                               | Pendiente validación batch manual en pizarra; anotar `pending + justificación` en Task 6 TR-6.5, NO bloquear cierre. |
| AC-9  | `rule`   | Actualizar `INVENTARIO_MIGRACION_ACTIVIDADES.md` L20 (counting): Tests actuales = `58+6`, Recursos = lista categorías objectImages reales, Prioridad empieza por `✅ P1 migrada — motor, renderer 8 mecánicas (TOUCH/GROUP/DRAG/FILL_TABLE + SELECT), 4 dificultades, 8 niveles curriculares C/D/U, Numpad/DigitCell lazy, ActivityHeader, SummaryScreen, audio unificado, 58 tests core + 6 smoke renderer; validación manual pedagógica pendiente en batch.` | Grep exact match en L20                                                                                              |
| AC-10 | `rule`   | Entrada en `docs/MIGRACION_CHANGELOG.md` con las divergencias counting: (a) delay 1200→900, (b) ya no existe `cuantos()` helper, se usa `counting__instruction` y `step.prompt`, (c) 8 niveles curriculares y 4 mecánicas extra sobre Electron.                                                                                                                                                                                                                | Fila nueva en MIGRACION_CHANGELOG.md, fecha 2026-09-23, usuario "Agente"                                             |
