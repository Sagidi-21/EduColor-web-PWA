import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type Problemas2Exercise,
} from "../../../core/activities/problemas2pasos";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./Problemas2PasosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: Problemas2Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

const AUTOAVANCE_MS = 900;

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
  const [session, setSession] = useState(() => freshSession(seed, difficulty));
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
      const duration = Date.now() - session.startTime;
      setFinished({ correct: session.correctCount, total, duration });
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

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession(freshSession(Date.now() % 999983, difficulty));
  }, [difficulty]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, val);
      if (ok) playFeedback(true);
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
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? ""}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "p2p__stage--correct"
      : session.answerState === "wrong"
        ? "p2p__stage--wrong"
        : "";

  const revealed = session.answerState !== "idle";

  const step1Label =
    current.op1 === "+"
      ? `${current.a} + ${current.b} = ${revealed ? current.mid : "?"}`
      : `${current.a} − ${current.b} = ${revealed ? current.mid : "?"}`;
  const step2Label =
    current.op2 === "+"
      ? `${revealed ? current.mid : "?"} + ${current.c} = ${revealed ? current.result : "?"}`
      : `${revealed ? current.mid : "?"} − ${current.c} = ${revealed ? current.result : "?"}`;

  return (
    <div className={`p2p ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        className={className}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
        onExit={onExit}
      />

      <div className={`p2p__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="p2p__cheer">¡Correcto! ⭐</div>}

        {/* Problem story */}
        <div className="p2p__story-card">
          {current.story.map((line, i) => (
            <p key={i} className="p2p__story-line">
              {line}
            </p>
          ))}
        </div>

        {/* Step tracker — shows after answering */}
        <div className="p2p__steps">
          <div className="p2p__step">
            <span className="p2p__step-label">Paso 1</span>
            <span className="p2p__step-num">{step1Label}</span>
          </div>
          <span className="p2p__arrow">→</span>
          <div className="p2p__step">
            <span className="p2p__step-label">Paso 2</span>
            <span className="p2p__step-num">{step2Label}</span>
          </div>
        </div>

        <p className="p2p__question">{current.question}</p>

        <div className="p2p__options">
          {current.options.map((opt) => {
            let cls = "p2p__opt";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " p2p__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " p2p__opt--wrong";
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
          <div className="p2p__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
