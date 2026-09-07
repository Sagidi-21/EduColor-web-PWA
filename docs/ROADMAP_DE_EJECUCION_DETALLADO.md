# Roadmap de ejecución detallado — EduColor web PWA

**Fecha:** 2026-09-07  
**Alcance V1:** Matemáticas de 1.º y 2.º, profesorado, pizarra digital, fichas y uso offline.  
**Regla principal:** conservar el dominio educativo de Electron y reconstruir la plataforma web sin copiar Electron, IPC ni empaquetado Windows.

## Estados de reutilización

- ✅ Migrar: activo probado o lógica válida del proyecto Electron.
- 🟡 Adaptar: útil, pero ligado a React/Electron, a un registro manual o a la interfaz actual.
- ❌ Crear: no existe en el proyecto original.
- 🔎 Validar: existe como prototipo o documentación, pero necesita prueba de aula o técnica.

---

# Fase 0 — Arranque técnico y límites

## Objetivo

Tener una base PWA pequeña, verificable y preparada para que el resto del trabajo no vuelva a acoplarse a Electron.

## Ya disponible

- ✅ React, TypeScript, Vite, motores, generadores y pruebas procedentes del proyecto original.
- ✅ Vertical slice de conteo en este repositorio: generador, validador, interfaz, test y build.
- 🟡 Documentación de producto, pizarra, distribución, privacidad y auditoría de escalado.

## Qué hacer

1. Fijar V1: 1.º/2.º, Matemáticas, profesorado, pizarra, fichas, autocorrección, resumen y offline.
2. Excluir explícitamente de V1 alumnado con cuenta, tareas, portal familiar, analítica individual y multi-colegio operativo.
3. Mantener `src/core` independiente de React, navegador, base de datos y API.
4. Añadir estructura objetivo: `core`, `features`, `platform`, `manifests`, `shared` y `docs`.
5. Definir convenciones de identificadores: `subjectId`, `stageId`, `gradeId`, `activityId`, `engineId` y `schemaVersion`.
6. Configurar calidad desde el inicio: TypeScript strict, ESLint, Prettier, Vitest, test de build y CI.
7. Registrar decisiones técnicas y deuda en documentos versionados.

## Terminado cuando

- Una actividad mínima funciona, se prueba y se compila como PWA.
- No hay importaciones de Electron ni `window.api` fuera del repositorio original.
- La V1 y sus exclusiones están documentadas y aprobadas.

---

# Fase 1 — Modelo de contenido extensible

## Objetivo

Poder añadir un curso, materia o actividad sin modificar tipos cerrados, navegación y registros manuales en muchos archivos.

## Ya disponible

- ✅ 62 actividades activas: 47 para 1.º, 58 para 2.º y 43 compartidas.
- ✅ Motores separados con `engine.ts`, renderizadores y generadores.
- 🟡 Registro central manual del proyecto Electron, actualmente limitado a `1 | 2` y Matemáticas.

## Qué hacer

1. Diseñar el manifiesto versionado de actividad: metadatos, curso, materia, motor, parámetros, recursos, nivel, estado y autoría.
2. Crear manifiestos para etapas, cursos, asignaturas, bloques curriculares y actividades.
3. Cambiar los tipos cerrados de curso por identificadores de datos.
4. Crear un cargador y validador de manifiestos que falle con mensajes claros.
5. Separar el motor reutilizable de los textos, iconos, recursos y parámetros pedagógicos.
6. Añadir filtros por curso, materia y bloque a la navegación.
7. Probar que un manifiesto roto no llega a producción y que una actividad nueva se registra sin editar la navegación.

## Terminado cuando

- Añadir una actividad o materia piloto solo requiere un manifiesto y un motor compatible.
- Las actividades existentes de 1.º y 2.º aparecen desde datos versionados.

---

# Fase 2 — Migración del catálogo matemático V1

## Objetivo

