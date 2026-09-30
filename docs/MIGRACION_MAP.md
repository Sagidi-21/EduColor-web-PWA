# Mapa de Migración

Registro de dónde acaba cada componente de la aplicación original (Electron) en la
nueva arquitectura PWA.

## Qué es este documento y qué no es

- **Sí:** el mapa fichero a fichero. Qué archivo de `electron-reference/` se
  convirtió en qué archivo de `src/`.
- **No:** el estado de migración por actividad. Eso vive **solo** en
  [INVENTARIO_MIGRACION_ACTIVIDADES.md](./INVENTARIO_MIGRACION_ACTIVIDADES.md), que
  lo deriva de `src/core/content/engine-registry.ts`. Aquí la columna `Estado` se
  copia de ese registro y no se calcula aparte.

Este documento se editó por última vez el **2026-09-30**. Antes de esa fecha la
tabla arrastraba 30 filas que decían "Pendiente (Fase 2)" para motores ya
migrados, y daba de existentes dos motores que no están en
`electron-reference/Colegio/src/renderer/src/core/engines/` (`division/` y
`fracciones/`). Las dos cosas están corregidas y la tabla se regeneró desde el
código.

`src/manifests/docsConsistency.test.ts` comprueba en cada `npm test` que la
columna `Estado` de este mapa coincide con el registro, que ninguna fila apunta a
un motor inexistente y que las 62 actividades aparecen una sola vez.

## Infraestructura

| Componente Original                                           | Destino en la PWA                                                         | Estado                                        |
| :------------------------------------------------------------ | :------------------------------------------------------------------------ | :-------------------------------------------- |
| `window.api` (Electron, IPC)                                  | `src/platform/*`                                                          | Sustituido                                    |
| `shared/components/InputModeToggle.tsx`                       | `src/features/shared/components/InputModeToggle.tsx`                      | Migrado                                       |
| `shared/hooks/useInputMode.ts`                                | `src/features/shared/hooks/useInputMode.ts`                               | Migrado                                       |
| `shared/components/Numpad.tsx`                                | `src/features/shared/components/Numpad.tsx`                               | Migrado                                       |
| `shared/components/SummaryScreen.tsx`                         | `src/features/matematicas/components/SummaryScreen.tsx`                   | Migrado                                       |
| `shared/components/ExerciseHeader.tsx`                        | `src/features/matematicas/components/ActivityHeader.tsx`                  | Migrado                                       |
| `shared/components/ActionButtons` / `WrongFeedback`           | `src/features/matematicas/components/ActivityActionButtons.tsx`           | Migrado (D-018: un único componente)          |
| `DrawbleAnswerBox`                                            | `src/features/shared/DigitCell` (`LazyDigitCell`)                         | Migrado, con carga diferida de TF.js (DT-007) |
| `shared/components/DigitBoxes` / `useDigitBoxes` (no existía) | `src/features/matematicas/components/DigitBoxes.tsx`                      | Nuevo en la PWA (D-017)                       |
| `core/generators/*`                                           | `src/core/activities/*.ts`                                                | Migrado                                       |
| `core/registry/activities.ts`                                 | `src/core/content/engine-registry.ts` + `src/manifests/activities/*.json` | Migrado                                       |
| `features/matematicas/MatematicasScreen.tsx`                  | `src/features/matematicas/MatematicasCatalogScreen.tsx`                   | Migrado                                       |
| `features/splash/SplashScreen.tsx`                            | `src/features/splash/SplashScreen.tsx`                                    | Migrado                                       |
| `features/home/HomeScreen.tsx`                                | `src/features/home/HomeScreen.tsx`                                        | Migrado                                       |

## Actividades migradas (35 de 62)

`Estado` refleja `getEngineRegistration()` en `src/core/content/engine-registry.ts`.

