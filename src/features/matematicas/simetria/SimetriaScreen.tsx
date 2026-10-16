import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type SimExercise,
  type SimShape,
} from "../../../core/activities/simetria";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./SimetriaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: SimExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: string | null;
  alreadyFailed: boolean;
}

const FILL = "rgba(37, 99, 235, 0.2)";
const STROKE = "#2563eb";

function pts(arr: [number, number][]): string {
  return arr.map(([x, y]) => `${x},${y}`).join(" ");
}

function polygon(
  n: number,
  cx: number,
  cy: number,
  r: number,
  offset = -Math.PI / 2,
): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = offset + (2 * Math.PI * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

function starPts(n: number, cx: number, cy: number, r1: number, r2: number): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n;
    const r = i % 2 === 0 ? r1 : r2;
    result.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return result;
}

function ShapeSVG({ shape, showAxis = false }: { shape: SimShape; showAxis?: boolean }) {
  const W = 160,
    H = 160,
    CX = 80,
    CY = 80;
  const axisLine = showAxis ? (
    <line
      x1={CX}
      y1={10}
      x2={CX}
      y2={H - 10}
      stroke="#fbbf24"
      strokeWidth="2"
      strokeDasharray="6,4"
      opacity=".9"
    />
  ) : null;

  switch (shape) {
    case "circulo":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <circle cx={CX} cy={CY} r={65} fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          {axisLine}
        </svg>
      );
    case "cuadrado":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <rect
            x={15}
            y={15}
            width={130}
            height={130}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "rectangulo":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <rect
            x={10}
            y={35}
            width={140}
            height={90}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "triangulo-eq":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts(polygon(3, CX, CY + 5, 68))}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "triangulo-iso":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts([
              [80, 12],
              [20, 148],
              [140, 148],
            ])}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "triangulo-esc":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts([
              [35, 148],
              [145, 148],
              [100, 20],
            ])}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "rombo":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts([
              [80, 10],
              [150, 80],
              [80, 150],
              [10, 80],
            ])}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "pentagono":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts(polygon(5, CX, CY + 5, 68))}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "hexagono":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts(polygon(6, CX, CY, 68))}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
    case "estrella":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon
            points={pts(starPts(5, CX, CY, 68, 28))}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          {axisLine}
        </svg>
      );
  }
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

export default function SimetriaScreen({
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
      ? "sim__stage--correct"
      : session.answerState === "wrong"
        ? "sim__stage--wrong"
        : "";

  const showShape = current.type !== "which-shape";
  const isYesNo = current.type === "is-symmetric";
  const showAxis = showShape && current.axes > 0 && session.answerState !== "idle";

  return (
    <div className="sim">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`sim__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="sim__cheer">¡Correcto! ⭐</div>}

        {showShape && (
          <div className="sim__shape-wrap">
            <ShapeSVG shape={current.shape} showAxis={showAxis} />
          </div>
        )}

        <p className="sim__question">{current.question}</p>

        <div className="sim__options">
          {current.options.map((opt) => {
            let cls = "sim__opt";
            if (isYesNo) cls += " sim__opt--yesno";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " sim__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " sim__opt--wrong";
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
          <div className="sim__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
