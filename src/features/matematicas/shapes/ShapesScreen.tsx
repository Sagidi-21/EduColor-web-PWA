import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/shapes";
import type { ShapeDef, ShapesExercise } from "../../../core/activities/shapes";
import { SHAPES_REAL_IMAGES } from "./shapesRealImages";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { WrongFeedback } from "../components/WrongFeedback";
import "./ShapesScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ShapesExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selectedId: string | null;
  alreadyFailed: boolean;
}

// ── Cara animada ────────────────────────────────────────────────
function FaceSVG({
  type,
  scale,
  answerState,
}: {
  type: ShapeDef["type"];
  scale: number;
  answerState: AnswerState;
}): JSX.Element {
  const cx = 100,
    cy = 100;

  // Centro de la cara: en el triángulo sube un poco para estar dentro de la figura
  const faceCy = type === "triangle" ? cy + 14 * scale : cy;

  // El rombo es más estrecho horizontalmente; el óvalo igual que el círculo
  const xFactor = type === "rhombus" ? 0.68 : 1;

  const eyeR = 7.5 * scale;
  const pupR = 4 * scale;
  const eyeDX = 18 * scale * xFactor;
  const eyeY = faceCy - 14 * scale;
  const mouthY = faceCy + 14 * scale;
  const mouthDX = 16 * scale * xFactor;
  const mouthSag = 11 * scale;

  const happy = answerState === "correct";
  const white = "rgba(255,255,255,0.94)";
  const dark = "rgba(0,0,0,0.80)";

  const eye = (ex: number, key: string) => (
    <g key={key}>
      <circle cx={ex} cy={eyeY} r={eyeR} fill={white} />
      {happy ? (
        <path
          d={`M${ex - eyeR * 0.85},${eyeY} Q${ex},${eyeY - eyeR} ${ex + eyeR * 0.85},${eyeY}`}
          stroke={dark}
          strokeWidth={2.4 * scale}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <circle cx={ex + pupR * 0.28} cy={eyeY + pupR * 0.28} r={pupR} fill={dark} />
      )}
    </g>
  );

  return (
    <g>
      {eye(cx - eyeDX, "l")}
      {eye(cx + eyeDX, "r")}
      {/* Nariz */}
      <circle cx={cx} cy={faceCy} r={2.8 * scale} fill={white} opacity={0.7} />
      {/* Boca */}
      <path
        d={`M${cx - mouthDX},${mouthY} Q${cx},${mouthY + mouthSag} ${cx + mouthDX},${mouthY}`}
        stroke={white}
        strokeWidth={3.6 * scale}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

// ── SVG de cada figura ──────────────────────────────────────────
function ShapeSVG({
  shape,
  color,
  rotation,
  scale,
  answerState,
}: {
  shape: ShapeDef;
  color: string;
  rotation: number;
  scale: number;
  answerState: AnswerState;
}): JSX.Element {
  const cx = 100,
    cy = 100;

  const shapeEl = (() => {
    switch (shape.type) {
      case "circle":
        return <circle cx={cx} cy={cy} r={72 * scale} fill={color} />;
      case "square": {
        const s = 130 * scale;
        return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={color} rx={6} />;
      }
      case "triangle": {
        const r = 82 * scale;
        const pts = [
          `${cx},${cy - r}`,
          `${cx - r * 0.866},${cy + r * 0.5}`,
          `${cx + r * 0.866},${cy + r * 0.5}`,
        ].join(" ");
        return <polygon points={pts} fill={color} />;
      }
      case "rectangle": {
        const w = 148 * scale,
          h = 88 * scale;
        return <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={color} rx={6} />;
      }
      case "rhombus": {
        const r = 80 * scale;
        const pts = `${cx},${cy - r} ${cx + r * 0.65},${cy} ${cx},${cy + r} ${cx - r * 0.65},${cy}`;
        return <polygon points={pts} fill={color} />;
      }
      case "oval": {
        return <ellipse cx={cx} cy={cy} rx={88 * scale} ry={55 * scale} fill={color} />;
      }
    }
  })();

  return (
    <svg
      viewBox="0 0 200 200"
      className="shp__svg"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      {shapeEl}
      <FaceSVG type={shape.type} scale={scale} answerState={answerState} />
    </svg>
  );
}

// ── Componente principal ────────────────────────────────────────
export function ShapesScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, seed, SHAPES_REAL_IMAGES),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedId: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

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
        selectedId: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedId: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleAnswer = useCallback(
    (id: string) => {
      if (session.answerState !== "idle" || !current) return;
      const isCorrect = validateAnswer(current, id);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedId: id,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, Date.now() % 999983, SHAPES_REAL_IMAGES),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedId: null,
      alreadyFailed: false,
    });
  };

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

  if (!current) return null;

  const btnState = (id: string) => {
    if (session.answerState === "correct" && id === current.correctAnswer) return "correct";
    if (session.answerState === "wrong" && id === session.selectedId) return "wrong";
    return "idle";
  };

  return (
    <div className={`shp ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div
        className={`shp__stage ${session.answerState === "correct" ? "shp__stage--correct" : ""}`}
      >
        {session.answerState === "correct" && <div className="shp__celebration">¡Muy bien! ⭐</div>}
        <div className="shp__shape-wrap">
          {current.imageUrl ? (
            <img
              src={current.imageUrl}
              className="shp__real-img"
              alt={current.shape.label}
              draggable={false}
            />
          ) : (
            <ShapeSVG
              shape={current.shape}
              color={current.color}
              rotation={current.rotation}
              scale={current.scale}
              answerState={session.answerState}
            />
          )}
        </div>
      </div>

      <footer className="shp__footer">
        <p className="shp__question">
          {current.imageUrl ? "¿Qué forma tiene este objeto?" : "¿Cómo se llama esta figura?"}
        </p>
        <div className={`shp__options shp__options--${current.options.length}`}>
          {current.options.map((opt) => (
            <button
              key={opt.id}
              id={`shp-option-${opt.id}`}
              className={`shp__option shp__option--${btnState(opt.id)}`}
              onClick={() => handleAnswer(opt.id)}
              disabled={session.answerState !== "idle"}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {session.answerState === "wrong" && (
          <WrongFeedback onNext={handleNext} onRetry={handleRetry} />
        )}
      </footer>
    </div>
  );
}
