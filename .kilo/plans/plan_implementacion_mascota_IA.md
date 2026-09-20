# Plan de implementación — Mascota/compañero de clase generado por IA

## 1. Objetivo

Implementar una funcionalidad de configuración para que un profesor pueda crear un compañero visual personalizado para su clase.

El profesor selecciona un tema y unas preferencias sencillas. El sistema genera primero un personaje conceptual y, después de que el profesor lo apruebe, genera un pack de 6 imágenes coherentes:

1. Explicando.
2. Pensando.
3. Celebrando.
4. Animando.
5. Header.
6. Sujetando una pizarra de madera.

La generación de imágenes se realizará mediante la API de Hugging Face Inference disponible para el proyecto.

**Principio fundamental de seguridad:** el token `HF_TOKEN` de Hugging Face NUNCA debe llegar al navegador ni estar incluido en el código frontend.

---

# 2. Arquitectura

```text
┌──────────────────────────────┐
│          FRONTEND            │
│                              │
│ Configuración de mascota     │
│ Formulario                   │
│ Preview                      │
│ Estado de generación         │
└──────────────┬───────────────┘
               │ HTTPS
               │ POST /api/mascot/...
               ▼
┌──────────────────────────────┐
│           BACKEND            │
│                              │
│ Validación                   │
│ Autorización                 │
│ Construcción de prompts      │
│ Gestión de referencias       │
│ Rate limiting                │
│ Llamada a Hugging Face                 │
│ Almacenamiento               │
└──────────────┬───────────────┘
               │ HTTPS
               │ API key privada
               ▼
┌──────────────────────────────┐
│          Hugging Face          │
│                              │
│ Generación de imágenes       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      STORAGE DEL PROYECTO    │
│                              │
│ reference.png                │
│ explain.png                  │
│ think.png                    │
│ celebrate.png                │
│ encourage.png                │
│ header.png                   │
│ blackboard.png               │
└──────────────────────────────┘
```

---

# 3. Regla de ciberseguridad principal

## La API key nunca puede estar en frontend

PROHIBIDO:

```typescript
const HF_TOKEN = "...";
```

PROHIBIDO:

```typescript
fetch("https://api-inference.huggingface.co/...", {
    headers: {
        Authorization: "Bearer ..."
    }
});
```

PROHIBIDO guardar la API key en:

- variables JavaScript del navegador;
- localStorage;
- sessionStorage;
- cookies accesibles desde JavaScript;
- archivos públicos;
- `.env` que sea incluido en el bundle frontend;
- parámetros de URL;
- código fuente enviado al cliente.

La API key debe existir únicamente en el entorno seguro del backend.

Por ejemplo:

```text
HF_TOKEN
```

como variable de entorno del servidor.

El frontend solo conoce nuestros endpoints:

```text
POST /api/mascot/preview
POST /api/mascot/generate-assets
GET  /api/mascot/status/:id
```

Nunca conoce la credencial de Hugging Face.

---

# 4. Variables de entorno

En producción:

```env
HF_TOKEN=********
```

La variable debe configurarse en el sistema de despliegue/servidor.

En desarrollo:

```env
HF_TOKEN=********
```

en un `.env` que esté incluido en `.gitignore`.

Nunca hacer commit de:

```text
.env
.env.local
.env.production
```

si contienen secretos.

Añadir al repositorio:

```text
.env.example
```

con:

```env
HF_TOKEN=
```

---

# 5. Flujo completo

## Fase A — Configuración

El frontend recoge:

```json
{
  "theme": "space",
  "customTheme": "",
  "characterType": "ai_choice",
  "customCharacterType": "",
  "personality": [
    "funny",
    "curious"
  ],
  "nameMode": "ai",
  "teacherName": "",
  "visualStyle": "cartoon_3d",
  "specialDetails": ""
}
```

El frontend NO construye el prompt final.

Envía únicamente datos estructurados al backend.

---

# 6. Backend: validación

Antes de llamar a Hugging Face:

- validar todos los campos;
- limitar longitudes;
- comprobar valores permitidos;
- eliminar campos desconocidos;
- limitar `specialDetails`;
- impedir instrucciones arbitrariamente largas;
- validar que hay entre 2 y 3 rasgos de personalidad;
- validar que el tema existe o que `customTheme` está presente;
- validar la modalidad del nombre.

Ejemplo:

```text
theme
→ enum permitido

personality
→ 2–3 valores permitidos

visualStyle
→ enum permitido

specialDetails
→ máximo 250 caracteres
```

Nunca confiar en la validación del frontend.

---

# 7. Prompt maestro para crear el personaje

