export interface ObjectImageRowProps {
  count: number;
  imageUrl: string;
  /** Índices tachados (resta en pizarra). */
  crossedFrom?: number;
  className?: string;
}

/** Fila compacta de miniaturas (mismo patrón visual que la pizarra). */
export function ObjectImageRow({
  count,
  imageUrl,
  crossedFrom,
  className = "",
}: ObjectImageRowProps): JSX.Element {
  const n = Math.max(0, count);
  return (
    <div className={`ficha-img-row ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <img
          key={i}
          src={imageUrl}
          alt=""
          className={
            crossedFrom !== undefined && i >= crossedFrom
              ? "ficha-img-row__thumb ficha-img-row__thumb--crossed"
              : "ficha-img-row__thumb"
          }
        />
      ))}
    </div>
  );
}
