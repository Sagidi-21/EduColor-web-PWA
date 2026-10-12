import { useCallback, useEffect, useState, type ReactNode } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/inventarProblema";
import type { InventarProblemaExercise } from "../../../core/activities/inventarProblema";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./InventarProblemaScreen.css";

/** Resalta MÁS BARATO / MÁS CARO (easy) o importes N€ (hard) con color de clase. */
function questionNodes(question: string, difficulty: string): ReactNode {
  if (difficulty === "easy") {
    const parts = question.split(/(MÁS BARATO|MÁS CARO)/);
    return parts.map((part, i) =>
      part === "MÁS BARATO" || part === "MÁS CARO" ? (
        <span key={i} className="inv__compare">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }
  if (difficulty === "hard") {
    const parts = question.split(/(\d+€)/);
    return parts.map((part, i) =>
      /^\d+€$/.test(part) ? (
        <span key={i} className="inv__price-hl">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }
  return question;
}

type AnswerState = "idle" | "correct" | "wrong";
const AUTOAVANCE_MS = 900;

interface SessionState {
  exercises: InventarProblemaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selectedOption: string | null;
  alreadyFailed: boolean;
}

export function InventarProblemaScreen({
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
    selectedOption: null,
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
        selectedOption: val,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", selectedOption: null, alreadyFailed: true }));
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
        selectedOption: null,
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

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
      selectedOption: null,
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

  return (
    <div className={`ops inv--${difficulty} ${className ?? ""}`.trim()}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="ops__celebration">¡Correcto! 🛒⭐</div>
        )}

        <div className="inv__items-container">
          {current.items.map((item, i) => (
            <div key={i} className="inv__item">
              <span className="inv__item-emoji">{item.emoji}</span>
              <span className="inv__item-name">{item.name}</span>
              <span className="inv__item-price">{item.price}€</span>
            </div>
          ))}
          {current.budget !== undefined && (
            <div className="inv__budget">
              <span className="inv__budget-emoji">💰</span>
              <span className="inv__budget-label">Tengo</span>
              <span className="inv__budget-value">{current.budget}€</span>
            </div>
          )}
        </div>

        <p className="inv__question">{questionNodes(current.question, difficulty)}</p>

        <div className="inv__options">
          {current.options.map((opt) => {
            const isSelected = session.selectedOption === opt.value;
            let cls = "inv__opt";
            if (session.answerState === "correct" && opt.value === current.correctAnswer)
              cls += " inv__opt--correct";
            else if (session.answerState === "wrong" && isSelected) cls += " inv__opt--wrong";
            return (
              <button
                key={opt.value}
                type="button"
                className={cls}
                disabled={session.answerState !== "idle"}
                onClick={() => handleAnswer(opt.value)}
              >
                {opt.label}
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
