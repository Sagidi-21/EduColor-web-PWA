# ROADMAP_MAESTRO — archivo histórico

> **Estado:** histórico. No es la fuente operativa del trabajo diario.
>
> Para fases, pasos y criterios actuales usar
> [ROADMAP_DE_EJECUCION_DETALLADO.md](ROADMAP_DE_EJECUCION_DETALLADO.md) y
> [EJECUCION_PASO_A_PASO.md](EJECUCION_PASO_A_PASO.md). El estado de migración de
> actividades vive solo en
> [INVENTARIO_MIGRACION_ACTIVIDADES.md](INVENTARIO_MIGRACION_ACTIVIDADES.md).
>
> Este fichero se conserva como referencia del plan original de migración
> (Bloque 0 y los 239 pasos). No actualizarlo con el avance del proyecto.

---

# BLOQUE 0 — PRESERVACIÓN, AUDITORÍA Y ESTRATEGIA DE MIGRACIÓN

> **IMPORTANTE:** Este bloque se añade al roadmap existente sin sustituir ni eliminar ninguno de sus 239 pasos. Su función es proteger el trabajo ya realizado antes de comenzar la migración a web.

La aplicación actual ya contiene lógica, motores, generadores, validadores, contenido, interfaz, reconocimiento experimental, exportación DOCX y tests. Por tanto, la migración **no debe tratarse como un proyecto de reescritura desde cero**.

El principio rector será:

```text
CONSERVAR
   ↓
AISLAR
   ↓
ADAPTAR
   ↓
VALIDAR
   ↓
ESCALAR
```

Nunca:

```text
REESCRIBIR
   ↓
"hacerlo moderno"
   ↓
intentar recuperar después la funcionalidad perdida
```

---

## 0.1 Congelar la aplicación original [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Disponer de una versión de referencia que nunca sea modificada durante la migración.

**Qué hacer**

- Crear una versión/tag estable de la aplicación actual.
- Conservar una copia íntegra del proyecto original.
- Mantener una versión ejecutable de referencia.
- Registrar versión, commit/hash y fecha.
- No utilizar esta copia como zona de experimentación.

**Terminado cuando**

Podemos volver exactamente al estado original de la aplicación en cualquier momento.

---

## 0.2 Crear repositorio/área de migración independiente [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Evitar convertir la aplicación existente en un experimento irreversible.

**Qué hacer**

La estrategia inicial será conceptualmente:

```text
Aplicación original
       │
       ├── legacy / referencia
       │
       └── nueva aplicación web
```

La aplicación original seguirá siendo la referencia funcional mientras dure la migración.

**Terminado cuando**

El desarrollo web puede avanzar sin poner en peligro la aplicación de escritorio.

---

## 0.3 Crear inventario completo del proyecto actual [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Saber exactamente qué existe antes de mover o reescribir cualquier cosa.

**Qué hacer**

Inventariar:

    - assets;
    - reconocimiento;

    <!-- Reuse guideline -->
    **Nota:** Para todas las migraciones futuras (p.ej., `tresSumandos`), **NO** es necesario volver a describir el proceso de copiar/pegar código de la referencia Electron.  Se debe seguir la guía de reutilización documentada en `docs/ops/MIGRACION_MAP.md` (mapa de componentes migrados y destinos) y `docs/ops/MIGRACION_CHANGELOG.md` (cambios de audio, Numpad, headers, etc.), que listan los componentes, hooks, assets y patrones ya centralizados en la PWA.  Simplemente copie los archivos de la carpeta `electron‑reference` a los destinos indicados y ajuste los imports para usar los recursos compartidos.

- exportadores;
- tests;
- configuración;
- dependencias;
- integración Electron;
- IPC;
- cualquier API local existente.

**Terminado cuando**

Existe un `INVENTORY.md` donde cada pieza importante tiene una descripción y una clasificación de migración.

---

## 0.4 Clasificar cada componente según su destino [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

No copiar indiscriminadamente todo el proyecto a la web.

**Qué hacer**

Clasificar cada elemento como:

```text
CORE REUTILIZABLE
ADAPTAR A WEB
SUSTITUIR POR SERVICIO WEB
SUSTITUIR POR API
SOLO DESKTOP / ELECTRON
CONTENIDO
ASSET
TEST
DEPRECAR
```

Ejemplo:

```text
Motor matemático       → CORE REUTILIZABLE
Generator              → CORE REUTILIZABLE
Validator              → CORE REUTILIZABLE
React renderer         → ADAPTAR A WEB
window.api / IPC       → SUSTITUIR POR API
Electron               → SOLO DESKTOP
IndexedDB              → REUTILIZAR/ADAPTAR
Contenido              → DATOS/MANIFIESTOS
```

**Terminado cuando**

Cada módulo importante tiene una decisión explícita.

---

## 0.5 Crear mapa de migración [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Saber qué archivo o módulo original acaba en qué zona de la arquitectura web.

**Qué hacer**

Crear `MIGRATION_MAP.md` con relaciones como:

```text
ORIGINAL
src/renderer/src/core/engines/...
        ↓
NUEVO CORE
packages/core/engines/...
```

```text
ORIGINAL
window.api...
        ↓
NUEVA API
apps/api/...
```

```text
ORIGINAL
React component...
        ↓
WEB
apps/web/...
```

**Terminado cuando**

El agente puede localizar dónde debe reutilizar cada pieza sin inventar una implementación paralela.

---

## 0.6 Crear documentación de arquitectura actual [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Documentar cómo funciona realmente la aplicación, no cómo creemos que funciona.

**Qué hacer**

Crear como mínimo:

```text
/docs
  ARCHITECTURE_CURRENT.md
  INVENTORY.md
  ENGINES.md
  UI_INVENTORY.md
  DATA_FLOW.md
  MIGRATION_MAP.md
```

**Terminado cuando**

Otra persona puede entender el funcionamiento de la aplicación actual leyendo la documentación.

---

## 0.7 Crear catálogo de comportamiento existente [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Proteger no solo el código, sino también el comportamiento del producto.

**Qué hacer**

Documentar para cada actividad importante:

- entrada;
- configuración;
- flujo;
- comportamiento de la interfaz;
- generación;
- solución;
- validación;
- feedback;
- repetición;
- resumen;
- errores esperados.

**Terminado cuando**

Existe una referencia funcional de las actividades actuales.

---

## 0.8 Crear inventario visual de la aplicación actual [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Evitar que la migración web cambie accidentalmente la experiencia visual.

**Qué hacer**

Documentar cada pantalla y componente importante:

- estructura;
- navegación;
- botones;
- estados;
- textos;
- colores/estilos existentes;
- tamaños;
- interacción;
- comportamiento táctil.

Capturar screenshots de referencia cuando sea útil.

**Terminado cuando**

La aplicación actual puede utilizarse como referencia visual durante la migración.

---

## 0.9 Identificar los motores que deben conservarse literalmente [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Proteger el código de mayor valor funcional.

**Qué hacer**

Marcar como código crítico:

- motores;
- generadores;
- validators;
- reglas matemáticas;
- algoritmos;
- semillas reproducibles;
- lógica de corrección.

**Regla**

Si una pieza ya resuelve correctamente un problema educativo, no se reescribe por motivos estéticos.

**Terminado cuando**

Los motores críticos están identificados y protegidos frente a refactors destructivos.

---

## 0.10 Extraer el Core de dominio [V1] · CRÍTICA

**Objetivo**

Hacer que la lógica educativa pueda vivir independientemente de Electron y React.

**Qué hacer**

Separar progresivamente:

```text
CORE
 ├── domain
 ├── engines
 ├── generators
 ├── validators
 ├── schemas
 └── deterministic utilities
```

El Core no debe depender de:

- React;
- DOM;
- Electron;
- `window.api`;
- componentes visuales.

**Terminado cuando**

Un ejercicio puede generarse y validarse desde código sin levantar la interfaz.

---

## 0.11 Crear adaptadores para el código existente [V1] · CRÍTICA

**Objetivo**

Evitar modificar innecesariamente los motores durante la migración.

**Patrón**

```text
MOTOR ORIGINAL
      ↓
ADAPTER
      ↓
APPLICATION SERVICE
      ↓
API / WEB
```

**Regla**

Primero se encapsula el comportamiento existente. Solo se modifica el motor si existe una necesidad técnica real.

**Terminado cuando**

La aplicación web puede utilizar un motor existente mediante un contrato estable.

---

## 0.12 Separar dominio, contenido y presentación [V1] · CRÍTICA

**Objetivo**

Permitir añadir cursos y asignaturas sin duplicar la plataforma.

**Arquitectura objetivo**

```text
PLATFORM CORE
      │
      ├── Matemáticas
      ├── Lengua
      ├── Inglés
      └── Ciencias

CONTENT
      │
      ├── 1.º
      ├── 2.º
      ├── 3.º
      └── ...

PRESENTATION
      │
      ├── Pizarra
      ├── Alumno
      └── PDF
```

**Terminado cuando**

Añadir contenido no requiere duplicar la aplicación.

---

## 0.13 Convertir el registro de actividades en configuración/datos versionados [V1] · CRÍTICA

**Objetivo**

Evitar que cada nueva actividad obligue a modificar el núcleo.

**Qué hacer**

Migrar progresivamente el registro actual a manifiestos versionados.

Un manifiesto podrá describir:

- identificador;
- asignatura;
- curso;
- tema;
- generator;
- validator;
- renderer;
- configuración;
- dificultad;
- versión;
- capacidades.

**Terminado cuando**

El sistema puede incorporar una actividad mediante un manifiesto sin alterar la arquitectura principal.

---

## 0.14 Crear Golden Master de la aplicación actual [V1] · CRÍTICA

**Objetivo**

Comparar la aplicación web con la aplicación existente.

**Qué hacer**

Para ejercicios y flujos representativos guardar:

- configuración;
- semilla;
- entrada;
- resultado esperado;
- solución;
- validación esperada.

**Terminado cuando**

Podemos ejecutar el mismo caso en la aplicación original y en la nueva y comparar resultados.

---

## 0.15 Crear regression suite del dominio [V1] · CRÍTICA

**Objetivo**

Impedir que la migración rompa Matemáticas.

**Qué hacer**

Convertir los casos importantes en tests automatizados.

**Terminado cuando**

Una modificación del Core produce un fallo visible si cambia un comportamiento protegido.

---

## 0.16 Crear contrato de paridad funcional [V1] · CRÍTICA

**Objetivo**

Definir qué significa “migrado correctamente”.

**Regla**

Una funcionalidad no se considera migrada porque la nueva versión “se parece”. Debe conservar el comportamiento acordado de la aplicación original.

**Comprobar**

- entradas;
- resultados;
- reglas;
- validación;
- navegación;
- configuración;
- errores;
- repetición;
- resumen.

**Terminado cuando**

Existe una checklist de paridad para cada módulo migrado.

---

## 0.17 Definir regla de no invención visual [V1] · CRÍTICA

**Objetivo**

Evitar que el agente rediseñe la aplicación por iniciativa propia.

**Regla**

La UI actual es la referencia.

El agente debe:

```text
ANALIZAR
   ↓
REPRODUCIR
   ↓
ADAPTAR A WEB
   ↓
VALIDAR
```

No:

```text
ANALIZAR
   ↓
INVENTAR NUEVA UI
```

**Terminado cuando**

Las pantallas migradas conservan estructura, terminología y comportamiento salvo cambios necesarios para la web.

---

## 0.18 Definir regla de no reescritura de motores [V1] · CRÍTICA

**Objetivo**

Evitar que un agente sustituya algoritmos existentes por otros “más limpios”.

**Regla**

Si el código existente funciona:

```text
NO REESCRIBIR
```

Primero:

```text
EXTRAER
→ AISLAR
→ ADAPTAR
```

Solo se podrá reescribir cuando:

- Electron impida su ejecución web;
- exista una incompatibilidad técnica demostrada;
- exista un bug real;
- exista una razón de seguridad;
- exista una decisión arquitectónica documentada.

**Terminado cuando**

Cada reescritura tiene una justificación registrada.

---

## 0.19 Definir registro de cambios de migración [V1] · CRÍTICA

**Objetivo**

Saber qué se ha cambiado respecto al original.

**Qué hacer**

Crear `MIGRATION_CHANGELOG.md`.

Para cada cambio importante registrar:

- componente original;
- cambio;
- motivo;
- impacto;
- tests;
- responsable;
- fecha.

**Terminado cuando**

Puede reconstruirse por qué una parte del sistema dejó de ser idéntica al original.

---

## 0.20 Definir primer Vertical Slice [V1] · CRÍTICA

**Objetivo**

Probar toda la arquitectura antes de migrar todo el catálogo.

**Primer flujo**

```text
LOGIN
  ↓
PROFESOR
  ↓
ACTIVIDAD MATEMÁTICA EXISTENTE
  ↓
GENERADOR ORIGINAL
  ↓
PIZARRA WEB
  ↓
DIGIT CELL
  ↓
RECONOCIMIENTO
  ↓
VALIDATOR ORIGINAL
  ↓
RESULTADO
  ↓
REPETICIÓN
  ↓
RESUMEN
```

**Terminado cuando**

Al menos una actividad real de la aplicación actual funciona de principio a fin en web utilizando la lógica existente.

---

## 0.21 Validar paridad entre Desktop y Web [V1] · CRÍTICA

**Objetivo**

Comparar las dos aplicaciones antes de ampliar la migración.

**Qué hacer**

Ejecutar los mismos casos en:

```text
Desktop
vs
Web
```

Comparar:

- generación;
- solución;
- corrección;
- puntuación;
- repetición;
- resumen.

**Terminado cuando**

El vertical slice cumple el contrato de paridad.

---

## 0.22 Architecture Review del primer Vertical Slice [V1] · CRÍTICA

**Objetivo**

No replicar una mala decisión a las 62 actividades.

**Qué revisar**

- Core;
- API;
- frontend;
- persistencia;
- offline;
- reconocimiento;
- contratos;
- dependencias;
- estructura de carpetas.

**Terminado cuando**

La arquitectura queda revisada con un flujo real antes de escalar la migración.

---

## 0.23 Migrar el catálogo existente progresivamente [V1] · CRÍTICA

**Objetivo**

Migrar las actividades sin intentar hacerlo todo en una sola fase.

**Orden recomendado**

1. Actividades compartidas por 1.º y 2.º.
2. Actividades específicas de 1.º.
3. Actividades específicas de 2.º.
4. Actividades que requieran nuevas capacidades.

**Terminado cuando**

Cada grupo de actividades migrado pasa sus pruebas de paridad antes de continuar.

---

## 0.24 No eliminar el legado hasta cerrar la migración [V1] · CRÍTICA

**Objetivo**

Mantener una referencia hasta que la nueva aplicación esté probada en producción.

**Regla**

La aplicación original solo podrá retirarse cuando:

- el catálogo necesario esté migrado;
- los flujos críticos estén validados;
- el piloto real haya terminado;
- los datos necesarios estén migrados;
- exista backup;
- exista rollback razonable.

**Terminado cuando**

Existe una decisión explícita de retirada del Desktop.

---

# BLOQUE 0B — CONTRATO PARA EL AGENTE DE PROGRAMACIÓN

Este bloque debe convertirse además en un archivo independiente del repositorio, por ejemplo:

```text
AGENT_RULES.md
```

El objetivo es que Antigravity, Cursor, Claude Code u otro agente tenga instrucciones inequívocas sobre cómo tratar el código existente.

## 0B.1 Regla principal: no inventar [V1] · CRÍTICA

Antes de implementar una funcionalidad que pueda existir ya en la aplicación original, el agente debe localizarla y estudiarla.

```text
EXISTE EN ORIGINAL?
      │
   SÍ ─┴─ NO
   │       │
   ▼       ▼
REUTILIZAR  DISEÑAR
```

No debe crear una segunda implementación equivalente sin justificarlo.

---

## 0B.2 Regla: el código original es la fuente de verdad funcional [V1] · CRÍTICA

Cuando exista una discrepancia entre:

- una idea nueva del agente;
- una implementación nueva;
- y el comportamiento existente;

la implementación existente será la referencia, salvo que el roadmap indique expresamente un cambio funcional.

---

## 0B.3 Regla: no borrar archivos sin autorización [V1] · CRÍTICA

El agente no debe eliminar:

- motores;
- generadores;
- validators;
- actividades;
- tests;
- assets;
- documentación;
- servicios;

solo porque ya exista una versión nueva.

Primero debe demostrar que el elemento ha sido reemplazado y documentar la migración.

---

## 0B.4 Regla: no cambiar el comportamiento por motivos de estilo [V1] · CRÍTICA

Un refactor que cambie el resultado educativo no es un refactor aceptable.

Especialmente protegidos:

- generación;
- semillas;
- dificultad;
- soluciones;
- validators;
- reglas de corrección;
- reconocimiento;
- repetición.

---

## 0B.5 Regla: adaptar Electron, no copiar Electron [V1] · CRÍTICA

No copiar al frontend web:

- IPC;
- `window.api`;
- APIs específicas de Electron;
- empaquetado Windows;
- procesos locales innecesarios.

Sustituirlos mediante:

```text
Electron API
    ↓
Application Service
    ↓
Web API / Browser API / IndexedDB
```

según el caso.

---

## 0B.6 Regla: no introducir backend donde no sea necesario [V1] · ALTA

La lógica que pueda ejecutarse localmente y no necesite datos del servidor debe permanecer local cuando eso aporte valor, especialmente:

- reconocimiento;
- validación educativa local;
- ejecución offline;
- generación que no requiera datos privados del servidor.

---

## 0B.7 Regla: no introducir microservicios prematuramente [V1] · ALTA

La primera arquitectura web debe ser sencilla.

Preferencia inicial:

```text
Frontend
   ↓
API
   ↓
Core / servicios
   ↓
Base de datos / storage
```

No dividir en múltiples servicios independientes hasta que exista una razón real.

---

## 0B.8 Regla: cada nueva abstracción debe demostrar su necesidad [V1] · ALTA

No crear una arquitectura genérica gigantesca “por si algún día”.

Primero resolver un caso real.

Cuando exista un patrón repetido, extraer la abstracción.

---

## 0B.9 Regla: documentar antes de hacer una migración compleja [V1] · CRÍTICA

Antes de modificar un módulo crítico, el agente debe indicar:

1. qué hace actualmente;
2. qué dependencias tiene;
3. qué se va a conservar;
4. qué se va a adaptar;
5. qué se va a sustituir;
6. cómo se comprobará la paridad.

---

## 0B.10 Regla: una feature por cambio coherente [V1] · ALTA

Evitar commits que mezclen:

```text
nuevo login
+
refactor de motores
+
rediseño visual
+
actualización de dependencias
```

Un cambio debe tener un objetivo claro y comprobable.

---

## 0B.11 Regla: todo cambio crítico debe tener tests [V1] · CRÍTICA

Especialmente:

- generators;
- validators;
- Core;
- auth;
- permisos;
- multi-tenant;
- persistencia;
- offline;
- reconocimiento.

---

## 0B.12 Regla: utilizar Golden Master cuando exista comportamiento heredado [V1] · CRÍTICA

Si el agente cambia una implementación existente, debe poder comparar antes y después.

```text
ORIGINAL
   ↓
resultado A

NUEVA
   ↓
resultado B

A == B
```

Cuando A y B no sean iguales, el cambio debe estar justificado.

