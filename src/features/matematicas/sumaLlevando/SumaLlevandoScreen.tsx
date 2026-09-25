import { useState, useEffect, useCallback } from "react";
import { generateSession } from "../../../core/activities/sumaLlevando";
import type { SumaLlevandoExercise } from "../../../core/activities/sumaLlevando";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./SumaLlevandoScreen.css";

// ────────────────────────────────────────────────────────────────
// Tipos internos
// ────────────────────────────────────────────────────────────────

type AnswerState = "idle" | "correct" | "wrong";

/**
 * Orden de entrada (derecha a izquierda, luego carry):
 *   step 0 → Unidades del resultado
 *   step 1 → Dígito de "llevar" (carry)
 *   step 2 → Decenas del resultado
 */
interface SessionState {
  exercises: SumaLlevandoExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  step: 0 | 1 | 2;
  /** [U, carry, D] */
  inputs: [string, string, string];
}

// ────────────────────────────────────────────────────────────────
// Subcomponente: cuadrícula vertical con carry
// ────────────────────────────────────────────────────────────────

function SumaLlevandoGrid({
  ex,
  answerState,
  inputs,
  step,
  onBoxClick,
  mode,
  canvasKey,
  onCanvasConfirm,
  onCanvasClear,
}: {
  ex: SumaLlevandoExercise;
  answerState: AnswerState;
  inputs: [string, string, string];
  step: 0 | 1 | 2;
  onBoxClick: (s: 0 | 1 | 2) => void;
  mode: "numpad" | "canvas";
  canvasKey: number;
  onCanvasConfirm: (s: 0 | 1 | 2, d: string) => void;
  onCanvasClear: (s: 0 | 1 | 2) => void;
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

  const renderBox = (s: 0 | 1 | 2, val: string, label?: string) => {
    const isActive = answerState === "idle" && step === s;
    if (mode === "canvas" && isActive) {
      return (
        <LazyDigitCell
          key={`canvas-${s}-${canvasKey}`}
          isActive
          onActivate={() => {}}
          onConfirm={(d) => onCanvasConfirm(s, d)}
          onClear={() => onCanvasClear(s)}
          state="idle"
          value=""
        />
      );
    }
    return (
      <div key={s} className={boxClass(s)} onClick={() => onBoxClick(s)} title={label}>
        {val || (isActive ? <span className="sumall__cursor">_</span> : "")}
      </div>
    );
  };

  const [a, b, c] = [ex.addends[0], ex.addends[1], ex.addends[2] ?? null];

  return (
    <div className="sumall__grid">
      {/* Fila carry (encima de columna D) */}
      <span />
      <span className="sumall__carry-label">llevar</span>
      {renderBox(1, ansCarry, "Llevar")}
      <span />

      {/* Cabecera D / U */}
      <span />
      <span className="sumall__col-label">D</span>
      <span className="sumall__col-label">U</span>
      <span />

      {/* Sumando a */}
      <span />
      <span className="sumall__digit">{Math.floor(a / 10) > 0 ? Math.floor(a / 10) : ""}</span>
      <span className="sumall__digit">{a % 10}</span>
      <span />

      {/* Sumando b */}
      {c === null ? (
        <span className="sumall__op">+</span>
      ) : (
        <span />
      )}
      <span className="sumall__digit">{Math.floor(b / 10) > 0 ? Math.floor(b / 10) : ""}</span>
      <span className="sumall__digit">{b % 10}</span>
      <span />

      {/* Sumando c (opcional) */}
      {c !== null && (
        <>
          <span className="sumall__op">+</span>
          <span className="sumall__digit">{Math.floor(c / 10) > 0 ? Math.floor(c / 10) : ""}</span>
          <span className="sumall__digit">{c % 10}</span>
          <span />
        </>
      )}

      {/* Separador */}
      <span className="sumall__separator" />

      {/* Respuesta: [vacío] [D] [U] */}
      <span />
      {renderBox(2, ansD, "Decenas")}
      {renderBox(0, ansU, "Unidades")}
      <span />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────

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
  const { mode, toggle } = useInputMode();
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

  const [session, setSession] = useState<SessionState>(() => makeSession(seed));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  /** Valida los 3 inputs [U, carry, D] */
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
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect || s.alreadyFailed,
      }));
    },
    [current],
  );

  const advanceStep = useCallback(
    (currentStep: 0 | 1 | 2, newInputs: [string, string, string]) => {
      if (currentStep === 0) {
        setSession((s) => ({ ...s, inputs: newInputs, step: 1 }));
      } else if (currentStep === 1) {
        setSession((s) => ({ ...s, inputs: newInputs, step: 2 }));
      } else {
        submitInputs(newInputs);
      }
    },
    [submitInputs],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      const newInputs = [...session.inputs] as [string, string, string];
      newInputs[session.step] = d;
      advanceStep(session.step, newInputs);
    },
    [session, advanceStep],
  );

  const handleCanvasConfirm = useCallback(
    (s: 0 | 1 | 2, d: string) => {
      const newInputs = [...session.inputs] as [string, string, string];
      newInputs[s] = d;
      advanceStep(s, newInputs);
      setCanvasKey((k) => k + 1);
    },
    [session.inputs, advanceStep],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    const nd = [...session.inputs] as [string, string, string];
    if (nd[session.step]) {
      nd[session.step] = "";
      setSession((s) => ({ ...s, inputs: nd }));
    } else if (session.step > 0) {
      const prevStep = (session.step - 1) as 0 | 1 | 2;
      nd[prevStep] = "";
      setSession((s) => ({ ...s, inputs: nd, step: prevStep }));
    }
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
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({ total, correct: session.correctCount, duration: Date.now() - session.startTime });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        step: 0,
        inputs: ["", "", ""],
        alreadyFailed: false,
      }));
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
          setSession(makeSession(Date.now() % 999983));
        }}
        onExit={onExit}
        gradeLabel={gradeTitle ?? "Matemáticas"}
      />
    );
  }

  if (!current) return null;

  const stageClass =
    session.answerState === "correct"
      ? "sumall__stage--correct"
      : session.answerState === "wrong"
        ? "sumall__stage--wrong"
        : "";

  return (
    <div className="sumall">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={mode === "numpad" ? "sumall__body sumall__body--with-numpad" : "sumall__body"}>
        <div className={`sumall__stage ${stageClass}`}>
          {session.answerState === "correct" && (
            <div className="sumall__celebration">¡Muy bien! ⭐</div>
          )}
          <SumaLlevandoGrid
            ex={current}
            answerState={session.answerState}
            inputs={session.inputs}
            step={session.step}
            onBoxClick={(s) => {
              if (session.answerState !== "idle") return;
              setSession((st) => ({ ...st, step: s }));
            }}
            mode={mode}
            canvasKey={canvasKey}
            onCanvasConfirm={handleCanvasConfirm}
            onCanvasClear={(s) => {
              const nd = [...session.inputs] as [string, string, string];
              nd[s] = "";
              setSession((st) => ({ ...st, inputs: nd }));
            }}
          />
        </div>

        {(mode === "numpad" || session.answerState === "wrong") && (
          <footer className="sumall__footer">
            {mode === "numpad" && (
              <Numpad
                onDigit={handleDigit}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                disabled={session.answerState !== "idle"}
              />
            )}
            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
