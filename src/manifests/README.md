# Manifests

Definiciones versionadas de currículo y contenido: materias, cursos, bloques y
actividades. Los manifiestos describen una actividad, pero no implementan su
motor ni su renderer. Se escriben como JSON puro y se consumen directamente en
`content-registry.ts`.

- Cada manifiesto tiene `schemaVersion`, IDs estables y `$schema` enlazado.
- Los tests validan los JSON mediante `schema/activity-manifest.schema.json`.
- Los motores se referencian por ID, nunca mediante imports React en datos.

Esta carpeta está preparada antes de diseñar el formato para evitar que el
catálogo vuelva a depender de registros manuales dispersos.
