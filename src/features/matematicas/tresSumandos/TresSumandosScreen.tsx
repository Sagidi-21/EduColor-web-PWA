import { useState, useEffect, useCallback } from "react";
import {
  generateSession,
  validateAnswer,
  showImageSupport,
} from "../../../core/activities/tresSumandos";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { LazyDigitCell } from "../../shared/DigitCell";
import { ActionButtons } from "../components/ActivityActionButtons";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "../operations/OperationsScreen.css";
import "./TresSumandosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

function answerLen(n: number): number {
  return String(n).length;
}

export function TresSumandosScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState(() => {
    const exercises = generateSession(difficulty, seed);
    const firstLen = answerLen(exercises[0].answer);
    return {
      exercises,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle" as AnswerState,
      digits: Array(firstLen).fill("") as string[],
      activeDigit: firstLen - 1,
      alreadyFailed: false,
    };
  });
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const showImg = showImageSupport(difficulty);
  const aLen = current ? answerLen(current.answer) : 1;

  const submitDigits = useCallback(
    (digits: string[]) => {
      if (digits.some((d) => d === "")) return;
      const ok = validateAnswer(current, digits.join(""));
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [current],
  );

  const handleCanvasConfirm = useCallback(
    (i: number, d: string) => {
      const nd = [...session.digits];
      nd[i] = d;
      if (i > 0) setSession((s) => ({ ...s, digits: nd, activeDigit: i - 1 }));
      else submitDigits(nd);
      setCanvasKey((k) => k + 1);
    },
    [session.digits, submitDigits],
  );

  const handleNumpadDigit = (d: string) => {
    if (session.answerState !== "idle") return;
    const { digits, activeDigit } = session;
    if (activeDigit < 0) return;
    const nd = [...digits];
    nd[activeDigit] = d;
    if (activeDigit > 0) setSession((s) => ({ ...s, digits: nd, activeDigit: activeDigit - 1 }));
    else {
      setSession((s) => ({ ...s, digits: nd }));
      submitDigits(nd);
    }
  };

  const handleDelete = () => {
    if (session.answerState !== "idle") return;
    const { digits, activeDigit } = session;
    const nd = [...digits];
    if (nd[activeDigit]) {
      nd[activeDigit] = "";
      setSession((s) => ({ ...s, digits: nd }));
    } else if (activeDigit < nd.length - 1) {
      nd[activeDigit + 1] = "";
      setSession((s) => ({ ...s, digits: nd, activeDigit: activeDigit + 1 }));
    }
  };

  const handleConfirm = () => {
    if (session.answerState !== "idle") return;
    submitDigits(session.digits);
  };

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      alreadyFailed: true,
    }));
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

  const handleRestart = () => {
    setFinished(null);
    const exercises = generateSession(difficulty, Date.now() % 999983);
    const firstLen = answerLen(exercises[0].answer);
    setSession({
      exercises,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: firstLen - 1,
      alreadyFailed: false,
    });
  };

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || "Matemáticas"}
        onExit={onExit}
        onRestart={handleRestart}
      />
    );
  }

  if (!current) return null;
  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";
  const correctStr = String(current.answer);

  return (
    <div className="ops">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <div className="ops__exercise">
          {showImg && current.imageUrl && (
            <div className="ops__emoji-support tres__triple-imgs">
              {[current.a, current.b, current.c].map((n, gi) => (
                <div key={gi} className="ops__emoji-row">
                  {Array.from({ length: n }, (_, i) => (
                    <img key={i} src={current.imageUrl} className="ops__emoji-img" alt="" />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="ops__formula tres__formula">
            <span className="ops__num">{current.a}</span>
            <span className="ops__op">+</span>
            <span className="ops__num">{current.b}</span>
            <span className="ops__op">+</span>
            <span className="ops__num">{current.c}</span>
            <span className="ops__eq">=</span>

            <div className="tres__answer-boxes">
              {Array.from({ length: aLen }, (_, i) => {
                const isActiveBox = session.answerState === "idle" && session.activeDigit === i;
                if (mode === "canvas" && isActiveBox) {
                  return (
                    <LazyDigitCell
                      key={`dab-${session.activeDigit}-${canvasKey}`}
                      isActive={true}
                      onActivate={() => {}}
                      onConfirm={(d) => handleCanvasConfirm(i, d)}
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
                    className={`ops__answer-box ${session.answerState === "correct" ? "ops__answer-box--correct" : session.answerState === "wrong" ? "ops__answer-box--wrong" : ""} ${isActiveBox ? "ops__answer-box--active" : ""}`}
                    onClick={() => {
                      if (session.answerState !== "idle") return;
                      const nd = [...session.digits];
                      nd[i] = "";
                      setSession((s) => ({ ...s, activeDigit: i, digits: nd }));
                    }}
                  >
                    {session.answerState === "correct"
                      ? correctStr[i]
                      : session.digits[i] ||
                        (isActiveBox ? <span className="ops__cursor">_</span> : "")}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="ops__footer">
        {mode === "numpad" && (
          <Numpad
            onDigit={handleNumpadDigit}
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
