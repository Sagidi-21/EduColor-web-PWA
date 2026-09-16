import { useState, useEffect, useCallback } from "react";
import { generateSession, showImageSupport } from "../../../core/activities/operations";
import type {
  OperationsExercise,
  OperationType,
  SessionResult,
} from "../../../core/activities/operations";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./OperationsScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: OperationsExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
}

const OP_SYMBOLS: Record<OperationType, string> = { suma: "+", resta: "−" };

function answerLen(answer: number): number {
  return String(answer).length;
}

function padLeft(n: number, cols: number): (string | null)[] {
  const s = String(n);
  return [...Array(cols - s.length).fill(null), ...s.split("")];
}

function ImageRow({ count, imageUrl }: { count: number; imageUrl: string }): JSX.Element {
  return (
    <div className="ops__emoji-row">
      {Array.from({ length: count }, (_, i) => (
        <img key={i} src={imageUrl} className="ops__emoji-img" alt="" />
      ))}
    </div>
  );
}

export function OperationsScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const op: OperationType = activity.engineId as OperationType;
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const [session, setSession] = useState<SessionState>(() => {
    const exercises = generateSession(op, difficulty, seed);
    const firstLen = answerLen(exercises[0].answer);
    return {
      exercises,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: firstLen - 1,
    };
  });
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const showImg = showImageSupport(op, difficulty);
  const aLen = answerLen(current.answer);
  const numCols = Math.max(String(current.a).length, String(current.b).length, aLen);
  const aDigits = padLeft(current.a, numCols);
  const bDigits = padLeft(current.b, numCols);
  const sym = OP_SYMBOLS[op];

  const submitDigits = useCallback(
    (newDigits: string[]) => {
      const answer = parseInt(newDigits.join(""), 10);
      const isCorrect = !isNaN(answer) && answer === current.answer;
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        digits: newDigits,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect ? true : s.alreadyFailed,
      }));
    },
    [current],
  );

  const handleCanvasConfirm = useCallback(
    (i: number, digit: string) => {
      const newDigits = [...session.digits];
      newDigits[i] = digit;
      if (i > 0) {
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: i - 1 }));
      } else {
        submitDigits(newDigits);
      }
    },
    [session.digits, submitDigits],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      const { digits, activeDigit } = session;
      if (activeDigit < 0) return;
      const newDigits = [...digits];
      newDigits[activeDigit] = d;
      if (activeDigit > 0) {
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: activeDigit - 1 }));
      } else {
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
    } else if (activeDigit > 0) {
      nd[activeDigit - 1] = "";
      setSession((s) => ({ ...s, digits: nd, activeDigit: activeDigit - 1 }));
    }
  }, [session]);

  const handleConfirm = useCallback(() => {
    if (session.answerState !== "idle") return;
    if (session.digits.every((d) => d !== "")) submitDigits([...session.digits]);
  }, [session, submitDigits]);

  const handleRetry = useCallback(() => {
    const curLen = answerLen(session.exercises[session.currentIndex].answer);
    setSession((s) => ({
      ...s,
      answerState: "idle",
      digits: Array(curLen).fill(""),
      activeDigit: curLen - 1,
      alreadyFailed: true,
    }));
  }, [session]);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      const nextLen = answerLen(session.exercises[next].answer);
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        digits: Array(nextLen).fill(""),
        activeDigit: nextLen - 1,
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
          const exercises = generateSession(op, difficulty, Date.now() % 999983);
          setFinished(null);
          const restartLen = answerLen(exercises[0].answer);
          setSession({
            exercises,
            currentIndex: 0,
            correctCount: 0,
            startTime: Date.now(),
            answerState: "idle",
            digits: Array(restartLen).fill(""),
            activeDigit: restartLen - 1,
          });
        }}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  const boxValue = (i: number): string => {
    if (session.answerState === "correct") {
      return String(current.answer).padStart(aLen, "0")[i];
    }
    return session.digits[i] ?? "";
  };

  return (
    <div className="ops">
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

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <div className="ops__exercise">
          {showImg && current.imageUrl && (
            <div className="ops__emoji-support">
              <ImageRow count={current.a} imageUrl={current.imageUrl} />
              {op === "suma" && <ImageRow count={current.b} imageUrl={current.imageUrl} />}
              {op === "resta" && (
                <div className="ops__emoji-row ops__emoji-row--resta">
                  {Array.from({ length: current.a }, (_, i) => (
                    <img
                      key={i}
                      src={current.imageUrl}
                      className={`ops__emoji-img ${i >= current.a - current.b ? "ops__emoji-img--tachado" : ""}`}
                      alt=""
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ops__vertical" style={{ "--ncols": numCols } as React.CSSProperties}>
            <span className="ops__vcell ops__vcell--sym" />
            {aDigits.map((d, i) => (
              <span key={`a${i}`} className="ops__vcell">
                {d ?? ""}
              </span>
            ))}

            <span className="ops__vcell ops__vcell--sym">{sym}</span>
            {bDigits.map((d, i) => (
              <span key={`b${i}`} className="ops__vcell">
                {d ?? ""}
              </span>
            ))}

            <div className="ops__vdivider" />

            <span className="ops__vcell ops__vcell--sym" />
            {Array.from({ length: numCols - aLen }, (_, i) => (
              <span key={`pad${i}`} className="ops__vcell" />
            ))}
            {Array.from({ length: aLen }, (_, i) => {
              const isActiveBox = session.answerState === "idle" && session.activeDigit === i;

              if (mode === "canvas" && isActiveBox) {
                return (
                  <LazyDigitCell
                    key={`dab-${session.activeDigit}-${canvasKey}`}
                    isActive={true}
                    onActivate={() => {}}
                    onConfirm={(d: string) => {
                      handleCanvasConfirm(i, d);
                      setCanvasKey((k) => k + 1);
                    }}
                    onClear={() => {
                      const nd = [...session.digits];
                      nd[i] = "";
                      setSession((s) => ({ ...s, digits: nd }));
                    }}
                    state="idle"
                    value=""
                  />
                );
              }

              return (
                <div
                  key={i}
                  className={[
                    "ops__vbox",
                    isActiveBox ? "ops__vbox--active" : "",
                    session.answerState === "correct" ? "ops__vbox--correct" : "",
                    session.answerState === "wrong" ? "ops__vbox--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (session.answerState !== "idle") return;
                    const nd = [...session.digits];
                    nd[i] = "";
                    setSession((s) => ({ ...s, activeDigit: i, digits: nd }));
                  }}
                >
                  {boxValue(i) || (isActiveBox ? <span className="ops__cursor">_</span> : "")}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="ops__footer">
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
    </div>
  );
}
