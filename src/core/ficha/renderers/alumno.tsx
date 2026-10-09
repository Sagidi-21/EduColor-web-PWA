import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { FichaFooter } from "./components/Footer";
import { packExercisesForPrint } from "./pagePacking";
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
 * Pagina midiendo alturas reales: máximo por hoja sin cortar ninguno.
 */
export function FichaAlumno({
  exercises,
  config: _config,
  meta,
  logoUrl,
}: FichaAlumnoProps): JSX.Element {
  const pages = packExercisesForPrint(exercises, {
    showAnswer: false,
    withStudentName: Boolean(meta.studentName),
  });
  const pageOffsets = pages.map((_, idx) =>
    pages.slice(0, idx).reduce((sum, page) => sum + page.length, 0),
  );

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
            pageOffset={pageOffsets[pageIdx] ?? 0}
            showAnswer={false}
          />

          <FichaFooter />
        </div>
      ))}
    </>
  );
}
