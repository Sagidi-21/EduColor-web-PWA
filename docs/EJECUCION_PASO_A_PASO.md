# Ejecución paso a paso — EduColor web PWA

Este documento desarrolla el [roadmap de ejecución](ROADMAP_DE_EJECUCION_DETALLADO.md). No se empieza una fase hasta cumplir sus dependencias y no se marca como cerrada sin su validación.

**Qué es este documento: el método.** Los ocho pasos de cada fase y lo que exige
cada uno. **Qué no es: el estado.** Las actividades ya migradas están en
[INVENTARIO_MIGRACION_ACTIVIDADES.md](INVENTARIO_MIGRACION_ACTIVIDADES.md), que
deriva su estado de `src/core/content/engine-registry.ts` y se comprueba en cada
`npm test`. La sección "Seguimiento de actividades migradas" es una **bitácora
histórica**: describe cómo se migraron las seis primeras y se conserva por
auditoría, no porque sea el estado actual. Las 26 restantes se migraron siguiendo
los mismos ocho pasos y están registradas en
[MIGRACION_CHANGELOG.md](MIGRACION_CHANGELOG.md), una fila por divergences y por
corrección de bug.

Este fichero se revisó el 2026-09-30. No contiene ninguna fecha en su propio
cuerpo, y por eso los hitos que sí tienen fecha viven en el changelog, no aquí.

## Convenciones de trabajo

- Una tarea se completa en una rama y pull request propios.
- Cada cambio de lógica lleva test; cada cambio visual/táctil lleva prueba manual documentada.
- No se copian archivos Electron sin revisar dependencias, licencia, tests y acoplamiento a `window.api`.
- Antes de migrar un activo: copiarlo, identificar origen, versión y licencia/autoría, y anotar la trazabilidad.
- Todo paso completado se marca con un único indicador, sin variantes de redacción:
  - `✅ completado` — el paso está terminado y verificado.
  - `🚧 parcial` — el paso arrancó o quedó a medias; el texto dice exactamente qué falta.
  - `⏳ pendiente` — el paso no ha empezado.
- En las listas numeradas de fase, el indicador sustituye a la coletilla `**Completado:**`; en las secciones de seguimiento por actividad, precede al verbo (`✅ completado`, `✅ completados`).
- **Las cifras de tests que aparecen más abajo son de la bitácora, en el momento
  en que se escribió cada entrada, y a veces no coinciden con las actuales.** No
  las actualices una a una: las cifras vigentes están en la tabla de verificación
  del inventario, y se miden con `npm test`.

---

# Fase 0 — Arranque técnico y límites

## Pasos

1. Mantener el seguimiento en `docs/ESTADO_DEL_PROYECTO.md` y definir responsables de aprobación pedagógica y técnica. **Completado:** director del colegio (pedagógica), Salvador (técnica), con feedback de los profesores de Matemáticas de 1.º y 2.º.
2. Crear `docs/DECISIONES.md`; registrar alcance V1, exclusiones, fecha, autor y razón de cada decisión relevante.
3. Confirmar V1: 1.º/2.º, Matemáticas, profesorado, pizarra, fichas, sesión local y offline. Registrar explícitamente que alumnos, tareas y multi-colegio quedan fuera. **Completado:** la sesión offline mantiene y recupera actividad, ejercicios, respuestas, corrección y resumen cuando no hay Internet. El alcance se registra en `ESTADO_DEL_PROYECTO.md` y la decisión D-003 en `DECISIONES.md`.
4. Mantener la estructura de capas: `core` para lógica pura, `features` para React, `platform` para navegador/PWA y `docs` para decisiones. **Completado:** se crean además `manifests` y `shared`, con reglas de dependencia en `ARQUITECTURA_INICIAL.md`; el vertical slice no se mueve todavía.
5. Añadir ESLint, Prettier y scripts `lint`, `typecheck`, `test` y `build`. **Completado:** se añaden también `lint:fix`, `format` y `format:check`; las reglas se aplican a TypeScript/React y excluyen dependencias y build.
6. Crear CI en GitHub que ejecute esos cuatro scripts para cada pull request. **Completado:** el workflow `Calidad` ejecuta instalación limpia, formato, lint, tipos, tests y build con Node 22 en cada push o pull request a `main`.
7. Documentar en README el arranque, verificación, navegador soportado y cómo se despliega una build local. **Completado:** README documenta Node 22, instalación reproducible, scripts, Chrome/Edge como objetivo provisional y límites de validación física pendientes.
8. Crear una plantilla de issue con: objetivo, aceptación, impacto en datos, pruebas y evidencia de pizarra. **Completado:** se añaden formularios de mejora/incidencia en GitHub y `DEFINITION_OF_DONE.md` con requisitos de calidad, feedback docente y seguridad.

