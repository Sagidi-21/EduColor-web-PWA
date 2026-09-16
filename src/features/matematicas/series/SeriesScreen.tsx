import { useState, useEffect, useCallback } from "react";
import { generateSeriesSession, validateSeriesAnswer } from "../../../core/activities/series";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./SeriesScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateSeriesSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSeriesSession(seed, difficulty),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  };
}

export function SeriesScreen({
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

  // Auto-advance after correct
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1100);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateSeriesAnswer(current, val);
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
      ? "ser__stage--correct"
      : session.answerState === "wrong"
        ? "ser__stage--wrong"
        : "";

  const dir = current.ascending
    ? `de ${current.step} en ${current.step}`
    : `bajando de ${current.step} en ${current.step}`;

  return (
    <div className="ser">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ser__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ser__cheer">¡Correcto! ⭐</div>}

        <p className="ser__question">
          ¿Qué número falta? <span className="ser__dir">({dir})</span>
        </p>

        <div className="ser__sequence">
          {current.sequence.map((n, i) => (
            <div key={i} className={`ser__box ${n === -1 ? "ser__box--blank" : ""}`}>
              {n === -1 ? "?" : n}
              {i < current.sequence.length - 1 && (
                <span className="ser__arrow">{current.ascending ? "→" : "←"}</span>
              )}
            </div>
          ))}
        </div>

        <div className="ser__options">
          {current.options.map((opt) => {
            let cls = "ser__opt";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " ser__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " ser__opt--wrong";
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={session.answerState !== "idle"}
              >
                {opt}
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
