import { useCallback, useEffect, useRef, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/balanzaEquilibra";
import type { BalanzaEqExercise } from "../../../core/activities/balanzaEquilibra";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../balanza/BalanzaScreen.css";
import "./BalanzaEquilibraScreen.css";

type AnswerState = "idle" | "correct";

interface SessionState {
  exercises: BalanzaEqExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
}

/** Espera antes de pasar al siguiente ejercicio cuando se equilibran las pesas. */
const AUTOAVANCE_MS = 1400;

// ── Geometría de la balanza ─────────────────────────────────────────────────
// Misma geometría que el renderer original de Electron: el dibujo debe ser
// idéntico en ambas plataformas para que el alumno reconozca la actividad.

const FULCRUM_X = 300;
const FULCRUM_Y = 120;
const ARM = 190;
const DROP = 120;
const VIEW_W = 600;
const VIEW_H = 460;

interface Punto {
  x: number;
  y: number;
}

interface DragState {
  kg: number;
  x: number;
  y: number;
}

function toSvg(clientX: number, clientY: number, svg: SVGSVGElement): Punto {
  const r = svg.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * VIEW_W,
    y: ((clientY - r.top) / r.height) * VIEW_H,
  };
}

function BalanzaEquilibraScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));
  const [weights, setWeights] = useState<number[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const rightTotal = weights.reduce((a, b) => a + b, 0);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({ ...s, currentIndex: next }));
      setWeights([]);
      setAnswerState("idle");
    }
  }, [session, total]);

  /** Comprueba equilibrio tras cada cambio de pesas. */
  const settle = useCallback(
    (list: number[]) => {
      if (!current) return;
      if (validateAnswer(list, current)) {
        playFeedback(true);
        setAnswerState("correct");
        setSession((s) => ({ ...s, correctCount: s.correctCount + 1 }));
      }
    },
    [current],
  );

  useEffect(() => {
    if (answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
    });
    setWeights([]);
    setAnswerState("idle");
  }, [difficulty, sessionSeed]);

  // ── Arrastre ─────────────────────────────────────────────────────────────

  const startDrag = (kg: number, fromIndex: number | null) => (e: React.PointerEvent) => {
    if (answerState === "correct") return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (fromIndex !== null) setWeights((w) => w.filter((_, i) => i !== fromIndex));
    if (svgRef.current) {
      const p = toSvg(e.clientX, e.clientY, svgRef.current);
      setDrag({ kg, x: p.x, y: p.y });
    } else {
      setDrag({ kg, x: FULCRUM_X, y: FULCRUM_Y + ARM + DROP });
    }
  };

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag || !svgRef.current) return;
      const p = toSvg(e.clientX, e.clientY, svgRef.current);
      setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : null));
    },
    [drag],
  );

  const onUp = useCallback(() => {
    if (!drag || !current) {
      setDrag(null);
      return;
    }
    // Posición del platillo derecho recalculada en tiempo real.
    const diff = current.target - rightTotal;
    const angle = Math.max(-14, Math.min(14, diff * 4));
    const rad = (angle * Math.PI) / 180;
    const pRx = FULCRUM_X + ARM * Math.cos(rad);
    const pRy = FULCRUM_Y - ARM * Math.sin(rad) + DROP;
    if (Math.hypot(drag.x - pRx, drag.y - pRy) < 130) {
      const next = [...weights, drag.kg];
      setWeights(next);
      settle(next);
    }
    setDrag(null);
  }, [drag, current, rightTotal, weights, settle]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        onRestart={handleRestart}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  // Geometría de la balanza en tiempo real.
  const diff = current.target - rightTotal;
  const angle = Math.max(-14, Math.min(14, diff * 4));
  const rad = (angle * Math.PI) / 180;
  const xL = FULCRUM_X - ARM * Math.cos(rad);
  const yL = FULCRUM_Y + ARM * Math.sin(rad);
  const xR = FULCRUM_X + ARM * Math.cos(rad);
  const yR = FULCRUM_Y - ARM * Math.sin(rad);
  const panLeftX = xL;
  const panLeftY = yL + DROP;
  const panRightX = xR;
  const panRightY = yR + DROP;

  const stageClass = answerState === "correct" ? "blz__stage--correct" : "";

  /** Dibuja una pila de bloques de pesa (1 kg cada uno, con "2" en los de 2 kg). */
  const blockGrid = (
    cx: number,
    cy: number,
    items: { kg: number }[],
    onDown?: (i: number) => (e: React.PointerEvent) => void,
  ) =>
    items.map((it, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const bx = cx - 45 + col * 30;
      const by = cy - 16 - row * 26;
      return (
        <g
          key={i}
          onPointerDown={onDown ? onDown(i) : undefined}
          style={{ cursor: onDown ? "grab" : "default" }}
        >
          <text x={bx} y={by} fontSize={24} textAnchor="middle" className="blz__objeto">
            🧱
          </text>
          {it.kg === 2 && (
            <text
              x={bx}
              y={by - 16}
              fontSize={11}
              fontWeight="bold"
              fill="#fde68a"
              textAnchor="middle"
            >
              2
            </text>
          )}
        </g>
      );
    });

  return (
    <div className={`blz be ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`blz__stage ${stageClass}`}>
        {answerState === "correct" && <div className="blz__celebration">¡Equilibrada! ⚖️⭐</div>}

        <p className="be__instruction">
          Arrastra pesas al platillo derecho hasta <strong>equilibrar</strong> la balanza
        </p>

        <svg
          ref={svgRef}
          className="blz__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ touchAction: "none" }}
          role="img"
          aria-label={`Balanza. Objeto de la izquierda: ${current.leftLabel}. Objetivo: equilibrar ${current.target} kg.`}
        >
          {/* Soporte */}
          <path
            d={`M ${VIEW_W / 2 - 16} 330 L ${VIEW_W / 2} ${FULCRUM_Y} L ${VIEW_W / 2 + 16} 330 Z`}
            className="blz__soporte"
          />
          <rect x={VIEW_W / 2 - 55} y={330} width={110} height={22} rx={8} className="blz__base" />

          {/* Brazo y fulcro */}
          <line x1={xL} y1={yL} x2={xR} y2={yR} className="blz__brazo" />
          <circle cx={FULCRUM_X} cy={FULCRUM_Y} r={10} className="blz__fulcro" />

          {/* Cuerdas + platillos */}
          {[
            [xL, yL, panLeftX, panLeftY],
            [xR, yR, panRightX, panRightY],
          ].map(([bx, by, px, py], k) => (
            <g key={k}>
              <line x1={bx} y1={by} x2={px - 60} y2={py} className="blz__colgador" />
              <line x1={bx} y1={by} x2={px + 60} y2={py} className="blz__colgador" />
              <line
                x1={px - 60}
                y1={py}
                x2={px + 60}
                y2={py}
                className="blz__bandeja"
                strokeWidth={6}
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Contenido platillo IZQUIERDO (carga fija) */}
          {current.leftKind === "object" ? (
            <text
              x={panLeftX}
              y={panLeftY - 14}
              fontSize={54}
              textAnchor="middle"
              className="blz__objeto"
            >
              {current.leftEmoji}
            </text>
          ) : (
            blockGrid(
              panLeftX,
              panLeftY,
              Array.from({ length: current.target }, () => ({ kg: 1 })),
            )
          )}
          <text
            x={panLeftX}
            y={panLeftY + 34}
            fontSize={22}
            fontWeight="bold"
            fill="#fbbf24"
            textAnchor="middle"
          >
            {current.target} kg
          </text>

          {/* Contenido platillo DERECHO (pesas del niño, arrastrables para quitar) */}
          {blockGrid(
            panRightX,
            panRightY,
            weights.map((kg) => ({ kg })),
            (i) => startDrag(weights[i], i),
          )}
          <text
            x={panRightX}
            y={panRightY + 34}
            className={`be__right-label ${rightTotal === current.target ? "be__right-label--balanced" : "be__right-label--unbalanced"}`}
          >
            {rightTotal} kg
          </text>

          {/* Pesa fantasma que sigue al puntero */}
          {drag && (
            <g pointerEvents="none">
              <text x={drag.x} y={drag.y} fontSize={30} textAnchor="middle" className="blz__objeto">
                🧱
              </text>
              {drag.kg === 2 && (
                <text
                  x={drag.x}
                  y={drag.y - 20}
                  fontSize={13}
                  fontWeight="bold"
                  fill="#fde68a"
                  textAnchor="middle"
                >
                  2
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Bandeja de pesas arrastrables */}
      <div className="be__tray">
        <span className="be__tray-label">Pesas:</span>
        {current.allowed.map((kg) => (
          <svg
            key={kg}
            className="be__token"
            viewBox="0 0 70 70"
            onPointerDown={(e) => startDrag(kg, null)(e)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            style={{ touchAction: "none" }}
          >
            <text x={35} y={40} fontSize={34} textAnchor="middle" className="blz__objeto">
              🧱
            </text>
            <text x={35} y={64} fontSize={13} fontWeight="bold" fill="#475569" textAnchor="middle">
              {kg} kg
            </text>
          </svg>
        ))}
        <span className="be__hint">
          Arrastra una pesa al platillo. Para quitarla, sácala del platillo.
        </span>
      </div>
    </div>
  );
}

export { BalanzaEquilibraScreen };