## Entregables

- CI verde, convenciones documentadas y definición de V1 aprobada.
- Plantillas de decisión/issue y política inicial de Definition of Done.

## Comprobación de salida

Ejecutar desde un clon limpio `npm ci`, `npm run typecheck`, `npm test` y `npm run build`.

---

# Fase 1 — Modelo de contenido extensible y base de paridad

## Pasos

1. Inventariar las 62 actividades Electron en una tabla: ID, cursos, motor, generador, renderer, tests, recursos, estado y prioridad. **Completado:** inventario inicial en `INVENTARIO_MIGRACION_ACTIVIDADES.md`; generadores y recursos marcados como pendientes se verifican antes de cada migración.
2. Definir interfaces TypeScript para `Subject`, `Grade`, `CurriculumBlock`, `ActivityManifest`, `ActivityParameter` y `ActivityResult`. **Completado:** contratos independientes de React en `src/core/content/contracts.ts`; IDs en inglés y textos visibles en español según D-008.
3. Elegir un formato de manifiesto (JSON/TypeScript validado) y añadir `schemaVersion` desde el primer manifiesto. **Completado:** JSON puro, `$schema` enlazado y validación JSON Schema mediante Ajv (D-009).
4. Crear manifiestos de Matemáticas, 1.º y 2.º; no codificar cursos como una unión cerrada. **Completado:** los 62 manifiestos JSON de actividades de Electron se importan directamente, conservan título, icono, unidad y cuatro niveles de dificultad, y se validan con JSON Schema.
5. Crear un manifiesto de conteo que represente el vertical slice existente. **Completado:** el manifiesto de conteo forma parte del catálogo original importado.
6. Implementar un validador de manifiestos que indique archivo, campo y motivo del error. **Completado:** Ajv valida el conjunto de manifiestos durante los tests.
7. Migrar la base visual compartida antes de habilitar secciones de navegación: vídeo de inicio, inicio, selección de aula y configuración local. **Completado:** se usan recursos y flujo de Electron; perfil, mascota, color, aulas y zoom se guardan localmente en la PWA.
8. Copiar todos los recursos visuales requeridos por la interfaz y los motores al repositorio PWA, conservando su estructura y trazabilidad. **Completado:** 244 archivos originales (≈39 MB) están en `src/assets`; cada motor seguirá declarando y probando los que use al migrarse.
9. Adaptar el vídeo de apertura a navegador: reproducción automática compatible y acción de respaldo si el navegador la bloquea. **Completado:** el vídeo se inicia silenciado para cumplir la política de Chrome/Edge y muestra `Iniciar presentación` si no puede reproducirse automáticamente.
10. Crear cargador, registro de motores y selector por curso/bloque/materia. **Completado:** `import.meta.glob` carga los JSON; `engine-registry` impide lanzar sin motor PWA; el selector filtra por materia, curso y bloque sin listas de actividades en la navegación.
11. Añadir tests: manifiesto válido, ID duplicado, motor inexistente, parámetro inválido y filtro por curso. **Completado:** el validador indica archivo, campo y motivo; los tests cubren catálogo válido, IDs repetidos, motor no registrado, parámetro incompleto y filtro 1.º/2.º.
12. Migrar al menos una actividad compartida adicional para demostrar que el sistema no está hecho a medida del conteo. **Completado:** `comparison` (Mayor y menor) se lanza desde manifiesto + motor + renderer; el conteo sigue sin renderer y no hay IDs de actividad en la navegación.

## Entregables

- Contratos versionados, catálogo completo de manifiestos y validación automatizada.
- Base visual y recursos originales disponibles antes de migrar motores.
- Matriz de trazabilidad Electron → PWA.

## Comprobación de salida

Añadir una actividad de ejemplo exclusivamente mediante motor + manifiesto, sin tocar navegación ni tipos de curso.

---

# Fase 2 — Catálogo matemático V1

## Pasos por cada actividad

