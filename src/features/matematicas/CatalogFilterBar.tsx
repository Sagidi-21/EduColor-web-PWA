import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type {
  Subject,
  Grade,
  CurriculumBlock,
  SubjectId,
  GradeId,
} from "../../core/content/contracts";
import pizarraImg from "../../assets/pizarra.png";
import { PIZARRA_CONTENT_PCT } from "./chalkboardOverlayLayout";
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
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const chalkboardContentRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => {
    if (isAnimating) return; // Prevenir doble clic
    setIsAnimating(true);
    setIsExiting(true);
    setTimeout(() => {
      setOpenColumn(null);
      setIsExiting(false);
      setIsAnimating(false);
    }, 1200);
  }, [isAnimating]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // Si el clic es dentro del contenedor chalkboard-content, no cerrar
      if (
        chalkboardContentRef.current &&
        chalkboardContentRef.current.contains(event.target as Node)
      ) {
        return;
      }
      // Si el clic es fuera de la barra de filtros, cerrar
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        closeAll();
      }
    }
    if (openColumn) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [openColumn, closeAll]);

  const renderChalkboardOptions = () => {
    if (!openColumn) return null;
    const title =
      openColumn === "materia"
        ? "SELECCIONA LA MATERIA"
        : openColumn === "curso"
          ? "SELECCIONA EL CURSO"
          : "SELECCIONA EL BLOQUE";
    const items =
      openColumn === "materia"
        ? subjects.map((s) => ({
            id: s.id,
            label: s.title,
            active: s.id === subjectId,
            onClick: () => {
              onSubjectChange(s.id);
              closeAll();
            },
          }))
        : openColumn === "curso"
          ? grades.map((g) => ({
              id: g.id,
              label: g.title,
              active: g.id === gradeId,
              onClick: () => {
                onGradeChange(g.id);
                closeAll();
              },
            }))
          : [
              {
                id: "",
                label: "Todas las unidades",
                active: blockId === "",
                onClick: () => {
                  onBlockChange("");
                  closeAll();
                },
              },
              ...blocks.map((b) => ({
                id: b.id,
                label: `${b.description} - ${b.title}`,
                active: b.id === blockId,
                onClick: () => {
                  onBlockChange(b.id);
                  closeAll();
                },
              })),
            ];
    return (
      <div className="chalkboard-options">
        <h3 className="chalkboard-title">{title}</h3>
        <div className="chalkboard-list" role="listbox">
          {items.map((item) => (
            <button
              key={item.id}
              className={`chalkboard-option${item.active ? " chalkboard-option--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              role="option"
              aria-selected={item.active}
            >
              <span className="chalkboard-option-text">{item.label}</span>
              {item.active && <span className="chalkboard-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

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
      </div>
      {openColumn &&
        createPortal(
          <div
            className={`filter-chalkboard-overlay ${isExiting ? "filter-chalkboard-overlay--exiting" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Pizarra de selección"
          >
            <div className="filter-chalkboard-stage" onClick={(e) => e.stopPropagation()}>
              {/* Contenedor relativo = proporción de la <img>; lista en % sobre la imagen */}
              <div className="filter-chalkboard-frame">
                <img
                  className="filter-chalkboard-image"
                  src={pizarraImg}
                  alt=""
                  draggable={false}
                />
                <div
                  className="chalkboard-content"
                  style={{
                    top: `${PIZARRA_CONTENT_PCT.top}%`,
                    left: `${PIZARRA_CONTENT_PCT.left}%`,
                    width: `${PIZARRA_CONTENT_PCT.width}%`,
                    height: `${PIZARRA_CONTENT_PCT.height}%`,
                  }}
                  ref={chalkboardContentRef}
                >
                  {renderChalkboardOptions()}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
