import type { SheetShapeVisual } from "../../types";

export interface ShapeSvgProps {
  shape: SheetShapeVisual;
  size?: number;
}

/** Dibuja una figura del catálogo en ficha A4 (SVG puro, imprimible). */
export function ShapeSvg({ shape, size = 72 }: ShapeSvgProps): JSX.Element {
  if (shape.drawType === "primitive" && shape.primitive) {
    return (
      <PrimitiveShape
        type={shape.primitive}
        color={shape.color}
        size={size}
        rotation={shape.rotation ?? 0}
      />
    );
  }

  const cuerpo = (() => {
    switch (shape.drawType) {
      case "circle":
        return <circle cx="100" cy="100" r="70" fill={shape.color} stroke="#111" strokeWidth="4" />;
      case "open_line":
        return (
          <path
            d={shape.path}
            fill="none"
            stroke={shape.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case "curved_side":
      case "path":
      default:
        return (
          <path
            d={shape.path || "M 40 40 L 160 40 L 160 160 L 40 160 Z"}
            fill={shape.color}
            stroke="#111"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        );
    }
  })();

  return (
    <svg className="ficha-shape-svg" width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      {cuerpo}
      {shape.showVertices &&
        (shape.vertexPoints ?? []).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="#111" />
        ))}
    </svg>
  );
}

function PrimitiveShape({
  type,
  color,
  size,
  rotation,
}: {
  type: NonNullable<SheetShapeVisual["primitive"]>;
  color: string;
  size: number;
  rotation: number;
}): JSX.Element {
  const common = { fill: color, stroke: "#111", strokeWidth: 3 as const };
  let body: JSX.Element;
  switch (type) {
    case "circle":
      body = <circle cx="50" cy="50" r="36" {...common} />;
      break;
    case "oval":
      body = <ellipse cx="50" cy="50" rx="38" ry="26" {...common} />;
      break;
    case "square":
      body = <rect x="14" y="14" width="72" height="72" rx="4" {...common} />;
      break;
    case "rectangle":
      body = <rect x="8" y="22" width="84" height="56" rx="4" {...common} />;
      break;
    case "triangle":
      body = <polygon points="50,12 88,88 12,88" {...common} />;
      break;
    case "rhombus":
      body = <polygon points="50,10 90,50 50,90 10,50" {...common} />;
      break;
  }
  return (
    <svg
      className="ficha-shape-svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
    >
      {body}
    </svg>
  );
}
