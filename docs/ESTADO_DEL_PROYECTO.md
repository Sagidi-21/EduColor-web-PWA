# Estado del proyecto

## Punto de trabajo actual

- **Fase activa:** 2 — Migración del catálogo matemático V1 (con Fase 5 adelantada ya completada).
- **Paso activo:** Las actividades `suma`, `resta`, `igualdad`, `counting`, `problemas`, `relacionar`, `rectaNumerica` y `tresSumandos` están técnicamente implementadas (core, tests, manifiestos, renderer, routing). El punto 7 (`ordenar`) de la Fase 2 y la Fase 5 del canvas (reconocimiento de dígitos y preprocesado) ya están completados. La Fase 1 cerró con manifiestos, selector y un motor extra (`comparison`) no acoplado al conteo.
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

| Fecha      | Decisión                                                                                                                    | Motivo                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 2026-09-07 | Seguimiento mediante documentos en `docs`, sin tablero externo.                                                             | Reducir gestión adicional y consumo de contexto.                             |
| 2026-09-07 | Director como aprobación pedagógica; Salvador como aprobación técnica.                                                      | Separar decisión educativa y responsabilidad de implementación.              |
| 2026-09-07 | Feedback de profesorado de Matemáticas de 1.º y 2.º en las implementaciones.                                                | Validar el producto en los dos cursos objetivo de V1.                        |
| 2026-09-07 | Alcance V1 confirmado: Matemáticas 1.º/2.º, profesorado, pizarra, fichas, sesiones offline y reconocimiento de dígitos.     | Concentrar la primera versión en el uso real de aula.                        |
| 2026-09-07 | Revisión técnica de la Fase 0 aprobada.                                                                                     | CI verde y estructura, documentación y controles de calidad verificados.     |
| 2026-09-07 | Electron queda como referencia canónica de paridad visual y funcional de la PWA.                                            | Evitar rediseñar o perder pantallas y funciones que ya operan en el colegio. |
| 2026-09-18 | Curriculo de `counting` disenado con 8 niveles (1-L1 a 2-L4) con mecanicas progresivas TOUCH > GROUP > FILL_TABLE > SELECT. | Alineamiento pedagogico con la progresion de 1.o y 2.o de Primaria.          |
| 2026-09-18 | En 2-L3 se eliminan preguntas guiadas CDU dejando solo la pregunta final de composicion.                                    | El nino que ha superado 2-L2 debe llegar al numero sin andamiaje intermedio. |
| 2026-09-18 | Numpad en layout horizontal para niveles con tabla posicional FILL_TABLE.                                                   | Ganar espacio vertical para objetos visuales en pantalla de pizarra.         |

### Feature adelantada: Compañero IA personalizado 🚀

El profesorado ha solicitado adelantar el desarrollo del **Compañero IA** — un asistente visual
personalizado para cada clase, generado mediante la API de Hugging Face Inference.

- **Rama activa:** `main`; la feature se desarrolló en `Implementación_IA` y quedó integrada en `main`.
- **Backend:** Servidor Express (`src/server/`) con proxy Vite (`/api → localhost:3001`), validación, rate limiting y manejo seguro de errores. El token de Hugging Face se carga desde `HF_TOKEN` en el servidor y nunca se expone al frontend.
- **Frontend:** `MascotaScreen` en `src/features/mascota/` con cuestionario de 6 pasos. El primer paso muestra 11 tarjetas con imágenes y etiquetas de tema, con avance automático al elegir un tema; «Otro tema» requiere confirmar el texto con **OK**. Los pasos de tipo de personaje y personalidad usan tarjetas con imágenes, transición de portal y tarjetas de selecciones previas para volver atrás. El paso final incluye un botón "Crear compañero" con diseño "Aurora" (neón/animado) en CSS puro.
- **Estado:** Backend, frontend, assets de temas, tipos y personalidad, tests y build implementados. Suite completa verde (473 tests), junto con lint, typecheck, build y formato Prettier. Pendiente configurar `HF_TOKEN` en el `.env` del servidor, reiniciar el backend y realizar la validación pedagógica del profesorado.
- **Comprobación de conexión:** `GET /api/mascot/health-hf` valida el token y el modelo sin generar imágenes.

La implementación actual queda recogida en este registro y en los archivos de `src/features/mascota/`, `src/server/` y `src/assets/mascota/`.

- **Arquitectura futura (Producción):** Actualmente, las imágenes generadas se manejan en memoria (Base64) y se almacenan temporalmente en el `localStorage` del navegador a través de `ClassProfileContext`. Debido a los límites de tamaño del `localStorage` (típicamente 5MB), para el entorno de producción real se utilizará **Supabase** (Storage y Database) en su capa gratuita. Cuando el profesor apruebe una nueva mascota y haga clic en "Guardar", el servidor subirá la imagen al _Bucket_ de Storage de Supabase y actualizará la base de datos reemplazando la URL de la mascota anterior por la nueva, garantizando escalabilidad y sincronización en múltiples dispositivos sin consumir el almacenamiento local del navegador.