---

## 0B.13 Regla: la UI no se rediseña sin requisito [V1] · CRÍTICA

No cambiar:

- colores;
- estructura;
- navegación;
- textos;
- posiciones;
- tamaños;
- flujo;

solo porque exista una preferencia estética del agente.

La adaptación a web puede requerir cambios, pero esos cambios deben estar justificados por:

- navegador;
- touch;
- responsive;
- accesibilidad;
- seguridad;
- nueva funcionalidad.

---

## 0B.14 Regla: el agente debe detenerse ante ambigüedad crítica [V1] · ALTA

Si no puede determinar si una funcionalidad existente debe conservarse o cambiarse, no debe inventar una solución silenciosamente.

Debe dejar constancia de:

```text
AMBIGÜEDAD
IMPACTO
OPCIONES
DECISIÓN NECESARIA
```

---

## 0B.15 Regla: no marcar como migrado lo que no ha sido validado [V1] · CRÍTICA

Una actividad solo puede marcarse como migrada cuando:

```text
Código
+
Tests
+
Paridad
+
Build
+
UX
```

han sido comprobados según corresponda.

---

## 0B.16 Regla: mantener trazabilidad entre original y web [V1] · CRÍTICA

Cada módulo migrado debe poder responder:

```text
¿De dónde viene?
¿Qué se ha cambiado?
¿Por qué?
¿Cómo sabemos que sigue funcionando?
```

---

# BLOQUE 0C — ARQUITECTURA OBJETIVO DE LA NUEVA PLATAFORMA

Este bloque no sustituye las decisiones de stack del roadmap original. Define la separación conceptual necesaria para que el crecimiento futuro no obligue a rehacer el producto.

## 0C.1 Separar Frontend y Backend [V1] · CRÍTICA

```text
WEB / PWA
    ↓
API
    ↓
SERVICIOS DE APLICACIÓN
    ↓
CORE
    ↓
DATOS / STORAGE
```

---

## 0C.2 Separar Core educativo de infraestructura [V1] · CRÍTICA

El Core no debe conocer:

- Cloudflare;
- D1;
- R2;
- React;
- navegador;
- cookies;
- HTTP.

El Core debe conocer conceptos educativos.

---

## 0C.3 Separar contenido de código [V1] · CRÍTICA

```text
CODE
  ↓
engines / validators / renderers

DATA
  ↓
courses / subjects / activities / configurations
```

Así, añadir un curso no implica modificar la lógica de la plataforma.

---

## 0C.4 Diseñar un modelo de actividad parametrizada [V1] · CRÍTICA

Una actividad debe poder representarse como datos:

```text
Activity
 ├── subject
 ├── course
 ├── topic
 ├── generator
 ├── validator
 ├── renderer
 ├── difficulty
 ├── settings
 └── version
```

---

## 0C.5 Separar definición de actividad y ejecución [V1] · CRÍTICA

No mezclar:

```text
qué es una actividad
```

con:

```text
una ejecución concreta de esa actividad
```

Modelo conceptual:

```text
ActivityDefinition
        ↓
ActivitySession
        ↓
ExerciseAttempt
        ↓
Result
```

Esto será necesario para tareas, histórico y analítica.

---

## 0C.6 Diseñar desde el principio para multi-tenant [V1] · CRÍTICA

La arquitectura deberá asumir:

```text
Platform
 ├── School A
 ├── School B
 └── School C
```

El colegio piloto no tendrá código especial que no pueda utilizar un segundo colegio.

---

## 0C.7 Separar roles de recursos [V1] · CRÍTICA

El rol responde:

```text
¿Qué puede hacer este usuario?
```

La pertenencia responde:

```text
¿Sobre qué recursos puede hacerlo?
```

Ambas comprobaciones deben existir.

---

## 0C.8 Preparar la futura arquitectura de alumnos y tareas [V1] · ALTA

Aunque alumnos y tareas se implementen posteriormente, la plataforma debe dejar espacio conceptual para:

```text
School
 ↓
AcademicYear
 ↓
Class
 ↓
Students
 ↓
Assignments
 ↓
Submissions
 ↓
Results
```

---

# BLOQUE 0D — ESTRATEGIA DE DATOS Y CRECIMIENTO

## 0D.1 Definir entidades principales [V1] · CRÍTICA

Como mínimo estudiar:

```text
Organization / School
User
Teacher
Student
AcademicYear
Class
Subject
Course / Grade
ActivityDefinition
Assignment
ActivitySession
ExerciseAttempt
Submission
Result
```

No todas tienen que implementarse en V1, pero deben distinguirse conceptualmente antes de cerrar el esquema.

---

## 0D.2 Separar datos globales de datos del colegio [V1] · CRÍTICA

Ejemplo:

```text
GLOBAL
 ├── subjects
 ├── curriculum definitions
 ├── activity definitions
 ├── engines
 └── public assets

SCHOOL
 ├── users
 ├── classes
 ├── students
 ├── assignments
 └── results
```

Esto facilita escalar a muchos colegios sin duplicar el catálogo.

---

## 0D.3 Versionar actividades y motores [V1] · ALTA

**Objetivo**

Que una actualización futura no cambie silenciosamente el significado histórico de una actividad.

Ejemplo:

```text
Activity: sumas
Version: 1.2
Generator: 3.1
Validator: 2.0
```

**Terminado cuando**

Una actividad ejecutada en el pasado puede identificar las versiones relevantes que utilizó.

---

## 0D.4 Diseñar reproducibilidad mediante seed [V1] · CRÍTICA

Mantener la capacidad existente de reproducir ejercicios cuando corresponda.

```text
Activity configuration
+
seed
+
engine version
=
reproducción
```

Esto será especialmente importante para tareas, fichas y soporte técnico.

---

## 0D.5 Separar almacenamiento de archivos y base de datos [V1] · ALTA

La base de datos no debe convertirse en un contenedor indiscriminado de archivos grandes.

Conceptualmente:

```text
D1 / DB
  → metadatos

R2 / Storage
  → archivos / assets / documentos
```

---

# BLOQUE 0E — ESTRATEGIA DE MIGRACIÓN DEL TAMAÑO DE LA APLICACIÓN

## 0E.1 Identificar qué ocupa los 500 MB [V1] · CRÍTICA

**Objetivo**

No asumir que todo el tamaño es código.

**Qué hacer**

Analizar el tamaño por:

- JavaScript;
- dependencias;
- modelos;
- imágenes;
- fuentes;
- assets;
- documentos;
- contenido;
- cachés;
- recursos duplicados.

**Terminado cuando**

Sabemos exactamente de dónde proceden los 500 MB.

---

## 0E.2 Separar aplicación de contenido pesado [V1] · CRÍTICA

**Objetivo**

Evitar que cada usuario tenga que descargar todo el catálogo.

**Estrategia**

```text
APP CORE
   ↓
pequeña

CONTENIDO
   ↓
carga bajo demanda

MODELOS
   ↓
carga/cache según necesidad
```

**Terminado cuando**

La aplicación inicial no necesita incluir todos los contenidos futuros.

---

## 0E.3 Carga bajo demanda de recursos [V1] · ALTA

**Objetivo**

Reducir descarga inicial y memoria.

**Qué hacer**

Cargar únicamente:

- código necesario;
- actividades necesarias;
- assets necesarios;
- modelos necesarios.

**Terminado cuando**

La aplicación no descarga innecesariamente todo el catálogo para abrirse.

---

## 0E.4 Estrategia de caché por versión [V1] · ALTA

**Objetivo**

Evitar que las actualizaciones rompan la aplicación offline.

**Qué hacer**

Versionar:

- aplicación;
- assets;
- modelos;
- manifiestos;
- contenido.

**Terminado cuando**

La aplicación puede saber qué versión de cada recurso tiene instalada.

---

## 0E.5 Actualización progresiva de contenido [V1.1] · ALTA

**Objetivo**

Actualizar contenido sin tener que reinstalar toda la aplicación.

**Terminado cuando**

Un nuevo curso o actividad puede descargarse de forma independiente según la arquitectura elegida.

---

# BLOQUE 0F — PRIMERA EJECUCIÓN DEL AGENTE

## 0F.1 Modo auditoría antes de modificar código [ANTES DE MIGRAR] · CRÍTICA

La primera ejecución del agente sobre el repositorio debe ser exclusivamente de análisis.

Debe producir:

```text
INVENTORY.md
ARCHITECTURE_CURRENT.md
ENGINES.md
UI_INVENTORY.md
MIGRATION_MAP.md
MIGRATION_RISKS.md
```

**No debe modificar código funcional.**

---

## 0F.2 Informe de riesgos de migración [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

Conocer las zonas donde una migración puede romper comportamiento.

Clasificar:

```text
BAJO
MEDIO
ALTO
CRÍTICO
```

**Terminado cuando**

Los motores, reconocimiento, persistencia, Electron y UI tienen riesgo identificado.

---

## 0F.3 Plan de migración por dependencia [ANTES DE MIGRAR] · CRÍTICA

**Objetivo**

No migrar una capa antes de que sus dependencias estén preparadas.

Ejemplo:

```text
Generator
   ↓
Exercise Definition
   ↓
Renderer
   ↓
Activity
   ↓
PWA
```

**Terminado cuando**

El agente puede seguir una secuencia basada en dependencias reales.

---

## 0F.4 Primera implementación: una actividad real [V1] · CRÍTICA

**Objetivo**

Probar la arquitectura con código real y no con pantallas ficticias.

**Regla**

La primera actividad debe proceder del catálogo existente.

No crear una actividad de demostración que no exista en el producto original salvo que sea necesaria para una prueba técnica explícita.

---

## 0F.5 No migrar las 62 actividades de golpe [V1] · CRÍTICA

**Objetivo**

Mantener controlado el riesgo.

**Estrategia**

```text
1 actividad
   ↓
3 actividades
   ↓
10 actividades
   ↓
catálogo completo
```

Cada escalón debe validar la arquitectura.

---

## 0F.6 Cierre de fase de extracción [V1] · CRÍTICA

La extracción del Core se considerará cerrada cuando:

```text
[ ] Core sin dependencia de React
[ ] Core sin dependencia de Electron
[ ] Generadores aislados
[ ] Validators aislados
[ ] Tests migrados
[ ] Golden Master creado
[ ] Semillas reproducibles
[ ] Actividad real ejecutable fuera de UI
```

---

# BLOQUE 0G — ORDEN GLOBAL ACTUALIZADO

El roadmap original mantiene todos sus bloques y pasos. Este bloque añade la **ruta recomendada de ejecución**, que debe entenderse como una prioridad de implementación y no como una eliminación o renumeración de los 239 pasos existentes.

```text
FASE 0
Preservación + auditoría
   │
   ├── congelar Desktop
   ├── inventariar
   ├── documentar arquitectura actual
   ├── mapa de migración
   ├── identificar motores
   └── contrato para agente
   │
   ▼
FASE 1
Extracción del Core
   │
   ├── engines
   ├── generators
   ├── validators
   ├── domain
   └── tests
   │
   ▼
FASE 2
Golden Master + paridad
   │
   ├── casos reales
   ├── semillas
   ├── resultados
   └── regression tests
   │
   ▼
FASE 3
Primer Vertical Slice
   │
   ├── Web/PWA
   ├── una actividad real
   ├── pizarra
   ├── reconocimiento
   ├── corrección
   └── resumen
   │
   ▼
GATE ARQUITECTURA
   │
   ▼
FASE 4
Pizarra + reconocimiento + offline
   │
   ├── Pointer Events
   ├── DigitCell
   ├── modelo
   ├── IndexedDB
   └── service worker
   │
   ▼
FASE 5
Migración progresiva de catálogo
   │
   ├── 43 comunes
   ├── específicas 1.º
   └── específicas 2.º
   │
   ▼
FASE 6
Backend + autenticación
   │
   ├── API
   ├── usuarios
   ├── sesiones
   └── profesor
   │
   ▼
FASE 7
Multi-colegio
   │
   ├── Organization/School
   ├── roles
   ├── clases
   ├── aislamiento
   └── seguridad
   │
   ▼
FASE 8
Fichas + operación
   │
   ├── PDF
   ├── CI/CD
   ├── backups
   ├── monitorización
   └── producción
   │
   ▼
GATE PILOTO
   │
   ▼
FASE 9
Uso real con colegio piloto
   │
   ├── incidencias
   ├── métricas
   ├── UX
   └── deuda técnica
   │
   ▼
FASE 10
Alumnos + clases + tareas
   │
   ├── alumnos
   ├── asignaciones
   ├── entregas
   ├── corrección
   └── histórico
   │
   ▼
FASE 11
Progreso + analítica
   │
   ├── alumno
   ├── clase
   └── tema
   │
   ▼
FASE 12
Nuevos cursos
   │
   └── 3.º → 6.º
   │
   ▼
FASE 13
Nuevas asignaturas
   │
   ├── Lengua
   ├── Inglés
   ├── Ciencias
   └── otras
   │
   ▼
FASE 14
SaaS
   │
   ├── suscripciones
   ├── planes
   ├── límites
   ├── onboarding
   └── billing
```

---

# BLOQUE 0H — GATES ESPECÍFICOS DE MIGRACIÓN

## 0H.1 Gate: no tocar el Core antes de inventariarlo [CRÍTICA]

No se permite refactorizar el Core antes de completar la auditoría correspondiente.

---

## 0H.2 Gate: no migrar UI antes de entender el comportamiento [CRÍTICA]

La pantalla no se considera especificada solo por su apariencia. Deben entenderse también sus estados y flujo.

---

## 0H.3 Gate: no sustituir motor sin comparación [CRÍTICA]

Cualquier motor alternativo debe compararse con el original sobre Golden Master.

---

## 0H.4 Gate: no ampliar catálogo antes de validar el patrón [CRÍTICA]

No añadir decenas de actividades nuevas hasta demostrar que el patrón de actividad parametrizada funciona con varias actividades existentes.

---

## 0H.5 Gate: no introducir alumnos antes de cerrar privacidad y autorización [CRÍTICA]

Los datos de menores requieren que la arquitectura de acceso, retención y protección esté preparada.

---

## 0H.6 Gate: no abrir segundo colegio antes de pruebas cross-tenant [CRÍTICA]

La plataforma no se abre a un segundo centro hasta que:

```text
School A → no puede acceder a School B
```

haya sido probado de forma automatizada y manual.

---

## 0H.7 Gate: no retirar Desktop antes del piloto [CRÍTICA]

La aplicación original se mantiene disponible como referencia y fallback hasta cerrar el piloto de la nueva plataforma.

---

# BLOQUE 0I — SAAS Y ESCALABILIDAD COMERCIAL

Estos pasos amplían el roadmap existente para cubrir la visión de convertir el producto en un servicio utilizado por múltiples colegios mediante suscripción.

## 0I.1 Definir modelo de producto SaaS [FUTURO] · ALTA

**Objetivo**

Separar claramente producto, colegio y suscripción.

```text
PLATAFORMA
   │
   ├── ORGANIZATION
   │
   └── SUBSCRIPTION
```

**Terminado cuando**

Un colegio puede existir independientemente de su plan comercial.

---

## 0I.2 Definir planes [FUTURO] · MEDIA

**Objetivo**

Preparar límites y funcionalidades comerciales.

Posibles dimensiones:

- número de profesores;
- número de alumnos;
- número de clases;
- asignaturas;
- almacenamiento;
- analítica;
- funcionalidades avanzadas.

**Terminado cuando**

Los planes están definidos como configuración y no como código duplicado.

---

## 0I.3 Sistema de feature flags [FUTURO] · ALTA

**Objetivo**

Activar capacidades por plan o colegio sin crear forks de la aplicación.

```text
Feature
   ↓
¿Está disponible para esta organización?
   ↓
Sí / No
```

**Terminado cuando**

Una funcionalidad puede habilitarse/deshabilitarse mediante configuración controlada.

---

## 0I.4 Límites por organización [FUTURO] · ALTA

**Objetivo**

Aplicar límites comerciales sin depender de la interfaz.

**Qué hacer**

Controlar server-side:

- usuarios;
- alumnos;
- clases;
- almacenamiento;
- etc.

**Terminado cuando**

Un usuario no puede superar un límite manipulando el frontend.

---

## 0I.5 Preparar billing desacoplado [FUTURO] · MEDIA

**Objetivo**

Permitir introducir pagos sin contaminar el dominio educativo.

**Regla**

```text
Billing
   ↓
Subscription
   ↓
Entitlements
   ↓
Plataforma
```

La lógica de ejercicios no debe depender directamente del proveedor de pagos.

---

## 0I.6 Onboarding comercial [FUTURO] · ALTA

**Objetivo**

Permitir que un colegio nuevo pueda empezar rápidamente.

```text
Colegio
 ↓
Plan
 ↓
Administrador
 ↓
Profesores
 ↓
Clases
 ↓
Alumnos
 ↓
Primera actividad
```

**Terminado cuando**

Un colegio nuevo puede pasar de cuenta creada a primera actividad sin intervención técnica.

---

## 0I.7 Métricas de producto [FUTURO] · MEDIA

**Objetivo**

Medir uso de la plataforma sin recopilar datos innecesarios.

**Medir preferentemente**

- disponibilidad;
- errores;
- rendimiento;
- adopción de funcionalidades;
- uso agregado.

**Terminado cuando**

Podemos saber qué funcionalidades funcionan y cuáles necesitan mejora respetando la privacidad.

---

# APÉNDICE A — ESTRUCTURA DE REPOSITORIO OBJETIVO

La estructura final puede evolucionar según el stack elegido. La siguiente es una referencia conceptual y **no obliga a mover físicamente todas las carpetas del proyecto actual en el primer día**.

```text
/
├── apps/
│   ├── web/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pwa/
│   │   └── ...
│   │
│   └── api/
│       ├── auth/
│       ├── schools/
│       ├── users/
│       ├── classes/
│       ├── activities/
│       ├── assignments/
│       ├── submissions/
│       └── ...
│
├── packages/
│   ├── core/
│   │   ├── domain/
│   │   ├── engines/
│   │   ├── generators/
│   │   ├── validators/
│   │   └── schemas/
│   │
│   ├── content/
│   │   ├── mathematics/
│   │   ├── language/
│   │   └── ...
│   │
│   ├── recognition/
│   │   ├── preprocess/
│   │   ├── model/
│   │   └── adaptation/
│   │
│   └── testing/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   ├── ARCHITECTURE_CURRENT.md
│   ├── ARCHITECTURE_TARGET.md
│   ├── INVENTORY.md
│   ├── ENGINES.md
│   ├── UI_INVENTORY.md
│   ├── DATA_MODEL.md
│   ├── MIGRATION_MAP.md
│   ├── MIGRATION_CHANGELOG.md
│   └── MIGRATION_RISKS.md
│
├── tests/
│   ├── golden-master/
│   ├── regression/
│   ├── integration/
│   └── e2e/
│
├── legacy/
│   └── referencia de la aplicación original
│
├── AGENT_RULES.md
├── TECH_DEBT.md
└── ROADMAP.md
```

**IMPORTANTE:** esta estructura es el objetivo. No debe ejecutarse como una reorganización masiva automática. La estructura física se irá alcanzando mediante migraciones pequeñas y verificadas.

---

# APÉNDICE B — DEFINICIÓN DE UNA MIGRACIÓN CORRECTA