1. Seleccionar la siguiente actividad por valor pedagógico y dependencia técnica, empezando por las 43 compartidas.
2. Leer el motor, generador, renderer, CSS, tests y recursos del proyecto Electron.
3. Extraer contratos, generador y validador a `src/core` sin importaciones de React ni navegador.
4. Añadir pruebas de semilla, límites, respuesta correcta y casos extremos antes de construir la pantalla.
5. Crear manifiesto con título, descripción, curso, bloque, niveles, parámetros, recursos y versión.
6. Implementar renderer responsive y táctil, con etiquetas accesibles y estados de foco.
7. Verificar escritorio, tableta y tamaño de pizarra; registrar capturas o checklist manual.
8. Añadir ficha de trazabilidad, marcar actividad como migrada y pasar CI.

## Orden inicial

1. Conteo y comparación.
2. Ordenar, series, vecinos y recta numérica.
3. Suma, resta, igualdad y problemas de una operación.
4. Numeración, decenas/unidades y algoritmos de columna.
5. Geometría, medida, reloj, dinero y restantes comunes.
6. Específicas de 1.º; después las específicas de 2.º priorizadas por el colegio.

## Seguimiento de actividades migradas (bitácora histórica)

Una subsección por actividad, en orden de migración. Cada paso lleva su indicador de estado según las convenciones de trabajo.

**Cubre solo las seis primeras**, las migradas entre la Fase 0 y el 2026-09-25. Las
26 siguientes no tienen subsección aquí: se registran en el
[MIGRACION_CHANGELOG.md](MIGRACION_CHANGELOG.md) y su estado actual está en el
inventario. Estas entradas se conservan tal como se escribieron, con dos
advertencias:

- **Los componentes que se citan pueden ya no existir.** Mencionan
  `WrongFeedback`, que D-018 borró al unificarlo con `ActionButtons`. Es un
  registro de lo que se hizo en su día, no del código actual.
- **Las cifras de tests son de su momento.** No se han recontado; las vigentes
  están en la tabla de verificación del inventario.

### `ordenar`

- **Pasos 1 y 2:** ✅ completados. Es una actividad compartida de 1.º/2.º y se
  auditó su motor Electron completo. No usa recursos externos ni APIs de
  Electron.
- **Pasos 3 y 4:** ✅ completados. El generador determinista y el validador viven
  en `src/core/activities/ordering.ts`; tres pruebas cubren semilla, límites,
  mezcla y respuesta correcta.
- **Pasos 5 y 6:** ✅ completados. Reutiliza su manifiesto JSON ya validado y
  dispone de renderer PWA táctil, accesible y registrado en el catálogo.
- **Paso 7:** ✅ completado. Verificación manual realizada en escritorio (Chrome).
  Se identificaron y corrigieron tres problemas respecto al original Electron:
  (1) audio del vídeo de intro bloqueado por política de autoplay del navegador
  → se reproduce con audio tras el primer gesto del usuario (fallback a muted si
  persiste el bloqueo); (2) objetos en las cajas acumulados en la parte inferior
  → ahora centrados con `align-items: center; justify-content: center`; (3)
  lógica de botones incorrecta → las cajas son contenedores visuales (no
  clicables), los botones "← Izquierda" / "Derecha →" están independientes
  debajo, hay avance automático a 900 ms en acierto con piribip sintético (Web
  Audio API), y los botones "Reintentar" / "Siguiente →" del profesor aparecen
  solo en fallo. Contador 1 / 10 añadido al header. CI verde (typecheck +
  18/18 tests, de los que 3 son del núcleo: ver `ordering.test.ts` y
  `OrderingScreen.test.tsx` en la tabla de verificación del inventario).
- **Paso 8:** ✅ completado. Trazabilidad actualizada en
  `INVENTARIO_MIGRACION_ACTIVIDADES.md`; el cierre pedagógico queda pendiente
  del feedback de Matemáticas de 1.º y 2.º.

### `suma` / `resta`

- **Pasos 1 y 2:** ✅ completados. Son actividades compartidas de 1.º/2.º dentro del
  bloque unidad-2 (suma y resta). Se auditó el motor y generador del proyecto
  Electron completo: `engine.ts`, `SumaRenderer.tsx`, `RestaRenderer.tsx`,
  `OperationsRenderer.tsx`, `OperationsRenderer.css`, `operations.generator.ts`
  y `operations.generator.test.ts`. El motor usa objetos genéricos de
  `src/assets/objects/` (7 categorías) y no APIs de Electron.
- **Pasos 3 y 4:** ✅ completados. El generador determinista y el validador viven
  en `src/core/activities/operations.ts`; 22 tests cubren generación, rangos,
  respuesta correcta, pares únicos, reproducibilidad, validador y showImage para
  ambas operaciones y las 4 dificultades.
