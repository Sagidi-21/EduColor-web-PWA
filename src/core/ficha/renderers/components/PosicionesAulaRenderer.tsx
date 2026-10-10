import type { PosicionesAulaSheetExercise } from "../../types";

export interface PosicionesAulaRendererProps {
  ex: PosicionesAulaSheetExercise;
  showAnswer: boolean;
}

type Container = PosicionesAulaSheetExercise["container"];
type Position = PosicionesAulaSheetExercise["position"];
type ObjectName = "pelota" | "lápiz" | "libro" | "goma";

// Geometría de `PosicionesAulaScreen` (viewBox original 340×300), con colores opacos
// para que la escena imprima igual en color y en blanco y negro.
const ANCHORS: Record<
  Container,
  { cx: number; cy: number; top: number; bottom: number; left: number; right: number }
> = {
  caja: { cx: 170, cy: 170, top: 110, bottom: 230, left: 90, right: 250 },
  mochila: { cx: 170, cy: 170, top: 110, bottom: 230, left: 90, right: 250 },
  mesa: { cx: 170, cy: 158, top: 150, bottom: 246, left: 60, right: 280 },
  silla: { cx: 170, cy: 176, top: 108, bottom: 244, left: 80, right: 260 },
};

const OBJECT_RADIUS: Record<ObjectName, number> = { pelota: 22, lápiz: 20, libro: 18, goma: 12 };

const WOOD_LIGHT = "#f1e3d3";
const WOOD_DARK = "#b47c3c";

function normalizeObject(name: string): ObjectName {
  if (name === "lapiz") return "lápiz";
  if (name === "pelota" || name === "libro" || name === "goma" || name === "lápiz") return name;
  return "libro";
}

function ContainerShape({ type }: { type: Container }): JSX.Element {
  if (type === "caja" || type === "mochila") {
    return (
      <g>
        <rect
          x={90}
          y={110}
          width={160}
          height={120}
          rx={8}
          fill={WOOD_LIGHT}
          stroke={WOOD_DARK}
          strokeWidth={3}
        />
        <rect x={85} y={103} width={170} height={14} rx={4} fill={WOOD_DARK} />
        {type === "mochila" && (
          <>
            <rect x={120} y={103} width={14} height={30} rx={4} fill="#8b5e2e" />
            <rect x={206} y={103} width={14} height={30} rx={4} fill="#8b5e2e" />
          </>
        )}
      </g>
    );
  }
  if (type === "mesa") {
    return (
      <g>
        <rect
          x={60}
          y={150}
          width={220}
          height={16}
          rx={4}
          fill="#e7cfae"
          stroke={WOOD_DARK}
          strokeWidth={2.5}
        />
        <rect x={80} y={166} width={14} height={80} rx={3} fill={WOOD_DARK} />
        <rect x={246} y={166} width={14} height={80} rx={3} fill={WOOD_DARK} />
      </g>
    );
  }
  return (
    <g>
      <rect
        x={80}
        y={168}
        width={180}
        height={16}
        rx={4}
        fill="#e7cfae"
        stroke={WOOD_DARK}
        strokeWidth={2.5}
      />
      <rect
        x={80}
        y={108}
        width={12}
        height={65}
        rx={3}
        fill="#e7cfae"
        stroke={WOOD_DARK}
        strokeWidth={2}
      />
      <rect
        x={248}
        y={108}
        width={12}
        height={65}
        rx={3}
        fill="#e7cfae"
        stroke={WOOD_DARK}
        strokeWidth={2}
      />
      <rect
        x={80}
        y={108}
        width={180}
        height={14}
        rx={4}
        fill="#e7cfae"
        stroke={WOOD_DARK}
        strokeWidth={2}
      />
      <rect x={88} y={184} width={12} height={60} rx={3} fill={WOOD_DARK} />
      <rect x={240} y={184} width={12} height={60} rx={3} fill={WOOD_DARK} />
    </g>
  );
}

