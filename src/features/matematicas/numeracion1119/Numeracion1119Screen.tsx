import { useState, useEffect, useCallback } from "react";
import {
  generateNumeracion1119Session,
  validateNumeracion1119Answer,
} from "../../../core/activities/numeracion1119";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { LazyDigitCell } from "../../shared/DigitCell";
import { Numpad } from "../../shared/components/Numpad";

import "../operations/OperationsScreen.css";
import "./Numeracion1119Screen.css";

type AnswerState = "idle" | "correct" | "wrong";

function TensBlock({ number }: { number: number }) {
  const units = number % 10;
  return (
    <div className="num__blocks">
      <div className="num__decena">10</div>
      {Array.from({ length: units }, (_, i) => (
        <div key={i} className="num__unit-dot" />
      ))}
    </div>
  );
}

interface SessionState {
  exercises: ReturnType<typeof generateNumeracion1119Session>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  input: string;
  chosen: null | number;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateNumeracion1119Session(seed, difficulty),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    input: "",
    chosen: null,
    alreadyFailed: false,
  };
}

export function Numeracion1119Screen({
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

  const [session, setSession] = useState<SessionState>(() => freshSession(seed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

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
      chosen: null,
      input: "",
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1100);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleChoice = useCallback(
    (opt: number) => {
      if (session.answerState !== "idle") return;
      const ok = validateNumeracion1119Answer(current, String(opt));
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !ok ? true : s.alreadyFailed,
      }));
    },
    [session, current],
  );

  const confirm = useCallback(() => {
    if (session.answerState !== "idle" || session.input === "") return;
    const ok = validateNumeracion1119Answer(current, session.input);
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      alreadyFailed: !ok ? true : s.alreadyFailed,
    }));
  }, [session.answerState, session.input, current]);

  const handleCanvasConfirm = useCallback(
    (digit: string) => {
      if (session.answerState !== "idle") return;
      setSession((s) => {
        const nextInput = s.input.length < 2 ? s.input + digit : s.input;
        const needsConfirm =
          current?.type === "units" ? nextInput.length >= 1 : nextInput.length >= 2;
        if (!needsConfirm) {
          return { ...s, input: nextInput };
        }
        const ok = validateNumeracion1119Answer(current, nextInput);
        playFeedback(ok);
        return {
          ...s,
          input: nextInput,
          answerState: ok ? "correct" : "wrong",
          correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
          alreadyFailed: !ok ? true : s.alreadyFailed,
        };
      });
      setCanvasKey((k) => k + 1);
    },
    [current, session.answerState],
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
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";
  const bodyClass = isMultiChoice
    ? "ops__body"
    : mode === "numpad"
      ? "ops__body ops__body--with-numpad"
      : "ops__body";

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

      <div className={bodyClass}>
        <div className={`ops__stage ${stageClass}`}>
          {session.answerState === "correct" && (
            <div className="ops__celebration">¡Correcto! ⭐</div>
          )}

          <TensBlock number={current.number} />
          <div className="num__question">{current.question}</div>

          {!isMultiChoice && (
            <div className="ops__formula">
              {mode === "numpad" ? (
                <div
                  className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
                >
                  {session.answerState === "correct"
                    ? current.answer
                    : session.input || <span className="ops__cursor">_</span>}
                </div>
              ) : session.answerState === "idle" ? (
                <LazyDigitCell
                  key={canvasKey}
                  isActive={true}
                  onActivate={() => {}}
                  onConfirm={handleCanvasConfirm}
                  onClear={() => setSession((s) => ({ ...s, input: "" }))}
                  state={session.answerState}
                  value={session.input}
                />
              ) : (
                <div
                  className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : "ops__answer-box--wrong"}`}
                >
                  {session.answerState === "correct" ? current.answer : session.input || "?"}
                </div>
              )}
            </div>
          )}
        </div>

        {(isMultiChoice || mode === "numpad" || session.answerState === "wrong") && (
          <footer className="ops__footer">
            {isMultiChoice ? (
              <div className="num__options">
                {(current.options ?? []).map((opt, i) => {
                  let cls = "num__option";
                  if (session.answerState === "correct" && opt === current.answer)
                    cls += " num__option--correct";
                  else if (session.answerState === "wrong" && opt === session.chosen)
                    cls += " num__option--wrong";
                  return (
                    <button
                      key={i}
                      className={cls}
                      onClick={() => handleChoice(opt)}
                      disabled={session.answerState !== "idle"}
                    >
                      {opt}
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
                      setSession((s) => ({
                        ...s,
                        input: s.input.length < 2 ? s.input + d : s.input,
                      }));
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
        )}
      </div>
    </div>
  );
}
