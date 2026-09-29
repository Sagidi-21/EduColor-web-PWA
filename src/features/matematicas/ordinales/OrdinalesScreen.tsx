import { useState, useEffect, useCallback } from "react";
import {
  generateSession,
  validateAnswer,
  ORDINAL_LABELS,
} from "../../../core/activities/ordinales";
import type { OrdinalExercise } from "../../../core/activities/ordinales";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";

import "../operations/OperationsScreen.css";
import "./OrdinalesScreen.css";

const ROW_OBJECTS = ["🏀", "⚽", "🎾", "🏈", "🎱", "🏓", "🎯", "🏐", "⚾", "🏒"];

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: OrdinalExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  input: string;
  chosen: number | null;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    input: "",
    chosen: null,
    alreadyFailed: false,
  };
}

function OrdinalRow({ ex, sessionSeed }: { ex: OrdinalExercise; sessionSeed: number }) {
  const objEmoji = ROW_OBJECTS[sessionSeed % ROW_OBJECTS.length];
  const showLabels = ex.rowSize <= 7;

  return (
    <>
      {ex.fromRight && (
        <div className="ord__direction">
          <span className="ord__direction-arrow">→</span>
          <span>Desde la derecha</span>
        </div>
      )}
      <div className="ord__row">
        {Array.from({ length: ex.rowSize }, (_, i) => {
          const pos1based = i + 1;
          const isHighlight = pos1based === ex.target;
          return (
            <div key={pos1based} className="ord__item">
              <span
                className={`ord__object ${isHighlight ? "ord__object--highlight" : ""}`}
                aria-hidden="true"
              >
                {isHighlight ? "⭐" : objEmoji}
              </span>
              {showLabels && (
                <span
                  className={`ord__pos-label ${isHighlight ? "ord__pos-label--highlight" : ""}`}
                >
                  {ORDINAL_LABELS[pos1based - 1]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function OrdinalesScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const isMultiChoice = difficulty === "easy";
  const [sessionSeed] = useState(() => seed);

  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

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
        input: "",
        chosen: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      input: "",
      chosen: null,
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const confirm = useCallback(() => {
    if (session.answerState !== "idle" || session.input === "" || !current) return;
    const ok = validateAnswer(current, session.input);
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      alreadyFailed: !ok ? true : s.alreadyFailed,
    }));
  }, [session, current]);

  useEffect(() => {
    if (isMultiChoice) return;
    if (mode !== "canvas") return;
    if (session.answerState !== "idle") return;
    // Con escritura se confirma al introducir un dígito, o dos si la respuesta es 10.
    const maxDigits = current?.answer === 10 ? 2 : 1;
    if (session.input.length < maxDigits) return;
    const t = setTimeout(() => confirm(), 0);
    return () => clearTimeout(t);
  }, [isMultiChoice, session.input.length, mode, session.answerState, current?.answer, confirm]);

  const handleChoice = useCallback(
    (opt: number) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, String(opt));
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

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  return (
    <div className="ops">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        {!isMultiChoice && <InputModeToggle mode={mode} onToggle={toggle} />}
      </ActivityHeader>

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <OrdinalRow ex={current} sessionSeed={sessionSeed} />
        <p className="ord__question">{current.question}</p>

        {!isMultiChoice && (
          <div className="ops__formula">
            {mode === "numpad" ? (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
              >
                {session.answerState === "correct" ? (
                  ORDINAL_LABELS[current.answer - 1]
                ) : session.input ? (
                  (ORDINAL_LABELS[Number(session.input) - 1] ?? session.input)
                ) : (
                  <span className="ops__cursor">_</span>
                )}
              </div>
            ) : session.answerState === "idle" ? (
              <LazyDigitCell
                key={canvasKey}
                isActive={true}
                onActivate={() => {}}
                onConfirm={(digit) => {
                  if (session.answerState !== "idle") return;
                  setSession((s) => ({
                    ...s,
                    input: s.input.length < 2 ? s.input + digit : s.input,
                  }));
                  setCanvasKey((k) => k + 1);
                }}
                onClear={() => setSession((s) => ({ ...s, input: "" }))}
                state={session.answerState}
                value={session.input}
              />
            ) : (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : "ops__answer-box--wrong"}`}
              >
                {session.answerState === "correct"
                  ? ORDINAL_LABELS[current.answer - 1]
                  : session.input || "?"}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="ops__footer">
        {isMultiChoice ? (
          <div className="ord__options">
            {(current.options ?? []).map((opt, i) => {
              let cls = "ord__option";
              if (session.answerState === "correct" && opt === current.answer)
                cls += " ord__option--correct";
              else if (session.answerState === "wrong" && opt === session.chosen)
                cls += " ord__option--wrong";
              return (
                <button
                  key={opt}
                  id={`ord-option-${i}`}
                  className={cls}
                  onClick={() => handleChoice(opt)}
                  disabled={session.answerState !== "idle"}
                >
                  {ORDINAL_LABELS[opt - 1]}
                </button>
              );
            })}
            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </div>
        ) : (
          <>
            {mode === "numpad" && (
              <Numpad
                onDigit={(d) => {
                  if (session.answerState !== "idle") return;
                  setSession((s) => ({ ...s, input: s.input.length < 2 ? s.input + d : s.input }));
                }}
                onDelete={() => {
                  if (session.answerState !== "idle") return;
                  setSession((s) => ({ ...s, input: s.input.slice(0, -1) }));
                }}
                onConfirm={confirm}
                disabled={session.answerState !== "idle"}
              />
            )}
            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </>
        )}
      </footer>
    </div>
  );
}