| `engineId`            | Motor Electron                                    | Núcleo en `src/core/activities/` | Renderer en `src/features/matematicas/`                    | Estado |
| :-------------------- | :------------------------------------------------ | :------------------------------- | :--------------------------------------------------------- | :----- |
| `comparison`          | `comparison/ComparisonRenderer`                   | `comparison.ts`                  | `comparison/ComparisonScreen.tsx`                          | ✅     |
| `ordenar`             | `ordenar/OrdenarRenderer`                         | `ordering.ts`                    | `ordering/OrderingScreen.tsx`                              | ✅     |
| `seriesNumericas`     | `seriesNumericas/SeriesNumericasRenderer`         | `series.ts`                      | `series/SeriesScreen.tsx`                                  | ✅     |
| `vecinosNumero`       | `vecinosNumero/VecinosNumeroRenderer`             | `vecinos.ts`                     | `vecinos/VecinosScreen.tsx`                                | ✅     |
| `numeracion1119`      | `numeracion1119/Numeracion1119Renderer`           | `numeracion1119.ts`              | `numeracion1119/Numeracion1119Screen.tsx`                  | ✅     |
| `numeracion4059`      | `numeracion4059/Numeracion4059Renderer`           | `numeracion4059.ts`              | `numeracion4059/Numeracion4059Renderer.tsx`                | ✅     |
| `numeracion6099`      | `numeracion6099/Numeracion6099Renderer`           | `numeracion6099.ts`              | `numeracion6099/Numeracion6099Renderer.tsx`                | ✅     |
| `numeracion999`       | `numeracion999/Numeracion999Renderer`             | `numeracion999.ts`               | `numeracion999/Numeracion999Renderer.tsx`                  | ✅     |
| `suma`                | `operations/SumaRenderer`                         | `operations.ts` (compartido)     | `operations/SumaScreen.tsx`                                | ✅     |
| `resta`               | `operations/RestaRenderer`                        | `operations.ts` (compartido)     | `operations/RestaScreen.tsx`                               | ✅     |
| `igualdad`            | `igualdad/IgualdadRenderer`                       | `igualdad.ts`                    | `igualdad/IgualdadScreen.tsx`                              | ✅     |
| `counting`            | `counting/CountingRenderer`                       | `counting.ts`                    | `counting/CountingScreen.tsx`                              | ✅     |
| `problemas`           | `problemas/ProblemaRenderer`                      | `problemas.ts`                   | `problemas/ProblemaScreen.tsx`                             | ✅     |
| `relacionar`          | `relacionar/RelacionarRenderer`                   | `relacionar.ts`                  | `relacionar/RelacionarScreen.tsx`                          | ✅     |
| `rectaNumerica`       | `rectaNumerica/RectaNumericaRenderer`             | `rectaNumerica.ts`               | `rectaNumerica/RectaNumericaScreen.tsx`                    | ✅     |
| `tresSumandos`        | `tresSumandos/TresSumandosRenderer`               | `tresSumandos.ts`                | `tresSumandos/TresSumandosScreen.tsx`                      | ✅     |
| `leftRight`           | `leftRight/LeftRightRenderer`                     | `leftRight.ts`                   | `leftRight/LeftRightScreen.tsx`                            | ✅     |
| `algoritmoVertical`   | `algoritmoVertical/AlgoritmoRenderer`             | `algoritmoVertical.ts`           | `algoritmoColumna/AlgoritmoColumnaScreen.tsx` (compartido) | ✅     |
| `restaColumna`        | `restaColumna/RestaColumnaRenderer`               | `restaColumna.ts`                | `algoritmoColumna/AlgoritmoColumnaScreen.tsx` (compartido) | ✅     |
| `tresSumandosColumna` | `tresSumandosColumna/TresSumandosColumnaRenderer` | `tresSumandosColumna.ts`         | `tresSumandosColumna/TresSumandosColumnaScreen.tsx`        | ✅     |
| `sumaLlevando`        | `sumaLlevando/SumaLlevandoRenderer`               | `sumaLlevando.ts`                | `sumaLlevando/SumaLlevandoScreen.tsx`                      | ✅     |
| `relacionSumaResta`   | `relacionSumaResta/RelacionSumaRestaRenderer`     | `relacionSumaResta.ts`           | `relacionSumaResta/RelacionSumaRestaScreen.tsx`            | ✅     |
| `repartoIgual`        | `repartoIgual/RepartoIgualRenderer`               | `repartoIgual.ts`                | `repartoIgual/RepartoIgualScreen.tsx`                      | ✅     |
| `weekDays`            | `weekDays/WeekDaysRenderer`                       | `weekDays.ts`                    | `weekDays/WeekDaysScreen.tsx`                              | ✅     |
| `shapes`              | `shapes/ShapesRenderer`                           | `shapes.ts`                      | `shapes/ShapesScreen.tsx`                                  | ✅     |
| `tablaNumerica`       | `tablaNumerica/TablaNumericaRenderer`             | `tablaNumerica.ts`               | `tablaNumerica/TablaNumericaScreen.tsx`                    | ✅     |
| `lineTypes`           | `lineTypes/LineTypesRenderer`                     | `lineTypes.ts`                   | `lineTypes/LineTypesScreen.tsx`                            | ✅     |
| `capacidad`           | `capacidad/CapacidadRenderer`                     | `capacidad.ts`                   | `capacidad/CapacidadScreen.tsx`                            | ✅     |
| `ordinales`           | `ordinales/OrdinalesRenderer`                     | `ordinales.ts`                   | `ordinales/OrdinalesScreen.tsx`                            | ✅     |
| `parImpar`            | `parImpar/ParImparRenderer`                       | `parImpar.ts`                    | `parImpar/ParImparScreen.tsx`                              | ✅     |
| `elLitro`             | `elLitro/ElLitroRenderer`                         | `elLitro.ts`                     | `elLitro/ElLitroScreen.tsx`                                | ✅     |
| `elKilo`              | `elKilo/ElKiloRenderer`                           | `elKilo.ts`                      | `elKilo/ElKiloScreen.tsx`                                  | ✅     |
| `poligonos`           | `poligonos/PoligonosRenderer`                     | `poligonos.ts`                   | `poligonos/PoligonosScreen.tsx`                            | ✅     |
| `balanza`             | `balanza/BalanzaRenderer`                         | `balanza.ts`                     | `balanza/BalanzaScreen.tsx`                                | ✅     |
| `balanzaEquilibra`    | `balanzaEquilibra/BalanzaEquilibraRenderer`       | `balanzaEquilibra.ts`            | `balanzaEquilibra/BalanzaEquilibraScreen.tsx`              | ✅     |

