import { useState, useEffect, useCallback } from "react";
import { generateSession } from "../../../core/activities/sumaLlevando";
import type { SumaLlevandoExercise } from "../../../core/activities/sumaLlevando";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./SumaLlevandoScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/**
 * Índices de casilla:
 *   0 → Unidades del resultado
 *   1 → Dígito de "llevar" (carry)
 *   2 → Decenas del resultado
 *
 * Por defecto empieza en unidades y autoavanza 0→1→2.
 * El alumno puede pulsar otro recuadro para cambiar el orden.
 * El panel (numpad/canvas) solo se oculta en correcto o en reintentar/siguiente.
 */

/** Siguiente casilla vacía en orden circular tras `from`, o null si están todas llenas. */
function nextEmptyStep(inputs: [string, string, string], from: 0 | 1 | 2): 0 | 1 | 2 | null {
  for (let i = 1; i <= 3; i++) {
    const s = ((from + i) % 3) as 0 | 1 | 2;
    if (inputs[s] === "") return s;
  }
  return null;
}
interface SessionState {
  exercises: SumaLlevandoExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  step: 0 | 1 | 2 | null;
  /** [U, carry, D] */
  inputs: [string, string, string];
}

const BOX_HINT: Record<0 | 1 | 2, string> = {
  0: "Unidades",
  1: "¿cuántas me llevo?",
  2: "Decenas",
};

function SumaLlevandoGrid({
  ex,
  answerState,
  inputs,
  step,
  onBoxClick,
}: {
  ex: SumaLlevandoExercise;
  answerState: AnswerState;
  inputs: [string, string, string];
  step: 0 | 1 | 2 | null;
  onBoxClick: (s: 0 | 1 | 2) => void;
}) {
  const sumU = ex.addends.reduce((acc, v) => acc + (v % 10), 0);
  const expectedCarry = Math.floor(sumU / 10);
  const resultU = ex.answer % 10;
  const resultD = Math.floor(ex.answer / 10);

  const ansU = answerState === "correct" ? String(resultU) : inputs[0];
  const ansCarry = answerState === "correct" ? String(expectedCarry) : inputs[1];
  const ansD = answerState === "correct" ? String(resultD) : inputs[2];

  const boxClass = (s: 0 | 1 | 2) => {
    const base = "sumall__box";
    const active = answerState === "idle" && step === s ? "sumall__box--active" : "";
    const correct = answerState === "correct" ? "sumall__box--correct" : "";
    const wrong = answerState === "wrong" ? "sumall__box--wrong" : "";
    return [base, active, correct, wrong].filter(Boolean).join(" ");
  };

  const renderBox = (s: 0 | 1 | 2, val: string, label: string) => {
    const isActive = answerState === "idle" && step === s;
    return (
      <div key={s} className={boxClass(s)} onClick={() => onBoxClick(s)} title={label}>
        {val || (isActive ? <span className="sumall__cursor">_</span> : "")}
      </div>
    );
  };

  const [a, b, c] = [ex.addends[0], ex.addends[1], ex.addends[2] ?? null];

  return (
    <div className="sumall__grid">
      <span />
      <span className="sumall__carry-label">llevar</span>
      {renderBox(1, ansCarry, "Llevar")}
      <span />

      <span />
      <span className="sumall__col-label">D</span>
      <span className="sumall__col-label">U</span>
      <span />

      <span />
      <span className="sumall__digit sumall__digit--under-labels">
        {Math.floor(a / 10) > 0 ? Math.floor(a / 10) : ""}
      </span>
      <span className="sumall__digit sumall__digit--under-labels">{a % 10}</span>
      <span />

      {c === null ? <span className="sumall__op">+</span> : <span />}
      <span className="sumall__digit">{Math.floor(b / 10) > 0 ? Math.floor(b / 10) : ""}</span>
      <span className="sumall__digit">{b % 10}</span>
      <span />

      {c !== null && (
        <>
          <span className="sumall__op">+</span>
          <span className="sumall__digit">{Math.floor(c / 10) > 0 ? Math.floor(c / 10) : ""}</span>
          <span className="sumall__digit">{c % 10}</span>
          <span />
        </>
      )}

      <span className="sumall__separator" />

      <span />
      {renderBox(2, ansD, "Decenas")}
      {renderBox(0, ansU, "Unidades")}
      <span />
    </div>
  );
}

