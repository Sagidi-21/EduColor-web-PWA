# Reglas de Comportamiento del Agente (AGENT_RULES.md)

Este documento define el contrato estricto para cualquier agente de programación (Cursor, Claude Code, Antigravity, etc.) que participe en la migración de la aplicación EduColor de Electron a web PWA.

## 1. Regla principal: NO INVENTAR [V1] · CRÍTICA

Antes de implementar una funcionalidad que pueda existir ya en la aplicación original, el agente debe **localizarla y estudiarla**. La carpeta `electron-reference/Colegio/` contiene el código fuente original.

```text
EXISTE EN ORIGINAL?
      │
   SÍ ─┴─ NO
   │       │
   ▼       ▼
REUTILIZAR  DISEÑAR
```

No se debe crear una segunda implementación equivalente sin justificarlo.

## 2. El código original es la fuente de verdad funcional [V1] · CRÍTICA

Cuando exista una discrepancia entre:

- una idea nueva del agente;
- una implementación nueva;
- y el comportamiento existente;

la implementación existente será la referencia, salvo que el roadmap indique expresamente un cambio funcional.

## 3. No borrar archivos sin autorización [V1] · CRÍTICA

El agente no debe eliminar:

- motores;
- generadores;
- validators;
- actividades;
- tests;
- assets;
- documentación;
- servicios;

solo porque ya exista una versión nueva. Primero debe demostrar que el elemento ha sido reemplazado y documentar la migración.

## 4. No cambiar el comportamiento por motivos de estilo [V1] · CRÍTICA

Un refactor que cambie el resultado educativo no es un refactor aceptable.

Especialmente protegidos:

- generación;
- semillas;
- dificultad;
- soluciones;
- validators;
- reglas de corrección;
- reconocimiento;
- repetición.

## 5. Adaptar Electron, no copiar Electron [V1] · CRÍTICA

No copiar al frontend web:

- IPC;
- `window.api`;
- APIs específicas de Electron;
- empaquetado Windows;
- procesos locales innecesarios.

Sustituirlos mediante la API web correspondiente (Browser API, IndexedDB, etc.) o servicios de aplicación.

## 6. No introducir backend donde no sea necesario [V1] · ALTA

La lógica que pueda ejecutarse localmente y no necesite datos del servidor debe permanecer local, especialmente:

- reconocimiento;
- validación educativa local;
- ejecución offline;
- generación que no requiera datos privados.

## 7. No introducir microservicios prematuramente [V1] · ALTA

La primera arquitectura web debe ser sencilla (Frontend → API → Core → DB). No dividir en múltiples servicios independientes hasta que exista una razón real.

## 8. Cada nueva abstracción debe demostrar su necesidad [V1] · ALTA

No crear una arquitectura genérica gigantesca “por si algún día”. Primero resolver un caso real. Cuando exista un patrón repetido, extraer la abstracción.

## 9. Documentar antes de hacer una migración compleja [V1] · CRÍTICA

Antes de modificar un módulo crítico, el agente debe indicar:

1. qué hace actualmente;
2. qué dependencias tiene;
3. qué se va a conservar;
4. qué se va a adaptar;
5. qué se va a sustituir;
6. cómo se comprobará la paridad.

## 10. Una feature por cambio coherente [V1] · ALTA

Evitar commits que mezclen (ej. nuevo login + refactor + rediseño). Un cambio debe tener un objetivo claro y comprobable.

## 11. Todo cambio crítico debe tener tests [V1] · CRÍTICA

Especialmente: generators, validators, Core, auth, permisos, persistencia, offline, reconocimiento.

## 12. Utilizar Golden Master en comportamiento heredado [V1] · CRÍTICA

Si el agente cambia una implementación existente, debe poder comparar antes y después (`A == B`). Si no son iguales, debe justificarlo.

## 13. La UI no se rediseña sin requisito [V1] · CRÍTICA

No cambiar colores, estructura, navegación, textos, posiciones, tamaños o flujo solo por preferencia estética. La adaptación a web puede requerir cambios, pero deben estar justificados por: navegador, touch, responsive, accesibilidad, seguridad o nueva funcionalidad.

## 14. El agente debe detenerse ante ambigüedad crítica [V1] · ALTA

Si no puede determinar si una funcionalidad existente debe conservarse o cambiarse, o si tiene cualquier tipo de duda sobre cómo proceder, **no debe inventar una solución silenciosamente**.

