import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/balanza";
import type { BalanzaExercise, BalanzaPlate, BalanzaTilt } from "../../../core/activities/balanza";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./BalanzaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: BalanzaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selectedAnswer: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/** Espera antes de pasar al siguiente ejercicio cuando el alumno acierta. */
const AUTOAVANCE_MS = 900;

// ── Geometría de la balanza ─────────────────────────────────────────────────
// El `viewBox` es fijo y todas las medidas salen de ahí, para que el dibujo
// escale con el contenedor sin tener que recalcular nada.

const VIEW = { w: 600, h: 400 };
/** Altura del fulcro, en coordenadas del `viewBox`. */
const PIVOT_Y = 110;
/** Media longitud del brazo, en coordenadas del `viewBox`. */
const ARM = 210;
/** Cuánto baja el plato respecto al extremo del brazo. */
const PLATE_DROP = 110;
/** Inclinación máxima en grados. */
const MAX_TILT_DEG = 9;
/** Radio (viewBox) para soltar la pesa sobre el plato derecho en hard. */
const DROP_RADIUS = 130;

interface Punto {
  x: number;
  y: number;
}

interface Geometria {
  izquierda: Punto;
  derecha: Punto;
  /** Centro de cada plato, que es donde se colocan los objetos. */
  centroIzquierdo: Punto;
  centroDerecho: Punto;
  grados: number;
}

/** Desplazamiento del token respecto a su sitio en el muelle (px de pantalla). */
interface DragDelta {
  x: number;
  y: number;
}

/** Plato derecho vacío mientras la pesa de hard sigue en el muelle. */
const EMPTY_RIGHT: BalanzaPlate = {
  emoji: "🧱",
  count: 0,
  weightLabel: null,
  unknown: false,
};

/**
 * Coloca los extremos del brazo según la inclinación.
 *
 * El brazo rota alrededor del fulcro, y los platos cuelgan de los extremos
 * siempre en vertical: una balanza real no saca los platos de la plomada,
 * por muy inclinada que esté.
 */
function geometria(tilt: BalanzaTilt): Geometria {
  const grados = tilt === "left" ? MAX_TILT_DEG : tilt === "right" ? -MAX_TILT_DEG : 0;
  const rad = (grados * Math.PI) / 180;
  const cx = VIEW.w / 2;

  // `left` significa que pesa más la izquierda, así que ese extremo baja.
  const izquierda: Punto = {
    x: cx - ARM * Math.cos(rad),
    y: PIVOT_Y + ARM * Math.sin(rad),
  };
  const derecha: Punto = {
    x: cx + ARM * Math.cos(rad),
    y: PIVOT_Y - ARM * Math.sin(rad),
  };

  return {
    izquierda,
    derecha,
    centroIzquierdo: { x: izquierda.x, y: izquierda.y + PLATE_DROP },
    centroDerecho: { x: derecha.x, y: derecha.y + PLATE_DROP },
    grados,
  };
}

/** Texto alternativo del dibujo, para quien no ve la balanza. */
function descripcionDe(tilt: BalanzaTilt): string {
  if (tilt === "left") return "Balanza inclinada: el plato izquierdo baja más que el derecho";
  if (tilt === "right") return "Balanza inclinada: el plato derecho baja más que el izquierdo";
  return "Balanza equilibrada: los dos platos están a la misma altura";
}

/**
 * Cliente → viewBox respetando letterboxing (`preserveAspectRatio: meet`).
 * El mapeo lineal por `getBoundingClientRect` desfasa el cursor si el SVG
 * no estira el viewBox a todo el rectángulo.
 */
/** Zoom del `body` (la app lo pone a 1.5 por defecto en configuración). */
function bodyZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.body).zoom) || 1;
}

function toSvg(clientX: number, clientY: number, svg: SVGSVGElement): Punto {
  const ctm = svg.getScreenCTM?.();
  if (ctm) {
    try {
      const local = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      return { x: local.x, y: local.y };
    } catch {
      /* jsdom / entornos sin CTM completo */
    }
  }
  const r = svg.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * VIEW.w,
    y: ((clientY - r.top) / r.height) * VIEW.h,
  };
}

