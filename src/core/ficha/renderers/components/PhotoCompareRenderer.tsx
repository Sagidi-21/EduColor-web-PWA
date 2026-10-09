import type { ElKiloSheetExercise, ElLitroSheetExercise } from "../../types";

export type PhotoCompareSheetExercise = ElKiloSheetExercise | ElLitroSheetExercise;

export interface PhotoCompareRendererProps {
  ex: PhotoCompareSheetExercise;
  showAnswer: boolean;
}

/** elKilo / elLitro: fotos de objetos + referencia (1 kg / 1 L). */
export function PhotoCompareRenderer({ ex, showAnswer }: PhotoCompareRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-photo">
        <p className="ficha-photo__question">{ex.question}</p>
        <div className="ficha-answer">{ex.answer ?? "?"}</div>
      </div>
    );
  }

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
    </div>
  );
}
