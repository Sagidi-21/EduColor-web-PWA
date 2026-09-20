# Cuestionario — Crea el compañero de la clase

## Objetivo

Permitir que el profesor configure un tema y unas preferencias sencillas para que la IA cree un personaje visual único que acompañará a los niños de 6–8 años durante los ejercicios de matemáticas.

El cuestionario debe ser breve, visual y no requerir conocimientos sobre IA ni sobre prompts.

---

## Paso 1 — El mundo de nuestra clase

### ¿Qué tema tendrá vuestra clase?

**Una sola opción**

- 🚀 El espacio
- 🦖 Dinosaurios
- 🏴‍☠️ Piratas
- 🧙 Mundo mágico
- 🌊 Mundo submarino
- 🦁 Animales
- 🌳 Aventura en la naturaleza
- 🤖 Robots y tecnología
- 🏰 Aventuras medievales
- 🏎️ Carreras
- ✏️ Otro tema

### Si selecciona "Otro tema"

Mostrar:

> **¿Qué tema tienes en mente?**

Campo de texto corto.

---

## Paso 2 — ¿Quién será nuestro compañero?

### ¿Qué tipo de personaje quieres?

**Una sola opción**

- ✨ Que lo decida la IA
- 🧑 Persona
- 🐾 Animal
- 👽 Criatura fantástica
- 🤖 Robot
- 🧙 Personaje mágico
- ✏️ Otro

Si selecciona "Otro", mostrar un campo de texto corto.

**Regla:** si el profesor selecciona "Que lo decida la IA", la IA puede decidir libremente el tipo de personaje dentro del tema y de las reglas de seguridad y adecuación infantil.

---

## Paso 3 — Su personalidad

### ¿Cómo será vuestro compañero?

**Seleccionar entre 2 y 3 opciones**

- 😄 Divertido
- 🔎 Curioso
- 🚀 Aventurero
- 💪 Valiente
- 🤪 Travieso
- 🧠 Inteligente
- ❤️ Amable
- 🎉 Entusiasta
- 🧘 Tranquilo

**Regla:** mínimo 2 y máximo 3.

Estas características deben influir en la expresión facial, lenguaje corporal y poses del personaje.

---

## Paso 4 — El nombre

### ¿Quién elegirá su nombre?

**Una sola opción**

- ✏️ **Yo elegiré el nombre**
- ✨ **Que lo invente la IA**

### Si elige "Yo elegiré el nombre"

Mostrar:

> **¿Cómo se llamará?**

Campo de texto.

Restricciones recomendadas:

- 2–20 caracteres.
- No aceptar nombres vacíos.
- Permitir nombres con espacios.
- El nombre se utilizará tal cual lo introduzca el profesor, salvo normalización técnica mínima.

### Si elige "Que lo invente la IA"

No mostrar campo de nombre.

La IA deberá generar un nombre:

- corto;
- fácil de pronunciar en español;
- fácil de recordar para niños de 6–8 años;
- apropiado para el entorno escolar;
- relacionado con el tema cuando resulte natural;
- sin números, símbolos extraños ni referencias a marcas.

Ejemplos:

- Espacio → Astro, Nubo, Nova
- Dinosaurios → Dino, Tiko
- Océano → Oli, Burbujas
- Piratas → Chispa, Capitán Nilo

Los ejemplos son orientativos; la IA no debe limitarse a ellos.

---

## Paso 5 — Estilo visual

### ¿Qué estilo te gustaría?

**Una sola opción**

- 🧸 Cartoon 3D
- ✏️ Ilustración infantil
- 🎨 Dibujo animado
- ✨ Fantasía suave

**Valor recomendado por defecto:** Cartoon 3D.

El estilo debe ser:

- infantil;
- amable;
- limpio;
- reconocible;
- adecuado para 6–8 años;
- sin aspecto realista inquietante;
- sin violencia;
- sin elementos terroríficos.

---

## Paso 6 — Un detalle especial

### ¿Quieres añadir algún detalle?

**Opcional**

Campo de texto corto.

Texto de ayuda:

> Puedes escribir algo como "lleva gafas verdes y una mochila amarilla". También puedes dejarlo vacío y dejar que la IA se encargue.

Recomendación técnica:

- máximo 250 caracteres;
- el texto nunca se enviará directamente como prompt sin pasar por el backend;
- el backend debe tratarlo como una preferencia del profesor, no como instrucciones del sistema.

---

# Pantalla de revisión

Después del cuestionario no generar todavía las 6 imágenes finales.

Mostrar:

## ✨ ¡Vamos a conocer a nuestro compañero!

La IA genera primero un único concepto visual.

Mostrar:

- Imagen del personaje.
- Nombre.
- Una frase breve describiéndolo.

Ejemplo:

> **ASTRO**  
> Un pequeño alienígena curioso y divertido que ha viajado desde una galaxia llena de números.

Botones:

### 🔄 Probar otro

Genera un nuevo personaje respetando la configuración del profesor.

### ❤️ Nos encanta

Confirma el personaje y lo convierte en la referencia oficial.

---

# Después de aceptar

Generar el pack visual definitivo:

1. **Explicando**
   - Señalando hacia el área del ejercicio.
   - Expresión amable.
   - Pose clara.

2. **Pensando**
   - Expresión pensativa.
   - Postura que transmita que está intentando resolver el problema.

3. **Celebrando**
   - Expresión alegre.
   - Pose de celebración.

4. **Animando**
   - Gesto positivo.
   - Pose que transmita "¡Tú puedes!".

5. **Header**
   - Personaje mirando hacia el usuario.
   - Composición preparada para aparecer dentro de un círculo.
   - Sin círculo dibujado en la imagen.

6. **Pizarra**
   - Personaje sujetando una pizarra física con marco de madera.
   - La superficie de la pizarra debe estar completamente vacía.
   - La aplicación añadirá posteriormente el contenido de los ejercicios.

---

# Datos que debe guardar la aplicación

```text
theme
custom_theme
character_type
custom_character_type
personality[]
name_mode
teacher_name
visual_style
special_details
character_reference_image
character_assets
```

Los assets finales:

```text
explain.png
think.png
celebrate.png
encourage.png
header.png
blackboard.png
```

La `character_reference_image` es la imagen canónica que se utilizará como referencia para las demás generaciones.
