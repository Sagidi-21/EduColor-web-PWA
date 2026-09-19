import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/numeracion4059";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { ActivityHeader } from "../components/ActivityHeader";
import { WrongFeedback } from "../components/WrongFeedback";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
  chosen: null | number;
  alreadyFailed: boolean;
}

function answerLen(answer: number): number {
  return String(answer).length;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  const exercises = generateSession(difficulty, seed);
  const firstLen = answerLen(exercises[0].answer);
  return {
    exercises,
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    digits: Array(firstLen).fill(""),
    activeDigit: firstLen - 1,
    chosen: null,
    alreadyFailed: false,
  };
}

function TensBlock({ number }: { number: number }) {
  const decenas = Math.floor(number / 10);
  const units = number % 10;
  return (
    <div className="n4059__blocks">
      <div className="n4059__tens-row">
        {Array.from({ length: decenas }, (_, i) => (
          <div key={i} className="n4059__decena">
            10
          </div>
        ))}
      </div>
      {units > 0 && (
        <div className="n4059__units-row">
          {Array.from({ length: units }, (_, i) => (
            <div key={i} className="n4059__unit-dot" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Numeracion4059Renderer({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const isMultiChoice = difficulty === "easy";

  const [session, setSession] = useState<SessionState>(() => freshSession(seed, difficulty));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const aLen = answerLen(current.answer);

  const confirm = useCallback(() => {
    if (session.answerState !== "idle") return;
    if (session.digits.every((d) => d === "")) return;
    const answerStr = session.digits.join("");
    const ok = validateAnswer(current, answerStr);
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      alreadyFailed: !ok ? true : s.alreadyFailed,
    }));
  }, [session, current]);

  const handleRetry = useCallback(() => {
    const curLen = answerLen(session.exercises[session.currentIndex].answer);
    setSession((s) => ({
      ...s,
      answerState: "idle",
      digits: Array(curLen).fill(""),
      activeDigit: curLen - 1,
      chosen: null,
      alreadyFailed: true,
    }));
    setCanvasKey((k) => k + 1);
  }, [session]);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total)
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    else
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        digits: Array(answerLen(session.exercises[next].answer)).fill(""),
        activeDigit: answerLen(session.exercises[next].answer) - 1,
        chosen: null,
        alreadyFailed: false,
      }));
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  useEffect(() => {
    if (mode !== "canvas") return;
    if (session.answerState !== "idle") return;
    if (session.activeDigit > 0) return;
    if (session.digits.every((d) => d !== "")) confirm();
  }, [session.digits, mode, session.answerState, session.activeDigit, confirm]);

  const handleChoice = useCallback(
    (opt: number) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, String(opt));
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !ok ? true : s.alreadyFailed,
      }));
    },
    [session, current],
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
        confirm();
      }
    },
    [session, confirm],
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

  const handleCanvasConfirm = useCallback(
    (i: number, digit: string) => {
      const newDigits = [...session.digits];
      newDigits[i] = digit;
      if (i > 0) {
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: i - 1 }));
      } else {
        const answerStr = newDigits.join("");
        const ok = validateAnswer(current, answerStr);
        playFeedback(ok);
        setSession((s) => ({
          ...s,
          digits: newDigits,
          answerState: ok ? "correct" : "wrong",
          correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
          alreadyFailed: !ok ? true : s.alreadyFailed,
        }));
      }
      setCanvasKey((k) => k + 1);
    },
    [session, current],
  );

  const boxValue = (i: number): string => {
    if (session.answerState === "correct") {
      return String(current.answer).padStart(aLen, "0")[i];
    }
    return session.digits[i] ?? "";
  };

  if (finished) {
    const pct = Math.round((finished.correct / finished.total) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    const mins = Math.floor(finished.duration / 60000);
    const secs = Math.floor((finished.duration % 60000) / 1000);
    return (
      <div className="ops ops--summary">
        <div className="summary">
          <div className="summary__stars">{"?".repeat(stars)}</div>
          <h2 className="summary__title">
            {pct >= 90 ? "¡Excelente!" : pct >= 70 ? "¡Bien hecho!" : "¡Sigue practicando!"}
          </h2>
          <p className="summary__grade">{gradeTitle}</p>
          <div className="summary__stats">
            <div className="summary__stat">
              <span className="summary__stat-value">
                {finished.correct}/{finished.total}
              </span>
              <span className="summary__stat-label">correctas</span>
            </div>
            <div className="summary__stat">
              <span className="summary__stat-value">{pct}%</span>
              <span className="summary__stat-label">aciertos</span>
            </div>
            <div className="summary__stat">
              <span className="summary__stat-value">
                {mins > 0 ? `${mins}m ` : ""}
                {secs}s
              </span>
              <span className="summary__stat-label">tiempo</span>
            </div>
          </div>
          <div className="summary__actions">
            <button
              className="summary__btn summary__btn--primary"
              onClick={() => {
                setFinished(null);
                setSession({
                  exercises: generateSession(difficulty, Date.now() % 999983),
                  currentIndex: 0,
                  correctCount: 0,
                  startTime: Date.now(),
                  answerState: "idle",
                  digits: [],
                  activeDigit: 0,
                  chosen: null,
                  alreadyFailed: false,
                });
              }}
            >
              ↻ Repetir
            </button>
            <button className="summary__btn summary__btn--secondary" onClick={onExit}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null as unknown as JSX.Element;
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
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! 🎉</div>}

        <TensBlock number={current.number} />
        <div className="n4059__question">{current.question}</div>

        {!isMultiChoice && (
          <div className="ops__formula">
            {mode === "numpad" ? (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
              >
                {session.answerState === "correct"
                  ? current.answer
                  : session.digits.join("") || <span className="ops__cursor">_</span>}
              </div>
            ) : session.answerState === "idle" ? (
              <LazyDigitCell
                key={canvasKey}
                isActive={true}
                onActivate={() => {}}
                onConfirm={handleDigit}
                onClear={() =>
                  setSession((s) => {
                    const nd = [...s.digits];
                    nd[s.activeDigit] = "";
                    return { ...s, digits: nd };
                  })
                }
                state={session.answerState}
                value={session.digits.join("")}
              />
            ) : (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : "ops__answer-box--wrong"}`}
              >
                {session.answerState === "correct"
                  ? current.answer
                  : session.digits.join("") || "?"}
              </div>
            )}
          </div>
        )}

        <footer className="ops__footer">
          {isMultiChoice ? (
            <div className="n4059__options">
              {(current.options ?? []).map((opt, i) => {
                let cls = "n4059__option";
                if (session.answerState === "correct" && opt === current.answer)
                  cls += " n4059__option--correct";
                else if (session.answerState === "wrong" && opt === session.chosen)
                  cls += " n4059__option--wrong";
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => handleChoice(opt)}
                    disabled={session.answerState !== "idle"}
                  >
                    {opt}
                  </button>
                );
              })}
              {session.answerState === "wrong" && (
                <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
              )}
            </div>
          ) : (
            <>
              {mode === "numpad" && (
                <Numpad
                  onDigit={handleDigit}
                  onDelete={handleDelete}
                  onConfirm={confirm}
                  disabled={session.answerState !== "idle"}
                />
              )}
              {session.answerState === "wrong" && (
                <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
