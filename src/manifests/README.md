# Manifests

Definiciones versionadas de currículo y contenido: materias, cursos, bloques y
actividades. Los manifiestos describen una actividad, pero no implementan su
motor ni su renderer.

- Cada manifiesto tendrá `schemaVersion` e identificadores estables.
- La validación se implementará en la Fase 1.
- Los motores se referencian por ID, nunca mediante imports React en datos.

Esta carpeta está preparada antes de diseñar el formato para evitar que el
catálogo vuelva a depender de registros manuales dispersos.