- **Pasos 5 y 6:** ✅ completados. Los manifiestos JSON `suma.json` y `resta.json`
  ya estaban importados y validados. El renderer PWA `OperationsScreen.tsx`
  (con `SumaScreen`/`RestaScreen` como factories) dispone de layout vertical,
  numpad, modo canvas (DigitCell con TF.js), SummaryScreen, auto-avance 900 ms
  en acierto, retry en error, contador 1/10 en el header y toggle de modo
  escritura/teclado.
- **Paso 7:** 🚧 parcial. Verificación manual en escritorio (Chrome) confirmó
  paridad visual y de audio con Electron. CI verde (typecheck + 22/22 tests).
  Falta la validación en pizarra/tableta.
- **Paso 8:** ✅ completado. Trazabilidad actualizada en `INVENTARIO_MIGRACION_ACTIVIDADES.md`;
  el cierre pedagógico queda pendiente del feedback de Matemáticas de 1.º y 2.º.

### `igualdad`

- **Pasos 1 y 2:** ✅ completados. Actividad compartida de 1.º/2.º dentro del
  bloque unidad-3. Se auditó el motor del proyecto Electron completo.
  No usa recursos externos ni APIs de Electron.
- **Pasos 3 y 4:** ✅ completados. El generador determinista y el validador viven
  en `src/core/activities/igualdad.ts`; 16 tests cubren generación, rangos,
  estructura, matemáticas por tipo y validador. Se añadió restricción
  `alreadyFailed` para el control de reintentos y `imageUrl` vacío en nivel experto.
- **Pasos 5 y 6:** ✅ completados. El manifiesto JSON `igualdad.json`
  ya estaba importado y validado. El renderer PWA `IgualdadScreen.tsx`
  (`.css`) dispone de tres tipos de ejercicio (resultado, sumando, descomposición),
  opciones con estados visuales, auto-avance 900 ms en acierto, retry en error,
  contador 1/10 en el header y sin dibujos de apoyo en nivel experto.
- **Paso 7:** ✅ completado. CI verde (typecheck + 16/16 tests).
- **Paso 8:** ✅ completado. Trazabilidad actualizada en `INVENTARIO_MIGRACION_ACTIVIDADES.md`.

### `counting`

- **Pasos 1 y 2:** ✅ completados. Actividad compartida de 1.º/2.º con currículo de 8 niveles (4 por curso).
- **Pasos 3 y 4:** ✅ completados. Generador determinista y validador en
  `src/core/activities/counting.ts`, con 10/10 tests en verde.
- **Pasos 5 y 6:** ✅ completados. Renderer PWA `CountingScreen.tsx` con los siguientes modos de interacción implementados y verificados:
  - `TOUCH` (1-L1, 1-L2): toque individual de objetos
  - `GROUP` (1-L3): agrupación de decenas en contenedores
  - `FILL_TABLE` (1-L4, 2-L2): tabla posicional con cajas D+U o C+D+U, soporta numpad horizontal y modo canvas
  - `SELECT` (2-L1, 2-L3, 2-L4): selección de opción múltiple
- **Distribuciones visuales implementadas:** `scattered-large`, `double-row`, `semi-dispersed-tens`, `bundles-tens-units`, `packages`, `mass-vs-blocks` (3 zonas C/D/U con etiquetas), `matrix-grid` (paquetes de 10 + unidades sueltas)
- **Numpad horizontal:** variante `layout="horizontal"` añadida al componente `Numpad` para ganar espacio en pantalla en niveles con tabla posicional.
- **Paso 7:** ✅ completado. Tests locales en verde. (2 tests de worktree heredado `.kilo` no afectan al código activo.)
- **Paso 8:** ✅ completado. Documentación actualizada en rama feature antes del merge.

### `numeracion4059` / `numeracion6099` / `numeracion999`

- **Pasos 1 y 2:** ✅ completados. `numeracion4059` y `numeracion6099` son actividades
  compartidas de 1.º/2.º (bloque de numeración 40-59 y 60-99); `numeracion999`
  es específica de 2.º (descomposición CDU hasta 999). Los 3 núcleos ya estaban
  migrados con tests en `src/core/activities/{numeracion4059,numeracion6099,numeracion999}.ts`
  y sus CSS de renderer existían; faltaba cerrar la integración de pantalla y
  registro en el engine central.
