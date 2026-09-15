import { useEffect, useCallback, useState } from "react";
import { generateSession } from "../../../core/activities/problemas";
import type { ProblemaExercise, SessionResult, Theme } from "../../../core/activities/problemas";
import type { EngineScreenProps } from "../engine-screens";
import { playCorrect } from "../../../platform/audio";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import { DigitCell } from "../../shared/DigitCell/DigitCell";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./ProblemaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ProblemaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
  theme: Theme | null;
  alreadyFailed: boolean;
}

const THEMES: { id: Theme; label: string; emoji: string }[] = [
  { id: "deportes", label: "Deportes", emoji: "⚽" },
  { id: "animales", label: "Animales", emoji: "🐾" },
  { id: "clase", label: "Clase", emoji: "✏️" },
  { id: "naturaleza", label: "Naturaleza", emoji: "🌿" },
];

export function ProblemaScreen({
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

  const [session, setSession] = useState<SessionState>(() => {
    const exs = generateSession(difficulty, seed, "deportes");
    const firstLen = exs.length > 0 ? String(exs[0].answer).length : 1;
    return {
      exercises: exs,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: Math.max(firstLen - 1, 0),
      theme: null,
      alreadyFailed: false,
    };
  });
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const submitDigits = useCallback(
    (newDigits: string[]) => {
      const answer = parseInt(newDigits.join(""), 10);
      const isCorrect = !isNaN(answer) && answer === current.answer;
      if (isCorrect) playCorrect();
      setSession((s) => ({
        ...s,
        digits: newDigits,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect ? true : s.alreadyFailed,
      }));
    },
    [current]
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
      setCanvasKey((k) => k + 1);
    },
    [session.digits, submitDigits]
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
    [session, submitDigits]
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
    const curLen = String(session.exercises[session.currentIndex].answer).length;
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
      const nextLen = String(session.exercises[next].answer).length;
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
    const t = setTimeout(handleNext, 1500);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    const exs = generateSession(difficulty, Date.now() % 999983, session.theme ?? "deportes");
    const firstLen = exs.length > 0 ? String(exs[0].answer).length : 1;
    setSession({
      exercises: exs,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: Math.max(firstLen - 1, 0),
      theme: session.theme,
      alreadyFailed: false,
    });
  }, [difficulty, session.theme]);

  const startSession = useCallback((t: Theme) => {
    const exs = generateSession(difficulty, seed, t);
    const firstLen = exs.length > 0 ? String(exs[0].answer).length : 1;
    setSession({
      exercises: exs,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: Math.max(firstLen - 1, 0),
      theme: t,
      alreadyFailed: false,
    });
  }, [difficulty, seed]);

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

  if (!session.theme || session.exercises.length === 0) {
    return (
      <div className="prob">
        <ActivityHeader
          onExit={onExit}
          gradeTitle={gradeTitle}
          className={className}
          unitTitle={activity.title}
          mascotUrl={mascotUrl}
          difficultyStars={difficultyStars}
        >
          <InputModeToggle mode={mode} onToggle={toggle} />
        </ActivityHeader>
        <div className="prob__theme-screen">
          <p className="prob__theme-title">¿De qué trata el problema?</p>
          <div className="prob__theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="prob__theme-card"
                onClick={() => startSession(t.id)}
              >
                <span className="prob__theme-emoji">{t.emoji}</span>
                <span className="prob__theme-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const aLen = String(current.a).length;
  const bLen = String(current.b).length;
  const answerLen = String(current.answer).length;
  const numCols = Math.max(aLen, bLen, answerLen);
  const opSym = current.op === "suma" ? "+" : "−";
  const stageOk = session.answerState === "correct";
  const stageBad = session.answerState === "wrong";
  const solutionText = stageOk
    ? current.solutionTemplate.replace("___", String(current.answer))
    : current.solutionTemplate;

  const aDigits = [...Array(numCols - aLen).fill(null), ...String(current.a).split("")];
  const bDigits = [...Array(numCols - bLen).fill(null), ...String(current.b).split("")];
  const answerDigits = [...Array(numCols - answerLen).fill(null), ...String(current.answer).split("")];

  return (
    <div className="prob">
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

      <div
        className={`prob__stage ${stageOk ? "prob__stage--correct" : stageBad ? "prob__stage--wrong" : ""}`}
      >
        {stageOk && <div className="prob__celebration">¡Muy bien! ⭐</div>}

        <div className="prob__card">
          <span className="prob__emoji">{current.emoji}</span>
          <div className="prob__card-texts">
            <p className="prob__story">{current.story}</p>
            <p className="prob__question">{current.question}</p>
          </div>
        </div>

        <div className="prob__section-block">
          <span className="prob__section-label">OPERACIÓN</span>
          <div className="prob__vertical" style={{ "--ncols": numCols } as React.CSSProperties}>
            <span className="prob__vcell prob__vcell--sym" />
            {aDigits.map((d, i) => (
              <span key={`a${i}`} className="prob__vcell">
                {d ?? ""}
              </span>
            ))}

            <span className="prob__vcell prob__vcell--sym">{opSym}</span>
            {bDigits.map((d, i) => (
              <span key={`b${i}`} className="prob__vcell">
                {d ?? ""}
              </span>
            ))}

            <div className="prob__vdivider" />

            <span className="prob__vcell prob__vcell--sym" />
            {answerDigits.map((d, i) => {
              const isActiveBox = session.answerState === "idle" && session.activeDigit === i;
              if (mode === "canvas" && isActiveBox) {
                return (
                  <DigitCell
                    key={`dab-${i}-${canvasKey}`}
                    isActive={true}
                    onActivate={() => {}}
                    onConfirm={(dig) => handleCanvasConfirm(i, dig)}
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
                    "prob__vbox",
                    isActiveBox ? "prob__vbox--active" : "",
                    session.answerState === "correct" ? "prob__vbox--correct" : "",
                    session.answerState === "wrong" ? "prob__vbox--wrong" : "",
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
                  {session.digits[i] || (isActiveBox ? <span className="prob__cursor">_</span> : "")}
                </div>
              );
            })}
          </div>
        </div>

        <div className="prob__section-block">
          <span className="prob__section-label">SOLUCIÓN</span>
          <p className={`prob__solution-text ${stageOk ? "prob__solution-text--filled" : ""}`}>
            {solutionText}
          </p>
        </div>

        {stageBad && <ActionButtons onRetry={handleRetry} onNext={handleNext} />}
      </div>

      <footer className="prob__footer">
        {mode === "numpad" && (
          <Numpad
            onDigit={handleDigit}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
            disabled={session.answerState !== "idle"}
          />
        )}
      </footer>
    </div>
  );
}