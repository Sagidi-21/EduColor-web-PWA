import type { BalanzaPlateSheet, BalanzaSheetExercise } from "../../types";

export interface BalanzaRendererProps {
  ex: BalanzaSheetExercise;
  showAnswer: boolean;
}

function Plate({ plate }: { plate: BalanzaPlateSheet }): JSX.Element {
  if (plate.unknown) {
    return (
      <div className="ficha-balanza__plate">
        <span className="ficha-balanza__unknown">?</span>
      </div>
    );
  }
  const n = Math.max(1, plate.count);
  return (
    <div className="ficha-balanza__plate">
      <div className="ficha-balanza__emojis">
        {Array.from({ length: n }, (_, i) => (
          <span key={i}>{plate.emoji || "⬜"}</span>
        ))}
      </div>
      {plate.weightLabel && <span className="ficha-balanza__label">{plate.weightLabel}</span>}
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

  const tiltClass =
    ex.tilt === "left"
      ? "ficha-balanza__beam--left"
      : ex.tilt === "right"
        ? "ficha-balanza__beam--right"
        : "";

  return (
    <div className="ficha-balanza">
      <p className="ficha-balanza__question">{ex.question}</p>
      <div className="ficha-balanza__scale" aria-label="Balanza">
        <div className={`ficha-balanza__beam ${tiltClass}`.trim()}>
          <Plate plate={ex.left} />
          <div className="ficha-balanza__fulcrum" aria-hidden="true" />
          <Plate plate={ex.right} />
        </div>
      </div>
      {ex.variant === "equilibra" && ex.targetKg !== undefined && (
        <p className="ficha-balanza__hint">Escribe las pesas para sumar {ex.targetKg} kg</p>
      )}
    </div>
  );
}