/** Anchura del plato. Los dos cuelgan del mismo punto, así que comparten todo. */
const PLATE_ANCHO = 150;
/** Separación entre emojis en la rejilla del plato (coordenadas del viewBox). */
const OBJ_GAP = 48;
/** Altura de cada fila sobre el plato. */
const OBJ_ROW = 46;

/** Rejilla centrada horizontalmente sobre `cx`, apilada hacia arriba desde `baseY`. */
function gridSlots(count: number, cx: number, baseY: number, gapX: number, gapY: number): Punto[] {
  if (count <= 0) return [];
  const porFila = count > 3 ? Math.ceil(count / 2) : count;
  const slots: Punto[] = [];
  for (let i = 0; i < count; i++) {
    const columna = i % porFila;
    const fila = Math.floor(i / porFila);
    const enFila = Math.min(porFila, count - fila * porFila);
    const rowWidth = (enFila - 1) * gapX;
    const x = cx - rowWidth / 2 + columna * gapX;
    const y = baseY - fila * gapY;
    slots.push({ x, y });
  }
  return slots;
}

/**
 * Un plato de la balanza: donde se dibujan los objetos y, si los hay, las pesas
 * de referencia. Si `unknown`, la bandeja queda vacía (nivel experto).
 */
function Plato({
  centro,
  lado,
  plate,
}: {
  centro: Punto;
  lado: "left" | "right";
  plate: BalanzaPlate;
}): JSX.Element {
  const izquierda = centro.x - PLATE_ANCHO / 2;
  const weightBlocks = Math.max(0, plate.weightBlocks ?? 0);
  const blocksLabel = plate.weightBlocksLabel || (weightBlocks > 0 ? `${weightBlocks} kg` : null);
  // Expert con pesas: dos columnas (fruta | ladrillos); si no, una sola rejilla.
  const split = weightBlocks > 0 && plate.count > 0;
  const colObjX = split ? izquierda + 38 : centro.x;
  const colBlkX = split ? izquierda + PLATE_ANCHO - 38 : centro.x;
  const baseY = centro.y - 18;
  const objectSlots = gridSlots(
    plate.unknown ? 0 : plate.count,
    colObjX,
    baseY,
    split ? 36 : OBJ_GAP,
    OBJ_ROW,
  );
  const blockSlots = gridSlots(
    plate.unknown ? 0 : weightBlocks,
    colBlkX,
    baseY,
    split ? 28 : OBJ_GAP,
    OBJ_ROW,
  );

  return (
    <g className="blz__plato">
      {/* Colgadores: van del extremo del brazo a las dos puntas del plato. */}
      <line
        x1={centro.x}
        y1={centro.y - PLATE_DROP}
        x2={izquierda + 14}
        y2={centro.y}
        className="blz__colgador"
      />
      <line
        x1={centro.x}
        y1={centro.y - PLATE_DROP}
        x2={izquierda + PLATE_ANCHO - 14}
        y2={centro.y}
        className="blz__colgador"
      />
      {/* El plato: una bandeja con borde, no una línea, para que se lean los
          objetos que van encima. */}
      <rect
        x={izquierda}
        y={centro.y - 6}
        width={PLATE_ANCHO}
        height={16}
        rx={8}
        className="blz__bandeja"
      />

      {/* Plato desconocido (expert): bandeja vacía, sin revelar la respuesta. */}
      {!plate.unknown && (
        <>
          {objectSlots.map((slot, i) => (
            <text
              key={`o-${i}`}
              x={slot.x}
              y={slot.y}
              textAnchor="middle"
              dominantBaseline="auto"
              className="blz__objeto"
              data-lado={lado}
            >
              {plate.emoji}
            </text>
          ))}
          {split && plate.weightLabel ? (
            <text x={colObjX} y={centro.y + 34} textAnchor="middle" className="blz__pesa">
              {plate.weightLabel}
            </text>
          ) : null}
          {blockSlots.map((slot, i) => (
            <text
              key={`w-${i}`}
              x={slot.x}
              y={slot.y}
              textAnchor="middle"
              className="blz__objeto"
              data-lado={lado}
            >
              🧱
            </text>
          ))}
          {split && blocksLabel ? (
            <text x={colBlkX} y={centro.y + 34} textAnchor="middle" className="blz__pesa">
              {blocksLabel}
            </text>
          ) : null}
          {!split && plate.weightLabel ? (
            <text x={centro.x} y={centro.y + 34} textAnchor="middle" className="blz__pesa">
              {plate.weightLabel}
            </text>
          ) : null}
        </>
      )}
    </g>
  );
}

