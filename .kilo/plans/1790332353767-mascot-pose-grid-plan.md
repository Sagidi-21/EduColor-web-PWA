# Plan: Generación de Mascota con Cuadrícula 2×2 y Recorte Automático

## Resumen
Reemplazar el flujo actual de 6 llamadas a la API de Hugging Face (una por pose) por **una sola llamada** que genere una imagen 2×2 con 4 poses del mismo personaje, seguida de recorte automático en 4 imágenes independientes.

## Estado Actual

### Backend (`src/server/`)
- **Modelo HF**: `stabilityai/stable-diffusion-3-medium-diffusers` vía `router.huggingface.co`
- `buildMascotPrompt()` (huggingface.service.ts:132) — prompt simple sin estructura de poses
- `generateMascotAssetsWithGrok()` (línea 244) — **6 llamadas separadas** (explain, think, celebrate, encourage, header, blackboard)
- `generateMascotWithGrok()` — genera solo la preview (1 imagen)
- Controlador: `generateMascotPreview` + `generateMascotAssets` (dos pasos separados)
- Almacenamiento: `generationStore` Map en memoria + `ClassProfile.mascotUrl` (solo 1 URL)

### Frontend (`src/features/mascota/MascotaScreen.tsx`)
- Formulario 6 pasos → POST `/api/mascot/preview` → usuario acepta → POST `/api/mascot/generate-assets`
- Solo guarda `mascotUrl` (imagen referencia) en `ClassProfile`
- Los 6 assets generados **nunca se usan** en la aplicación

### Uso actual de mascota
- `ClassProfile.mascotUrl` → `ExerciseSession.mascotUrl` → `ActivityHeader` (avatar pequeño en header)
- No hay sistema de poses para estados de pizarra virtual

### Manipulación de imágenes
- **Sin librería de imágenes instalada** (no sharp, pngjs, canvas, jimp)
- Navegador: `HTMLCanvasElement` + 2D context disponible
- `ConfigurarScreen.tsx` ya hace procesamiento client-side (canvas resize)

---

## Decisiones de Diseño (Actualizadas)

| Decisión | Recomendación | Razón |
|----------|---------------|-------|
| **Recorte 2×2** | Client-side (navegador) | 0 dependencias nuevas; canvas ya disponible; `ConfigurarScreen` hace lo mismo; la imagen ya llega como data URL |
| **Almacenamiento 4 poses** | Extender `ClassProfile` con `mascotAssets: { explain, point, think, celebrate }` | Mantiene `mascotUrl` para compatibilidad; accesible desde `ExerciseSession` |
| **Assets legacy** | **Mantener temporalmente** encourage, header, blackboard | No eliminar hasta validar nuevo flujo completo (punto 3) |
| **Flujo** | Mantener preview + assets (2 pasos) | UX de aprobar personaje antes de generar poses; preview ≠ cuadrícula 2×2 (punto 4) |
| **Recorte geométrico** | **SIN exigir W===H** | Dividir siempre en 4 cuadrantes iguales usando dimensiones reales W, H (punto 1) |
| **Prompt maestro** | Explícito "sprite sheet 2×2" + restricciones composición (punto 2) | Garantizar coherencia visual y estructura correcta |
| **Imagen 2×2 temporal** | Variable local en `acceptAndGenerateAssets` (punto 5) | Validar recortes antes de persistir; liberar memoria después |
| **Validación técnica** | Solo estructura: imagen válida, dimensiones, 4 recortes, toDataURL OK (punto 8) | NO validar calidad visual; eso es manual |
| **Preview 4 poses en UI** | Mostrar temporalmente en desarrollo (punto 9) | Detectar problemas rápido; decidir después si mantener |

---

## Tareas de Implementación

### 1. Backend: Nuevo `buildMascotPrompt` estructurado (Prompt Maestro 2×2)
**Archivo:** `src/server/services/huggingface.service.ts`
- Reescribir `buildMascotPrompt(config)` para producir prompt maestro con:
  - **IDENTITY**: tipo, especie, edad infantil, personalidad, mundo, colores, ropa/accesorios, estilo visual, nombre
  - **STYLE**: estilo visual elegido
  - **POSE 1 (EXPLAIN)**: explicando lección matemáticas, mano levantada, gesto explicativo, mirando al espectador
  - **POSE 2 (POINT)**: señalando lateralmente, espacio para pizarra, "Mira aquí"
  - **POSE 3 (THINK)**: postura pensativa, mano en barbilla, expresión curiosa/concentrada
  - **POSE 4 (CELEBRATE)**: celebrando, brazos levantados/salto, "¡Muy bien!"
- **Instrucciones explícitas de composición 2×2** (prioridad máxima):
  - "Create ONE single image containing FOUR separate poses of the EXACT SAME character in a 2×2 grid"
  - "ONE SINGLE IMAGE", "2×2 GRID", "FOUR POSES", "EXACT SAME CHARACTER"
  - Un único personaje por cuadrante
  - Ningún personaje fuera de su cuadrante
  - Ningún elemento que cruce la división central
  - Mismo tamaño aproximado en los 4 cuadrantes
  - Mismo estilo, diseño, vestuario, accesorios
  - Fondo uniforme y sencillo
  - Sin texto, números, letras, bocadillos, otros personajes
