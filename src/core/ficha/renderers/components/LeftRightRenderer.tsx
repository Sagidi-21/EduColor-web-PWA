import type { LeftRightSheetExercise } from "../../types";

export interface LeftRightRendererProps {
  ex: LeftRightSheetExercise;
  showAnswer: boolean;
}

function Choices({ labels }: { labels: string[] }): JSX.Element {
  return (
    <div className="ficha-leftright__choices">
      {labels.map((label, i) => (
        <span key={`${label}-${i}`} className="ficha-leftright__choice">
          <span className="ficha-leftright__choice-mark" aria-hidden>
            •
          </span>
          <span className="ficha-leftright__choice-text">{label}</span>
        </span>
      ))}
    </div>
  );
}

function SideObject({
  imageUrl,
  label,
  caption,
}: {
  imageUrl: string;
  label: string;
  caption?: string;
}): JSX.Element {
  return (
    <div className="ficha-leftright__side">
      {caption ? <span className="ficha-leftright__caption">{caption}</span> : null}
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="ficha-exercise__image" />
      ) : (
        <span className="ficha-leftright__emoji">{label}</span>
      )}
    </div>
  );
}

/** Personaje entre dos cajas de mano (izquierda | personaje | derecha del papel). */
function CharScene({ ex }: { ex: LeftRightSheetExercise }): JSX.Element {
  const char = ex.char;
  const objects = ex.dragObjects ?? [];
  return (
    <>
      <div className="ficha-leftright__scene" aria-label="Escena con personaje">
        <div className="ficha-leftright__hand">
          <span className="ficha-leftright__box" />
        </div>
        {char?.imageUrl ? (
          <img src={char.imageUrl} alt={char.name} className="ficha-leftright__char" />
        ) : (
          <span className="ficha-leftright__char-name">{char?.name ?? ""}</span>
        )}
        <div className="ficha-leftright__hand">
          <span className="ficha-leftright__box" />
        </div>
      </div>
      {objects.length > 0 && (
        <div className="ficha-leftright__objects" aria-label="Objetos">
          {objects.map((obj, i) => (
            <span key={`${obj.label}-${i}`} className="ficha-leftright__object">
              {obj.imageUrl ? (
                <img src={obj.imageUrl} alt={obj.label} className="ficha-leftright__object-img" />
              ) : null}
              <span className="ficha-leftright__object-label">{obj.label}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Alumno: parejas con • (fácil → difícil) o escena de personaje imprimible (experto):
 * marcar la mano correcta (•) o unir objetos con la mano con flechas.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function LeftRightRenderer({ ex, showAnswer }: LeftRightRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  if (ex.variant && ex.variant.startsWith("char-")) {
    const isClick = ex.variant === "char-click";
    return (
      <div className="ficha-leftright ficha-leftright--char">
        <p className="ficha-leftright__question">
          {ex.question}{" "}
          {isClick ? (
            <span className="ficha-leftright__hint">(pon una «x» en el recuadro correcto)</span>
          ) : null}
        </p>
        <CharScene ex={ex} />
      </div>
    );
  }

  const choices = ex.choiceLabels ?? [];
  return (
    <div className="ficha-leftright">
      <p className="ficha-leftright__question">
        {ex.question}{" "}
        {choices.length > 0 ? (
          <span className="ficha-leftright__hint">(redondea la correcta)</span>
        ) : null}
      </p>
      <div className="ficha-leftright__pair">
        <SideObject
          imageUrl={ex.leftImgUrl}
          label={ex.leftObj}
          caption={ex.showSideLabels ? "⟵ izquierda" : undefined}
        />
        <SideObject
          imageUrl={ex.rightImgUrl}
          label={ex.rightObj}
          caption={ex.showSideLabels ? "derecha ⟶" : undefined}
        />
      </div>
      {choices.length > 0 && <Choices labels={choices} />}
    </div>
  );
}
