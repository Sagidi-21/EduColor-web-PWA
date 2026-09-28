import { useState, useEffect, useCallback } from "react";
import {
  generateSession,
  validateAnswer,
  requiresWriting,
} from "../../../core/activities/parImpar";
import type { ParImparExercise } from "../../../core/activities/parImpar";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { WrongFeedback } from "../components/WrongFeedback";

import "../operations/OperationsScreen.css";
import "./ParImparScreen.css";

/** `write` es el único tipo con escritura, y todos los números son de dos cifras. */
const WRITE_MAX_DIGITS = 2;

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ParImparExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  input: string;
  chosen: string | null;
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

export function ParImparScreen({
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
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const isWriting = current ? requiresWriting(current) : false;

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

  // Con escritura se confirma solo al completar los dos dígitos.
  useEffect(() => {
    if (!isWriting) return;
    if (mode !== "canvas") return;
    if (session.answerState !== "idle") return;
    if (session.input.length < WRITE_MAX_DIGITS) return;
    const t = setTimeout(() => confirm(), 0);
    return () => clearTimeout(t);
  }, [isWriting, session.input.length, mode, session.answerState, confirm]);

  const handleChoice = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, value);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: value,
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

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  const inputClass = `ops__answer-box ${
    session.answerState === "correct"
      ? "ops__answer-box--correct"
      : session.answerState === "wrong"
        ? "ops__answer-box--wrong"
        : ""
  }`;

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
        {/* El toggle solo se monta si el ejercicio actual admite escritura, para
            que TF.js no se descargue en el resto de la sesión. */}
        {isWriting && <InputModeToggle mode={mode} onToggle={toggle} />}
      </ActivityHeader>

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        {current.visualItems && (
          <div className="pi__objects" aria-label={`${current.visualItems.count} objetos`}>
            {Array.from({ length: current.visualItems.count }, (_, i) => (
              <span key={i} className="pi__object" aria-hidden="true">
                {current.visualItems!.emoji}
              </span>
            ))}
          </div>
        )}

        <p className="pi__question">{current.question}</p>

        {isWriting && (
          <div className="ops__formula">
            {mode === "numpad" ? (
              <div className={inputClass}>
                {session.answerState === "correct" ? (
                  current.answer
                ) : session.input ? (
                  session.input
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
                    input: s.input.length < WRITE_MAX_DIGITS ? s.input + digit : s.input,
                  }));
                  setCanvasKey((k) => k + 1);
                }}
                onClear={() => setSession((s) => ({ ...s, input: "" }))}
                state={session.answerState}
                value={session.input}
              />
            ) : (
              <div className={inputClass}>
                {session.answerState === "correct" ? current.answer : session.input || "?"}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="ops__footer">
        {isWriting ? (
          <>
            {mode === "numpad" && (
              <Numpad
                onDigit={(d) => {
                  if (session.answerState !== "idle") return;
                  setSession((s) => ({
                    ...s,
                    input: s.input.length < WRITE_MAX_DIGITS ? s.input + d : s.input,
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
              <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
            )}
          </>
        ) : (
          <div className="pi__options">
            {(current.options ?? []).map((opt, i) => {
              let cls = "pi__option";
              if (session.answerState === "correct" && opt.value === current.answer)
                cls += " pi__option--correct";
              else if (session.answerState === "wrong" && opt.value === session.chosen)
                cls += " pi__option--wrong";
              return (
                <button
                  key={`${opt.value}-${i}`}
                  id={`pi-option-${i}`}
                  className={cls}
                  onClick={() => handleChoice(opt.value)}
                  disabled={session.answerState !== "idle"}
                >
                  {opt.label}
                </button>
              );
            })}
            {session.answerState === "wrong" && (
              <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