function objectCenter(
  container: Container,
  position: Position,
  r: number,
): { cx: number; cy: number } {
  const a = ANCHORS[container];
  switch (position) {
    case "encima":
      return { cx: a.cx, cy: a.top - r - 8 };
    case "debajo":
      return { cx: a.cx, cy: a.bottom + r + 8 };
    case "fuera":
      return { cx: a.right + 50, cy: a.cy };
    case "al lado":
      return { cx: a.right + r + 10, cy: a.cy };
    case "dentro":
    default:
      return { cx: a.cx, cy: a.cy };
  }
}

function ObjectShape({ type, cx, cy }: { type: ObjectName; cx: number; cy: number }): JSX.Element {
  if (type === "pelota") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={22} fill="#f97316" stroke="#9a3412" strokeWidth={2} />
        <path
          d={`M ${cx - 12} ${cy - 18} Q ${cx} ${cy + 5} ${cx + 12} ${cy - 18}`}
          fill="none"
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  }
  if (type === "lápiz") {
    return (
      <g transform={`translate(${cx},${cy}) rotate(-30)`}>
        <rect
          x={-6}
          y={-24}
          width={12}
          height={44}
          rx={2}
          fill="#fbbf24"
          stroke="#92400e"
          strokeWidth={1.5}
        />
        <polygon points="-6,20 6,20 0,32" fill="#f59e0b" stroke="#92400e" strokeWidth={1} />
        <rect x={-6} y={-24} width={12} height={8} rx={1} fill="#f87171" />
        <rect x={-6} y={-16} width={12} height={2} fill="#d97706" />
      </g>
    );
  }
  if (type === "libro") {
    return (
      <g>
        <rect
          x={cx - 20}
          y={cy - 16}
          width={40}
          height={32}
          rx={2}
          fill="#818cf8"
          stroke="#4338ca"
          strokeWidth={1.5}
        />
        <line x1={cx} y1={cy - 16} x2={cx} y2={cy + 16} stroke="#4338ca" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy - 6} x2={cx - 4} y2={cy - 6} stroke="white" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy + 1} x2={cx - 4} y2={cy + 1} stroke="white" strokeWidth={1.5} />
        <line x1={cx - 14} y1={cy + 8} x2={cx - 4} y2={cy + 8} stroke="white" strokeWidth={1.5} />
      </g>
    );
  }
  return (
    <rect
      x={cx - 18}
      y={cy - 10}
      width={36}
      height={20}
      rx={3}
      fill="#f9a8d4"
      stroke="#be185d"
      strokeWidth={1.5}
    />
  );
}

/** Escena SVG: objeto respecto a caja / mochila / mesa / silla. */
function Scene({ ex }: { ex: PosicionesAulaSheetExercise }): JSX.Element {
  const object = normalizeObject(ex.object);
  const r = OBJECT_RADIUS[object];
  const { cx, cy } = objectCenter(ex.container, ex.position, r);
  return (
    <svg
      className="ficha-posiciones__svg"
      viewBox="30 40 330 270"
      role="img"
      aria-label={`${object} y ${ex.container}`}
    >
      <ContainerShape type={ex.container} />
      <ObjectShape type={object} cx={cx} cy={cy} />
    </svg>
  );
}

/**
 * Alumno: escena SVG (objeto + recipiente) + pregunta + opciones ○ como en pizarra.
 * Soluciones: las maneja ExerciseRenderer (solo la respuesta).
 */
export function PosicionesAulaRenderer({
  ex,
  showAnswer,
}: PosicionesAulaRendererProps): JSX.Element {
  if (showAnswer) {
    return <div className="ficha-answer">{ex.answer ?? "?"}</div>;
  }

  const choices = ex.choiceLabels ?? [];
  return (
    <div className="ficha-posiciones">
      <div className="ficha-posiciones__scene">
        <Scene ex={ex} />
      </div>
      <div className="ficha-posiciones__text">
        <p className="ficha-posiciones__question">{ex.question}</p>
        {choices.map((label, i) => (
          <div key={`${label}-${i}`} className="ficha-posiciones__choice">
            <span className="ficha-posiciones__choice-mark" aria-hidden>
              ○
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
