import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/amigos10";
import type { Amigos10Exercise } from "../../../core/activities/amigos10";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./Amigos10Screen.css";

type AnswerState = "idle" | "correct" | "wrong";

/** Pausa visual antes de pasar al siguiente ejercicio. */
const AUTOAVANCE_MS = 900;

interface SessionState {
  exercises: Amigos10Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Opción pulsada, para pintarla. `null` mientras no se ha contestado. */
  selected: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/**
 * Amigos del 10 — complementos al 10.
 *
 * La aritmética es la de
 * `electron-reference/Colegio/src/renderer/src/core/engines/amigos10/`,
 * sin cambios funcionales. Respuesta por cuatro botones; no hay numpad ni lienzo.
 *
 * La visual es el ten-frame clásico: 10 celdas, las `given` pintadas en azul y
 * el resto vacías, con la ecuación `dado + ? = 10` debajo.
 */
export function Amigos10Screen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleAnswer = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, opt);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", selected: null, alreadyFailed: true }));
  }, []);

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
        selected: null,
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  // Al acertar, avance automático; al fallar, el niño decide con los botones.
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      // La misma semilla: "Repetir" da la misma hoja, no una tirada nueva.
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selected: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? ""}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  // Ten-frame: 10 celdas, las primeras `given` en azul, el resto vacías.
  const cells = Array.from({ length: 10 }, (_, i) => i < current.given);

  return (
    <div className={`ops ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Correcto! ⭐</div>}

        <p className="ami__question">{current.question}</p>

        {/* Ten-frame visual */}
        <div className="ami__tenframe">
          {cells.map((filled, i) => (
            <div key={i} className={`ami__cell${filled ? " ami__cell--given" : ""}`}>
              {filled && <div className="ami__dot" />}
            </div>
          ))}
        </div>
        <div className="ami__tenframe-label">
          <span className="ami__tenframe-n ami__tenframe-n--given">{current.given}</span>
          <span className="ami__tenframe-plus">+</span>
          <span className="ami__tenframe-n ami__tenframe-n--blank">?</span>
          <span className="ami__tenframe-eq">= 10</span>
        </div>

        {/* Botones de opción */}
        <div className="ami__options">
          {current.options.map((opt) => {
            const estado =
              session.answerState === "correct" && opt === current.correctAnswer
                ? " ami__opt--correct"
                : session.answerState === "wrong" && opt === session.selected
                  ? " ami__opt--wrong"
                  : "";
            return (
              <button
                key={opt}
                type="button"
                className={`ami__opt${estado}`}
                disabled={session.answerState !== "idle"}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <footer className="ops__footer">
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
