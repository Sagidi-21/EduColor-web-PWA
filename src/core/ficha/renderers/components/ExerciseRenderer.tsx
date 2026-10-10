import type { SheetExercise } from "../../types";
import type { ReactNode } from "react";
import { solutionAnswerOf } from "../solutionAnswer";
import { OperationRenderer } from "./OperationRenderer";
import { CountingRenderer } from "./CountingRenderer";
import { ComparisonRenderer } from "./ComparisonRenderer";
import { TresSumandosRenderer } from "./TresSumandosRenderer";
import { IgualdadRenderer } from "./IgualdadRenderer";
import { AlgoritmoVerticalRenderer } from "./AlgoritmoVerticalRenderer";
import { TablaNumericaRenderer } from "./TablaNumericaRenderer";
import { PoligonosRenderer } from "./PoligonosRenderer";
import { RelojRenderer } from "./RelojRenderer";
import { LeftRightRenderer } from "./LeftRightRenderer";
import { LineTypesRenderer } from "./LineTypesRenderer";
import { OrderingRenderer } from "./OrderingRenderer";
import { RelacionarRenderer } from "./RelacionarRenderer";
import { RelacionarCantidadesRenderer } from "./RelacionarCantidadesRenderer";
import { SeriesRenderer } from "./SeriesRenderer";
import { MonedasBilletesRenderer } from "./MonedasBilletesRenderer";
import { PhotoCompareRenderer } from "./PhotoCompareRenderer";
import { ParImparRenderer } from "./ParImparRenderer";
import { OrdinalesRenderer } from "./OrdinalesRenderer";
import { BalanzaRenderer } from "./BalanzaRenderer";
import { BalanzaEquilibraRenderer } from "./BalanzaEquilibraRenderer";
import { LaberintoRenderer } from "./LaberintoRenderer";
import { RutaCuadriculaRenderer } from "./RutaCuadriculaRenderer";
import { PosicionesAulaRenderer } from "./PosicionesAulaRenderer";
import { ProbabilidadRenderer } from "./ProbabilidadRenderer";
import { CapacidadRenderer } from "./CapacidadRenderer";
import { GraficoBarrasRenderer } from "./GraficoBarrasRenderer";
import { MenuCafeteriaRenderer } from "./MenuCafeteriaRenderer";
import { CintaMetricaRenderer } from "./CintaMetricaRenderer";
import { InventarProblemaRenderer } from "./InventarProblemaRenderer";
import { IntervalosTiempoRenderer } from "./IntervalosTiempoRenderer";
import { Amigos10Renderer } from "./Amigos10Renderer";
import { TresSumandosColumnaRenderer } from "./TresSumandosColumnaRenderer";
import { DatosInnecesariosRenderer } from "./DatosInnecesariosRenderer";
import { RelacionSumaRestaRenderer } from "./RelacionSumaRestaRenderer";
import { ProblemaRenderer } from "./ProblemaRenderer";
import { WeekDaysRenderer } from "./WeekDaysRenderer";
import { VecinosRenderer } from "./VecinosRenderer";
import { DobleYMitadRenderer } from "./DobleYMitadRenderer";
import { RepartoIgualRenderer } from "./RepartoIgualRenderer";
import { Problemas2PasosRenderer } from "./Problemas2PasosRenderer";
import { SimetriaRenderer } from "./SimetriaRenderer";
import { Cuerpos3DRenderer } from "./Cuerpos3DRenderer";
import { CirculoCircunferenciaRenderer } from "./CirculoCircunferenciaRenderer";
import { MultiplicacionRenderer } from "./MultiplicacionRenderer";
import { SumaLlevandoRenderer } from "./SumaLlevandoRenderer";
import { Algoritmo3CifrasRenderer } from "./Algoritmo3CifrasRenderer";
import { RectaNumericaRenderer } from "./RectaNumericaRenderer";
import { NumeracionRenderer } from "./NumeracionRenderer";
import { LecturaNumerosRenderer } from "./LecturaNumerosRenderer";
import { Abaco3CifrasRenderer } from "./Abaco3CifrasRenderer";
import { RedondeoRenderer } from "./RedondeoRenderer";
import { Numeracion999Renderer } from "./Numeracion999Renderer";
import { DefaultRenderer } from "./DefaultRenderer";

export interface ExerciseRendererProps {
  ex: SheetExercise;
  showAnswer: boolean;
}

/**
 * Despacha cada `SheetExercise` a su componente según `ex.kind`.
 *
 * REGLA: en soluciones (`showAnswer`) SOLO la respuesta — sin enunciado ni dibujos.
 * Excepción: `rectaNumerica` dibuja la recta con marca vertical en la posición correcta.
 */
