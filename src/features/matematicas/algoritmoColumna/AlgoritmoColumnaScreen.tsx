import { useState, useEffect, useCallback } from "react";
import { generateSession as genAlgoritmo } from "../../../core/activities/algoritmoVertical";
import { generateSession as genResta } from "../../../core/activities/restaColumna";
import type { AlgoritmoVerticalExercise } from "../../../core/activities/algoritmoVertical";
import type { RestaColumnaExercise } from "../../../core/activities/restaColumna";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./AlgoritmoColumnaScreen.css";

// ────────────────────────────────────────────────────────────────
// Tipos internos
// ────────────────────────────────────────────────────────────────

type AnswerState = "idle" | "correct" | "wrong";
type OpType = "algoritmoVertical" | "restaColumna";
type Exercise = AlgoritmoVerticalExercise | RestaColumnaExercise;

interface SessionState {
  exercises: Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  /** digits[0]=decenas, digits[1]=unidades (orden visual DU) */
  digits: string[];
  /** índice del hueco activo (1=unidades primero, luego 0=decenas) */
  activeDigit: number;
}

// ────────────────────────────────────────────────────────────────
// Subcomponente: cuadrícula vertical D/U
// ────────────────────────────────────────────────────────────────

function VerticalGrid({
  ex,
  op,
  answerState,
  digits,
  activeDigit,
  onBoxClick,
  mode,
  canvasKey,
  onCanvasConfirm,
  onCanvasClear,
}: {
  ex: Exercise;
  op: OpType;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
  onBoxClick: (i: number) => void;
  mode: "numpad" | "canvas";
  canvasKey: number;
  onCanvasConfirm: (i: number, d: string) => void;
  onCanvasClear: (i: number) => void;
}) {
  const symbol = op === "restaColumna" ? "−" : "+";
  const aD = ex.aD > 0 ? String(ex.aD) : "";
  const aU = String(ex.aU);
  const bD = ex.bD > 0 ? String(ex.bD) : "";
  // Para restaColumna: mostrar bU sólo si hay bD o bU > 0
  const bU =
    op === "restaColumna"
      ? ex.bU > 0 || ex.bD > 0
        ? String(ex.bU)
        : ""
      : String(ex.bU);

  const ansD = answerState === "correct" ? String(Math.floor(ex.answer / 10)) : digits[0] ?? "";
  const ansU = answerState === "correct" ? String(ex.answer % 10) : digits[1] ?? "";

  const cellClass = (i: number) => {
    const base = "algcol__box";
    const active = answerState === "idle" && activeDigit === i ? "algcol__box--active" : "";
    const correct = answerState === "correct" ? "algcol__box--correct" : "";
    const wrong = answerState === "wrong" ? "algcol__box--wrong" : "";
    return [base, active, correct, wrong].filter(Boolean).join(" ");
  };

  return (
    <div className="algcol__grid">
      {/* Cabecera D / U */}
      <span />
      <span className="algcol__col-label">D</span>
      <span className="algcol__col-label">U</span>

      {/* Primera fila: a */}
      <span />
      <span className="algcol__digit">{aD}</span>
      <span className="algcol__digit">{aU}</span>

      {/* Segunda fila: b con símbolo */}
      <span className="algcol__op">{symbol}</span>
      <span className="algcol__digit">{bD}</span>
      <span className="algcol__digit">{bU}</span>

      {/* Línea separadora */}
      <span className="algcol__separator" />

      {/* Fila de respuesta */}
      <span />
      {[0, 1].map((i) => {
        const isActive = answerState === "idle" && activeDigit === i;
        const val = i === 0 ? ansD : ansU;

        if (mode === "canvas" && isActive) {
          return (
            <LazyDigitCell
              key={`canvas-${i}-${canvasKey}`}
              isActive
              onActivate={() => {}}
              onConfirm={(d) => onCanvasConfirm(i, d)}
              onClear={() => onCanvasClear(i)}
              state="idle"
              value=""
            />
          );
        }

        return (
          <div key={i} className={cellClass(i)} onClick={() => onBoxClick(i)}>
            {val || (isActive ? <span className="algcol__cursor">_</span> : "")}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────

export function AlgoritmoColumnaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const op = activity.engineId as OpType;
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const makeSession = useCallback(
    (s: number): SessionState => {
      const exercises =
        op === "restaColumna" ? genResta(difficulty, s) : genAlgoritmo(difficulty, s);
      return {
        exercises,
        currentIndex: 0,
        correctCount: 0,
        startTime: Date.now(),
        answerState: "idle",
        // activeDigit empieza en 1 (unidades primero, de derecha a izquierda)
        digits: ["", ""],
        activeDigit: 1,
      };
    },
    [op, difficulty],
  );

  const [session, setSession] = useState<SessionState>(() => makeSession(seed));
  const [finished, setFinished] = useState<{ total: number; correct: number; duration: number } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const submitDigits = useCallback(
    (newDigits: string[]) => {
      // digits[0]=D, digits[1]=U → reconstruir como número DU
      const val = parseInt(newDigits.join(""), 10);
      const isCorrect = !isNaN(val) && val === current.answer;
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        digits: newDigits,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect || s.alreadyFailed,
      }));
    },
    [current],
  );

  const handleCanvasConfirm = useCallback(
    (i: number, digit: string) => {
      const newDigits = [...session.digits];
      newDigits[i] = digit;
      if (i === 1) {
        // acaba de poner U, mueve a D
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: 0 }));
      } else {
        // acaba de poner D → submit
        submitDigits(newDigits);
      }
      setCanvasKey((k) => k + 1);
    },
    [session.digits, submitDigits],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      const { digits, activeDigit } = session;
      const newDigits = [...digits];
      newDigits[activeDigit] = d;
      if (activeDigit === 1) {
        // U → mover a D
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: 0 }));
      } else {
        // D → submit
        submitDigits(newDigits);
      }
    },
    [session, submitDigits],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    const { digits, activeDigit } = session;
    const nd = [...digits];
    if (nd[activeDigit]) {
      nd[activeDigit] = "";
      setSession((s) => ({ ...s, digits: nd }));
    } else if (activeDigit === 0) {
      nd[1] = "";
      setSession((s) => ({ ...s, digits: nd, activeDigit: 1 }));
    }
  }, [session]);

  const handleConfirm = useCallback(() => {
    if (session.answerState !== "idle") return;
    if (session.digits.every((d) => d !== "")) submitDigits([...session.digits]);
  }, [session, submitDigits]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      digits: ["", ""],
      activeDigit: 1,
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
        digits: ["", ""],
        activeDigit: 1,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
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
      ? "algcol__stage--correct"
      : session.answerState === "wrong"
        ? "algcol__stage--wrong"
        : "";

  return (
    <div className="algcol">
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

      <div className={mode === "numpad" ? "algcol__body algcol__body--with-numpad" : "algcol__body"}>
        <div className={`algcol__stage ${stageClass}`}>
          {session.answerState === "correct" && (
            <div className="algcol__celebration">¡Muy bien! ⭐</div>
          )}
          <VerticalGrid
            ex={current}
            op={op}
            answerState={session.answerState}
            digits={session.digits}
            activeDigit={session.activeDigit}
            onBoxClick={(i) => {
              if (session.answerState !== "idle") return;
              const nd = [...session.digits];
              nd[i] = "";
              setSession((s) => ({ ...s, activeDigit: i, digits: nd }));
            }}
            mode={mode}
            canvasKey={canvasKey}
            onCanvasConfirm={handleCanvasConfirm}
            onCanvasClear={(i) => {
              const nd = [...session.digits];
              nd[i] = "";
              setSession((s) => ({ ...s, digits: nd }));
            }}
          />
        </div>

        {(mode === "numpad" || session.answerState === "wrong") && (
          <footer className="algcol__footer">
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