export function SumaLlevandoScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const { mode, toggle: toggleMode } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const makeSession = useCallback(
    (s: number): SessionState => ({
      exercises: generateSession(difficulty, s),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      step: 0,
      inputs: ["", "", ""],
    }),
    [difficulty],
  );

  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => makeSession(sessionSeed));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  /** Al cambiar de modo se reinicia en unidades (panel sigue visible). */
  const toggle = useCallback(() => {
    toggleMode();
    setSession((s) => (s.answerState === "idle" ? { ...s, step: 0 } : s));
    setCanvasKey((k) => k + 1);
  }, [toggleMode]);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const submitInputs = useCallback(
    (newInputs: [string, string, string]) => {
      const u = parseInt(newInputs[0], 10);
      const carry = parseInt(newInputs[1], 10);
      const d = parseInt(newInputs[2], 10);

      const sumU = current.addends.reduce((acc, v) => acc + (v % 10), 0);
      const expectedCarry = Math.floor(sumU / 10);
      const finalResult = d * 10 + u;

      const isCorrect = carry === expectedCarry && finalResult === current.answer;
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        inputs: newInputs,
        step: null,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect || s.alreadyFailed,
      }));
    },
    [current],
  );

  /** Rellena la casilla activa y autoavanza a la siguiente vacía; si están las 3, valida. */
  const fillActiveBox = useCallback(
    (d: string) => {
      if (session.answerState !== "idle" || session.step === null) return;
      const filled = session.step;
      const newInputs = [...session.inputs] as [string, string, string];
      newInputs[filled] = d;
      if (newInputs.every((v) => v !== "")) {
        submitInputs(newInputs);
      } else {
        const next = nextEmptyStep(newInputs, filled) ?? 0;
        setSession((st) => ({ ...st, inputs: newInputs, step: next }));
        setCanvasKey((k) => k + 1);
      }
    },
    [session.answerState, session.inputs, session.step, submitInputs],
  );

  const handleDigit = useCallback(
    (d: string) => {
      fillActiveBox(d);
    },
    [fillActiveBox],
  );

  const handleCanvasConfirm = useCallback(
    (s: 0 | 1 | 2, d: string) => {
      if (session.answerState !== "idle") return;
      const newInputs = [...session.inputs] as [string, string, string];
      newInputs[s] = d;
      if (newInputs.every((v) => v !== "")) {
        submitInputs(newInputs);
      } else {
        const next = nextEmptyStep(newInputs, s) ?? 0;
        setSession((st) => ({ ...st, inputs: newInputs, step: next }));
        setCanvasKey((k) => k + 1);
      }
    },
    [session.answerState, session.inputs, submitInputs],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle" || session.step === null) return;
    const nd = [...session.inputs] as [string, string, string];
    nd[session.step] = "";
    setSession((s) => ({ ...s, inputs: nd }));
  }, [session]);

  const handleConfirm = useCallback(() => {
    if (session.answerState !== "idle") return;
    if (session.inputs.every((d) => d !== "")) submitInputs(session.inputs);
  }, [session, submitInputs]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      step: 0,
      inputs: ["", "", ""],
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
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
        step: 0,
        inputs: ["", "", ""],
        alreadyFailed: false,
      }));
      setCanvasKey((k) => k + 1);
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        onRestart={() => {
          setFinished(null);
          setSession(makeSession(sessionSeed));
        }}
        onExit={onExit}
        gradeLabel={gradeTitle ?? "Matemáticas"}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const feedbackClass =
    session.answerState === "correct" ? "correct" : session.answerState === "wrong" ? "wrong" : "";

  /** Solo se oculta el panel de entrada con correcto o reintentar/siguiente. */
  const showInputPanel = session.answerState === "idle" && session.step !== null;

  return (
    <div className={`sumall sumall--${difficulty} sumall--${mode} ${className ?? ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div
        className={`sumall__body sumall__body--split${feedbackClass ? ` sumall__body--${feedbackClass}` : ""}`}
      >
        <div className="sumall__stage">
          <SumaLlevandoGrid
            ex={current}
            answerState={session.answerState}
            inputs={session.inputs}
            step={session.step}
            onBoxClick={(s) => {
              if (session.answerState !== "idle") return;
              setSession((st) => ({ ...st, step: s }));
              if (mode === "canvas") setCanvasKey((k) => k + 1);
            }}
          />
        </div>

        <aside className="sumall__side-panel" aria-live="polite">
          {session.answerState === "correct" && (
            <div className="sumall__celebration">¡Correcto! ➕⭐</div>
          )}

          {showInputPanel && mode === "canvas" && (
            <>
              <p className="sumall__side-hint">{BOX_HINT[session.step!]}</p>
              <LazyDigitCell
                key={`side-canvas-${session.step}-${canvasKey}`}
                isActive
                onActivate={() => {}}
                onConfirm={(d) => handleCanvasConfirm(session.step as 0 | 1 | 2, d)}
                onClear={() => {
                  /* solo limpia el trazo; el valor del recuadro se mantiene */
                }}
                state="idle"
                value=""
              />
            </>
          )}

          {showInputPanel && mode === "numpad" && (
            <>
              <p className="sumall__side-hint">{BOX_HINT[session.step!]}</p>
              <Numpad
                onDigit={handleDigit}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                disabled={false}
              />
            </>
          )}

          {session.answerState === "wrong" && (
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          )}
        </aside>
      </div>
    </div>
  );
}
