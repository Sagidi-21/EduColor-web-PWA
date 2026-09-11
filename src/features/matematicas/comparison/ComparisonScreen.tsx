import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createComparisonExercise,
  isCorrectComparison,
  type ComparisonChoice,
} from "../../../core/activities/comparison";
import { playCorrect } from "../../../platform/audio";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import "./ComparisonScreen.css";

const TOTAL_EXERCISES = 10;
// Timing idéntico al original Electron: 900 ms tras el acierto
const AUTO_ADVANCE_MS = 900;

const objectImages = import.meta.glob<string>("../../../assets/objects/*/*.png", {
  eager: true,
  import: "default",
});

function objectSrc(objectSet: string, objectIndex: number): string {
  const matches = Object.entries(objectImages)
    .filter(([path]) => path.includes(`/objects/${objectSet}/`))
    .sort(([left], [right]) => left.localeCompare(right));
  return matches[objectIndex % Math.max(1, matches.length)]?.[1] ?? "";
}

export function ComparisonScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [exerciseNumber, setExerciseNumber] = useState(1);
  const [exerciseSeed, setExerciseSeed] = useState(seed);
  const [choice, setChoice] = useState<ComparisonChoice | null>(null);
  
  // Tracking para el resumen
  const [startTime, setStartTime] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [summary, setSummary] = useState<SessionResult | null>(null);

  const exercise = useMemo(
    () => createComparisonExercise(exerciseSeed, difficulty),
    [difficulty, exerciseSeed],
  );
  const imageSrc = objectSrc(exercise.objectSet, exercise.objectIndex);

  const evaluated = choice !== null;
  const correct = choice !== null && isCorrectComparison(exercise, choice);

  const prompt =
    exercise.answer === "equal"
      ? "¿Tienen los mismos objetos?"
      : `¿Qué grupo tiene ${exercise.question === "more" ? "MÁS" : "MENOS"} objetos?`;

  const handleNext = useCallback(() => {
    if (exerciseNumber >= TOTAL_EXERCISES) {
      setSummary({
        correct: correctCount + (correct && isFirstAttempt ? 1 : 0),
        total: TOTAL_EXERCISES,
        duration: Date.now() - startTime,
      });
      return;
    }
    
    if (correct && isFirstAttempt) {
      setCorrectCount((c) => c + 1);
    }
    
    setChoice(null);
    setIsFirstAttempt(true);
    setExerciseSeed((s) => s + 1);
    setExerciseNumber((n) => n + 1);
  }, [exerciseNumber, correct, isFirstAttempt, correctCount, startTime]);

  const handleRetry = () => {
    setChoice(null);
    setIsFirstAttempt(false);
  };

  const pick = (next: ComparisonChoice) => {
    if (evaluated) return;
    setChoice(next);
  };

  // Avance automático 900 ms tras el acierto (igual que Electron)
  useEffect(() => {
    if (!correct) return;
    playCorrect();
    const t = setTimeout(handleNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [correct, handleNext]);

  if (summary) {
    return (
      <SummaryScreen
        result={summary}
        gradeLabel={gradeTitle || "Matemáticas"}
        onExit={onExit}
        onRestart={() => {
          setSummary(null);
          setExerciseNumber(1);
          setExerciseSeed(Date.now());
          setStartTime(Date.now());
          setCorrectCount(0);
          setIsFirstAttempt(true);
          setChoice(null);
        }}
      />
    );
  }

  return (
    <div className="cmp">
      {/* Header */}
      <header className="cmp__header">
        <button className="cmp__back" onClick={onExit} aria-label="Salir de la actividad">
          ← Salir
        </button>
        <div className="cmp__header-info">
          {(gradeTitle || difficultyStars || className) && (
            <span className="cmp__header-meta">
              {gradeTitle}
              {difficultyStars && ` · ${difficultyStars}`}
              {className && ` — ${className}`}
            </span>
          )}
          <span className="cmp__title">{activity.title}</span>
        </div>
        <div className="cmp__header-right">
          <span className="cmp__counter" aria-label={`Ejercicio ${exerciseNumber} de ${TOTAL_EXERCISES}`}>
            {exerciseNumber} / {TOTAL_EXERCISES}
          </span>
          {mascotUrl && <img src={mascotUrl} alt="" className="cmp__mascot" />}
        </div>
      </header>

      {/* Área principal: dos cajas visuales centradas + balanza entre ellas */}
      <div className="cmp__arena">
        {/* Caja izquierda */}
        <div
          className={[
            "cmp__box",
            !evaluated && choice === "left" ? "cmp__box--picked" : "",
            evaluated && correct && exercise.answer === "left" ? "cmp__box--correct" : "",
            evaluated && !correct && choice === "left" ? "cmp__box--wrong" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={`Grupo de la izquierda, ${exercise.leftCount} objetos`}
        >
          <div className="cmp__objects">
            {Array.from({ length: exercise.leftCount }, (_, i) => (
              <img key={i} src={imageSrc} alt="" />
            ))}
          </div>
        </div>

        {/* Balanza entre las cajas */}
        <div className="cmp__scale" aria-hidden="true">⚖️</div>

        {/* Caja derecha */}
        <div
          className={[
            "cmp__box",
            !evaluated && choice === "right" ? "cmp__box--picked" : "",
            evaluated && correct && exercise.answer === "right" ? "cmp__box--correct" : "",
            evaluated && !correct && choice === "right" ? "cmp__box--wrong" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={`Grupo de la derecha, ${exercise.rightCount} objetos`}
        >
          <div className="cmp__objects">
            {Array.from({ length: exercise.rightCount }, (_, i) => (
              <img key={i} src={imageSrc} alt="" />
            ))}
          </div>
        </div>
      </div>

      {/* Pregunta */}
      <p className="cmp__prompt">{prompt}</p>

      {/* Botones de respuesta (siempre visibles, se deshabilitan al evaluar) */}
      <div className="cmp__answer-row">
        <button
          className="cmp__answer-btn"
          onClick={() => pick("left")}
          disabled={evaluated}
          aria-pressed={choice === "left"}
        >
          ← Izquierda
        </button>

        {exercise.allowEqual && (
          <button
            className="cmp__answer-btn cmp__answer-btn--equal"
            onClick={() => pick("equal")}
            disabled={evaluated}
            aria-pressed={choice === "equal"}
          >
            Iguales
          </button>
        )}

        <button
          className="cmp__answer-btn"
          onClick={() => pick("right")}
          disabled={evaluated}
          aria-pressed={choice === "right"}
        >
          Derecha →
        </button>
      </div>

      {/* Botones del profesor — solo aparecen en fallo */}
      {evaluated && !correct && (
        <div className="cmp__teacher-row" role="status">
          <button className="cmp__teacher-btn cmp__teacher-btn--retry" onClick={handleRetry}>
            🔄 Reintentar
          </button>
          <button className="cmp__teacher-btn cmp__teacher-btn--next" onClick={handleNext}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