Trasladar gradualmente las actividades con mayor valor pedagógico, sin una migración masiva ni regresiones.

## Prioridad de migración

1. **Compartidas de 1.º/2.º:** conteo, ordenar, comparación, suma/resta, series, vecinos, números, igualdad, recta, lateralidad y problemas simples.
2. **Valor posicional:** decenas/unidades, numeración hasta 99, algoritmos en columna y tabla numérica.
3. **Específicas de 1.º:** relacionar número/cantidad, posiciones, intervalos y laberinto.
4. **Específicas de 2.º:** centenas, ábaco, doble/mitad, multiplicación, algoritmos de tres cifras, geometría, probabilidad y problemas de dos pasos.

## Qué hacer

1. Migrar primero generador, tipo de ejercicio y validador a `src/core`.
2. Portar o reescribir el renderer táctil en `features`.
3. Mover textos, iconos y dificultad al manifiesto.
4. Añadir test de generación determinista, respuestas válidas y límites pedagógicos.
5. Verificar escritorio, tableta y pizarra antes de declarar la migración terminada.
6. Mantener una tabla de trazabilidad: actividad Electron, manifiesto PWA, pruebas, estado y versión.

## Terminado cuando

- El catálogo V1 está disponible desde manifiestos.
- Cada motor migrado tiene pruebas de su lógica y una comprobación visual/táctil.

---

# Fase 3 — Sesiones, corrección y resumen

## Objetivo

Convertir una actividad aislada en una sesión de aula configurable y recuperable.

## Ya disponible

- 🟡 Feedback de acierto/error, repetición y `SummaryScreen` en Electron.
- 🟡 Generadores y validadores de actividades.

## Qué hacer

1. Definir `ActivitySession`, `ExerciseAttempt`, `SessionConfiguration` y `SessionSummary`.
2. Permitir elegir dificultad, cantidad de ejercicios, corrección inmediata, solución visible y repetición.
3. Implementar intentos máximos y repetición solo de ejercicios fallados.
4. Mostrar resumen inicial y resumen tras cada repetición.
5. Guardar una sesión en local y restaurarla tras cerrar o recargar la PWA.
6. Mantener semillas para reproducir exactamente ficha y sesión.
7. Probar validadores, repetición, restauración y resúmenes.

## Terminado cuando

- Un profesor puede lanzar y recuperar una sesión sin perder el progreso local.
- La corrección se comporta según la configuración de la actividad.

---

# Fase 4 — Pizarra digital y entrada táctil

## Objetivo

Garantizar que la PWA funciona en la pizarra real, no solo en el ordenador de desarrollo.

## Ya disponible

- 🔎 Guías de HDMI, USB Touch y matriz de compatibilidad de Electron.
- 🟡 Componentes touch/mouse y canvas del proyecto original.

## Qué hacer

1. Registrar modelo de panel, resolución, navegador, PC, cableado y modo de pantalla.
2. Crear una pantalla de diagnóstico de Pointer Events: coordenadas, presión, puntero, arrastre y multitouch.
3. Probar HDMI, USB Touch, escalado, pantalla completa y Chrome/Edge.
4. Definir tamaños táctiles mínimos, foco visible, contraste y bloqueo de zoom/gestos no deseados.
5. Medir latencia de interacción, FPS, CPU y memoria con actividades exigentes.
6. Documentar navegador recomendado y procedimiento de incidencia.

## Terminado cuando

- La pizarra real recibe toques, arrastres y escritura con fluidez.
- Hay evidencia documentada para al menos un equipo y panel objetivo.

---

# Fase 5 — Escritura de dígitos y reconocimiento local

## Objetivo

Integrar escritura 0–9 de manera fiable, local y sin bloquear la clase.

## Ya disponible

