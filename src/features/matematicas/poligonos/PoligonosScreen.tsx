import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/poligonos";
import type { PoligonoExercise, ShapeDef } from "../../../core/activities/poligonos";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../operations/OperationsScreen.css";
import "./PoligonosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: PoligonoExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Valor pulsado. En `expert_select` es el `id` de la tarjeta. */
  selectedAnswer: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/** Espera antes de pasar al siguiente ejercicio cuando el alumno acierta. */
const AUTOAVANCE_MS = 900;

/**
 * Dibuja una figura del catálogo.
 *
 * El `viewBox` es fijo en 200×200 y `size` solo cambia el tamaño en pantalla.
 * Eso permite reutilizar el mismo componente en el escenario grande y en las
 * tarjetas de `expert`.
 */
function ShapeVisual({
  shape,
  size,
  showVertices,
  label,
}: {
  shape: ShapeDef;
  size: number;
  showVertices: boolean;
  /** Texto alternativo. Se omite en las tarjetas de `expert`: nombrar la figura
   *  por su `aria-label` revelaría parte de lo que hay que deducir. */
  label?: string;
}): JSX.Element {
  const cuerpo = (() => {
    switch (shape.drawType) {
      case "circle":
        return (
          <circle cx="100" cy="100" r="70" fill={shape.color} stroke="#ffffff" strokeWidth="6" />
        );
      case "open_line":
        return (
          <path
            d={shape.path}
            fill="none"
            stroke={shape.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case "curved_side":
        return (
          <path
            d={shape.path}
            fill={shape.color}
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinejoin="round"
          />
        );
      case "path":
        return (
          <path
            d={shape.path}
            fill={shape.color}
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinejoin="round"
          />
        );
    }
  })();

  return (
    <svg
      className="pol__svg"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {cuerpo}
      {showVertices &&
        shape.vertexPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="7" className="pol__vertex" />
        ))}
    </svg>
  );
}

export function PoligonosScreen({
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
    answerState: "idle",
    selectedAnswer: null,
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
        selectedAnswer: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedAnswer: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current) return;
      const isCorrect = validateAnswer(current, value);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedAnswer: value,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedAnswer: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

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

  /** Estado visual de una respuesta: correcto, fallado o sin tocar. */
  const estado = (value: string): "idle" | "correct" | "wrong" => {
    if (session.answerState === "correct" && value === current.answer) return "correct";
    if (session.answerState === "wrong" && value === session.selectedAnswer) return "wrong";
    return "idle";
  };

  const esExpert = current.type === "expert_select";
  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  return (
    <div className={`ops pol ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ops__stage ${stageClass}`}>
        {esExpert ? (
          <>
            <p className="pol__question">{current.question}</p>
            <div className="pol__grid">
              {current.optionsList.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  id={`pol-card-${shape.id}`}
                  className={`pol__card pol__card--${estado(shape.id)}`}
                  onClick={() => handleAnswer(shape.id)}
                  disabled={session.answerState !== "idle"}
                >
                  <ShapeVisual shape={shape} size={150} showVertices={false} />
                </button>
              ))}
            </div>
            {session.answerState === "correct" && (
              <>
                {current.hint && <p className="pol__hint">{current.hint}</p>}
                <div className="ops__celebration activity-celebration--inline">¡Correcto! 📐⭐</div>
              </>
            )}
          </>
        ) : (
          <div className="pol__shape-box">
            <ShapeVisual
              shape={current.shape}
              size={240}
              showVertices={current.showVertices}
              label={current.shape.name}
            />
          </div>
        )}
      </div>

      <footer className="ops__footer">
        {!esExpert && (
          <>
            <p className="pol__question">{current.question}</p>

            {session.answerState === "correct" && current.hint && (
              <p className="pol__hint">{current.hint}</p>
            )}

            <div className="pol__options">
              {current.options.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`pol-option-${i}`}
                  data-value={opt.value}
                  className={`pol__option pol__option--${estado(opt.value)}`}
                  onClick={() => handleAnswer(opt.value)}
                  disabled={session.answerState !== "idle"}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {session.answerState === "correct" && (
              <div className="ops__celebration activity-celebration--inline">¡Correcto! 📐⭐</div>
            )}
          </>
        )}

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
