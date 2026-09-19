import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/numeracion6099";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { ActivityHeader } from "../components/ActivityHeader";
import { WrongFeedback } from "../components/WrongFeedback";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";

type AnswerState = "idle" | "correct" | "wrong";

function TensBlock({ number }: { number: number }) {
  const decenas = Math.floor(number / 10);
  const units = number % 10;
  return (
    <div className="n6099__blocks">
      <div className="n6099__tens-row">
        {Array.from({ length: decenas }, (_, i) => (
          <div key={i} className="n6099__decena">
            10
          </div>
        ))}
      </div>
      {units > 0 && (
        <div className="n6099__units-row">
          {Array.from({ length: units }, (_, i) => (
            <div key={i} className="n6099__unit-dot" />
          ))}
        </div>
      )}
    </div>
  );
}

function Numpad({
  onDigit,
  onDelete,
  onConfirm,
  disabled,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <div className="ops__numpad">
      {NUMPAD.map((row, r) => (
        <div key={r} className="ops__numpad-row">
          {row.map((k) => (
            <button
              key={k}
              className={`ops__key ${k === "✓" ? "ops__key--confirm" : ""} ${k === "←" ? "ops__key--del" : ""}`}
              onClick={() => (k === "←" ? onDelete() : k === "✓" ? onConfirm() : onDigit(k))}
              disabled={disabled}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

const NUMPAD = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["←", "0", "✓"],
];

export default function Numeracion6099Renderer({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const [session, setSession] = useState(() => ({
    exercises: generateSession(difficulty, Date.now() % 999983),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle" as AnswerState,
    input: "",
    chosen: null as null | string,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const isMultiChoice = current?.type === "identify" || current?.type === "word";

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      chosen: null,
      alreadyFailed: true,
    }));
  }, []);

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
        input: "",
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
    if (session.input.length < 2) return;
    confirm();
  }, [session.input.length, mode, session.answerState, current?.answer, confirm]);

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, opt);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session, current],
  );

  const confirm = useCallback(() => {
    if (session.answerState !== "idle" || session.input === "") return;
    const ok = validateAnswer(current, session.input);
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
    }));
  }, [session, current]);

  if (finished) {
    const pct = Math.round((finished.correct / finished.total) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    const mins = Math.floor(finished.duration / 60000);
    const secs = Math.floor((finished.duration % 60000) / 1000);
    return (
      <div className="ops ops--summary">
        <div className="summary">
          <div className="summary__stars">{"⭐".repeat(stars)}</div>
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
                  input: "",
                  chosen: null,
                });
              }}
            >
              🔄 Repetir
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
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        {current.type === "identify" && <TensBlock number={current.number} />}

        <div className="n6099__question">{current.question}</div>

        {!isMultiChoice && (
          <div className="ops__formula">
            {mode === "numpad" ? (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""}`}
              >
                {session.answerState === "correct"
                  ? current.answer
                  : session.input || <span className="ops__cursor">_</span>}
              </div>
            ) : session.answerState === "idle" ? (
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
            ) : (
              <div
                className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : "ops__answer-box--wrong"}`}
              >
                {session.answerState === "correct" ? current.answer : session.input || "?"}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="ops__footer">
        {isMultiChoice ? (
          <div className="n6099__options">
            <div className="n6099__options-grid">
              {(current.options ?? []).map((opt, i) => {
                let cls = "n6099__option";
                if (session.answerState === "correct" && opt === current.answer)
                  cls += " n6099__option--correct";
                else if (session.answerState === "wrong" && opt === session.chosen)
                  cls += " n6099__option--wrong";
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
            </div>
            {session.answerState === "wrong" && (
              <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
            )}
          </div>
        ) : (
          <>
            {mode === "numpad" && (
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
            )}
            {session.answerState === "wrong" && (
              <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
            )}
          </>
        )}
      </footer>
    </div>
  );
}
