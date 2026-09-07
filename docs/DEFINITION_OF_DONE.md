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
