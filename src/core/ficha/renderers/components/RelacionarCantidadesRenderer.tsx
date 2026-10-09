import { representacion } from "../../../activities/relacionarCantidades";
import type { RelacionarCantidadesSheetExercise } from "../../types";

export interface RelacionarCantidadesRendererProps {
  ex: RelacionarCantidadesSheetExercise;
  showAnswer: boolean;
}

function CantidadBlocks({
  total,
  imageUrl,
  rotulo,
}: {
  total: number;
  imageUrl: string;
  rotulo?: string;
}): JSX.Element {
  const { centenas, decenas, unidades } = representacion(total);
  return (
    <div className="ficha-relcant__cantidad">
      {rotulo && <span className="ficha-relcant__rotulo">{rotulo}</span>}
      <div className="ficha-relcant__figuras">
        {(centenas > 0 || decenas > 0) && (
          <div className="ficha-relcant__cajas">
            {Array.from({ length: centenas }, (_, c) => (
              <div key={`c${c}`} className="ficha-relcant__bloque ficha-relcant__bloque--cien">
                {imageUrl ? <img src={imageUrl} alt="" className="ficha-relcant__img" /> : null}
                <span className="ficha-relcant__bloque-rotulo">×100</span>
              </div>
            ))}
            {Array.from({ length: decenas }, (_, d) => (
              <div key={`d${d}`} className="ficha-relcant__bloque">
                {imageUrl ? <img src={imageUrl} alt="" className="ficha-relcant__img" /> : null}
                <span className="ficha-relcant__bloque-rotulo">×10</span>
              </div>
            ))}
          </div>
        )}
        {unidades > 0 && (
          <div className="ficha-relcant__unidades">
            {Array.from({ length: unidades }, (_, u) =>
              imageUrl ? (
                <img key={u} src={imageUrl} alt="" className="ficha-relcant__img" />
              ) : (
                <span key={u} className="ficha-relcant__dot" />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RelacionarCantidadesRenderer({
  ex,
  showAnswer,
}: RelacionarCantidadesRendererProps): JSX.Element {
  if (showAnswer) {
    return (
      <div className="ficha-relcant ficha-relcant--soluciones">
        <p className="ficha-relcant__instruction">Une cada situación con su cantidad</p>
        <div className="ficha-answer">{(ex.answer ?? []).join(" · ")}</div>
      </div>
    );
  }

  return (
    <div className="ficha-relcant">
      <p className="ficha-relcant__instruction">Une cada situación con su cantidad</p>
      <div className="ficha-relcant__board">
        <div className="ficha-relcant__left">
          {ex.left.map((item) => (
            <div key={item.id} className="ficha-relcant__card">
              <span className="ficha-relcant__text">{item.text}</span>
              {item.cantidades.map((c, i) => (
                <CantidadBlocks key={i} total={c.total} imageUrl={ex.imageUrl} rotulo={c.rotulo} />
              ))}
              <span className="ficha-relcant__dot-end" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="ficha-relcant__gap" aria-hidden="true" />
        <div className="ficha-relcant__right">
          {ex.right.map((item) => (
            <div key={item.id} className="ficha-relcant__card ficha-relcant__card--right">
              <span className="ficha-relcant__dot-start" aria-hidden="true" />
              <span className="ficha-relcant__letter">{item.letter}</span>
              <span className="ficha-relcant__text">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
