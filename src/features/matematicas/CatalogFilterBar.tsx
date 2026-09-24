import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Subject,
  Grade,
  CurriculumBlock,
  SubjectId,
  GradeId,
} from "../../core/content/contracts";
import "./CatalogFilterBar.css";

interface CatalogFilterBarProps {
  subjects: readonly Subject[];
  grades: readonly Grade[];
  blocks: readonly CurriculumBlock[];
  subjectId: SubjectId;
  gradeId: GradeId;
  blockId: string;
  onSubjectChange: (subjectId: SubjectId) => void;
  onGradeChange: (gradeId: GradeId) => void;
  onBlockChange: (blockId: string) => void;
}

type OpenColumn = "materia" | "curso" | "bloque" | null;

export function CatalogFilterBar({
  subjects,
  grades,
  blocks,
  subjectId,
  gradeId,
  blockId,
  onSubjectChange,
  onGradeChange,
  onBlockChange,
}: CatalogFilterBarProps) {
  const [openColumn, setOpenColumn] = useState<OpenColumn>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => setOpenColumn(null), []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        closeAll();
      }
    }
    if (openColumn) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [openColumn, closeAll]);

  const toggleColumn = (column: OpenColumn) => {
    setOpenColumn((prev) => (prev === column ? null : column));
  };

  const activeSubject = subjects.find((s) => s.id === subjectId);
  const activeGrade = grades.find((g) => g.id === gradeId);
  const activeBlock = blocks.find((b) => b.id === blockId);

  const gradeIconText = activeGrade
    ? (activeGrade.title.match(/^(\\d+)/)?.[1] ?? activeGrade.title.charAt(0))
    : "1";

  return (
    <div className="catalog-filter-bar" ref={barRef} aria-label="Filtros del catálogo">
      <div className="filter-column filter-column--materia">
        <div className="filter-label">
          <span className="filter-indicator" style={{ background: "#F59E0B" }} />
          <span className="filter-label-text">Materia</span>
        </div>
        <div
          className="filter-trigger"
          onClick={() => toggleColumn(openColumn === "materia" ? null : "materia")}
          aria-expanded={openColumn === "materia"}
          aria-haspopup="listbox"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            toggleColumn(openColumn === "materia" ? null : "materia")
          }
        >
          <div className="trigger-icon trigger-icon--materia">
            <div className="icon-circle icon-circle--yellow">
              <span className="ruler-icon">&#128208;</span>
            </div>
          </div>
          <div className="trigger-text">
            <span className="trigger-title">{activeSubject?.title ?? "Matemáticas"}</span>
          </div>
          <span className="trigger-chevron" aria-label="Abrir selector de materia">
            <span className={"chevron" + (openColumn === "materia" ? " chevron--open" : "")}>
              &#9660;
            </span>
          </span>
        </div>
        {openColumn === "materia" && (
          <div className="filter-dropdown" role="listbox">
            <div className="dropdown-header">
              <span className="dropdown-header-icon">&#127918;</span>
              <span className="dropdown-header-text">SELECCIONA LA MATERIA</span>
            </div>
            <div className="dropdown-list">
              {subjects.map((subject) => {
                const isActive = subject.id === subjectId;
                return (
                  <button
                    key={subject.id}
                    className={"dropdown-item" + (isActive ? " dropdown-item--active" : "")}
                    onClick={() => {
                      onSubjectChange(subject.id);
                      closeAll();
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    {isActive && (
                      <>
                        <span className="active-badge">ACTIVO</span>
                        <span className="active-stars">&#10024;</span>
                        <span className="active-check">&#10003;</span>
                      </>
                    )}
                    <span className="dropdown-item-text">{subject.title}</span>
                  </button>
                );
              })}
            </div>
            <button className="dropdown-footer" onClick={closeAll}>
              Cerrar &#9650;
            </button>
          </div>
        )}
      </div>

      {/* --- CURSO --- */}
      <div className="filter-column filter-column--curso">
        <div className="filter-label">
          <span className="filter-indicator" style={{ background: "#0EA5E9" }} />
          <span className="filter-label-text">Curso</span>
        </div>
        <div
          className="filter-trigger"
          onClick={() => toggleColumn(openColumn === "curso" ? null : "curso")}
          aria-expanded={openColumn === "curso"}
          aria-haspopup="listbox"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            toggleColumn(openColumn === "curso" ? null : "curso")
          }
        >
          <div className="trigger-icon trigger-icon--curso">
            <div className="icon-circle icon-circle--blue">
              <span className="grade-icon-text">{gradeIconText}</span>
            </div>
          </div>
          <div className="trigger-text">
            <span className="trigger-title trigger-title--with-badge">
              {activeGrade?.title ?? "1º Primaria"}
              <span className="active-badge active-badge--cyan">ACTIVO</span>
            </span>
          </div>
          <span
            className="trigger-chevron trigger-chevron--cyan"
            aria-label="Abrir selector de curso"
          >
            <span className={"chevron" + (openColumn === "curso" ? " chevron--open" : "")}>
              &#9660;
            </span>
          </span>
        </div>
        {openColumn === "curso" && (
          <div className="filter-dropdown" role="listbox">
            <div className="dropdown-header">
              <span className="dropdown-header-icon">&#127918;</span>
              <span className="dropdown-header-text">SELECCIONA EL CURSO</span>
            </div>
            <div className="dropdown-list">
              {grades.map((grade) => {
                const isActive = grade.id === gradeId;
                return (
                  <button
                    key={grade.id}
                    className={"dropdown-item" + (isActive ? " dropdown-item--active" : "")}
                    onClick={() => {
                      onGradeChange(grade.id);
                      closeAll();
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="dropdown-item-text">{grade.title}</span>
                    {isActive && (
                      <>
                        <span className="active-badge">ACTIVO</span>
                        <span className="active-stars">&#10024;</span>
                        <span className="active-check">&#10003;</span>
                      </>
                    )}
                    {!isActive && <span className="enter-btn">Entrar &#8594;</span>}
                  </button>
                );
              })}
            </div>
            <button className="dropdown-footer" onClick={closeAll}>
              Cerrar &#9650;
            </button>
          </div>
        )}
      </div>
      <div className="filter-column filter-column--bloque">
        <div className="filter-label">
          <span className="filter-indicator" style={{ background: "#10B981" }} />
          <span className="filter-label-text">Bloque</span>
        </div>
        <div
          className="filter-trigger"
          onClick={() => toggleColumn(openColumn === "bloque" ? null : "bloque")}
          aria-expanded={openColumn === "bloque"}
          aria-haspopup="listbox"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            toggleColumn(openColumn === "bloque" ? null : "bloque")
          }
        >
          <div className="trigger-icon trigger-icon--bloque">
            <div className="icon-circle icon-circle--mint">
              <span className="books-icon">&#128218;</span>
            </div>
          </div>
          <div className="trigger-text">
            <span className="trigger-title">
              {activeBlock
                ? `${activeBlock.description} - ${activeBlock.title}`
                : "Todas las unidades"}
            </span>
          </div>
          <span className="trigger-chevron" aria-label="Abrir selector de bloque">
            <span className={"chevron" + (openColumn === "bloque" ? " chevron--open" : "")}>
              &#9660;
            </span>
          </span>
        </div>
        {openColumn === "bloque" && (
          <div className="filter-dropdown" role="listbox">
            <div className="dropdown-header">
              <span className="dropdown-header-icon">&#127918;</span>
              <span className="dropdown-header-text">SELECCIONA EL BLOQUE</span>
            </div>
            <div className="dropdown-list">
              <button
                className={"dropdown-item" + (blockId === "" ? " dropdown-item--active" : "")}
                onClick={() => {
                  onBlockChange("");
                  closeAll();
                }}
                role="option"
                aria-selected={blockId === ""}
              >
                <span className="dropdown-item-text">Todas las unidades</span>
                {blockId === "" && (
                  <>
                    <span className="active-badge">ACTIVO</span>
                    <span className="active-stars">&#10024;</span>
                    <span className="active-check">&#10003;</span>
                  </>
                )}
                {blockId !== "" && <span className="enter-btn">Entrar &#8594;</span>}
              </button>
              {blocks.map((block) => {
                const isActive = block.id === blockId;
                return (
                  <button
                    key={block.id}
                    className={"dropdown-item" + (isActive ? " dropdown-item--active" : "")}
                    onClick={() => {
                      onBlockChange(block.id);
                      closeAll();
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="dropdown-item-text">
                      {block.description} - {block.title}
                    </span>
                    {isActive && (
                      <>
                        <span className="active-badge">ACTIVO</span>
                        <span className="active-stars">&#10024;</span>
                        <span className="active-check">&#10003;</span>
                      </>
                    )}
                    {!isActive && <span className="enter-btn">Entrar &#8594;</span>}
                  </button>
                );
              })}
            </div>
            <button className="dropdown-footer" onClick={closeAll}>
              Cerrar &#9650;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