Una pieza del producto se considera correctamente migrada cuando se puede demostrar:

```text
[ ] Se identificó su implementación original
[ ] Se documentó qué hace
[ ] Se identificaron dependencias
[ ] Se decidió qué conservar
[ ] Se decidió qué adaptar
[ ] Se decidió qué sustituir
[ ] Se creó o actualizó test
[ ] Se comparó con el comportamiento original
[ ] Se comprobó la UI cuando corresponde
[ ] Se comprobó offline cuando corresponde
[ ] Se comprobó rendimiento cuando corresponde
[ ] Se documentó cualquier diferencia
[ ] No se eliminó el original prematuramente
```

---

# APÉNDICE C — REGLA MAESTRA PARA ANTIGRAVITY

Antes de ejecutar cualquier cambio grande, el agente deberá pensar y documentar:

```text
1. ¿Esto ya existe en la aplicación original?

2. Si existe, ¿puedo reutilizarlo directamente?

3. Si no puedo reutilizarlo directamente, ¿puedo aislarlo mediante un adaptador?

4. ¿La dependencia que impide reutilizarlo es realmente Electron/DOM/desktop?

5. ¿Estoy cambiando comportamiento o solamente tecnología de entrega?

6. ¿Cómo demostraré que el comportamiento sigue siendo el mismo?

7. ¿Existe un Golden Master o test de regresión para esta pieza?

8. ¿Estoy introduciendo una abstracción porque la necesito o porque imagino un futuro?

9. ¿Estoy rediseñando la UI sin que nadie me lo haya pedido?

10. ¿Estoy eliminando algo que todavía sirve como referencia?
```

Si cualquiera de estas preguntas revela un cambio funcional no solicitado, el cambio debe documentarse y quedar explícitamente identificado antes de ejecutarse.

---

# APÉNDICE D — PRINCIPIO FINAL DE MIGRACIÓN

La nueva plataforma no debe considerarse una aplicación completamente nueva.

Debe considerarse:

```text
                  PRODUCTO EXISTENTE
                         │
              ┌──────────┴──────────┐
              │                     │
          VALOR EXISTENTE       TECNOLOGÍA
              │                     │
              │                 Electron
              │                 IPC
              │                 Desktop
              │                     │
              ▼                     ▼
          CONSERVAR             SUSTITUIR
              │                     │
              └──────────┬──────────┘
                         ▼
                  NUEVA PLATAFORMA
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           PWA WEB    BACKEND    MULTI-TENANT
              │          │          │
              └──────────┼──────────┘
                         ▼
                  ALUMNOS / TAREAS
                         │
                         ▼
                   MÁS CURSOS
                         │
                         ▼
                  MÁS ASIGNATURAS
                         │
                         ▼
                       SaaS
```

La regla definitiva será:

> **No estamos tirando EduColor para construir otra aplicación. Estamos convirtiendo EduColor en una plataforma web, preservando su lógica, motores, contenido, comportamiento y experiencia, y sustituyendo únicamente las piezas que pertenecen al modelo de escritorio por sus equivalentes web.**

---

# FIN DE LAS AMPLIACIONES DEL ROADMAP

Los pasos 1–239 del roadmap original se mantienen íntegros. Los bloques añadidos anteriormente son complementarios y deben ejecutarse como fases de preparación, migración y escalado alrededor de ellos.

# Roadmap maestro — Plataforma educativa de Matemáticas para Primaria

> ## Aviso: este documento es visión, no estado
>
> El roadmap de producto y arquitectura, con sus 239 pasos y sus criterios de
> aceptación, se conserva íntegro. **No lleva el estado de nada**, y su numeración
> de fases no coincide con la de
> [ROADMAP_DE_EJECUCION_DETALLADO.md](ROADMAP_DE_EJECUCION_DETALLADO.md): aquí
> "Fase 2" es Golden Master + paridad y allí es la migración del catálogo. Son dos
> listas distintas y no se mezclan.
>
> Para saber qué está hecho, el único sitio es
> [INVENTARIO_MIGRACION_ACTIVIDADES.md](INVENTARIO_MIGRACION_ACTIVIDADES.md). La
> auditoría de abajo se escribió el 2026-09-07 y describe el punto de partida; su
> apartado "Resumen ejecutivo" se corrige donde afirmaba que algo no existía y ya
> existe.

> ## Auditoría de reutilización desde EduColor original (Colegio)
>
> **Auditado el:** 2026-09-07 · **Origen:** `../Colegio` (versión declarada 0.2.10).
>
> Esta auditoría separa el valor funcional ya construido de la tecnología de
> entrega. El origen es una aplicación **Electron + React + TypeScript** para
> Windows; el destino de este roadmap es una **PWA web**. Por tanto, los motores,
> generadores, validadores, contenido, recursos y pruebas son candidatos a
> migración; Electron, IPC y el empaquetado Windows no deben copiarse al nuevo
> frontend.
>
> **Leyenda:** ✅ reutilizable directamente · 🟡 reutilizable tras adaptar la
> capa web/datos · 🔎 existe, pero requiere validación real o no está terminado ·
> ❌ trabajo nuevo para la plataforma.
>
> ### Resumen ejecutivo
>
> - ✅ Hay una base React/TypeScript madura con **62 actividades activas**:
>   **47 disponibles para 1.º**, **58 para 2.º**, de las que **43 son comunes**
>   a ambos cursos (más 4 específicas de 1.º y 15 específicas de 2.º). Junto
>   con los motores, generadores con semilla y 17 pruebas automatizadas, es el
>   punto de partida del catálogo de contenidos, no una demo que haya que
>   desechar.
> - ✅ Ya existe un flujo experimental de reconocimiento 0–9: canvas, modelo
>   TensorFlow.js local, preprocesado, umbral del 85 %, confirmación docente,
>   muestras en IndexedDB y ajuste local. El artefacto de modelo entrenado está
>   disponible en `Colegio/src/renderer/public/model/` (`model.json` y sus
>   pesos), por lo que puede migrarse aunque ya no existan las fotos originales.
>   Antes de adoptarlo habrá que conservar una copia con hash y validar precisión
>   y latencia en la pizarra real.
> - ✅ El generador de fichas DOCX está operativo y dispone de pruebas. 🟡 Para
>   cumplir este roadmap hay que añadir PDF y una plantilla A4 verificable.
> - ❌~~Login, API, D1/R2, PWA/service worker, multi-colegio, alumnado,
>   asignaciones, analítica, CI/CD y seguridad server-side no existen aún.~~
>   **Corregido el 2026-09-30.** Esa línea era cierta para el proyecto original y
>   dejó de serlo: la PWA, el service worker (`public/sw.js`) y el workflow de
>   CI/CD ya existen. Lo que **sigue sin existir** es el resto: login y
>   autenticación, API propia del producto, D1/R2, multi-colegio, modelo de
>   alumnado, asignaciones y analítica. Existe un backend Express
>   (`src/server/`) pero es una isla para el Compañero IA, no la API del
>   producto: no tiene identidad ni datos de alumnos.
>
> ### Inventario marcado por bloque
>
> | Ítems del roadmap                                | Estado | Evidencia reutilizable en `Colegio`                                                                                                                                                     | Decisión para la nueva EduColor                                                                                                                                   |
> | ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 1–2 (alcance y futuro)                           | 🟡     | Documentación de diseño, currículo y auditoría de escalado para 1.º/2.º y crecimiento.                                                                                                  | Consolidar en un único alcance V1; la documentación actual mezcla prototipo, ideas y arquitectura futura.                                                         |
> | 3–7 (PWA, arquitectura, stack, coste, migración) | ❌     | React, TypeScript y Vite son aprovechables; la app actual es Electron offline.                                                                                                          | Crear PWA y decidir Cloudflare/alternativa tras revisar costes, salida y operación. No migrar Electron ni `window.api`.                                           |
> | 8–9 (privacidad y multi-colegio)                 | 🟡/❌  | Auditoría con modelo de minimización y recomendaciones RGPD. No hay datos de alumnado ni aislamiento.                                                                                   | Reutilizar el análisis; definir con DPD y construir el modelo multi-tenant desde API/base de datos.                                                               |
> | 10–15 (hardware y navegador)                     | 🔎     | Guías de HDMI, USB Touch y matriz de compatibilidad; la app soporta táctil.                                                                                                             | Ejecutar el plan de pruebas en la pizarra real con Chrome/Edge y registrar resultados.                                                                            |
> | 16–20 (canvas, trazos y rendimiento)             | 🟡/🔎  | `DrawableAnswerBox` ofrece canvas, borrado y entrada mouse/touch.                                                                                                                       | Migrar el componente/preprocesado; rehacer con Pointer Events, historial undo/redo, strokes estructurados y medición de rendimiento.                              |
> | 21–24 (DigitCell y preprocesado)                 | 🟡     | Casilla de un dígito y pipeline de caja, escalado, centrado y normalización (`operations`).                                                                                             | Extraerlos como módulo independiente de React y sustituir handlers mouse/touch por Pointer Events.                                                                |
> | 25–28 (ONNX/WebGPU/WASM)                         | ❌     | El prototipo usa TensorFlow.js, no ONNX Runtime ni WebGPU/WASM explícito.                                                                                                               | Elegir: adaptar el modelo existente a TF.js o convertir/evaluar ONNX. Implementar los fallbacks y medirlos antes de adoptar.                                      |
> | 29–36 (confianza y aprendizaje)                  | 🟡     | Umbral 0,85, panel docente, muestras IndexedDB, exportación/backup y fine-tuning local.                                                                                                 | Reutilizar la lógica, pero añadir alternativas/versionado, límites/selección, reset y UX de administración. Validar que el fine-tuning no degrade precisión.      |
> | 37–41 (lab, dataset y métricas)                  | 🟡/❌  | Modal de entrenamiento y ~2.475 muestras documentadas. No hay dataset de evaluación, matriz de confusión ni benchmark reproducible.                                                     | Convertir el modal en Recognition Lab y crear conjunto de evaluación, métricas de precisión/confianza y latencia.                                                 |
> | 42–45 (Exercise Engine)                          | ✅/🟡  | Motores con `engine.ts`, renderizadores React, registro y generadores ya separados.                                                                                                     | Conservar contratos matemáticos y convertir el registro manual a manifiestos de datos versionados.                                                                |
> | 46–56 (contenido matemático V1)                  | ✅/🟡  | Catálogo activo de 1.º y 2.º: 43 actividades compartidas, 4 específicas de 1.º y 15 de 2.º; incluye numeración, U/D/C, suma/resta, comparación, series, problemas, ábaco, tablas y más. | Migrar primero los motores alineados con V1; formalizar un layout posicional común. No todos los motores usan aún `DigitCell`.                                    |
> | 57–69 (actividades, intentos y resumen)          | 🟡     | Registro de actividades, selección por curso, feedback, repetición y `SummaryScreen`.                                                                                                   | Reutilizar los patrones UI/lógica; crear modelo de actividad parametrizada, sesiones persistentes, intentos máximos y resúmenes de repetición.                    |
> | 70–78 (offline)                                  | 🟡     | La app Electron funciona sin red; TF.js e IndexedDB ya se usan localmente.                                                                                                              | Implementar explícitamente service worker, caché de recursos, sesión y recuperación de red para la PWA.                                                           |
> | 79–86 (profesor/administración)                  | 🟡/❌  | Inicio, perfiles/temas de aula y generador local; no hay autenticación.                                                                                                                 | Adaptar dashboard y temática; construir login, sesiones, actividades y controles docentes con autorización server-side.                                           |
> | 87–92 (fichas)                                   | ✅/🟡  | `docxExporter`, cabecera/mascota, muchos renderizadores de ficha y prueba automatizada.                                                                                                 | Reutilizar generadores/renderizado; añadir plantilla A4 validada, hoja de soluciones y conversión/exportación PDF.                                                |
> | 93–104 (alumnos, tareas y progreso)              | ❌     | No existe modelo de alumnos, entregas ni analítica individual.                                                                                                                          | Construir tras decisión DPD y arquitectura de datos; no almacenar datos personales en el prototipo migrado.                                                       |
> | 105–108 (más cursos, materias y reconocimiento)  | 🟡     | Hay contenido hasta 2.º y motores reutilizables, pero tipos y registro aún están acoplados a 1.º/2.º y Matemáticas.                                                                     | Desacoplar currículo/contenido antes de ampliar; añadir una materia piloto después.                                                                               |
> | 109–120 (operación/documentación)                | 🟡/❌  | Guías de instalación, pizarra, distribución, backup de muestras, changelog y checklist de producción.                                                                                   | Reutilizar y actualizar las guías para web; crear backup/restauración de datos, logs, monitorización, actualizaciones PWA, CI/CD, staging y producción.           |
> | 121–145 (multi-colegio)                          | ❌     | Solo documentación conceptual y temática local.                                                                                                                                         | Diseñar `School/Organization`, roles, aislamiento, retención y onboarding en backend antes de abrir a otro centro.                                                |
> | 146–150 (asignaciones e histórico)               | ❌     | No existen asignaciones ni registros persistentes de resultados.                                                                                                                        | Depende del bloque de alumnos, clases, API y seguridad.                                                                                                           |
> | 151–162 (calidad y tests de lógica)              | ✅/🟡  | TypeScript, ESLint, Prettier/Husky, Vitest y 17 tests, principalmente de generadores, motores, UI y DOCX.                                                                               | Copiar configuración útil y ampliar cobertura de manifiestos, validadores y rutas críticas.                                                                       |
> | 163–172 (tests DigitCell/offline/PDF)            | 🟡/❌  | Hay tests de motores y componentes; no hay pruebas específicas del canvas/preprocesado, IndexedDB/PWA ni PDF.                                                                           | Crear estas suites al extraer el núcleo web.                                                                                                                      |
> | 173–184 (gates y deuda)                          | 🟡     | `release:verify` ejecuta tipado, lint, tests y build; hay auditoría de deuda/riesgos.                                                                                                   | Convertirlo en CI obligatorio, Definition of Done, registro de deuda y gates de release.                                                                          |
> | 185–224 (ciberseguridad)                         | 🟡/❌  | Auditoría de riesgos y recomendaciones de privacidad; dependencia revisada según documentación. No existe backend/API.                                                                  | Reutilizar las políticas y threat model como punto de partida; implementar todos los controles de identidad, API, secretos, logs y copias en la plataforma nueva. |
> | 225–239 (revisiones por hito)                    | 🟡     | Auditoría previa y checklist de producción son buenos antecedentes.                                                                                                                     | Adoptar los gates del roadmap como proceso real, con evidencia de pruebas y aprobación DPD cuando aplique.                                                        |
>
> ### Activos que deben migrarse primero
>
> 1. **Núcleo matemático y catálogo de 1.º y 2.º:**
>    `src/renderer/src/core/engines/`, `core/generators/` y
>    `core/registry/activities.ts`. Empezar por las 43 actividades compartidas
>    y conservar las 4 específicas de 1.º y 15 de 2.º; migrar los contratos y
>    tests antes que los CSS/pantallas.
> 2. **Reconocimiento experimental:** `core/engines/operations/`:
>    `DrawableAnswerBox`, `digitPreprocess`, `digitModel`, `sampleStore` y
>    `TeacherConfirmPanel`. Es una base de investigación, no un componente
>    certificado para producción.
> 3. **Fichas y recursos:** `shared/services/docxExporter.ts`, los assets con
>    licencia/autoría confirmada y el sistema de perfiles visuales de aula.
> 4. **Calidad y conocimiento operativo:** tests existentes, guía táctil,
>    matriz de compatibilidad, inventario de actividades y checklist de piloto.
>
> ### Secuencia recomendada para llegar a la nueva imagen
>
> 1. Crear el shell React + TypeScript + PWA y extraer un vertical slice: una
>    actividad matemática existente, configuración, ficha y uso offline.
> 2. Pasar el registro y el currículo a manifiestos versionados; migrar los
>    motores V1 seleccionados con sus pruebas.
> 3. Validar en pizarra la entrada Pointer Events y el reconocedor con un
>    dataset medible antes de activar escritura por defecto.
> 4. Tras la decisión institucional de datos/DPD, crear API, login docente,
>    almacenamiento, seguridad y operación. Alumnado/tareas quedan después.
>
> **Conclusión:** no se parte de cero en experiencia de aula ni en Matemáticas.
> Se parte de un buen prototipo local que debe transformarse en una plataforma:
> conservar el dominio y el contenido, y reconstruir con intención la capa web,
> datos, seguridad y operación.

## Versión

**Documento:** Roadmap técnico y funcional maestro  
**Versión:** 1.0  
**Fecha:** 2026-09-07  
**Alcance inicial:** 1.º y 2.º de Primaria · Matemáticas  
**Visión futura:** 1.º–6.º de Primaria · múltiples asignaturas · profesores · alumnos · tareas · corrección · progreso

---

# 0. Visión general

La aplicación será una **plataforma web/PWA educativa** que el colegio podrá utilizar sin instalar servidores locales.

El profesor utilizará un portátil conectado a la pizarra digital mediante:

- **HDMI** para enviar la imagen.
- **USB Touch** para recibir los toques de la pizarra.

La aplicación se ejecutará en el portátil y podrá instalarse como una PWA desde Chrome/Edge. Esto significa que el profesor tendrá un icono para abrirla como si fuera un programa, pero no tendremos que mantener un ejecutable tradicional.

La arquitectura propuesta es:

```text
                    INTERNET
                       │
              ┌────────▼────────┐
              │ Cloudflare Pages│
              │ React + PWA     │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ Cloudflare      │
              │ Workers API     │
              └───────┬─────┬───┘
                      │     │
              ┌───────▼─┐ ┌─▼────────┐
              │ D1      │ │ R2       │
              │ SQLite  │ │ Archivos │
              └─────────┘ └──────────┘

                       ▲
                       │
                    HTTPS
                       │
              ┌────────┴────────┐
              │ Portátil        │
              │ profesor        │
              │                 │
              │ PWA             │
              │ OCR local       │
              │ Motor ejercicios│
              │ Sesión offline  │
              └────────┬────────┘
                       │
               HDMI + USB Touch
                       │
                       ▼
                  PIZARRA DIGITAL
```

El reconocimiento de escritura será **local**, no dependerá de una API externa y, en la V1, se centrará en reconocer **dígitos del 0 al 9**.

La decisión clave será:

> **Una casilla = un dígito.**

Por ejemplo:

```text
CENTENAS     DECENAS     UNIDADES

   [ 2 ]        [ 7 ]       [ 4 ]
```

El sistema no intentará reconocer `274` como una imagen única. Reconocerá `2`, `7` y `4` por separado y después reconstruirá `274`.

---

# Cómo leer este roadmap

Cada paso tiene:

- **Objetivo:** para qué sirve.
- **Qué hacer:** trabajo concreto.
- **Terminado cuando:** criterio de aceptación.

Las etiquetas utilizadas son:

- **[V1]** imprescindible para el primer producto usable.
- **[V1.1]** primera ampliación.
- **[V2]** segunda gran versión.
- **[FUTURO]** previsto para crecimiento posterior.

Prioridades:

- **CRÍTICA**
- **ALTA**
- **MEDIA**
- **BAJA**

---

# BLOQUE 1 — FUNDAMENTOS DEL PRODUCTO

## 1. Definir visión y límites del producto [V1] · CRÍTICA

**Objetivo**

Evitar que el proyecto crezca sin control antes de tener un producto usable.

