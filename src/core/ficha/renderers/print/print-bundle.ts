/** CSS de ficha concatenado para PDF / Word / page packing (D-026). */
import base from "./print-base.css?inline";
import header from "./print-header.css?inline";
import grid from "./print-grid.css?inline";
import footer from "./print-footer.css?inline";
import soluciones from "./print-soluciones.css?inline";
import series from "../components/SeriesRenderer.print.css?inline";
import ordering from "../components/OrderingRenderer.print.css?inline";
import relacionar from "../components/RelacionarRenderer.print.css?inline";
import relacionarCantidades from "../components/RelacionarCantidadesRenderer.print.css?inline";
import counting from "../components/CountingRenderer.print.css?inline";
import comparison from "../components/ComparisonRenderer.print.css?inline";
import operation from "../components/OperationRenderer.print.css?inline";
import tresSumandos from "../components/TresSumandosRenderer.print.css?inline";
import algoritmoVertical from "../components/AlgoritmoVerticalRenderer.print.css?inline";
import igualdad from "../components/IgualdadRenderer.print.css?inline";
import tablaNumerica from "../components/TablaNumericaRenderer.print.css?inline";
import poligonos from "../components/PoligonosRenderer.print.css?inline";
import reloj from "../components/RelojRenderer.print.css?inline";
import leftRight from "../components/LeftRightRenderer.print.css?inline";
import lineTypes from "../components/LineTypesRenderer.print.css?inline";
import monedasBilletes from "../components/MonedasBilletesRenderer.print.css?inline";
import photoCompare from "../components/PhotoCompareRenderer.print.css?inline";
import parImpar from "../components/ParImparRenderer.print.css?inline";
import ordinales from "../components/OrdinalesRenderer.print.css?inline";
import balanza from "../components/BalanzaRenderer.print.css?inline";
import balanzaEquilibra from "../components/BalanzaEquilibraRenderer.print.css?inline";
import laberinto from "../components/LaberintoRenderer.print.css?inline";
import rutaCuadricula from "../components/RutaCuadriculaRenderer.print.css?inline";
import posicionesAula from "../components/PosicionesAulaRenderer.print.css?inline";
import probabilidad from "../components/ProbabilidadRenderer.print.css?inline";
import capacidad from "../components/CapacidadRenderer.print.css?inline";
import graficoBarras from "../components/GraficoBarrasRenderer.print.css?inline";
import menuCafeteria from "../components/MenuCafeteriaRenderer.print.css?inline";
import inventarProblema from "../components/InventarProblemaRenderer.print.css?inline";
import cintaMetrica from "../components/CintaMetricaRenderer.print.css?inline";
import intervalosTiempo from "../components/IntervalosTiempoRenderer.print.css?inline";
import amigos10 from "../components/Amigos10Renderer.print.css?inline";
import datosInnecesarios from "../components/DatosInnecesariosRenderer.print.css?inline";
import relacionSumaResta from "../components/RelacionSumaRestaRenderer.print.css?inline";
import problema from "../components/ProblemaRenderer.print.css?inline";
import weekDays from "../components/WeekDaysRenderer.print.css?inline";
import vecinos from "../components/VecinosRenderer.print.css?inline";
import dobleYMitad from "../components/DobleYMitadRenderer.print.css?inline";
import numeracion from "../components/NumeracionRenderer.print.css?inline";
import lecturaNumeros from "../components/LecturaNumerosRenderer.print.css?inline";
import abaco3Cifras from "../components/Abaco3CifrasRenderer.print.css?inline";
import redondeo from "../components/RedondeoRenderer.print.css?inline";
import repartoIgual from "../components/RepartoIgualRenderer.print.css?inline";
import problemas2pasos from "../components/Problemas2PasosRenderer.print.css?inline";
import simetria from "../components/SimetriaRenderer.print.css?inline";
import cuerpos3d from "../components/Cuerpos3DRenderer.print.css?inline";
import circuloCircunferencia from "../components/CirculoCircunferenciaRenderer.print.css?inline";
import multiplicacion from "../components/MultiplicacionRenderer.print.css?inline";
import sumaLlevando from "../components/SumaLlevandoRenderer.print.css?inline";
import algoritmo3Cifras from "../components/Algoritmo3CifrasRenderer.print.css?inline";
import rectaNumerica from "../components/RectaNumericaRenderer.print.css?inline";
import numeracion999 from "../components/Numeracion999Renderer.print.css?inline";

export const printCss = [
  base,
  header,
  grid,
  footer,
  soluciones,
  series,
  ordering,
  relacionar,
  relacionarCantidades,
  counting,
  comparison,
  operation,
  tresSumandos,
  algoritmoVertical,
  igualdad,
  tablaNumerica,
  poligonos,
  reloj,
  leftRight,
  lineTypes,
  monedasBilletes,
  photoCompare,
  parImpar,
  ordinales,
  balanza,
  balanzaEquilibra,
  laberinto,
  rutaCuadricula,
  posicionesAula,
  probabilidad,
  capacidad,
  graficoBarras,
  menuCafeteria,
  inventarProblema,
  cintaMetrica,
  intervalosTiempo,
  amigos10,
  datosInnecesarios,
  relacionSumaResta,
  problema,
  weekDays,
  vecinos,
  dobleYMitad,
  numeracion,
  lecturaNumeros,
  abaco3Cifras,
  redondeo,
  repartoIgual,
  problemas2pasos,
  simetria,
  cuerpos3d,
  circuloCircunferencia,
  multiplicacion,
  sumaLlevando,
  algoritmo3Cifras,
  rectaNumerica,
  numeracion999,
].join("\n");

export default printCss;