- 🟡 Canvas `DrawableAnswerBox`, preprocesado, umbral 85 %, panel docente, IndexedDB y aprendizaje local TF.js.
- ✅ **Modelo ya entrenado reutilizable:** el proyecto Electron conserva el artefacto
  TensorFlow.js en `Colegio/src/renderer/public/model/model.json` y
  `group1-shard1of1.bin`. No hace falta disponer de las fotos originales para
  migrarlo e inferir con él. Antes de cualquier migración se hará una copia con
  hash y se documentará versión, fecha, precisión conocida y compatibilidad.
- 🔎 No se conservan las fotos/dataset de entrenamiento. Por ello no se debe
  reentrenar el modelo base ni afirmar una métrica nueva sin crear un dataset de
  evaluación y validarlo en la pizarra real.

## Qué hacer

1. Extraer `DigitCell`: trazos estructurados, borrado, limpiar, deshacer/rehacer, resultado y estado.
2. Usar Pointer Events en vez de handlers separados de mouse/touch.
3. Formalizar columnas U/D/C para operaciones y respuestas de varias cifras.
4. Conservar y probar el preprocesado: recorte, centrado, escalado y normalización.
5. Decidir mediante evaluación si se mantiene TF.js o se convierte el modelo a ONNX Runtime Web.
   La conversión se hará siempre a partir de una copia inmutable del modelo ya
   entrenado; se compararán sus predicciones con el original antes de adoptarla.
6. Implementar fallback CPU/WASM y, si procede, aceleración WebGPU.
7. Exponer predicción, confianza, alternativas, versión del modelo e inferencia en milisegundos.
8. Aplicar umbral inicial 85 %; por debajo, pedir al docente elegir 0–9 o repetir.
9. Guardar correcciones manuales con etiqueta, predicción, confianza y versión.
10. Limitar muestras, eliminar duplicados, permitir reset y crear estadísticas locales.
11. Crear Recognition Lab para dibujo, evaluación, corrección y guardado de muestras.
12. Crear dataset de evaluación separado del entrenamiento, matriz de confusión, curva de umbrales y regresiones por dígito.

## Terminado cuando

- Una casilla reconoce un dígito localmente o pide confirmación sin bloquear la sesión.
- Existe un informe reproducible de exactitud, confusiones y latencia en el hardware objetivo.

---

# Fase 6 — Offline y PWA instalable

## Objetivo

Hacer que el modo offline sea una capacidad explícita de la web, no una consecuencia accidental de Electron.

## Qué hacer

1. Configurar manifiesto, iconos, instalación y actualización de la PWA.
2. Versionar service worker y política de actualización sin interrumpir una clase.
3. Precachear shell, manifiestos, recursos V1 y modelo local de reconocimiento.
4. Usar IndexedDB para sesiones, muestras adaptativas y datos necesarios offline.
5. Diseñar colas de sincronización para futuros cambios que se creen sin red.
6. Mostrar estado de conexión y no perder datos en reconexión.
7. Probar primer uso, recarga, actualización, caída de red y recuperación.

## Terminado cuando

- La aplicación se instala desde Chrome/Edge y abre en ventana propia.
- Las actividades V1, corrección y resumen definidos como offline funcionan sin red.

---

# Fase 7 — Generador de fichas

## Objetivo

Reutilizar el valor del generador actual y entregar fichas imprimibles reproducibles.

## Ya disponible

- ✅ Exportador DOCX, cabecera, logo/mascota, renderizadores de numerosas fichas y pruebas.
- 🟡 Diseño actual ligado al renderer de Electron.

## Qué hacer

1. Extraer el modelo común de ficha desde los mismos manifiestos/generadores de actividad.
2. Crear plantilla A4 con márgenes, tipografía, cabecera, pie y accesibilidad de impresión.
3. Generar ficha de alumno y hoja de soluciones desde la misma semilla.
4. Mantener semilla, versión de actividad y parámetros en metadatos.
5. Añadir exportación PDF; conservar DOCX si el colegio lo necesita.
6. Renderizar y revisar visualmente cada familia de ficha importante.
7. Crear tests de contenido, reproducibilidad y regresión de PDF/impresión.

