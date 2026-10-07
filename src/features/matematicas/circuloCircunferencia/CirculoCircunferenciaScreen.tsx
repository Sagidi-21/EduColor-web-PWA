import { useState, useCallback, useEffect } from "react";
import {
  generateCCSession,
  validateCCAnswer,
  type CCShape,
} from "../../../core/activities/circuloCircunferencia";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "./CirculoCircunferenciaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateCCSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

/** Tiempo en ms que se muestra el feedback de acierto antes de autoavanzar. */
const AUTOAVANCE_MS = 900;

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateCCSession(seed, difficulty),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  };
}

function ShapeSVG({ shapeType, size = 180 }: { shapeType: CCShape; size?: number }) {
  const cx = size / 2;
  const r = size * 0.38;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="cc__svg"
      role="img"
      aria-label={shapeType === "circulo" ? "Círculo relleno" : "Circunferencia, solo el borde"}
    >
      {shapeType === "circulo" ? (
        <circle cx={cx} cy={cx} r={r} fill="var(--color-primary)" opacity={0.85} />
      ) : (
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={size * 0.1}
        />
      )}
    </svg>
  );
}

const OPT_ICONS: Record<string, string> = { círculo: "🔵", circunferencia: "⭕" };

export function CirculoCircunferenciaScreen({
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
  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        correct: session.correctCount,
        total,
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
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", selected: null }));
  }, []);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateCCAnswer(current, val);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: val,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !ok ? true : s.alreadyFailed,
      }));
    },
    [session.answerState, current],
  );

  // Autoavanza al siguiente ejercicio cuando la respuesta es correcta.
  // El temporizador se limpia al cambiar de ejercicio o al montar/desmontar.
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || activity.title}
        onRestart={() => {
          setFinished(null);
          setSession(freshSession(sessionSeed, difficulty));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;

  const stageClass =
    session.answerState === "correct"
      ? "cc__stage--correct"
      : session.answerState === "wrong"
        ? "cc__stage--wrong"
        : "";
  const revealed = session.answerState !== "idle";

  return (
    <div className="cc__wrap">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`cc__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="cc__cheer">¡Correcto! ⭐</div>}

        <div className="cc__card">
          <div className="cc__shape-area">
            {current.type === "classify-shape" ? (
              <ShapeSVG shapeType={current.shapeType} size={180} />
            ) : (
              <div className="cc__real-object" aria-hidden="true">
                {current.objectEmoji}
              </div>
            )}
          </div>

          {current.type === "real-object" && <p className="cc__label-hint">{current.objectName}</p>}
          <p className="cc__question">{current.question}</p>

          <div className="cc__opts">
            {current.options.map((opt) => {
              let cls = "cc__opt";
              if (revealed && opt.toLowerCase() === current.correctAnswer.toLowerCase())
                cls += " cc__opt--correct";
              else if (session.answerState === "wrong" && opt === session.selected)
                cls += " cc__opt--wrong";
              return (
                <button
                  key={opt}
                  className={cls}
                  onClick={() => handleAnswer(opt)}
                  disabled={session.answerState !== "idle"}
                >
                  <span className="cc__opt-icon">{OPT_ICONS[opt.toLowerCase()] ?? "◯"}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {revealed && (
            <p className="cc__explainer">
              {current.correctAnswer === "Círculo"
                ? "✅ Un círculo es una figura plana y rellena (como una moneda)."
                : "✅ Una circunferencia es solo el borde, sin interior (como un aro)."}
            </p>
          )}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
