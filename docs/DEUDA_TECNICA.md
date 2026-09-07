# Registro de deuda técnica y reservas

Este es el punto único de control de deuda técnica. No se repite una auditoría
completa del repositorio en cada cambio: se revisan las filas abiertas de este
documento y los archivos que haya tocado el cambio actual.

## Estados

- **Abierta:** compromiso técnico conocido que debe resolverse.
- **En curso:** ya tiene una acción activa dentro de la fase indicada.
- **Cerrada:** resuelta y verificada; se conserva como evidencia breve.
- **Reserva trazable:** recurso aún no importado por la PWA, pero requerido por
  un motor original identificado. No es deuda mientras mantenga propietario y
  fase.

## Revisión rápida antes de un commit

1. Consultar las filas **Abierta** y **En curso**.
2. Revisar únicamente el área modificada y sus recursos asociados.
3. Añadir una fila si se pospone una corrección técnica o se deja un recurso
   sin propietario.
4. Cerrar una fila solo con evidencia: prueba, build, revisión manual o commit.

La auditoría completa solo se repite al cerrar una fase o antes de una release.

## Deuda técnica

| ID     | Estado  | Elemento                                                                            | Resolución prevista | Evidencia / disparador de revisión                                                        |
| ------ | ------- | ----------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| DT-001 | Cerrada | Duplicados y variantes sin referencia en recursos visuales.                         | Fase 1.             | Eliminados en `a707c82`; build comprobada.                                                |
| DT-002 | Cerrada | Registro de motores PWA que conecte los manifiestos JSON con cada renderer migrado. | Fase 1, paso 10.    | `engine-registry` y selector en catálogo; cada renderer se registra al migrarse (Fase 2). |

## Reservas de recursos

| Recursos                                              | Propietario original identificado                    | Fase de uso | Estado                                 |
| ----------------------------------------------------- | ---------------------------------------------------- | ----------- | -------------------------------------- |
| `video_libro.mp4`, `splash-logo.png`, `school-bg.jpg` | Splash e inicio                                      | Fase 1      | En uso.                                |
| `objects/`                                            | Conteo, comparación y motores que reutilizan objetos | Fases 1-2   | En uso (comparison); conteo pendiente. |
| `dinero/`                                             | `monedasBilletes`                                    | Fase 2      | Reserva trazable.                      |
| `izquierda-derecha/`                                  | `leftRight`                                          | Fase 2      | Reserva trazable.                      |
| `laberinto/`                                          | `laberintoMatematico`                                | Fase 2      | Reserva trazable.                      |
| `+kilo/`, `-kilo/`, `+litro/`, `-litro/`, `litro/`    | `elKilo` y `elLitro`                                 | Fase 2      | Reserva trazable.                      |
| `shapes-real/`                                        | `shapes`                                             | Fase 2      | Reserva trazable.                      |
| `logo/logo.png`, `logo/logo.ico`                      | Exportación de fichas e iconografía PWA              | Fases 6 y 7 | Reserva trazable.                      |

Cuando un motor se migre, su fila pasa a **En uso**; si se descarta, sus
recursos se revisan y se eliminan en un commit separado.
