import type { CapacidadSheetExercise } from "../../types";

export interface CapacidadRendererProps {
  ex: CapacidadSheetExercise;
  showAnswer: boolean;
}

const WATER = "#93c5fd";
const WATER_LINE = "#1d4ed8";
const GLASS = "#334155";

/** Recipiente graduado con `maxLiters` rayitas (1 L cada una) y agua hasta `liters`. */
function Vessel({
  liters,
  maxLiters,
  height = 104,
}: {
  liters: number;
  maxLiters: number;
  height?: number;
}): JSX.Element {
  const top = 8;
  const bottom = top + height;
  const max = Math.max(1, maxLiters);
  const level = Math.max(0, Math.min(liters, max));
  const fillH = (level / max) * height;
  return (
    <svg
      className="ficha-capacidad__vessel"
      width={56}
      height={height + 16}
      viewBox={`0 0 56 ${height + 16}`}
      role="img"
      aria-label="Recipiente graduado"
    >
      {fillH > 0 && (
        <>
          <rect x="11" y={bottom - fillH} width="34" height={fillH} fill={WATER} />
          <line
            x1="11"
            y1={bottom - fillH}
            x2="45"
            y2={bottom - fillH}
            stroke={WATER_LINE}
            strokeWidth="2"
          />
        </>
      )}
      <rect
        x="10"
        y={top}
        width="36"
        height={height}
        fill="none"
        stroke={GLASS}
        strokeWidth="2.5"
      />
      {Array.from({ length: max }, (_, i) => {
        const y = bottom - ((i + 1) * height) / max;
        return (
          <line
            key={i}
            x1="10"
            y1={y}
            x2={i === max - 1 ? 22 : 20}
            y2={y}
            stroke={GLASS}
            strokeWidth="1.8"
          />
        );
      })}
    </svg>
  );
}

/** Vaso de 1 L (trapecio con agua), para sumar litros. */
function Cup(): JSX.Element {
  return (
    <span className="ficha-capacidad__cup">
      <svg width="34" height="40" viewBox="0 0 34 40" role="img" aria-label="Vaso de 1 litro">
        <path
          d="M5 4 L29 4 L25 36 L9 36 Z"
          fill="#fff"
          stroke={GLASS}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M6.2 14 L27.8 14 L25 36 L9 36 Z" fill={WATER} />
        <line x1="6.2" y1="14" x2="27.8" y2="14" stroke={WATER_LINE} strokeWidth="1.5" />
        <path
          d="M5 4 L29 4 L25 36 L9 36 Z"
          fill="none"
          stroke={GLASS}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ficha-capacidad__cup-label">1 L</span>
    </span>
  );
}

function Visual({ ex }: { ex: CapacidadSheetExercise }): JSX.Element | null {
  const max = ex.maxLiters ?? 5;
  if (ex.variant === "compare") {
    return (
      <div className="ficha-capacidad__vessels">
        {(
          [
            { id: "A", liters: ex.litersA ?? 0 },
            { id: "B", liters: ex.litersB ?? 0 },
          ] as const
        ).map((v) => (
          <span key={v.id} className="ficha-capacidad__vessel-wrap">
            <span className="ficha-capacidad__vessel-letter">{v.id}</span>
            <Vessel liters={v.liters} maxLiters={max} />
            <span className="ficha-capacidad__vessel-liters">{v.liters} L</span>
          </span>
        ))}
      </div>
    );
  }
  if (ex.variant === "read") {
    return (
      <div className="ficha-capacidad__vessels">
        <span className="ficha-capacidad__vessel-wrap">
          <Vessel liters={ex.liters ?? 0} maxLiters={max} height={120} />
          <span className="ficha-capacidad__hint">Cada rayita = 1 L</span>
        </span>
      </div>
    );
  }
  if (ex.variant === "fill") {
    return (
      <div className="ficha-capacidad__cups">
        {Array.from({ length: ex.cups ?? 0 }, (_, i) => (
          <Cup key={i} />
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Alumno: recipientes graduados / vasos de 1 L dibujados + pregunta + ○ (A/B/Igual) o casilla «L».
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function CapacidadRenderer({ ex, showAnswer }: CapacidadRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  const writeIn = ex.variant === "read" || ex.variant === "fill";
  return (
    <div className="ficha-capacidad">
      <Visual ex={ex} />
      <p className="ficha-capacidad__question">{ex.question}</p>
      {choices.length > 0 && (
        <div className="ficha-capacidad__choices">
          {choices.map((label, i) => (
            <span key={`${label}-${i}`} className="ficha-capacidad__choice">
              <span className="ficha-capacidad__choice-mark" aria-hidden>
                ○
              </span>
              {label}
            </span>
          ))}
        </div>
      )}
      {writeIn && (
        <div className="ficha-capacidad__write">
          <span className="ficha-capacidad__blank" aria-label="Espacio para la respuesta" />
          <span className="ficha-capacidad__unit">L</span>
        </div>
      )}
    </div>
  );
}
