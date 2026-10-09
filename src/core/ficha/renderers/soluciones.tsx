import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExerciseRenderer } from "./components/ExerciseRenderer";
import { FichaFooter } from "./components/Footer";
import type { SheetExercise, SheetConfig, FichaMeta } from "../types";
import "./print.css";

export interface FichaSolucionesProps {
  exercises: SheetExercise[];
  config: SheetConfig;
  meta: FichaMeta;
  logoUrl?: string;
}

/**
 * Renderiza una ficha de SOLUCIONES (con respuestas visibles).
 */
export function FichaSoluciones({
  exercises,
  config: _config,
  meta,
  logoUrl,
}: FichaSolucionesProps): JSX.Element {
  return (
    <div className="ficha-page">
      <FichaHeader meta={meta} logoUrl={logoUrl} />
      {meta.studentName && <StudentNameLine />}

      <div className="ficha-grid">
        {exercises.map((ex, i) => (
          <ExerciseCard key={i} number={i + 1}>
            <ExerciseRenderer ex={ex} showAnswer={true} />
          </ExerciseCard>
        ))}
      </div>

      <FichaFooter />
    </div>
  );
}
