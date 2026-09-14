import { useState, useEffect, useCallback } from "react";
import { generateVecinosSession, validateVecinosAnswer } from "../../../core/activities/vecinos";
import { playCorrect } from "../../../platform/audio";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./VecinosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateVecinosSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateVecinosSession(seed, difficulty),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  };
}

export function VecinosScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState<SessionState>(() => freshSession(seed, difficulty));
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

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1100);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateVecinosAnswer(current, val);
      if (ok) playCorrect();
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

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || activity.title}
        onRestart={() => {
          setFinished(null);
          setSession(freshSession(Date.now() % 999983, difficulty));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return null;

  const stageClass =
    session.answerState === "correct"
      ? "vec__stage--correct"
      : session.answerState === "wrong"
        ? "vec__stage--wrong"
        : "";

  const isAmbos = current.type === "ambos";
  const label =
    current.type === "anterior"
      ? "¿Cuál es el número anterior?"
      : current.type === "posterior"
        ? "¿Cuál es el número posterior?"
        : "¿Cuáles son los vecinos?";

  const renderOption = (opt: string) => {
    if (isAmbos) {
      const [a, p] = opt.split("·");
      return (
        <>
          <span className="vec__opt-pair">{a}</span>
          <span className="vec__opt-sep">·</span>
          <span className="vec__opt-pair">{p}</span>
        </>
      );
    }
    return opt;
  };

  return (
    <div className="vec">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`vec__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="vec__cheer">¡Correcto! ⭐</div>}

        <p className="vec__question">{label}</p>

        {/* Number track */}
        <div className="vec__track">
          <div
            className={`vec__house vec__house--left ${current.type === "anterior" || isAmbos ? "vec__house--blank" : ""}`}
          >
            {current.type === "anterior" || isAmbos ? "?" : current.anterior}
            <span className="vec__house-label">antes</span>
          </div>
          <div className="vec__arrow">←</div>
          <div className="vec__house vec__house--center">
            {current.number}
            <span className="vec__house-label">el número</span>
          </div>
          <div className="vec__arrow">→</div>
          <div
            className={`vec__house vec__house--right ${current.type === "posterior" || isAmbos ? "vec__house--blank" : ""}`}
          >
            {current.type === "posterior" || isAmbos ? "?" : current.posterior}
            <span className="vec__house-label">después</span>
          </div>
        </div>

        {/* Options */}
        <div className={`vec__options ${isAmbos ? "vec__options--ambos" : ""}`}>
          {current.options.map((opt) => {
            let cls = "vec__opt";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " vec__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " vec__opt--wrong";
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={session.answerState !== "idle"}
              >
                {renderOption(opt)}
              </button>
            );
          })}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
