import type { ReactNode } from "react";
import "./ActivityCelebration.css";

export interface ActivityCelebrationProps {
  /** Texto del aviso. Por defecto el estándar de pizarra. */
  children?: ReactNode;
  /**
   * `overlay` (default): anclado arriba-centro del stage (posición absoluta).
   * `inline`: en el flujo del layout, sin absolute.
   */
  variant?: "overlay" | "inline";
  className?: string;
}

/**
 * Feedback visual de acierto compartido para ejercicios de pizarra.
 * Misma tipografía/color/animación que el antiguo `.ops__celebration`.
 * La posición en pantalla la decide el padre (dónde se monta) + `variant`.
 */
export function ActivityCelebration({
  children = "¡Correcto! ⭐",
  variant = "overlay",
  className = "",
}: ActivityCelebrationProps): JSX.Element {
  const classes = [
    "activity-celebration",
    variant === "inline" ? "activity-celebration--inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      {children}
    </div>
  );
}
