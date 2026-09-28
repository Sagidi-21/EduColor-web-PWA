# Definition of Done

Una tarea no se considera terminada porque el código “parece funcionar”. Debe
cumplir la lista aplicable y dejar evidencia enlazable desde la issue o pull
request.

## Obligatorio para cualquier cambio

- [ ] Objetivo, alcance y criterios de aceptación definidos.
- [ ] Código revisado; no añade dependencias, secretos ni datos personales sin decisión previa.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasan.
- [ ] Pruebas nuevas o actualizadas para la lógica modificada, o justificación explícita si no aplican.
- [ ] Documentación, manifiestos, decisiones o estado actualizados cuando corresponda.
- [ ] La CI de GitHub está verde.

## Estándar de cobertura de test

Se mide con `npm run test:coverage`, que instrumenta con `@vitest/coverage-v8` y
falla si `src/core/activities/` baja de los umbrales de `vite.config.ts`.

| Ámbito                                       | Umbral exigido                                        | Estado medido (2026-09-28)  |
| -------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| `src/core/activities/**` (lógica matemática) | 100 % funciones, 90 % líneas y sentencias, 85 % ramas | 100 / 97,49 / 96,06 / 89,95 |
| Resto del repositorio                        | Sin umbral                                            | 72,52 % líneas              |

Motivo del alcance: en `src/core/activities/` vive la lógica que decide si la
respuesta del alumno es correcta, que es donde un error se traduce en un alumno
mal corregido. Los renderers, la plataforma de dígitos y el backend **no** tienen
umbral: su cobertura sube de forma mayoritaria y la Definition of Done admite
una justificación explícita en lugar de un número. La brecha está registrada
como `DT-014`.

Al tocar `src/core/activities/`, `npm run test:coverage` debe pasar. Si una
rama nueva es difícil de cubrir, se justifica en la issue en lugar de relajar
el umbral.

## Si cambia una actividad o contenido de Matemáticas

- [ ] Los límites pedagógicos y respuestas correctas están probados.
- [ ] Se ha indicado si aplica a 1.º, 2.º o ambos cursos.
- [ ] El profesor de Matemáticas del curso afectado ha dado feedback antes del cierre pedagógico.

## Si cambia pizarra, táctil o reconocimiento

- [ ] Se prueba con mouse y táctil/Pen cuando esté disponible.
- [ ] Se registra prueba en pizarra real o se declara expresamente pendiente.
- [ ] Se revisan rendimiento, accesibilidad y comportamiento offline.

## Si cambia datos, identidad o infraestructura

- [ ] Existe una decisión de privacidad/seguridad aplicable y aprobada.
- [ ] Se han probado permisos, validación de entradas, errores y recuperación.
- [ ] Se han actualizado backups, restauración, logs o runbooks si afectan al cambio.

## Cierre

La aprobación técnica corresponde a Salvador. Las decisiones pedagógicas,
curriculares y de uso de aula requieren la aprobación del director y el feedback
del profesor de Matemáticas de 1.º o 2.º que corresponda.
