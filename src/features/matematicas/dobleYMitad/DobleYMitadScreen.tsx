import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/dobleYMitad";
import type { DobleYMitadExercise } from "../../../core/activities/dobleYMitad";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "./DobleYMitadScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/** El salto de nivel, como el tiempo que se tarda en leer el "¡Correcto!". */
const AUTOAVANCE_MS = 900;

interface SessionState {
  exercises: DobleYMitadExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Opción pulsada, para pintarla. `null` mientras no se ha contestado. */
  selected: number | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/**
 * "Duplicamos y repartimos" — el doble y la mitad de un número.
 *
 * La aritmética es la de
 * `electron-reference/Colegio/src/renderer/src/core/engines/dobleYMitad/`, y las
 * diferencias están todas anotadas en el núcleo. Aquí se compone.
 *
 * Respuesta por cuatro botones, sin numpad ni lienzo: el enunciado siempre ofrece
 * las opciones, así que escribir sería un rodeo.
 */
export function DobleYMitadScreen({
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
    (value: number) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, value);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: value,
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

  // Al acertar se pasa solo al siguiente; al fallar no, porque el niño tiene que
  // decidir si reintenta o sigue con el botón.
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
      ? "dob__stage--correct"
      : session.answerState === "wrong"
        ? "dob__stage--wrong"
        : "";

  // El enunciado da el número del que se parte o el resultado; el hueco va en el
  // otro lado, y el núcleo lo dice en `conocido`.
  const huecoEnResultado = current.conocido === "original";
  const flecha = current.operacion === "x2" ? "×2" : "÷2";
  const etiquetaResultado = current.operacion === "x2" ? "Doble" : "Mitad";

  return (
    <div className="dob">
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        className={className}
        progress={`${session.currentIndex + 1}/${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`dob__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="dob__cheer">¡Correcto! ⭐</div>}

        <p className="dob__question">{current.question}</p>

        <div className="dob__mid">
          <div className="dob__visual">
            <div className={`dob__box${huecoEnResultado ? "" : " dob__box--blank"}`}>
              <span className="dob__box-value">{huecoEnResultado ? current.number : "?"}</span>
              <span className="dob__box-label">Número</span>
            </div>

            <span className="dob__arrow" aria-hidden="true">
              {flecha}
            </span>

            <div className={`dob__box${huecoEnResultado ? " dob__box--blank" : ""}`}>
              <span className="dob__box-value">{huecoEnResultado ? "?" : current.number}</span>
              <span className="dob__box-label">{etiquetaResultado}</span>
            </div>
          </div>
        </div>

        {session.answerState === "wrong" && (
          <div className="dob__actions">
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}

        <div className="dob__options">
          {current.options.map((opt) => {
            const clase =
              session.answerState === "correct" && opt === current.correctAnswer
                ? " dob__opt--correct"
                : session.answerState === "wrong" && opt === session.selected
                  ? " dob__opt--wrong"
                  : "";
            return (
              <button
                key={opt}
                type="button"
                data-value={opt}
                className={`dob__opt${clase}`}
                disabled={session.answerState !== "idle"}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