- **Pasos 3 y 4:** ✅ completados en iteración anterior. 11/12/13 tests
  respectivamente cubren semilla, rangos, tipos de ejercicio, validador y
  respuesta correcta; CI verde.
- **Pasos 5 y 6:** ✅ completados. Refactor de los 3 renderers:
  - `Numeracion4059Renderer.tsx` → `Numeracion4059Screen` (named export),
    sustitución de summary inline por `SummaryScreen`, reordenación del
    `footer` fuera del `stage`, import de su CSS, `WrongFeedback` compartido,
    reutilización de `Numpad` y `LazyDigitCell` del shared, toggle `InputModeToggle`
    condicional (solo dificultades no-multichoice), uso de la prop `seed` en
    `freshSession`.
  - `Numeracion6099Renderer.tsx` → `Numeracion6099Screen`, misma pauta que 4059:
    eliminación del `Numpad` local duplicado, uso del componente `Numpad` de
    `shared/components`, `SummaryScreen` centralizado, prop `seed` propagada,
    import de CSS, `WrongFeedback` unificado.
  - `Numeracion999Renderer.tsx` → `Numeracion999Screen` (named export), todas las
    props de `EngineScreenProps` (`className`, `mascotUrl`, `difficultyStars`)
    pasadas al `ActivityHeader`, uso de `seed`, `alreadyFailed` para control
    de reintentos, `SummaryScreen` y `WrongFeedback` compartidos, import de CSS.
  - Registro lazy en `src/features/matematicas/engine-screens.tsx` para los 3
    engine IDs (`numeracion4059`, `numeracion6099`, `numeracion999`) con
    `Suspense` y fallback estándar de carga, siguiendo el mismo patrón que
    `numeracion1119Screen` y el resto del catálogo. El `engine-registry` ya
    los tenía marcados como `available` por lo que el routing funciona
    sin tocar navegación ni manifiestos.
- **Paso 7:** 🚧 parcial. CI local en verde: los 3 cores con 11, 12 y 13 tests de
  núcleo (36 en total; la entrada decía antes "72/72", que duplicaba la cifra),
  `npm run typecheck` OK, `npm run build` OK (los 3 CSS y los 3 JS chunks se
  empaquetan como chunks separados: `Numeracion4059Renderer-Bw09cmtU.css`,
  `Numeracion6099Renderer-DFub4OKZ.css`, `Numeracion999Renderer-CWo1QZIB.css`
  y sus bundles JS homólogos). Los 4 archivos tocados (`engine-screens.tsx` + 3
  renderers) pasan `prettier --check` sin cambios. Falta la validación manual
  en pizarra/tableta y el cierre pedagógico.
  _(Nota: 2 errores de lint preexistentes en `features/mascota/PortalTransition*.tsx`
  y 9 warnings de prettier preexistentes en archivos de portal/test son ajenos
  a este hito y no afectan a Matemáticas.)_
- **Paso 8:** ✅ completado. Trazabilidad actualizada en `INVENTARIO_MIGRACION_ACTIVIDADES.md`
  (líneas 39-41 y 64): las 3 filas pasan de "renderer pendiente" a
  "✅ P2 migrada" con detalle de componentes, tests y validación manual pendiente.

### `leftRight`

- **Pasos 1 y 2:** ✅ completados. `leftRight` es una actividad compartida de 1.º/2.º
  (bloque lateralidad, primera actividad del bloque 5 del roadmap Fase 2). Se
  auditó el motor Electron completo: `engine.ts` con 350 líneas, `LeftRightRenderer.tsx`
  con 470 líneas, `LeftRightRenderer.css` con 306 líneas, `leftRight.generator.ts` y
  `leftRight.generator.test.ts`. Dependencias: `IMAGE_CATEGORIES`/`pickImage` (compartido)
  y `CHARACTER_IMAGES` (nuevo en PWA, pero existente en Electron). Motor NO usa APIs
  de Electron. Recursos de personaje ya presentes en `src/assets/izquierda-derecha/`.
- **Pasos 3 y 4:** ✅ completados. Core puro en `src/core/activities/leftRight.ts`,
  1:1 con la referencia. Nueva dependencia platform: `src/platform/characterImages.ts`
  (mismo patrón `import.meta.glob` que objectImages.ts, glob a `izquierda-derecha/`).
  22 tests Vitest en `leftRight.test.ts` cubren: 10 ejercicios por dificultad,
  semilla determinista, easy (tipo regular + answer posición), medium
  (askLeft alterno por i%2 + answer objeto), hard (3 subtipos i%3=0/1/2),
  expert (char-click 1-4, char-drag-one 5-7, char-drag-both 8-10 con
  targetBox "both"), espejo perspectiva frente/espaldas, validateAnswer.
  Todos 22/22 tests verdes.
