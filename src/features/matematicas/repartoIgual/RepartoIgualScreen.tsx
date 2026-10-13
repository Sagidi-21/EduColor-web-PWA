import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/repartoIgual";
import type { RepartoIgualExercise } from "../../../core/activities/repartoIgual";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import "../operations/OperationsScreen.css";
import "./RepartoIgualScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: RepartoIgualExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  input: string;
  alreadyFailed: boolean;
}

export function RepartoIgualScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
}: EngineScreenProps) {
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty as "easy" | "medium" | "hard" | "expert", seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    input: "",
    alreadyFailed: false,
  }));

  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleConfirm = useCallback(() => {
    if (session.answerState !== "idle" || session.input.length === 0) return;
    const ans = parseInt(session.input, 10);
    const ok = validateAnswer(current, ans);

    if (ok) playFeedback(true);
    else playFeedback(false);

    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
    }));
  }, [session.answerState, session.input, current]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      input: "",
      alreadyFailed: true,
    }));
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
        input: "",
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      setSession((s) => ({
        ...s,
        input: s.input.length < 2 ? s.input + d : s.input,
      }));
    },
    [session.answerState],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    setSession((s) => ({ ...s, input: s.input.slice(0, -1) }));
  }, [session.answerState]);

  if (finished) {
    return (
      <SummaryScreen
        result={{ correct: finished.correct, total: finished.total, duration: finished.duration }}
        gradeLabel={gradeTitle ?? ""}
        onRestart={() => {
          setFinished(null);
          setSession({
            exercises: generateSession(difficulty as "easy" | "medium" | "hard" | "expert", seed),
            currentIndex: 0,
            correctCount: 0,
            startTime: Date.now(),
            answerState: "idle",
            input: "",
            alreadyFailed: false,
          });
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return null;

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  const feedbackCls =
    session.answerState === "correct"
      ? "reparto__feedback--correct"
      : session.answerState === "wrong"
        ? "reparto__feedback--wrong"
        : "reparto__feedback--active";

  const showVisual = difficulty === "easy" || difficulty === "medium";
  const displayValue =
    session.answerState === "correct" ? String(current.itemsPerGroup) : session.input || "?";

  return (
    <div className="ops">
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <div className="reparto__container">
          <div className="reparto__text">
            {"Tenemos "}
            <strong className="reparto__text-num">{current.total}</strong>
            {" objetos y queremos repartirlos en "}
            <strong className="reparto__text-num">{current.groups}</strong>
            {" grupos iguales."}
          </div>

          {showVisual && (
            <div className="reparto__visual">
              <div className="reparto__total-items">
                {Array.from({ length: current.total }).map((_, i) => (
                  <div key={`item-${i}`} className="reparto__item" />
                ))}
              </div>
              <div className="reparto__groups">
                {Array.from({ length: current.groups }).map((_, i) => (
                  <div
                    key={`group-${i}`}
                    className={`reparto__group-box ${feedbackCls}`}
                    data-testid={i === 0 ? "reparto-answer" : undefined}
                  >
                    {displayValue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showVisual && (
            <div className="reparto__answer-row">
              <span>A cada grupo le tocan:</span>
              <div className={`reparto__input ${feedbackCls}`} data-testid="reparto-answer">
                {displayValue}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="ops__footer">
        <Numpad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onConfirm={handleConfirm}
          disabled={session.answerState !== "idle"}
        />
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
