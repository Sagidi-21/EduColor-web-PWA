import { useCallback, useEffect, useState } from "react";
import { generateSession, validateDigits } from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";
import "./Algoritmo3CifrasScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/**
 * Orden del algoritmo (como sumaLlevando en 1.º, ampliado a 3 cifras):
 *   0 → Unidades del resultado
 *   1 → Llevar/prestar a decenas
 *   2 → Decenas del resultado
 *   3 → Llevar/prestar a centenas
 *   4 → Centenas del resultado
 */
type Step = 0 | 1 | 2 | 3 | 4;

/** [U, carryD, D, carryC, C] — mismo orden que el flujo de casillas. */
type Inputs = [string, string, string, string, string];

interface SessionState {
  exercises: Algoritmo3Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  alreadyFailed: boolean;
  step: Step | null;
  inputs: Inputs;
}

const AUTOAVANCE_MS = 900;

const BOX_HINT: Record<Step, string> = {
  0: "Unidades",
  1: "¿cuántas me llevo?",
  2: "Decenas",
  3: "¿cuántas me llevo?",
  4: "Centenas",
};

function emptyInputs(): Inputs {
  return ["", "", "", "", ""];
}

function nextEmptyStep(inputs: Inputs, from: Step): Step | null {
  for (let i = 1; i <= 5; i++) {
    const s = ((from + i) % 5) as Step;
    if (inputs[s] === "") return s;
  }
  return null;
}

/** Cifras del resultado [C, D, U] a partir del vector de entrada. */
function resultFromInputs(inputs: Inputs): string[] {
  return [inputs[4], inputs[2], inputs[0]];
}

function AlgoritmoGrid({
  ex,
  answerState,
  inputs,
  step,
  onBoxClick,
}: {
  ex: Algoritmo3Exercise;
  answerState: AnswerState;
  inputs: Inputs;
  step: Step | null;
  onBoxClick: (s: Step) => void;
}) {
  const carryLabel = ex.op === "+" ? "llevar" : "prestar";
  const ansU = inputs[0];
  const ansCarryD = inputs[1];
  const ansD = inputs[2];
  const ansCarryC = inputs[3];
  const ansC = inputs[4];

  const boxClass = (s: Step, carry = false) => {
    const base = carry ? "a3c__box a3c__box--carry" : "a3c__box";
    const active = answerState === "idle" && step === s ? " a3c__box--active" : "";
    const correct = answerState === "correct" ? " a3c__box--correct" : "";
    const wrong = answerState === "wrong" ? " a3c__box--wrong" : "";
    return `${base}${active}${correct}${wrong}`;
  };

  const renderBox = (s: Step, val: string, label: string, carry = false) => {
    const isActive = answerState === "idle" && step === s;
    return (
      <button
        key={s}
        type="button"
        className={boxClass(s, carry)}
        onClick={() => onBoxClick(s)}
        title={label}
        disabled={answerState !== "idle"}
        data-step={s}
      >
        {val || (isActive ? <span className="a3c__cursor">_</span> : "")}
      </button>
    );
  };

  return (
    <div className="a3c__grid" data-testid="a3c-grid">
      <span className="a3c__carry-label">{carryLabel}</span>
      {renderBox(3, ansCarryC, "Llevar a centenas", true)}
      {renderBox(1, ansCarryD, "Llevar a decenas", true)}
      <span />

      <span />
      <span className="a3c__col-label">C</span>
      <span className="a3c__col-label">D</span>
      <span className="a3c__col-label">U</span>

      <span />
      {/* Nunca usar `n || ""`: un 0 en D/C (p. ej. 101) dejaba un hueco en columna. */}
      <span className="a3c__digit a3c__digit--under-labels">{ex.aC}</span>
      <span className="a3c__digit a3c__digit--under-labels">{ex.aD}</span>
      <span className="a3c__digit a3c__digit--under-labels">{ex.aU}</span>

      <span className="a3c__op">{ex.op === "+" ? "+" : "−"}</span>
      <span className="a3c__digit">{ex.bC}</span>
      <span className="a3c__digit">{ex.bD}</span>
      <span className="a3c__digit">{ex.bU}</span>

      <span className="a3c__separator" />

      <span />
      {renderBox(4, ansC, "Centenas")}
      {renderBox(2, ansD, "Decenas")}
      {renderBox(0, ansU, "Unidades")}
    </div>
  );
}

