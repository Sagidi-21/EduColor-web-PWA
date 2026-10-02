import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { playFeedback } from "../../shared/audioFeedback";

/**
 * Emparejamiento por columnas: se toca una tarjeta de la izquierda, luego una de
 * la derecha, y la app las une con una línea si la pareja es correcta.
 *
 * Nace de `../relacionar/RelacionarScreen.tsx`, donde la interacción estaba
 * atada a "número ↔ grupo de imágenes". Aquí las dos mitades son genéricas, así
 * que `relacionar` y `multiplicacion` comparten exactamente la misma mecánica en
 * lugar de mantener dos copias que acaban divergiendo.
 *
 * Decide el componente: la selección, las líneas, el parpadeo del error y el
 * aviso de tanda completa. Decide quien lo usa: qué se pinta en cada tarjeta,
 * cómo se cuenta la nota y qué se hace al terminar.
 */

/** Un elemento emparejable. El `id` es el mismo en las dos columnas. */
export interface MatchItem {
  id: number;
}

/** Cómo ha quedado una tanda, para quien la usa la cuente. */
export interface MatchReport {
  /**
   * Parejas unidas sin fallar antes.
   *
   * No es lo mismo que las unidas: una pareja fallada parpadea en rojo y luego se
   * rehace, así que al final siempre quedan las `total` unidas y esa cuenta no
   * distinguiría un niño que acertó todo a la primera de otro quericinga lo tuvo
   * que adivinar. Lo que separa a los dos es cuántas se aciertan sin intentos.
   */
  aciertos: number;
  /** Parejas de la tanda. */
  total: number;
  /** Uniones que se equivocaron, por mucho que luego se corrigieran. */
  fallos: number;
  /** Si ya están todas las parejas unidas. */
  completa: boolean;
}

type ClaseDeLado<T> = string | ((item: T) => string);

interface MatchColumnsProps<T extends MatchItem> {
  left: readonly T[];
  right: readonly T[];
  /** Contenido de cada tarjeta de la izquierda. */
  renderLeft: (item: T) => ReactNode;
  /** Contenido de cada tarjeta de la derecha. */
  renderRight: (item: T) => ReactNode;
  /**
   * Prefijo de las clases CSS.
   *
   * Cada actividad tiene su hoja de estilos (`relacionar` y `multiplicacion` no
   * comparten nada visual), así que el componente emite `rel__item` o `mul__item`
   * según quién lo use, en vez de imponer un `match__` que obligaría a duplicar
   * los estilos.
   */
  prefix: string;
  /** Clase que distingue la tarjeta izquierda. Puede depender del elemento. */
  leftClass: ClaseDeLado<T>;
  /** Clase que distingue la derecha. Puede depender del elemento. */
  rightClass: ClaseDeLado<T>;
  /** Se llama en cada unión, acierte o falle. */
  onPair?: (correct: boolean) => void;
  /** Se llama `celebrateMs` después de completarse la tanda. */
  onComplete: (report: MatchReport) => void;
  /**
   * Clave de tanda, solo para quien no remonte el componente con `key`.
   *
   * Lo normal es montarlo con `key={indiceDeTanda}`: React lo remonta entero y el
   * estado llega a cero sin ningún efecto. Con esta propiedad el reinicio se hace
   * en un efecto, que corre *después* del pintado, así que durante ese hueco el
   * componente todavía ve las conexiones de la tanda anterior y, si estaba
   * completa, avisaría de alta dos veces. Por eso el `key` es lo recomendado.
   */
  resetKey?: unknown;
  /** Cuánto dura el "¡Muy bien!" antes de avisar de que se acabó. */
  celebrateMs?: number;
  /** Cuánto parpadea el error antes de soltar la selección. */
  wrongFlashMs?: number;
}

type Line = { id: number; x1: number; y1: number; x2: number; y2: number };

