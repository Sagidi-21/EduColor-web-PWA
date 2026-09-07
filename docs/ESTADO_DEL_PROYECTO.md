# Estado del proyecto

## Punto de trabajo actual

- **Fase activa:** 0 — Arranque técnico y límites.
- **Paso activo:** 4 — Estructura de capas.
- **Seguimiento:** se realiza en los documentos del repositorio; no se utiliza
  GitHub Projects para reducir gestión y consumo innecesario.

## Aprobaciones

| Ámbito | Responsable | Cuándo interviene |
| --- | --- | --- |
| Pedagógico | Director del colegio | Cambios de alcance, currículo, metodología y salida de piloto. |
| Técnico | Salvador | Arquitectura, implementación, calidad, despliegue y seguridad técnica. |
| Feedback de 1.º | Profesor/a de Matemáticas de 1.º | Validación de actividades y experiencia de aula de 1.º. |
| Feedback de 2.º | Profesor/a de Matemáticas de 2.º | Validación de actividades y experiencia de aula de 2.º. |

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

| Fecha | Decisión | Motivo |
| --- | --- | --- |
| 2026-09-07 | Seguimiento mediante documentos en `docs`, sin tablero externo. | Reducir gestión adicional y consumo de contexto. |
| 2026-09-07 | Director como aprobación pedagógica; Salvador como aprobación técnica. | Separar decisión educativa y responsabilidad de implementación. |
| 2026-09-07 | Feedback de profesorado de Matemáticas de 1.º y 2.º en las implementaciones. | Validar el producto en los dos cursos objetivo de V1. |
| 2026-09-07 | Alcance V1 confirmado: Matemáticas 1.º/2.º, profesorado, pizarra, fichas, sesiones offline y reconocimiento de dígitos. | Concentrar la primera versión en el uso real de aula. |
