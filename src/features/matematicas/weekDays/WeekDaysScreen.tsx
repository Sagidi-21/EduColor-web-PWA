import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer, DAYS } from "../../../core/activities/weekDays";
import type { WeekDaysExercise } from "../../../core/activities/weekDays";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./WeekDaysScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

const DAY_ABBR: Record<string, string> = {
  lunes: "L",
  martes: "M",
  miércoles: "X",
  jueves: "J",
  viernes: "V",
  sábado: "S",
  domingo: "D",
};

function WeekStrip({ highlight }: { highlight?: string }) {
  return (
    <div className="wd__strip">
      {DAYS.map((d) => (
        <div key={d} className={`wd__strip-day ${highlight === d ? "wd__strip-day--active" : ""}`}>
          {DAY_ABBR[d]}
        </div>
      ))}
    </div>
  );
}

interface SessionState {
  exercises: WeekDaysExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  chosen: string | null;
  alreadyFailed: boolean;
}

export function WeekDaysScreen({
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
    chosen: null,
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
        chosen: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      chosen: null,
      alreadyFailed: true,
    }));
  }, []);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, opt);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      chosen: null,
      alreadyFailed: false,
    });
  };

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || "Matemáticas"}
        onExit={onExit}
        onRestart={handleRestart}
      />
    );
  }

  if (!current) return null;

  const dayMentioned = DAYS.find((d) => current.question.includes(d));

  const stageClass =
    session.answerState === "correct"
      ? "wd__stage--correct"
      : session.answerState === "wrong"
        ? "wd__stage--wrong"
        : "";

  return (
    <div className="wd">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`wd__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="wd__celebration">¡Muy bien! ⭐</div>}
        <p className="wd__question">{current.question}</p>
        <WeekStrip highlight={dayMentioned} />
      </div>

      <footer className="wd__footer">
        <div className="wd__options">
          {current.options.map((opt, i) => {
            let cls = "wd__option";
            if (session.answerState === "correct" && opt === current.answer)
              cls += " wd__option--correct";
            else if (session.answerState === "wrong" && opt === session.chosen)
              cls += " wd__option--wrong";
            return (
              <button
                key={i}
                id={`wd-option-${i}`}
                className={cls}
                onClick={() => handleChoice(opt)}
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
      </footer>
    </div>
  );
}