**Qué hacer**

Documentar que la primera versión se centra exclusivamente en:

- 1.º Primaria.
- 2.º Primaria.
- Matemáticas.
- Pizarra digital.
- Reconocimiento 0–9.
- Actividades.
- Autocorrección.
- Repetición opcional.
- Resumen.
- Fichas PDF.
- Login de profesores.

**Terminado cuando**

Existe un documento que define claramente lo que entra y lo que no entra en la V1.

---

## 2. Definir la visión a largo plazo [FUTURO] · ALTA

**Objetivo**

Diseñar hoy sin cerrar las puertas del futuro.

**Qué hacer**

Dejar previsto:

- 3.º–6.º de Primaria.
- Más asignaturas.
- Alumnos.
- Clases.
- Tareas.
- Entregas.
- Estadísticas.
- Nuevos motores de ejercicios.
- Nuevos modelos de reconocimiento.

**Terminado cuando**

El crecimiento futuro está documentado y no requiere rehacer el núcleo.

---

## 3. Definir el concepto de PWA [V1] · CRÍTICA

**Objetivo**

Que el profesor pueda abrir la aplicación fácilmente como si fuese un programa.

**Qué hacer**

Preparar la aplicación para:

- instalar desde Chrome/Edge;
- abrirse en ventana propia;
- ejecutarse a pantalla completa;
- actualizarse automáticamente;
- funcionar parcialmente sin Internet.

**Terminado cuando**

Un profesor puede instalarla desde el navegador y abrirla desde un icono.

---

## 4. Definir la arquitectura general [V1] · CRÍTICA

**Objetivo**

Evitar decisiones improvisadas durante el desarrollo.

**Qué hacer**

Fijar:

- frontend;
- backend;
- base de datos;
- almacenamiento;
- autenticación;
- offline;
- reconocimiento;
- generador de fichas;
- testing;
- despliegue.

**Terminado cuando**

Existe un diagrama y documento de arquitectura aprobado.

---

## 5. Seleccionar el stack tecnológico [V1] · CRÍTICA

**Objetivo**

Reducir el número de tecnologías.

**Qué hacer**

Adoptar:

- React;
- TypeScript;
- Vite;
- Tailwind;
- PWA;
- Cloudflare Pages;
- Cloudflare Workers;
- Cloudflare D1;
- Cloudflare R2;
- IndexedDB;
- ONNX Runtime Web;
- Vitest;
- Playwright;
- GitHub.

**Terminado cuando**

El stack está fijado y documentado.

---

## 6. Definir estrategia de coste [V1] · CRÍTICA

**Objetivo**

Mantener el coste operativo inicial próximo a cero.

**Qué hacer**

Priorizar:

- servicios gratuitos;
- reconocimiento local;
- sin APIs de IA de pago por ejercicio;
- sin servidor local;
- sin aplicación móvil nativa;
- sin software propietario imprescindible.

**Terminado cuando**

Existe una hoja de costes con límites y dependencias externas.

---

## 7. Definir estrategia de migración [V1] · ALTA

**Objetivo**

No quedar atrapados en un proveedor cloud.

**Qué hacer**

Diseñar:

- exportación de D1;
- copia de datos;
- separación de lógica;
- documentación de despliegue;
- estructura portable.

**Terminado cuando**

Se puede explicar cómo migrar la aplicación y sus datos a otra infraestructura.

---

## 8. Definir requisitos legales y de privacidad [V1] · CRÍTICA

**Objetivo**

Diseñar la privacidad antes de almacenar datos de menores.

**Qué hacer**

Definir:

- responsable del tratamiento;
- encargado del tratamiento;
- datos mínimos;
- conservación;
- borrado;
- exportación;
- accesos;
- trazabilidad.

**Terminado cuando**

Existe un documento técnico de privacidad para revisión del colegio/DPO.

---

## 9. Definir modelo multi-colegio [V1] · ALTA

**Objetivo**

Permitir crecer sin rehacer la base de datos.

**Qué hacer**

Introducir `school_id` donde corresponda y separar claramente los datos de cada centro.

**Terminado cuando**

Un usuario solo puede acceder a los datos de su colegio.

---

# BLOQUE 2 — HARDWARE Y PIZARRA

## 10. Identificar el modelo real de pizarra [V1] · CRÍTICA

**Objetivo**

No desarrollar contra un hardware imaginario.

**Qué hacer**

Registrar:

- fabricante;
- modelo;
- resolución;
- tamaño;
- sistema touch;
- sistema operativo del portátil.

**Terminado cuando**

Tenemos las especificaciones y una unidad real para probar.

---

## 11. Validar conexión HDMI [V1] · CRÍTICA

**Objetivo**

Garantizar que la imagen llega correctamente.

**Qué hacer**

Probar:

- resolución nativa;
- duplicación de pantalla;
- pantalla extendida;
- escalado;
- refresco.

**Terminado cuando**

La pizarra muestra la aplicación correctamente.

---

## 12. Validar USB Touch [V1] · CRÍTICA

**Objetivo**

Garantizar que la pizarra envía el tacto al portátil.

**Qué hacer**

Probar:

- toque simple;
- arrastre;
- escritura;
- precisión;
- múltiples toques si el hardware lo soporta.

**Terminado cuando**

El sistema operativo y navegador reciben los eventos táctiles correctamente.

---

## 13. Validar Chrome y Edge [V1] · ALTA

**Objetivo**

Elegir el navegador recomendado.

**Qué hacer**

Ejecutar las mismas pruebas en Chrome y Edge.

**Terminado cuando**

Tenemos navegador recomendado y navegador alternativo.

---

## 14. Validar pantalla completa [V1] · ALTA

**Objetivo**

Que la pizarra no tenga elementos de interfaz del navegador que molesten.

**Qué hacer**

Probar pantalla completa y dimensiones reales.

**Terminado cuando**

La interfaz ocupa toda el área útil.

---

## 15. Validar Pointer Events [V1] · CRÍTICA

**Objetivo**

Capturar correctamente touch, mouse y lápiz cuando estén disponibles.

**Qué hacer**

Construir una pantalla de diagnóstico.

**Terminado cuando**

Podemos ver coordenadas y eventos en tiempo real.

---

## 16. Construir canvas de escritura [V1] · CRÍTICA

**Objetivo**

Permitir escribir directamente en la pizarra.

**Qué hacer**

Crear:

- canvas;
- trazos;
- suavizado;
- borrado.

**Terminado cuando**

El niño puede escribir de forma natural.

---

## 17. Implementar borrado [V1] · ALTA

**Objetivo**

Eliminar trazos fácilmente.

**Qué hacer**

Añadir:

- borrar último trazo;
- borrar selección si se implementa;
- limpiar casilla;
- limpiar pizarra.

**Terminado cuando**

El usuario puede corregir errores sin reiniciar la actividad.

---

## 18. Implementar deshacer y rehacer [V1] · ALTA

**Objetivo**

Facilitar correcciones.

**Qué hacer**

Mantener historial de trazos.

**Terminado cuando**

Deshacer y rehacer funcionan de manera estable.

---

## 19. Diseñar gestión de trazos [V1] · CRÍTICA

**Objetivo**

Separar visualización de información para reconocimiento.

**Qué hacer**

Representar cada trazo con:

- puntos;
- tiempo;
- presión si está disponible;
- identificador.

**Terminado cuando**

La misma escritura puede dibujarse y procesarse posteriormente.

---

## 20. Medir rendimiento de la pizarra [V1] · ALTA

**Objetivo**

Conseguir una sensación de respuesta inmediata.

**Qué hacer**

Medir:

- latencia táctil;
- FPS;
- uso de CPU;
- uso de memoria.

**Terminado cuando**

La escritura es fluida en el hardware real.

---

# BLOQUE 3 — RECONOCIMIENTO DE ESCRITURA

## 21. Diseñar `DigitCell` [V1] · CRÍTICA

**Objetivo**

Crear la unidad básica de reconocimiento.

**Qué hacer**

Cada casilla tendrá:

- área de escritura;
- canvas;
- captura de strokes;
- reconocimiento;
- estado;
- resultado.

**Terminado cuando**

Una casilla puede reconocer un único dígito independientemente del resto.

---

## 22. Definir casillas posicionales [V1] · CRÍTICA

**Objetivo**

Representar unidades, decenas y centenas.

**Qué hacer**

Crear layouts de:

- unidades;
- decenas;
- centenas;
- miles en el futuro.

**Terminado cuando**

Una operación puede construirse con N `DigitCell`.

---

## 23. Reconocer solamente 0–9 [V1] · CRÍTICA

**Objetivo**

Reducir la dificultad del reconocimiento.

**Qué hacer**

El modelo tendrá 10 clases:

`0,1,2,3,4,5,6,7,8,9`.

**Terminado cuando**

El reconocedor produce una predicción para cada casilla.

---

## 24. Diseñar preprocesamiento [V1] · CRÍTICA

**Objetivo**

Normalizar diferentes tamaños y posiciones de escritura.

**Qué hacer**

Implementar:

- centrado;
- escalado;
- normalización;
- remuestreo;
- limpieza.

**Terminado cuando**

Dos escrituras equivalentes pero de distinto tamaño producen entradas comparables.

---

## 25. Preparar modelo ONNX [V1] · CRÍTICA

**Objetivo**

Tener un modelo ejecutable en navegador.

**Qué hacer**

Preparar el modelo base del reconocedor de dígitos y definir su versión.

**Terminado cuando**

El modelo puede cargarse desde la aplicación.

---

## 26. Integrar ONNX Runtime Web [V1] · CRÍTICA

**Objetivo**

Ejecutar el modelo localmente.

**Qué hacer**

Crear el servicio `DigitRecognizer`.

**Terminado cuando**

Una escritura llega al modelo y obtenemos:

- clase;
- score;
- tiempo de inferencia.

---

## 27. Activar WebGPU cuando sea posible [V1.1] · MEDIA

**Objetivo**

Aprovechar aceleración del hardware.

**Qué hacer**

Detectar compatibilidad y utilizar WebGPU cuando sea apropiado.

**Terminado cuando**

El reconocedor usa aceleración cuando existe y mantiene fallback cuando no.

---

## 28. Fallback WASM/CPU [V1] · CRÍTICA

**Objetivo**

Que el sistema no dependa de WebGPU.

**Qué hacer**

Probar ejecución mediante WASM/CPU.

**Terminado cuando**

El reconocedor funciona incluso en equipos sin WebGPU.

---

## 29. Diseñar sistema de confianza [V1] · CRÍTICA

**Objetivo**

Saber cuándo el sistema debe abstenerse.

**Qué hacer**

Exponer:

- predicción;
- confianza;
- alternativas;
- versión del modelo.

**Terminado cuando**

Cada reconocimiento tiene una confianza utilizable por el sistema.

---

## 30. Implementar umbral operativo del 85 % [V1] · CRÍTICA

**Objetivo**

No aceptar automáticamente predicciones poco fiables.

**Qué hacer**

Regla inicial:

- `>= 85%`: aceptar;
- `< 85%`: preguntar al profesor.

**Terminado cuando**

La aplicación respeta el umbral en todos los ejercicios.

---

## 31. Crear pregunta al profesor [V1] · CRÍTICA

**Objetivo**

Resolver dudas sin bloquear la clase.

**Qué hacer**

Mostrar una interfaz sencilla con los dígitos 0–9.

**Terminado cuando**

El profesor puede responder con un toque y la actividad continúa.

---

## 32. Registrar corrección manual [V1] · ALTA

**Objetivo**

Convertir la corrección del profesor en conocimiento útil.

**Qué hacer**

Relacionar:

- muestra;
- etiqueta real;
- predicción;
- confianza;
- versión del modelo.

**Terminado cuando**

Una corrección produce un registro estructurado.

---

## 33. Crear memoria adaptativa [V1] · ALTA

**Objetivo**

Permitir que el reconocedor aprenda localmente.

**Qué hacer**

Crear almacenamiento de ejemplos representativos.

**Terminado cuando**

Una corrección puede influir en futuros reconocimientos de ese equipo.

---

## 34. Aprendizaje local inmediato [V1] · ALTA

**Objetivo**

Que el efecto de la corrección aparezca sin Internet.

**Qué hacer**

Actualizar la memoria adaptativa inmediatamente después de corregir.

**Terminado cuando**

La siguiente escritura similar puede aprovechar el nuevo ejemplo.

---

## 35. Limitar y seleccionar muestras [V1.1] · ALTA

**Objetivo**

Evitar crecimiento ilimitado del almacén local.

**Qué hacer**

Implementar:

- límite por dígito;
- muestras representativas;
- eliminación de duplicados.

**Terminado cuando**

La memoria mantiene un tamaño controlado.

---

## 36. Resetear aprendizaje [V1] · ALTA

**Objetivo**

Permitir volver al estado original.

**Qué hacer**

Crear:

- reset del aprendizaje;
- confirmación;
- estadísticas básicas de memoria.

**Terminado cuando**

El profesor puede borrar los ejemplos adaptativos sin reinstalar la aplicación.

---

## 37. Construir Recognition Lab [V1] · ALTA

**Objetivo**

Disponer de una herramienta interna para desarrollar el reconocedor.

**Qué hacer**

Permitir:

- dibujar;
- reconocer;
- ver confianza;
- corregir;
- guardar muestra.

**Terminado cuando**

Podemos investigar errores sin usar la aplicación completa.

---

## 38. Crear dataset interno de evaluación [V1] · CRÍTICA

**Objetivo**

Medir objetivamente la calidad.

**Qué hacer**

Recoger muestras de escritura variadas y etiquetarlas.

**Terminado cuando**

Existe un conjunto reproducible de evaluación.

---

## 39. Crear matriz de confusión [V1] · ALTA

**Objetivo**

Descubrir qué números se confunden.

**Qué hacer**

Medir confusiones como:

- 1/7;
- 3/8;
- 5/6;
- etc.

**Terminado cuando**

Tenemos una matriz de confusión por versión del modelo.

---

## 40. Calibrar el umbral del 85 % [V1.1] · ALTA

**Objetivo**

Comprobar si 85 % es un buen umbral real.

**Qué hacer**

Analizar:

- falsos positivos;
- falsos negativos;
- abstenciones;
- exactitud por rango de confianza.

**Terminado cuando**

El 85 % queda validado o ajustado con datos.

---

## 41. Medir latencia del reconocedor [V1] · ALTA

**Objetivo**

Que la respuesta parezca inmediata.

**Qué hacer**

Medir desde fin de escritura hasta resultado.

**Terminado cuando**

La latencia es suficientemente baja para la experiencia de aula.

---

# BLOQUE 4 — MOTOR MATEMÁTICO

## 42. Diseñar Exercise Engine [V1] · CRÍTICA

**Objetivo**

Separar la lógica educativa de la interfaz.

**Qué hacer**

Definir:

- ejercicios;
- generadores;
- soluciones;
- validadores;
- layout.

**Terminado cuando**

Un ejercicio puede ejecutarse sin depender de React.

---

## 43. Diseñar generadores [V1] · CRÍTICA

**Objetivo**

Crear ejercicios variables sin duplicar código.

**Qué hacer**

Cada tipo de ejercicio tendrá un generador independiente.

**Terminado cuando**

Se puede generar un conjunto de ejercicios parametrizado.

---

## 44. Diseñar renderizadores [V1] · ALTA

**Objetivo**

Separar contenido y presentación.

**Qué hacer**

Permitir diferentes presentaciones para:

- pizarra;
- PDF;
- futura pantalla de alumno.

**Terminado cuando**

El mismo ejercicio puede renderizarse de más de una manera.

---

## 45. Diseñar validadores [V1] · CRÍTICA

**Objetivo**

Determinar automáticamente si una respuesta es correcta.

**Qué hacer**

Crear validadores específicos.

**Terminado cuando**

Una respuesta estructurada puede compararse con la solución.

---

## 46. Implementar números [V1] · CRÍTICA

**Objetivo**

Crear actividades de lectura y escritura de números.

**Terminado cuando**

Se pueden generar y corregir ejercicios básicos.

---

## 47. Implementar unidades [V1] · CRÍTICA

**Objetivo**

Trabajar el valor posicional.

**Terminado cuando**

Se puede presentar una unidad como casilla de dígito.

---

## 48. Implementar decenas [V1] · CRÍTICA

**Objetivo**

Trabajar dos posiciones.

**Terminado cuando**

El sistema puede generar y corregir números de dos cifras.

---

## 49. Implementar centenas [V1] · ALTA

**Objetivo**

Preparar 2.º de Primaria y operaciones de tres cifras.

**Terminado cuando**

El layout admite centenas, decenas y unidades.

---

## 50. Implementar sumas [V1] · CRÍTICA

**Objetivo**

Construir el primer gran tipo de operación.

**Qué hacer**

Soportar:

- una cifra;
- dos cifras;
- sumas por columnas;
- resultados de una o varias cifras.

**Terminado cuando**

Las sumas pueden generarse, resolverse y corregirse.

---

## 51. Implementar restas [V1] · CRÍTICA

**Objetivo**

Segundo gran tipo de operación.

**Qué hacer**

Separar:

- sin llevadas;
- con llevadas.

**Terminado cuando**

Ambos modos se pueden controlar por configuración.

---

## 52. Implementar comparación de números [V1] · ALTA

**Objetivo**

Trabajar mayor, menor e igual.

**Terminado cuando**

Puede generarse y corregirse automáticamente.

---

## 53. Implementar series [V1] · ALTA

**Objetivo**

Trabajar patrones numéricos.

**Terminado cuando**

Las series tienen reglas reproducibles y corrección automática.

---

## 54. Implementar composición/descomposición [V1] · ALTA

**Objetivo**

Trabajar:

- centenas;
- decenas;
- unidades.

**Terminado cuando**

Un ejercicio puede representar y validar equivalencias.

---

## 55. Preparar problemas sencillos [V1.1] · MEDIA

**Objetivo**

Ampliar Matemáticas más allá del cálculo.

**Terminado cuando**

Existe una arquitectura preparada para problemas con respuesta estructurada.

---

## 56. Formalizar layout por valor posicional [V1] · CRÍTICA

**Objetivo**

Hacer que las operaciones utilicen correctamente las columnas.

**Qué hacer**

Definir:

- posición;
- tipo de dígito;
- alineación;
- columnas;
- operaciones.

**Terminado cuando**

El motor conoce siempre si una casilla es unidades, decenas o centenas.

---

# BLOQUE 5 — ACTIVIDADES Y CORRECCIÓN

## 57. Crear actividad desde parámetros [V1] · CRÍTICA

**Objetivo**

Que el profesor no tenga que construir ejercicio por ejercicio.

**Terminado cuando**

Puede seleccionar curso, tema y cantidad y generar una actividad.

---

## 58. Configurar dificultad [V1] · ALTA

**Objetivo**

Adaptar ejercicios al nivel.

**Qué hacer**

Definir parámetros de dificultad por generador.

**Terminado cuando**

"Fácil", "media" y "alta" producen diferencias reales.

---

## 59. Configurar número de ejercicios [V1] · CRÍTICA

**Objetivo**

Permitir actividades de distinta duración.

**Terminado cuando**

El profesor puede elegir una cantidad útil de ejercicios.

---

## 60. Autocorrección [V1] · CRÍTICA

**Objetivo**

Corregir ejercicios automáticamente.

**Qué hacer**

Conectar:

