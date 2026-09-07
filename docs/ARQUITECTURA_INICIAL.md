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
- `src/core/content`: contratos estables de currículo, actividades y resultados.
- `src/features`: renderizadores React y pantallas docentes.
- `src/platform`: PWA, IndexedDB, red y adaptadores de API.
- `src/manifests`: descripciones versionadas de currículo y actividades.
- `src/shared`: componentes y utilidades realmente transversales.
- `docs`: arquitectura y trazabilidad de migración.

### Dirección permitida de dependencias

```text
features ──► core, shared, platform
platform ──► core, shared
manifests ─► core (solo contratos públicos)
shared ────► (sin dependencias de las capas anteriores)
core ──────► (sin React, navegador, red ni almacenamiento)
```

`App.tsx` y `main.tsx` son composición temporal del arranque. El vertical
slice de conteo no se mueve todavía: hacerlo sin el formato de manifiesto de la
Fase 1 sería reorganización prematura.

## Vertical slice incluido

`counting` demuestra el contrato: generador determinista, validador, vista React, PWA y prueba. Se inspira en el motor Electron, pero no importa Electron.

## Siguientes decisiones

1. Definir manifiestos de actividad y migrar el registro manual.
2. Validar Pointer Events y reconocimiento en la pizarra real.
3. Acordar con colegio/DPD el modelo de datos y despliegue.
4. Implementar autenticación y autorización antes de datos de alumnado.