## Terminado cuando

- Un profesor configura una actividad y obtiene ficha A4 y soluciones reproducibles.

---

# Fase 8 — Experiencia docente local

## Objetivo

Ofrecer un flujo rápido de aula antes de introducir cuentas y datos personales.

## Ya disponible

- 🟡 Pantalla de inicio, perfiles/temas de clase, selector de actividades y generador local.

## Qué hacer

1. Diseñar dashboard local: continuar sesión, lanzar actividad, crear ficha y configurar aula.
2. Migrar perfiles/temas de aula sin datos identificativos del alumnado.
3. Limitar el lanzamiento de una actividad habitual a dos toques desde inicio.
4. Añadir modo pantalla completa y acceso rápido de salida seguro.
5. Configurar reconocimiento y aprendizaje local desde una pantalla docente.
6. Recoger feedback de uso con datos no personales durante el piloto.

## Terminado cuando

- El docente puede lanzar, repetir, configurar y cerrar actividades con una interacción clara de aula.

---

# Fase 9 — Decisión institucional, privacidad y modelo de datos

## Objetivo

No almacenar datos de menores ni elegir infraestructura por inercia técnica.

## Ya disponible

- 🟡 Auditoría del proyecto original con minimización, roles, retención y recomendaciones RGPD.

## Qué hacer

1. Reunión con dirección, responsable TIC y Delegado de Protección de Datos.
2. Definir responsable, finalidad, categorías de datos, conservación, soporte, presupuesto y accesos.
3. Completar registro de actividad y EIPD cuando corresponda.
4. Diseñar IDs aleatorios de alumno y tabla de equivalencias separada, si llega a ser necesaria.
5. Decidir despliegue: Cloudflare, infraestructura propia o híbrido, incluyendo contrato, copias y plan de salida.
6. Definir modelo conceptual `School`, `Teacher`, `Class`, `Activity`, `Session`, `Attempt` y `Assignment`, sin implementar aún lo no aprobado.

## Terminado cuando

- Dirección y DPD han aprobado un alcance de datos e infraestructura para el piloto.

---

# Fase 10 — API, identidad y administración docente

## Objetivo

Añadir servicios remotos sin romper el uso offline ni abrir datos a otros usuarios.

## Qué hacer

1. Crear API versionada con validación de entrada y contratos explícitos.
2. Implementar login solo de profesorado, gestión de sesión, recuperación y cierre de sesión.
3. Centralizar roles y autorización por recurso en el servidor.
4. Crear dashboard autenticado, gestión de actividades, clases y configuración pedagógica.
5. Separar datos de centro, clase y usuario desde el esquema inicial.
6. Sincronizar de forma segura los cambios locales pendientes cuando vuelva la conexión.
7. Probar autorización, sesiones caducadas, rate limiting, validación y errores de red.

## Terminado cuando

- Un profesor autenticado solo puede acceder a los recursos aprobados de su centro y clase.

---

# Fase 11 — Operación, despliegue y mantenimiento

## Objetivo

Hacer repetible el paso de código validado a piloto, staging y producción.

## Ya disponible

- 🟡 Guías de instalación, pizarra, distribución, checklist de producción y `release:verify` de Electron.

## Qué hacer

1. Crear entornos de desarrollo, staging y producción con configuración separada.
2. Automatizar typecheck, lint, tests, build, auditoría de dependencias y despliegue en CI/CD.
3. Versionar releases, notas, migraciones de datos y reversión.
4. Preparar copias cifradas, restauración probada y exportación de datos.
5. Añadir logs técnicos minimizados y monitorización privada de errores.
6. Documentar runbooks de actualización, caída de servicio, pérdida de equipo y restauración.
7. Mantener manual de profesor y administración actualizados.

## Terminado cuando

- Una versión puede desplegarse, observarse y revertirse de forma documentada.

---