El backend construirá el prompt.

NO enviar directamente las respuestas del profesor como prompt libre.

Utilizar una plantilla controlada.

## System prompt conceptual

```text
You are a character designer for a children's educational mathematics application.

Design one original recurring companion character for children aged 6 to 8.

The character must be:
- friendly
- warm
- expressive
- easy to recognize
- visually simple enough to remain consistent across multiple poses
- appropriate for a primary-school educational environment
- non-threatening
- non-violent
- free of horror elements
- free of weapons
- free of sexualized elements
- free of political or religious symbolism
- free of recognizable copyrighted characters
- suitable for repeated use in a mathematics learning application

The character must have a clear silhouette and a small number of distinctive visual features.

Do not create text, logos, watermarks, UI elements or written labels in the image.

Create an original character rather than imitating an existing franchise or copyrighted character.
```

---

# 8. Prompt dinámico del personaje

El backend añadirá:

```text
Class theme:
{THEME}

Character type:
{CHARACTER_TYPE}

Personality:
{PERSONALITY}

Name:
{NAME}

Visual style:
{VISUAL_STYLE}

Teacher's additional detail:
{SPECIAL_DETAILS}
```

Y después:

```text
Create the character as a single coherent visual identity.

The theme should influence the character's design without overwhelming the character.

The character should look like a friendly educational companion, not like a generic stock illustration.

Use a clean composition and make the complete character clearly visible.

The design must be suitable as a reference image for generating additional poses of the same character later.

Prioritize character consistency, recognizable facial features, clothing, colors, proportions and accessories.
```

---

# 9. Si el nombre lo elige la IA

Antes de generar la imagen, el backend puede solicitar un nombre corto mediante el modelo adecuado.

Reglas:

```text
Generate one short, memorable name for a character aimed at children aged 6–8.

The name must:
- be easy to pronounce in Spanish;
- be easy to remember;
- be suitable for school;
- fit the theme;
- avoid trademarks and famous character names;
- avoid numbers and unusual symbols.

Return only the name.
```

El backend valida la respuesta antes de utilizarla.

Si el profesor ha elegido su propio nombre, no se genera nombre.

---

# 10. No generar las 6 imágenes inicialmente

La primera generación debe producir únicamente:

```text
character_reference.png
```

El profesor ve el personaje.

Opciones:

```text
🔄 Probar otro
❤️ Nos encanta
```

Cada regeneración debe respetar la misma configuración.

Solo al pulsar:

```text
❤️ Nos encanta
```

se crea el pack definitivo.

Esto reduce coste y evita generar assets que el profesor no va a utilizar.

---

# 11. Generación de las 6 poses

Utilizar siempre la imagen aprobada como referencia si la API/modelo utilizado permite image references.

El concepto fundamental del prompt será:

```text
Use the supplied approved character reference as the exact visual identity.

Do not redesign the character.

Preserve:
- face
- species/type
- body proportions
- colors
- clothing
- accessories
- distinctive features
- overall visual style

Only change the requested pose, expression and composition.
```

Esto es mucho más importante que repetir simplemente la descripción textual.

---

# 12. Prompt de pose: explicar

```text
Create the approved character in an explanatory teaching pose.

The character should appear to be helping a child solve a mathematics exercise.

Use a friendly, clear gesture directed toward the exercise area.

The expression should be encouraging and attentive.

Keep the entire character visible.

Transparent background if supported.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.
```

---

# 13. Prompt de pose: pensar

```text
Create the approved character in a thoughtful pose.

The character is trying to solve a mathematics problem and encouraging the child to think.

Use a friendly, curious facial expression.

Keep the same character identity, proportions, clothing, colors and accessories.

Keep the entire character visible.

Transparent background if supported.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.
```

---

# 14. Prompt de pose: celebrar

```text
Create the approved character celebrating a successful mathematics answer.

The character should look genuinely happy and proud, with an energetic but child-friendly pose.

Keep the exact approved character identity.

Keep the entire character visible.

Transparent background if supported.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.
```

---

# 15. Prompt de pose: animar

```text
Create the approved character encouraging a child who is solving a mathematics exercise.

Use a positive gesture such as a thumbs-up, supportive hand gesture or similarly clear encouraging pose.

The expression should communicate:
"You can do it!"

Keep the exact approved character identity.

Keep the entire character visible.

Transparent background if supported.

Do not add text, numbers, equations, speech bubbles, logos or watermarks.
```

---

# 16. Prompt para HEADER