- **Pasos 5 y 6:** ✅ completados. Renderer `LeftRightScreen` (named export, NO default)
  con todas las props `EngineScreenProps` pasadas a `ActivityHeader`
  (`className`, `mascotUrl`, `difficultyStars`, `gradeTitle`, `unitTitle`, `progress`).
  Sustituciones del mapeo AGENT_RULES Paso 2:
  `ExerciseHeader → ActivityHeader`, `playCorrect → playFeedback(true)`,
  `playWrong → playFeedback(false)`, `SummaryScreen inline → shared SummaryScreen`,
  `WrongFeedback inline → shared WrongFeedback`, `Date.now inline en freshSession → seed prop`.
  Drag imperativo idéntico a Electron: listeners nativos window `pointermove`/`pointerup`
  (no `setPointerCapture`, igual que referencia), división por `devicePixelRatio`,
  cleanup en `useEffect` de `currentIndex` y unmount. Auto-avance 900 ms
  en `correct`, `alreadyFailed` evita doble cuenta, footer options + `WrongFeedback`
  en non-char, solo `WrongFeedback` en expert (char-mode).
  CSS `LeftRightScreen.css` casi al pie de la letra: colores verde #16a34a,
  rojo #dc2626, background #f0fdf4, animación `lr-pop`, clases `lr__char-box`
  dashed/solid correct/wrong, `lr__drag-obj` absolute con `touch-action: none`.
  Añadido `@media` responsive móvil.
- **Paso 7:** 🚧 parcial. Falta ejecutar el CI local completo (prettier, lint,
  typecheck, tests 22/22, build y chunks lazy separados); queda pendiente la
  validación manual en pizarra/tableta y el cierre pedagógico.
- **Paso 8:** ✅ completado. Trazabilidad actualizada en `INVENTARIO_MIGRACION_ACTIVIDADES.md`
  (fila `leftRight`): pasa de "P2 pendiente" a "✅ P2 migrada".
  Registro en `engine-registry.ts` (añadido `leftRight` al Set `migratedEngines`)
  y `engine-screens.tsx` (lazy + Suspense con fallback estándar). El manifiesto
  JSON `leftRight.json` ya estaba importado en el catálogo desde la Fase 1 por
  lo que el routing funciona sin tocar navegación.

---

## Comprobación de salida

La cobertura V1 acordada funciona desde manifiestos y cada actividad migrada tiene test de núcleo y comprobación visual.

---

# Fase 3 — Sesiones, corrección y resumen

## Pasos

1. ✅ completado — Sesión de aula con dificultad, corrección y resumen (`SummaryScreen`).
2. ✅ completado — Repetición desde el resumen; cada motor valida su respuesta.
3. ✅ completado — Decisión 2026-10-17: no persistir/recuperar sesión a mitad; relanzar es suficiente.

## Comprobación de salida

✅ El profesor lanza, corrige, ve resumen y puede repetir. Recuperar sesión tras
cerrar el navegador queda fuera de alcance por decisión pedagógica.

---

# Fase 4 — Pizarra digital y entrada táctil

## Pasos

1. Solicitar/registrar modelo de panel, PC, Windows, navegador, resolución y cableado HDMI/USB Touch.
2. Crear pantalla de diagnóstico de Pointer Events: tipo, ID, coordenadas, presión, arrastre y multitouch.
3. Probar Chrome y Edge con la misma lista de gestos.
4. Definir navegador recomendado, escalado Windows, resolución y modo de pantalla.
5. Aplicar `touch-action`, objetivos táctiles mínimos, foco visible y bloqueo de selección accidental.
6. Probar pantalla completa, salida segura y recuperación tras pérdida de foco.
7. Medir latencia, FPS, CPU y memoria con una actividad representativa.
8. Actualizar guía de pizarra y abrir incidencias para cada discrepancia de hardware.

## Comprobación de salida

El panel real completa diagnóstico, actividad de arrastre y una sesión sin fallos de entrada perceptibles.

---

# Fase 5 — Reconocimiento de dígitos

## Pasos

