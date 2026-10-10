import type { Cuerpos3DSheetExercise } from "../../types";

export interface Cuerpos3DRendererProps {
  ex: Cuerpos3DSheetExercise;
  showAnswer: boolean;
}

type Cuerpo = NonNullable<Cuerpos3DSheetExercise["shape"]>;

const FILL = "rgba(16,185,129,.18)";
const FILL2 = "rgba(16,185,129,.1)";
const STROKE = "#0f9f6e";

function cuerpoBody(shape: Cuerpo): JSX.Element {
  switch (shape) {
    case "cubo":
      return (
        <>
          <polygon
            points="40,100 100,100 100,40 40,40"
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          <polygon
            points="40,40 80,10 140,10 100,40"
            fill={FILL2}
            stroke={STROKE}
            strokeWidth="2.5"
          />
          <polygon
            points="100,40 140,10 140,70 100,100"
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2"
            opacity="0.8"
          />
          <line x1="40" y1="100" x2="80" y2="70" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
          <line x1="80" y1="70" x2="140" y2="70" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
          <line x1="80" y1="70" x2="80" y2="10" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
        </>
      );
    case "esfera":
      return (
        <>
          <circle cx="90" cy="80" r="64" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          <ellipse
            cx="90"
            cy="80"
            rx="64"
            ry="18"
            fill="none"
            stroke={STROKE}
            strokeWidth="1.8"
            opacity="0.5"
          />
          <ellipse
            cx="90"
            cy="80"
            rx="18"
            ry="64"
            fill="none"
            stroke={STROKE}
            strokeWidth="1.8"
            opacity="0.35"
          />
        </>
      );
    case "cilindro":
      return (
        <>
          <rect x="30" y="38" width="120" height="90" fill={FILL} stroke="none" />
          <ellipse cx="90" cy="128" rx="60" ry="18" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          <ellipse cx="90" cy="38" rx="60" ry="18" fill={FILL2} stroke={STROKE} strokeWidth="2.5" />
          <line x1="30" y1="38" x2="30" y2="128" stroke={STROKE} strokeWidth="2.5" />
          <line x1="150" y1="38" x2="150" y2="128" stroke={STROKE} strokeWidth="2.5" />
        </>
      );
    case "cono":
      return (
        <>
          <polygon points="90,15 30,140 150,140" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          <ellipse cx="90" cy="140" rx="60" ry="14" fill={FILL2} stroke={STROKE} strokeWidth="2" />
        </>
      );
    case "prisma":
      return (
        <>
          <polygon points="50,130 90,50 130,130" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          <polygon
            points="80,110 110,40 150,110"
            fill={FILL2}
            stroke={STROKE}
            strokeWidth="1.5"
            opacity="0.6"
          />
          <line x1="50" y1="130" x2="80" y2="110" stroke={STROKE} strokeWidth="2" />
          <line x1="90" y1="50" x2="110" y2="40" stroke={STROKE} strokeWidth="2" />
          <line x1="130" y1="130" x2="150" y2="110" stroke={STROKE} strokeWidth="2" />
        </>
      );
    case "piramide":
      return (
        <>
          <polygon
            points="40,130 140,130 160,100 60,100"
            fill={FILL2}
            stroke={STROKE}
            strokeWidth="2"
          />
          <polygon points="40,130 90,30 140,130" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
          <polygon
            points="140,130 90,30 160,100"
            fill={FILL}
            stroke={STROKE}
            strokeWidth="2"
            opacity="0.7"
          />
          <line x1="60" y1="100" x2="90" y2="30" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
        </>
      );
  }
}

/** Cuerpo geométrico 3D (mismo trazado que la pizarra). */
function Cuerpos3DSvg({ shape, size = 110 }: { shape: Cuerpo; size?: number }): JSX.Element {
  return (
    <svg
      className="ficha-cuerpos3d__svg"
      width={size}
      height={(160 / 180) * size}
      viewBox="0 0 180 160"
      aria-hidden
    >
      {cuerpoBody(shape)}
    </svg>
  );
}

/**
 * Alumno: pregunta + cuerpo SVG + opciones • (como en pizarra).
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function Cuerpos3DRenderer({ ex, showAnswer }: Cuerpos3DRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];

  return (
    <div className="ficha-cuerpos3d">
      {ex.question ? <p className="ficha-cuerpos3d__question">{ex.question}</p> : null}
      <div className="ficha-cuerpos3d__body">
        {ex.shape && (
          <div className="ficha-cuerpos3d__figure">
            <Cuerpos3DSvg shape={ex.shape} />
          </div>
        )}
        {choices.length > 0 && (
          <div className="ficha-cuerpos3d__choices">
            {choices.map((label, i) => (
              <div key={`${label}-${i}`} className="ficha-cuerpos3d__choice">
                <span className="ficha-cuerpos3d__choice-mark" aria-hidden>
                  •
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
