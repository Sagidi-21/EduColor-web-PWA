import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExerciseRenderer } from "./components/ExerciseRenderer";
import { FichaFooter } from "./components/Footer";
import { chunkByPageSize, isFullWidthExercise, pageSizeForExercises } from "./pageLayout";
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
  const pageSize = pageSizeForExercises(exercises);
  const pages = chunkByPageSize(exercises, pageSize);

  return (
    <>
      {pages.map((pageExercises, pageIdx) => (
        <div
          key={pageIdx}
          className={pageIdx > 0 ? "ficha-page ficha-page--continued" : "ficha-page"}
        >
          {pageIdx === 0 ? (
            <>
              <FichaHeader meta={meta} logoUrl={logoUrl} />
              {meta.studentName && <StudentNameLine />}
            </>
          ) : (
            <p className="ficha-page__continued">{meta.title} — continuación</p>
          )}

          <div className="ficha-grid">
            {pageExercises.map((ex, i) => (
              <ExerciseCard
                key={`${pageIdx}-${i}`}
                number={pageIdx * pageSize + i + 1}
                full={isFullWidthExercise(ex)}
              >
                <ExerciseRenderer ex={ex} showAnswer={false} />
              </ExerciseCard>
            ))}
          </div>

          <FichaFooter />
        </div>
      ))}
    </>
  );
}
