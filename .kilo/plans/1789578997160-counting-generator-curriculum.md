# Plan: Adaptador del generador "Counting" al currículo 1º-2º Primaria

## Contexto

El generador `Counting` (`src/core/activities/counting.ts`) usa 4 niveles genéricos de dificultad (`easy/medium/hard/expert`) con parámetros simples (rango numérico, layout aleatorio). El currículo objetivo tiene **8 niveles concretos** distribuidos en 2 cursos, cada uno con rango numérico, disposición visual, mecánica interactiva, PDI y habilidad cognitiva específicos. El generador y el renderer deben soportar esta granularidad.

## Alcance

Solo el motor `counting`. No se tocan otros motores (`comparison`, `suma`, etc.) ni el sistema de catálogo general.

## Cambios por archivo

---

### 1. `src/core/content/contracts.ts` — Nuevos tipos curriculares

**Añadir** (no modificar existentes, extender):

```ts
export type CurriculumLevelId = "1-L1" | "1-L2" | "1-L3" | "1-L4" | "2-L1" | "2-L2" | "2-L3" | "2-L4";

export type VisualArrangement =
  | "scattered-large"        // Desordenada, elementos grandes
  | "ten-frames"             // Marcos de 10
  | "semi-dispersed-tens"    // Semidispersa + Cajas de 10
  | "bundles-tens-units"     // Atados de 10 y unidades libres
  | "packages"               // Paquetes de 5, 10 y 50
  | "matrix-grid"            // Rejillas de filas y columnas
  | "mass-vs-blocks"         // Masa fluida vs Bloques C-D-U
  | "containers-gaps";       // Contenedores con vacíos e incógnitas

export type InteractiveMechanic =
  | "touch-audio"            // Toque individual con audio e iluminación
  | "pair-ordinal"           // Selección por pares y posición ordinal
  | "drag-tens-containers"   // Arrastre a contenedores decenales
  | "drag-positional"        // Arrastre a tabla posicional D-U
  | "line-trace"             // Trazo de líneas continuas entre paquetes
  | "cut-separate"           // Herramienta de corte y separación
  | "slider-multibase"       // Control deslizante + Bloques multibase
  | "conditional-scale";     // Arrastre condicional y balanza digital

export interface CurriculumLevel {
  id: CurriculumLevelId;
  course: 1 | 2;
  level: 1 | 2 | 3 | 4;
  name: string;                // Nombre del Nivel
  rangeMin: number;
  rangeMax: number;
  visualArrangement: VisualArrangement;
  interactiveMechanic: InteractiveMechanic;
  pdi: string;                 // Disposición Visual / Mecánica / PDI
  cognitiveSkill: number;      // Habilidad Cognitiva (9-16)
}
```

**Mantener** `ActivityDifficulty` para retrocompatibilidad (4 niveles genéricos siguen existiendo para otras actividades).

---

### 2. `src/core/activities/counting.ts` — Nuevo generador curricular

**Reemplazar** `PRESET_CONFIGS` por `CURRICULUM_LEVELS: Record<CurriculumLevelId, CountingConfig>`:

```ts
export interface CountingConfig {
  minCount: number;
  maxCount: number;
  quantity: number;
  visualArrangement: VisualArrangement;
  interactiveMechanic: InteractiveMechanic;
  pdi: string;
  cognitiveSkill: number;
  difficulty: ActivityDifficulty;     // back-mapping: 1-L1→easy, 1-L2→medium, etc.
}
```

**Configuraciones por nivel:**

| Nivel | minCount | maxCount | quantity | visualArrangement | mechanic |
|-------|----------|----------|----------|-------------------|----------|
| 1-L1 | 1 | 10 | 10 | scattered-large | touch-audio |
| 1-L2 | 1 | 20 | 10 | ten-frames | pair-ordinal |
| 1-L3 | 1 | 50 | 10 | semi-dispersed-tens | drag-tens-containers |
| 1-L4 | 1 | 99 | 10 | bundles-tens-units | drag-positional |
| 2-L1 | 100 | 200 | 10 | packages | line-trace |
| 2-L2 | 100 | 500 | 10 | matrix-grid | cut-separate |
| 2-L3 | 100 | 999 | 10 | mass-vs-blocks | slider-multibase |
| 2-L4 | 1 | 999 | 10 | containers-gaps | conditional-scale |

**Nueva función** `generateLevelConfig(levelId: CurriculumLevelId): CountingConfig` — devuelve la config del nivel dado.

**Modificar** `generatePositions` (o crear `generatePositionsByArrangement`) para soportar los 8 arreglos visuales:

- `scattered-large`: grid con celdas grandes, mínima jittered (4×4 max)
- `ten-frames`: posiciones alineadas en grids 2×5 o 5×2 (ten-frame)
- `semi-dispersed-tens`: grupos de 10 en celdas separadas, semi-alineados
- `bundles-tens-units`: grupos de 10 atados (cercanos) + unidades dispersas
- `packages`: clusters de 5, 10 o 50 (paquetes circulares agrupados)
- `matrix-grid`: grid perfecto de filas×columnas (sin dispersión)
- `mass-vs-blocks`: 3 zonas (C, D, U) con bloques de distintos tamaños
- `containers-gaps`: objetos dentro de contenedores con espacios vacíos

**Añadir** `generateSessionForLevel(levelId: CurriculumLevelId, seed): CountingExercise[]` — usa la config del nivel y aplica la mecánica.

---

### 3. `src/manifests/activities/counting.json` — Descripciones por nivel curricular

**Reemplazar** `difficultyDescriptions` (4 entradas) por `levelDescriptions` (8 entradas):

