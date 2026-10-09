import "./ModalCloseButton.css";

export interface ModalCloseButtonProps {
  onClick: () => void;
  /** Etiqueta accesible. Por defecto «Cerrar». */
  ariaLabel?: string;
  className?: string;
}

/**
 * Aspa circular de cerrar modales (selección de nivel, configuración de ficha…).
 * Mismo aspecto y hover en todas las pantallas que la usan.
 */
export function ModalCloseButton({
  onClick,
  ariaLabel = "Cerrar",
  className = "",
}: ModalCloseButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`modal-close-btn ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
