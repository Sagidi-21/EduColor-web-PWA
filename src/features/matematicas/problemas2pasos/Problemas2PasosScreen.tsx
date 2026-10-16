import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateSteps,
  type Problemas2Exercise,
} from "../../../core/activities/problemas2pasos";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import { LazyDigitCell } from "../../shared/DigitCell";
import "./Problemas2PasosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";
type FocusField = "mid" | "result";

interface SessionState {
  exercises: Problemas2Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Casillas L→R (decenas…unidades). Se rellenan empezando por unidades. */
  midDigits: string[];
  resultDigits: string[];
  /** Índice activo dentro del campo en foco (unidades = length - 1). */
  activeDigit: number;
  focus: FocusField;
  alreadyFailed: boolean;
}

const AUTOAVANCE_MS = 900;

function emptySlots(n: number): string[] {
  return Array.from({ length: n }, () => "");
}

function slotsFor(
  ex: Problemas2Exercise | undefined,
): Pick<SessionState, "midDigits" | "resultDigits" | "activeDigit" | "focus"> {
  const midLen = ex ? String(ex.mid).length : 1;
  return {
    midDigits: emptySlots(midLen),
    resultDigits: emptySlots(ex ? String(ex.result).length : 1),
    activeDigit: midLen - 1,
    focus: "mid",
  };
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  const exercises = generateSession(difficulty, seed);
  return {
    exercises,
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    ...slotsFor(exercises[0]),
    alreadyFailed: false,
  };
}

const HINT: Record<FocusField, string> = {
  mid: "Resultado del paso 1",
  result: "Resultado final",
};

/** Un recuadro por dígito; el cursor empieza en unidades (derecha). */
function DigitBoxes({
  values,
  active,
  activeIndex,
}: {
  values: string[];
  active: boolean;
  activeIndex: number;
}) {
  return (
    <span className="p2p__boxes" aria-hidden={!active}>
      {values.map((filled, i) => {
        const isCursor = active && i === activeIndex;
        return (
          <span
            key={i}
            className={`p2p__box${isCursor ? " p2p__box--active" : ""}${filled ? " p2p__box--filled" : ""}`}
          >
            {filled || "_"}
          </span>
        );
      })}
    </span>
  );
}

