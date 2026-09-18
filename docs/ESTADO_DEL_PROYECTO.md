# Estado del proyecto

## Punto de trabajo actual

- **Fase activa:** 2 â€” MigraciÃ³n del catÃ¡logo matemÃ¡tico V1 (con Fase 5 adelantada ya completada).
- **Paso activo:** Las actividades `suma`, `resta`, `igualdad`, `counting`, `problemas`, `relacionar`, `rectaNumerica` y `tresSumandos` estÃ¡n tÃ©cnicamente implementadas (core, tests, manifiestos, renderer, routing). Se estÃ¡ migrando `tresSumandos` (Sumas con tres sumandos). El punto 7 (`ordenar`) de la Fase 2 y la Fase 5 del canvas (reconocimiento de dÃ­gitos y preprocesado) ya estÃ¡n completados. La Fase 1 cerrÃ³ con manifiestos, selector y un motor extra (`comparison`) no acoplado al conteo.
- **Seguimiento:** se realiza en los documentos del repositorio; no se utiliza
  GitHub Projects para reducir gestiÃ³n y consumo innecesario.

## Aprobaciones

| Ãmbito           | Responsable                        | CuÃ¡ndo interviene                                                       |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| PedagÃ³gico      | Director del colegio               | Cambios de alcance, currÃ­culo, metodologÃ­a y salida de piloto.         |
| TÃ©cnico         | Salvador                           | Arquitectura, implementaciÃ³n, calidad, despliegue y seguridad tÃ©cnica. |
| Feedback de 1.Âº | Profesor/a de MatemÃ¡ticas de 1.Âº | ValidaciÃ³n de actividades y experiencia de aula de 1.Âº.                |
| Feedback de 2.Âº | Profesor/a de MatemÃ¡ticas de 2.Âº | ValidaciÃ³n de actividades y experiencia de aula de 2.Âº.                |

## Regla de alcance V1 confirmada

La V1 incluye exclusivamente MatemÃ¡ticas de 1.Âº y 2.Âº de Primaria,
profesorado, pizarra digital, fichas, sesiones offline y reconocimiento de
dÃ­gitos. La arquitectura se mantiene preparada para crecer, pero alumnado,
tareas, familias y multi-colegio no entran en esta versiÃ³n.

Una **sesiÃ³n offline** significa que, si se corta Internet durante una
actividad de pizarra, permanecen disponibles la actividad ya cargada, sus
ejercicios, respuestas, correcciÃ³n y resumen. TambiÃ©n se podrÃ¡ recuperar la
sesiÃ³n local al recargar o reabrir la PWA. No implica todavÃ­a que haya tareas
individuales ni sincronizaciÃ³n de datos de alumnos.

Cada implementaciÃ³n relevante se revisarÃ¡ con el profesorado correspondiente
antes de considerar cerrada su fase pedagÃ³gica.

## Decisiones registradas

Las decisiones completas, su estado y sus consecuencias se mantienen en
[DECISIONES.md](DECISIONES.md). Esta tabla resume solamente los acuerdos de
seguimiento.

La deuda tÃ©cnica y las reservas de recursos se controlan en
[DEUDA_TECNICA.md](DEUDA_TECNICA.md). Las revisiones ordinarias consultan ese
registro y el Ã¡mbito del cambio; la auditorÃ­a completa se reserva para el
cierre de fase o una release.

| Fecha      | DecisiÃ³n                                                                                                                   | Motivo                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2026-09-07 | Seguimiento mediante documentos en `docs`, sin tablero externo.                                                             | Reducir gestiÃ³n adicional y consumo de contexto.                             |
| 2026-09-07 | Director como aprobaciÃ³n pedagÃ³gica; Salvador como aprobaciÃ³n tÃ©cnica.                                                  | Separar decisiÃ³n educativa y responsabilidad de implementaciÃ³n.             |
| 2026-09-07 | Feedback de profesorado de MatemÃ¡ticas de 1.Âº y 2.Âº en las implementaciones.                                             | Validar el producto en los dos cursos objetivo de V1.                         |
| 2026-09-07 | Alcance V1 confirmado: MatemÃ¡ticas 1.Âº/2.Âº, profesorado, pizarra, fichas, sesiones offline y reconocimiento de dÃ­gitos. | Concentrar la primera versiÃ³n en el uso real de aula.                        |
| 2026-09-07 | RevisiÃ³n tÃ©cnica de la Fase 0 aprobada.                                                                                   | CI verde y estructura, documentaciÃ³n y controles de calidad verificados.     |
| 2026-09-07 | Electron queda como referencia canÃ³nica de paridad visual y funcional de la PWA.                                           | Evitar rediseÃ±ar o perder pantallas y funciones que ya operan en el colegio. |
| 2026-09-18 | Curriculo de `counting` disenado con 8 niveles (1-L1 a 2-L4) con mecanicas progresivas TOUCH > GROUP > FILL_TABLE > SELECT. | Alineamiento pedagogico con la progresion de 1.o y 2.o de Primaria. |
| 2026-09-18 | En 2-L3 se eliminan preguntas guiadas CDU dejando solo la pregunta final de composicion. | El nino que ha superado 2-L2 debe llegar al numero sin andamiaje intermedio. |
| 2026-09-18 | Numpad en layout horizontal para niveles con tabla posicional FILL_TABLE. | Ganar espacio vertical para objetos visuales en pantalla de pizarra. |
