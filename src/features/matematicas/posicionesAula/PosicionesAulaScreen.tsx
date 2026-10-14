import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type PosExercise,
  type Position,
  type Container,
  type PosObject,
} from "../../../core/activities/posicionesAula";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./PosicionesAulaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: PosExercise[];
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

// ─── SVG Helpers ────────────────────────────────────────────────────────────────

function ContainerSVG({ type }: { type: Container }) {
  if (type === "caja" || type === "mochila") {
    return (
      <g>
        <rect
          x={90}
          y={110}
          width={160}
          height={120}
          rx={8}
          fill="rgba(180,130,80,.25)"
          stroke="#b47c3c"
          strokeWidth={3}
        />
        <rect x={85} y={103} width={170} height={14} rx={4} fill="#b47c3c" opacity={0.6} />
        {type === "mochila" && (
          <>
            <rect x={120} y={103} width={14} height={30} rx={4} fill="#8b5e2e" opacity={0.5} />
            <rect x={206} y={103} width={14} height={30} rx={4} fill="#8b5e2e" opacity={0.5} />
          </>
        )}
      </g>
    );
  }
  if (type === "mesa") {
    return (
      <g>
        <rect
          x={60}
          y={150}
          width={220}
          height={16}
          rx={4}
          fill="rgba(180,130,80,.4)"
          stroke="#b47c3c"
          strokeWidth={2.5}
        />
        <rect x={80} y={166} width={14} height={80} rx={3} fill="#b47c3c" opacity={0.5} />
        <rect x={246} y={166} width={14} height={80} rx={3} fill="#b47c3c" opacity={0.5} />
      </g>
    );
  }
  return (
    <g>
      <rect
        x={80}
        y={168}
        width={180}
        height={16}
        rx={4}
        fill="rgba(180,130,80,.4)"
        stroke="#b47c3c"
        strokeWidth={2.5}
      />
      <rect
        x={80}
        y={108}
        width={12}
        height={65}
        rx={3}
        fill="rgba(180,130,80,.4)"
        stroke="#b47c3c"
        strokeWidth={2}
      />
      <rect
        x={248}
        y={108}
        width={12}
        height={65}
        rx={3}
        fill="rgba(180,130,80,.4)"
        stroke="#b47c3c"
        strokeWidth={2}
      />
      <rect
        x={80}
        y={108}
        width={180}
        height={14}
        rx={4}
        fill="rgba(180,130,80,.35)"
        stroke="#b47c3c"
        strokeWidth={2}
      />
      <rect x={88} y={184} width={12} height={60} rx={3} fill="#b47c3c" opacity={0.5} />
      <rect x={240} y={184} width={12} height={60} rx={3} fill="#b47c3c" opacity={0.5} />
    </g>
  );
}

const CONTAINER_ANCHORS = {
  caja: { cx: 170, cy: 170, top: 110, bottom: 230, left: 90, right: 250 },
  mochila: { cx: 170, cy: 170, top: 110, bottom: 230, left: 90, right: 250 },
  mesa: { cx: 170, cy: 158, top: 150, bottom: 246, left: 60, right: 280 },
  silla: { cx: 170, cy: 176, top: 108, bottom: 244, left: 80, right: 260 },
} as const;

function getObjectPos(
  container: Container,
  position: Position,
  objR: number,
): { cx: number; cy: number } {
  const anchor = CONTAINER_ANCHORS[container];
  switch (position) {
    case "dentro":
      return { cx: anchor.cx, cy: anchor.cy };
    case "encima":
      return { cx: anchor.cx, cy: anchor.top - objR - 8 };
    case "debajo":
      return { cx: anchor.cx, cy: anchor.bottom + objR + 8 };
    case "fuera":
      return { cx: anchor.right + 50, cy: anchor.cy };
    case "al lado":
      return { cx: anchor.right + objR + 10, cy: anchor.cy };
    default:
      return { cx: anchor.cx, cy: anchor.cy };
  }
}

const OBJ_R: Record<PosObject, number> = { pelota: 22, lápiz: 20, libro: 18, goma: 12 };

function ObjectSVG({ type, cx, cy }: { type: PosObject; cx: number; cy: number }) {
  if (type === "pelota") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={22} fill="#f97316" />
        <path
          d={`M ${cx - 12} ${cy - 18} Q ${cx} ${cy + 5} ${cx + 12} ${cy - 18}`}
          fill="none"
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  }
  if (type === "lápiz") {
    return (
      <g transform={`translate(${cx},${cy}) rotate(-30)`}>
        <rect x={-6} y={-24} width={12} height={44} rx={2} fill="#fbbf24" />
        <polygon points="-6,20 6,20 0,32" fill="#f59e0b" />
        <rect x={-6} y={-24} width={12} height={8} rx={1} fill="#f87171" />
        <rect x={-6} y={-16} width={12} height={2} fill="#d97706" />
      </g>
    );
  }
  if (type === "libro") {
    return (
      <g>
        <rect
          x={cx - 20}
          y={cy - 16}
          width={40}
          height={32}
          rx={2}
          fill="#818cf8"
          stroke="#6366f1"
          strokeWidth={1.5}
        />
        <line x1={cx} y1={cy - 16} x2={cx} y2={cy + 16} stroke="#6366f1" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy - 6} x2={cx - 4} y2={cy - 6} stroke="white" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy + 1} x2={cx - 4} y2={cy + 1} stroke="white" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy + 8} x2={cx - 4} y2={cy + 8} stroke="white" strokeWidth={1.5} />
      </g>
    );
  }
  return (
    <rect
      x={cx - 18}
      y={cy - 10}
      width={36}
      height={20}
      rx={3}
      fill="#f9a8d4"
      stroke="#ec4899"
      strokeWidth={1.5}
    />
  );
}

// ─── Renderer ──────────────────────────────────────────────────────────────────

export default function PosicionesAulaScreen({
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
      ? "pos__stage--correct"
      : session.answerState === "wrong"
        ? "pos__stage--wrong"
        : "";

  const objR = OBJ_R[current.object];
  const oPos = getObjectPos(current.container, current.position, objR);

  return (
    <div className="pos">
      <ActivityHeader
        title={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`pos__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="pos__cheer">¡Correcto! ⭐</div>}

        <div className="pos__card">
          <div className="pos__scene-area">
            <svg
              viewBox="0 0 340 300"
              className="pos__svg"
              data-testid="posiciones-aula-svg"
              aria-hidden="true"
            >
              <ContainerSVG type={current.container} />
              <ObjectSVG type={current.object} cx={oPos.cx} cy={oPos.cy} />
            </svg>
          </div>

          <div className="pos__qa">
            <p className="pos__question">{current.question}</p>

            <div className="pos__opts">
              {current.options.map((opt) => {
                let cls = "pos__opt";
                if (
                  session.answerState !== "idle" &&
                  opt.toLowerCase() === current.correctAnswer.toLowerCase()
                )
                  cls += " pos__opt--correct";
                else if (session.answerState === "wrong" && opt === session.selected)
                  cls += " pos__opt--wrong";
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
          </div>
        </div>

        {session.answerState === "wrong" && (
          <div className="pos__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
