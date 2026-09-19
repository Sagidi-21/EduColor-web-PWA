import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/numeracion999";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import "./Numeracion999Renderer.css";
import { ActivityHeader } from "../components/ActivityHeader";
import { WrongFeedback } from "../components/WrongFeedback";
import { SummaryScreen } from "../components/SummaryScreen";

type AnswerState = "idle" | "correct" | "wrong";

export default function Numeracion999Renderer({
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
    selected: null as string | null,
  }));
  const [finished, setFinished] = useState<{ total: number; correct: number } | null>(null);

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
      setFinished({ total, correct: session.correctCount });
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
      }));
    },
    [session.answerState, current],
  );

  if (finished) {
    const duration = Date.now() - session.startTime;
    return (
      <SummaryScreen
        result={{ correct: finished.correct, total: finished.total, duration }}
        gradeLabel={gradeTitle}
        onRestart={() => {
          setFinished(null);
          setSession({
            exercises: generateSession(difficulty, Date.now() % 999983),
            currentIndex: 0,
            correctCount: 0,
            startTime: Date.now(),
            answerState: "idle",
            selected: null,
          });
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
        title={activity.title}
        gradeLabel={gradeTitle}
        current={session.currentIndex + 1}
        total={total}
        onExit={onExit}
      ></ActivityHeader>

      <div className={`n999__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="n999__cheer">¡Correcto! ⭐</div>}

        <p className="n999__question">{current.question}</p>

        {/* Show the number when asking for CDU decomposition or valor posicional */}
        {(isCifraToC ||
          current.type === "valor-posicional" ||
          current.type === "anterior-posterior") && (
          <div className="n999__number-display">{current.number}</div>
        )}

        {/* Show CDU card when asking for the number */}
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
          <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}