export function ExerciseRenderer({ ex, showAnswer }: ExerciseRendererProps): ReactNode {
  if (showAnswer) {
    if (ex.kind === "rectaNumerica") {
      return <RectaNumericaRenderer ex={ex} showAnswer />;
    }
    const text = solutionAnswerOf(ex);
    // Respuestas largas (laberinto, escenas de personaje): letra más pequeña para que quepan.
    const className = text.length > 26 ? "ficha-answer ficha-answer--long" : "ficha-answer";
    return <div className={className}>{text}</div>;
  }

  switch (ex.kind) {
    case "operation":
      return <OperationRenderer ex={ex} showAnswer={false} />;
    case "counting":
      return <CountingRenderer ex={ex} showAnswer={false} />;
    case "comparison":
      return <ComparisonRenderer ex={ex} showAnswer={false} />;
    case "tresSumandos":
      return <TresSumandosRenderer ex={ex} showAnswer={false} />;
    case "algoritmoVertical":
      return <AlgoritmoVerticalRenderer ex={ex} showAnswer={false} />;
    case "tresSumandosColumna":
      return <TresSumandosColumnaRenderer ex={ex} showAnswer={false} />;
    case "tablaNumerica":
      return <TablaNumericaRenderer ex={ex} showAnswer={false} />;
    case "igualdad":
      return <IgualdadRenderer ex={ex} showAnswer={false} />;
    case "relacionSumaResta":
      return <RelacionSumaRestaRenderer ex={ex} showAnswer={false} />;
    case "repartoIgual":
      return <RepartoIgualRenderer ex={ex} showAnswer={false} />;
    case "reloj":
      return <RelojRenderer ex={ex} showAnswer={false} />;
    case "leftRight":
      return <LeftRightRenderer ex={ex} showAnswer={false} />;
    case "poligonos":
      return <PoligonosRenderer ex={ex} showAnswer={false} />;
    case "lineTypes":
      return <LineTypesRenderer ex={ex} showAnswer={false} />;
    case "ordenar":
      return <OrderingRenderer ex={ex} showAnswer={false} />;
    case "relacionar":
      return <RelacionarRenderer ex={ex} showAnswer={false} />;
    case "relacionarCantidades":
      return <RelacionarCantidadesRenderer ex={ex} showAnswer={false} />;
    case "seriesNumericas":
    case "series3Cifras":
      return <SeriesRenderer ex={ex} showAnswer={false} />;
    case "parImpar":
      return <ParImparRenderer ex={ex} showAnswer={false} />;
    case "ordinales":
      return <OrdinalesRenderer ex={ex} showAnswer={false} />;
    case "monedasBilletes":
      return <MonedasBilletesRenderer ex={ex} showAnswer={false} />;
    case "elKilo":
    case "elLitro":
      return <PhotoCompareRenderer ex={ex} showAnswer={false} />;
    case "balanza":
      return ex.variant === "equilibra" ? (
        <BalanzaEquilibraRenderer ex={ex} showAnswer={false} />
      ) : (
        <BalanzaRenderer ex={ex} showAnswer={false} />
      );
    case "graficoBarras":
      return <GraficoBarrasRenderer ex={ex} showAnswer={false} />;
    case "menuCafeteria":
      return <MenuCafeteriaRenderer ex={ex} showAnswer={false} />;
    case "cintaMetrica":
      return <CintaMetricaRenderer ex={ex} showAnswer={false} />;
    case "inventarProblema":
      return <InventarProblemaRenderer ex={ex} showAnswer={false} />;
    case "intervalosTiempo":
      return <IntervalosTiempoRenderer ex={ex} showAnswer={false} />;
    case "problemas":
      return <ProblemaRenderer ex={ex} showAnswer={false} />;
    case "problemas2pasos":
      return <Problemas2PasosRenderer ex={ex} showAnswer={false} />;
    case "datosInnecesarios":
      return <DatosInnecesariosRenderer ex={ex} showAnswer={false} />;
    case "posicionesAula":
      return <PosicionesAulaRenderer ex={ex} showAnswer={false} />;
    case "rutaCuadricula":
      return <RutaCuadriculaRenderer ex={ex} showAnswer={false} />;
    case "laberintoMatematico":
      return <LaberintoRenderer ex={ex} showAnswer={false} />;
    case "numeracion1119":
    case "numeracion4059":
    case "numeracion6099":
      return <NumeracionRenderer ex={ex} showAnswer={false} />;
    case "lecturaNumeros":
      return <LecturaNumerosRenderer ex={ex} showAnswer={false} />;
    case "abaco3Cifras":
      return <Abaco3CifrasRenderer ex={ex} showAnswer={false} />;
    case "redondeo":
      return <RedondeoRenderer ex={ex} showAnswer={false} />;
    case "weekDay":
      return <WeekDaysRenderer ex={ex} showAnswer={false} />;
    case "vecinosNumero":
      return <VecinosRenderer ex={ex} showAnswer={false} />;
    case "dobleYMitad":
      return <DobleYMitadRenderer ex={ex} showAnswer={false} />;
    case "capacidad":
      return <CapacidadRenderer ex={ex} showAnswer={false} />;
    case "probabilidad":
      return <ProbabilidadRenderer ex={ex} showAnswer={false} />;
    case "numeracion999":
      return <Numeracion999Renderer ex={ex} showAnswer={false} />;
    case "multiplicacion":
      return <MultiplicacionRenderer ex={ex} showAnswer={false} />;
    case "sumaLlevando":
      return <SumaLlevandoRenderer ex={ex} showAnswer={false} />;
    case "algoritmo3Cifras":
      return <Algoritmo3CifrasRenderer ex={ex} showAnswer={false} />;
    case "rectaNumerica":
      return <RectaNumericaRenderer ex={ex} showAnswer={false} />;
    case "cuerpos3d":
      return <Cuerpos3DRenderer ex={ex} showAnswer={false} />;
    case "simetria":
      return <SimetriaRenderer ex={ex} showAnswer={false} />;
    case "circuloCircunferencia":
      return <CirculoCircunferenciaRenderer ex={ex} showAnswer={false} />;
    case "amigos10":
      return <Amigos10Renderer ex={ex} showAnswer={false} />;
    default:
      return <DefaultRenderer ex={ex} showAnswer={false} />;
  }
}
