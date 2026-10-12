import type { BalanzaPlateSheet, BalanzaSheetExercise } from "../../types";

export interface BalanzaRendererProps {
  ex: BalanzaSheetExercise;
  showAnswer: boolean;
}

function Plate({ plate }: { plate: BalanzaPlateSheet }): JSX.Element {
  // Plato desconocido (expert): bandeja vacía, sin revelar la respuesta.
  if (plate.unknown) {
    return <div className="ficha-balanza__plate" aria-label="Plato desconocido" />;
  }
  const n = Math.max(0, plate.count);
  const blocks = Math.max(0, plate.weightBlocks ?? 0);
  const blocksLabel = plate.weightBlocksLabel || (blocks > 0 ? `${blocks} kg` : null);
  const hasObject = n > 0;
  const hasBlocks = blocks > 0;

  return (
    <div className={`ficha-balanza__plate${hasBlocks ? " ficha-balanza__plate--split" : ""}`}>
      {hasObject ? (
        <div className="ficha-balanza__group">
          <div className="ficha-balanza__emojis">
            {Array.from({ length: n }, (_, i) => (
              <span key={`o-${i}`}>{plate.emoji || "⬜"}</span>
            ))}
          </div>
          {plate.weightLabel ? (
            <span className="ficha-balanza__label">{plate.weightLabel}</span>
          ) : null}
        </div>
      ) : null}
      {hasBlocks ? (
        <div className="ficha-balanza__group">
          <div className="ficha-balanza__emojis">
            {Array.from({ length: blocks }, (_, i) => (
              <span key={`w-${i}`} aria-label="Pesa de 1 kg">
                🧱
              </span>
            ))}
          </div>
          {blocksLabel ? <span className="ficha-balanza__label">{blocksLabel}</span> : null}
        </div>
      ) : null}
      {!hasObject && !hasBlocks && plate.weightLabel ? (
        <span className="ficha-balanza__label">{plate.weightLabel}</span>
      ) : null}
    </div>
  );
}

export function BalanzaRenderer({ ex, showAnswer }: BalanzaRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-balanza">
        <p className="ficha-balanza__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

  const showScale = ex.showScale !== false;
  const tiltClass =
    showScale && ex.tilt === "left"
      ? "ficha-balanza__beam--left"
      : showScale && ex.tilt === "right"
        ? "ficha-balanza__beam--right"
        : "";
  const choices = ex.choiceLabels ?? [];
  const showChoices = choices.length > 0;
  const questionHint = showChoices
    ? "(redondea la correcta)"
    : ex.writeHint
      ? "(escribe el número correcto)"
      : null;

  return (
    <div className="ficha-balanza">
      <p className="ficha-balanza__question">
        {ex.question}
        {questionHint ? (
          <>
            {" "}
            <span className="ficha-balanza__round-hint">{questionHint}</span>
          </>
        ) : null}
      </p>
      {showScale ? (
        <div className="ficha-balanza__scale" aria-label="Balanza">
          <div className={`ficha-balanza__beam ${tiltClass}`.trim()}>
            <Plate plate={ex.left} />
            <div className="ficha-balanza__fulcrum" aria-hidden="true" />
            <Plate plate={ex.right} />
          </div>
        </div>
      ) : (
        <div className="ficha-balanza__compare" aria-label="Comparación de pesos">
          <Plate plate={ex.left} />
          <span className="ficha-balanza__vs" aria-hidden>
            vs
          </span>
          <Plate plate={ex.right} />
        </div>
      )}
      {showChoices ? (
        <div className="ficha-balanza__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-balanza__choice">
              <span className="ficha-balanza__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : null}
      {ex.variant === "equilibra" && ex.targetKg !== undefined && (
        <p className="ficha-balanza__hint">Escribe las pesas para sumar {ex.targetKg} kg</p>
      )}
    </div>
  );
}
