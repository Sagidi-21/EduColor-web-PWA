import { LazyDigitCell } from "../../shared/DigitCell";
import type { DigitOrder } from "./useDigitBoxes";
import "./DigitBoxes.css";

interface Props {
  length: number;
  values: string[];
  activeIndex: number;
  order: DigitOrder;
  state: "idle" | "correct" | "wrong";
  mode: "numpad" | "canvas";
  onSelect: (index: number) => void;
  /** Escribe una cifra en la casilla activa y avanza. Lo llama el numpad y el lienzo. */
  onDigit: (digit: string) => void;
  /** Borra en la casilla activa. Lo llama el numpad y la tecla de borrar del lienzo. */
  onDelete: () => void;
  /** Cambia al escribir con el lienzo, para forzar el remontaje del canvas. */
  canvasKey: number;
  /** Texto que se ve al acertar, sustituyendo a las casillas. */
  correctText?: string;
  /** Etiqueta de cada casilla, por ejemplo "D" y "U" en las operaciones. */
  labels?: string[];
}

/**
 * Fila de casillas, una por cifra, con la casilla activa resaltada.
 *
 * El aspecto reutiliza la clase `ops__answer-box` que ya usaba la casilla unica,
 * de modo que visualmente la actividad no cambia: lo que cambia es que ahora hay
 * una casilla por cifra y se ve en que posicion va cada una.
 */
export function DigitBoxes({
  length,
  values,
  activeIndex,
  order,
  state,
  mode,
  onSelect,
  onDigit,
  onDelete,
  canvasKey,
  correctText,
  labels,
}: Props) {
  // El orden de escritura no cambia el orden en que se muestran: una casilla
  // esta siempre donde va su cifra. Solo cambia por donde se empieza y hacia
  // donde se avanza, que es cosa del hook.
  void order;

  const solved = state === "correct";

  return (
    <div className="ops__answer-boxes" data-order={order}>
      {Array.from({ length }, (_, i) => {
        const isActive = state === "idle" && i === activeIndex;
        const valor = solved ? (correctText ?? values[i]) : values[i];

        const clase = `ops__answer-box ${
          state === "correct"
            ? "ops__answer-box--correct"
            : state === "wrong"
              ? "ops__answer-box--wrong"
              : ""
        }${isActive ? " ops__answer-box--active" : ""}`;

        return (
          <div key={i} className="ops__answer-slot">
            {isActive && mode === "canvas" && state === "idle" ? (
              <LazyDigitCell
                key={`canvas-${i}-${canvasKey}`}
                isActive
                onActivate={() => onSelect(i)}
                onConfirm={onDigit}
                onClear={onDelete}
                state={state}
                value={values[i]}
              />
            ) : (
              <div className={clase} onClick={() => onSelect(i)} role="presentation" data-slot={i}>
                {valor || <span className="ops__cursor">_</span>}
              </div>
            )}
            {labels?.[i] && <span className="ops__answer-label">{labels[i]}</span>}
          </div>
        );
      })}
    </div>
  );
}