/** La balanza completa: pie, brazo, platos y objetos. */
function BalanzaDibujo({
  exercise,
  tilt,
  rightPlate,
  svgRef,
  onMove,
  onUp,
}: {
  exercise: BalanzaExercise;
  tilt: BalanzaTilt;
  rightPlate: BalanzaPlate;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onMove: (e: React.PointerEvent) => void;
  onUp: () => void;
}): JSX.Element {
  const g = useMemo(() => geometria(tilt), [tilt]);

  return (
    <svg
      ref={svgRef}
      className="blz__svg"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-label={descripcionDe(tilt)}
      data-tilt={tilt}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {/* Pie: el triángulo del soporte y su base. */}
      <path
        d={`M ${VIEW.w / 2 - 16} 330 L ${VIEW.w / 2} ${PIVOT_Y} L ${VIEW.w / 2 + 16} 330 Z`}
        className="blz__soporte"
      />
      <rect x={VIEW.w / 2 - 55} y={330} width={110} height={22} rx={8} className="blz__base" />

      {/* Brazo y fulcro. */}
      <line
        x1={g.izquierda.x}
        y1={g.izquierda.y}
        x2={g.derecha.x}
        y2={g.derecha.y}
        className="blz__brazo"
      />
      <circle cx={VIEW.w / 2} cy={PIVOT_Y} r={11} className="blz__fulcro" />

      <Plato centro={g.centroIzquierdo} lado="left" plate={exercise.left} />
      <Plato centro={g.centroDerecho} lado="right" plate={rightPlate} />
    </svg>
  );
}