- Lógica de coherencia mundo ↔ personaje (ai_choice): Espacio→alien/robot, Dinosaurios→dino, Piratas→loro/pirata, Submarino→criatura marina, Robots→robot, Mágico→fantasía

### 2. Backend: Nueva función `generateMascotPoseGrid`
**Archivo:** `src/server/services/huggingface.service.ts`
- Llama `buildMascotPrompt` → una sola llamada HF → retorna imagen 2×2 (data URL)
- **NO elimina** `generateMascotAssetsWithGrok` aún (punto 3)
- Manejo de errores: timeout, imagen corrupta, dimensiones inesperadas, API error
- Retorna: `{ imageUrl: string }` (la imagen 2×2 completa)

### 3. Backend: Actualizar controlador y tipos
**Archivos:** `src/server/controllers/mascot.controller.ts`, `src/server/types.ts`
- **Agregar** nuevo tipo `MascotPoseGridResult = { imageUrl: string }`
- **Agregar** nuevo endpoint/handler `generateMascotPoseGrid` que llame a la nueva función
- Mantener `MascotAssetsResult` y `generateMascotAssets` **SIN CAMBIOS** por ahora (punto 3)
- Validación: `specialDetails` máx 100 chars (actual 250) en `validation.middleware.ts`

### 4. Frontend: Recorte 2×2 en navegador (`cropPoseGrid`)
**Archivo:** `src/features/mascota/MascotaScreen.tsx` (o nuevo hook/util)
- Nueva función `cropPoseGrid(imageDataUrl: string): Promise<{explain, point, think, celebrate} | null>`
  - Crea `Image` → onload → canvas offscreen `W × H` (dimensiones reales)
  - **División geométrica exacta en 4 cuadrantes** (punto 1):
    - Pose 1 (EXPLAIN): `x=0, y=0, w=W/2, h=H/2`
    - Pose 2 (POINT): `x=W/2, y=0, w=W/2, h=H/2`
    - Pose 3 (THINK): `x=0, y=H/2, w=W/2, h=H/2`
    - Pose 4 (CELEBRATE): `x=W/2, y=H/2, w=W/2, h=H/2`
  - `drawImage` con coordenadas fuente/destino precisas
  - `toDataURL('image/png')` lossless → retorna `{explain, point, think, celebrate}`
  - Validación técnica (punto 8): imagen válida, canvas creado, 4 recortes con contenido, `toDataURL` OK
  - **NO validar W===H** — usar dimensiones reales recibidas

### 5. Frontend: Flujo `acceptAndGenerateAssets` actualizado
**Archivo:** `src/features/mascota/MascotaScreen.tsx`
```ts
const acceptAndGenerateAssets = async () => {
  // 1. POST /api/mascot/generate-pose-grid (nueva ruta) → poseGridDataUrl
  // 2. cropPoseGrid(poseGridDataUrl) → {explain, point, think, celebrate}
  // 3. Validar 4 recortes OK
  // 4. save({ mascotUrl: previewImage, mascotAssets: cropped })
  // 5. Liberar poseGridDataUrl (variable temporal)
}
```
- **NO llamar a generateMascotPoseGrid hasta que el usuario acepte** (punto 10)
- Si falla: error UI, conservar `mascotUrl` existente, permitir reintentar, **NO guardar `mascotAssets` parcial** (punto 11)

### 6. Frontend: Extender almacenamiento (`ClassProfile`)
**Archivo:** `src/core/context/ClassProfileContext.tsx`
- Extender `ClassProfile`:
```ts
interface ClassProfile {
  className: string;
  mascotUrl: string;           // mantener (preview/avatar header)
  mascotAssets?: {             // NUEVO - opcional (punto 12)
    explain: string;
    point: string;
    think: string;
    celebrate: string;
  };
  accentColor: string;
}
```
- Actualizar `save()` y `loadProfile()` para persistir `mascotAssets` (opcional)
- **Inspeccionar tamaño real serializado antes/después** (punto 6) — confirmar que cabe en localStorage

### 7. Frontend: Preview temporal de 4 poses en UI (desarrollo)
**Archivo:** `src/features/mascota/MascotaScreen.tsx`
- Después de `acceptAndGenerateAssets` exitoso: mostrar grid 2×2 o 4 miniaturas de las poses generadas
- Permitir detectar: poses mal colocadas, personaje cortado, cuadrícula incorrecta, personajes diferentes, diferencias de tamaño, fondo inconsistente (punto 9)
- Decidir después si mantener en producción

### 8. Tests
- `huggingface.service.test.ts`: probar `buildMascotPrompt` con distintos configs, probar `generateMascotPoseGrid` mock
- `mascot.controller.test.ts`: probar nuevo endpoint `generateMascotPoseGrid`
- `MascotaScreen.test.tsx` (si existe): probar `cropPoseGrid` con imágenes de distintas dimensiones (no cuadradas)