Debe detenerse inmediatamente y generar una **batería de preguntas clara y estructurada** para que el usuario pueda resolverlas. Debe dejar constancia de la ambigüedad, el impacto, las opciones y solicitar decisión antes de continuar.

## 15. No marcar como migrado lo que no ha sido validado [V1] · CRÍTICA

Una actividad solo se marca como migrada cuando: Código + Tests + Paridad + Build + UX han sido comprobados.

## 16. Mantener trazabilidad entre original y web [V1] · CRÍTICA

Cada módulo migrado debe poder responder: ¿De dónde viene? ¿Qué se ha cambiado? ¿Por qué? ¿Cómo sabemos que sigue funcionando?

## 17. Protocolo doble para migrar motores/Renderer de Matemáticas [V1] · CRÍTICA

Cuando vayas a migrar un **motor nuevo** (una actividad con su renderer), debes cumplir ESTE
orden OBLIGATORIO, sin saltarte pasos y sin inventar nada. La regla es:

> **PRIMERO entender al pie de la letra lo que hace `electron-reference/`; SEGUNDO adaptarlo
> a lo que ya existe en la PWA compartida. NUNCA al revés.**

### Paso 1 — Fuente de verdad funcional: `electron-reference/`

Antes de escribir UNA SOLA LÍNEA del renderer nuevo:

1. Abre y lee entero el renderer original del motor:
   `electron-reference/Colegio/src/renderer/src/core/engines/<engineId>/<EngineName>Renderer.tsx`
2. Abre y lee su `engine.ts` si existe:
   `electron-reference/Colegio/src/renderer/src/core/engines/<engineId>/engine.ts`
3. Copia en una lista mental (o en el TODO temporal) **todo esto**:
   - Nombre y forma del estado interno: cómo se llama `input` (string / digits[] / null),
     `session`, `finished`, `alreadyFailed`, `chosen`, `activeDigit`, etc.
   - Cuándo aparece `InputModeToggle` y cuándo no.
   - Cuándo aparece `Numpad`, qué filas tiene, qué botones son del/confirm.
   - Qué componente de dibujo usa (`DrawableAnswerBox`).
   - Condición de `isMultiChoice`: ¿depende de `difficulty === "easy"` o de
     `current.type`?
   - Qué CSS se importa además del propio: si importa
     `../operations/OperationsRenderer.css`, la PWA debe importar su equivalente
     `../operations/OperationsScreen.css`.
   - Qué campos se le pasan al `ExerciseHeader`: `title`, `gradeLabel`, `current`,
     `total`, `onExit`.
   - Qué hay dentro de `<footer className="ops__footer">` y en qué orden:
     multichoice options primero y luego `WrongFeedback`, o Numpad +
     `WrongFeedback`, etc.
   - Cuándo se muestra `WrongFeedback` y cuándo no.
   - Si el summary final es inline o usa `SummaryScreen` compartido.
   - Callbacks importantes: `handleRetry`, `handleNext`, `confirm`, `handleChoice`,
     `handleAnswer` — inputs, dependencias, condiciones de guarda.
   - `useEffect` de avance correcto: duración del `setTimeout`.
   - `useEffect` de autoconfirm en canvas: condición de longitud, `mode !== "canvas"`
     etc.

**No salgas de aquí si no puedes explicar cómo funciona cada paso del renderer
original.**

### Paso 2 — Fuente de verdad de componentes compartidos PWA

Ahora **NO** escribas nada nuevo. Primero **localiza la pieza PWA ya existente que
corresponde a cada pieza que acabas de ver en electron-reference. Este es el
mapeo estándar **documentado** del proyecto:

