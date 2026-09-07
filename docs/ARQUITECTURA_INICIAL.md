# Arquitectura inicial de EduColor web

## Objetivo

Construir una PWA para profesorado y pizarra digital que conserve el dominio educativo del proyecto Electron sin heredar su acoplamiento a Windows ni su IPC.

```text
UI React/PWA
  ├── núcleo de actividades (generadores, validadores, resultados)
  ├── manifiestos versionados (curso, materia, parámetros y recursos)
  ├── almacenamiento local (sesión/offline/adaptación)
  └── API futura (identidad, actividades, datos de centro y progreso)
        └── Workers + D1/R2 o infraestructura equivalente
```

## Límites de capas

- `src/core`: lógica determinista sin React ni navegador, cubierta con pruebas.
- `src/features`: renderizadores React y pantallas docentes.
- `src/platform`: PWA, IndexedDB, red y adaptadores de API.
- `docs`: arquitectura y trazabilidad de migración.

## Vertical slice incluido

`counting` demuestra el contrato: generador determinista, validador, vista React, PWA y prueba. Se inspira en el motor Electron, pero no importa Electron.

## Siguientes decisiones

1. Definir manifiestos de actividad y migrar el registro manual.
2. Validar Pointer Events y reconocimiento en la pizarra real.
3. Acordar con colegio/DPD el modelo de datos y despliegue.
4. Implementar autenticación y autorización antes de datos de alumnado.