```text
respuesta reconocida
        ↓
validator
        ↓
correcto/incorrecto
```

**Terminado cuando**

Las operaciones autocorregibles no requieren intervención del profesor.

---

## 61. Mostrar u ocultar corrección inmediata [V1] · CRÍTICA

**Objetivo**

Dar control pedagógico al profesor.

**Configuración**

```text
Mostrar resultado durante la actividad:
Sí / No
```

**Terminado cuando**

El alumno ve o no ve el resultado según la configuración.

---

## 62. Mostrar u ocultar resultado final [V1] · CRÍTICA

**Objetivo**

Separar feedback durante la actividad del resultado final.

**Configuración**

```text
Mostrar resultado final:
Sí / No
```

**Terminado cuando**

El profesor controla independientemente el resultado final.

---

## 63. Permitir o no repetir [V1] · CRÍTICA

**Objetivo**

Decidir si los errores pueden trabajarse de nuevo.

**Configuración**

```text
Permitir repetir ejercicios fallados:
Sí / No
```

**Terminado cuando**

El flujo de repetición depende de esta opción.

---

## 64. Máximo de intentos [V1.1] · ALTA

**Objetivo**

Controlar cuántas veces puede intentarse un ejercicio.

**Opciones**

- 1;
- 2;
- 3;
- ilimitados.

**Terminado cuando**

El sistema aplica el límite configurado.

---

## 65. Repetir solamente los fallados [V1] · CRÍTICA

**Objetivo**

Evitar rehacer toda la actividad.

**Qué hacer**

Crear una segunda ronda únicamente con los ejercicios fallados.

**Terminado cuando**

El alumno puede repetir solo sus errores.

---

## 66. Mostrar u ocultar solución [V1.1] · MEDIA

**Objetivo**

Controlar la ayuda disponible.

**Configuración**

```text
Mostrar solución:
Nunca / final / después de intentos
```

**Terminado cuando**

La aplicación respeta la política configurada.

---

## 67. Crear sesión de clase [V1] · CRÍTICA

**Objetivo**

Separar una actividad de su ejecución real.

**Terminado cuando**

Cada uso de una actividad genera una sesión independiente.

---

## 68. Crear resumen inicial [V1] · CRÍTICA

**Objetivo**

Mostrar resultados de la primera ronda.

**Debe incluir**

- total;
- correctos;
- incorrectos;
- sin responder;
- tiempo.

**Terminado cuando**

El final de la primera ronda produce un resumen fiable.

---

## 69. Crear resumen después de repeticiones [V1] · CRÍTICA

**Objetivo**

Distinguir aprendizaje de rendimiento inicial.

**Debe incluir**

- correctos iniciales;
- errores;
- repetidos;
- resultado final.

**Terminado cuando**

El profesor puede distinguir "acierto a la primera" de "acierto después de corregirse".

---

# BLOQUE 6 — OFFLINE

## 70. Caché de la aplicación [V1] · CRÍTICA

**Objetivo**

Que la PWA pueda arrancar sin depender de Internet.

**Qué hacer**

Cachear:

- interfaz;
- recursos;
- modelos;
- componentes necesarios.

**Terminado cuando**

La aplicación ya instalada puede abrirse sin conexión.

---

## 71. Crear almacenamiento IndexedDB [V1] · CRÍTICA

**Objetivo**

Guardar localmente datos necesarios para el funcionamiento.

**Guardar**

- actividades descargadas;
- modelo;
- memoria adaptativa;
- sesión;
- configuración.

**Terminado cuando**

Los datos locales sobreviven a cerrar/reabrir la aplicación.

---

## 72. Actividades disponibles offline [V1] · CRÍTICA

**Objetivo**

Permitir preparar la clase antes de que falle Internet.

**Terminado cuando**

Una actividad descargada puede ejecutarse completamente sin conexión.

---

## 73. Reconocimiento offline [V1] · CRÍTICA

**Objetivo**

No depender de servidores para reconocer.

**Terminado cuando**

Una DigitCell reconoce 0–9 sin conexión.

---

## 74. Corrección offline [V1] · CRÍTICA

**Objetivo**

Calcular resultados localmente.

**Terminado cuando**

Sumas/restas y otros ejercicios funcionan sin Internet.

---

## 75. Aprendizaje offline [V1] · ALTA

**Objetivo**

Que las correcciones sigan alimentando el reconocedor.

**Terminado cuando**

Una corrección del profesor puede almacenarse y utilizarse sin conexión.

---

## 76. Sesión offline [V1] · CRÍTICA

**Objetivo**

Gestionar la actividad completa sin red.

**Terminado cuando**

Inicio → ejercicios → corrección → repetición funciona sin Internet.

---

## 77. Resumen offline [V1] · CRÍTICA

**Objetivo**

Mostrar el resultado final aunque no haya red.

**Terminado cuando**

El resumen se construye íntegramente en local.

---

## 78. Recuperación ante caída de Internet [V1] · ALTA

**Objetivo**

Que una pérdida de conexión no rompa una clase.

**Qué hacer**

Detectar:

- online;
- offline;
- reconexión.

**Terminado cuando**

Una caída de red durante la sesión no bloquea la actividad.

---

# BLOQUE 7 — PROFESOR Y ADMINISTRACIÓN

## 79. Login de profesores [V1] · CRÍTICA

**Objetivo**

Controlar el acceso.

**Qué hacer**

Crear:

- email;
- contraseña;
- sesión segura.

**Terminado cuando**

Un profesor puede iniciar y cerrar sesión.

---

## 80. Gestión de sesiones [V1] · CRÍTICA

**Objetivo**

Mantener autenticación segura.

**Qué hacer**

Usar cookies seguras y expiración de sesión.

**Terminado cuando**

El usuario permanece autenticado de forma controlada.

---

## 81. Dashboard del profesor [V1] · ALTA

**Objetivo**

Dar una entrada sencilla a la aplicación.

**Mostrar**

- actividades recientes;
- crear actividad;
- abrir pizarra;
- generar ficha;
- configuración.

**Terminado cuando**

El profesor puede llegar a las funciones principales desde una sola pantalla.

---

## 82. Gestión de actividades [V1] · CRÍTICA

**Objetivo**

Guardar y recuperar actividades creadas.

**Terminado cuando**

El profesor puede crear, abrir, duplicar y eliminar actividades.

---

## 83. Configuración pedagógica de actividad [V1] · CRÍTICA

**Objetivo**

Centralizar todas las decisiones de corrección.

**Configurar**

- feedback inmediato;
- resultado final;
- repetición;
- intentos;
- solución.

**Terminado cuando**

La actividad guarda sus reglas independientemente de cómo se ejecute.

---

## 84. Gestión de clases [V1.1] · ALTA

**Objetivo**

Preparar el futuro sistema de alumnos.

**Terminado cuando**

El profesor puede crear y gestionar:

- 1.ºA;
- 1.ºB;
- 2.ºA;
- etc.

---

## 85. Configuración del reconocimiento [V1.1] · ALTA

**Objetivo**

Permitir controlar el reconocedor sin tocar código.

**Opciones futuras**

- umbral;
- modo de aprendizaje;
- reset;
- estado del modelo.

**Terminado cuando**

Existe una zona administrativa para el reconocedor.

---

## 86. Gestión del aprendizaje del modelo [V1.1] · ALTA

**Objetivo**

Permitir controlar la memoria adaptativa.

**Debe mostrar**

- ejemplos;
- número de muestras por dígito;
- modelo actual;
- reset.

**Terminado cuando**

El profesor/admin puede administrar la memoria local.

---

# BLOQUE 8 — GENERADOR DE FICHAS

## 87. Crear generador de fichas [V1] · CRÍTICA

**Objetivo**

Convertir ejercicios en documentos imprimibles.

**Terminado cuando**

Una actividad puede generar una ficha.

---

## 88. Plantilla A4 [V1] · CRÍTICA

**Objetivo**

Conseguir un formato imprimible correcto.

**Incluir**

- márgenes;
- título;
- nombre;
- fecha;
- ejercicios.

**Terminado cuando**

La ficha imprime correctamente en A4.

---

## 89. Ficha para alumno [V1] · CRÍTICA

**Objetivo**

Generar versión sin soluciones.

**Terminado cuando**

El profesor puede descargar/imprimir la ficha del alumno.

---

## 90. Ficha de soluciones [V1] · CRÍTICA

**Objetivo**

Crear versión para el profesor.

**Terminado cuando**

Existe una versión con soluciones correctamente emparejadas.

---

## 91. Semilla reproducible [V1] · ALTA

**Objetivo**

Poder reproducir exactamente una ficha.

**Qué hacer**

Guardar una semilla de generación.

**Terminado cuando**

La misma configuración y semilla producen la misma ficha.

---

## 92. Generación PDF [V1] · CRÍTICA

**Objetivo**

Obtener un archivo listo para imprimir.

**Terminado cuando**

El PDF es correcto en Chrome/Edge y en impresión física.

---

# BLOQUE 9 — FUTURO SISTEMA DE ALUMNOS

## 93. Modelo de alumnos [V2] · CRÍTICA

**Objetivo**

Permitir cuentas de alumnos.

**Guardar inicialmente**

- identificador;
- nombre visible;
- clase;
- estado.

**Terminado cuando**

Los alumnos pueden representarse sin información personal innecesaria.

---

## 94. Gestión de clases [V2] · CRÍTICA

**Objetivo**

Relacionar alumnos y profesor.

**Terminado cuando**

Una clase tiene profesor y alumnos.

---

## 95. Crear tareas [V2] · CRÍTICA

**Objetivo**

Transformar una actividad en una tarea.

**Terminado cuando**

El profesor puede crear una tarea basada en una actividad.

---

## 96. Asignar tareas [V2] · CRÍTICA

**Objetivo**

Enviar la actividad a una clase o alumnos.

**Terminado cuando**

Una tarea puede estar asociada a destinatarios.

---

## 97. Registrar entregas [V2] · CRÍTICA

**Objetivo**

Saber si una tarea se ha completado.

**Terminado cuando**

Cada alumno tiene un estado de entrega.

---

## 98. Corrección automática de entregas [V2] · CRÍTICA

**Objetivo**

Reutilizar el validator existente.

**Terminado cuando**

Las actividades compatibles pueden autocorregirse sin trabajo del profesor.

---

## 99. Repeticiones en tareas [V2] · CRÍTICA

**Objetivo**

Aplicar al alumno las reglas definidas por el profesor.

**Terminado cuando**

El alumno puede repetir o no según la configuración.

---

## 100. Resultados del alumno [V2] · CRÍTICA

**Objetivo**

Mostrar al alumno lo que el profesor haya autorizado.

**Terminado cuando**

El sistema respeta independientemente:

- mostrar feedback;
- mostrar resultado final;
- permitir repetición;
- mostrar solución.

---

# BLOQUE 10 — PROGRESO Y ESCALABILIDAD

## 101. Estadísticas generales [V2] · ALTA

**Objetivo**

Obtener información del aprendizaje.

**Mostrar**

- resultados;
- evolución;
- cantidad de ejercicios;
- errores.

**Terminado cuando**

El profesor puede consultar datos agregados.

---

## 102. Progreso por alumno [V2] · ALTA

**Objetivo**

Ver evolución individual.

**Terminado cuando**

El profesor puede ver tendencias por alumno.

---

## 103. Progreso por clase [V2] · ALTA

**Objetivo**

Ver cómo funciona una clase completa.

**Terminado cuando**

Existen agregados por clase.

---

## 104. Progreso por tema [V2] · ALTA

**Objetivo**

Identificar contenidos difíciles.

**Terminado cuando**

Se pueden comparar temas como:

- sumas;
- restas;
- valor posicional.

---

## 105. Añadir nuevos cursos [FUTURO] · CRÍTICA

**Objetivo**

Extender el contenido curricular.

**Añadir**

- 3.º;
- 4.º;
- 5.º;
- 6.º.

**Terminado cuando**

El nuevo curso se puede añadir sin modificar el núcleo del sistema.

---

## 106. Añadir nuevas asignaturas [FUTURO] · CRÍTICA

**Objetivo**

Convertir la aplicación en plataforma escolar.

**Ejemplos**

- Lengua;
- Inglés;
- Ciencias.

**Terminado cuando**

Una asignatura nueva puede utilizar usuarios, actividades y tareas sin duplicar la plataforma.

---

## 107. Añadir nuevos tipos de ejercicio [FUTURO] · CRÍTICA

**Objetivo**

Hacer crecer el catálogo.

**Ejemplos**

- selección;
- ordenar;
- relacionar;
- geometría;
- fracciones;
- problemas.

**Terminado cuando**

Un nuevo tipo puede incorporarse mediante el patrón Generator/Renderer/Validator.

---

## 108. Ampliar reconocimiento de escritura [FUTURO] · ALTA

**Objetivo**

Extender el reconocimiento más allá de dígitos.

**Posibles etapas**

- números de más posiciones;
- decimales;
- símbolos;
- operadores;
- letras;
- escritura libre.

**Terminado cuando**

Cada ampliación tiene un módulo independiente y no rompe el reconocedor de dígitos.

---

# BLOQUE 11 — OPERACIÓN Y MANTENIMIENTO SIN PRESUPUESTO

## 109. Backups de base de datos [V1] · CRÍTICA

**Objetivo**

No perder la información del colegio.

**Qué hacer**

Definir:

- backups;
- frecuencia;
- retención;
- comprobación.

**Terminado cuando**

Existe una estrategia reproducible de backup.

---

## 110. Restauración [V1] · CRÍTICA

**Objetivo**

Poder recuperar el sistema.

**Qué hacer**

Probar restauración real.

**Terminado cuando**

Un backup puede restaurarse en un entorno controlado.

---

## 111. Exportación de datos [V1] · CRÍTICA

**Objetivo**

Mantener independencia tecnológica.

**Qué hacer**

Permitir exportar datos en formatos documentados.

**Terminado cuando**

Los datos esenciales pueden extraerse de la plataforma.

---

## 112. Logs técnicos [V1] · ALTA

**Objetivo**

Saber qué ha fallado sin registrar información innecesaria de menores.

**Registrar**

- errores;
- accesos técnicos;
- problemas de sistema.

**Terminado cuando**

Podemos diagnosticar fallos básicos.

---

## 113. Monitorización mínima [V1] · ALTA

**Objetivo**

Detectar caídas.

**Qué hacer**

Monitorizar:

- disponibilidad;
- errores;
- latencia.

**Terminado cuando**

Los problemas principales son detectables.

---

## 114. Sistema de actualizaciones [V1] · CRÍTICA

**Objetivo**

Actualizar la aplicación sin ir ordenador por ordenador.

**Qué hacer**

Configurar despliegue automático.

**Terminado cuando**

Un cambio publicado llega a las PWA instaladas.

---

## 115. CI/CD [V1] · CRÍTICA

**Objetivo**

Reducir errores al publicar.

**Pipeline**

```text
Git push
   ↓
Tests
   ↓
Build
   ↓
Deploy
```

**Terminado cuando**

Un commit aprobado puede desplegar automáticamente.

---

## 116. Entorno staging [V1] · ALTA

**Objetivo**

Probar antes de producción.

**Terminado cuando**

Existe:

- desarrollo;
- staging;
- producción.

---

## 117. Entorno producción [V1] · CRÍTICA

**Objetivo**

Tener una instalación estable para el colegio.

**Terminado cuando**

La producción está separada de desarrollo y staging.

---

## 118. Documentación técnica [V1] · CRÍTICA

**Objetivo**

Que otra persona pueda mantener el sistema en el futuro.

**Documentar**

- arquitectura;
- base de datos;
- API;
- despliegue;
- reconocimiento;
- backups.

**Terminado cuando**

Otra persona puede levantar el proyecto siguiendo la documentación.

---

## 119. Manual del profesor [V1] · CRÍTICA

**Objetivo**

Reducir el mantenimiento.

**Documentar**

- iniciar sesión;
- abrir pizarra;
- crear actividad;
- configurar corrección;
- activar repetición;
- interpretar resumen;
- generar ficha;
- solucionar problemas básicos.

**Terminado cuando**

Un profesor puede aprender a utilizar la aplicación sin ayuda de un desarrollador.

---

## 120. Manual de administración [V1] · CRÍTICA

**Objetivo**

Que el colegio pueda resolver operaciones comunes sin depender del desarrollador.

**Documentar**

- crear profesor;
- bloquear usuario;
- resetear contraseña;
- gestionar clases;
- revisar sistema;
- backups;
- restauración;
- incidencias.

**Terminado cuando**

Las tareas administrativas habituales pueden hacerse siguiendo el manual.

---

# CRITERIOS DE ÉXITO DEL MVP

La V1 no estará terminada simplemente porque "la web funcione".

Debe superar estos escenarios reales.

## Escenario 1 — Clase normal

1. Profesor inicia sesión.
2. Selecciona 2.º Primaria.
3. Selecciona sumas.
4. Genera 10–20 ejercicios.
5. Abre la pizarra.
6. El alumno escribe en las casillas.
7. Se reconocen los dígitos.
8. Se autocorrigen.
9. El profesor controla qué feedback aparece.
10. Los errores pueden repetirse si está activado.
11. Aparece el resumen final.

---

## Escenario 2 — Reconocimiento dudoso

1. Alumno escribe un dígito.
2. El modelo obtiene menos de 85 %.
3. La aplicación pregunta al profesor.
4. El profesor indica el número.
5. La actividad continúa.
6. El ejemplo se incorpora a la memoria adaptativa.

---

## Escenario 3 — Internet caído

1. La actividad estaba preparada.
2. Internet desaparece.
3. La pizarra sigue funcionando.
4. El reconocimiento sigue funcionando.
5. La corrección sigue funcionando.
6. La memoria adaptativa sigue funcionando.
7. La actividad termina.
8. El resumen se muestra.

---

## Escenario 4 — Repetición

Configuración:

```text
Mostrar corrección inmediata: SÍ
Mostrar resultado final: SÍ
Permitir repetir fallados: SÍ
```

Resultado:

```text
Primera ronda:
17/20

Repetición:
3 ejercicios

Resultado final:
20/20
```

---

## Escenario 5 — Profesor no quiere revelar resultados

Configuración:

```text
Mostrar corrección inmediata: NO
Mostrar resultado final: NO
Permitir repetir fallados: NO
```

El alumno puede completar la actividad, pero no recibe información de acierto/error.

El profesor sí puede disponer del resumen.

---

# ORDEN RECOMENDADO DE CONSTRUCCIÓN

Aunque el roadmap contiene 120 pasos, no se recomienda implementarlos estrictamente como una lista lineal.

La ruta crítica real es:

```text
1–9
Fundamentos
   ↓
10–20
Hardware + Pizarra
   ↓
21–41
Reconocimiento
   ↓
42–56
Motor matemático
   ↓
57–69
Actividades + corrección
   ↓
70–78
Offline
   ↓
79–86
Profesor
   ↓
87–92
Fichas
   ↓
93–108
Futuro: alumnos + expansión
   ↓
109–120
Operación y mantenimiento
```

---

# MVP RECOMENDADO

El MVP debe terminar en este punto:

