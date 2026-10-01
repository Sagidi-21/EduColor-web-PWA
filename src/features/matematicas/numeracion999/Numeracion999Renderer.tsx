import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/numeracion999";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import "./Numeracion999Renderer.css";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateSession>;
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: null | string;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  };
}

export function Numeracion999Screen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selected: null,
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
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        selected: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1100);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, val);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: val,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !ok ? true : s.alreadyFailed,
      }));
    },
    [session.answerState, current],
  );

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? activity.title}
        onRestart={() => {
          setFinished(null);
          setSession(freshSession(sessionSeed, difficulty));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "n999__stage--correct"
      : session.answerState === "wrong"
        ? "n999__stage--wrong"
        : "";

  const isCifraToC = current.type === "cifra-to-cdu";
  const isCduToC = current.type === "cdu-to-cifra";

  return (
    <div className="n999">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      ></ActivityHeader>

      <div className={`n999__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="n999__cheer">¡Correcto! ⭐</div>}

        <p className="n999__question">{current.question}</p>

        {(isCifraToC ||
          current.type === "valor-posicional" ||
          current.type === "anterior-posterior") && (
          <div className="n999__number-display">{current.number}</div>
        )}

        {isCduToC && (
          <div className="n999__cdu-card">
            <div className="n999__cdu-col">
              <span className="n999__cdu-val">{current.centenas}</span>
              <span className="n999__cdu-label">Centenas</span>
            </div>
            <span className="n999__cdu-sep">·</span>
            <div className="n999__cdu-col">
              <span className="n999__cdu-val">{current.decenas}</span>
              <span className="n999__cdu-label">Decenas</span>
            </div>
            <span className="n999__cdu-sep">·</span>
            <div className="n999__cdu-col">
              <span className="n999__cdu-val">{current.unidades}</span>
              <span className="n999__cdu-label">Unidades</span>
            </div>
          </div>
        )}

        <div className="n999__options">
          {current.options.map((opt) => {
            let cls = "n999__opt";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " n999__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " n999__opt--wrong";
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={session.answerState !== "idle"}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
