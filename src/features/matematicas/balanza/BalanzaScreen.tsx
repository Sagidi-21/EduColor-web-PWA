import { useCallback, useEffect, useMemo, useState } from "react";
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

/** Anchura del plato. Los dos cuelgan del mismo punto, así que comparten todo. */
const PLATE_ANCHO = 150;

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
  const objects = Array.from({ length: plate.count }, (_, i) => i);
  const weightBlocks = Math.max(0, plate.weightBlocks ?? 0);
  const blocksLabel = plate.weightBlocksLabel || (weightBlocks > 0 ? `${weightBlocks} kg` : null);
  // Expert con pesas: dos columnas (fruta | ladrillos); si no, una sola rejilla.
  const split = weightBlocks > 0 && plate.count > 0;
  const colObjX = split ? izquierda + 36 : izquierda + PLATE_ANCHO / 2;
  const colBlkX = izquierda + PLATE_ANCHO - 36;

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
          {objects.map((i) => {
            const porFila =
              !split && plate.count > 3 ? Math.ceil(plate.count / 2) : plate.count || 1;
            const columna = i % porFila;
            const fila = Math.floor(i / porFila);
            const x = split ? colObjX : izquierda + 8 + 12 + columna * (porFila === 1 ? 0 : 44);
            const y = centro.y - 8 - 22 - fila * 30;
            return (
              <text
                key={`o-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                className="blz__objeto"
                data-lado={lado}
              >
                {plate.emoji}
              </text>
            );
          })}
          {split && plate.weightLabel ? (
            <text x={colObjX} y={centro.y + 34} textAnchor="middle" className="blz__pesa">
              {plate.weightLabel}
            </text>
          ) : null}
          {Array.from({ length: weightBlocks }, (_, i) => {
            const porFila = weightBlocks > 3 ? Math.ceil(weightBlocks / 2) : weightBlocks;
            const columna = i % porFila;
            const fila = Math.floor(i / porFila);
            const x = split
              ? colBlkX + (porFila === 1 ? 0 : (columna - (porFila - 1) / 2) * 28)
              : izquierda + 8 + 12 + columna * (porFila === 1 ? 0 : 44);
            const y = centro.y - 8 - 22 - fila * 30;
            return (
              <text
                key={`w-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                className="blz__objeto"
                data-lado={lado}
              >
                🧱
              </text>
            );
          })}
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
function BalanzaDibujo({ exercise }: { exercise: BalanzaExercise }): JSX.Element {
  const g = useMemo(() => geometria(exercise.tilt), [exercise.tilt]);

  return (
    <svg
      className="blz__svg"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-label={descripcionDe(exercise.tilt)}
      data-tilt={exercise.tilt}
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
      <Plato centro={g.centroDerecho} lado="right" plate={exercise.right} />
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

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

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
      const isCorrect = validateAnswer(current, value);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedAnswer: value,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
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

  return (
    <div className={`blz ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`blz__stage blz__stage--${session.answerState}`}>
        {session.answerState === "correct" && <div className="blz__celebration">¡Muy bien! ⭐</div>}

        <BalanzaDibujo exercise={current} />
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
              className={`blz__option blz__option--${estado(opt.value)}`}
              onClick={() => handleAnswer(opt.value)}
              disabled={session.answerState !== "idle"}
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