```text
PROFESOR
   │
   ▼
LOGIN
   │
   ▼
ACTIVIDAD
   │
   ▼
PIZARRA
   │
   ▼
DIGIT CELL
   │
   ▼
RECONOCIMIENTO 0–9
   │
   ├── >=85% ─────────► ACEPTAR
   │
   └── <85% ──────────► PREGUNTAR PROFESOR
                              │
                              ▼
                         APRENDIZAJE
                              │
                              ▼
                         VALIDACIÓN
                              │
                              ▼
                           SESIÓN
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                CONTINUAR            REPETIR
                                      si está
                                     permitido
                    │                   │
                    └─────────┬─────────┘
                              ▼
                           RESUMEN
```

Además:

```text
ACTIVIDAD
   │
   └──────► GENERADOR DE FICHA PDF
```

---

# PRINCIPIOS DE DISEÑO QUE NO DEBEN ROMPERSE

## 1. Una casilla = un dígito

La primera versión del reconocimiento no debe convertirse en OCR general.

## 2. Recognition Engine no conoce Matemáticas

Reconoce dígitos; no decide si una operación es correcta.

## 3. Exercise Engine no conoce el modelo de IA

El ejercicio recibe respuestas estructuradas.

## 4. La pizarra no depende de Internet

La clase debe poder continuar aunque la conexión falle.

## 5. El aprendizaje inmediato es local

La corrección del profesor alimenta la memoria del dispositivo.

## 6. El reentrenamiento del modelo es un proceso controlado

No se ejecuta automáticamente durante una clase.

## 7. La corrección es configurable por actividad

El profesor controla:

- feedback inmediato;
- resultado final;
- repetición;
- intentos;
- soluciones.

## 8. El mismo ejercicio sirve para varios formatos

Un ejercicio debe poder terminar en:

- pizarra;
- ficha PDF;
- futura plataforma del alumno.

## 9. Los datos de menores deben minimizarse

No almacenamos información que no sea necesaria.

## 10. Todo lo importante debe estar documentado

El objetivo es que el colegio no dependa indefinidamente del desarrollador.

---

# DEFINICIÓN FINAL DEL PRODUCTO V1

La V1 correcta es:

> Una aplicación web/PWA de Matemáticas para 1.º y 2.º de Primaria que permite al profesor crear y ejecutar actividades en una pizarra digital táctil, donde los alumnos escriben directamente en casillas separadas para unidades, decenas y centenas. Cada casilla reconoce localmente un dígito del 0 al 9. Si la confianza del reconocimiento es igual o superior al 85 %, se acepta automáticamente; si no, se pregunta al profesor y la corrección alimenta una memoria adaptativa local. Los ejercicios se autocorrigen y el profesor controla por actividad si se muestra el resultado durante la actividad, si se muestra el resultado final y si se permite repetir los ejercicios fallados. La actividad puede ejecutarse offline y terminar con un resumen de resultados. El mismo motor genera posteriormente fichas PDF y queda preparado para incorporar alumnos, tareas, corrección y nuevas asignaturas.

---

# Nuevos puntos del Roadmap — Multi-colegio, organización escolar y asignaciones

Este documento contiene **los puntos adicionales** que deben añadirse al roadmap maestro de 120 pasos.

La numeración comienza en el **121** para que puedas unir este archivo con el roadmap anterior directamente.

---

# BLOQUE 12 — MULTI-COLEGIO Y ORGANIZACIÓN ESCOLAR

## 121. Modelo `School / Organization` [FUTURO] · CRÍTICA

**Objetivo**

Convertir el colegio piloto en un colegio real dentro de una plataforma preparada para múltiples centros.

**Qué hacer**

Crear una entidad principal `School` o `Organization` que represente a cada colegio.

Cada colegio tendrá sus propios:

- profesores;
- clases;
- alumnos;
- actividades;
- configuraciones;
- datos educativos.

**Terminado cuando**

Un colegio puede existir de forma independiente dentro de la plataforma y sus datos están asociados a un identificador único.

---

## 122. Aislamiento multi-colegio [FUTURO] · CRÍTICA

**Objetivo**

Garantizar que los datos de un colegio nunca se mezclen con los de otro.

**Qué hacer**

Diseñar el acceso a datos con aislamiento por `school_id` / `organization_id`.

Toda petición del backend deberá determinar:

```text
Usuario
   ↓
Colegio
   ↓
Permiso
   ↓
Recurso
```

**Terminado cuando**

Un usuario del Colegio A no puede consultar, modificar ni descubrir datos del Colegio B.

---

## 123. Administrador de plataforma [FUTURO] · ALTA

**Objetivo**

Gestionar la plataforma completa.

**Qué hacer**

Crear el rol:

```text
PLATFORM_ADMIN
```

para tareas como:

- alta de colegios;
- estado de cuentas;
- incidencias;
- configuración global;
- mantenimiento.

**Terminado cuando**

Existe un rol independiente de los administradores de cada colegio.

---

## 124. Administrador de colegio [FUTURO] · CRÍTICA

**Objetivo**

Dar al propio colegio capacidad de administración.

**Qué hacer**

Crear el rol:

```text
SCHOOL_ADMIN
```

con permisos sobre:

- profesores;
- clases;
- alumnos;
- configuración del colegio.

**Terminado cuando**

El administrador de un colegio puede gestionar su centro sin acceder a otros colegios.

---

## 125. Registro de nuevos colegios [FUTURO] · ALTA

**Objetivo**

Permitir que otros colegios puedan incorporarse a la plataforma.

**Qué hacer**

Crear un flujo de onboarding:

```text
Registrar colegio
       ↓
Crear organización
       ↓
Crear administrador
       ↓
Configurar centro
```

Inicialmente puede requerir aprobación manual.

**Terminado cuando**

Un segundo colegio puede darse de alta sin modificar código ni crear una instalación separada.

---

## 126. Invitación de profesores [FUTURO] · CRÍTICA

**Objetivo**

Permitir que el administrador incorpore profesores.

**Qué hacer**

Crear un sistema de invitación mediante enlace/token o email, según la infraestructura disponible.

**Terminado cuando**

El administrador puede invitar a un profesor y este puede completar su cuenta.

---

## 127. Gestión de profesores [FUTURO] · CRÍTICA

**Objetivo**

Administrar profesores del centro.

**Qué hacer**

Permitir:

- alta;
- baja;
- desactivación;
- cambio de datos básicos;
- reset de contraseña;
- revisión de clases asignadas.

**Terminado cuando**

El administrador puede mantener actualizado el claustro del centro.

---

## 128. Cursos académicos [V1.1/FUTURO] · CRÍTICA

**Objetivo**

No mezclar clases de diferentes años escolares.

**Qué hacer**

Crear:

```text
AcademicYear
```

Ejemplo:

```text
2026/27
2027/28
```

**Terminado cuando**

Las clases y matrículas pueden asociarse a un curso académico concreto.

---

## 129. Gestión de clases [V1.1] · CRÍTICA

**Objetivo**

Representar la estructura real del colegio.

**Qué hacer**

Crear clases como:

```text
1ºA
1ºB
2ºA
2ºB
```

asociadas a un curso académico.

**Terminado cuando**

El colegio puede crear, editar, archivar y consultar sus clases.

---

## 130. Asignación profesor-clase [V1.1/FUTURO] · CRÍTICA

**Objetivo**

Vincular profesores con clases de forma flexible.

**Importante**

No utilizar simplemente:

```text
class.teacher_id
```

porque un profesor puede tener varias clases y una clase puede tener varios profesores.

Crear una relación intermedia, por ejemplo:

```text
TeacherClass
```

**Terminado cuando**

Un profesor puede pertenecer a varias clases y una clase puede tener varios profesores.

---

## 131. Asignación profesor-asignatura [FUTURO] · CRÍTICA

**Objetivo**

Preparar la expansión a más asignaturas.

**Ejemplo**

```text
2ºA
 ├── Matemáticas → Ana
 ├── Lengua → Marta
 └── Inglés → Carlos
```

**Qué hacer**

Crear una relación del tipo:

```text
TeachingAssignment
```

que vincule:

- profesor;
- clase;
- asignatura;
- curso académico.

**Terminado cuando**

La aplicación puede determinar qué profesor imparte qué asignatura a qué clase.

---

## 132. Modelo de matrícula alumno-clase [FUTURO] · CRÍTICA

**Objetivo**

Asignar alumnos a clases conservando flexibilidad.

**Qué hacer**

Utilizar una entidad de matrícula/asignación:

```text
Enrollment
```

en lugar de depender únicamente de un `class_id` permanente dentro de `students`.

**Terminado cuando**

Un alumno puede estar asociado a una clase en un curso académico concreto.

---

## 133. Historial académico de clase [FUTURO] · ALTA

**Objetivo**

Conservar el histórico cuando el alumno cambia de curso.

**Ejemplo**

```text
2026/27 → 1ºA
2027/28 → 2ºA
```

**Terminado cuando**

El cambio de curso no destruye ni mezcla el histórico anterior.

---

## 134. Alta y baja de alumnos [FUTURO] · CRÍTICA

**Objetivo**

Gestionar el alumnado del centro.

**Qué hacer**

Permitir:

- alta;
- baja lógica;
- desactivación;
- reasignación;
- importación futura.

**Terminado cuando**

El administrador puede mantener el listado del alumnado sin borrar innecesariamente el histórico.

---

## 135. Cambio de alumno de clase [FUTURO] · ALTA

**Objetivo**

Resolver cambios reales de grupo.

**Ejemplo**

```text
Alumno 001
1ºA → 1ºB
```

**Terminado cuando**

El cambio afecta a la organización futura sin destruir el histórico anterior.

---

## 136. Permisos por colegio [FUTURO] · CRÍTICA

**Objetivo**

Limitar el acceso a recursos según organización.

**Qué hacer**

Cada petición sensible debe verificar la organización del usuario.

**Terminado cuando**

Un profesor solo puede acceder a recursos pertenecientes a su colegio.

---

## 137. Permisos por clase [FUTURO] · CRÍTICA

**Objetivo**

Limitar lo que puede ver un profesor dentro de su colegio.

**Ejemplo**

Un profesor asignado a:

```text
1ºA
1ºB
```

no debe poder consultar automáticamente:

```text
2ºB
```

**Terminado cuando**

Los permisos se comprueban también a nivel de clase.

---

## 138. Aislamiento de API [FUTURO] · CRÍTICA

**Objetivo**

Impedir que una manipulación del frontend permita acceder a otros colegios.

**Qué hacer**

El backend deberá validar siempre:

```text
session
→ school
→ role
→ class/resource ownership
```

No se confiará en `school_id` enviado por el navegador.

**Terminado cuando**

Cambiar manualmente IDs en las peticiones no permite acceder a datos ajenos.

---

## 139. Pruebas de seguridad multi-tenant [FUTURO] · CRÍTICA

**Objetivo**

Comprobar que el aislamiento funciona realmente.

**Qué hacer**

Crear tests que intenten:

- consultar otro colegio;
- editar otra clase;
- obtener alumnos ajenos;
- descargar actividades ajenas;
- cambiar identificadores.

**Terminado cuando**

Todos los escenarios de acceso cruzado son rechazados correctamente.

---

## 140. Exportación de datos por colegio [FUTURO] · CRÍTICA

**Objetivo**

Permitir al colegio recuperar sus datos.

**Qué hacer**

Crear exportación de:

- profesores;
- alumnos;
- clases;
- actividades;
- resultados permitidos;
- configuración.

**Terminado cuando**

El administrador puede obtener una copia completa y documentada de los datos que pertenecen a su colegio.

---

## 141. Eliminación completa de colegio [FUTURO] · ALTA

**Objetivo**

Poder cerrar un colegio correctamente.

**Qué hacer**

Definir un proceso que contemple:

- desactivación;
- conservación temporal si corresponde;
- eliminación;
- backups;
- confirmaciones.

**Terminado cuando**

Existe un procedimiento seguro y documentado para eliminar una organización.

---

## 142. Retención de datos por colegio [FUTURO] · CRÍTICA

**Objetivo**

Controlar cuánto tiempo se conservan los datos.

**Qué hacer**

Definir políticas para:

- alumnos;
- profesores;
- actividades;
- sesiones;
- entregas;
- resultados.

**Terminado cuando**

La conservación y eliminación están definidas y pueden aplicarse técnicamente.

---

## 143. Configuración propia del colegio [FUTURO] · ALTA

**Objetivo**

Permitir que cada colegio tenga su propia configuración.

**Posibles opciones**

- nombre;
- logo;
- nombre de cursos;
- configuración de clases;
- preferencias educativas;
- parámetros generales.

**Terminado cuando**

El colegio puede personalizar la configuración sin afectar a otros centros.

---

## 144. Branding/configuración visual futura [FUTURO] · MEDIA

**Objetivo**

Permitir personalización visual sin duplicar aplicaciones.

**Posibles opciones**

- logo;
- nombre;
- colores;
- icono.

**Terminado cuando**

El aspecto básico puede variar por colegio mediante configuración.

---

## 145. Preparación para onboarding [FUTURO] · ALTA

**Objetivo**

Hacer que incorporar un colegio sea sencillo.

**Flujo objetivo**

```text
Nuevo colegio
   ↓
Administrador
   ↓
Configuración inicial
   ↓
Profesores
   ↓
Clases
   ↓
Alumnos
   ↓
Primera actividad
```

**Terminado cuando**

Un colegio nuevo puede empezar a utilizar la plataforma sin intervención del desarrollador.

---

# BLOQUE 13 — ASIGNACIONES, TAREAS E HISTÓRICO

## 146. Asignación de actividades a clases [V2] · CRÍTICA

**Objetivo**

Permitir al profesor asignar una actividad a toda una clase.

**Ejemplo**

```text
Actividad: Sumas llevando
Clase: 2ºA
```

**Terminado cuando**

Todos los alumnos autorizados de la clase pueden recibir la actividad.

---

## 147. Asignación de actividades a alumnos [V2] · CRÍTICA

**Objetivo**

Permitir refuerzo individual.

**Ejemplo**

```text
Actividad: Restas
Asignada a:
- Alumno 03
- Alumno 11
- Alumno 18
```

**Terminado cuando**

Una actividad puede enviarse a alumnos concretos sin crear una actividad duplicada.

---

## 148. Excepciones de configuración por alumno [V2] · ALTA

**Objetivo**

Permitir adaptar una tarea a un alumno concreto.

**Ejemplos**

```text
Clase:
Permitir repetir = NO

Alumno 12:
Permitir repetir = SÍ
```

o:

```text
Clase:
Máximo 2 intentos

Alumno 07:
Máximo 3 intentos
```

**Terminado cuando**

Una asignación individual puede sobrescribir de forma controlada las reglas generales.

---

## 149. Histórico de actividades [V2] · ALTA

**Objetivo**

Conservar qué actividades se realizaron.

**Qué guardar**

- actividad;
- clase/alumno;
- fecha;
- configuración aplicada;
- estado.

**Terminado cuando**

El profesor puede consultar qué actividades se han realizado sin depender de la sesión activa.

---

## 150. Histórico de resultados [V2] · ALTA

**Objetivo**

Permitir seguimiento futuro.

**Qué guardar**

Dependiendo de la política de privacidad:

- resultado;
- tiempo;
- intentos;
- progreso;
- actividad;
- alumno.

No es necesario almacenar más información de la necesaria.

**Terminado cuando**

El sistema puede construir estadísticas y progreso a partir de datos históricos autorizados.

---

# ESTRUCTURA ESCOLAR DEFINITIVA

La estructura recomendada para la plataforma será:

```text
PLATAFORMA
│
├── COLEGIO A
│   │
│   ├── Curso académico 2026/27
│   │   │
│   │   ├── 1ºA
│   │   │   ├── Profesores
│   │   │   └── Alumnos
│   │   │
│   │   ├── 1ºB
│   │   └── 2ºA
│   │
│   └── Curso académico 2027/28
│
├── COLEGIO B
│
└── COLEGIO C
```

Dentro de una clase:

```text
2ºA
│
├── Profesores
│   ├── Ana
│   └── Luis
│
├── Alumnos
│   ├── Alumno 01
│   ├── Alumno 02
│   └── Alumno 03
│
└── Asignaturas
    ├── Matemáticas
    │     └── Ana
    │
    ├── Lengua
    │     └── Luis
    │
    └── Inglés
          └── Marta
```

---

# MODELO DE RELACIONES

La relación importante no será:

```text
Clase → un profesor
```

sino:

```text
Profesor
   │
   └── TeacherClass
          │
          ▼
        Clase
```

Y:

```text
Alumno
   │
   └── Enrollment
          │
          ▼
        Clase
```

Y para las asignaturas:

```text
Profesor
   │
   └── TeachingAssignment
          │
          ├── Clase
          └── Asignatura
```

Y para tareas:

```text
Actividad
   │
   ▼
Asignación
   │
   ├── Clase
   └── Alumno(s)
```

---

# REGLA DE SEGURIDAD MULTI-COLEGIO

Toda operación protegida deberá seguir conceptualmente:

```text
Usuario
   ↓
¿Está autenticado?
   ↓
¿A qué colegio pertenece?
   ↓
¿Qué rol tiene?
   ↓
¿Tiene permiso para esta clase?
   ↓
¿Tiene permiso para este recurso?
   ↓
PERMITIR / DENEGAR
```

Nunca:

```text
Frontend
   ↓
"Soy del colegio 123"
   ↓
Backend confía
```

El colegio siempre se determina desde la sesión y las relaciones de servidor.

---

# OBJETIVO DEL MODELO

Con este diseño, el colegio piloto será simplemente:

```text
School #1
```

y un segundo colegio podrá incorporarse como:

```text
School #2
```

sin desplegar otra aplicación.

Todos utilizarán:

```text
la misma aplicación
+
el mismo motor de ejercicios
+
el mismo reconocimiento
+
la misma infraestructura
```

pero con datos y permisos completamente aislados.

---

# ORDEN RECOMENDADO DE ESTAS NUEVAS FUNCIONALIDADES

```text
121–124
Arquitectura multi-colegio y roles
        ↓
125–127
Alta y gestión de colegios/profesores
        ↓
128–131
Curso académico + clases + profesores + asignaturas
        ↓
132–135
Alumnos + matrículas + cambios de clase
        ↓
136–139
Seguridad y aislamiento multi-tenant
        ↓
140–145
Gobierno del dato + onboarding
        ↓
146–150
Asignaciones + alumnos + histórico
```

La idea es que **el Colegio 1 sea nuestro primer tenant real**, no una excepción codificada especialmente para el proyecto.

---

# BLOQUE 14 — CALIDAD DE CÓDIGO, TESTS, RGF Y DEUDA TÉCNICA

Este bloque se aplica **desde el primer día** y atraviesa todo el proyecto. No se considera una tarea final de “limpieza”. Cada funcionalidad importante deberá pasar por un ciclo de desarrollo y por un quality gate antes de darse por terminada.

La regla general será:

```text
IDEA / REQUISITO
      ↓
CASOS DE ACEPTACIÓN
      ↓
RED
(test que falla)
      ↓
GREEN
(implementación mínima)
      ↓
REFACTOR
(mejora estructural sin cambiar comportamiento)
      ↓
TESTS + TYPECHECK + LINT + BUILD
      ↓
QUALITY GATE
      ↓
FUNCIONALIDAD CERRADA
```

> En este roadmap, “RGF” significa **Red → Green → Refactor**. Se utilizará de forma práctica y selectiva, no como una obligación dogmática de escribir tests antes de cada línea de código.

## 151. Definir política de calidad de código [V1] · CRÍTICA