```text
Create the approved character as a friendly header/avatar asset for a children's mathematics application.

The character should face the viewer with a warm, welcoming expression.

Compose the character so it works perfectly inside a circular UI container.

Keep the character centered and leave safe margins around the head and important visual features.

Do NOT draw a circle around the character.

Keep the exact approved character identity.

Transparent background if supported.

Do not add text, logos, watermarks or UI elements.
```

El círculo lo crea la aplicación mediante CSS.

---

# 17. Prompt para la pizarra

```text
Create the approved character holding a physical classroom blackboard.

The blackboard must have a simple, attractive wooden frame and a completely empty writing surface.

The character must be positioned so the application can place interactive exercise-selection content on the blackboard later.

The board must contain NO generated text, numbers, equations, buttons, icons or decorations that could interfere with the application UI.

Keep the exact approved character identity.

The entire character and the complete board must be visible.

Transparent background if supported.

Do not add logos or watermarks.
```

---

# 18. El contenido de la pizarra NO lo genera la IA

Esto es importante.

La IA genera:

```text
personaje + pizarra vacía
```

Nuestra aplicación añade:

```text
SUMAS
RESTAS
PROBLEMAS
MULTIPLICACIONES
...
```

Esto garantiza:

- texto perfecto;
- accesibilidad;
- traducciones;
- responsive;
- animaciones;
- interacción;
- posibilidad de cambiar ejercicios sin regenerar imágenes.

---

# 19. Almacenamiento

Guardar por clase/configuración:

```text
/mascots/{mascotId}/
    reference.png
    explain.png
    think.png
    celebrate.png
    encourage.png
    header.png
    blackboard.png
```

La aplicación debería guardar también:

```json
{
  "id": "...",
  "name": "Astro",
  "theme": "space",
  "config": {},
  "status": "ready",
  "referenceImage": "...",
  "assets": {
    "explain": "...",
    "think": "...",
    "celebrate": "...",
    "encourage": "...",
    "header": "...",
    "blackboard": "..."
  }
}
```

---

# 20. Seguridad del endpoint

Los endpoints de generación deben estar protegidos.

No permitir:

```text
POST /api/mascot/generate
```

sin autenticación/autorización del profesor.

Además:

### Rate limiting

Limitar la frecuencia de generación por usuario/clase.

Ejemplo conceptual:

```text
Preview:
máximo X generaciones por ventana de tiempo

Pack:
máximo X generaciones por ventana de tiempo
```

Los valores concretos dependerán del proveedor y del coste.

### Validación de tamaño

Limitar cualquier texto recibido.

### Logs

Registrar:

```text
user/class id
mascot id
timestamp
operation
status
provider response status
```

Nunca registrar:

```text
HF_TOKEN
Authorization header
tokens secretos
```

---

# 21. Estados de generación

El frontend debe mostrar claramente el estado:

```text
idle
validating
generating_preview
preview_ready
generating_assets
ready
error
```

Ejemplo:

```text
✨ Creando vuestro compañero...

Esto puede tardar un poquito.
```

Después:

```text
🎉 ¡Ya está!

Este es vuestro compañero.
```

---

# 22. Errores

Si falla Hugging Face:

```text
No hemos podido crear el personaje esta vez.

[ Intentar de nuevo ]
```

No mostrar:

- stack trace;
- respuesta interna de Hugging Face;
- API key;
- información del servidor;
- mensajes técnicos.

El backend registra el error técnico.

El frontend recibe un error seguro y genérico.

---

# 23. Reintentos

Implementar reintentos únicamente en errores transitorios.

No hacer reintentos infinitos.

Conceptualmente:

```text
request
  ↓
error temporal
  ↓
retry 1
  ↓
error temporal
  ↓
retry 2
  ↓
error
```

Nunca reintentar automáticamente ante errores de validación o autorización.

---

# 24. Cancelación y concurrencia

Evitar que el profesor pueda pulsar 10 veces:

```text
✨ Crear personaje
```

El botón debe quedar bloqueado durante la generación.

El backend debe tener protección adicional para evitar generaciones duplicadas.

---

# 25. Regeneración

Hay dos niveles:

### Cambiar personaje

Regenera la referencia.

```text
Nueva referencia
→ aprobación
→ nuevo pack
```

### Regenerar una pose

Si solo falla una imagen:

```text
Regenerar "Celebrando"
```

No volver a generar las otras cinco.

Esto ahorra coste.

---

# 26. UX recomendada

Flujo final:

```text
CONFIGURACIÓN
      ↓
Crear compañero
      ↓
Cuestionario
      ↓
Generar personaje
      ↓
Preview
      ↓
 ┌───────────────┐
 │ No me gusta   │────→ Nueva generación
 └───────────────┘
      │
      ▼
 Me encanta
      ↓
Generar pack
      ↓
████████████░░░
      ↓
Pack completo
      ↓
Guardar
      ↓
Usar en la aplicación
```