export function MatchColumns<T extends MatchItem>({
  left,
  right,
  renderLeft,
  renderRight,
  prefix,
  leftClass,
  rightClass,
  onPair,
  onComplete,
  resetKey,
  celebrateMs = 1500,
  wrongFlashMs = 700,
}: MatchColumnsProps<T>) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  /** De la izquierda emparejada a la derecha emparejada. */
  const [connections, setConnections] = useState<Map<number, number>>(new Map());
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  /** Parejas de la izquierda que alguna vez se equivocaron de pareja. */
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [lines, setLines] = useState<Line[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rightRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  /**
   * El aviso de tanda completa se dispara una sola vez.
   *
   * Va con un `ref` y no solo con la condición del efecto porque `onComplete` lo
   * escribe quien usa el componente y suele ser una función en línea: cambia de
   * identidad en cada render, y sin este guard el efecto se volvería a lanzar,
   * cancelaría el temporizador anterior y avisaría otra vez de la misma tanda.
   */
  const completedRef = useRef(false);
  const resetRef = useRef(resetKey);

  // Solo para quien no remonta con `key`.
  useEffect(() => {
    if (resetRef.current === resetKey) return;
    resetRef.current = resetKey;
    completedRef.current = false;
    setSelectedLeft(null);
    setConnections(new Map());
    setWrongPair(null);
    setCelebrating(false);
    setFailed(new Set());
    setLines([]);
    leftRefs.current.clear();
    rightRefs.current.clear();
  }, [resetKey]);

  const computeLines = useCallback(() => {
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return;
    const next: Line[] = [];
    connections.forEach((rightId, leftId) => {
      const lEl = leftRefs.current.get(leftId);
      const rEl = rightRefs.current.get(rightId);
      if (!lEl || !rEl) return;
      const lr = lEl.getBoundingClientRect();
      const rr = rEl.getBoundingClientRect();
      next.push({
        id: leftId,
        x1: lr.right - cr.left,
        y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left - cr.left,
        y2: rr.top + rr.height / 2 - cr.top,
      });
    });
    setLines(next);
  }, [connections]);

  useEffect(() => {
    computeLines();
  }, [computeLines]);

  useEffect(() => {
    window.addEventListener("resize", computeLines);
    return () => window.removeEventListener("resize", computeLines);
  }, [computeLines]);

  const complete = connections.size === left.length && left.length > 0;

  const informe = useCallback((): MatchReport => {
    const aciertos = Array.from(connections.keys()).filter((id) => !failed.has(id)).length;
    return {
      aciertos,
      total: left.length,
      fallos: failed.size,
      completa: complete,
    };
  }, [connections, failed, left.length, complete]);

  useEffect(() => {
    if (!complete || completedRef.current) return;
    completedRef.current = true;
    setCelebrating(true);
    const t = setTimeout(() => onComplete(informe()), celebrateMs);
    return () => clearTimeout(t);
    // `onComplete` va en la lista aunque cambie en cada render: es lo que
    // `completedRef` neutraliza, porque si se saliera de aquí el efecto volvería
    // a lanzar el aviso de la misma tanda.
  }, [complete, celebrateMs, informe, onComplete]);

  const handleLeftClick = (item: T) => {
    if (celebrating || wrongPair) return;
    if (connections.has(item.id)) return;
    setSelectedLeft((prev) => (prev === item.id ? null : item.id));
  };

  const handleRightClick = (item: T) => {
    if (celebrating || wrongPair || selectedLeft === null) return;
    // Una tarjeta de la derecha ya emparejada no admite una segunda unión.
    if (Array.from(connections.values()).includes(item.id)) return;

    const correct = selectedLeft === item.id;
    onPair?.(correct);

    if (!correct) {
      setFailed((prev) => new Set(prev).add(selectedLeft));
      setWrongPair([selectedLeft, item.id]);
      playFeedback(false);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, wrongFlashMs);
      return;
    }

    const next = new Map(connections);
    next.set(selectedLeft, item.id);
    setConnections(next);
    setSelectedLeft(null);
    playFeedback(true);
  };

  const rightUsados = connections;

  return (
    <>
      <div className={`${prefix}__columns`} ref={containerRef}>
        <svg className={`${prefix}__svg`} aria-hidden="true">
          {lines.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              className={`${prefix}__line`}
            />
          ))}
        </svg>

        <div className={`${prefix}__col ${prefix}__col--left`}>
          {left.map((item) => {
            const isSelected = selectedLeft === item.id;
            const isConnected = connections.has(item.id);
            const isWrong = wrongPair?.[0] === item.id;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) leftRefs.current.set(item.id, el);
                }}
                className={[
                  `${prefix}__item`,
                  typeof leftClass === "function" ? leftClass(item) : leftClass,
                  isSelected && `${prefix}__item--selected`,
                  isConnected && `${prefix}__item--connected`,
                  isWrong && `${prefix}__item--wrong`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleLeftClick(item)}
              >
                {renderLeft(item)}
              </div>
            );
          })}
        </div>

        <div className={`${prefix}__col ${prefix}__col--right`}>
          {right.map((item) => {
            const isConnected = Array.from(rightUsados.values()).includes(item.id);
            const isWrong = wrongPair?.[1] === item.id;
            // Con algo seleccionado a la espera, se insinúa lo que aún está libre.
            const isHintable = selectedLeft !== null && !isConnected && !isWrong;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) rightRefs.current.set(item.id, el);
                }}
                className={[
                  `${prefix}__item`,
                  typeof rightClass === "function" ? rightClass(item) : rightClass,
                  isConnected && `${prefix}__item--connected`,
                  isWrong && `${prefix}__item--wrong`,
                  isHintable && `${prefix}__item--hintable`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleRightClick(item)}
              >
                {renderRight(item)}
              </div>
            );
          })}
        </div>
      </div>

      {celebrating && <div className={`${prefix}__celebrate`}>¡Muy bien! 🎉</div>}
    </>
  );
}