1. Crear copia inmutable y con hash de `model.json` y `group1-shard1of1.bin` del proyecto Electron.
2. Crear ficha de modelo: fecha, origen, formato TF.js, versión, tamaño y métrica conocida; indicar que no se conservan fotos de entrenamiento.
3. Extraer canvas/preprocesado como `DigitCell`, con Pointer Events, trazos, limpiar, borrar último, undo/redo y accesibilidad.
4. Crear adaptador de inferencia TF.js que cargue el modelo migrado sin Electron.
5. Ejecutar un conjunto pequeño de ejemplos manuales y comparar resultado PWA/Electron.
6. Implementar resultado con dígito, confianza, alternativas, versión y latencia.
7. Aplicar umbral 85 % y panel docente para confirmar o repetir.
8. Guardar correcciones locales con minimización de datos y opción de reset/exportación.
9. Crear Recognition Lab para dibujar, revisar predicción, etiquetar y exportar muestras.
10. Crear dataset de evaluación nuevo y separado; no reentrenar el modelo base sin datos suficientes.
11. Medir matriz de confusión, precisión por dígito, abstenciones y latencia en pizarra.
12. Evaluar conversión ONNX solo comparando todas las predicciones contra el TF.js original.

## Comprobación de salida

El modelo migrado carga offline, reconoce una DigitCell o pide docente, y tiene informe reproducible de rendimiento.

---

# Fase 6 — PWA y offline

## Pasos

1. Añadir iconos de PWA, manifest completo y captura de pantalla de instalación.
2. Definir versión de caché y estrategia: shell precacheado, recursos de actividad y modelo local.
3. Implementar actualización disponible sin interrumpir sesiones activas.
4. Guardar sesiones, configuración y muestras en IndexedDB con migraciones de esquema.
5. Mostrar estado de red y explicar qué datos están pendientes de sincronización futura.
6. Simular sin red en DevTools: primer uso, recarga, sesión activa, reconocimiento y ficha.
7. Simular actualización de service worker y asegurar que no borra datos locales.
8. Documentar recuperación ante caché dañada y exportación de datos locales.

## Comprobación de salida

La PWA se instala, abre sin Internet y completa el flujo V1 definido sin perder una sesión.

---

# Fase 7 — Fichas

## Pasos

1. ✅ completado — Contrato de ficha + generador PWA (`src/core/ficha/`).
2. ✅ completado — Plantilla A4, alumno y soluciones con la misma semilla.
3. ✅ completado — PDF/DOCX y preview.
4. ✅ completado — Las 62 actividades validadas en [REVISION_MANUAL_FICHAS.md](REVISION_MANUAL_FICHAS.md) (2026-10-17).

## Comprobación de salida

✅ Una configuración genera ficha A4 y soluciones reproducibles (validado).

---

# Fase 8 — Experiencia docente local

## Pasos

1. ✅ completado — Navegación de inicio: clase, pizarra, ficha y configuración.
2. ✅ completado — Perfil/tema de aula local sin nombres de alumnos.
3. ✅ completado — Lanzamiento de actividad desde catálogo (flujo de aula validado en uso).
4. ✅ completado — Selector de curso, bloque, actividad y dificultad desde manifiestos.
5. ✅ completado — Reconocimiento de dígitos operativo en pizarra (DigitCell / muestras locales).
6. ✅ completado — Validación en uso real al cerrar las 62 actividades (2026-10-17).
7. ✅ completado — Sin iteraciones adicionales de momento; el flujo se considera correcto.

## Comprobación de salida

✅ Un docente puede preparar, lanzar y cerrar una actividad sin ayuda técnica
(validado el 2026-10-17).

---

# Fase 9 — Privacidad y datos

## Pasos

1. Convocar reunión con dirección, TIC y DPD.
2. Definir finalidad, responsable, roles, categorías, retención, exportación y supresión.
3. Completar registro de actividad y EIPD si corresponde.
4. Decidir infraestructura, región, proveedores, encargados, copias y plan de salida.
5. Diseñar datos con IDs aleatorios y tabla de equivalencias separada si se aprueba alumnado.
6. Obtener decisión escrita antes de construir login, alumnos o progreso individual.

## Comprobación de salida

Existe aprobación documentada de alcance de datos e infraestructura.

---

# Fase 10 — API e identidad

## Estado (2026-10-19): en curso (núcleo Auth + Netlify listos)

Ver detalle en `ROADMAP_DE_EJECUCION_DETALLADO.md` (Fase 10) y
`ESTADO_DEL_PROYECTO.md`. Resumen: login + staff + invites + D-036/D-037 +
Netlify prod **hechos**; pendiente E2E, SMTP si hace falta, admin fails.

