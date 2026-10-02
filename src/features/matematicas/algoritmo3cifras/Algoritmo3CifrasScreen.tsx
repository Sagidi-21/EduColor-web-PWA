import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./Algoritmo3CifrasScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: Algoritmo3Exercise[];
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

/** Una cifra del algoritmo. El cero se escribe, no se deja en blanco. */
function DigitCell({ value }: { value: number }): JSX.Element {
  return <span className="a3c__cell">{value}</span>;
}

/**
 * La operación escrita en columnas, con la fila de llevadas ya resuelta.
 *
 * `revealed` muestra el resultado en la rejilla en cuanto el niño contesta, lo
 * haya acertado o no. Es lo mismo que hacía Electron: la fila de llevadas ya
 * venía resuelta de fábrica, así que la única información que el niño tiene que
 * deducir es la última cifra, y mostrarla al fallar sirve de corrección. Como
 * los botones quedan bloqueados hasta que se pulse "Reintentar", y reintentar
 * marca `alreadyFailed`, ver el resultado no permite sacar buena nota después.
 */
function AlgoritmoDisplay({
  exercise,
  revealed,
}: {
  exercise: Algoritmo3Exercise;
  revealed: boolean;
}): JSX.Element {
  const cifrasA = [exercise.aC, exercise.aD, exercise.aU];
  const cifrasB = [exercise.bC, exercise.bD, exercise.bU];
  const cifrasR: (number | null)[] = revealed
    ? [
        Math.floor(exercise.result / 100),
        Math.floor((exercise.result % 100) / 10),
        exercise.result % 10,
      ]
    : [null, null, null];

  return (
    <div className="a3c__algo">
      <div className="a3c__header-row">
        <span className="a3c__hueco" />
        {["C", "D", "U"].map((c) => (
          <span key={c} className="a3c__cell a3c__cell--label">
            {c}
          </span>
        ))}
      </div>

      {/* La fila de llevadas solo tiene sentido sumando: restar no "lleva", sino
          que se presta, y Electron no lo dibujaba. */}
      {exercise.op === "+" && (
        <div className="a3c__row" data-testid="a3c-fila-llevadas">
          <span className="a3c__hueco a3c__hueco--op" />
          <span className="a3c__carry">{exercise.carryDC ? "1" : ""}</span>
          <span className="a3c__carry">{exercise.carryUD ? "1" : ""}</span>
          <span className="a3c__carry" />
        </div>
      )}

      <div className="a3c__row">
        <span className="a3c__hueco a3c__hueco--op" />
        {cifrasA.map((v, i) => (
          <DigitCell key={`a-${i}`} value={v} />
        ))}
      </div>

      <div className="a3c__row">
        <span className="a3c__op-symbol">{exercise.op === "+" ? "+" : "−"}</span>
        {cifrasB.map((v, i) => (
          <DigitCell key={`b-${i}`} value={v} />
        ))}
      </div>

      <div className="a3c__divider" />

      <div className="a3c__row">
        <span className="a3c__hueco a3c__hueco--op" />
        {cifrasR.map((v, i) => (
          <span
            key={`r-${i}`}
            className={`a3c__result-cell ${v === null ? "a3c__result-cell--blank" : ""}`}
          >
            {v !== null ? v : "?"}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Migra 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/algoritmo3cifras/Algoritmo3CifrasRenderer.tsx`.
 *
 * La mecánica es la de Electron: **opción múltiple**, no tecleo. Se elige entre
 * cuatro resultados, así que no monta Numpad ni casillas; añadir un teclado
 * numérico sería cambiar la actividad, no migrarla. El hueco del signo y el de
 * las llamadas pasan a ser clases de CSS en vez de estilos en línea, para que el
 * ancho de columna no se pueda desincronizar del resto de la rejilla.
 *
 * El resto de diferencias son las de siempre: la semilla llega por props y
 * "Repetir" la reutiliza, el autoavance baja de 1300 ms a los 900 ms
 * unificados, y cabecera, resumen y acciones son los componentes compartidos.
 */
export function Algoritmo3CifrasScreen({
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

  // La sesión siempre trae ejercicios, pero un `render` sin ellos dejaría la
  // pantalla en blanco sin explicación. Se muestra el motivo y la salida.
  if (!current) {
    return (
      <div className="a3c a3c--vacio" role="alert">
        <p className="a3c__vacio-texto">No hay ningún ejercicio que mostrar en esta sesión.</p>
        <button type="button" className="a3c__btn" onClick={handleRestart}>
          🔄 Generar otra
        </button>
      </div>
    );
  }

  /** Estado visual de una opción: correcto, fallado o sin tocar. */
  const estado = (opcion: string): "idle" | "correct" | "wrong" => {
    if (session.answerState === "correct" && opcion === current.correctAnswer) return "correct";
    if (session.answerState === "wrong" && opcion === session.selectedAnswer) return "wrong";
    return "idle";
  };

  return (
    <div className={`a3c ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`a3c__stage a3c__stage--${session.answerState}`}>
        {session.answerState === "correct" && <div className="a3c__cheer">¡Correcto! ⭐</div>}

        <AlgoritmoDisplay exercise={current} revealed={session.answerState !== "idle"} />

        <p className="a3c__question">{current.question}</p>

        <div className="a3c__options">
          {current.options.map((opcion) => (
            <button
              key={opcion}
              type="button"
              id={`a3c-opt-${opcion}`}
              data-value={opcion}
              className={`a3c__opt a3c__opt--${estado(opcion)}`}
              onClick={() => handleAnswer(opcion)}
              disabled={session.answerState !== "idle"}
            >
              {opcion}
            </button>
          ))}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
