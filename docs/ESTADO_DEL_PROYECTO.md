# Estado del proyecto

**Verificado contra el código el 2026-09-30.** Este documento es una página de
estado: dice en qué punto va el proyecto y **enlaza** a quien tiene el detalle. No
mantiene su propia lista de actividades migradas ni sus propias cifras, porque
esa duplicación es lo que hacía que los documentos de `docs/` se contradijeran
entre sí.

## Dónde vive cada dato

| Pregunta                                              | Documento que la responde                                                                                             |
| :---------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| ¿Qué actividades hay migradas y cuál es la siguiente? | [INVENTARIO_MIGRACION_ACTIVIDADES.md](./INVENTARIO_MIGRACION_ACTIVIDADES.md)                                          |
| ¿Dónde acabó cada archivo de Electron?                | [MIGRACION_MAP.md](./MIGRACION_MAP.md)                                                                                |
| ¿Cómo se migra una actividad, paso a paso?            | [EJECUCION_PASO_A_PASO.md](./EJECUCION_PASO_A_PASO.md) y [AGENT_RULES.md](./AGENT_RULES.md)                           |
| ¿Qué falta y con qué calidad cierro?                  | [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) y [DEUDA_TECNICA.md](./DEUDA_TECNICA.md)                             |
| ¿Por qué se decidió así?                              | [DECISIONES.md](./DECISIONES.md)                                                                                      |
| ¿Qué puede reutilizar un renderer?                    | [COMPONENTES_COMPARTIDOS.md](./COMPONENTES_COMPARTIDOS.md)                                                            |
| ¿Hacia dónde va el producto a largo plazo?            | [ROADMAP_MAESTRO.md](./ROADMAP_MAESTRO.md) y [ROADMAP_DE_EJECUCION_DETALLADO.md](./ROADMAP_DE_EJECUCION_DETALLADO.md) |

El inventario se recalcula en cada `npm test`: si un ✅ no coincide con
`src/core/content/engine-registry.ts`, la suite falla.

## Punto de trabajo actual

- **Fase activa:** 2 — Migración del catálogo matemático V1. La Fase 1 (modelo de
  contenido) está cerrada: 62 manifiestos, selector de actividades y el motor
  `comparison` como extra no acoplado al conteo.
- **Estado de la Fase 2:** 33 de 62 actividades migradas y lanzables; 29
  pendientes. El detalle por actividad, con núcleo, renderer y tests, está en el
  [inventario](./INVENTARIO_MIGRACION_ACTIVIDADES.md); no se repite aquí.
- **Siguiente motor:** `balanza`, la primera fila sin ✅ del inventario. La
  regla para elegirlo está en la sección "Siguiente motor a migrar" de ese
  documento, y su prioridad la confirma el profesor de Matemáticas.
- **Fase 5 (escritura de dígitos y reconocimiento local):** adelantada y
  **parcial**, no completa. El subsistema de reconocimiento existe y se usa
  (`LazyDigitCell`, preprocesado, umbral del 85 %, muestras en IndexedDB), pero
  los 12 pasos de la Fase 5 de
  [EJECUCION_PASO_A_PASO.md](./EJECUCION_PASO_A_PASO.md) no están cerrados: faltan
  el dataset de evaluación, la matriz de confusión y el resto del bloque. Este
  documento decía antes que la Fase 5 estaba "completada", y no lo estaba.
- **Lo que bloquea el cierre de la fase:** la validación pedagógica en pizarra. Las
  33 actividades están técnicamente terminadas, pero eso no es lo mismo que
  aprobadas: ninguna está cerrada pedagógicamente todavía.
- **Seguimiento:** se realiza en los documentos del repositorio; no se utiliza
  GitHub Projects para reducir gestión y consumo innecesario.

## Aprobaciones

| Ámbito          | Responsable                      | Cuándo interviene                                                      |
| --------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Pedagógico      | Director del colegio             | Cambios de alcance, currículo, metodología y salida de piloto.         |
| Técnico         | Salvador                         | Arquitectura, implementación, calidad, despliegue y seguridad técnica. |
| Feedback de 1.º | Profesor/a de Matemáticas de 1.º | Validación de actividades y experiencia de aula de 1.º.                |
| Feedback de 2.º | Profesor/a de Matemáticas de 2.º | Validación de actividades y experiencia de aula de 2.º.                |

## Regla de alcance V1 confirmada

La V1 incluye exclusivamente Matemáticas de 1.º y 2.º de Primaria,
profesorado, pizarra digital, fichas, sesiones offline y reconocimiento de
dígitos. La arquitectura se mantiene preparada para crecer, pero alumnado,
tareas, familias y multi-colegio no entran en esta versión.

