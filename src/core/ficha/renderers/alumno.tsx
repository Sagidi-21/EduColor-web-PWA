import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { FichaFooter } from "./components/Footer";
import { chunkByPageSize, pageSizeForExercises } from "./pageLayout";
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
 * Devuelve un contenedor listo para exportación / vista previa.
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

          <ExerciseGrid
            exercises={pageExercises}
            pageOffset={pageIdx * pageSize}
            showAnswer={false}
          />

          <FichaFooter />
        </div>
      ))}
    </>
  );
}
