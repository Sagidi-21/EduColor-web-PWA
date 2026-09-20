# Decisiones del proyecto

Registro de decisiones que afectan al producto, arquitectura, operación o
alcance. Una decisión no se modifica ni se sustituye: se añade una nueva entrada
que indique qué decisión anterior reemplaza y por qué.

| ID    | Fecha      | Estado   | Decisión                                                                                                     | Contexto y consecuencia                                                                                                                               |
| ----- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | 2026-09-07 | Aprobada | EduColor web PWA se desarrolla en un repositorio independiente.                                              | El proyecto Electron queda intacto como producto funcional y referencia de migración. No se copia Electron, IPC ni empaquetado Windows.               |
| D-002 | 2026-09-07 | Aprobada | La arquitectura se prepara para crecer, pero la V1 se limita a Matemáticas de 1.º y 2.º.                     | Evita ampliar contenidos o usuarios antes de validar el uso real de aula.                                                                             |
| D-003 | 2026-09-07 | Aprobada | La V1 incluye profesorado, pizarra digital, fichas, sesiones offline y reconocimiento de dígitos.            | Alumnado, tareas, familias y multi-colegio se posponen.                                                                                               |
| D-004 | 2026-09-07 | Aprobada | Una sesión offline conserva y recupera actividad, ejercicios, respuestas, corrección y resumen sin Internet. | La PWA debe persistir la sesión localmente y no depender de una API durante la clase.                                                                 |
| D-005 | 2026-09-07 | Aprobada | El director del colegio aprueba el ámbito pedagógico; Salvador aprueba el técnico.                           | Las actividades de 1.º y 2.º requieren feedback de sus respectivos profesores de Matemáticas.                                                         |
| D-006 | 2026-09-07 | Aprobada | El seguimiento se mantiene en documentos de `docs`, sin tablero externo.                                     | Reduce gestión y consumo de contexto; `ESTADO_DEL_PROYECTO.md` indica fase y paso activos.                                                            |
| D-007 | 2026-09-07 | Aprobada | El modelo de reconocimiento ya entrenado se preserva y reutiliza.                                            | Se conserva `model.json` y sus pesos como artefacto inmutable; al no existir las fotos originales, no se reentrena sin un nuevo dataset y evaluación. |
| D-008 | 2026-09-07 | Aprobada | Los IDs técnicos de contenido se escriben en inglés y los textos visibles en español.                        | Los IDs siguen siendo estables al ampliar materias/cursos; la interfaz permanece natural para profesorado del colegio.                                |
| D-009 | 2026-09-07 | Aprobada | Los manifiestos se almacenan como JSON puro y se validan con JSON Schema.                                    | Cada JSON enlaza su schema y la aplicación lo importa directamente; los tests impiden estructuras inválidas.                                          |
| D-010 | 2026-09-07 | Aprobada | La aplicación Electron es la referencia canónica de experiencia visual y funcional de la PWA.                | La migración preserva pantallas, flujos, recursos y funciones existentes; solo se adapta la capa técnica incompatible con la web.                     |
| D-011 | 2026-09-07 | Aprobada | La base visual y de recursos se ejecuta dentro de la Fase 1, antes de habilitar motores.                     | Evita una PWA visualmente ajena a EduColor sin adelantar ni declarar migradas las actividades de la Fase 2.                                           |
| D-012 | 2026-09-07 | Aprobada | La deuda técnica y las reservas se controlan mediante un registro único y trazable.                          | Se revisan solo filas abiertas y el ámbito tocado en cada cambio; la auditoría completa queda para cierre de fase o release.                          |
| D-013 | 2026-09-20 | Aprobada | **Adelanto de feature:** el desarrollo del "Compañero IA" (cuestionario de mascota + generación de imágenes con xAI) se incorpora en rama `Implementación_IA`, adelantándose al roadmap de actividades. | Estabiliza la configuración de clase con una mascota personalizada antes de la V1; el backend Express (ts Node, tsx) y proxy Vite son componentes nuevos que no afectan al core de Matemáticas. El profesorado validará la feature antes de cerrarla. |

## Cómo añadir una decisión

1. Añadir un identificador consecutivo `D-XXX`.
2. Indicar fecha, estado (`Propuesta`, `Aprobada`, `Sustituida` o `Descartada`) y la persona que aprobó cuando corresponda.
3. Describir la decisión y su consecuencia práctica, no solo la discusión.
4. Si reemplaza otra decisión, citar su ID y actualizar el estado de la anterior.
5. Enlazar la issue, pull request, evidencia de prueba o documento relacionado cuando exista.
