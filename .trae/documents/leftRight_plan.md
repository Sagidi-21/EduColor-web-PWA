# Migración leftRight (Izquierda y Derecha) — Plan de Implementación

## Repository Research

### Fuente de verdad: electron-reference/

**Motor:** `electron-reference/Colegio/src/renderer/src/core/engines/leftRight/engine.ts`
- Tipos: `Side = "izquierda" | "derecha"`, `LeftRightExercise` (regular, sin `kind`), `LeftRightCharExercise` (kind: `"char-click" | "char-drag-one" | "char-drag-both"`), `AnyLRExercise`, `DragObject`, `SessionResult`
- `generateSession(difficulty, seed)` → 10 ejercicios con semilla LCG determinista
  - **easy**: pares de objetos, pregunta "¿Dónde está el X?" → opciones [izquierda, derecha]
  - **medium**: pares de objetos, pregunta "¿Cuál está a la izquierda/derecha?" → opciones [objeto1, objeto2]
  - **hard**: 3 tipos mezclados (easy-like, medium-like, y "A está a la ___ de B")
  - **expert**: personajes con perspectiva frente/espaldas
    - ej 1-4: `char-click` → pulsar caja de la mano correcta (espejo: frente invierte, espaldas coincide)
    - ej 5-7: `char-drag-one` → arrastrar 1 objeto a la mano correcta (2 distractores)
    - ej 8-10: `char-drag-both` → arrastrar 2 objetos a 2 manos (2 distractores)
- `validateAnswer(ex, choice)` → comparación simple string
- Depende de: `IMAGE_CATEGORIES`, `pickImage` (objectImages), `CHARACTER_IMAGES` (characterImages)

**Renderer:** `electron-reference/Colegio/src/renderer/src/core/engines/leftRight/LeftRightRenderer.tsx`
- Layout: `<div className="lr">` → `ExerciseHeader` + `.lr__stage` + `.lr__footer`
- Estado interno: `session { exercises, currentIndex, correctCount, startTime, answerState, chosen, alreadyFailed }`, `finished`, `boxContent`, `dragRef` (imperativo, listeners nativos window)
- Callbacks clave:
  - `handleChoice(opt)` → valida, `playCorrect()`, actualiza contador (solo si no falló antes), `answerState`
  - `handleRetry` → limpia `answerState` y `chosen`, marca `alreadyFailed`
  - `handleNext` → avanza índice o finaliza
  - `handleObjDown` → drag imperativo con `pointermove`/`pointerup` nativos en window, `setPointerCapture` NO (Electron BrowserWindow issue)
  - Auto-avance `correct` → 900 ms `setTimeout`
- `WrongFeedback` inline compartido en footer solo cuando `answerState === "wrong"`
- Summary final → `SummaryScreen` compartido
- Footer en non-char mode: `lr__options` (botones de respuesta) + `WrongFeedback`

**CSS:** `LeftRightRenderer.css` (306 líneas)
- Variables de color: verde `#16a34a`, rojo `#dc2626`
- `.lr__stage--correct` / `.lr__stage--wrong` → cambia background
- `.lr__char-box` dashed vs solid correct/wrong
- `.lr__drag-obj` absolute position, touch-action: none
- Área de arrastre: `.lr__drag-area` relative, flex: 1, min-height 220px

**Generador fichas:** `leftRight.generator.ts` + `leftRight.generator.test.ts`
- Filtra ejercicios char (expert): solo toma `LeftRightExercise` (tipo regular con `leftObj/rightObj`)
- 1 test existente en Electron

### Recursos ya en PWA:
- ✅ `src/assets/izquierda-derecha/frente/*.png` — 5 personajes (monstruo azul/morado/naranja/verde, oso)
- ✅ `src/assets/izquierda-derecha/espaldas/*.png` — mismos 5 personajes de espaldas
- ✅ `src/assets/objects/*` — 7 categorías de objetos (coches, flores, globos, manzanas, minions, monstruos, pájaros)

### Convenciones PWA ya establecidas (AGENT_RULES Paso 2 mapeo):

