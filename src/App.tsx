import { useMemo, useState } from "react";
import { createCountingExercise, isCorrectAnswer } from "./core/activities/counting";
import { getActivityManifest } from "./manifests/content-registry";

export default function App() {
  const [seed, setSeed] = useState(1);
  const [answer, setAnswer] = useState<number | null>(null);
  const exercise = useMemo(() => createCountingExercise(seed), [seed]);
  const manifest = getActivityManifest("counting");
  const checked = answer === null ? null : isCorrectAnswer(exercise, answer);
  const next = () => {
    setSeed((current) => current + 1);
    setAnswer(null);
  };
  return (
    <main>
      <header>
        <p className="eyebrow">Vertical slice · PWA</p>
        <h1>EduColor</h1>
        <p>Matemáticas para Primaria, lista para crecer desde un núcleo reutilizable.</p>
      </header>
      <section className="exercise" aria-labelledby="exercise-title">
        <p className="tag">Actividad reutilizada · {manifest?.title ?? "Conteo"}</p>
        <h2 id="exercise-title">¿Cuántas estrellas hay?</h2>
        <div className="objects" aria-label={`${exercise.objects} estrellas`}>
          {Array.from({ length: exercise.objects }, (_, index) => (
            <span key={index}>⭐</span>
          ))}
        </div>
        <div className="answers" aria-label="Respuestas posibles">
          {exercise.choices.map((choice) => (
            <button
              key={choice}
              className={answer === choice ? "selected" : ""}
              onClick={() => setAnswer(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
        {checked !== null && (
          <p className={checked ? "feedback success" : "feedback error"}>
            {checked ? "¡Muy bien!" : "Prueba otra vez"}
          </p>
        )}
        <button className="next" onClick={next}>
          Siguiente ejercicio
        </button>
      </section>
    </main>
  );
}
