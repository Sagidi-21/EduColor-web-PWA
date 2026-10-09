import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExerciseRenderer } from "./components/ExerciseRenderer";
import { FichaFooter } from "./components/Footer";
import type { SheetExercise, SheetConfig, FichaMeta } from "../types";
import "./print.css";

export interface FichaAlumnoProps {
  exercises: SheetExercise[];
  config: SheetConfig;
  meta: FichaMeta;
  logoUrl?: string;
}

/**
 * Renderiza una ficha de ALUMNO (sin respuestas).
 * Devuelve un contenedor listo para `window.print()`.
 */
export function FichaAlumno({
  exercises,
  config: _config,
  meta,
  logoUrl,
}: FichaAlumnoProps): JSX.Element {
  return (
    <div className="ficha-page">
      <FichaHeader meta={meta} logoUrl={logoUrl} />
      {meta.studentName && <StudentNameLine />}

      <div className="ficha-grid">
        {exercises.map((ex, i) => (
          <ExerciseCard key={i} number={i + 1}>
            <ExerciseRenderer ex={ex} showAnswer={false} />
          </ExerciseCard>
        ))}
      </div>

      <FichaFooter logoUrl={logoUrl} />
    </div>
  );
}