# Fase 12 — Seguridad antes del piloto

## Objetivo

Aplicar controles de seguridad antes de manejar identidades, datos remotos o centros múltiples.

## Qué hacer

1. Elaborar threat model e inventario de activos.
2. Aplicar mínimo privilegio, MFA para administración, gestión de secretos y separación de cuentas.
3. Usar hashes robustos de contraseñas, cookies/sesiones seguras y caducidad.
4. Aplicar rate limiting, validación estricta, protección de inyección, XSS, CSRF, CORS y CSP.
5. Proteger logs y telemetría para que no expongan información educativa.
6. Auditar dependencias, activar secret scanning y proteger CI/CD.
7. Ejecutar pruebas de permisos, IDOR/BOLA, backup/restauración e incidentes.

## Terminado cuando

- Se supera un security gate documentado antes del piloto con profesorado.

---

# Fase 13 — Piloto docente y revisión

## Objetivo

Validar utilidad pedagógica y operación real con un alcance pequeño.

## Qué hacer

1. Elegir una clase, un docente, una materia y una duración acotada.
2. Probar instalación PWA, pizarra, offline, fichas, actualizaciones y restauración.
3. Registrar incidencias sin datos personales innecesarios.
4. Medir tiempo de preparación, fluidez de aula, errores de actividad y utilidad percibida.
5. Revisar cobertura curricular y priorizar motores pendientes según evidencia.
6. Ejecutar revisión de arquitectura, calidad, privacidad y seguridad al cierre.

## Terminado cuando

- Existe una decisión basada en evidencia: corregir, ampliar el piloto o preparar producción.

---

# Fase 14 — Alumnos, tareas y progreso [posterior a V1]

## Objetivo

Introducir seguimiento individual solo si la fase institucional lo aprueba.

## Qué hacer

1. Implementar alumnos, clases, matrículas e historial académico con IDs minimizados.
2. Crear tareas, asignación por clase/alumno, excepciones y entregas.
3. Registrar resultados, repeticiones, progreso por alumno/clase/tema y exportaciones autorizadas.
4. Diseñar roles de alumno y familia solo después de probar permisos y comunicación de privacidad.
5. Probar aislamiento por recurso, retención, borrado, exportación y restauración.

## Terminado cuando

- Los datos individuales están justificados, protegidos y son útiles pedagógicamente.

---

# Fase 15 — Multi-colegio y ampliación [futuro]

## Objetivo

Escalar a nuevos centros, cursos y asignaturas sin perder aislamiento ni mantenibilidad.

## Qué hacer

1. Implementar `School/Organization`, roles de plataforma/centro y aislamiento en API y base de datos.
2. Añadir invitación/gestión de profesorado, cursos académicos, configuración y branding por centro.
3. Probar acceso cruzado, enumeración, borrado completo, retención y exportación por colegio.
4. Añadir 3.º–6.º y una segunda asignatura mediante manifiestos y motores reutilizables.
5. Revisar arquitectura antes de cada gran expansión y hacer pentest antes de abrir un segundo centro.

## Terminado cuando

- Abrir un nuevo colegio o asignatura es una operación controlada, aislada y documentada.

---

# Gates obligatorios

| Momento | Evidencia mínima |
| --- | --- |
| Antes de migrar motores | Contratos, manifiesto y tests de lógica aprobados. |
| Antes de activar offline | Caché, IndexedDB, actualización y caída de red probadas. |
| Antes de activar escritura | Dataset, precisión, umbral, latencia y prueba de pizarra. |
| Antes de login real | DPD/alcance de datos, threat model y pruebas de autorización. |
| Antes del piloto | Build, pruebas, backup/restauración, seguridad y manual docente. |
| Tras el piloto | Revisión de arquitectura, incidencias, utilidad pedagógica y siguiente alcance. |
| Antes de alumnado/multi-colegio | Privacidad aprobada, aislamiento probado y operación madura. |
