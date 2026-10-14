import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/capacidad";
import type { CapacidadExercise } from "../../../core/activities/capacidad";
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
import "./CapacidadScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: CapacidadExercise[];
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

function Vessel({
  liters,
  maxLiters,
  heightPx = 260,
  showMarks = false,
  showNumbers = false,
  hint,
}: {
  liters: number;
  maxLiters: number;
  heightPx?: number;
  /** Marcas de graduación más visibles (lectura de nivel). */
  showMarks?: boolean;
  /** Números 1…max junto a las marcas (solo medium; hard/expert van sin números). */
  showNumbers?: boolean;
  /** Texto centrado bajo el recipiente (no bajo la escala). */
  hint?: string;
}) {
  const fillPct = (liters / maxLiters) * 100;
  return (
    <div className={`cap__vessel-row${showMarks ? " cap__vessel-row--scale" : ""}`}>
      <div className="cap__vessel-stack">
        <div className="cap__vessel" style={{ height: heightPx }}>
          <div className="cap__vessel-fill" style={{ height: `${fillPct}%` }} />
          <div className="cap__vessel-marks" aria-hidden="true">
            {Array.from({ length: maxLiters }, (_, i) => (
              <div key={i} className="cap__vessel-mark" />
            ))}
          </div>
        </div>
        {hint && <span className="cap__vessel-hint">{hint}</span>}
      </div>
      {showNumbers && (
        <div className="cap__scale" style={{ height: heightPx }} aria-hidden="true">
          {Array.from({ length: maxLiters }, (_, i) => {
            const n = i + 1;
            return (
              <span
                key={n}
                className="cap__scale-label"
                style={{ bottom: `${(n / maxLiters) * 100}%` }}
              >
                {n}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExerciseVisual({
  ex,
  difficulty,
}: {
  ex: CapacidadExercise;
  difficulty: EngineScreenProps["difficulty"];
}) {
  if (ex.type === "compare") {
    return (
      <div className="cap__vessels">
        <div className="cap__vessel-wrap">
          <span className="cap__vessel-label">A</span>
          <Vessel liters={ex.litersA!} maxLiters={ex.maxLiters!} />
          <span className="cap__vessel-liters">{ex.litersA} L</span>
        </div>
        <div className="cap__vessel-wrap">
          <span className="cap__vessel-label">B</span>
          <Vessel liters={ex.litersB!} maxLiters={ex.maxLiters!} />
          <span className="cap__vessel-liters">{ex.litersB} L</span>
        </div>
      </div>
    );
  }

  if (ex.type === "read") {
    // medium: marcas + números; hard/expert: solo marcas + pista inferior
    const showNumbers = difficulty === "medium";
    return (
      <div className="cap__vessels">
        <div className="cap__vessel-wrap">
          <Vessel
            liters={ex.liters!}
            maxLiters={ex.maxLiters!}
            heightPx={280}
            showMarks
            showNumbers={showNumbers}
            hint="Cada marca = 1 L"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cap__cups">
      {Array.from({ length: ex.cups! }, (_, i) => (
        <div key={i} className="cap__cup">
          <div className="cap__cup-vessel" />
          <span className="cap__cup-label">1 L</span>
        </div>
      ))}
    </div>
  );
}

export function CapacidadScreen({
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
  const isMultiChoice = current?.type === "compare";

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
    if (session.input.length < 2) return;
    const t = setTimeout(() => confirm(), 0);
    return () => clearTimeout(t);
  }, [isMultiChoice, session.input.length, mode, session.answerState, confirm]);

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, opt);
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

      <div className={`ops__stage ${stageClass} cap__stage--split`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <div className="cap__main">
          <p className="cap__question">{current.question}</p>
          <ExerciseVisual ex={current} difficulty={difficulty} />
          {!isMultiChoice && mode === "numpad" && (
            <div className="ops__formula">
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
              >
                {session.answerState === "correct"
                  ? `${current.answer} L`
                  : session.input || <span className="ops__cursor">_</span>}
              </div>
            </div>
          )}
        </div>

        <aside className="cap__side">
          {isMultiChoice ? (
            <div className="cap__options">
              {(current.options ?? []).map((opt, i) => {
                let cls = "cap__option";
                if (session.answerState === "correct" && opt === current.answer)
                  cls += " cap__option--correct";
                else if (session.answerState === "wrong" && opt === session.chosen)
                  cls += " cap__option--wrong";
                return (
                  <button
                    key={opt}
                    id={`cap-option-${i}`}
                    className={cls}
                    onClick={() => handleChoice(opt)}
                    disabled={session.answerState !== "idle"}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : mode === "numpad" ? (
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
          ) : session.answerState === "idle" ? (
            <div className="cap__canvas">
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
          ) : (
            <div className="ops__formula">
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : "ops__answer-box--wrong"}`}
              >
                {session.answerState === "correct" ? `${current.answer} L` : session.input || "?"}
              </div>
            </div>
          )}
          {session.answerState === "wrong" && (
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          )}
        </aside>
      </div>
    </div>
  );
}