**Objetivo**

Establecer qué entendemos por “código aceptable”.

**Qué hacer**

Documentar reglas sobre:

- TypeScript estricto;
- nombres claros;
- funciones pequeñas cuando sea razonable;
- separación de responsabilidades;
- evitar duplicación;
- evitar `any` injustificados;
- manejo explícito de errores;
- comentarios solo cuando aporten contexto;
- dependencias mínimas;
- módulos con responsabilidad clara.

**Terminado cuando**

Existe una guía de calidad en el repositorio y forma parte de la revisión de cambios.

---

## 152. Activar TypeScript strict [V1] · CRÍTICA

**Objetivo**

Detectar errores durante desarrollo en lugar de encontrarlos en producción.

**Qué hacer**

Activar las opciones strict apropiadas de TypeScript y corregir los errores resultantes.

**Terminado cuando**

El proyecto compila con el modo estricto establecido y no se introducen atajos silenciosos para ocultar errores.

---

## 153. Configurar ESLint [V1] · CRÍTICA

**Objetivo**

Automatizar reglas de calidad y consistencia.

**Qué hacer**

Configurar reglas para:

- errores potenciales;
- imports;
- hooks de React;
- promesas;
- variables no usadas;
- complejidad excesiva cuando sea útil;
- patrones inseguros.

**Terminado cuando**

`lint` forma parte del pipeline y no hay errores bloqueantes.

---

## 154. Formateo automático [V1] · ALTA

**Objetivo**

Evitar discusiones y ruido en los diffs.

**Qué hacer**

Configurar Prettier o equivalente y ejecución automática en editor/CI.

**Terminado cuando**

El repositorio mantiene un formato uniforme sin depender de revisión manual.

---

## 155. Hooks de calidad locales [V1] · ALTA

**Objetivo**

Detectar problemas antes del commit.

**Qué hacer**

Configurar, cuando aporte valor:

- lint de archivos modificados;
- typecheck;
- tests afectados;
- validaciones de seguridad básicas.

**Terminado cuando**

Los errores obvios se detectan antes de llegar al repositorio remoto.

---

## 156. Primera estrategia de testing [V1] · CRÍTICA

**Objetivo**

Definir qué se prueba y en qué nivel.

**Qué hacer**

Usar tres capas principales:

```text
UNIT
  ↓
lógica pura / funciones / validators / generators

INTEGRATION
  ↓
módulos + persistencia + API + servicios

E2E
  ↓
flujos completos del usuario
```

**Terminado cuando**

Cada tipo de problema tiene un nivel de test recomendado.

---

## 157. Configurar Vitest [V1] · CRÍTICA

**Objetivo**

Tener tests rápidos para la lógica.

**Qué hacer**

Configurar ejecución, cobertura y utilidades de test.

**Terminado cuando**

Un test de ejemplo puede ejecutarse localmente y en CI.

---

## 158. Configurar Playwright [V1] · CRÍTICA

**Objetivo**

Probar los flujos críticos como lo haría un usuario.

**Qué hacer**

Preparar pruebas E2E para navegador.

**Terminado cuando**

Existe al menos un flujo completo automatizado de extremo a extremo.

---

## 159. Definir pirámide de tests [V1] · ALTA

**Objetivo**

Evitar una suite E2E lenta y frágil.

**Regla**

Tener muchos tests unitarios, una cantidad razonable de integración y pocos E2E, pero muy importantes.

**Terminado cuando**

La estrategia está documentada y cada nuevo módulo sigue el patrón.

---

## 160. Testear primero la lógica matemática [V1] · CRÍTICA

**Objetivo**

Proteger el núcleo pedagógico antes de construir la interfaz encima.

**Qué hacer**

Crear tests para:

- sumas;
- restas;
- comparación;
- series;
- composición/descomposición;
- cálculo por columnas;
- validación de respuestas.

**Terminado cuando**

Un cambio en la UI no puede alterar silenciosamente la lógica matemática sin que un test falle.

---

## 161. Testear generadores de ejercicios [V1] · CRÍTICA

**Objetivo**

Garantizar que los ejercicios generados cumplen las restricciones educativas.

**Qué hacer**

Probar propiedades como:

- rango permitido;
- dificultad;
- número de ejercicios;
- ausencia de casos inválidos;
- solución correcta;
- reproducibilidad mediante semilla.

**Terminado cuando**

Los generadores tienen casos normales, extremos y casos inválidos controlados.

---

## 162. Testear validators [V1] · CRÍTICA

**Objetivo**

Asegurar que una respuesta solo se marca correcta cuando corresponde.

**Terminado cuando**

Cada validator tiene casos positivos, negativos y límites.

---

## 163. Testear `DigitCell` [V1] · CRÍTICA

**Objetivo**

Proteger la unidad más importante del reconocimiento.

**Qué hacer**

Probar estados como:

- vacío;
- escribiendo;
- procesando;
- reconocido;
- baja confianza;
- corregido por profesor;
- error del modelo;
- limpieza;
- repetición.

**Terminado cuando**

Los cambios de estado importantes están cubiertos.

---

## 164. Testear preprocesamiento de escritura [V1] · CRÍTICA

**Objetivo**

Evitar que cambios de normalización rompan el modelo.

**Qué hacer**

Usar fixtures representativos de diferentes tamaños y posiciones.

**Terminado cuando**

El mismo conjunto de muestras produce resultados reproducibles.

---

## 165. Testear confianza y umbral 85 % [V1] · CRÍTICA

**Objetivo**

Garantizar que la regla de negocio es estable.

**Casos mínimos**

- 84.99 % → preguntar;
- 85.00 % → aceptar;
- 85.01 % → aceptar;
- errores de ausencia de confianza;
- valores imposibles o inválidos.

**Terminado cuando**

La frontera del 85 % está cubierta por tests automatizados.

---

## 166. Testear aprendizaje adaptativo [V1.1] · ALTA

**Objetivo**

Garantizar que una corrección queda asociada a la muestra correcta y no contamina otras clases.

**Terminado cuando**

Existen tests para añadir, consultar, priorizar, limitar y resetear ejemplos adaptativos.

---

## 167. Regression tests del reconocedor [V1] · CRÍTICA

**Objetivo**

Detectar si una nueva versión empeora casos antiguos.

**Qué hacer**

Mantener un conjunto fijo de muestras etiquetadas y comparar versiones.

**Terminado cuando**

Cada cambio del pipeline de reconocimiento puede compararse con una baseline.

---

## 168. Tests de modelo por dígito [V1.1] · ALTA

**Objetivo**

Detectar si un dígito concreto empeora aunque la métrica global parezca estable.

**Qué hacer**

Medir resultados por clase 0–9 y revisar especialmente las confusiones conocidas.

**Terminado cuando**

Una regresión en un solo dígito no queda escondida por un promedio global.

---

## 169. Testear persistencia IndexedDB [V1] · CRÍTICA

**Objetivo**

Garantizar que el modo offline es realmente fiable.

**Terminado cuando**

Los tests cubren lectura, escritura, actualización, corrupción esperable y migraciones de esquema.

---

## 170. Testear sesión offline [V1] · CRÍTICA

**Objetivo**

Comprobar de extremo a extremo el funcionamiento sin Internet.

**Terminado cuando**

Una prueba automatizada reproduce una sesión offline completa con reconocimiento y resumen.

---

## 171. Testear recuperación ante reconexión [V1] · ALTA

**Objetivo**

Evitar duplicados, estados corruptos o pérdida de trabajo al volver la red.

**Terminado cuando**

Se valida la transición offline → online y los casos de reconexión repetida.

---

## 172. Tests del PDF [V1] · ALTA

**Objetivo**

Evitar que un cambio de plantilla rompa la salida imprimible.

**Qué hacer**

Probar:

- contenido;
- número de ejercicios;
- soluciones;
- semilla;
- datos básicos;
- generación repetida.

**Terminado cuando**

La generación falla automáticamente si se pierde una condición esencial.

---

## 173. Smoke tests del entorno [V1] · CRÍTICA

**Objetivo**

Comprobar que producción está viva después de un despliegue.

**Qué hacer**

Automatizar comprobaciones básicas de:

- aplicación;
- login;
- API crítica;
- base de datos;
- recursos estáticos.

**Terminado cuando**

Cada despliegue puede validarse rápidamente.

---

## 174. Quality Gate de cada feature [V1] · CRÍTICA

**Objetivo**

Que ninguna funcionalidad se cierre sin una revisión mínima.

**Requisitos**

Antes de marcar una feature como terminada:

- tests relevantes creados o actualizados;
- lint correcto;
- typecheck correcto;
- build correcto;
- revisión manual si afecta a UX;
- deuda técnica identificada;
- documentación actualizada cuando corresponda.

**Terminado cuando**

El criterio aparece en el Definition of Done del proyecto.

---

## 175. Red-Green-Refactor por funcionalidad crítica [V1] · CRÍTICA

**Objetivo**

Integrar RGF en el proceso real de desarrollo.

**Aplicación**

Para lógica crítica:

```text
RED
test que demuestra el requisito
        ↓
GREEN
mínima implementación que lo satisface
        ↓
REFACTOR
mejora de diseño manteniendo los tests verdes
```

**Terminado cuando**

Las primeras funcionalidades críticas se han construido siguiendo explícitamente este ciclo.

---

## 176. No hacer refactorización ciega [V1] · ALTA

**Objetivo**

Evitar reescrituras que aumenten riesgo sin aportar valor.

**Regla**

No refactorizar “porque sí”. Refactorizar cuando:

- existe duplicación clara;
- una responsabilidad está mal colocada;
- la complejidad dificulta cambios;
- los tests no son razonables por el diseño;
- una nueva feature demuestra que la abstracción era incorrecta.

**Terminado cuando**

Los refactors tienen un motivo técnico identificable.

---

## 177. Definir Definition of Done [V1] · CRÍTICA

**Objetivo**

Eliminar la ambigüedad de “ya está terminado”.

**Debe exigir**

- comportamiento implementado;
- tests apropiados;
- calidad estática;
- seguridad relevante;
- documentación necesaria;
- observabilidad necesaria;
- no dejar deuda crítica sin registrar.

**Terminado cuando**

Todo trabajo del roadmap utiliza el mismo criterio de cierre.

---

## 178. Crear registro de deuda técnica [V1] · CRÍTICA

**Objetivo**

Hacer visible la deuda en lugar de esconderla.

**Campos recomendados**

```text
ID
Descripción
Motivo
Impacto
Riesgo
Zona afectada
Prioridad
Cuándo resolverla
Estado
```

**Terminado cuando**

Existe un `TECH_DEBT.md` o issue tracker equivalente.

---

## 179. Clasificar deuda técnica [V1] · ALTA

**Objetivo**

Priorizar racionalmente.

**Clases**

- bloqueante;
- crítica;
- importante;
- cosmética.

**Regla**

Una deuda que comprometa seguridad, corrección de datos, aislamiento multi-tenant o mantenimiento futuro no puede quedarse como deuda cosmética.

**Terminado cuando**

Toda nueva deuda tiene prioridad explícita.

---

## 180. Revisar deuda al cerrar cada bloque [V1] · CRÍTICA

**Objetivo**

Evitar acumulación silenciosa.

**Qué hacer**

Al terminar un bloque del roadmap:

1. revisar deuda creada;
2. cerrar la barata;
3. elevar la peligrosa;
4. registrar excepciones justificadas.

**Terminado cuando**

Cada bloque acaba con un mini tech-debt review.

---

## 181. Architecture Review tras el primer vertical slice [V1] · CRÍTICA

**Objetivo**

Revisar la arquitectura usando un flujo real, no solo diagramas.

**Momento**

Después de completar un primer recorrido:

```text
login
→ actividad
→ pizarra
→ DigitCell
→ reconocimiento
→ corrección
→ resumen
```

**Terminado cuando**

Se documentan decisiones a mantener, decisiones a corregir y deuda estructural detectada.

---

## 182. Architecture Review antes del MVP [V1] · CRÍTICA

**Objetivo**

No entrar en piloto con una base difícil de evolucionar.

**Revisar**

- módulos;
- dependencias;
- DB;
- API;
- offline;
- modelo de reconocimiento;
- seguridad;
- observabilidad;
- despliegue.

**Terminado cuando**

Las deudas críticas están resueltas o formalmente aceptadas con un plan.

---

## 183. Regression Gate antes de cada release [V1] · CRÍTICA

**Objetivo**

Evitar que una release arregle una cosa y rompa otra.

**Requisitos**

- unit tests verdes;
- integration tests verdes;
- E2E críticos verdes;
- regression del reconocedor verde;
- build de producción correcto;
- smoke tests correctos.

**Terminado cuando**

Ninguna release estable se publica con la suite crítica roja.

---

## 184. Revisión mensual o por hito de calidad [V1] · ALTA

**Objetivo**

Mirar el proyecto desde una perspectiva sistémica.

**Revisar**

- tamaño de la suite;
- tests flakey;
- deuda técnica;
- dependencias obsoletas;
- incidencias recurrentes;
- complejidad;
- tiempos de build;
- seguridad.

**Terminado cuando**

Existe una revisión de salud del código en cada hito relevante.

---

# BLOQUE 15 — CIBERSEGURIDAD Y PROTECCIÓN DE LA PLATAFORMA

La ciberseguridad se tratará como requisito funcional y de arquitectura. El objetivo no será “hacerla imposible de hackear”, porque ninguna aplicación conectada a Internet puede garantizarlo, sino **reducir drásticamente la superficie de ataque, limitar el impacto de un fallo y detectar/reaccionar ante incidentes**.

También se distingue entre:

```text
PROTEGER LA IDEA
        ≠
PROTEGER LOS SECRETOS / DATOS / CUENTAS
```

La idea del producto por sí sola no debe considerarse el principal secreto técnico. Debemos proteger especialmente:

- cuentas;
- datos del colegio;
- datos de menores;
- sesiones;
- claves y secretos;
- API;
- infraestructura;
- backups;
- modelos y assets propietarios si decidimos tratarlos como propiedad intelectual.

## 185. Threat model inicial [V1] · CRÍTICA

**Objetivo**

Identificar qué queremos proteger y de quién.

**Qué hacer**

Documentar amenazas como:

- robo de cuentas;
- abuso de contraseñas;
- acceso no autorizado a API;
- IDOR/BOLA (cambiar IDs para acceder a otro recurso);
- XSS;
- CSRF cuando corresponda;
- inyección SQL;
- abuso de endpoints;
- subida de archivos maliciosos;
- fuga de secretos;
- exposición accidental de PII;
- ataques automatizados;
- denegación de servicio;
- dependencia comprometida;
- configuración cloud incorrecta.

**Terminado cuando**

Existe una primera matriz amenaza → mitigación → test.

---

## 186. Inventario de activos [V1] · CRÍTICA

**Objetivo**

Saber qué cosas podrían ser atacadas o filtradas.

**Inventariar**

- frontend;
- Workers/API;
- D1;
- R2;
- cuentas;
- secretos;
- sesiones;
- backups;
- modelos de reconocimiento;
- logs;
- datos escolares;
- configuraciones.

**Terminado cuando**

Cada activo tiene propietario lógico y nivel de sensibilidad.

---

## 187. Principio de mínimo privilegio [V1] · CRÍTICA

**Objetivo**

Reducir el impacto de una cuenta comprometida.

**Qué hacer**

Aplicarlo a:

- usuarios;
- roles;
- Workers;
- acceso a D1/R2;
- CI/CD;
- secrets;
- cuentas administrativas.

**Terminado cuando**

Cada actor tiene solamente los permisos necesarios.

---

## 188. Separar cuentas personales y administrativas [V1] · ALTA

**Objetivo**

Evitar que una cuenta cotidiana tenga privilegios innecesarios.

**Terminado cuando**

La administración de producción no depende de credenciales informales compartidas.

---

## 189. MFA para cuentas privilegiadas [V1] · CRÍTICA

**Objetivo**

Añadir una segunda barrera contra robo de contraseña.

**Aplicar como mínimo a**

- administración de infraestructura;
- repositorio;
- proveedor cloud;
- administración de la plataforma.

**Terminado cuando**

Las cuentas privilegiadas no dependen únicamente de contraseña.

---

## 190. Política de contraseñas y credenciales [V1] · CRÍTICA

**Objetivo**

Evitar credenciales débiles o reutilizadas dentro de la plataforma.

**Qué hacer**

- hash seguro de contraseñas mediante proveedor/biblioteca adecuada;
- nunca almacenar contraseñas en claro;
- evitar credenciales compartidas;
- procesos seguros de recuperación;
- invalidación de sesiones cuando corresponda.

**Terminado cuando**

La autenticación cumple una política documentada.

---

## 191. Gestión segura de sesiones [V1] · CRÍTICA

**Objetivo**

Evitar secuestro de sesiones.

**Qué hacer**

Revisar:

- cookies `Secure`;
- `HttpOnly` donde corresponda;
- `SameSite` adecuado;
- expiración;
- rotación cuando proceda;
- logout efectivo;
- invalidación de sesiones sensibles.

**Terminado cuando**

Los atributos y ciclo de vida de las sesiones están documentados y probados.

---

## 192. Protección contra fuerza bruta [V1] · CRÍTICA

**Objetivo**

Dificultar ataques automáticos a login.

**Qué hacer**

Aplicar rate limiting y controles de abuso en endpoints sensibles.

**Terminado cuando**

Intentos automatizados repetidos no pueden probar contraseñas indefinidamente.

---

## 193. Rate limiting de API [V1] · CRÍTICA

**Objetivo**

Evitar abuso y proteger recursos compartidos.

**Aplicar a**

- login;
- recuperación;
- administración;
- generación intensiva;
- endpoints costosos;
- descarga masiva.

**Terminado cuando**

Los endpoints sensibles tienen límites y respuestas controladas.

---

## 194. Validación estricta de inputs [V1] · CRÍTICA

**Objetivo**

No confiar en los datos enviados por el navegador.

**Qué hacer**

Validar en backend:

- tipos;
- rangos;
- tamaños;
- formatos;
- enums;
- relaciones;
- tamaños de payload.

**Terminado cuando**

Las validaciones esenciales existen en servidor y no solo en UI.

---

## 195. Protección contra SQL Injection [V1] · CRÍTICA

**Objetivo**

Evitar manipulación de consultas.

**Qué hacer**

Usar consultas parametrizadas y evitar construir SQL con entrada del usuario.

**Terminado cuando**

Los repositorios y servicios críticos están revisados y cubiertos por tests.

---

## 196. Protección XSS [V1] · CRÍTICA

**Objetivo**

Evitar ejecución de código malicioso en navegadores de usuarios.

**Qué hacer**

- escapar contenido dinámico;
- evitar HTML inseguro;
- sanitizar cuando sea imprescindible;
- revisar dependencias y componentes que rendericen contenido.

**Terminado cuando**

No existe uso innecesario de APIs inseguras de HTML.

---

## 197. Content Security Policy [V1.1] · ALTA

**Objetivo**

Añadir una segunda barrera frente a XSS y cargas inesperadas.

**Terminado cuando**

Existe una CSP razonable y comprobada en staging antes de producción.

---

## 198. Protección CSRF [V1] · ALTA

**Objetivo**

Evitar acciones forzadas desde sitios externos cuando el modelo de autenticación lo requiera.

**Terminado cuando**

El esquema de cookies y acciones mutables está revisado y protegido.

