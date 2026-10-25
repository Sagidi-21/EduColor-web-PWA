# Arquitectura inicial de EduColor web

## Objetivo

Construir una PWA para profesorado y pizarra digital que conserve el dominio educativo del proyecto Electron sin heredar su acoplamiento a Windows ni su IPC.

```text
UI React/PWA
  ├── núcleo de actividades (generadores, validadores, resultados)
  ├── manifiestos versionados (curso, materia, parámetros y recursos)
  ├── almacenamiento local (sesión/offline/adaptación)
  └── API / identidad (Supabase Auth, Edge, Storage) + observabilidad (Sentry)
```

Esta arquitectura es **por capas orientada a dominio**, alineada con Clean
Architecture y SOLID de forma **pragmática** (no un hexagonal dogmático con
carpetas `domain` / `application` / `adapters` en cada feature).

## Límites de capas

| Carpeta         | Rol                                                             |
| --------------- | --------------------------------------------------------------- |
| `src/core`      | Ver subzonas abajo (dominio vs núcleo de producto)              |
| `src/features`  | Pantallas React y flujos docentes (auth UI, home, matemáticas…) |
| `src/app`       | Composición del arranque (`AppShell`, sesión autenticada, boot) |
| `src/platform`  | PWA, IndexedDB, red, adaptadores Supabase / Sentry              |
| `src/manifests` | Descripciones versionadas de currículo y actividades            |
| `src/shared`    | Componentes y utilidades realmente transversales                |
| `src/server`    | Express local del Compañero IA (fuera del core educativo MVP)   |
| `docs`          | Arquitectura, decisiones y trazabilidad                         |

### Dos zonas dentro de `src/core` (importante)

La regla histórica «`core` sin React» aplica al **dominio educativo**, no a
todo lo que hoy vive bajo `src/core/`. Para el TFM se documentan dos zonas:

1. **Dominio puro (sin React / navegador / red)**
   - `src/core/activities/` — generadores, validadores, resultados.
   - `src/core/content/` — contratos de currículo, registry de motores.
   - `src/core/demo/` — reglas de DEMO / acceso (lógica, no UI).
   - Parte de `src/core/ficha/` (generadores, contratos).  
     Cubierta por Vitest; es el corazón testeable del producto pedagógico.

2. **Núcleo de producto / UI compartida (puede usar React)**
   - `src/core/transition/` — `ViewTransition` (Framer Motion).
   - `src/core/context/` — contextos de aula / auth de sesión.
   - Renderers React de fichas bajo `src/core/ficha/renderers/`.

No se reubican en bloque ahora (coste alto, riesgo de regresión). La regla de
dependencias para **código nuevo** de dominio sigue siendo: sin React ni
`platform` dentro de `activities` / contratos de `content`.

### Dirección permitida de dependencias

```text
app ───────► features, core, platform, shared
features ──► core, shared, platform
platform ──► core (contratos), shared
manifests ─► core (solo contratos públicos)
shared ────► (sin dependencias de las capas anteriores)
core/activities + content ──► (sin React, navegador, red ni almacenamiento)
```

`App.tsx` y `main.tsx` son el borde de composición: providers + ruta de
preview de fichas. La orquestación de welcome / auth / sesión vive en
`src/app/` (`AppShell`, `BootAccessFlow`, `AuthenticatedSession`).

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

Ya no es el único: el catálogo V1 completo sigue este contrato. El número exacto
y el estado por actividad están en
[INVENTARIO_MIGRACION_ACTIVIDADES.md](INVENTARIO_MIGRACION_ACTIVIDADES.md).

## Siguientes decisiones (estado)

1. ~~Definir manifiestos de actividad y migrar el registro manual.~~ **Hecho**
   (Fase 1): 62 manifiestos + `engine-registry`.
2. Validar Pointer Events / pizarra real. **En curso** con el profesorado.
3. Acordar con colegio/DPD el modelo RGPD formal. **Cuando el piloto lo exija.**
4. ~~Auth / autorización de profesorado.~~ **Hecho** (Fase 10, D-028–D-037);
   MFA owner deferido post-piloto.