export function BalanzaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedAnswer: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  /** En hard: la pesa empieza fuera y hay que soltarla en el plato derecho. */
  const [weightPlaced, setWeightPlaced] = useState(false);
  /** Mueve la propia pesa: mismo delta que el puntero → sin desfase. */
  const [dragDelta, setDragDelta] = useState<DragDelta | null>(null);
  /** Posición del puntero en viewBox, para decidir si cae en el plato. */
  const dragSvgRef = useRef<Punto | null>(null);
  const dragOriginRef = useRef<Punto | null>(null);
  const draggingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const isHard = difficulty === "hard";

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        selectedAnswer: null,
        alreadyFailed: false,
      }));
      setWeightPlaced(false);
      draggingRef.current = false;
      dragOriginRef.current = null;
      dragSvgRef.current = null;
      setDragDelta(null);
    }
  }, [session, total]);

  // El original limpiaba `selected`, un campo que no existe en su estado: al
  // reintentar, el botón fallado se quedaba marcado y el alumno veía la
  // respuesta que había pulsado como si siguiera siendo la elegida.
  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedAnswer: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current) return;
      if (isHard && !weightPlaced) return;
      const isCorrect = validateAnswer(current, value);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedAnswer: value,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current, isHard, weightPlaced],
  );

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setWeightPlaced(false);
    draggingRef.current = false;
    dragOriginRef.current = null;
    dragSvgRef.current = null;
    setDragDelta(null);
    setSession({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedAnswer: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

  const syncDragSvg = useCallback((clientX: number, clientY: number) => {
    if (svgRef.current) {
      dragSvgRef.current = toSvg(clientX, clientY, svgRef.current);
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    const d = dragSvgRef.current;
    draggingRef.current = false;
    dragOriginRef.current = null;
    setDragDelta(null);
    if (!d || !current) {
      dragSvgRef.current = null;
      return;
    }
    // Con la pesa aún fuera, la balanza está nivelada: el centro del plato
    // derecho es el de `equal`.
    const g = geometria("equal");
    const sobrePlato = Math.hypot(d.x - g.centroDerecho.x, d.y - g.centroDerecho.y) < DROP_RADIUS;
    setWeightPlaced(sobrePlato);
    dragSvgRef.current = null;
  }, [current]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!isHard || session.answerState === "correct") return;
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      draggingRef.current = true;
      dragOriginRef.current = { x: e.clientX, y: e.clientY };
      setDragDelta({ x: 0, y: 0 });
      syncDragSvg(e.clientX, e.clientY);
      if (weightPlaced) setWeightPlaced(false);
    },
    [isHard, session.answerState, weightPlaced, syncDragSvg],
  );

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !dragOriginRef.current) return;
      // `clientX` está en px de pantalla; `translate` CSS lo vuelve a multiplicar
      // por el zoom del body → sin dividir, el desfase crece al mover el ratón.
      const z = bodyZoom();
      setDragDelta({
        x: (e.clientX - dragOriginRef.current.x) / z,
        y: (e.clientY - dragOriginRef.current.y) / z,
      });
      syncDragSvg(e.clientX, e.clientY);
    },
    [syncDragSvg],
  );

  const onUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        onRestart={handleRestart}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  // Una sesión vacía dejaría la pantalla en blanco sin explicación, así que se
  // dice qué pasa y se ofrece generar otra.
  if (!current) {
    return (
      <div className="blz blz--vacio" role="alert">
        <p className="blz__vacio-texto">No hay ningún ejercicio que mostrar en esta sesión.</p>
        <button type="button" className="blz__btn" onClick={handleRestart}>
          🔄 Generar otra
        </button>
      </div>
    );
  }

  /** Estado visual de una respuesta: correcto, fallado o sin tocar. */
  const estado = (value: string): "idle" | "correct" | "wrong" => {
    if (session.answerState === "correct" && value === String(current.correctAnswer))
      return "correct";
    if (session.answerState === "wrong" && value === session.selectedAnswer) return "wrong";
    return "idle";
  };

  // Hard: nivelada hasta colocar la pesa; luego se inclina según el motor.
  const displayTilt: BalanzaTilt = isHard && !weightPlaced ? "equal" : current.tilt;
  const rightPlate: BalanzaPlate = isHard && !weightPlaced ? EMPTY_RIGHT : current.right;
  const optionsLocked = isHard && !weightPlaced;
  const refLabel = current.right.weightLabel ?? "1 kg";
  const showDockToken = isHard && !weightPlaced;
  const dragging = dragDelta !== null;

  return (
    <div className="blz">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`blz__stage blz__stage--${session.answerState}`}>
        {session.answerState === "correct" && <div className="blz__celebration">¡Muy bien! ⭐</div>}

        <BalanzaDibujo
          exercise={current}
          tilt={displayTilt}
          rightPlate={rightPlate}
          svgRef={svgRef}
          onMove={onMove}
          onUp={onUp}
        />

        {isHard && (
          <div className={`blz__dock${dragging ? " blz__dock--dragging" : ""}`}>
            {showDockToken && (
              <button
                type="button"
                className={`blz__ref-token${dragging ? " blz__ref-token--dragging" : ""}`}
                aria-label={`Arrastra la pesa de ${refLabel} al plato derecho`}
                onPointerDown={startDrag}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                disabled={session.answerState === "correct"}
                style={{
                  touchAction: "none",
                  transform: dragDelta
                    ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
                    : undefined,
                }}
              >
                <span className="blz__ref-token-emoji" aria-hidden>
                  🧱
                </span>
                <span className="blz__pesa blz__pesa--dock">{refLabel}</span>
              </button>
            )}
            {weightPlaced && (
              <p className="blz__dock-hint">Pesa en el plato. Elige la respuesta.</p>
            )}
            {showDockToken && (
              <p className={`blz__dock-hint${dragging ? " blz__dock-hint--hidden" : ""}`}>
                Arrastra la pesa al plato derecho
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="blz__footer">
        <p className="blz__question">{current.question}</p>

        {session.answerState === "correct" && current.hint && (
          <p className="blz__hint">{current.hint}</p>
        )}

        <div className="blz__options">
          {current.options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              id={`blz-option-${i}`}
              data-value={opt.value}
              className={`blz__option blz__option--${estado(opt.value)}${
                optionsLocked ? " blz__option--locked" : ""
              }`}
              onClick={() => handleAnswer(opt.value)}
              disabled={session.answerState !== "idle" || optionsLocked}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