Una **sesión offline** significa que, si se corta Internet durante una
actividad de pizarra, permanecen disponibles la actividad ya cargada, sus
ejercicios, respuestas, corrección y resumen. También se podrá recuperar la
sesión local al recargar o reabrir la PWA. No implica todavía que haya tareas
individuales ni sincronización de datos de alumnos.

Cada implementación relevante se revisará con el profesorado correspondiente
antes de considerar cerrada su fase pedagógica.

## Decisiones registradas

Las decisiones completas, su estado y sus consecuencias se mantienen en
[DECISIONES.md](DECISIONES.md). Esta tabla resume solamente los acuerdos de
seguimiento.

La deuda técnica y las reservas de recursos se controlan en
[DEUDA_TECNICA.md](DEUDA_TECNICA.md). Las revisiones ordinarias consultan ese
registro y el ámbito del cambio; la auditoría completa se reserva para el
cierre de fase o una release.

| Fecha      | Decisión                                                                                                                    | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-07 | Seguimiento mediante documentos en `docs`, sin tablero externo.                                                             | Reducir gestión adicional y consumo de contexto.                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-09-07 | Director como aprobación pedagógica; Salvador como aprobación técnica.                                                      | Separar decisión educativa y responsabilidad de implementación.                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-09-07 | Feedback de profesorado de Matemáticas de 1.º y 2.º en las implementaciones.                                                | Validar el producto en los dos cursos objetivo de V1.                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-09-07 | Alcance V1 confirmado: Matemáticas 1.º/2.º, profesorado, pizarra, fichas, sesiones offline y reconocimiento de dígitos.     | Concentrar la primera versión en el uso real de aula.                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-09-07 | Revisión técnica de la Fase 0 aprobada.                                                                                     | CI verde y estructura, documentación y controles de calidad verificados.                                                                                                                                                                                                                                                                                                                                                                |
| 2026-09-07 | Electron queda como referencia canónica de paridad visual y funcional de la PWA.                                            | Evitar rediseñar o perder pantallas y funciones que ya operan en el colegio.                                                                                                                                                                                                                                                                                                                                                            |
| 2026-09-18 | Curriculo de `counting` disenado con 8 niveles (1-L1 a 2-L4) con mecanicas progresivas TOUCH > GROUP > FILL_TABLE > SELECT. | Alineamiento pedagogico con la progresion de 1.o y 2.o de Primaria.                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-09-18 | En 2-L3 se eliminan preguntas guiadas CDU dejando solo la pregunta final de composicion.                                    | El nino que ha superado 2-L2 debe llegar al numero sin andamiaje intermedio.                                                                                                                                                                                                                                                                                                                                                            |
| 2026-09-18 | Numpad en layout horizontal para niveles con tabla posicional FILL_TABLE.                                                   | Ganar espacio vertical para objetos visuales en pantalla de pizarra.                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-09-27 | El selector de nivel del popup del catálogo se sustituye por un revelado animado con mascota (`DifficultyReveal`).          | Convertir la elección de nivel en un momento de descubrimiento motivado, con feedback audiovisual en lugar de un popup plano.                                                                                                                                                                                                                                                                                                           |
| 2026-09-30 | Un único documento es dueño de cada dato de estado, y el resto lo enlaza.                                                   | Trece documentos de `docs/` llevaban cada uno su propia lista de actividades migradas y sus propias cifras, y se contradijeron entre sí: `MIGRACION_MAP` daba 30 motores migrados por pendientes, `ESTADO` daba 10 y una suite de 1157 tests que no existía, `ROADMAP_DE_EJECUCION_DETALLADO` daba 26 y con tres cifras distintas para el mismo hito. Decide el inventario, que además se verifica contra el código en cada `npm test`. |

### Feature adelantada: Compañero IA personalizado 🚀

El profesorado ha solicitado adelantar el desarrollo del **Compañero IA** — un asistente visual
personalizado para cada clase, generado mediante la API de Hugging Face Inference.

