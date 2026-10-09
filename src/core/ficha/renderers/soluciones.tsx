import { FichaHeader } from "./components/Header";
import { StudentNameLine } from "./components/StudentNameLine";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { FichaFooter } from "./components/Footer";
import { chunkByPageSize, pageSizeForExercises } from "./pageLayout";
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
  const pageOpts = { showAnswer: true };
  const pageSize = pageSizeForExercises(exercises, pageOpts);
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
            <p className="ficha-page__continued">{meta.title} — soluciones (continuación)</p>
          )}

          <ExerciseGrid
            exercises={pageExercises}
            pageOffset={pageIdx * pageSize}
            showAnswer={true}
          />

          <FichaFooter />
        </div>
      ))}
    </>
  );
}
