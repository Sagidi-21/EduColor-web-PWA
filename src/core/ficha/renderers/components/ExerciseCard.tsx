import type { ReactNode } from "react";

export interface ExerciseCardProps {
  number: number;
  children: ReactNode;
  full?: boolean;
  /** Variante de layout (sustituye selectores `:has()` poco fiables en Word). */
  variant?: string;
  className?: string;
}

export function ExerciseCard({
  number,
  children,
  full = false,
  variant = "",
  className = "",
}: ExerciseCardProps): JSX.Element {
  const classes = [
    "ficha-exercise",
    full ? "ficha-exercise--full" : "",
    variant ? `ficha-exercise--${variant}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span className="ficha-exercise__number">{number}</span>
      <div className="ficha-exercise__body">{children}</div>
    </div>
  );
}
