import { useState, useEffect, useCallback } from "react";
import {
  generateSession,
  validateAnswers,
  allCorrect,
} from "../../../core/activities/relacionSumaResta";
import type { RelacionSumaRestaExercise } from "../../../core/activities/relacionSumaResta";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import "./RelacionSumaRestaScreen.css";

// ────────────────────────────────────────────────────────────────
// Tipos internos
// ────────────────────────────────────────────────────────────────

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: RelacionSumaRestaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  /** inputs[0] = total−partA = partB  |  inputs[1] = total−partB = partA  |  inputs[2] = partA+partB = total */
  inputs: [string, string, string];
  /** Cuál de los 3 inputs está activo (0, 1 ó 2) */
  activeInput: 0 | 1 | 2;
}

// ────────────────────────────────────────────────────────────────
// Utilidades de estado
// ────────────────────────────────────────────────────────────────

function initSession(difficulty: string, seed: number): SessionState {
  return {
    exercises: generateSession(difficulty as Parameters<typeof generateSession>[0], seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    inputs: ["", "", ""],
    activeInput: 0,
  };
}

// ────────────────────────────────────────────────────────────────
// Componente de ecuación con input inline
// ────────────────────────────────────────────────────────────────

function EquationRow({
  leftNum,
  op,
  rightNum,
  inputIndex,
  activeInput,
  inputValue,
  answerState,
  expectedValue,
  onClick,
  showVisual = false,
  visualItems = 0,
  itemVariant = "a",
}: {
  leftNum: number;
  op: "+" | "-";
  rightNum: number;
  inputIndex: 0 | 1 | 2;
  activeInput: 0 | 1 | 2;
  inputValue: string;
  answerState: AnswerState;
  expectedValue: number;
  onClick: () => void;
  showVisual?: boolean;
  visualItems?: number;
  itemVariant?: "a" | "b";
}) {
  const isActive = activeInput === inputIndex;

  const inputClass = [
    "relsr__input",
    answerState === "correct" ? "relsr__input--correct" : "",
    answerState === "wrong" ? "relsr__input--wrong" : "",
    answerState === "idle" && isActive ? "relsr__input--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayValue = answerState === "correct" ? String(expectedValue) : inputValue;

  return (
    <div
      className="relsr__equation-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {showVisual && visualItems > 0 && (
        <div className="relsr__dots" aria-hidden="true">
          {Array.from({ length: visualItems }).map((_, i) => (
            <span key={i} className={`relsr__dot relsr__dot--${itemVariant}`} />
          ))}
        </div>
      )}
      <div className="relsr__formula">
        <span className="relsr__number">{leftNum}</span>
        <span className="relsr__op">{op}</span>
        <span className="relsr__number">{rightNum}</span>
        <span className="relsr__op">=</span>
        <div className={inputClass}>{displayValue}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Pantalla principal
// ────────────────────────────────────────────────────────────────

export function RelacionSumaRestaScreen({
  activity: _activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
}: EngineScreenProps) {
  const [session, setSession] = useState<SessionState>(() => initSession(difficulty, seed));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const showVisual = difficulty === "easy" || difficulty === "medium";

  // ── Confirmar respuesta ──────────────────────────────────────

  const handleConfirmAll = useCallback(() => {
    const results = validateAnswers(current, session.inputs);
    const ok = allCorrect(results);

    if (ok) playFeedback(true);
    else playFeedback(false);

    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
    }));
  }, [current, session.inputs]);

  // Avanzar al pulsar ✓ en el último input o desde el numpad
  const handleNextInput = useCallback(() => {
    if (session.activeInput < 2) {
      setSession((s) => ({ ...s, activeInput: (s.activeInput + 1) as 0 | 1 | 2 }));
    } else {
      handleConfirmAll();
    }
  }, [session.activeInput, handleConfirmAll]);

  // ── Siguiente ejercicio ──────────────────────────────────────

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
        inputs: ["", "", ""],
        activeInput: 0,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      alreadyFailed: true,
    }));
  }, []);

  // Auto-avance al acertar
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  // ── Numpad ───────────────────────────────────────────────────

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      setSession((s) => {
        const inputs = [...s.inputs] as [string, string, string];
        if (inputs[s.activeInput].length < 2) inputs[s.activeInput] += d;
        return { ...s, inputs };
      });
    },
    [session.answerState],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    setSession((s) => {
      const inputs = [...s.inputs] as [string, string, string];
      inputs[s.activeInput] = inputs[s.activeInput].slice(0, -1);
      return { ...s, inputs };
    });
  }, [session.answerState]);

  // ── Resumen ──────────────────────────────────────────────────

  if (finished) {
    return (
      <SummaryScreen
        result={{ correct: finished.correct, total: finished.total, duration: finished.duration }}
        gradeLabel={gradeTitle ?? ""}
        onRestart={() => {
          setFinished(null);
          setSession(initSession(difficulty, seed));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return null;

  const stageClass =
    session.answerState === "correct"
      ? "relsr__stage--correct"
      : session.answerState === "wrong"
        ? "relsr__stage--wrong"
        : "";

  const setActive = (i: 0 | 1 | 2) => {
    if (session.answerState === "idle") {
      setSession((s) => ({ ...s, activeInput: i }));
    }
  };

  return (
    <div className="relsr">
      <ActivityHeader
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`relsr__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="relsr__celebration" aria-live="polite">
            ¡Muy bien! ⭐
          </div>
        )}

        <div className="relsr__container">
          {/* ── Fila 1: total − partA = ? (partB) ── */}
          <EquationRow
            leftNum={current.total}
            op="-"
            rightNum={current.partA}
            inputIndex={0}
            activeInput={session.activeInput}
            inputValue={session.inputs[0]}
            answerState={session.answerState}
            expectedValue={current.partB}
            onClick={() => setActive(0)}
            showVisual={showVisual}
            visualItems={showVisual ? current.partA : 0}
            itemVariant="a"
          />

          {/* ── Fila 2: total − partB = ? (partA) ── */}
          <EquationRow
            leftNum={current.total}
            op="-"
            rightNum={current.partB}
            inputIndex={1}
            activeInput={session.activeInput}
            inputValue={session.inputs[1]}
            answerState={session.answerState}
            expectedValue={current.partA}
            onClick={() => setActive(1)}
            showVisual={showVisual}
            visualItems={showVisual ? current.partB : 0}
            itemVariant="b"
          />

          {/* ── Fila 3: partA + partB = ? (total) ── */}
          <EquationRow
            leftNum={current.partA}
            op="+"
            rightNum={current.partB}
            inputIndex={2}
            activeInput={session.activeInput}
            inputValue={session.inputs[2]}
            answerState={session.answerState}
            expectedValue={current.total}
            onClick={() => setActive(2)}
            showVisual={false}
          />
        </div>
      </div>

      <footer className="relsr__footer">
        <Numpad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onConfirm={handleNextInput}
          disabled={session.answerState !== "idle"}
        />

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
