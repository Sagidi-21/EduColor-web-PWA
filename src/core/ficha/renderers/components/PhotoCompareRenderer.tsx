import type { ElKiloSheetExercise, ElLitroSheetExercise } from "../../types";

export type PhotoCompareSheetExercise = ElKiloSheetExercise | ElLitroSheetExercise;

export interface PhotoCompareRendererProps {
  ex: PhotoCompareSheetExercise;
  showAnswer: boolean;
}

function capName(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * elKilo / elLitro alumno:
 * - 1 imagen: pregunta + referencia a la dcha.; foto grande centrada debajo.
 * - 2 imágenes: pregunta (+ ref); fotos debajo con gap.
 * - Opciones MC si vienen (classify); which-more/less sin opciones (nombre bajo foto).
 * Soluciones: SOLO la respuesta (sin enunciado ni imágenes).
 */
export function PhotoCompareRenderer({ ex, showAnswer }: PhotoCompareRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const layout = ex.items.length <= 1 ? "one" : "two";
  const refLabel = ex.kind === "elKilo" ? "1 kg" : "1 L";
  const showHint = choices.length > 0;

  return (
    <div className={`ficha-photo ficha-photo--${ex.kind} ficha-photo--${layout}`}>
      <div className="ficha-photo__header">
        <p className="ficha-photo__question">
          {ex.question}
          {showHint ? (
            <>
              {" "}
              <span className="ficha-photo__hint">(redondea la correcta)</span>
            </>
          ) : null}
        </p>
        {ex.referenceUrl ? (
          <div className="ficha-photo__ref">
            <img src={ex.referenceUrl} alt="Referencia" className="ficha-photo__ref-img" />
            <span>{refLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="ficha-photo__items">
        {ex.items.map((item, i) => (
          <div key={i} className="ficha-photo__card">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={capName(item.name)} className="ficha-photo__img" />
            ) : (
              <span className="ficha-photo__placeholder" />
            )}
            <span className="ficha-photo__name">{capName(item.name)}</span>
          </div>
        ))}
      </div>

      {choices.length > 0 ? (
        <div className="ficha-photo__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-photo__choice">
              <span className="ficha-photo__choice-mark" aria-hidden>
                •
              </span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
