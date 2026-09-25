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

  // Chalkboard adjustment state
  const [geometry, setGeometry] = useState({ top: 49, left: 229, width: 818, height: 481 });
  const [imageBounds, setImageBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chalkboardContentRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const closeAll = useCallback(() => setOpenColumn(null), []);

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

  // Update image bounds when image loads or viewport resizes
  const updateImageBounds = useCallback(() => {
    const image = imageRef.current;
    const stage = stageRef.current;
    if (!image || !stage) return;
    const imageRect = image.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    setImageBounds({
      left: imageRect.left - stageRect.left,
      top: imageRect.top - stageRect.top,
      width: imageRect.width,
      height: imageRect.height,
    });
  }, []);

  useEffect(() => {
    if (!openColumn) return;
    const image = imageRef.current;
    const stage = stageRef.current;
    if (image && image.complete) {
      updateImageBounds();
    }
    const handleLoad = () => updateImageBounds();
    const handleResize = () => updateImageBounds();
    image?.addEventListener("load", handleLoad);
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(updateImageBounds);
    if (stage) ro.observe(stage);
    return () => {
      image?.removeEventListener("load", handleLoad);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
  }, [openColumn, updateImageBounds]);

  // Initialize geometry when image bounds are known
  useEffect(() => {
    if (imageBounds && geometry.width === 0) {
      const inset = Math.min(imageBounds.width, imageBounds.height) * 0.1;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeometry({
        top: Math.round(inset),
        left: Math.round(inset),
        width: Math.round(imageBounds.width - 2 * inset),
        height: Math.round(imageBounds.height - 2 * inset),
      });
    }
  }, [imageBounds, geometry.width]);

  const adjustGeometry = useCallback(
    (delta: Partial<{ top: number; left: number; width: number; height: number }>) => {
      setGeometry((prev) => {
        const next = { ...prev, ...delta };
        if (imageBounds) {
          // clamp within image bounds
          next.width = Math.max(20, Math.min(next.width, imageBounds.width - next.left));
          next.height = Math.max(20, Math.min(next.height, imageBounds.height - next.top));
          next.left = Math.max(0, Math.min(next.left, imageBounds.width - next.width));
          next.top = Math.max(0, Math.min(next.top, imageBounds.height - next.height));
        }
        return next;
      });
    },
    [imageBounds],
  );

  const moveStep = 2;
  const resizeStep = 4;

  const copyCss = async () => {
    if (!imageBounds) return;
    const css = [
      ".chalkboard-content {",
      "  position: absolute;",
      `  top: ${geometry.top}px;`,
      `  left: ${geometry.left}px;`,
      `  width: ${geometry.width}px;`,
      `  height: ${geometry.height}px;`,
      "  border: 3px solid #ff0000;",
      "  box-sizing: border-box;",
      "  pointer-events: none;",
      "}",
    ].join("\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(css);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = css;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopyStatus("Valores copiados al portapapeles");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Error al copiar");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

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
      {openColumn &&
        createPortal(
          <div
            className="filter-chalkboard-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Pizarra de selección"
          >
            <div
              className="filter-chalkboard-stage"
              ref={stageRef}
              onClick={(e) => e.stopPropagation()}
            >
              <img ref={imageRef} className="filter-chalkboard-image" src={pizarraImg} alt="" />
              {imageBounds && (
                <div
                  className="filter-chalkboard-image-area"
                  style={{
                    left: imageBounds.left,
                    top: imageBounds.top,
                    width: imageBounds.width,
                    height: imageBounds.height,
                  }}
                >
                  <div
                    className="chalkboard-content"
                    style={{
                      top: geometry.top,
                      left: geometry.left,
                      width: geometry.width,
                      height: geometry.height,
                    }}
                    ref={chalkboardContentRef}
                  >
                    {renderChalkboardOptions()}
                  </div>
                </div>
              )}
            </div>
            <div className="filter-chalkboard-controls" onClick={(e) => e.stopPropagation()}>
              <div className="control-group">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ top: geometry.top - moveStep });
                  }}
                  aria-label="Mover arriba"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ top: geometry.top + moveStep });
                  }}
                  aria-label="Mover abajo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ left: geometry.left - moveStep });
                  }}
                  aria-label="Mover izquierda"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ left: geometry.left + moveStep });
                  }}
                  aria-label="Mover derecha"
                >
                  →
                </button>
              </div>
              <div className="control-group">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ width: geometry.width - resizeStep });
                  }}
                  aria-label="Disminuir anchura"
                >
                  − Ancho
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ width: geometry.width + resizeStep });
                  }}
                  aria-label="Aumentar anchura"
                >
                  + Ancho
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ height: geometry.height - resizeStep });
                  }}
                  aria-label="Disminuir altura"
                >
                  − Alto
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustGeometry({ height: geometry.height + resizeStep });
                  }}
                  aria-label="Aumentar altura"
                >
                  + Alto
                </button>
              </div>
              <div className="control-values">
                <span>Top: {geometry.top}px</span>
                <span>Left: {geometry.left}px</span>
                <span>Width: {geometry.width}px</span>
                <span>Height: {geometry.height}px</span>
                {imageBounds && (
                  <>
                    <span>
                      Right: {Math.round(imageBounds.width - geometry.left - geometry.width)}px
                    </span>
                    <span>
                      Bottom: {Math.round(imageBounds.height - geometry.top - geometry.height)}px
                    </span>
                  </>
                )}
              </div>
              <button className="copy-btn" onClick={copyCss}>
                Copiar valores CSS
              </button>
              {copyStatus && <span className="copy-status">{copyStatus}</span>}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
