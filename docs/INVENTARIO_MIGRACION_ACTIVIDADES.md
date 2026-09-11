# Inventario de migración de actividades

**Fuente de verdad:** `Colegio/src/renderer/src/core/registry/activities.ts`  
**Auditado:** 2026-09-07  
**Total:** 62 actividades activas: 43 compartidas, 4 específicas de 1.º y 15 específicas de 2.º.

## Cómo leer este inventario

- **Motor / renderer:** existe en Electron; se migra separando lógica pura y UI.
- **Generador:** `Sí` significa que hay un generador asociado en `core/generators`; su contrato se auditará al migrar. `Por localizar` no bloquea el inventario: se revisa antes de seleccionar esa actividad.
- **Tests actuales:** pruebas directamente localizadas en Electron. El número no mide calidad pedagógica; toda actividad migrada llevará pruebas nuevas de núcleo.
- **Recursos:** los 244 archivos visuales originales ya están copiados a
  `src/assets`. `Revisar` ahora significa declarar qué recursos concretos usa
  cada motor, comprobar sus rutas web y verificarlos visualmente, no volver a
  sustituirlos ni a copiarlos.
- **Prioridad:** P1 = primera ola compartida; P2 = V1 tras infraestructura de contenido; P3 = específica posterior o dependiente de interacción compleja.