### 9. Limpieza Legacy (SOLO DESPUÉS de validar todo)
**Archivos:** `huggingface.service.ts`, `mascot.controller.ts`, `types.ts`, `mascot.routes.ts`, `validation.middleware.ts`
- Eliminar `generateMascotAssetsWithGrok` y su lógica de 6 llamadas
- Eliminar `ASSET_PROMPTS` legacy (encourage, header, blackboard)
- Cambiar `MascotAssetsResult.assets` a 4 claves
- Actualizar endpoint `/generate-assets` para usar nueva función
- Limpiar nombre `WithGrok` si es legacy (punto 13)

---

## Referencias a Inspeccionar Antes de Modificar (Punto 14)

| Símbolo | Dónde buscar | Qué consumen |
|---------|--------------|--------------|
| `generateMascotAssetsWithGrok` | service, controller, tests | solo `generateMascotAssets` |
| `generateMascotWithGrok` | service, controller, tests | `generateMascotPreview`, `regeneratePreview` |
| `generateMascotPreview` | controller, routes, MascotaScreen | preview step |
| `generateMascotAssets` | controller, routes, MascotaScreen | assets step |
| `mascotUrl` | ClassProfile, ExerciseSession, ActivityHeader, 15+ pantallas | header avatar |
| `mascotAssets` | **NO EXISTE** — nuevo campo | futuro: pizarra virtual |
| `generationStore` | controller (Map en memoria) | tracking estado generación |
| `ClassProfile` | context, localStorage, HomeScreen, ConfigScreen | perfil clase |
| `ExerciseSession` | provider, context, View, pantallas math | sesión ejercicios |

---

## Flujo Resultante Final

```
FORMULARIO (6 pasos)
    ↓
Generar preview  (CALL 1: generateMascotWithGrok → imagen referencia)
    ↓
Usuario acepta
    ↓
Generar poses    (CALL 2: generateMascotPoseGrid → imagen 2×2)
    ↓
Canvas divide en 4 cuadrantes geométricos (W/2 × H/2 cada uno)
    ↓
Validar 4 recortes técnicos OK
    ↓
Guardar:
  mascotUrl = previewImage (inalterado)
  mascotAssets.explain
  mascotAssets.point
  mascotAssets.think
  mascotAssets.celebrate
    ↓
Mascota disponible para pizarra virtual
```

---

## Validación y Riesgos

| Riesgo | Mitigación |
|--------|------------|
| HF genera imagen no 2×2 o personajes diferentes | Prompt explícito "sprite sheet 2×2" + validación técnica recorte |
| Recorte falla (imagen corrupta) | Try/catch en `cropPoseGrid`; fallback a regenerar |
| Timeout HF (60s actual) | Mantener timeout; retry logic existente (`withRetry`) |
| `specialDetails` rompe coherencia | Truncar a 100 chars; tratar como preferencia suave en prompt |
| localStorage quota | **Medir tamaño real** serializado antes/después (punto 6) |
| Memoria base64 múltiple | Usar variable temporal; liberar `poseGridDataUrl` tras guardar (punto 7) |
| Mascotas existentes sin `mascotAssets` | Campo opcional `?`; compatibilidad total (punto 12) |
| Borrar legacy rompe algo | **No borrar hasta validar flujo completo** (punto 3) |

---

## Archivos a Modificar (Orden Recomendado)

1. `src/server/services/huggingface.service.ts` — `buildMascotPrompt` + `generateMascotPoseGrid`
2. `src/server/controllers/mascot.controller.ts` — nuevo handler `generateMascotPoseGrid`
3. `src/server/routes/mascot.routes.ts` — nueva ruta `/generate-pose-grid`
4. `src/server/types.ts` — nuevo tipo `MascotPoseGridResult`
5. `src/server/middleware/validation.middleware.ts` — `specialDetails` ≤ 100
6. `src/features/mascota/MascotaScreen.tsx` — `cropPoseGrid`, flujo `acceptAndGenerateAssets`, UI preview 4 poses
7. `src/core/context/ClassProfileContext.tsx` — extender `ClassProfile` + persistencia
8. Tests correspondientes
9. **Limpieza legacy** (solo tras validación completa)

---

## Confirmaciones Pendientes (Resueltas)

- [x] **Recorte client-side** — 0 deps, canvas disponible
- [x] **Extender ClassProfile** — opcional, compatibilidad total
- [x] **Eliminar assets legacy** — **DIFERIDO** hasta validar nuevo flujo
- [x] **Preview step independiente** — mantener (CALL 1 ≠ CALL 2)
- [x] **No nombre en imagen** — especificación clara
- [x] **No fondo transparente v1** — fondo uniforme primero
- [x] **Recorte sin exigir cuadrado** — división geométrica W/2 × H/2
- [x] **Prompt explícito 2×2** — "ONE SINGLE IMAGE", "2×2 GRID", "FOUR POSES"
- [x] **Imagen 2×2 temporal** — variable local, liberar tras guardar
- [x] **Error no sobrescribe perfil** — solo actualizar si 4 OK
- [x] **Preview 4 poses en UI** — temporal en desarrollo