| Electron | PWA Equivalente |
|---|---|
| `playCorrect()` / sounds | `playFeedback(ok: boolean)` en `src/features/shared/audioFeedback.ts` |
| `ExerciseHeader` | `ActivityHeader` en `src/features/matematicas/components/ActivityHeader.tsx` |
| `SummaryScreen` shared | `SummaryScreen` en `src/features/matematicas/components/SummaryScreen.tsx` |
| `WrongFeedback` shared | `WrongFeedback` en `src/features/matematicas/components/WrongFeedback.tsx` |
| `IMAGE_CATEGORIES`, `pickImage` | `src/platform/objectImages.ts` |
| `CHARACTER_IMAGES` — NO existe en PWA todavía | **Crear** `src/platform/characterImages.ts` (mismo patrón que objectImages.ts, glob a `izquierda-derecha/`) |
| `Date.now() % 999983` inline | Prop `seed` de `EngineScreenProps` |
| `props.title`, `props.gradeLabel` | `activity.title` + `gradeTitle` de `EngineScreenProps` |
| Registro renderer | Lazy en `engine-screens.tsx` |
| `engine-registry` | Añadir `"leftRight"` al `migratedEngines` Set |

### Familia similar en PWA:
- `RectaNumericaScreen.tsx` — drag & drop con Pointer Events + SVG (referencia para drag)
- `RelacionarScreen.tsx` — sesión de 10 rondas, layout header+main+footer (referencia para estructura)
- `IgualdadScreen.tsx` / `OrdenarScreen.tsx` — opciones de respuesta en footer + WrongFeedback

## Files and Modules

### A. Nuevos archivos
1. **`src/platform/characterImages.ts`** — módulo `CHARACTER_IMAGES` tipo `CharImage[]`, glob a `../assets/izquierda-derecha/**/*.png`
2. **`src/core/activities/leftRight.ts`** — core puro (sin React): tipos `Side`, `LeftRightExercise`, `LeftRightCharExercise`, `DragObject`, `AnyLRExercise`, `generateSession(difficulty, seed)`, `validateAnswer(ex, choice)`
3. **`src/core/activities/leftRight.test.ts`** — tests Vitest:
   - Semilla determinista (mismo seed → misma sesión)
   - Dificultad easy: 10 ejercicios, todos sin `kind`, answer ∈ {izquierda, derecha}
   - Dificultad medium: opciones son nombres de objeto, answer coincide con posición
   - Dificultad hard: 3 sub-tipos presentes en 10 ej
   - Dificultad expert: `char-click` en ej 1-4, `char-drag-one` en 5-7, `char-drag-both` en 8-10; respuesta espejo perspectiva
   - `validateAnswer` respuestas correctas/incorrectas
   - Sin imports React/navegador en core
4. **`src/features/matematicas/leftRight/LeftRightScreen.tsx`** — renderer PWA con named export `LeftRightScreen`
5. **`src/features/matematicas/leftRight/LeftRightScreen.css`** — CSS migrado/adaptado

### B. Archivos modificados
6. **`src/core/content/engine-registry.ts`** — añadir `"leftRight"` al `migratedEngines`
7. **`src/features/matematicas/engine-screens.tsx`** — lazy import y `if (activity.engineId === "leftRight")`
8. **`docs/INVENTARIO_MIGRACION_ACTIVIDADES.md`** — actualizar fila `leftRight` a "✅ P2 migrada"
9. **`docs/EJECUCION_PASO_A_PASO.md`** — añadir bloque "Seguimiento actual — leftRight"

## Implementation Steps (orden de dependencias)

### Paso 1 — Crear `src/platform/characterImages.ts`
- Usar mismo patrón que `objectImages.ts`: `import.meta.glob("../assets/izquierda-derecha/**/*.png", { eager: true })`
- Interface `CharImage { name: string; url: string; perspective: "frente" | "espaldas" }`
- Función `build()`: extrae `perspective` del nombre de carpeta (`frente`/`espaldas`), `name` del filename sin extensión
- Export `CHARACTER_IMAGES: CharImage[]`
- **NOTA**: Esta es la única pieza que no existía en PWA y es necesaria para el core. Se justifica porque `electron-reference/` también la tiene y ningún otro componente compartido la cubría.

### Paso 2 — Core: `src/core/activities/leftRight.ts` + tests
- Copiar lógica EXACTA de `electron-reference engine.ts` **sin alterar**
- Cambiar imports:
  - `IMAGE_CATEGORIES`, `pickImage` → desde `../../platform/objectImages`
  - `CHARACTER_IMAGES` → desde `../../platform/characterImages`
  - `Difficulty` → sustituir por `ActivityDifficulty` desde `../content/contracts` (o usar `"easy" | "medium" | "hard" | "expert"` directamente)