| Pieza en `electron-reference/`                          | Su equivalente en la PWA web (REUTILIZA, no la copies)                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playCorrect` / `playWrong` / sounds                    | `playFeedback(ok: boolean)` en `src/features/shared/audioFeedback.ts`                                                                                                                 |
| `ExerciseHeader`                                        | `ActivityHeader` en `src/features/matematicas/components/ActivityHeader.tsx`                                                                                                          |
| `SummaryScreen` shared                                  | `SummaryScreen` en `src/features/matematicas/components/SummaryScreen.tsx`                                                                                                            |
| `WrongFeedback` shared                                  | `WrongFeedback` en `src/features/matematicas/components/WrongFeedback.tsx`                                                                                                            |
| `InputModeToggle` shared                                | `InputModeToggle` en `src/features/shared/components/InputModeToggle.tsx`                                                                                                             |
| `useInputMode` hook                                     | `useInputMode` en `src/features/shared/hooks/useInputMode.ts`                                                                                                                         |
| Numpad local de cada renderer (4059, 6099, operations…) | **NUNCA** hagas un Numpad local. Usa el compartido: `Numpad` en `src/features/shared/components/Numpad.tsx`                                                                           |
| `DrawableAnswerBox` de operations                       | `LazyDigitCell` en `src/features/shared/DigitCell.tsx`                                                                                                                                |
| `OperationsRenderer.css`                                | `OperationsScreen.css` en `src/features/matematicas/operations/OperationsScreen.css` (importar con `import "../operations/OperationsScreen.css"` si el renderer usa clases `.ops__*`) |
| Registro de actividades                                 | **NUNCA** registres a mano. Añade lazy load en `src/features/matematicas/engine-screens.tsx` con el mismo patrón que el resto                                                         |
| `engineId` vs `registry/types.ts` de Electron           | Usa `EngineScreenProps` de `src/features/matematicas/engine-screens.tsx` y la prop `seed` (determinista) en vez de `Date.now() % 999983` inline                                       |
| `props.difficulty` y `props.title` en Electron          | `activity.title` + `difficulty` de `EngineScreenProps`, no cambies su semántica                                                                                                       |

Si crees que necesitas una pieza que no está en esta tabla: **no la inventes**.
Detente, busca si ya existe en `src/features/shared/components/`,
`src/features/matematicas/components/` o `src/features/shared/`. Si realmente no
existe, pregunta antes de crear un componente nuevo.

### Paso 2B — Antes de escribir nada: mira OTROS EJERCICIOS YA IMPLEMENTADOS de la misma familia

> **Regla de oro**: antes del Paso 3**: si hay actividades ya migradas en la PWA
> (numeracion1119, suma, resta, counting, ordenar, igualdad, etc.) y el nuevo
> motor nuevo pertenece a la MISMA CATEGORÍA (mismo bloque: numeración,
> operaciones, relaciones, etc.), tienes que mirar las actividades ya hechas y
> **compartir TODO lo que tengan en común, aunque el renderer original de
> electron-reference lo hiciera a mano o duplicado en cada motor.**

Qué mirar siempre antes de empezar el renderer nuevo:

1.  **Abre al menos una actividad PWA ya implementada de la misma categoría que
    (ej. para `numeracion6099` o `numeracion999` abre
    `src/features/matematicas/numeracion1119/Numeracion1119Screen.tsx`;
    para `leftRight` abre `RectaNumerica` o `ordenar`; para `algoritmoVertical`
    abre `OperationsScreen` o `tresSumandosScreen`; para `problemas` abre
    `IgualdadScreen`, etc.).
2.  **Inventario de qué comparten**:
    - **Mismo layout base?** `<div className="ops">`, `ops__stage`, `ops__footer`,
      `ops__formula`, `ops__answer-box`, `ops__celebration`, `ops__numpad`? En ese
      caso reutiliza el `OperationsScreen.css` y su estructura, no hagas un CSS
      nuevo de layout iguales.
    - **Mismo estado de sesión?** `SessionState { exercises, currentIndex, correctCount, startTime, answerState, input/chosen/selected, alreadyFailed }`? Reutiliza el shape exacto.
    - **Mismos hooks?** `useInputMode`, `useState(() => freshSession(seed, diff))` con `freshSession` al mismo nivel.
    - **Mismos callbacks?** `handleRetry`, `handleNext`, `confirm`, `handleChoice`,
      `handleAnswer` con la misma firma y condiciones.
    - **Mismo `InputModeToggle` condición para mostrar/ocultar toggle, reutiliza.
    - **Mismo bloque TensBlock / CDU / bloques de decenas/unidades/centenas?** Extrae a un componente compartido local de la familia (ej.: si varias numeración) si 2 o más actividades tienen el mismo JSX de bloques (no importa que Electron lo tenga duplicado; en la PWA se comparte).
    - **Mismo tipado de ejercicio?** Si el core genera `type Exercise = ...` que coincide con otra actividad, reutiliza.
    - **Mismos parámetros de lazy en engine-screens?** Mismo patrón de `const XxxScreen = lazy(() => import(…).then(m => ({ default: m.XxxScreen })))`.
3.  **Decisión de compartir vs duplicar**:
    - Si 2+ pantallas ya migradas usan la misma pieza (función, bloque JSX, hook, tipo, regla de layout), **el nuevo motor NUEVO TIENE QUE USAR LA COMPARTIDA**, no volverla a escribir aunque la veas duplicada en electron-reference.
    - Si la pieza solo existe en 1 pantalla, **no abstraigas todavía** (regla 8), pero sí sigue su mismo patrón (no inventes uno distinto).
    - Si detectas que la pieza existe duplicada en **3 pantallas o más**, apúntalo como deuda técnica y pregunta antes de refactorizar compartirla en un archivo nuevo (p. ej `numeracion1119/4059/6099 comparten TensBlock); no lo hagas silenciosamente, pero sí al menos el nuevo no añade una cuarta copia si ya hay 3.

