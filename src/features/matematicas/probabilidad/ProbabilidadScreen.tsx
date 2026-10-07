import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type ProbExercise,
} from "../../../core/activities/probabilidad";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./ProbabilidadScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ProbExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

/** Tiempo en ms que se muestra el feedback de acierto antes de autoavanzar. */
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

const BALL_COLORS: Record<string, string> = {
  roja: "#ef4444",
  azul: "var(--color-primary)",
  verde: "#22c55e",
  amarilla: "#eab308",
  blanca: "#e2e8f0",
  negra: "#1e293b",
};

const CATEGORY_META: Record<string, { icon: string; label: string; cls: string }> = {
  Seguro: { icon: "✅", label: "Seguro", cls: "prb__opt--seguro" },
  Posible: { icon: "🤔", label: "Posible", cls: "prb__opt--posible" },
  Imposible: { icon: "❌", label: "Imposible", cls: "prb__opt--imposible" },
};

function parseBag(context: string): { color: string; count: number }[] {
  const match = context.match(/Bolsa: (.+)\.$/);
  if (!match) return [];
  return match[1].split(", ").map((part) => {
    const m = part.match(/(\d+) pelotas? (\w+)/);
    return m ? { count: Number(m[1]), color: m[2] } : { count: 0, color: "blanca" };
  });
}

export default function ProbabilidadScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
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
      ? "prb__stage--correct"
      : session.answerState === "wrong"
        ? "prb__stage--wrong"
        : "";

  const isBag = current.type === "bag";
  const balls = isBag ? parseBag(current.context) : [];

  return (
    <div className="prb">
      <ActivityHeader
        title={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`prb__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="prb__cheer">¡Correcto! ⭐</div>}

        <div className="prb__event-card">
          <p className="prb__context">{current.context}</p>
          <p className="prb__question">{current.question}</p>
        </div>

        {isBag && balls.length > 0 && (
          <div className="prb__bag">
            {balls.flatMap(({ color, count }) =>
              Array.from({ length: count }).map((_, i) => (
                <div
                  key={`${color}-${i}`}
                  className="prb__ball"
                  style={{ background: BALL_COLORS[color] ?? "#94a3b8" }}
                />
              )),
            )}
          </div>
        )}

        <div className="prb__options">
          {current.options.map((opt) => {
            const meta = CATEGORY_META[opt];
            let cls = `prb__opt ${meta?.cls ?? ""}`;
            if (session.answerState === "correct" && opt.toLowerCase() === current.correctAnswer)
              cls += " prb__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " prb__opt--wrong";
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleAnswer(opt)}
                disabled={session.answerState !== "idle"}
              >
                <span className="prb__opt-icon">{meta?.icon}</span>
                {meta?.label ?? opt}
              </button>
            );
          })}
        </div>

        {session.answerState === "wrong" && (
          <div className="prb__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
