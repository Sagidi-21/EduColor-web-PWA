import { useState, useCallback, useEffect } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/igualdad";
import type { IgualdadExercise } from "../../../core/activities/igualdad";
import type { EngineScreenProps } from "../engine-screens";
import { playCorrect } from "../../../platform/audio";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import "../components/SummaryScreen.css";
import "./IgualdadScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

function formula(ex: IgualdadExercise, answerState: AnswerState) {
  const blank = <span className="igl__blank">___</span>;
  const eq = <span className="igl__eq">=</span>;
  const num = (n: number) => <span className="igl__num">{n}</span>;
  const op = <span className="igl__op">+</span>;
  const revealed = answerState === "correct";

  if (ex.type === "resultado") {
    return (
      <>
        {num(ex.a)}
        {op}
        {num(ex.b)}
        {eq}
        {revealed ? num(ex.c) : blank}
      </>
    );
  }
  if (ex.type === "sumando") {
    return (
      <>
        {revealed ? num(ex.a) : blank}
        {op}
        {num(ex.b)}
        {eq}
        {num(ex.c)}
      </>
    );
  }
  // decompose: c = ___ + ___
  const [p, q] = revealed ? [ex.a, ex.b] : [null, null];
  return (
    <>
      {num(ex.c)}
      {eq}
      {p !== null ? num(p) : blank}
      {op}
      {q !== null ? num(q) : blank}
    </>
  );
}

type SessionState = {
  exercises: IgualdadExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  chosen: string | number | null;
  alreadyFailed: boolean;
};

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    chosen: null,
    alreadyFailed: false,
  };
}

export function IgualdadScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState(() => freshSession(seed, difficulty));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleChoice = useCallback(
    (opt: number | string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, opt);
      if (ok) playCorrect();
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session, current],
  );

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
        chosen: null,
        alreadyFailed: false,
      }));
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
          setSession({
            exercises: generateSession(difficulty, Date.now() % 999983),
            currentIndex: 0,
            correctCount: 0,
            startTime: Date.now(),
            answerState: "idle",
            chosen: null,
            alreadyFailed: false,
          });
        }}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  if (!current) return null;
  const stageClass =
    session.answerState === "correct"
      ? "igl__stage--correct"
      : session.answerState === "wrong"
        ? "igl__stage--wrong"
        : "";

  return (
    <div className="igl">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`igl__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="igl__celebration">¡Muy bien! 🎉</div>}
        {current.type === "resultado" && current.imageUrl && (
          <div className="igl__img-row">
            {Array.from({ length: current.a }, (_, i) => (
              <img key={`a${i}`} src={current.imageUrl} className="igl__img" alt="" />
            ))}
            <span className="igl__img-sep">+</span>
            {Array.from({ length: current.b }, (_, i) => (
              <img key={`b${i}`} src={current.imageUrl} className="igl__img" alt="" />
            ))}
          </div>
        )}
        <div className="igl__formula">{formula(current, session.answerState)}</div>
        <div className="igl__hint">
          {current.type === "resultado" && "Elige el resultado"}
          {current.type === "sumando" && "Elige el número que falta"}
          {current.type === "descomposicion" && "Elige la descomposición correcta"}
        </div>
      </div>

      <footer className="igl__footer">
        <div className={`igl__options igl__options--${current.options.length}`}>
          {current.options.map((opt, i) => {
            let cls = "igl__option";
            if (session.answerState === "correct" && String(opt) === String(current.answer))
              cls += " igl__option--correct";
            else if (session.answerState === "wrong" && String(opt) === String(session.chosen))
              cls += " igl__option--wrong";
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleChoice(opt)}
                disabled={session.answerState !== "idle"}
              >
                {current.type === "descomposicion" ? String(opt).replace("+", " + ") : opt}
              </button>
            );
          })}
        </div>
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
