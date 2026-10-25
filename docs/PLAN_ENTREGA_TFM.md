# Plan de entrega del TFM

Documento canónico con los **requisitos oficiales de entrega** del Trabajo de
Fin de Máster y el **seguimiento** respecto a EduColor web PWA.

Fuente: consignas del máster (documento «Documentación TFM»). Fecha límite
indicada en el temario: **20/07/2026** (se puede enviar antes; fuera de plazo
la corrección puede tardar más, pero el TFM se revisa y califica igual).

---

## Objetivo del TFM

El objetivo principal es elaborar una **aplicación real** adaptada al nivel de
conocimientos y experiencia del alumno: un proyecto **original** que demuestre
lo adquirido a lo largo del máster, sea diferenciador y aporte valor personal.
Algo que se disfrute construir y sirva para ponerse a prueba.

Sobre el tipo de software: web, app, utilidad, herramienta, juego u otra idea
válida. El máster es **agnóstico** en tecnología y tipo de software; no hay
una idea «mejor» que otra. Conviene alinear el proyecto con intereses
profesionales.

**EduColor** encaja como PWA educativa real (Matemáticas 1.º/2.º de Primaria,
pizarra, fichas, multi-colegio), con stack y documentación orientados a
revisión técnica.

---

## Requisitos de entrega (oficiales)

Hay que entregar los siguientes recursos para que el TFM sea revisado y
calificado.

### 1. Documentación completa y detallada (`README.md`)

Debe cubrir:

| #   | Contenido requerido                                         |
| --- | ----------------------------------------------------------- |
| a   | Descripción general del proyecto                            |
| b   | Stack tecnológico utilizado                                 |
| c   | Información sobre instalación y ejecución                   |
| d   | Estructura del proyecto                                     |
| e   | Funcionalidades principales                                 |
| f   | Usuario y contraseña de prueba (si el proyecto tiene login) |

Punto de entrada en este repo: [`README.md`](../README.md). Detalle técnico
adicional en `docs/` (arquitectura, auth, amenazas, estado, etc.).

### 2. Código fuente

| #   | Opción                            | Condición                                                                          |
| --- | --------------------------------- | ---------------------------------------------------------------------------------- |
| a   | Repositorio **público** en GitHub | Opción por defecto                                                                 |
| b   | Repositorio **privado** en GitHub | Solo si está **perfectamente justificado**; conceder acceso a `mouredev@gmail.com` |

Repo actual: `https://github.com/Sagidi-21/EduColor-web-PWA`.

### 3. Despliegue o publicación (recomendado)

| #   | Contenido                                                                    |
| --- | ---------------------------------------------------------------------------- |
| a   | URL o acceso al proyecto en funcionamiento (**también en la documentación**) |

Despliegue previsto: Netlify (producción del piloto).

### 4. Slides de presentación del proyecto

Herramientas libres: Google Slides, PowerPoint, Canva, u otra.

| #   | Contenido                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------- |
| a   | URL pública de la presentación **o** documento adjunto junto al código (**también en la documentación**) |

### 5. Vídeo de explicación (con captura de pantalla)

Host libre: YouTube, Drive, u otro.

| #   | Contenido                                                 |
| --- | --------------------------------------------------------- |
| a   | URL pública del vídeo (**también en la documentación**)   |
| b   | **Obligatorio:** capturar la pantalla mientras se explica |
| c   | **Opcional:** cámara con el rostro                        |

### Contenido mínimo en el directorio del código

En el repositorio debe encontrarse:

- La **documentación**
- La **información del despliegue** (puede ir dentro de la documentación)
- Las **slides** (enlace en la documentación **o** archivo de presentación subido)

---

## Formulario de entrega

Enviar el TFM y el material de requisitos mediante el **formulario de entrega**
de la lección correspondiente al Proyecto Final.

Campos a cumplimentar:

- Nombre completo del alumno
- Email utilizado en la inscripción del máster
- URL del repositorio de GitHub
- URL de despliegue o publicación (si existe)
- URL de las slides
- URL del vídeo
- Usuario y contraseña de prueba (si hay login)

Fecha de entrega del temario: **20/07/2026**. Se puede enviar en cualquier
momento; fuera del plazo de la edición los tiempos de corrección pueden variar.

---

## Seguimiento EduColor (checklist interno)

Marcar conforme se cierre cada entregable. Actualizar este bloque al avanzar.

| Entregable                                             | Estado         | Notas / dónde vive                                                      |
| ------------------------------------------------------ | -------------- | ----------------------------------------------------------------------- |
| README: descripción, stack, instalación, ejecución     | ✅             | [`README.md`](../README.md)                                             |
| README: estructura del proyecto                        | ✅             | Sección «Estructura del proyecto» en README + enlace a arquitectura     |
| README: funcionalidades principales                    | ✅             | Tabla «Qué es la app» en README                                         |
| Usuario / contraseña de prueba (login)                 | ⬜ Pendiente   | Las genera el alumno para el tribunal; documentar en README al tenerlas |
| Repo GitHub (público o privado justificado)            | ✅             | Público: `Sagidi-21/EduColor-web-PWA`                                   |
| Despliegue (URL en docs)                               | ⬜ Pendiente   | Añadir URL Netlify prod al README cuando esté estable para el tribunal  |
| Slides + URL/archivo en docs                           | ⬜ Pendiente   | Crear presentación; enlazar aquí y en README                            |
| Vídeo (pantalla obligatoria) + URL en docs             | ⬜ Pendiente   | Grabar demo + explicación; enlazar aquí y en README                     |
| Docs técnicas de apoyo (arquitectura, auth, amenazas…) | ✅ Base sólida | Ver tabla en README «Documentación útil para la revisión del TFM»       |

### URLs a rellenar antes del formulario

| Recurso              | URL                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------ |
| Repositorio          | `https://github.com/Sagidi-21/EduColor-web-PWA`                                      |
| Despliegue           | _pendiente_                                                                          |
| Slides               | _pendiente_                                                                          |
| Vídeo                | _pendiente_                                                                          |
| Usuario de prueba    | _pendiente_                                                                          |
| Contraseña de prueba | _pendiente_ (solo en formulario / README de entrega; no en historial si es sensible) |

---

## Orden de trabajo recomendado

1. **Cerrar producto revisable** — build verde, login/demo usable, docs alineadas.
2. **Publicar URL estable** — Netlify prod + smoke; poner la URL en README y en esta página.
3. **Credenciales de prueba** — cuenta de colegio/demo para el tribunal; documentar sin filtrar secretos de ops.
4. **Slides** — problema, solución, stack, arquitectura, demo, aprendizajes; enlace público.
5. **Vídeo** — pantalla compartida, recorrido de la app + decisiones técnicas clave.
6. **Pass final del README** — que un revisor externo pueda clonar, arrancar y entender el alcance sin preguntar.
7. **Formulario** — rellenar todas las URLs y entregar.

---

## Relación con el resto de `docs/`

Este archivo es el **plan de entrega académica**. El estado técnico del producto
sigue en [`ESTADO_DEL_PROYECTO.md`](./ESTADO_DEL_PROYECTO.md); la calidad de
cierre de tareas en [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md).