Como referencia, estas son las familias ya migradas donde ya hay que mirar siempre:

| Familia                                              | Actividad ya migrada PWA que mirar                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Numeración 1-99 (1.º/2.º)                            | Numeracion1119Screen (11-19) → patrón canónico para 4059/6099                                                           |
| Numeración hasta 999 (2.º)                           | Numeracion1119Screen + numeracion6099Screen → patrón + CDU card                                                         |
| Operaciones (suma/resta)                             | OperationsScreen (Suma/Resta)                                                                                           |
| Relaciones / Igualdades / Series / Vecinos / Ordenar | IgualdadScreen / SeriesNumericasScreen / VecinosNumeroScreen / OrdenarScreen → patrón header + stage (options or touch) |
| Problemas                                            | IgualdadScreen (problemas simples) + ProblemaRenderer (electron-reference)                                              |
| Reconocimiento de dígitos + canvas / answer boxes    | OperationsScreen / Numeracion1119Screen → LazyDigitCell + Numpad + InputModeToggle                                      |
| Conteo / selección / drag                            | CountingScreen → sesión con steps                                                                                       |

**Si te saltas este paso y me inventas un layout, un estado o un componente nuevo en una
familia donde ya había un patrón establecido en 2+ pantallas, el error es de proceso y
tienes que corregirlo antes de pedir revisión.**

### Paso 3 — Adaptación controlada (y solo aquí escribes código)

Ahora ya puedes escribir el renderer nuevo. La regla es:

- **Igual que el original** en comportamiento, flujo, nombres de estados,
  callbacks y orden de elementos en el `stage` y `footer`.
- **Diferente solo en los lugares donde el mapeo del Paso 2 diga** (p. ej.
  `ExerciseHeader` → `ActivityHeader`, `DrawableAnswerBox` → `LazyDigitCell`,
  Date.now inline → `seed` prop, `SummaryScreen` inline compartido de 4059/6099
  → siempre el `SummaryScreen` de PWA como ya hace `numeracion1119Screen`).
- **Nunca** te inventes:
  - un nuevo shape de estado (si el original usa `input: string`, no hagas `digits[]` + `activeDigit` sin justificar que era una decisión PWA tomada antes);
  - un nuevo componente local de botones, input o feedback;
  - CSS nuevo de layout si las clases `.ops__*` / `*__stage` / `*__footer` ya cubren el caso;
  - condición nueva de `isMultiChoice` si no estaba en el renderer original;
  - mostrar u ocultar `InputModeToggle` en un caso que no se corresponda con la
    convención PWA YA ESTABLECIDA (ver `numeracion1119Screen` o
    `countingScreen` como ejemplo).

### Paso 4 — Cierre: checklists obligatorios

Antes de dar una migración de renderer por terminada, marca:

- [ ] He leído el renderer original de `electron-reference/` y su `engine.ts` (si existe).
- [ ] He usado el mapeo del Paso 2 **en vez de** componentes/helpers locales.
- [ ] He registrado el renderer en `engine-screens.tsx` con `lazy(() => import(...))`.
- [ ] He añadido `import "../operations/OperationsScreen.css"` si el renderer usa las clases `.ops__*`.
- [ ] Los tipos de `EngineScreenProps` (`activity`, `difficulty`, `seed`, `onExit`, `gradeTitle`, `className`, `mascotUrl`, `difficultyStars`) se pasan todos al `ActivityHeader` cuando aplican.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasan.
- [ ] Si era una actividad del inventario, he actualizado `docs/INVENTARIO_MIGRACION_ACTIVIDADES.md` y `docs/EJECUCION_PASO_A_PASO.md`.
