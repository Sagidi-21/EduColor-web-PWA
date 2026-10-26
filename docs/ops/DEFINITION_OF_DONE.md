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
mal corregido. Los renderers no tienen umbral numérico, pero sí están obligados a
tener un smoke test (ver la sección siguiente): su cobertura sube de forma
mayoritaria por ritmo de migración, no por criterio. `src/platform/digit/` y
`src/server/` siguen sin exigir nada, y esa brecha está registrada como `DT-014`.

Al tocar `src/core/activities/`, `npm run test:coverage` debe pasar. Si una
rama nueva es difícil de cubrir, se justifica en la issue en lugar de relajar
el umbral.

## Si cambia una actividad o contenido de Matemáticas

- [ ] Los límites pedagógicos y respuestas correctas están probados.
- [ ] Se ha indicado si aplica a 1.º, 2.º o ambos cursos.
- [ ] El profesor de Matemáticas del curso afectado ha dado feedback antes del cierre pedagógico.

## Smoke test del renderer

Cada renderer de `src/features/matematicas/` lleva su
`XxxScreen.test.tsx`. El motor ya tiene sus tests de núcleo en
`src/core/activities/`, que prueban la matemática pero nunca renderizan nada: un
smoke test es lo que cubre la capa de React, que es la que toca el profesor.

No es opcional y no entra en los umbrales de cobertura de
`src/core/activities/`, porque protege de un fallo distinto: que el componente
reviente al montarse, que no pinte lo que el motor dice, o que el clic en la
opción correcta no produzca el feedback.

Tres reglas de redacción, para que el test no se pudra:

1. **Las aserciones se escriben contra el manifiesto y la salida del motor**, no
   contra lo que el componente resulta hacer. Se llama a `generateSession` para
   saber qué debería haber en pantalla y luego se comprueba que el DOM coincide.
   Un test escrito leyendo el propio componente codifica las suposiciones del
   autor y pasa en verde aunque la app esté rota.
2. **Se comprueba comportamiento, nunca CSS.** El DOM solo tiene clases; los
   bordes, colores y tamaños se verifican a ojo en el pase manual y ningún test
   puede hacerlo. Un smoke test que afirmara sobre estilos daría una falsa
   sensación de cobertura.
3. **El `DigitCell` se comprueba por su _fallback_ de _Suspense_.** Va envuelto en
   `React.lazy`, así que en `happy-dom` aparece `dab--loading`. Eso demuestra que
   se montó sin necesidad de que TensorFlow.js cargue, que es justo lo que
   interesa verificar aquí.

Lo que un smoke test **no** cubre, y corresponde al pase manual en pizarra: el
táctil y el Pen, el `DigitCell` reconociendo un trazo real, la legibilidad y el
escalado a través del HDMI, y la coherencia visual de la actividad.

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
