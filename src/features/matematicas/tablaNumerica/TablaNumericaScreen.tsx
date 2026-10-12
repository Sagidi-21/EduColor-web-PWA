import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/tablaNumerica";
import type { TablaNumericaExercise } from "../../../core/activities/tablaNumerica";
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
import "./TablaNumericaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: TablaNumericaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  input: string;
  found: Set<number>;
  flashWrong: number | null;
  colorDone: boolean;
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
    found: new Set(),
    flashWrong: null,
    colorDone: false,
    alreadyFailed: false,
  };
}

export function TablaNumericaScreen({
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
  const isColorear = current?.type === "colorear";
  /** Medium (símbolos) y hard/expert: pulsar casillas correctas. */
  const isClickFind =
    isColorear || (current?.type === "symbol" && (current.validSet?.length ?? 0) > 0);
  const isMissing = current?.type === "missing";

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
        found: new Set(),
        flashWrong: null,
        colorDone: false,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      input: "",
      flashWrong: null,
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  useEffect(() => {
    if (!session.colorDone) return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.colorDone, handleNext]);

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
    if (mode !== "canvas") return;
    if (session.answerState !== "idle") return;
    if (session.input.length < 2) return;
    const t = setTimeout(() => confirm(), 0);
    return () => clearTimeout(t);
  }, [session.input.length, mode, session.answerState, confirm]);

  const handleFindClick = useCallback(
    (index: number) => {
      if (session.colorDone || session.found.has(index) || !current?.validSet) return;
      if (current.validSet.includes(index)) {
        const next = new Set(session.found);
        next.add(index);
        const complete = next.size === current.validSet.length;
        if (complete) playFeedback(true);
        setSession((s) => ({
          ...s,
          found: next,
          colorDone: complete,
          correctCount: complete && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        }));
      } else {
        playFeedback(false);
        setSession((s) => ({ ...s, flashWrong: index, alreadyFailed: true }));
        setTimeout(
          () =>
            setSession((s) => ({ ...s, flashWrong: s.flashWrong === index ? null : s.flashWrong })),
          500,
        );
      }
    },
    [session, current],
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

  const cells = current.gridState.map((state, index) => {
    let cls = "tbl__cell";
    let content: string = String(index);

    if (state === "blank") {
      cls += " tbl__cell--blank";
      content = "";
    } else if (state === "target") {
      cls += " tbl__cell--target";
      if (session.answerState === "correct") {
        cls += " tbl__cell--ok";
        content = String(index);
      } else if (session.answerState === "wrong") {
        cls += " tbl__cell--fail";
        content = session.input || "?";
      } else {
        content = "?";
      }
    } else if (state === "symbol") {
      const sym = current.symbolMap?.[index] ?? "?";
      cls += " tbl__cell--symbol";
      if (session.found.has(index)) cls += " tbl__cell--found";
      else if (session.flashWrong === index) cls += " tbl__cell--flash";
      content = sym;
    } else if (isClickFind) {
      if (session.found.has(index)) cls += " tbl__cell--found";
      else if (session.flashWrong === index) cls += " tbl__cell--flash";
    }

    return (
      <button
        key={index}
        id={`tbl-cell-${index}`}
        className={cls}
        onClick={isClickFind ? () => handleFindClick(index) : undefined}
        disabled={!isClickFind || session.found.has(index) || session.colorDone}
      >
        {content}
      </button>
    );
  });

  const stageClass =
    session.answerState === "correct" || session.colorDone
      ? "tbl__stage--correct"
      : session.answerState === "wrong"
        ? "tbl__stage--wrong"
        : "";

  return (
    <div className="tbl">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        {isMissing && <InputModeToggle mode={mode} onToggle={toggle} />}
      </ActivityHeader>

      <div className={`tbl__stage ${stageClass}`}>
        {(session.answerState === "correct" || session.colorDone) && (
          <div className="tbl__celebration">¡Muy bien! ⭐</div>
        )}

        {current.type === "symbol" && (
          <div className="tbl__symbol-prompt">
            Busca{" "}
            {(current.targetSymbols ?? [current.targetSymbol]).filter(Boolean).map((sym) => (
              <span key={sym} className="tbl__big-symbol">
                {sym}
              </span>
            ))}
            <span className="tbl__color-rule-count">
              {session.found.size} / {current.validSet?.length}
            </span>
          </div>
        )}

        {current.type === "colorear" && (
          <div className="tbl__color-rule">
            <span className="tbl__color-rule-text">{current.ruleLabel}</span>
            <span className="tbl__color-rule-count">
              {session.found.size} / {current.validSet?.length}
            </span>
          </div>
        )}

        <div className="tbl__grid-container">
          <div className="tbl__grid">{cells}</div>
        </div>
      </div>

      {isMissing && (
        <footer className="tbl__footer">
          <p className="tbl__question">{current.question}</p>

          <div className="tbl__answer">
            {mode === "numpad" ? (
              <>
                <div
                  className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
                >
                  {session.answerState === "correct"
                    ? current.answer
                    : session.input || <span className="ops__cursor">_</span>}
                </div>
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
              </>
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
                {session.answerState === "correct" ? current.answer : session.input || "?"}
              </div>
            )}

            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
