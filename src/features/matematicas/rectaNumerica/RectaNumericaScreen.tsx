import { useState, useRef, useCallback } from "react";
import { generateSession } from "../../../core/activities/rectaNumerica";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import "./RectaNumericaScreen.css";

type Feedback = "none" | "ok" | "try";

const X0 = 60,
  X1 = 940,
  W = X1 - X0,
  /** Recta más arriba que el layout original, con margen inferior para los botones. */
  LINE_Y = 175,
  SVG_H = 270;
/** Recuadro claramente por encima de la recta (mismo offset relativo que acordamos). */
const HOME_X = 500,
  HOME_Y = LINE_Y - 104;
const CARD_PLACED_Y = LINE_Y - 104;

function toSvg(clientX: number, clientY: number, svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * 1000,
    y: ((clientY - r.top) / r.height) * SVG_H,
  };
}

export function RectaNumericaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState(() => ({
    exercises: generateSession(difficulty, seed),
    /** Semilla de la tanda en curso: "Repetir" la reutiliza para dar el mismo ejercicio. */
    seed,
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    alreadyFailed: false,
  }));
  const [card, setCard] = useState({ x: HOME_X, y: HOME_Y, placed: false });
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const max = current ? current.max : 10;

  const xOf = useCallback((v: number) => X0 + (v / max) * W, [max]);
  const valueAt = useCallback(
    (x: number) => Math.max(0, Math.min(max, Math.round(((x - X0) / W) * max))),
    [max],
  );

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({ ...s, currentIndex: next, alreadyFailed: false }));
      setCard({ x: HOME_X, y: HOME_Y, placed: false });
      setFeedback("none");
      setIsDragging(false);
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setCard({ x: HOME_X, y: HOME_Y, placed: false });
    setFeedback("none");
    setIsDragging(false);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    if (feedback === "ok" || feedback === "try") return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const p = toSvg(e.clientX, e.clientY, svgRef.current);
    setCard({
      x: Math.max(X0, Math.min(X1, p.x)),
      y: Math.max(HOME_Y - 20, Math.min(CARD_PLACED_Y, p.y)),
      placed: false,
    });
  };
  const onUp = () => {
    if (!isDragging || !current) return;
    setIsDragging(false);
    const v = valueAt(card.x);
    setCard({ x: xOf(v), y: CARD_PLACED_Y, placed: true });
    if (v === current.target) {
      playFeedback(true);
      setFeedback("ok");
      setSession((s) => ({
        ...s,
        correctCount: s.alreadyFailed ? s.correctCount : s.correctCount + 1,
      }));
      setTimeout(handleNext, 1300);
    } else {
      playFeedback(false);
      setFeedback("try");
      setSession((s) => ({ ...s, alreadyFailed: true }));
    }
  };

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, session.seed),
      seed: session.seed,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      alreadyFailed: false,
    });
    setCard({ x: HOME_X, y: HOME_Y, placed: false });
    setFeedback("none");
    setIsDragging(false);
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

  const pointed = valueAt(card.x);
  const markerX = card.placed ? xOf(pointed) : card.x;

  const ticks: JSX.Element[] = [];
  for (let v = 0; v <= max; v++) {
    const x = xOf(v);
    const major = v % current.labelEvery === 0 || v === max;
    ticks.push(
      <line
        key={`t${v}`}
        x1={x}
        y1={LINE_Y}
        x2={x}
        y2={LINE_Y + (major ? 18 : 9)}
        stroke={major ? "#475569" : "#94a3b8"}
        strokeWidth={major ? 3 : 1.5}
      />,
    );
    if (major)
      ticks.push(
        <text
          key={`l${v}`}
          x={x}
          y={LINE_Y + 42}
          fontSize={20}
          fontWeight="bold"
          fill="#334155"
          textAnchor="middle"
        >
          {v}
        </text>,
      );
  }

  return (
    <div className="rct">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`rct__stage ${feedback === "ok" ? "rct__stage--correct" : ""}`}>
        {feedback === "ok" && <div className="rct__celebration">¡En su sitio! 🎯⭐</div>}

        <p className="rct__instruction">
          Arrastra el <strong className="rct__target">{current.target}</strong> a su lugar en la
          recta
        </p>

        <svg
          ref={svgRef}
          className="rct__svg"
          viewBox={`0 0 1000 ${SVG_H}`}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ touchAction: "none" }}
        >
          <line
            x1={X0}
            y1={LINE_Y}
            x2={X1}
            y2={LINE_Y}
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {ticks}

          {(isDragging || card.placed) && (
            <g pointerEvents="none">
              <line
                x1={markerX}
                y1={LINE_Y - 6}
                x2={markerX}
                y2={LINE_Y + 6}
                stroke={feedback === "try" ? "#dc2626" : "var(--color-primary, #2563eb)"}
                strokeWidth="4"
              />
              <circle
                cx={markerX}
                cy={LINE_Y}
                r={8}
                fill={feedback === "try" ? "#dc2626" : "var(--color-primary, #2563eb)"}
              />
            </g>
          )}

          <g onPointerDown={onDown} style={{ cursor: feedback === "ok" ? "default" : "grab" }}>
            <line
              x1={card.x}
              y1={card.y + 30}
              x2={markerX}
              y2={LINE_Y}
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="5 4"
              pointerEvents="none"
            />
            <rect
              x={card.x - 44}
              y={card.y - 34}
              width="88"
              height="68"
              rx="14"
              fill={isDragging ? "var(--color-primary, #2563eb)" : "#fff"}
              stroke="var(--color-primary, #2563eb)"
              strokeWidth="3"
            />
            <text
              x={card.x}
              y={card.y + 12}
              fontSize={42}
              fontWeight="900"
              fill={isDragging ? "#fff" : "var(--color-primary, #2563eb)"}
              textAnchor="middle"
            >
              {current.target}
            </text>
          </g>
        </svg>

        {feedback === "try" && <ActionButtons onRetry={handleRetry} onNext={handleNext} />}
      </div>
    </div>
  );
}
