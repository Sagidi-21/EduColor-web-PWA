import type { ElKiloSheetExercise, ElLitroSheetExercise } from "../../types";

export type PhotoCompareSheetExercise = ElKiloSheetExercise | ElLitroSheetExercise;

export interface PhotoCompareRendererProps {
  ex: PhotoCompareSheetExercise;
  showAnswer: boolean;
}

/**
 * elKilo / elLitro alumno: pregunta + referencia (1 kg / 1 L) + fotos + • opciones.
 * Soluciones: SOLO la respuesta (sin enunciado ni imágenes).
 */
export function PhotoCompareRenderer({ ex, showAnswer }: PhotoCompareRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-photo">
      <p className="ficha-photo__question">{ex.question}</p>
      {ex.referenceUrl && (
        <div className="ficha-photo__ref">
          <img src={ex.referenceUrl} alt="Referencia" className="ficha-photo__img" />
          <span>{ex.kind === "elKilo" ? "1 kg" : "1 L"}</span>
        </div>
      )}
      <div className="ficha-photo__items">
        {ex.items.map((item, i) => (
          <div key={i} className="ficha-photo__card">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="ficha-photo__img" />
            ) : (
              <span className="ficha-photo__placeholder" />
            )}
            <span className="ficha-photo__name">{item.name}</span>
          </div>
        ))}
      </div>
      {choices.length > 0 && (
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
      )}
    </div>
  );
}