/**
 * "Algoritmo de tres cifras" (2.º).
 *
 * Misma mecánica de pizarra que `sumaLlevando` en 1.º: split 2/3–1/3, flujo
 * unidades → llevar → decenas → llevar → centenas, y comprobación automática
 * al rellenar la última casilla (sin botón Comprobar).
 */
export function Algoritmo3CifrasScreen({
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
  const [sessionSeed] = useState(() => seed);

  const makeSession = useCallback(
    (): SessionState => ({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      alreadyFailed: false,
      step: 0,
      inputs: emptyInputs(),
    }),
    [difficulty, sessionSeed],
  );

  const [session, setSession] = useState<SessionState>(() => makeSession());
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const toggle = useCallback(() => {
    toggleMode();
    setSession((s) => (s.answerState === "idle" ? { ...s, step: 0 } : s));
    setCanvasKey((k) => k + 1);
  }, [toggleMode]);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const submitInputs = useCallback(
    (newInputs: Inputs) => {
      if (!current) return;
      const isCorrect = validateDigits(current, resultFromInputs(newInputs));
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

  const fillActiveBox = useCallback(
    (d: string) => {
      if (session.answerState !== "idle" || session.step === null) return;
      const filled = session.step;
      const newInputs = [...session.inputs] as Inputs;
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
    (s: Step, d: string) => {
      if (session.answerState !== "idle") return;
      const newInputs = [...session.inputs] as Inputs;
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
    const nd = [...session.inputs] as Inputs;
    nd[session.step] = "";
    setSession((s) => ({ ...s, inputs: nd }));
  }, [session]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      step: 0,
      inputs: emptyInputs(),
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
        inputs: emptyInputs(),
        alreadyFailed: false,
      }));
      setCanvasKey((k) => k + 1);
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession(makeSession());
    setCanvasKey((k) => k + 1);
  }, [makeSession]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        onRestart={handleRestart}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const feedbackClass =
    session.answerState === "correct"
      ? " a3c__body--correct"
      : session.answerState === "wrong"
        ? " a3c__body--wrong"
        : "";

  const showInputPanel = session.answerState === "idle" && session.step !== null;
  const carryHint =
    current.op === "-" && (session.step === 1 || session.step === 3)
      ? "¿cuántas presto?"
      : session.step !== null
        ? BOX_HINT[session.step]
        : "";

  return (
    <div className={`a3c ${className ?? ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={`a3c__body a3c__body--split${feedbackClass}`}>
        <div className="a3c__stage">
          <AlgoritmoGrid
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

        <aside className="a3c__panel" aria-live="polite">
          {session.answerState === "correct" && (
            <div className="a3c__cheer" role="status">
              ¡Correcto! ⭐
            </div>
          )}

          {showInputPanel && mode === "canvas" && (
            <>
              <p className="a3c__panel-hint">{carryHint}</p>
              <LazyDigitCell
                key={`a3c-canvas-${session.step}-${canvasKey}`}
                isActive
                onActivate={() => {}}
                onConfirm={(d) => handleCanvasConfirm(session.step as Step, String(d))}
                onClear={() => {}}
                state="idle"
                value=""
              />
            </>
          )}

          {showInputPanel && mode === "numpad" && (
            <>
              <p className="a3c__panel-hint">{carryHint}</p>
              <Numpad
                onDigit={handleDigit}
                onDelete={handleDelete}
                onConfirm={() => {}}
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
