import type { ReactNode } from "react";
import type { SheetExercise } from "../../types";

export interface ExerciseCardProps {
  number: number;
  children: ReactNode;
  full?: boolean;
  /** Variante de layout (sustituye selectores `:has()` poco fiables en Word). */
  variant?: string;
  className?: string;
}

/** Clase explícita por tipo de ejercicio para CSS Word-safe. */
export function exerciseCardVariant(ex: SheetExercise): string {
  switch (ex.kind) {
    case "counting":
      return "counting";
    case "comparison":
      return "compare";
    case "seriesNumericas":
    case "series3Cifras":
      return "series";
    case "ordenar":
      return "ordenar";
    case "relacionar":
      return "relacionar";
    default:
      return "";
  }
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
