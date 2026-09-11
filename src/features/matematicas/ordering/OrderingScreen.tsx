import { useEffect, useState } from "react";
import {
  createOrderingSession,
  isCorrectOrderingValue,
  type OrderingExercise,
} from "../../../core/activities/ordering";
import { playCorrect } from "../../../platform/audio";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import "./OrderingScreen.css";

export function OrderingScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  difficultyStars,
}: EngineScreenProps) {
  const [exercises] = useState(() => createOrderingSession(seed, difficulty));
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [placedNumbers, setPlacedNumbers] = useState<readonly number[]>([]);
  const [wrongNumber, setWrongNumber] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const exercise = exercises[exerciseIndex] as OrderingExercise;
  const isComplete = placedNumbers.length === exercise.sortedNumbers.length;
  const pool = exercise.numbers.filter(
    (number) => !placedNumbers.includes(number) && number !== wrongNumber,
  );

  useEffect(() => {
    if (wrongNumber === null) return;
    const timeout = window.setTimeout(() => setWrongNumber(null), 700);
    return () => window.clearTimeout(timeout);
  }, [wrongNumber]);

  useEffect(() => {
    if (!isComplete || finished) return;
    const timeout = window.setTimeout(() => {
      if (exerciseIndex + 1 === exercises.length) {
        setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
        setFinished(true);
        return;
      }
      setExerciseIndex((current) => current + 1);
      setPlacedNumbers([]);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [exerciseIndex, exercises.length, finished, isComplete, startedAt]);

  const selectNumber = (number: number) => {
    if (isComplete || wrongNumber !== null) return;
    const position = placedNumbers.length;
    if (!isCorrectOrderingValue(exercise, position, number)) {
      setWrongNumber(number);
      return;
    }
    setPlacedNumbers((current) => [...current, number]);
    playCorrect();
  };

  const restart = () => {
    setExerciseIndex(0);
    setPlacedNumbers([]);
    setWrongNumber(null);
    setStartedAt(Date.now());
    setDurationSeconds(null);
    setFinished(false);
  };

  if (finished) {
    const sessionResult: SessionResult = {
      correct: exercises.length,
      total: exercises.length,
      duration: durationSeconds ? durationSeconds * 1000 : 0,
    };
    return (
      <SummaryScreen
        result={sessionResult}
        gradeLabel={gradeTitle || "Matemáticas"}
        onRestart={restart}
        onExit={onExit}
      />
    );
  }

  const ascending = exercise.direction === "ascending";
  return (
    <div className="ord">
      <header className="ord__header">
        <button className="ord__exit" onClick={onExit}>
          ← Actividades
        </button>
        <div className="ord__header-info">
          <span className="ord__title">{activity.title}</span>
          <span className="ord__grade">
            {gradeTitle} {difficultyStars ? ` · ${difficultyStars}` : ""}
            {className ? ` — ${className}` : ""}
          </span>
        </div>
        <span className="ord__progress">
          {exerciseIndex + 1}/{exercises.length}
        </span>
      </header>
      <main className="ord__main">
        <p className="ord__instruction">
          Ordena de {ascending ? "menor a mayor" : "mayor a menor"} →
        </p>
        <div className="ord__pool" aria-label="Números disponibles">
          {pool.map((number) => (
            <button key={number} className="ord__card" onClick={() => selectNumber(number)}>
              {number}
            </button>
          ))}
          {pool.length === 0 && <div className="ord__pool-placeholder" />}
        </div>
        <div className="ord__slots" aria-label="Orden de respuesta">
          {exercise.sortedNumbers.map((_, position) => {
            const value = placedNumbers[position];
            const isWrong = wrongNumber !== null && position === placedNumbers.length;
            return (
              <div
                key={position}
                className={`ord__slot ${value !== undefined ? "ord__slot--correct" : ""} ${isWrong ? "ord__slot--wrong" : ""}`}
              >
                {value ?? (isWrong ? wrongNumber : "")}
              </div>
            );
          })}
        </div>
        <div className="ord__labels">
          <span className="ord__label-end">{ascending ? "mínimo" : "máximo"}</span>
          <span className="ord__label-end">{ascending ? "máximo" : "mínimo"}</span>
        </div>
        {isComplete && <div className="ord__celebrate">¡Muy bien! 🎉</div>}
      </main>
    </div>
  );
}