| ID                      | Cursos   | Motor / renderer Electron                             | Generador     | Tests actuales | Recursos                                                                       | Prioridad         |
| ----------------------- | -------- | ----------------------------------------------------- | ------------- | -------------: | ------------------------------------------------------------------------------ | ----------------- |
| `counting`              | 1.º, 2.º | `counting/CountingRenderer`                           | Sí            |              2 | Objetos genéricos                                                              | P1                |
| `comparison`            | 1.º, 2.º | `comparison/ComparisonRenderer`                       | Sí            |              3 | `src/assets/objects/{coches,flores,globos,manzanas,minions,monstruos,pajaros}` | ✅ P1 migrada — motor, renderer, SummaryScreen, audio, tests |
| `ordenar`               | 1.º, 2.º | `ordenar/OrdenarRenderer`                             | Sí            |              3 | Sin recursos externos; paridad de rangos y sentido auditada                   | ✅ P1 migrada — motor, renderer, SummaryScreen, audio, tests; validación manual pendiente |
| `seriesNumericas`       | 1.º, 2.º | `seriesNumericas/SeriesNumericasRenderer`             | Sí            |              9 | Sin recursos externos                                                          | ✅ P1 migrada — motor, renderer, SummaryScreen, audio, 9 tests; validación manual pendiente |
| `vecinosNumero`         | 1.º, 2.º | `vecinosNumero/VecinosNumeroRenderer`                 | Sí            |              0 | Sin revisar                                                                    | P1                |
| `numeracion1119`        | 1.º, 2.º | `numeracion1119/Numeracion1119Renderer`               | Sí            |              0 | Bloques/ilustraciones: revisar                                                 | P1                |
| `suma`                  | 1.º, 2.º | `operations/SumaRenderer`                             | Sí            |              0 | Objetos genéricos                                                              | P1                |
| `resta`                 | 1.º, 2.º | `operations/RestaRenderer`                            | Sí            |              0 | Objetos genéricos                                                              | P1                |
| `igualdad`              | 1.º, 2.º | `igualdad/IgualdadRenderer`                           | Sí            |              0 | Sin revisar                                                                    | P1                |
| `problemas`             | 1.º, 2.º | `problemas/ProblemaRenderer`                          | Sí            |              0 | Textos: revisar                                                                | P1                |
| `relacionar`            | 1.º      | `relacionar/RelacionarRenderer`                       | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `rectaNumerica`         | 1.º, 2.º | `rectaNumerica/RectaNumericaRenderer`                 | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `tresSumandos`          | 1.º, 2.º | `tresSumandos/TresSumandosRenderer`                   | Sí            |              0 | Objetos: revisar                                                               | P2                |
| `leftRight`             | 1.º, 2.º | `leftRight/LeftRightRenderer`                         | Sí            |              1 | Personajes: revisar                                                            | P2                |
| `shapes`                | 1.º, 2.º | `shapes/ShapesRenderer`                               | Por localizar |              0 | Imágenes de figuras: revisar                                                   | P2                |
| `lineTypes`             | 1.º, 2.º | `lineTypes/LineTypesRenderer`                         | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `weekDays`              | 1.º, 2.º | `weekDays/WeekDaysRenderer`                           | Sí            |              0 | Sin revisar                                                                    | P2                |
| `capacidad`             | 1.º, 2.º | `capacidad/CapacidadRenderer`                         | Por localizar |              0 | Recursos de capacidad: revisar                                                 | P2                |
| `ordinales`             | 1.º, 2.º | `ordinales/OrdinalesRenderer`                         | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `numeracion4059`        | 1.º, 2.º | `numeracion4059/Numeracion4059Renderer`               | Por localizar |              0 | Bloques/ilustraciones: revisar                                                 | P2                |
| `numeracion6099`        | 1.º, 2.º | `numeracion6099/Numeracion6099Renderer`               | Por localizar |              0 | Bloques/ilustraciones: revisar                                                 | P2                |
| `tablaNumerica`         | 1.º, 2.º | `tablaNumerica/TablaNumericaRenderer`                 | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `parImpar`              | 1.º, 2.º | `parImpar/ParImparRenderer`                           | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `poligonos`             | 1.º, 2.º | `poligonos/PoligonosRenderer`                         | Por localizar |              0 | Figuras: revisar                                                               | P2                |
| `algoritmoVertical`     | 1.º, 2.º | `algoritmoVertical/AlgoritmoRenderer`                 | Sí            |              0 | Sin revisar                                                                    | P2                |
| `restaColumna`          | 1.º, 2.º | `restaColumna/RestaColumnaRenderer`                   | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `tresSumandosColumna`   | 1.º, 2.º | `tresSumandosColumna/TresSumandosColumnaRenderer`     | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `relacionSumaResta`     | 1.º, 2.º | `relacionSumaResta/RelacionSumaRestaRenderer`         | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `repartoIgual`          | 1.º, 2.º | `repartoIgual/RepartoIgualRenderer`                   | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `balanza`               | 1.º, 2.º | `balanza/BalanzaRenderer`                             | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `balanzaEquilibra`      | 1.º, 2.º | `balanzaEquilibra/BalanzaEquilibraRenderer`           | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `reloj`                 | 1.º, 2.º | `reloj/RelojRenderer`                                 | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `relojPonerHora`        | 1.º, 2.º | `relojPonerHora/RelojPonerHoraRenderer`               | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `monedasBilletes`       | 1.º, 2.º | `monedasBilletes/MonedasRenderer`                     | Por localizar |              0 | Monedas/billetes: revisar                                                      | P2                |
| `graficoBarras`         | 1.º, 2.º | `graficoBarras/GraficoBarrasRenderer`                 | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `elKilo`                | 1.º, 2.º | `elKilo/ElKiloRenderer`                               | Por localizar |              0 | Imágenes de objetos: revisar                                                   | P2                |
| `elLitro`               | 1.º, 2.º | `elLitro/ElLitroRenderer`                             | Por localizar |              0 | Imágenes de recipientes: revisar                                               | P2                |
| `datosInnecesarios`     | 1.º, 2.º | `datosInnecesarios/DatosInnecesariosRenderer`         | Por localizar |              0 | Textos: revisar                                                                | P3                |
| `rutaCuadricula`        | 1.º, 2.º | `rutaCuadricula/RutaCuadriculaRenderer`               | Por localizar |              0 | Sin revisar                                                                    | P3                |
| `inventarProblema`      | 1.º, 2.º | `inventarProblema/InventarProblemaRenderer`           | Por localizar |              0 | Menú/objetos: revisar                                                          | P3                |
| `menuCafeteria`         | 1.º, 2.º | `menuCafeteria/MenuCafeteriaRenderer`                 | Por localizar |              0 | Menú/objetos: revisar                                                          | P3                |
| `sumaLlevando`          | 1.º, 2.º | `sumaLlevando/SumaLlevandoRenderer`                   | Por localizar |              0 | Sin revisar                                                                    | P3                |
| `relacionarCantidades`  | 2.º      | `relacionarCantidades/RelacionarCantidadesRenderer`   | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `numeracion999`         | 2.º      | `numeracion999/Numeracion999Renderer`                 | Sí            |              0 | Bloques: revisar                                                               | P2                |
| `abaco3cifras`          | 2.º      | `abaco3cifras/Abaco3CifrasRenderer`                   | Por localizar |              0 | Ábaco: revisar                                                                 | P2                |
| `dobleYMitad`           | 2.º      | `dobleYMitad/DobleYMitadRenderer`                     | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `multiplicacion`        | 2.º      | `multiplicacion/MultiplicacionRenderer`               | Por localizar |              0 | Objetos: revisar                                                               | P2                |
| `algoritmo3cifras`      | 2.º      | `algoritmo3cifras/Algoritmo3CifrasRenderer`           | Por localizar |              0 | Sin revisar                                                                    | P2                |
| `cintaMetrica`          | 2.º      | `cintaMetrica/CintaMetricaRenderer`                   | Por localizar |              0 | Objetos: revisar                                                               | P3                |
| `redondeo`              | 2.º      | `redondeo/RedondeoRenderer`                           | Por localizar |              0 | Sin revisar                                                                    | P3                |
| `series3cifras`         | 2.º      | `series3cifras/Series3CifrasRenderer`                 | Por localizar |              0 | Sin revisar                                                                    | P3                |
| `cuerpos3d`             | 2.º      | `cuerpos3d/Cuerpos3DRenderer`                         | Por localizar |              0 | Figuras: revisar                                                               | P3                |
| `simetria`              | 2.º      | `simetria/SimetriaRenderer`                           | Por localizar |              0 | Figuras: revisar                                                               | P3                |
| `circuloCircunferencia` | 2.º      | `circuloCircunferencia/CirculoCircunferenciaRenderer` | Por localizar |              0 | Imágenes: revisar                                                              | P3                |
| `probabilidad`          | 2.º      | `probabilidad/ProbabilidadRenderer`                   | Por localizar |              0 | Objetos: revisar                                                               | P3                |
| `problemas2pasos`       | 2.º      | `problemas2pasos/Problemas2PasosRenderer`             | Sí            |              0 | Textos: revisar                                                                | P3                |
| `posicionesAula`        | 1.º      | `posicionesAula/PosicionesAulaRenderer`               | Por localizar |              0 | Aula/objetos: revisar                                                          | P3                |
| `intervalosTiempo`      | 1.º      | `intervalosTiempo/IntervalosTiempoRenderer`           | Por localizar |              0 | Sin revisar                                                                    | P3                |
| `laberintoMatematico`   | 1.º      | `laberintoMatematico/LaberintoMatematicoRenderer`     | Sí            |              0 | Sin revisar                                                                    | P3                |
| `laberintoMatematico2`  | 2.º      | `laberintoMatematico/LaberintoMatematicoRenderer`     | Sí            |              0 | Sin revisar                                                                    | P3                |

## Reglas antes de migrar una fila

1. Confirmar prioridad con el profesor de Matemáticas del curso afectado.
2. Localizar los generadores exactos y recursos usados; cambiar `Por localizar` y `Revisar` por evidencia concreta.
3. Extraer el núcleo a `src/core` y añadir pruebas antes del renderer.
4. Crear manifiesto cuando el formato de la Fase 1 esté aprobado.
5. No marcar como migrada hasta superar Definition of Done y validación manual pertinente.
