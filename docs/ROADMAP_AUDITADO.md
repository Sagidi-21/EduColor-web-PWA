# Roadmap operativo auditado

> El plan ejecutable completo, con objetivos, tareas, reutilización y criterios
> de salida por fase, está en [ROADMAP_DE_EJECUCION_DETALLADO.md](ROADMAP_DE_EJECUCION_DETALLADO.md).

## Activos de partida

El proyecto Electron aporta **62 actividades activas**: 47 para 1.º, 58 para 2.º y 43 compartidas. Aporta además motores matemáticos, generadores, pruebas, exportación DOCX, experiencia táctil y un prototipo de reconocimiento de dígitos.

Se reutiliza el dominio educativo. Se reescriben PWA, API, autenticación, multi-colegio, seguridad, operación y datos de alumnado.

## Fases

1. **Núcleo y vertical slice:** contratos de actividad, PWA y una actividad offline con prueba. Este repositorio implementa el primer corte.
2. **Catálogo V1:** manifiestos versionados y migración selectiva de motores de 1.º/2.º junto a sus tests.
3. **Pizarra y escritura:** Pointer Events, `DigitCell` y validación medible del reconocimiento local.
4. **Plataforma docente:** API, login, permisos, backups, logs y CI/CD.
5. **Alumnado y progreso:** solo tras decisión institucional de privacidad.

## Regla de migración

No se copia Electron, IPC ni empaquetado Windows. Cada motor se migra con su lógica y pruebas, adaptando su renderer a los contratos de la PWA.
