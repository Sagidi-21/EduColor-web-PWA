# Ejecución paso a paso — EduColor web PWA

Este documento desarrolla el [roadmap de ejecución](ROADMAP_DE_EJECUCION_DETALLADO.md). No se empieza una fase hasta cumplir sus dependencias y no se marca como cerrada sin su validación.

## Convenciones de trabajo

- Una tarea se completa en una rama y pull request propios.
- Cada cambio de lógica lleva test; cada cambio visual/táctil lleva prueba manual documentada.
- No se copian archivos Electron sin revisar dependencias, licencia, tests y acoplamiento a `window.api`.
- Antes de migrar un activo: copiarlo, identificar origen, versión y licencia/autoría, y anotar la trazabilidad.

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
10. Crear cargador, registro de motores y selector por curso/bloque/materia.
11. Añadir tests: manifiesto válido, ID duplicado, motor inexistente, parámetro inválido y filtro por curso.
12. Migrar al menos una actividad compartida adicional para demostrar que el sistema no está hecho a medida del conteo.

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

## Comprobación de salida

La cobertura V1 acordada funciona desde manifiestos y cada actividad migrada tiene test de núcleo y comprobación visual.

---

# Fase 3 — Sesiones, corrección y resumen

## Pasos

1. Definir tipos inmutables `SessionConfiguration`, `ExerciseAttempt`, `ActivitySession` y `SessionSummary`.
2. Implementar creación de sesión desde manifiesto, parámetros, semilla y configuración docente.
3. Añadir controles de dificultad, número de ejercicios, corrección inmediata, soluciones y máximo de intentos.
4. Implementar validador de respuesta común y adaptadores para cada motor.
5. Guardar cada intento con timestamp, sin identidad de alumno en V1.
6. Construir resumen inicial, resumen final y repetición solo de fallados.
7. Persistir sesión en IndexedDB y restaurarla al recargar.
8. Añadir tests de reanudación, semilla, intentos, resumen y repetición.
9. Añadir un aviso claro antes de descartar una sesión activa.

## Comprobación de salida

Cerrar, recargar y continuar una sesión conserva configuración, ejercicios y resultados locales.

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

1. Definir contrato de ficha compartido con la actividad: semilla, parámetros, curso, título y versión.
2. Extraer renderizado de ejercicios del exportador DOCX Electron sin APIs de Electron.
3. Diseñar plantilla A4 y probar márgenes en impresión/PDF real.
4. Crear ficha de alumno y hoja de soluciones desde la misma semilla.
5. Mantener DOCX como compatibilidad y añadir ruta de PDF.
6. Crear snapshots o validación visual de cada tipo de ficha prioritario.
7. Verificar logo, recursos, tipografía, saltos de página y contenido accesible.

## Comprobación de salida

Una configuración de actividad genera ficha A4 y soluciones reproducibles con la misma semilla.

---

# Fase 8 — Experiencia docente local

## Pasos

1. Diseñar navegación de inicio con acciones: continuar, lanzar, crear ficha y configurar aula.
2. Migrar tema/perfil local sin incluir nombres de alumnos.
3. Garantizar que una actividad habitual se lanza en dos toques.
4. Añadir selector de curso, bloque, actividad y dificultad desde manifiestos.
5. Crear ajustes locales de reconocimiento y aprendizaje.
6. Probar con docente una clase simulada y registrar pasos innecesarios/confusiones.
7. Iterar hasta reducir la preparación de clase al flujo acordado.

## Comprobación de salida

Un docente puede preparar, lanzar y cerrar una actividad sin ayuda técnica.

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

## Pasos

1. Definir contratos API y modelo de errores versionado.
2. Crear entorno staging aislado y secretos fuera del repositorio.
3. Implementar autenticación de profesorado, expiración, cierre y recuperación segura.
4. Implementar roles y autorización server-side por centro, clase y recurso.
5. Crear endpoints mínimos de perfil, actividades/configuración y sincronización.
6. Añadir validación de entrada, rate limiting, logs minimizados y pruebas de permisos.
7. Probar offline/reconexión y conflictos de datos locales.

## Comprobación de salida

Un profesor solo lee/modifica recursos autorizados y los tests bloquean accesos cruzados.

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
