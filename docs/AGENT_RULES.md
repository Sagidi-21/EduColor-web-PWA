# Reglas de Comportamiento del Agente (AGENT_RULES.md)

Este documento define el contrato estricto para cualquier agente de programación (Cursor, Claude Code, Antigravity, etc.) que participe en la migración de la aplicación EduColor de Electron a web PWA.

## 1. Regla principal: NO INVENTAR [V1] · CRÍTICA

Antes de implementar una funcionalidad que pueda existir ya en la aplicación original, el agente debe **localizarla y estudiarla**. La carpeta `electron-reference/Colegio/` contiene el código fuente original.

```text
EXISTE EN ORIGINAL?
      │
   SÍ ─┴─ NO
   │       │
   ▼       ▼
REUTILIZAR  DISEÑAR
```

No se debe crear una segunda implementación equivalente sin justificarlo.

## 2. El código original es la fuente de verdad funcional [V1] · CRÍTICA

Cuando exista una discrepancia entre:

- una idea nueva del agente;
- una implementación nueva;
- y el comportamiento existente;

la implementación existente será la referencia, salvo que el roadmap indique expresamente un cambio funcional.

## 3. No borrar archivos sin autorización [V1] · CRÍTICA

El agente no debe eliminar:

- motores;
- generadores;
- validators;
- actividades;
- tests;
- assets;
- documentación;
- servicios;

solo porque ya exista una versión nueva. Primero debe demostrar que el elemento ha sido reemplazado y documentar la migración.

## 4. No cambiar el comportamiento por motivos de estilo [V1] · CRÍTICA

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

## 5. Adaptar Electron, no copiar Electron [V1] · CRÍTICA

No copiar al frontend web:

- IPC;
- `window.api`;
- APIs específicas de Electron;
- empaquetado Windows;
- procesos locales innecesarios.

Sustituirlos mediante la API web correspondiente (Browser API, IndexedDB, etc.) o servicios de aplicación.

## 6. No introducir backend donde no sea necesario [V1] · ALTA

La lógica que pueda ejecutarse localmente y no necesite datos del servidor debe permanecer local, especialmente:

- reconocimiento;
- validación educativa local;
- ejecución offline;
- generación que no requiera datos privados.

## 7. No introducir microservicios prematuramente [V1] · ALTA

La primera arquitectura web debe ser sencilla (Frontend → API → Core → DB). No dividir en múltiples servicios independientes hasta que exista una razón real.

## 8. Cada nueva abstracción debe demostrar su necesidad [V1] · ALTA

No crear una arquitectura genérica gigantesca “por si algún día”. Primero resolver un caso real. Cuando exista un patrón repetido, extraer la abstracción.

## 9. Documentar antes de hacer una migración compleja [V1] · CRÍTICA

Antes de modificar un módulo crítico, el agente debe indicar:

1. qué hace actualmente;
2. qué dependencias tiene;
3. qué se va a conservar;
4. qué se va a adaptar;
5. qué se va a sustituir;
6. cómo se comprobará la paridad.

## 10. Una feature por cambio coherente [V1] · ALTA

Evitar commits que mezclen (ej. nuevo login + refactor + rediseño). Un cambio debe tener un objetivo claro y comprobable.

## 11. Todo cambio crítico debe tener tests [V1] · CRÍTICA

Especialmente: generators, validators, Core, auth, permisos, persistencia, offline, reconocimiento.

## 12. Utilizar Golden Master en comportamiento heredado [V1] · CRÍTICA

Si el agente cambia una implementación existente, debe poder comparar antes y después (`A == B`). Si no son iguales, debe justificarlo.

## 13. La UI no se rediseña sin requisito [V1] · CRÍTICA

No cambiar colores, estructura, navegación, textos, posiciones, tamaños o flujo solo por preferencia estética. La adaptación a web puede requerir cambios, pero deben estar justificados por: navegador, touch, responsive, accesibilidad, seguridad o nueva funcionalidad.

## 14. El agente debe detenerse ante ambigüedad crítica [V1] · ALTA

Si no puede determinar si una funcionalidad existente debe conservarse o cambiarse, o si tiene cualquier tipo de duda sobre cómo proceder, **no debe inventar una solución silenciosamente**.

Debe detenerse inmediatamente y generar una **batería de preguntas clara y estructurada** para que el usuario pueda resolverlas. Debe dejar constancia de la ambigüedad, el impacto, las opciones y solicitar decisión antes de continuar.

## 15. No marcar como migrado lo que no ha sido validado [V1] · CRÍTICA

Una actividad solo se marca como migrada cuando: Código + Tests + Paridad + Build + UX han sido comprobados.

## 16. Mantener trazabilidad entre original y web [V1] · CRÍTICA

Cada módulo migrado debe poder responder: ¿De dónde viene? ¿Qué se ha cambiado? ¿Por qué? ¿Cómo sabemos que sigue funcionando?
