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
import { QuestionRenderer } from "./QuestionRenderer";
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
import { GraficoBarrasRenderer } from "./GraficoBarrasRenderer";
import { MenuCafeteriaRenderer } from "./MenuCafeteriaRenderer";
import { CintaMetricaRenderer } from "./CintaMetricaRenderer";
import { InventarProblemaRenderer } from "./InventarProblemaRenderer";
import { IntervalosTiempoRenderer } from "./IntervalosTiempoRenderer";
import { DefaultRenderer } from "./DefaultRenderer";

export interface ExerciseRendererProps {
  ex: SheetExercise;
  showAnswer: boolean;
}

/**
 * Despacha cada `SheetExercise` a su componente según `ex.kind`.
 *
 * REGLA (siempre): en soluciones (`showAnswer`) SOLO la respuesta — sin enunciado,
 * sin instrucciones y sin imágenes. No reintroducir el layout del alumno aquí.
 */
export function ExerciseRenderer({ ex, showAnswer }: ExerciseRendererProps): ReactNode {
  if (showAnswer) {
    return <div className="ficha-answer">{solutionAnswerOf(ex)}</div>;
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
      return (
        <div className="ficha-vertical">
          {ex.a}
          {"\n"}+{ex.b}
          {"\n"}+{ex.c}
          {"\n"}───
        </div>
      );
    case "tablaNumerica":
      return <TablaNumericaRenderer ex={ex} showAnswer={false} />;
    case "igualdad":
      return <IgualdadRenderer ex={ex} showAnswer={false} />;
    case "relacionSumaResta":
      return (
        <QuestionRenderer
          question={`Total ${ex.total}: partes ${ex.partA} y ${ex.partB}`}
          showAnswer={false}
        />
      );
    case "repartoIgual":
      return (
        <QuestionRenderer
          question={`Reparte ${ex.total} en ${ex.groups} grupos iguales. ¿Cuántos en cada grupo?`}
          showAnswer={false}
        />
      );
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
      return <BalanzaRenderer ex={ex} showAnswer={false} />;
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
    case "problemas2pasos":
    case "datosInnecesarios":
      return (
        <QuestionRenderer
          question={[...(ex.story ?? []), ex.question].filter(Boolean).join("\n")}
          showAnswer={false}
        />
      );
    case "posicionesAula":
      return (
        <QuestionRenderer
          question={ex.question}
          showAnswer={false}
          detail={`${ex.object} / ${ex.container} / ${ex.position}`}
        />
      );
    case "rutaCuadricula":
      return (
        <QuestionRenderer
          question={`Ve de (${ex.start.x},${ex.start.y}) a (${ex.end.x},${ex.end.y}) en una cuadrícula ${ex.gridSize.cols}×${ex.gridSize.rows}.`}
          showAnswer={false}
        />
      );
    case "laberintoMatematico":
      return (
        <QuestionRenderer
          question={ex.question || `Laberinto: empieza en ${ex.start} (${ex.mode})`}
          showAnswer={false}
        />
      );
    case "numeracion1119":
      return (
        <QuestionRenderer question={ex.question || `Número: ${ex.number}`} showAnswer={false} />
      );
    case "weekDay":
    case "capacidad":
    case "numeracion4059":
    case "numeracion6099":
    case "numeracion999":
    case "cuerpos3d":
    case "multiplicacion":
    case "simetria":
    case "probabilidad":
    case "redondeo":
    case "circuloCircunferencia":
    case "vecinosNumero":
    case "amigos10":
    case "lecturaNumeros":
    case "dobleYMitad":
    case "abaco3Cifras":
    case "algoritmo3Cifras":
      return <QuestionRenderer question={"question" in ex ? ex.question : ""} showAnswer={false} />;
    default:
      return <DefaultRenderer ex={ex} showAnswer={false} />;
  }
}
