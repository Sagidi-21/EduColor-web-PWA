import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/intervalosTiempo";
import type { IntervalosTiempoExercise } from "../../../core/activities/intervalosTiempo";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../operations/OperationsScreen.css";
import "./IntervalosTiempoScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: IntervalosTiempoExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Rótulo pulsado. En `classify-hour` es una de las dos frases. */
  selectedAnswer: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/** Espera antes de pasar al siguiente ejercicio cuando el alumno acierta. */
const AUTOAVANCE_MS = 900;

/**
 * Migra 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/intervalosTiempo/IntervalosTiempoRenderer.tsx`.
 *
 * Tres diferencias, todas deliberadas:
 *
 * 1. La semilla llega por props (`seed`) en vez de calcularse con
 *    `Date.now() % 999983` dentro del componente. "Repetir" regenera la sesión
 *    con esa misma semilla congelada, así que la segunda vuelta es idéntica a la
 *    primera en lugar de ser una tirada nueva.
 * 2. El resumen, la cabecera y los botones de reintentar/siguiente son los
 *    componentes compartidos, no los equivalentes propios de Electron.
 * 3. El enunciado se muestra tal cual lo genera el núcleo, con las dos
 *    duraciones entre paréntesis. Electron lo recortaba a "¿Cuál dura más?" y
 *    dejaba las etiquetas solo en las tarjetas: aquí la pregunta completa, que ya
 *    dice cuánto dura cada cosa.
 */
export function IntervalosTiempoScreen({
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

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const esClasificacion = current.type === "classify-hour";

  /** Estado visual de una tarjeta de actividad: correcto, fallado o sin tocar. */
  const estado = (nombre: string): "idle" | "correct" | "wrong" => {
    if (session.answerState === "idle") return "idle";
    if (nombre.toLowerCase() === current.correctAnswer.toLowerCase()) return "correct";
    if (nombre.toLowerCase() === session.selectedAnswer?.toLowerCase()) return "wrong";
    return "idle";
  };

  /**
   * Ancho de la barra de una actividad respecto a la más larga de las dos.
   * En `classify-hour` la referencia es la hora, porque lo que se compara es si
   * la actividad supera esa hora, no contra otra actividad.
   */
  const anchoBarra = (segundos: number, referencia: number) =>
    `${Math.max(0, Math.min(100, (segundos / referencia) * 100))}%`;

  const referencia = esClasificacion
    ? current.activities[0].seconds
    : Math.max(current.activities[0].seconds, current.activities[1].seconds);

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  return (
    <div className={`ops itm ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ops__stage ${stageClass}`}>
        <p className="itm__question">{current.question}</p>

        {esClasificacion ? (
          <>
            <div className="itm__single">
              <span className="itm__single-emoji">{current.activities[0].emoji}</span>
              <span className="itm__single-name">{current.activities[0].name}</span>
              <span className="itm__activity-time">{current.activities[0].label}</span>
            </div>

            {current.showBars && (
              <div className="itm__bars itm__bars--single">
                <div className="itm__bar-row">
                  <span className="itm__bar-icon">{current.activities[0].emoji}</span>
                  <div
                    className="itm__bar"
                    style={{ width: anchoBarra(current.activities[0].seconds, 3600) }}
                  />
                </div>
                <div className="itm__bar-row">
                  <span className="itm__bar-icon">⏱️</span>
                  <div className="itm__bar itm__bar--ref" style={{ width: "100%" }} />
                  <span className="itm__bar-label">1 hora</span>
                </div>
              </div>
            )}

            <div className="itm__classify-opts">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  id={`itm-classify-${opt.startsWith("Más") ? "mas" : "menos"}`}
                  data-value={opt}
                  className={`itm__classify-btn itm__classify-btn--${estado(opt)}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={session.answerState !== "idle"}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="itm__compare">
              {current.activities.map((act) => (
                <button
                  key={act.name}
                  type="button"
                  id={`itm-activity-${act.name.replace(/\s+/g, "-")}`}
                  data-name={act.name}
                  className={`itm__activity itm__activity--${estado(act.name)}`}
                  onClick={() => handleAnswer(act.name.charAt(0).toUpperCase() + act.name.slice(1))}
                  disabled={session.answerState !== "idle"}
                >
                  <span className="itm__activity-emoji">{act.emoji}</span>
                  <span className="itm__activity-name">{act.name}</span>
                  <span className="itm__activity-time">{act.label}</span>
                </button>
              ))}
            </div>

            {current.showBars && (
              <div className="itm__bars">
                {current.activities.map((act) => (
                  <div key={act.name} className="itm__bar-row">
                    <span className="itm__bar-icon">{act.emoji}</span>
                    <div
                      className="itm__bar"
                      style={{ width: anchoBarra(act.seconds, referencia) }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {session.answerState === "correct" && (
          <div className="ops__celebration activity-celebration--inline">¡Correcto! ⏱️⭐</div>
        )}
      </div>

      <footer className="ops__footer">
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
