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
import graficoBarras from "../components/GraficoBarrasRenderer.print.css?inline";
import menuCafeteria from "../components/MenuCafeteriaRenderer.print.css?inline";
import inventarProblema from "../components/InventarProblemaRenderer.print.css?inline";
import cintaMetrica from "../components/CintaMetricaRenderer.print.css?inline";
import intervalosTiempo from "../components/IntervalosTiempoRenderer.print.css?inline";

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
  graficoBarras,
  menuCafeteria,
  inventarProblema,
  cintaMetrica,
  intervalosTiempo,
].join("\n");

export default printCss;