---

# 27. Principios de diseño

La IA debe generar creatividad dentro de límites controlados.

Debe evitar:

- personajes terroríficos;
- violencia;
- armas;
- sangre;
- contenido adulto;
- sexualización;
- símbolos políticos;
- propaganda;
- contenido religioso como elemento dominante;
- personajes famosos;
- personajes de franquicias existentes;
- logotipos;
- marcas;
- texto generado;
- marcas de agua.

El personaje debe parecer **propio de la aplicación y de la clase**, no una copia de un personaje conocido.

---

# 28. Importante: copyright y estilo

No enviar prompts del tipo:

```text
"hazlo como Disney"
"hazlo como Pixar"
"hazlo como Pokémon"
```

En su lugar utilizar características descriptivas:

```text
cartoon 3D
formas redondeadas
expresión amable
colores vivos
ilustración infantil
aspecto cinematográfico suave
```

La aplicación debe generar una identidad original.

---

# 29. Separación de responsabilidades

## Frontend

Responsable de:

- cuestionario;
- validación básica UX;
- preview;
- botones;
- progreso;
- mostrar imágenes;
- integración de assets.

## Backend

Responsable de:

- autenticación;
- autorización;
- validación definitiva;
- construcción de prompts;
- llamada a Hugging Face;
- API key;
- rate limiting;
- almacenamiento;
- control de estados;
- errores;
- auditoría.

## Hugging Face

Responsable únicamente de:

- generación del contenido visual.

---

# 30. Implementación por fases

## Fase 1 — Configuración

- Añadir cuestionario.
- Crear modelo de configuración.
- Guardar preferencias.

## Fase 2 — Backend seguro

- Crear endpoints.
- Configurar secreto `HF_TOKEN`.
- Implementar cliente Hugging Face.
- Implementar validación.
- Implementar rate limiting.

## Fase 3 — Preview

- Construir prompt maestro.
- Generar personaje.
- Mostrar preview.
- Implementar regeneración.
- Implementar aprobación.

## Fase 4 — Pack

- Utilizar referencia aprobada.
- Generar las 6 imágenes.
- Guardar assets.
- Mostrar progreso.

## Fase 5 — Integración

- Header.
- Mascota junto a la pizarra.
- Pizarra de selección.
- Estados de ejercicios.
- Animaciones idle.

## Fase 6 — Robustez

- Errores.
- Reintentos.
- Generaciones duplicadas.
- Límites.
- Logs.
- Seguridad.
- Tests.

---

# 31. Criterios de aceptación

La feature se considera terminada cuando:

- El profesor puede crear una mascota sin escribir prompts.
- Puede elegir el nombre o dejarlo a la IA.
- Puede elegir tema.
- Puede dejar que la IA decida el tipo de personaje.
- Puede elegir personalidad.
- Puede elegir estilo.
- Puede añadir detalles opcionales.
- Primero se genera solo el personaje.
- El profesor puede regenerarlo.
- Al aprobarlo se utiliza como referencia.
- Las seis imágenes mantienen una identidad visual coherente.
- El header funciona dentro de un círculo sin que la IA dibuje el círculo.
- La pizarra generada está vacía.
- El contenido de la pizarra lo controla la aplicación.
- La API key nunca llega al navegador.
- La API key no aparece en Git.
- Los endpoints requieren autenticación.
- Existen límites de generación.
- Los errores internos no se muestran al usuario.
- Se puede regenerar una sola pose sin regenerar todo el pack.
- Los assets se almacenan y reutilizan sin volver a llamar a la IA.

---

# 32. Nota sobre la API de Hugging Face

Antes de implementar el cliente definitivo, comprobar en la documentación oficial vigente de Hugging Face:

- endpoint exacto;
- modelo de generación de imágenes disponible;
- autenticación;
- soporte de image references;
- soporte de transparencia/PNG;
- parámetros de tamaño/aspect ratio;
- límites de uso;
- precios/cuotas;
- formato de respuesta;
- condiciones de uso.

No asumir ninguno de estos detalles en el código hasta verificar la documentación actual.

La arquitectura debe aislar el proveedor detrás de un servicio propio, por ejemplo:

```text
ImageGenerationService
        │
        └── HuggingFaceImageGenerationService
```

Así, si mañana cambia Hugging Face o se quiere utilizar otro proveedor, el resto de la aplicación no necesita reescribirse.