---

## 199. Autorización server-side [V1] · CRÍTICA

**Objetivo**

Evitar que un usuario manipule el frontend para conseguir permisos.

**Regla**

```text
Frontend dice lo que quiere hacer
             ↓
Backend decide si puede hacerlo
```

**Terminado cuando**

Ninguna operación sensible depende exclusivamente de comprobaciones de interfaz.

---

## 200. Tests de IDOR/BOLA [V1.1] · CRÍTICA

**Objetivo**

Detectar accesos indebidos mediante manipulación de identificadores.

**Qué hacer**

Automatizar pruebas del estilo:

```text
usuario A + resourceId de B
→ 403 / 404 seguro
```

**Terminado cuando**

Los recursos protegidos tienen tests de acceso cruzado.

---

## 201. Modelo de roles centralizado [V1] · CRÍTICA

**Objetivo**

No duplicar reglas de permisos por toda la aplicación.

**Roles**

- PLATFORM_ADMIN;
- SCHOOL_ADMIN;
- TEACHER;
- STUDENT futuro.

**Terminado cuando**

Los permisos parten de una política centralizada y reutilizable.

---

## 202. Autorización por recurso [V1.1] · CRÍTICA

**Objetivo**

Comprobar no solo el rol, sino también la pertenencia al recurso.

**Ejemplo**

```text
TEACHER
   ↓
¿Pertenece a esta clase?
   ↓
¿Puede acceder a esta actividad?
```

**Terminado cuando**

La autorización considera organización, clase y recurso.

---

## 203. Protección contra enumeración [V1.1] · ALTA

**Objetivo**

Evitar descubrir usuarios, alumnos o recursos por respuestas demasiado reveladoras.

**Terminado cuando**

Las respuestas públicas/privadas no exponen información innecesaria.

---

## 204. Minimización de datos en logs [V1] · CRÍTICA

**Objetivo**

No convertir los logs en una fuente secundaria de fuga de información.

**No registrar como regla general**

- nombres de alumnos;
- respuestas educativas completas;
- trazos de escritura;
- secretos;
- tokens;
- contraseñas;
- datos personales innecesarios.

**Terminado cuando**

Existe una política de logging con ejemplos explícitos de datos prohibidos.

---

## 205. Sentry con privacidad por diseño [V1] · CRÍTICA

**Objetivo**

Usar observabilidad sin enviar datos sensibles innecesarios.

**Qué hacer**

Configurar Sentry para capturar principalmente:

- errores técnicos;
- versión;
- navegador;
- sistema;
- rendimiento;
- identificadores técnicos no sensibles.

Evitar por defecto:

- contenido manuscrito;
- nombres de menores;
- respuestas completas;
- PII innecesaria.

**Terminado cuando**

Se ha probado qué datos salen realmente del navegador y API hacia Sentry.

---

## 206. Gestión de secretos [V1] · CRÍTICA

**Objetivo**

Impedir que claves privadas terminen en Git.

**Qué hacer**

- secretos de Cloudflare en el almacén de secretos;
- variables de entorno donde corresponda;
- `.env` fuera del repositorio;
- secret scanning en CI.

**Terminado cuando**

No existen secretos reales en el código fuente ni en commits.

---

## 207. Secret scanning [V1] · ALTA

**Objetivo**

Detectar credenciales accidentales.

**Terminado cuando**

GitHub/CI alerta o bloquea patrones de secretos antes de producción.

---

## 208. Dependencias seguras [V1] · CRÍTICA

**Objetivo**

Reducir riesgo de vulnerabilidades en terceros.

**Qué hacer**

- Dependabot/Renovate o equivalente;
- revisión de vulnerabilidades;
- eliminar dependencias innecesarias;
- fijar versiones según estrategia del proyecto.

**Terminado cuando**

Las dependencias tienen revisión continua y no se acumulan vulnerabilidades críticas sin decisión explícita.

---

## 209. Auditoría de dependencias antes del MVP [V1] · CRÍTICA

**Objetivo**

No entregar el piloto con vulnerabilidades conocidas relevantes.

**Terminado cuando**

Se ha ejecutado una auditoría y cada hallazgo tiene estado.

---

## 210. Headers de seguridad [V1.1] · ALTA

**Objetivo**

Añadir defensas básicas a nivel HTTP.

**Revisar**

- CSP;
- HSTS cuando sea apropiado;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- otros headers aplicables.

**Terminado cuando**

Los headers relevantes están configurados y verificados en staging.

---

## 211. Protección de CORS [V1] · ALTA

**Objetivo**

No permitir orígenes arbitrarios innecesariamente.

**Terminado cuando**

Los endpoints aceptan solamente los orígenes previstos según el diseño.

---

## 212. Seguridad de subida de archivos [V1.1] · ALTA

**Objetivo**

Preparar la futura gestión de PDFs/assets sin abrir una puerta de ataque.

**Qué hacer**

- validar tipo y tamaño;
- nombres seguros;
- almacenamiento aislado;
- descarga autorizada;
- no confiar en extensión enviada por cliente.

**Terminado cuando**

No existe una subida genérica sin restricciones.

---

## 213. Descargas autorizadas [V2] · ALTA

**Objetivo**

Evitar que conocer una URL permita descargar archivos ajenos.

**Terminado cuando**

Los archivos sensibles requieren autorización apropiada.

---

## 214. Seguridad del CI/CD [V1] · CRÍTICA

**Objetivo**

Evitar que una cuenta o workflow comprometido pueda desplegar código arbitrario.

**Qué hacer**

- permisos mínimos de GitHub Actions;
- secretos mínimos;
- separar entornos;
- proteger rama principal;
- revisar acciones de terceros.

**Terminado cuando**

Un pull request no autorizado no puede desplegar libremente a producción.

---

## 215. Branch protection [V1] · ALTA

**Objetivo**

Evitar cambios directos peligrosos en producción.

**Terminado cuando**

La rama principal exige las comprobaciones definidas antes de integrar cambios sensibles.

---

## 216. Code review [V1] · CRÍTICA

**Objetivo**

Tener un segundo nivel de control para cambios importantes.

**Revisar especialmente**

- auth;
- permisos;
- DB;
- API;
- gestión de secretos;
- reconocimiento;
- dependencias.

**Terminado cuando**

Los cambios críticos no se integran sin revisión.

---

## 217. SAST / análisis estático de seguridad [V1.1] · ALTA

**Objetivo**

Encontrar patrones inseguros automáticamente.

**Terminado cuando**

Existe al menos una herramienta automatizada integrada en CI.

---

## 218. Detección de vulnerabilidades en infraestructura [V1.1] · MEDIA

**Objetivo**

Revisar configuraciones cloud y despliegue.

**Terminado cuando**

Las configuraciones relevantes de producción han pasado una checklist de seguridad.

---

## 219. Backups cifrados y controlados [V1] · CRÍTICA

**Objetivo**

Evitar que una copia de seguridad se convierta en una fuga de datos.

**Terminado cuando**

Los backups tienen acceso restringido y protección equivalente a la información original.

---

## 220. Prueba de restauración segura [V1] · CRÍTICA

**Objetivo**

Comprobar que el backup es realmente utilizable y no introduce datos corruptos o accesos indebidos.

**Terminado cuando**

Existe una restauración controlada y verificada.

---

## 221. Gestión de incidentes [V1.1] · ALTA

**Objetivo**

Saber qué hacer si algo ocurre.

**Preparar**

- detección;
- contención;
- rotación de secretos;
- revocación de sesiones;
- análisis;
- recuperación;
- documentación;
- comunicación al responsable correspondiente.

**Terminado cuando**

Existe un playbook básico de incidente.

---

## 222. Simulacro de cuenta comprometida [V1.1] · ALTA

**Objetivo**

Validar que podemos reaccionar ante un robo de credenciales.

**Terminado cuando**

Podemos invalidar sesiones/credenciales y revisar accesos sin improvisar.

---

## 223. Security Gate antes del piloto [V1] · CRÍTICA

**Objetivo**

No poner la aplicación en manos del colegio sin un mínimo razonable de seguridad.

**Checklist mínima**

- MFA administración;
- secretos fuera de Git;
- rate limiting;
- validación backend;
- autorización server-side;
- aislamiento multi-tenant si ya está activo;
- tests IDOR/BOLA;
- dependencias auditadas;
- Sentry sin PII innecesaria;
- backups;
- incident playbook básico.

**Terminado cuando**

Todo está verificado y los hallazgos críticos están cerrados.

---

## 224. Pentest ligero antes de multi-colegio [V2] · ALTA

**Objetivo**

Revisar la superficie real antes de abrir la plataforma a más organizaciones.

**Qué hacer**

Realizar una revisión manual y/o automatizada centrada en:

- autenticación;
- autorización;
- IDOR/BOLA;
- XSS;
- CSRF;
- rate limiting;
- enumeración;
- exposición de API;
- configuración de almacenamiento.

**Terminado cuando**

Los hallazgos tienen severidad, responsable y plan de corrección.

---

# BLOQUE 16 — MOMENTOS CLAVE DE REVISIÓN

Este bloque convierte la calidad, RGF, deuda y seguridad en **puntos obligatorios del roadmap**, no en recomendaciones genéricas.

## 225. Gate de arranque técnico [antes de escribir funcionalidad] · CRÍTICA

Debe existir:

```text
Repositorio
CI
TypeScript strict
ESLint
formateo
Vitest
Playwright
entornos
secrets
branch protection
```

No se empieza a construir la funcionalidad grande sin esta base.

---

## 226. Gate después del primer vertical slice [V1] · CRÍTICA

Revisar:

- arquitectura real;
- calidad de módulos;
- tests;
- RGF aplicado;
- observabilidad;
- seguridad de extremo a extremo;
- deuda creada.

**Momento exacto:**

Después de que un ejercicio pueda recorrer:

```text
login → actividad → pizarra → reconocimiento → corrección → resumen
```

---

## 227. Gate al cerrar cada módulo grande [V1] · CRÍTICA

Los módulos principales:

```text
Pizarra
Reconocimiento
Motor Matemático
Actividades
Offline
Autenticación
PDF
```

deben tener revisión individual.

**Checklist**

- unit;
- integration;
- E2E si aplica;
- calidad;
- seguridad;
- deuda;
- documentación.

---

## 228. Gate específico antes de activar offline [V1] · CRÍTICA

Revisar:

- IndexedDB;
- migraciones;
- estados sin red;
- recuperación;
- almacenamiento local;
- datos sensibles locales;
- borrado/reset.

---

## 229. Gate específico antes de incorporar aprendizaje adaptativo [V1.1] · ALTA

Revisar:

- calidad de las muestras;
- privacidad;
- límite de almacenamiento;
- reset;
- regresiones;
- separación entre memoria local y modelo base;
- trazabilidad de versión.

---

## 230. Gate de seguridad antes del login real [V1] · CRÍTICA

No considerar terminado el login hasta comprobar:

- sesiones;
- recuperación;
- fuerza bruta;
- errores de autenticación;
- permisos backend;
- logs sin secretos.

---

## 231. Gate de producción antes del piloto [V1] · CRÍTICA

Este es uno de los gates más importantes del proyecto.

Debe incluir:

```text
TESTS ─────────────── VERDES
LINT ──────────────── VERDE
TYPECHECK ─────────── VERDE
BUILD ─────────────── VERDE
E2E CRÍTICOS ──────── VERDES
SECURITY CHECK ────── OK
BACKUPS ───────────── OK
RESTORE ───────────── OK
SENTRY ────────────── OK
OFFLINE ───────────── OK
PIZARRA REAL ──────── OK
PDF ───────────────── OK
```

---

## 232. Gate después del primer mes de uso real [V1] · CRÍTICA

**Objetivo**

Aprender de la realidad antes de escalar.

Revisar:

- errores Sentry;
- incidencias del profesor;
- problemas táctiles;
- errores de reconocimiento;
- rendimiento;
- deuda acumulada;
- tests flakey;
- problemas de UX.

**Terminado cuando**

Se crea una lista priorizada de mejoras antes del siguiente gran bloque.

---

## 233. Gate antes de añadir 3.º de Primaria [V1.1/FUTURO] · CRÍTICA

No añadir contenido por encima de una arquitectura ya tensionada sin revisar:

- motor de ejercicios;
- renderer;
- validator;
- modelo de datos;
- permisos;
- rendimiento;
- deuda.

---

## 234. Gate antes de abrir la plataforma a un segundo colegio [V2] · CRÍTICA

Este gate requiere:

- aislamiento multi-tenant probado;
- tests cross-tenant;
- exportación;
- borrado;
- retención;
- roles;
- auditoría de seguridad;
- carga concurrente;
- observabilidad.

---

## 235. Gate antes de introducir alumnos con cuenta propia [V2] · CRÍTICA

Revisar especialmente:

- identidad;
- sesiones;
- privacidad;
- permisos;
- tareas;
- exposición de resultados;
- repetición;
- límites de acceso entre alumnos.

---

## 236. Gate antes de guardar histórico de resultados [V2] · CRÍTICA

Revisar:

- minimización;
- retención;
- exportación;
- borrado;
- acceso del profesor;
- qué ve el alumno;
- qué ve el administrador;
- qué nunca aparece en logs.

---

## 237. Gate antes de cambiar de modelo de reconocimiento [V1.1/V2] · ALTA

Comparar siempre:

```text
MODELO ACTUAL
vs
MODELO NUEVO
```

sobre:

- dataset de regresión;
- accuracy global;
- accuracy por dígito;
- baja confianza;
- latencia;
- memoria;
- dispositivos reales.

**Terminado cuando**

No se cambia el modelo por intuición únicamente.

---

## 238. Gate de fin de cada release [V1+] · CRÍTICA

La release se cierra solo cuando:

1. tests verdes;
2. deuda revisada;
3. seguridad revisada según cambios;
4. changelog/documentación actualizado;
5. Sentry y métricas revisados;
6. smoke test de producción correcto.

---

## 239. Revisión de arquitectura anual o por gran versión [FUTURO] · ALTA

**Objetivo**

Evitar que la arquitectura se degrade con el crecimiento.

**Revisar**

- dependencias;
- límites de módulos;
- modelo de datos;
- costes;
- rendimiento;
- seguridad;
- observabilidad;
- portabilidad cloud.

---

# BLOQUE 17 — MATRIZ PRÁCTICA DE CUÁNDO HACER CADA COSA

| Momento               | Tests                   | RGF                                 | Calidad código            | Deuda técnica           | Seguridad                       |
| --------------------- | ----------------------- | ----------------------------------- | ------------------------- | ----------------------- | ------------------------------- |
| Antes de empezar      | configurar              | definir criterio                    | configurar lint/typecheck | crear registro          | threat model inicial            |
| Cada feature crítica  | unit/integration        | **Red → Green → Refactor**          | review                    | registrar/cerrar        | revisar superficie afectada     |
| Cada módulo           | suite del módulo        | refactor si procede                 | architecture review       | debt review             | security review                 |
| Primer vertical slice | E2E crítico             | revisar ciclo                       | primera arquitectura real | revisar                 | security end-to-end             |
| Antes de MVP          | regresión completa      | refactor estructural                | quality gate              | resolver deuda crítica  | security gate                   |
| Antes de piloto       | smoke + E2E             | solo refactor con riesgo controlado | release gate              | no dejar deuda crítica  | security gate + backups         |
| Primer mes real       | regresiones/incidencias | RGF para fixes importantes          | revisión de salud         | sprint de deuda         | revisión de incidentes          |
| Antes de 2.º colegio  | multi-tenant tests      | refactor de escalabilidad           | architecture review       | debt review             | pentest/revisión de aislamiento |
| Antes de alumnos      | E2E de tareas           | RGF en auth/assignment              | API review                | revisar deuda           | privacy + auth review           |
| Cada release          | suite crítica           | según cambios                       | CI verde                  | revisar nuevas entradas | security regression             |
| Gran versión          | full regression         | refactor estructural                | architecture review       | burn-down               | security review                 |

---

# DEFINITION OF DONE GLOBAL

Una funcionalidad crítica del proyecto **no se considerará terminada** hasta cumplir, según aplique:

```text
[ ] Requisito implementado
[ ] Casos límite definidos
[ ] Tests unitarios apropiados
[ ] Tests de integración apropiados
[ ] E2E si el flujo es crítico
[ ] Red → Green → Refactor cuando la lógica lo justifique
[ ] TypeScript strict OK
[ ] ESLint OK
[ ] Build OK
[ ] Revisión de código OK
[ ] Seguridad revisada
[ ] Observabilidad revisada
[ ] Documentación actualizada
[ ] Deuda técnica registrada si se acepta una excepción
[ ] No hay deuda crítica abierta sin plan
```

---

# REGLA PARA NO ACUMULAR DEUDA TÉCNICA

Se utilizará esta regla práctica:

> **Toda deuda aceptada debe tener propietario, impacto, prioridad y momento de revisión.**

Y además:

> **No crear una abstracción genérica “por si acaso”.**

Primero resolvemos una necesidad real. Cuando aparezca un segundo o tercer caso que demuestre un patrón, entonces extraemos la abstracción mediante refactor.

Esto evita dos tipos de deuda opuestos:

```text
DEUDA POR IR DEMASIADO RÁPIDO
          y
DEUDA POR SOBREINGENIERÍA
```

---

# REGLA PARA RED-GREEN-REFACTOR

El RGF será especialmente importante en:

```text
Lógica matemática
Validators
Generators
Permisos
Autenticación
Reconocimiento
Persistencia
Offline
Asignaciones
Multi-tenant
```

En cambio, para una pantalla visual sencilla no es necesario forzar un ritual de TDD exhaustivo cuando no aporta valor.

La idea es:

```text
TEST PRIMERO
cuando el comportamiento es crítico

IMPLEMENTACIÓN PRIMERO
cuando estamos explorando UI o interacción

TEST + REFACTOR
antes de cerrar la funcionalidad
```

---

# REGLA DE SEGURIDAD

La plataforma debe asumir siempre:

```text
EL CLIENTE ES NO CONFIABLE
```

El navegador puede ser manipulado.

Por tanto:

```text
Frontend
   ↓
solicitud
   ↓
Backend
   ↓
autenticación
   ↓
autorización
   ↓
validación
   ↓
operación
```

Nunca:

```text
Frontend
   ↓
"Soy profesor"
   ↓
Backend confía
```

Y en multi-colegio:

```text
Usuario
  ↓
Sesión
  ↓
Organización real
  ↓
Rol
  ↓
Clase
  ↓
Recurso
  ↓
PERMITIR / DENEGAR
```

---

# OBJETIVO FINAL DEL PROYECTO

El objetivo ya no es solamente:

> “hacer una aplicación que funcione”.

El objetivo pasa a ser:

> **construir una plataforma educativa que funcione, sea mantenible, testeable, segura, observable, offline cuando sea necesario, preparada para varios colegios y capaz de evolucionar sin acumular una deuda técnica que haga imposible mantenerla.**

La secuencia de madurez del proyecto será:

```text
FUNCIONA
   ↓
FUNCIONA BIEN
   ↓
ESTÁ TESTEADO
   ↓
ESTÁ REFACTORIZADO
   ↓
ES MANTENIBLE
   ↓
ES SEGURO
   ↓
ES OBSERVABLE
   ↓
ES ESCALABLE
   ↓
PUEDE CRECER A VARIOS COLEGIOS
```
