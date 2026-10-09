import type { SheetExercise } from "../../types";
import type { ReactNode } from "react";
import { OperationRenderer } from "./OperationRenderer";
import { CountingRenderer } from "./CountingRenderer";
import { ComparisonRenderer } from "./ComparisonRenderer";
import { TresSumandosRenderer } from "./TresSumandosRenderer";
import { AlgoritmoVerticalRenderer } from "./AlgoritmoVerticalRenderer";
import { TablaNumericaRenderer } from "./TablaNumericaRenderer";
import { QuestionRenderer } from "./QuestionRenderer";
import { PoligonosRenderer } from "./PoligonosRenderer";
import { RelojRenderer } from "./RelojRenderer";
import { LeftRightRenderer } from "./LeftRightRenderer";
import { LineTypesRenderer } from "./LineTypesRenderer";
import { OrderingRenderer } from "./OrderingRenderer";
import { RelacionarRenderer } from "./RelacionarRenderer";
import { DefaultRenderer } from "./DefaultRenderer";

export interface ExerciseRendererProps {
  ex: SheetExercise;
  showAnswer: boolean;
}

function formatAnswer(answer: unknown): string | number | undefined {
  if (answer === undefined || answer === null) return undefined;
  if (typeof answer === "string" || typeof answer === "number") return answer;
  try {
    return JSON.stringify(answer);
  } catch {
    return String(answer);
  }
}

/**
 * Despacha cada `SheetExercise` a su componente React según `ex.kind`.
 */
export function ExerciseRenderer({ ex, showAnswer }: ExerciseRendererProps): ReactNode {
  switch (ex.kind) {
    case "operation":
      return <OperationRenderer ex={ex} showAnswer={showAnswer} />;
    case "counting":
      return <CountingRenderer ex={ex} showAnswer={showAnswer} />;
    case "comparison":
      return <ComparisonRenderer ex={ex} showAnswer={showAnswer} />;
    case "tresSumandos":
      return <TresSumandosRenderer ex={ex} showAnswer={showAnswer} />;
    case "algoritmoVertical":
      return <AlgoritmoVerticalRenderer ex={ex} showAnswer={showAnswer} />;
    case "tresSumandosColumna":
      return (
        <div>
          <div className="ficha-vertical">
            {ex.a}
            {"\n"}+{ex.b}
            {"\n"}+{ex.c}
            {"\n"}───
          </div>
          {showAnswer && ex.answer !== undefined && <div className="ficha-answer">{ex.answer}</div>}
        </div>
      );
    case "tablaNumerica":
      return <TablaNumericaRenderer ex={ex} showAnswer={showAnswer} />;
    case "igualdad":
      return (
        <QuestionRenderer
          question={
            ex.type === "addend"
              ? `${ex.a} + ? = ${ex.c}`
              : ex.type === "decompose"
                ? `Descompón ${ex.a}`
                : `${ex.a} + ${ex.b} = ?`
          }
          answer={ex.answer}
          showAnswer={showAnswer}
        />
      );
    case "relacionSumaResta":
      return (
        <QuestionRenderer
          question={`Total ${ex.total}: partes ${ex.partA} y ${ex.partB}`}
          answer={
            showAnswer
              ? `${ex.partA}+${ex.partB}=${ex.total}; ${ex.total}−${ex.partA}=${ex.partB}`
              : undefined
          }
          showAnswer={showAnswer}
        />
      );
    case "repartoIgual":
      return (
        <QuestionRenderer
          question={`Reparte ${ex.total} en ${ex.groups} grupos iguales. ¿Cuántos en cada grupo?`}
          answer={ex.answer}
          showAnswer={showAnswer}
        />
      );
    case "reloj":
      return <RelojRenderer ex={ex} showAnswer={showAnswer} />;
    case "leftRight":
      return <LeftRightRenderer ex={ex} showAnswer={showAnswer} />;
    case "poligonos":
      return <PoligonosRenderer ex={ex} showAnswer={showAnswer} />;
    case "lineTypes":
      return <LineTypesRenderer ex={ex} showAnswer={showAnswer} />;
    case "ordenar":
      return <OrderingRenderer ex={ex} showAnswer={showAnswer} />;
    case "relacionar":
      return <RelacionarRenderer ex={ex} showAnswer={showAnswer} />;
    case "parImpar":
      return (
        <QuestionRenderer
          question={ex.question || `¿${ex.number} es par o impar?`}
          answer={ex.answer}
          showAnswer={showAnswer}
        />
      );
    case "problemas":
    case "problemas2pasos":
    case "datosInnecesarios":
      return (
        <QuestionRenderer
          question={[...(ex.story ?? []), ex.question].filter(Boolean).join("\n")}
          answer={formatAnswer(ex.answer)}
          showAnswer={showAnswer}
        />
      );
    case "posicionesAula":
      return (
        <QuestionRenderer
          question={ex.question}
          answer={ex.answer}
          showAnswer={showAnswer}
          detail={`${ex.object} / ${ex.container} / ${ex.position}`}
        />
      );
    case "rutaCuadricula":
      return (
        <QuestionRenderer
          question={`Ve de (${ex.start.x},${ex.start.y}) a (${ex.end.x},${ex.end.y}) en una cuadrícula ${ex.gridSize.cols}×${ex.gridSize.rows}.`}
          answer={ex.answer}
          showAnswer={showAnswer}
        />
      );
    case "laberintoMatematico":
      return (
        <QuestionRenderer
          question={ex.question || `Laberinto: empieza en ${ex.start} (${ex.mode})`}
          answer={ex.correctFin}
          showAnswer={showAnswer}
        />
      );
    case "balanza":
      return (
        <QuestionRenderer
          question={ex.question}
          answer={ex.answer}
          showAnswer={showAnswer}
          detail={`${ex.leftText}  vs  ${ex.rightText}`}
        />
      );
    case "numeracion1119":
      return (
        <QuestionRenderer
          question={ex.question || `Número: ${ex.number}`}
          answer={ex.answer}
          showAnswer={showAnswer}
        />
      );
    case "weekDay":
    case "capacidad":
    case "ordinales":
    case "numeracion4059":
    case "numeracion6099":
    case "numeracion999":
    case "cuerpos3d":
    case "multiplicacion":
    case "simetria":
    case "probabilidad":
    case "redondeo":
    case "series3Cifras":
    case "cintaMetrica":
    case "circuloCircunferencia":
    case "intervalosTiempo":
    case "elKilo":
    case "elLitro":
    case "vecinosNumero":
    case "seriesNumericas":
    case "amigos10":
    case "lecturaNumeros":
    case "dobleYMitad":
    case "abaco3Cifras":
    case "algoritmo3Cifras":
    case "graficoBarras":
    case "menuCafeteria":
    case "monedasBilletes":
    case "inventarProblema":
      return (
        <QuestionRenderer
          question={"question" in ex ? ex.question : ""}
          answer={formatAnswer("answer" in ex ? ex.answer : undefined)}
          showAnswer={showAnswer}
        />
      );
    default:
      return <DefaultRenderer ex={ex} showAnswer={showAnswer} />;
  }
}
