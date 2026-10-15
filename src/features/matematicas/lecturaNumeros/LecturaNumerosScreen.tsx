import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/lecturaNumeros";
import type { LecturaExercise } from "../../../core/activities/lecturaNumeros";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./LecturaNumerosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/** Pausa visual antes de pasar al siguiente ejercicio. */
const AUTOAVANCE_MS = 900;

/** Primera letra en mayúscula; el valor original se conserva para validar. */
function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase("es") + text.slice(1);
}

interface SessionState {
  exercises: LecturaExercise[];
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
 * Lectura de números — cifra↔palabra.
 *
 * La aritmética es la de
 * `electron-reference/Colegio/src/renderer/src/core/engines/lecturaNumeros/`,
 * sin cambios funcionales. Diferencias respecto al original:
 *   - Usa semilla determinista (seed del prop) en lugar de `Date.now()`.
 *   - Autoavance 900 ms en vez de 1100 ms (patrón PWA).
 *   - `SummaryScreen` compartido en vez del resumen inline de Electron.
 *   - `ActionButtons` + `alreadyFailed` en vez de `WrongFeedback`.
 *   - `NoExerciseNotice` en vez de `return <>` (pantalla en blanco).
 */
export function LecturaNumerosScreen({
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
    (val: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, val);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: val,
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
      // La misma semilla: «Repetir» da la misma hoja, no una tirada nueva.
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

  const isCifraToWord = current.type === "cifra-to-palabra";
  const prompt = isCifraToWord ? "Elige cómo se escribe este número:" : "¿Qué número es este?";
  const display = isCifraToWord ? String(current.number) : capitalizeFirst(current.word);

  return (
    <div className={`ops lec ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1}/${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="ops__celebration">¡Correcto! 📖⭐</div>
        )}

        <p className="lec__question">{prompt}</p>

        <div className="lec__split">
          <div className="lec__split-left">
            <div className={`lec__display${!isCifraToWord ? " lec__display--word" : ""}`}>
              <span className="lec__display-value">{display}</span>
            </div>
          </div>

          <div className="lec__options">
            {current.options.map((opt) => {
              const estado =
                session.answerState === "correct" && opt === current.correctAnswer
                  ? " lec__opt--correct"
                  : session.answerState === "wrong" && opt === session.selected
                    ? " lec__opt--wrong"
                    : "";
              return (
                <button
                  key={opt}
                  type="button"
                  className={`lec__opt${estado}`}
                  disabled={session.answerState !== "idle"}
                  onClick={() => handleAnswer(opt)}
                >
                  {isCifraToWord ? capitalizeFirst(opt) : opt}
                </button>
              );
            })}
          </div>
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
