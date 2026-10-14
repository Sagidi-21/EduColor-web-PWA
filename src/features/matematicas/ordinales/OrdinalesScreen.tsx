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

function OrdinalRow({
  ex,
  interactive = false,
  chosen = null,
  answerState = "idle",
  onPick,
}: {
  ex: OrdinalExercise;
  /** identify: pulsar sobre la imagen (sin marca previa ni etiquetas). */
  interactive?: boolean;
  chosen?: number | null;
  answerState?: AnswerState;
  onPick?: (pos: number) => void;
}) {
  // position/fromRight: etiquetas si caben; identify: sin etiquetas (darían la respuesta).
  const showLabels = !interactive && ex.rowSize <= 7;

  return (
    <>
      <div className={`ord__row${interactive ? " ord__row--interactive" : ""}`}>
        {Array.from({ length: ex.rowSize }, (_, i) => {
          const pos1based = i + 1;
          const isHighlight = !interactive && pos1based === ex.target;
          let objectCls = "ord__object";
          if (isHighlight) objectCls += " ord__object--highlight";
          if (interactive && answerState === "correct" && pos1based === ex.answer)
            objectCls += " ord__object--correct";
          if (interactive && answerState === "wrong" && pos1based === chosen)
            objectCls += " ord__object--wrong";

          const label = ORDINAL_LABELS[pos1based - 1];
          const content = (
            <>
              <span className={objectCls} aria-hidden="true">
                {ex.emoji}
              </span>
              {showLabels && (
                <span
                  className={`ord__pos-label ${isHighlight ? "ord__pos-label--highlight" : ""}`}
                >
                  {label}
                </span>
              )}
            </>
          );

          if (interactive) {
            return (
              <button
                key={pos1based}
                type="button"
                id={`ord-item-${pos1based}`}
                className="ord__item ord__item--btn"
                onClick={() => onPick?.(pos1based)}
                disabled={answerState !== "idle"}
                aria-label={label}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={pos1based} className="ord__item">
              {content}
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
  const [sessionSeed] = useState(() => seed);

  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  /** «¿Cuál es el Nº?» → pulsar la imagen (easy y expert cuando toca identify). */
  const isIdentify = current?.type === "identify";

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
    if (isIdentify) return;
    if (mode !== "canvas") return;
    if (session.answerState !== "idle") return;
    // Con escritura se confirma al introducir un dígito, o dos si la respuesta es 10.
    const maxDigits = current?.answer === 10 ? 2 : 1;
    if (session.input.length < maxDigits) return;
    const t = setTimeout(() => confirm(), 0);
    return () => clearTimeout(t);
  }, [isIdentify, session.input.length, mode, session.answerState, current?.answer, confirm]);

  const handlePickObject = useCallback(
    (pos: number) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, String(pos));
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: pos,
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
          setSession(freshSession(sessionSeed, difficulty));
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

  const layoutClass = isIdentify ? "ord__stage--tap" : "ord__stage--position";

  const answerLabel =
    session.answerState === "correct"
      ? ORDINAL_LABELS[current.answer - 1]
      : session.input
        ? (ORDINAL_LABELS[Number(session.input) - 1] ?? session.input)
        : null;

  const answerBoxClass =
    session.answerState === "correct"
      ? "ops__answer-box ops__answer-box--correct"
      : session.answerState === "wrong"
        ? "ops__answer-box ops__answer-box--wrong"
        : "ops__answer-box";

  const answerBox = (
    <div className="ops__formula">
      <div className={answerBoxClass}>
        {answerLabel ?? (mode === "numpad" ? <span className="ops__cursor">_</span> : "?")}
      </div>
    </div>
  );

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
        {!isIdentify && <InputModeToggle mode={mode} onToggle={toggle} />}
      </ActivityHeader>

      <div className={`ops__stage ${stageClass} ${layoutClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        {isIdentify ? (
          <div className="ord__main ord__main--tap">
            <p className="ord__question">{current.question}</p>
            <div className="ord__direction" aria-label="De izquierda a derecha">
              <span className="ord__direction-arrow" aria-hidden="true">
                →
              </span>
              <span className="ord__direction-hint">(de izquierda a derecha)</span>
            </div>
            <OrdinalRow
              ex={current}
              interactive
              chosen={session.chosen}
              answerState={session.answerState}
              onPick={handlePickObject}
            />
            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </div>
        ) : (
          <>
            <div className="ord__band ord__band--question">
              <p className="ord__question">{current.question}</p>
              <div className="ord__direction" aria-label="De izquierda a derecha">
                <span className="ord__direction-arrow" aria-hidden="true">
                  →
                </span>
                <span className="ord__direction-hint">(de izquierda a derecha)</span>
              </div>
            </div>
            <div className="ord__band ord__band--images">
              <OrdinalRow ex={current} />
            </div>
            <div className="ord__band ord__band--answer">
              {mode === "numpad" || session.answerState !== "idle" ? answerBox : null}
            </div>
            <aside className="ord__side">
              {mode === "numpad" ? (
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
              ) : session.answerState === "idle" ? (
                <div className="ord__canvas">
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
                </div>
              ) : null}
              {session.answerState === "wrong" && (
                <ActionButtons onRetry={handleRetry} onNext={handleNext} />
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
