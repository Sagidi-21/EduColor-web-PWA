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

## Navegación y transiciones de pantalla

La PWA gestiona la navegación entre pantallas mediante `ViewTransition`
(`src/core/transition/ViewTransition.tsx`), un componente basado en
Framer Motion que renderiza cada pantalla como un panel 3D dentro de un
contenedor con `perspective`. Las vistas disponibles son:

| Vista           | Componente                                                   | Navegación de entrada                     |
| --------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `home`          | `HomeScreen` (`src/features/home/`)                          | Punto de partida.                         |
| `configuration` | `ConfiguracionScreen` (`src/features/configuracion/`)        | Desde home y desde mascota.               |
| `mascota`       | `MascotaScreen` (`src/features/mascota/`)                    | Desde configuration.                      |
| `mathematics`   | `MatematicasCatalogScreen` (`src/features/matematicas/`)     | Desde home.                               |
| `exercise`      | `ExerciseView` (`src/features/matematicas/ExerciseView.tsx`) | Desde mathematics (catálogo → ejercicio). |

### Temas de transición

`vtThemes.ts` define los temas disponibles: `cube` (cubo 3D), `flip`,
`carousel`, `fall`, `newspaper` y `pageTurn`. El tema se selecciona en
tiempo de ejecución mediante `useTransitionTheme()` y se persiste en
`localStorage` bajo la clave `vt_theme`. El cubo (`cube`) es el tema por
defecto.

### Lanzamiento de un ejercicio desde el catálogo

`MatematicasCatalogScreen` muestra un popup de selección de nivel o
dificultad al pulsar una actividad. Al pulsar **Empezar**:

1. El popup se encoge con una animación CSS (`mat__popup--shrinking` →
   `scale(0.05) opacity(0)`). Si el usuario prefiere movimiento reducido
   (`prefers-reduced-motion: reduce`), se salta la animación.
2. Tras la animación, los datos de la sesión (actividad, dificultad, nivel,
   semilla y metadatos visuales) se almacenan en
   `ExerciseSessionContext` (`src/features/matematicas/ExerciseSessionContext.tsx`).
3. Se navega a la vista `exercise` con `navigate("exercise", "right")`,
   disparando la transición del cubo reutilizada del sistema de vistas. La
   vista `exercise` lee la sesión del contexto y renderiza `EngineScreen`.
4. Al salir del ejercicio, `onExit` navega de vuelta a `"mathematics"` con
   dirección `"left"`, reutilizando la misma transición del cubo.

Este patrón evita el renderizado inline de `EngineScreen` dentro del
catálogo, permitiendo que ambas vistas participen en la transición 3D como
paneles hermanos del `ViewTransition`.

## Vertical slice incluido

`counting` demuestra el contrato: generador determinista, validador, vista React, PWA y prueba. Se inspira en el motor Electron, pero no importa Electron.

Ya no es el único: 32 actividades siguen este mismo contrato. Lo que sigue es su
número exacto, en
[INVENTARIO_MIGRACION_ACTIVIDADES.md](INVENTARIO_MIGRACION_ACTIVIDADES.md).

## Siguientes decisiones

Estas cuatro se escribieron al arrancar el proyecto, en la Fase 0. Su estado:

1. ~~Definir manifiestos de actividad y migrar el registro manual.~~ **Hecho en
   la Fase 1:** los 62 manifiestos están en `src/manifests/activities/` y validados
   contra `schema/activity-manifest.schema.json` con Ajv. El registro manual que
   quedaba por sustituir es el de los motores migrados, en
   `src/core/content/engine-registry.ts`, que hoy es un conjunto de 32 ids.
2. Validar Pointer Events y reconocimiento en la pizarra real. **Pendente**, y es
   lo que bloquea el cierre pedagógico de la Fase 2: las 32 actividades migradas
   esperan la validación en pizarra del profesorado.
3. Acordar con colegio/DPD el modelo de datos y despliegue. **Pendiente.**
4. Implementar autenticación y autorización antes de datos de alumnado.
   **Pendiente.**
