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
import { Numpad } from "../../shared/components/Numpad";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { DigitBoxes } from "../components/DigitBoxes";
import { useDigitBoxes } from "../components/useDigitBoxes";

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

  const confirm = useCallback(
    (escrito: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateNumeracion1119Answer(current, escrito);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !ok ? true : s.alreadyFailed,
      }));
    },
    [session.answerState, current],
  );

  // Una casilla por cada cifra de la respuesta, ni una mas: los ejercicios de
  // tipo `units` responden con una sola cifra y no deben mostrar casilla de
  // decenas. La familia de numeracion no se presenta en vertical, asi que se
  // escribe de izquierda a derecha, que es como se leen los numeros.
  const casillas = current ? String(current.answer).length : 0;
  const boxes = useDigitBoxes({
    length: casillas,
    order: "ltr",
    onComplete: confirm,
    resetToken: session.currentIndex,
  });

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

  if (!current) return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;

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
              <DigitBoxes
                length={casillas}
                values={boxes.values}
                activeIndex={boxes.activeIndex}
                order="ltr"
                state={session.answerState}
                mode={mode}
                onSelect={boxes.onSelect}
                onDigit={boxes.onDigit}
                onDelete={boxes.onDelete}
                canvasKey={canvasKey}
                correctText={String(current.answer)}
              />
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
                    onDigit={boxes.onDigit}
                    onDelete={boxes.onDelete}
                    onConfirm={boxes.onConfirm}
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