Tres detalles de este bloque que sorprenden al leerlo y conviene no volver a
"arreglar" sin saber lo que hacen:

- `numeracion4059`, `numeracion6099` y `numeracion999` conservan el nombre
  `Renderer` en el fichero aunque exportan una `*Screen`. El registro lazy de
  `engine-screens.tsx` importa esos tres por el nombre de export, no por el de
  fichero.
- `ordenar`, `seriesNumericas` y `vecinosNumero` no conservan su nombre: viven en
  `ordering.ts`, `series.ts` y `vecinos.ts`.
- `algoritmoVertical` y `restaColumna` tienen núcleo propio pero comparten
  renderer. Por eso hay 35 motores, 34 ficheros de núcleo para ellos y 33
  renderers de actividad.

## Actividades pendientes (27 de 62)

Existe el motor en `electron-reference/Colegio/src/renderer/src/core/engines/`,
pero no hay ni núcleo ni renderer en la PWA, y el registro los da como `pending`,
de modo que el catálogo no deja lanzarlas. La prioridad de cada una está en el
inventario.

| `engineId`              | Motor Electron                                        | Núcleo | Renderer | Estado |
| :---------------------- | :---------------------------------------------------- | :----- | :------- | :----- |
| `abaco3cifras`          | `abaco3cifras/Abaco3CifrasRenderer`                   | —      | —        | ⏳     |
| `algoritmo3cifras`      | `algoritmo3cifras/Algoritmo3CifrasRenderer`           | —      | —        | ⏳     |
| `amigos10`              | `amigos10/Amigos10Renderer`                           | —      | —        | ⏳     |
| `cintaMetrica`          | `cintaMetrica/CintaMetricaRenderer`                   | —      | —        | ⏳     |
| `circuloCircunferencia` | `circuloCircunferencia/CirculoCircunferenciaRenderer` | —      | —        | ⏳     |
| `cuerpos3d`             | `cuerpos3d/Cuerpos3DRenderer`                         | —      | —        | ⏳     |
| `datosInnecesarios`     | `datosInnecesarios/DatosInnecesariosRenderer`         | —      | —        | ⏳     |
| `dobleYMitad`           | `dobleYMitad/DobleYMitadRenderer`                     | —      | —        | ⏳     |
| `graficoBarras`         | `graficoBarras/GraficoBarrasRenderer`                 | —      | —        | ⏳     |
| `intervalosTiempo`      | `intervalosTiempo/IntervalosTiempoRenderer`           | —      | —        | ⏳     |
| `inventarProblema`      | `inventarProblema/InventarProblemaRenderer`           | —      | —        | ⏳     |
| `laberintoMatematico`   | `laberintoMatematico/LaberintoMatematicoRenderer`     | —      | —        | ⏳     |
| `lecturaNumeros`        | `lecturaNumeros/LecturaNumerosRenderer`               | —      | —        | ⏳     |
| `menuCafeteria`         | `menuCafeteria/MenuCafeteriaRenderer`                 | —      | —        | ⏳     |
| `monedasBilletes`       | `monedasBilletes/MonedasRenderer`                     | —      | —        | ⏳     |
| `multiplicacion`        | `multiplicacion/MultiplicacionRenderer`               | —      | —        | ⏳     |
| `posicionesAula`        | `posicionesAula/PosicionesAulaRenderer`               | —      | —        | ⏳     |
| `probabilidad`          | `probabilidad/ProbabilidadRenderer`                   | —      | —        | ⏳     |
| `problemas2pasos`       | `problemas2pasos/Problemas2PasosRenderer`             | —      | —        | ⏳     |
| `redondeo`              | `redondeo/RedondeoRenderer`                           | —      | —        | ⏳     |
| `relacionarCantidades`  | `relacionarCantidades/RelacionarCantidadesRenderer`   | —      | —        | ⏳     |
| `reloj`                 | `reloj/RelojRenderer`                                 | —      | —        | ⏳     |
| `relojPonerHora`        | `relojPonerHora/RelojPonerHoraRenderer`               | —      | —        | ⏳     |
| `rutaCuadricula`        | `rutaCuadricula/RutaCuadriculaRenderer`               | —      | —        | ⏳     |
| `series3cifras`         | `series3cifras/Series3CifrasRenderer`                 | —      | —        | ⏳     |
| `simetria`              | `simetria/SimetriaRenderer`                           | —      | —        | ⏳     |
| `laberintoMatematico2`  | comparte renderer con `laberintoMatematico`           | —      | —        | ⏳     |

Las 27 actividades pendientes salen de 27 carpetas de motor: `laberintoMatematico2`
no tiene carpeta propia, el registro de Electron lo apunta al mismo
`laberintoMatematico/LaberintoMatematicoRenderer`, y el inventario lo refleja igual.
