import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer, type Cuerpo } from "../../../core/activities/cuerpos3d";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./Cuerpos3DScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ReturnType<typeof generateSession>;
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

function ShapeSVG({ shape, size = 180 }: { shape: Cuerpo; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;

  const W = 180,
    H = 160;

  const FILL = "rgba(16,185,129,.15)";
  const STROKE = "#10b981";
  const FILL2 = "rgba(16,185,129,.08)";

  const svgStyle = {
    width: size,
    height: (H / W) * size,
    viewBox: `0 0 ${W} ${H}`,
    className: "c3d__svg",
    role: "img",
    ariaLabel: shape,
  };

  const renderShape = () => {
    switch (shape) {
      case "cubo":
        return (
          <>
            <polygon
              points="40,100 100,100 100,40 40,40"
              fill={FILL}
              stroke={STROKE}
              strokeWidth="2.5"
            />
            <polygon
              points="40,40 80,10 140,10 100,40"
              fill={FILL2}
              stroke={STROKE}
              strokeWidth="2.5"
            />
            <polygon
              points="100,40 140,10 140,70 100,100"
              fill={FILL}
              stroke={STROKE}
              strokeWidth="2"
              opacity="0.8"
            />
            <line
              x1="40"
              y1="100"
              x2="80"
              y2="70"
              stroke={STROKE}
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line
              x1="80"
              y1="70"
              x2="140"
              y2="70"
              stroke={STROKE}
              strokeWidth="1.5"
              opacity="0.4"
            />
            <line x1="80" y1="70" x2="80" y2="10" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
          </>
        );
      case "esfera":
        return (
          <>
            <circle cx="90" cy="80" r="64" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
            <ellipse
              cx="90"
              cy="80"
              rx="64"
              ry="18"
              fill="none"
              stroke={STROKE}
              strokeWidth="1.8"
              opacity="0.5"
            />
            <ellipse
              cx="90"
              cy="80"
              rx="18"
              ry="64"
              fill="none"
              stroke={STROKE}
              strokeWidth="1.8"
              opacity="0.35"
            />
          </>
        );
      case "cilindro":
        return (
          <>
            <rect x="30" y="38" width="120" height="90" fill={FILL} stroke="none" />
            <ellipse
              cx="90"
              cy="128"
              rx="60"
              ry="18"
              fill={FILL}
              stroke={STROKE}
              strokeWidth="2.5"
            />
            <ellipse
              cx="90"
              cy="38"
              rx="60"
              ry="18"
              fill={FILL2}
              stroke={STROKE}
              strokeWidth="2.5"
            />
            <line x1="30" y1="38" x2="30" y2="128" stroke={STROKE} strokeWidth="2.5" />
            <line x1="150" y1="38" x2="150" y2="128" stroke={STROKE} strokeWidth="2.5" />
          </>
        );
      case "cono":
        return (
          <>
            <polygon points="90,15 30,140 150,140" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
            <ellipse
              cx="90"
              cy="140"
              rx="60"
              ry="14"
              fill={FILL2}
              stroke={STROKE}
              strokeWidth="2"
            />
          </>
        );
      case "prisma":
        return (
          <>
            {/* Front triangle */}
            <polygon points="50,130 90,50 130,130" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
            {/* Back triangle offset */}
            <polygon
              points="80,110 110,40 150,110"
              fill={FILL2}
              stroke={STROKE}
              strokeWidth="1.5"
              opacity="0.6"
            />
            {/* Connecting edges */}
            <line x1="50" y1="130" x2="80" y2="110" stroke={STROKE} strokeWidth="2" />
            <line x1="90" y1="50" x2="110" y2="40" stroke={STROKE} strokeWidth="2" />
            <line x1="130" y1="130" x2="150" y2="110" stroke={STROKE} strokeWidth="2" />
          </>
        );
      case "piramide":
        return (
          <>
            {/* Base square (slightly isometric) */}
            <polygon
              points="40,130 140,130 160,100 60,100"
              fill={FILL2}
              stroke={STROKE}
              strokeWidth="2"
            />
            {/* Front triangular face */}
            <polygon points="40,130 90,30 140,130" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
            {/* Right triangular face */}
            <polygon
              points="140,130 90,30 160,100"
              fill={FILL}
              stroke={STROKE}
              strokeWidth="2"
              opacity="0.7"
            />
            <line
              x1="60"
              y1="100"
              x2="90"
              y2="30"
              stroke={STROKE}
              strokeWidth="1.5"
              opacity="0.4"
            />
          </>
        );
      default:
        return <circle cx={cx} cy={cy} r={size * 0.3} fill={FILL} stroke={STROKE} />;
    }
  };

  return (
    <svg {...svgStyle} data-testid="cuerpos3d-svg">
      {renderShape()}
    </svg>
  );
}

export default function Cuerpos3DScreen({
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
      ? "c3d__stage--correct"
      : session.answerState === "wrong"
        ? "c3d__stage--wrong"
        : "";

  return (
    <div className="c3d">
      <ActivityHeader
        title={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`c3d__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="c3d__cheer">¡Correcto! ⭐</div>}

        <div className="c3d__shape-wrap">
          <ShapeSVG shape={current.shape} />
        </div>

        <p className="c3d__question">{current.question}</p>

        <div className="c3d__options">
          {current.options.map((opt) => {
            let cls = "c3d__opt";
            if (session.answerState === "correct" && opt === current.correctAnswer)
              cls += " c3d__opt--correct";
            else if (session.answerState === "wrong" && opt === session.selected)
              cls += " c3d__opt--wrong";
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
          <div className="c3d__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