- **Rama activa:** `main`; la feature se desarrolló en `Implementación_IA` y quedó integrada en `main`.
- **Backend:** Servidor Express (`src/server/`) con proxy Vite (`/api → localhost:3001`), validación, rate limiting y manejo seguro de errores. El token de Hugging Face se carga desde `HF_TOKEN` en el servidor y nunca se expone al frontend.
- **Frontend:** `MascotaScreen` en `src/features/mascota/` con cuestionario de 6 pasos. El primer paso muestra 11 tarjetas con imágenes y etiquetas de tema, con avance automático al elegir un tema; «Otro tema» requiere confirmar el texto con **OK**. Los pasos de tipo de personaje y personalidad usan tarjetas con imágenes, transición de portal y tarjetas de selecciones previas para volver atrás. El paso final incluye un botón "Crear compañero" con diseño "Aurora" (neón/animado) en CSS puro.
- **Estado:** Backend, frontend, assets de temas, tipos y personalidad, tests y build implementados. Suite completa verde, junto con lint, typecheck, build y formato Prettier. El `HF_TOKEN` ya está configurado en el `.env` del servidor. Queda pendiente realizar la validación pedagógica del profesorado.
- **Comprobación de conexión:** `GET /api/mascot/health-hf` valida el token y el modelo sin generar imágenes.

La implementación actual queda recogida en este registro y en los archivos de `src/features/mascota/`, `src/server/` y `src/assets/mascota/`.

- **Arquitectura futura (Producción):** Actualmente, las imágenes generadas se manejan en memoria (Base64) y se almacenan temporalmente en el `localStorage` del navegador a través de `ClassProfileContext`. Debido a los límites de tamaño del `localStorage` (típicamente 5MB), para el entorno de producción real se utilizará **Supabase** (Storage y Database) en su capa gratuita _(actualmente pospuesto para más adelante)_. Cuando el profesor apruebe una nueva mascota y haga clic en "Guardar", el servidor subirá la imagen al _Bucket_ de Storage de Supabase y actualizará la base de datos reemplazando la URL de la mascota anterior por la nueva, garantizando escalabilidad y sincronización en múltiples dispositivos sin consumir el almacenamiento local del navegador.

### Revelado de dificultad con mascota en el catálogo de Matemáticas 🎒✨

Al elegir una actividad del catálogo, el popup de selección de nivel se sustituyó por un
**revelado animado** con la mascota, el sonido y la progresión del Dharma.

- **Componente:** `src/features/matematicas/components/DifficultyReveal.tsx` + `DifficultyReveal.css`, montado por `MatematicasCatalogScreen`. Encapsula la lógica de niveles (filtro por curso, nombre, rango de números y mecánica por nivel) que antes vivía dentro del propio catálogo.
- **Secuencia:** la mascota entra en escena, se abre la mochila con destellos y sonido, las cartas de nivel irrumpen y quedan listas para elegir. Las transiciones usan `framer-motion`; el cierre contra el backdrop o el botón «×» reproduce la animación de salida antes de lanzar el ejercicio.
- **Niveles mostrados:** los 8 niveles curriculares (`1-L1`..`2-L4`), filtrados según el curso activo del perfil de clase; si la actividad pertenece a un solo curso se limita a sus 4 niveles.
- **Variantes de mascota:** `src/assets/mascota/variants/` incluye 21 variantes (`variant_1.webp`..`variant_21.webp`) y `getRandomMascotVariant()`, que elige una al azar en cada apertura para que la escena no sea siempre idéntica. La mochila ya va dibujada en la propia variante: `variant_1` es la imagen con la mochila abierta y las otras 20 son recortes de cuatro en cuatro. Las hojas de origen de los recortes se eliminaron el 2026-09-28 al quedar cubiertas por los recortes; siguen en el historial de git.
- **Audio:** `src/shared/utils/audioSFX.ts` sintetiza los efectos con Web Audio API pura, sin dependencias externas ni ficheros de audio: `playBackpackOpenSFX()` (whoosh + brillo ascendente) y `playCardsBurstSFX()` (ráfaga de cartas). El contexto se crea de forma perezosa, se reanuda ante las políticas de autoplay y degrade silenciosamente si no hay `AudioContext`.
- **Estado:** implementado y verificado. La suite completa está en verde (83 ficheros de test, 856 tests, medido el 2026-09-30; ver la tabla de verificación del [inventario](./INVENTARIO_MIGRACION_ACTIVIDADES.md)), junto con lint, typecheck, build y formato Prettier. Queda pendiente la validación pedagógica del profesorado sobre la claridad de las cartas de nivel antes de darlo por cerrado.

- **Deuda abierta:** ninguna en esta feature. Los assets de mascota se optimizaron el 2026-09-28 con un criterio único WebP (calidad 82): las 32 tarjetas del cuestionario de 1376×768 a 640 px (21,1 MB → 1,02 MB) y las 21 variantes a 512 px (5,5 MB → 0,58 MB), además de borrar las hojas de origen y los duplicados. Las imágenes de `dist` pasan de 43,38 MB a 18,99 MB. Cerrado como `DT-012` en [DEUDA_TECNICA.md](DEUDA_TECNICA.md).
