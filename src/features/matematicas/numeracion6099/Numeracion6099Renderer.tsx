import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/numeracion6099";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { DigitBoxes } from "../components/DigitBoxes";
import { useDigitBoxes } from "../components/useDigitBoxes";

import "../operations/OperationsScreen.css";
import "./Numeracion6099Renderer.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  chosen: null | string;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    chosen: null,
    alreadyFailed: false,
  };
}

function TensBlock({ number }: { number: number }) {
  const decenas = Math.floor(number / 10);
  const units = number % 10;
  return (
    <div className="n6099__blocks">
      <div className="n6099__tens-row">
        {Array.from({ length: decenas }, (_, i) => (
          <div key={i} className="n6099__decena">
            10
          </div>
        ))}
      </div>
      {units > 0 && (
        <div className="n6099__units-row">
          {Array.from({ length: units }, (_, i) => (
            <div key={i} className="n6099__unit-dot" />
          ))}
        </div>
      )}
    </div>
  );
}

export function Numeracion6099Screen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const isMultiChoice = current?.type === "identify" || current?.type === "word";

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      chosen: null,
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
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
        chosen: null,
        alreadyFailed: false,
      }));
  }, [session, total]);

  const confirm = useCallback(
    (escrito: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, escrito);
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

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, opt);
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
  // Una casilla por cada cifra de la respuesta, ni una mas. La familia de
  // numeracion no se presenta en vertical, asi que se escribe de izquierda a
  // derecha, que es como se leen los numeros.
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
          setSession(freshSession(sessionSeed, difficulty));
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
            <div className="ops__celebration">¡Muy bien! ⭐</div>
          )}

          {current.type === "identify" && <TensBlock number={current.number} />}

          <div className="n6099__question">{current.question}</div>

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
              <div className="n6099__options">
                <div className="n6099__options-grid">
                  {(current.options ?? []).map((opt, i) => {
                    let cls = "n6099__option";
                    if (session.answerState === "correct" && opt === current.answer)
                      cls += " n6099__option--correct";
                    else if (session.answerState === "wrong" && opt === session.chosen)
                      cls += " n6099__option--wrong";
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
                </div>
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