- Mantener intactos: LCG, `shuffle`, `randInt`, `charAnswer`, `charHandForBox`, `catLabel`, CATEGORY_LABELS, LABEL_ART, EMOJI_PAIRS, POS_POOL, textos preguntas, mapeo de dificultades, tipos de ejercicio expert
- **Tests en `leftRight.test.ts`** (mínimo 10):
  - Genera 10 ejercicios para cada dificultad
  - Mismo seed produce mismo output (golden: seed=42, easy=10 ej, answer de ej[0] = ...)
  - Easy: todos ejercicios regulares (sin kind), answer ∈ {"izquierda", "derecha"}
  - Medium: answer = leftObj cuando askLeft, rightObj cuando !askLeft
  - Hard: presencia de los 3 subtipos (posición i%3)
  - Expert ej 1-4: `kind === "char-click"` y `objects.length === 0`
  - Expert ej 5-7: `kind === "char-drag-one"`, `objects.length === 3`, 1 targetBox + 2 null
  - Expert ej 8-10: `kind === "char-drag-both"`, `objects.length === 4`, 2 targetBox + 2 null, answer === "both"
  - Perspectiva espejo: frente → charSide derecha → answer "box-left"
  - Perspectiva espaldas: charSide derecha → answer "box-right"
  - `validateAnswer` correcto e incorrecto

### Paso 3 — Renderer: `LeftRightScreen.tsx`
- **Named export** `export function LeftRightScreen(props: EngineScreenProps)`
- Importar todos los props de `EngineScreenProps`: `{ activity, difficulty, seed, onExit, gradeTitle, className, mascotUrl, difficultyStars }`
- **NO hacer default export**. Todas las props se pasan a `ActivityHeader` cuando aplican (incluir `className`, `mascotUrl`, `difficultyStars`)
- Estado siguiendo el original AL PIE DE LA LETRA:
  ```ts
  type AnswerState = "idle" | "correct" | "wrong";
  type BoxContent = { "box-left": number | null; "box-right": number | null };
  const [session, setSession] = useState(() => ({
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle" as AnswerState,
    chosen: null as null | string,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [boxContent, setBoxContent] = useState<BoxContent>(BOX_EMPTY);
  const dragRef = useRef<DragRef>({ ...DRAG_REF_IDLE });
  const boxLeftRef = useRef<HTMLDivElement>(null);
  const boxRightRef = useRef<HTMLDivElement>(null);
  ```
- **Sustituciones obligatorias (Paso 2 AGENT_RULES)**:
  - `ExerciseHeader` → `<ActivityHeader>` con `onExit`, `exitLabel="← Salir"`, `gradeTitle`, `className`, `unitTitle={activity.title}`, `difficultyStars`, `mascotUrl`, `progress={`${currentIndex+1} / ${total}`}`
  - `playCorrect()` → `playFeedback(true)`; `playWrong()` cuando hay wrong state → `playFeedback(false)` (ver callback handleChoice)
  - `SummaryScreen` inline de Electron → `<SummaryScreen>` compartido con `result`, `gradeLabel={gradeTitle || "Matemáticas"}`, `onExit`, `onRestart`
  - `WrongFeedback` Electron → `<WrongFeedback>` compartido con `onNext={handleNext}`, `onRetry={handleRetry}`
  - `Date.now() % 999983` en restart → usar `Date.now() % 999983` (consistente con otros renderers en restart)
- Drag & drop: **reutilizar el patrón imperativo con listeners nativos window** como el original (puntero real en pizarras). Adaptar:
  - Eliminar lógica de `zoom` del `body.style.zoom` (PWA no usa body zoom)
  - Mantener `devicePixelRatio` división
  - Usar `touch-action: none` en `.lr__drag-obj` (CSS)
  - Los listeners nativos window pointermove/pointerup con cleanup
- Footer: mismo orden que original → non-char: options + WrongFeedback; char-mode: solo WrongFeedback
- Auto-avance acierto: 900ms setTimeout, idéntico al original
- Importar `import "./LeftRightScreen.css"`

