import { useState, useEffect, useCallback } from "react";
import { generateSession } from "../../../core/activities/tresSumandosColumna";
import type { TresSumandosColumnaExercise } from "../../../core/activities/tresSumandosColumna";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./TresSumandosColumnaScreen.css";

// ────────────────────────────────────────────────────────────────
// Tipos internos
// ────────────────────────────────────────────────────────────────

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: TresSumandosColumnaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  /** digits[0]=D, digits[1]=U */
  digits: string[];
  /** índice activo: 1=U primero, luego 0=D */
  activeDigit: number;
}

// ────────────────────────────────────────────────────────────────
// Cuadrícula D/U con 3 sumandos
// ────────────────────────────────────────────────────────────────

function TresSumandosGrid({
  ex,
  answerState,
  digits,
  activeDigit,
  onBoxClick,
  mode,
  canvasKey,
  onCanvasConfirm,
  onCanvasClear,
}: {
  ex: TresSumandosColumnaExercise;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
  onBoxClick: (i: number) => void;
  mode: "numpad" | "canvas";
  canvasKey: number;
  onCanvasConfirm: (i: number, d: string) => void;
  onCanvasClear: (i: number) => void;
}) {
  const ansD = answerState === "correct" ? String(Math.floor(ex.answer / 10)) : digits[0] ?? "";
  const ansU = answerState === "correct" ? String(ex.answer % 10) : digits[1] ?? "";

  const cellClass = (i: number) => {
    const active = answerState === "idle" && activeDigit === i ? "tsc__box--active" : "";
    const correct = answerState === "correct" ? "tsc__box--correct" : "";
    const wrong = answerState === "wrong" ? "tsc__box--wrong" : "";
    return ["tsc__box", active, correct, wrong].filter(Boolean).join(" ");
  };

  const renderBox = (i: number, val: string) => {
    const isActive = answerState === "idle" && activeDigit === i;
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
        {val || (isActive ? <span className="tsc__cursor">_</span> : "")}
      </div>
    );
  };

  const dStr = (n: number) => (Math.floor(n / 10) > 0 ? String(Math.floor(n / 10)) : "");
  const uStr = (n: number) => String(n % 10);

  return (
    <div className="tsc__grid">
      {/* Cabecera */}
      <span />
      <span className="tsc__col-label">D</span>
      <span className="tsc__col-label">U</span>

      {/* Sumando a */}
      <span />
      <span className="tsc__digit">{dStr(ex.a)}</span>
      <span className="tsc__digit">{uStr(ex.a)}</span>

      {/* Sumando b */}
      <span />
      <span className="tsc__digit">{dStr(ex.b)}</span>
      <span className="tsc__digit">{uStr(ex.b)}</span>

      {/* Sumando c con símbolo + */}
      <span className="tsc__op">+</span>
      <span className="tsc__digit">{dStr(ex.c)}</span>
      <span className="tsc__digit">{uStr(ex.c)}</span>

      {/* Separador */}
      <span className="tsc__separator" />

      {/* Respuesta */}
      <span />
      {renderBox(0, ansD)}
      {renderBox(1, ansU)}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────

export function TresSumandosColumnaScreen({
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
      digits: ["", ""],
      activeDigit: 1,
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

  const submitDigits = useCallback(
    (newDigits: string[]) => {
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
      const nd = [...session.digits];
      nd[i] = digit;
      if (i === 1) {
        setSession((s) => ({ ...s, digits: nd, activeDigit: 0 }));
      } else {
        submitDigits(nd);
      }
      setCanvasKey((k) => k + 1);
    },
    [session.digits, submitDigits],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      const { digits, activeDigit } = session;
      const nd = [...digits];
      nd[activeDigit] = d;
      if (activeDigit === 1) {
        setSession((s) => ({ ...s, digits: nd, activeDigit: 0 }));
      } else {
        submitDigits(nd);
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
      ? "tsc__stage--correct"
      : session.answerState === "wrong"
        ? "tsc__stage--wrong"
        : "";

  return (
    <div className="tsc">
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

      <div className={mode === "numpad" ? "tsc__body tsc__body--with-numpad" : "tsc__body"}>
        <div className={`tsc__stage ${stageClass}`}>
          {session.answerState === "correct" && (
            <div className="tsc__celebration">¡Muy bien! ⭐</div>
          )}
          <TresSumandosGrid
            ex={current}
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
          <footer className="tsc__footer">
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
