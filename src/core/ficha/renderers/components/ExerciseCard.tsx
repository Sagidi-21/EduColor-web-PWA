import type { ReactNode } from "react";

export interface ExerciseCardProps {
  number: number;
  children: ReactNode;
  full?: boolean;
  className?: string;
}

export function ExerciseCard({
  number,
  children,
  full = false,
  className = "",
}: ExerciseCardProps): JSX.Element {
  return (
    <div className={`ficha-exercise ${full ? "ficha-exercise--full" : ""} ${className}`.trim()}>
      <span className="ficha-exercise__number">{number}</span>
      <div className="ficha-exercise__body">{children}</div>
    </div>
  );
}