### Paso 4 — CSS: `LeftRightScreen.css`
- Migrar el CSS original **casi al pie de la letra**
- Prefijo de clase: mantener `.lr` (no hay conflicto, único motor)
- Asegurar `touch-action: none` en `.lr__drag-obj`
- Añadir `min-height: 100vh` al contenedor si no lo tiene o adaptar a la altura del layout compartido
- Colores originales: verde #16a34a, rojo #dc2626. Mantener.
- Background #f0fdf4. Mantener.

### Paso 5 — Registro
- `engine-registry.ts`: `"leftRight"` al Set
- `engine-screens.tsx`:
  ```ts
  const LeftRightScreen = lazy(() =>
    import("./leftRight/LeftRightScreen").then((module) => ({ default: module.LeftRightScreen })),
  );
  // ... dentro de EngineScreen:
  if (props.activity.engineId === "leftRight") {
    return (
      <Suspense fallback={<div className="mat__loading">Cargando actividad…</div>}>
        <LeftRightScreen {...props} />
      </Suspense>
    );
  }
  ```

### Paso 6 — Documentación
- Actualizar fila `leftRight` en inventario: ✅ P2 migrada — motor, tests, renderer, drag&drop, personajes, SummaryScreen, WrongFeedback, audio, engine-registry, lazy routing; validación manual pendiente
- Añadir bloque en EJECUCION_PASO_A_PASO con los 8 pasos del checklist standard + resultados tests

### Paso 7 — Verificación CI
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` — chunks separados esperados

## Dependencies and Considerations
- **AGENT_RULES 17 (protocolo doble规)**: estrictamente cumplido — Paso 1 (leer electron-reference) y Paso 2 (mapear shared PWA) realizados antes de escribir código
- **No inventar nada en core**: LCG, preguntas, dificultades, cantidades, estructura tipos = 1:1 con engine.ts original
- **`CHARACTER_IMAGES` es la única dependencia nueva en platform**: justificada por existir en electron-reference y no tener equivalente PWA
- **Drag & drop con listeners nativos window**: NO usar setPointerCapture (problema en BrowserWindow original) → patrón del renderer original
- **DevicePixelRatio**: mantener división, PWA puede tener zoom de navegador
- **React Pointer Events sintéticos** solo para `onPointerDown` inicial; el resto listeners nativos como en original (performance durante arrastre sin re-renders)

## Validation
1. **Tests core**: `npm test -- leftRight` — todos los 10+ tests pasan
2. **Lint/typecheck/build**: suite completa verde
3. **Prueba manual navegador** (Chrome):
   - Easy: 2 objetos, pulso izquierda/derecha → feedback correcto, avance 900ms, retry en fallo
   - Medium: selecciona nombre del objeto correcto según posición
   - Hard: mezcla los 3 tipos; tipo 3 "A está a la ___ de B" responde correctamente
   - Expert frente: personaje de frente → mano derecha del pj = izquierda pantalla → click caja correcta
   - Expert espaldas: personaje de espaldas → mano derecha coincide con derecha pantalla
   - char-drag-one: arrastrar objeto a la mano, fallo si distractor, correcto si mano
   - char-drag-both: 2 objetos a 2 manos, se marca correct cuando ambos colocados
   - Header contador 1/10 actualiza, SummaryScreen al final, reinicio funciona
4. **Prettier 0 warnings en archivos tocados**

## Risks
- **Riesgo: Drag en pizarra táctil con listeners nativos** → Mitigación: mismo patrón del renderer original que funcionaba en Electron; touch-action: none y pointer events unificados. Después validar en hardware real.
- **Riesgo: Rutas de URLs de CHARACTER_IMAGES y objectImages con import.meta.glob** → Mitigación: mismo patrón que objectImages.ts y counting.ts ya usan glob con éxito, solo cambiar carpeta.
- **Riesgo: Layout con altura fija en stage vs layout flex compartido de ActivityHeader** → Mitigación: ajustar `height: 100%` y `overflow: hidden` como hacen RectaNumericaScreen y RelacionarScreen.
- **Riesgo: Golden master semilla entre Electron y PWA** → Mitigación: test de semilla 42 compara salida con snapshot esperado. Si difiere en URL de imágenes (Vite hash), comparar estructura y textos, no URLs exactas.