```json
{
  "boardCard": {
    "icon": "🍎",
    "unit": 1,
    "unitLabel": "Nos divertimos con los números",
    "levelDescriptions": {
      "1-L1": "Conteo 1 a 1 y Subitización — Rango 1-10, objetos grandes desordenados",
      "1-L2": "Cuadrículas y Conteo por Pares — Rango 1-20, marcos de 10",
      "1-L3": "Agrupación en Decenas — Rango 1-50, semidispersa + cajas de 10",
      "1-L4": "Descomposición D+U — Rango 1-99, atados de 10 + unidades libres",
      "2-L1": "Saltos Numéricos Extendidos — Rango 100-200, paquetes de 5/10/50",
      "2-L2": "Arreglos Matriciales — Rango 100-500, rejillas filas×columnas",
      "2-L3": "Estimación y Centenas — Rango 100-999, masa fluida vs bloques C-D-U",
      "2-L4": "Conteo Condicional y Patrones — Hasta 999, contenedores con vacíos"
    }
  }
}
```

---

### 4. `src/features/matematicas/counting/CountingScreen.tsx` — Renderer por mecánica

**Modificar** para recibir `levelId: CurriculumLevelId` (o `levelConfig: CountingConfig`) en vez de solo `difficulty`.

**Añadir** renderizado condicional según `visualArrangement`:
- `ten-frames`: fondo con cuadrícula 2×5 visible
- `bundles-tens-units`: zona de decenas + zona de unidades
- `matrix-grid`: grid estricto sin desplazamiento
- `mass-vs-blocks`: 3 columnas C/D/U con bloques proporcionales
- `containers-gaps`: contenedores con huecos predefinidos

**Añadir** interacción según `interactiveMechanic`:
- `touch-audio`: toque individual → playCorrect/playError con audio, efecto de iluminación (radial gradient flash)
- `pair-ordinal`: selección de 2 objetos, validación de par/posición ordinal
- `drag-tens-containers`: drag & drop a contenedores "decena" (cada contenedor acepta 10)
- `drag-positional`: drag a tabla posicional decenas/unidades
- `line-trace`: trazar líneas entre paquetes (visualización de conexiones)
- `cut-separate`: botón "cortar" que separa un paquete en sub-grupos
- `slider-multibase`: slider numérico + representación con bloques multibase
- `conditional-scale`: arrastre con balanza digital (balanceo visual)

**Prioridad**: Para MVP, implementar los 3 más complejos (ten-frames, bundles-tens-units, containers-gaps) y dejar los demás como renderizado base mejorado.

---

### 5. `src/features/matematicas/MatematicasCatalogScreen.tsx` — Selección por nivel

**Modificar** la selección de dificultad: reemplazar `difficultyOptions` (4 niveles) por `levelOptions` (8 niveles curriculares).

Cada opción muestra: estrellas (según cognitiveSkill), nombre del nivel, rango y mecánica.

---

### 6. `src/features/matematicas/engine-screens.tsx` — Props actualizadas

**Actualizar** `EngineScreenProps` para incluir opcionalmente `levelId?: CurriculumLevelId`.

---

### 7. `src/core/activities/counting.test.ts` — Tests actualizados

**Reemplazar** las pruebas de `PRESET_CONFIGS` por pruebas de `CURRICULUM_LEVELS` (8 niveles, rangos correctos, tipos de arreglo/mecánica).

**Añadir** pruebas para:
- Cada arreglo visual genera posiciones distintas
- `generateLevelConfig` devuelve rango correcto por nivel
- `generateSessionForLevel` respeta el nivel y es reproducible

---

## Orden de implementación

1. **Tipos** (`contracts.ts`) — Sin dependencias, cimiento de todo lo demás
2. **Configuraciones curriculares** (`counting.ts` `CURRICULUM_LEVELS`) — Tipos nuevos ya disponibles
3. **Función de posicionamiento extendida** (`counting.ts` `generatePositionsByArrangement`) — Usa nuevos tipos
4. **Manifiesto** (`counting.json`) — Independiente del código
5. **Tests** (`counting.test.ts`) — Validar estructuras
6. **Renderer** (`CountingScreen.tsx`) — Depende de tipos y config
7. **CSS** (`CountingScreen.css`) — Nuevas clases para arreglos/meccánicas
8. **Catálogo** (`MatematicasCatalogScreen.tsx`) — UI de selección
9. **Engine screens props** (`engine-screens.tsx`) — Último paso, integración

## Retrocompatibilidad

- `PRESET_CONFIGS` se mantiene (mapeo a los 8 niveles: 1-L1→easy, 1-L2→medium, 1-L3→hard, 1-L4→expert; 2º repite el rango con variaciones internas).
- `difficulty: ActivityDifficulty` sigue existiendo en `CountingConfig` como back-mapping para otros motores que lo usen.

## Riesgos

- **Alto**: La nueva función `generatePositionsByArrangement` tiene 8 variantes — complejidad crece significativamente vs la implementación actual (2 variantes: grid/scattered).
- **Medio**: El renderer `CountingScreen` necesita cambios importantes para soportar drag&drop, sliders y mecánicas no triviales.
- **Bajo**: El manifiesto y la selección del catálogo son cambios de datos/UI relativamente aislados.

## Validación

- `npm test` → todos los tests de counting pasan (incluidos nuevos)
- `npm run lint` → sin errores en archivos modificados
- `npm run build` → build exitoso sin errores de tipo
- Manual: seleccionar cada uno de los 8 niveles en el catálogo y verificar que el renderizado es correcto