export default function Problemas2PasosScreen({
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
  const [session, setSession] = useState(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const { mode, toggle } = useInputMode();

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleRetry = useCallback(() => {
    setSession((s) => {
      const ex = s.exercises[s.currentIndex];
      return {
        ...s,
        answerState: "idle",
        ...slotsFor(ex),
        alreadyFailed: true,
      };
    });
    setCanvasKey((k) => k + 1);
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        correct: session.correctCount,
        total,
        duration: Date.now() - session.startTime,
      });
    } else {
      const ex = session.exercises[next];
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        ...slotsFor(ex),
        alreadyFailed: false,
      }));
      setCanvasKey((k) => k + 1);
    }
  }, [session, total]);

  const submitPair = useCallback(
    (mid: string[], result: string[], alreadyFailed: boolean) => {
      if (!current) return;
      const ok = validateSteps(current, mid.join(""), result.join(""));
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        midDigits: mid,
        resultDigits: result,
        correctCount: ok && !alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: ok ? s.alreadyFailed : true,
      }));
    },
    [current],
  );

  const applyDigit = useCallback(
    (digit: string) => {
      if (session.answerState !== "idle" || !current) return;
      const isMid = session.focus === "mid";
      const slots = [...(isMid ? session.midDigits : session.resultDigits)];
      const { activeDigit } = session;
      if (activeDigit < 0 || activeDigit >= slots.length) return;
      if (slots[activeDigit] !== "") return;

      slots[activeDigit] = digit;

      if (activeDigit > 0) {
        // Siguiente: hacia las decenas (izquierda)
        setSession((s) =>
          isMid
            ? { ...s, midDigits: slots, activeDigit: activeDigit - 1 }
            : { ...s, resultDigits: slots, activeDigit: activeDigit - 1 },
        );
        setCanvasKey((k) => k + 1);
        return;
      }

      // Casilla de mayor valor rellena → campo completo
      if (isMid) {
        const resultLen = String(current.result).length;
        setSession((s) => ({
          ...s,
          midDigits: slots,
          resultDigits: emptySlots(resultLen),
          focus: "result",
          activeDigit: resultLen - 1,
        }));
        setCanvasKey((k) => k + 1);
        return;
      }

      submitPair(session.midDigits, slots, session.alreadyFailed);
    },
    [session, current, submitPair],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    const isMid = session.focus === "mid";
    const slots = [...(isMid ? session.midDigits : session.resultDigits)];
    const { activeDigit } = session;

    if (slots[activeDigit]) {
      slots[activeDigit] = "";
      setSession((s) => (isMid ? { ...s, midDigits: slots } : { ...s, resultDigits: slots }));
      return;
    }

    // Casilla vacía → volver hacia las unidades (derecha)
    if (activeDigit < slots.length - 1) {
      const next = activeDigit + 1;
      slots[next] = "";
      setSession((s) =>
        isMid
          ? { ...s, midDigits: slots, activeDigit: next }
          : { ...s, resultDigits: slots, activeDigit: next },
      );
      setCanvasKey((k) => k + 1);
      return;
    }

    // En unidades vacías del resultado → volver al paso 1 (borrar última cifra escrita = decenas)
    if (!isMid) {
      const mid = [...session.midDigits];
      mid[0] = "";
      setSession((s) => ({
        ...s,
        focus: "mid",
        midDigits: mid,
        resultDigits: emptySlots(slots.length),
        activeDigit: 0,
      }));
      setCanvasKey((k) => k + 1);
    }
  }, [session]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? ""}
        onRestart={() => {
          setFinished(null);
          setSession(freshSession(sessionSeed, difficulty));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const feedbackClass =
    session.answerState === "correct"
      ? " p2p__body--correct"
      : session.answerState === "wrong"
        ? " p2p__body--wrong"
        : "";
  const showInputPanel = session.answerState === "idle";
  const op1 = current.op1 === "+" ? "+" : "−";
  const op2 = current.op2 === "+" ? "+" : "−";
  const midComplete = session.midDigits.every((d) => d !== "");
  const midShown = midComplete ? session.midDigits.join("") : "?";
  const canvasSlots = session.focus === "mid" ? session.midDigits : session.resultDigits;

  return (
    <div className={`p2p ${className ?? ""}`}>
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

      <div className={`p2p__body p2p__body--split${feedbackClass}`}>
        <div className="p2p__stage">
          <div className="p2p__story-card">
            <p className="p2p__story-line">
              {current.story
                .map((line) => line.replace(/\s+$/, "").replace(/\.$/, ""))
                .join(". ")
                .concat(".")}
            </p>
            <p className="p2p__question">{current.question}</p>
          </div>

          <div className="p2p__ops" aria-label="Operaciones en dos pasos">
            <button
              type="button"
              className={`p2p__op${session.focus === "mid" && showInputPanel ? " p2p__op--active" : ""}`}
              onClick={() => {
                if (!showInputPanel) return;
                setSession((s) => ({
                  ...s,
                  focus: "mid",
                  activeDigit: s.midDigits.length - 1,
                }));
                setCanvasKey((k) => k + 1);
              }}
              disabled={!showInputPanel}
            >
              <span className="p2p__op-label">Paso 1</span>
              <span className="p2p__op-expr">
                {current.a} {op1} {current.b} ={" "}
                <DigitBoxes
                  values={session.midDigits}
                  active={session.focus === "mid" && showInputPanel}
                  activeIndex={session.focus === "mid" ? session.activeDigit : -1}
                />
              </span>
            </button>

            <button
              type="button"
              className={`p2p__op${session.focus === "result" && showInputPanel ? " p2p__op--active" : ""}`}
              onClick={() => {
                if (!showInputPanel || !midComplete) return;
                setSession((s) => ({
                  ...s,
                  focus: "result",
                  activeDigit: s.resultDigits.length - 1,
                }));
                setCanvasKey((k) => k + 1);
              }}
              disabled={!showInputPanel || !midComplete}
            >
              <span className="p2p__op-label">Paso 2</span>
              <span className="p2p__op-expr">
                {midShown} {op2} {current.c} ={" "}
                <DigitBoxes
                  values={session.resultDigits}
                  active={session.focus === "result" && showInputPanel}
                  activeIndex={session.focus === "result" ? session.activeDigit : -1}
                />
              </span>
            </button>
          </div>
        </div>

        <aside className="p2p__panel" aria-live="polite">
          {session.answerState === "correct" && (
            <div className="p2p__cheer" role="status">
              ¡Correcto! ⭐
            </div>
          )}

          {showInputPanel && mode === "canvas" && (
            <>
              <p className="p2p__panel-hint">{HINT[session.focus]}</p>
              <div
                className={`p2p__canvas-row${canvasSlots.length > 1 ? " p2p__canvas-row--multi" : ""}`}
                aria-label={`${HINT[session.focus]}: ${canvasSlots.length} dígito${canvasSlots.length > 1 ? "s" : ""}`}
              >
                {canvasSlots.map((filled, i) => {
                  const isActive = i === session.activeDigit;
                  return (
                    <LazyDigitCell
                      key={`p2p-canvas-${session.focus}-${i}-${isActive ? canvasKey : filled || "empty"}`}
                      isActive={isActive}
                      onActivate={() => {
                        if (isActive) return;
                        // Reescribir desde esta casilla: borra ella y las ya escritas después (hacia decenas)
                        setSession((s) => {
                          const slots = [...(s.focus === "mid" ? s.midDigits : s.resultDigits)];
                          for (let j = 0; j <= i; j++) slots[j] = "";
                          return s.focus === "mid"
                            ? { ...s, midDigits: slots, activeDigit: i }
                            : { ...s, resultDigits: slots, activeDigit: i };
                        });
                        setCanvasKey((k) => k + 1);
                      }}
                      onConfirm={(d) => applyDigit(String(d))}
                      onClear={() => {}}
                      state="idle"
                      value={isActive ? "" : filled}
                    />
                  );
                })}
              </div>
            </>
          )}

          {showInputPanel && mode === "numpad" && (
            <>
              <p className="p2p__panel-hint">{HINT[session.focus]}</p>
              <Numpad
                onDigit={applyDigit}
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