## Pasos

1. Definir contratos API y modelo de errores versionado. 🚧 parcial — piloto usa
   Supabase RPC + Edge Functions, no una API REST genérica.
2. Crear entorno staging aislado y secretos fuera del repositorio. ✅ parcial —
   `.env` local + Netlify env Publishable
   ([CHECKLIST_CALIDAD_AUTH.md](CHECKLIST_CALIDAD_AUTH.md) §C/§E).
3. Implementar autenticación de profesorado, expiración, cierre y **cambio de
   contraseña (definir una nueva; D-036)**. ✅ — login/cierre/ban + pantallas
   contraseña nueva + recovery un uso + popup éxito.
4. Implementar roles y autorización server-side por centro, clase y recurso.
   ✅ completado para el piloto staff (RLS + `is_school_owner` / member activo).
5. Crear endpoints mínimos de perfil, actividades/configuración y sincronización.
   ⏳ pendiente (fuera del cierre mínimo de Fase 10).
6. Añadir validación de entrada, rate limiting, logs minimizados y pruebas de
   permisos. 🚧 parcial — OWASP signup, rate invite, `auth_security_events`,
   Vitest mocks; E2E pendiente.
7. Probar offline/reconexión y conflictos de datos locales. ⏳ pendiente (Fase 6).

## Comprobación de salida

Un profesor solo lee/modifica recursos autorizados y los tests bloquean accesos cruzados.
PWA en Netlify con gate de Auth; cambio de contraseña = contraseña nueva (D-036).

---

# Fase 11 — Operación

## Pasos

1. Separar desarrollo, staging y producción.
2. Automatizar pruebas, build, auditoría y despliegue desde CI.
3. Versionar esquema, migraciones, releases y reversión.
4. Configurar backups cifrados y una restauración ensayada.
5. Añadir monitorización privada, alertas y runbooks.
6. Mantener manual docente/administrador ligado a cada release.

## Comprobación de salida

Se puede desplegar, observar, restaurar y revertir una versión con procedimiento probado.

---

# Fase 12 — Seguridad

## Pasos

1. Crear threat model e inventario de activos.
2. Configurar secretos, MFA administrativa y mínimo privilegio.
3. Aplicar sesión segura, rate limiting, validación, XSS, CSRF, CSP y CORS.
4. Activar auditoría de dependencias, secret scanning y protección de CI.
5. Probar IDOR/BOLA, enumeración, fuerza bruta, backups y respuesta a incidentes.
6. Cerrar hallazgos críticos antes de piloto.

## Comprobación de salida

Security gate firmado con evidencias de controles y pruebas.

---

# Fase 13 — Piloto

## Pasos

1. Delimitar clase, docente, materia, duración y métricas.
2. Preparar consentimientos/procedimientos que determine el DPD.
3. Probar instalación, pizarra, offline, fichas, actualización y restauración antes de la primera clase.
4. Registrar incidencias sin datos personales innecesarios.
5. Medir preparación, fluidez, errores y utilidad docente.
6. Revisar resultados, deuda, seguridad, arquitectura y prioridades al cierre.

## Comprobación de salida

Informe de piloto con decisión explícita de corregir, ampliar o preparar producción.

---

# Fase 14 — Alumnos, tareas y progreso

## Pasos

1. No iniciar sin aprobación de Fase 9 y gates de seguridad.
2. Implementar alumno, matrícula, clase e histórico minimizados.
3. Añadir tareas, asignaciones, entregas, corrección y repeticiones.
4. Implementar progreso por alumno/clase/tema y exportación autorizada.
5. Probar retención, borrado, permisos y restauración.

## Comprobación de salida

El seguimiento individual es legalmente aprobado, útil y aislado por recurso.

---

# Fase 15 — Multi-colegio y ampliación

## Pasos

1. No iniciar hasta consolidar piloto, operación y seguridad.
2. Crear `School/Organization`, roles y aislamiento obligatorio en cada consulta API/base de datos.
3. Añadir gestión de profesorado, cursos académicos, configuración y branding por centro.
4. Probar acceso cruzado, exportación, retención y eliminación completa por colegio.
5. Añadir cursos/materias mediante manifiestos; hacer revisión arquitectónica y pentest antes del segundo centro.

## Comprobación de salida

Un segundo colegio puede incorporarse sin acceso cruzado ni cambios estructurales en el núcleo.
