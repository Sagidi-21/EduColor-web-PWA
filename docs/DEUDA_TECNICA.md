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

| ID     | Estado  | Elemento                                                                                                                                                      | Resolución prevista | Evidencia / disparador de revisión                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DT-001 | Cerrada | Duplicados y variantes sin referencia en recursos visuales.                                                                                                   | Fase 1.             | Eliminados en `a707c82`; build comprobada.                                                                                                                                                                                                                                                                                                                                                                                            |
| DT-002 | Cerrada | Registro de motores PWA que conecte los manifiestos JSON con cada renderer migrado.                                                                           | Fase 1, paso 10.    | `engine-registry` y selector en catálogo; cada renderer se registra al migrarse (Fase 2).                                                                                                                                                                                                                                                                                                                                             |
| DT-003 | Cerrada | Adaptador compartido de feedback sonoro de acierto para los motores PWA.                                                                                      | Fase 2.             | `playFeedback` creado en `src/features/shared/audioFeedback.ts` y adoptado por 16 motores; lint 0, typecheck sin errores por mis cambios, build verde.                                                                                                                                                                                                                                                                                |
| DT-004 | Cerrada | Unificación y estandarización del teclado numérico (`Numpad`) y modos de entrada en motores.                                                                  | Fase 2.             | `Numpad` compartido en `src/features/shared/components/Numpad.tsx`; eliminado el duplicado interno de `Numeracion1119Screen.tsx` y corregido el bug de tecla de confirmación (ambas `?` llamaban a `onDelete`). `npm run lint` → 0 errores; `npm run test` → 320/320; typecheck verde.                                                                                                                                                |
| DT-005 | Cerrada | Variables/importaciones sin usar detectadas por linter (`themes` en problemas.test.ts, `IgualdadType` en IgualdadScreen, `validateAnswer` en ProblemaScreen). | Inmediato.          | Eliminados en commit `8145c84`; `npm run lint` → 0 errores.                                                                                                                                                                                                                                                                                                                                                                           |
| DT-006 | Cerrada | `setState` síncrono dentro de `useEffect` en `Numeracion1119Screen.tsx:174` (anti-patrón React).                                                              | Fase 2.             | Refactorizado a timer en `useEffect` (líneas 145-149); `npm run lint` → 0 errores; tests `numeracion1119` verdes.                                                                                                                                                                                                                                                                                                                     |
| DT-007 | Cerrada | Chunk principal > 500 kB (`index-D71E8bmF.js` 215 kB gzipped, `DigitCell-DZOebpE0.js` 890 kB gzipped por TensorFlow.js).                                      | Fase 3-4.           | code-split con `dynamic import()` para TensorFlow.js (lazy-loading via `LazyDigitCell`) y lazy-loading de motores pesados. Build con TensorFlow.js cargado solo cuando un renderer monta DigitCell.                                                                                                                                                                                                                                   |
| DT-008 | Abierta | Backend Express añadido para la feature "Compañero IA" (`src/server/`).                                                                                       | V1 (adelantado)     | Servidor Node con tsx; proxy Vite `/api → localhost:3001`; health check `GET /api/mascot/health-hf`, validación, rate limiting y manejo seguro de errores implementados. Pendiente: configurar `HF_TOKEN` en el entorno real, reiniciar el backend y validar el flujo completo de preview + pack de assets con el profesorado. No afecta al core de Matemáticas.                                                                      | Salvador |
| DT-009 | Abierta | `tests/portal-diagnostics.spec.ts` (Playwright E2E) no valida el componente React real — usa un HTML fixture mock (`diagnostic-portal.html`).                 | Pre-V1 / bajo       | Actual: herramienta manual de depuración del layout y el zoom del body en PortalTransition. Se conserva, pero no corre en CI. Para cerrar esta deuda: (1) crear `playwright.config.ts` y añadir un job `test:e2e` independiente; (2) sustituir el fixture por la página real de la PWA o el componente React montado; (3) validar la compensación `getZoomCorrectedViewport()` sobre el código real. Decisión que la respalda: D-015. |

## Reservas de recursos

| Resources / Directorios                               | Propietario original identificado                    | Fase de uso | Estado                                       |
| ----------------------------------------------------- | ---------------------------------------------------- | ----------- | -------------------------------------------- |
| `video_libro.mp4`, `splash-logo.png`, `school-bg.jpg` | Splash e inicio                                      | Fase 1      | En uso.                                      |
| `objects/`                                            | Conteo, comparación y motores que reutilizan objetos | Fases 1-2   | En uso (comparison, etc.); conteo pendiente. |
| `problemas/`                                          | `problemas` (Problemas de operaciones)               | Fase 2      | En uso.                                      |
| `dinero/`                                             | `monedasBilletes`                                    | Fase 2      | Reserva trazable.                            |
| `izquierda-derecha/`                                  | `leftRight`                                          | Fase 2      | Reserva trazable.                            |
| `laberinto/`                                          | `laberintoMatematico`                                | Fase 2      | Reserva trazable.                            |
| `+kilo/`, `-kilo/`, `+litro/`, `-litro/`, `litro/`    | `elKilo` y `elLitro`                                 | Fase 2      | Reserva trazable.                            |
| `shapes-real/`                                        | `shapes`                                             | Fase 2      | Reserva trazable.                            |
| `logo/logo.png`, `logo/logo.ico`                      | Exportación de fichas e iconografía PWA              | Fases 6 y 7 | Reserva trazable.                            |

Cuando un motor se migre, su fila pasa a **En uso**; si se descarta, sus
recursos se revisan y se eliminan en un commit separado.
