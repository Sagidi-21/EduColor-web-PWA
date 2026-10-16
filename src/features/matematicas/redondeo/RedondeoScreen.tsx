import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/redondeo";
import type { RedondeoExercise } from "../../../core/activities/redondeo";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import "./RedondeoScreen.css";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";

type AnswerState = "idle" | "correct" | "wrong";

export function RedondeoScreen({
  difficulty,
  onExit,
  activity,
  seed,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const [session, setSession] = useState(() => ({
    exercises: generateSession(difficulty, seed ?? Date.now() % 999983),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle" as AnswerState,
    selected: null as string | null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex] as RedondeoExercise;
  const total = session.exercises.length;

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selected: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total)
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    else
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        selected: null,
        alreadyFailed: false,
      }));
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1100);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
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

  if (finished) {
    return (
      <SummaryScreen
        result={{ correct: finished.correct, total: finished.total, duration: finished.duration }}
        gradeLabel={gradeTitle ?? activity.title}
        onRestart={() => {
          setFinished(null);
          setSession({
            exercises: generateSession(difficulty, Date.now() % 999983),
            currentIndex: 0,
            correctCount: 0,
            startTime: Date.now(),
            answerState: "idle",
            selected: null,
            alreadyFailed: false,
          });
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "redondeo__stage--correct"
      : session.answerState === "wrong"
        ? "redondeo__stage--wrong"
        : "";

  // Number line: position of n between lower and upper decades (no en expert).
  const esExpert = difficulty === "expert";
  const { number: n, lowerDecade: lo, upperDecade: hi } = current;
  const nPct = ((n - lo) / (hi - lo)) * 100;

  return (
    <div className="redondeo__wrap">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`redondeo__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="redondeo__cheer">¡Correcto! ⭐</div>}

        <p className="redondeo__question">{current.question}</p>

        <div className="redondeo__mid">
          {esExpert && <div className="redondeo__number-badge">{n}</div>}

          {!esExpert && (
            <div className="redondeo__number-line">
              <span className="redondeo__decade-label">{lo}</span>
              <div className="redondeo__line-track">
                <div
                  className="redondeo__line-mark redondeo__line-mark--decade"
                  style={{ left: "0%" }}
                />
                <div
                  className="redondeo__line-mark redondeo__line-mark--number"
                  style={{ left: `${nPct}%` }}
                >
                  <span className="redondeo__line-label">{n}</span>
                </div>
                <div
                  className="redondeo__line-mark redondeo__line-mark--decade"
                  style={{ left: "100%" }}
                />
              </div>
              <span className="redondeo__decade-label">{hi}</span>
            </div>
          )}
        </div>

        {session.answerState === "wrong" && (
          <div className="redondeo__actions">
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}

        <div className="redondeo__opts">
          {current.options.map((opt) => {
            let cls = "redondeo__opt";
            if (session.answerState !== "idle" && opt === current.correctAnswer)
              cls += " redondeo__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " redondeo__opt--wrong";
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
      </div>
    </div>
  );
}
