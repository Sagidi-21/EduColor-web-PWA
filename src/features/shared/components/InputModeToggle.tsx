import type { InputMode } from "../hooks/useInputMode";
import "./InputModeToggle.css";

interface Props {
  mode: InputMode;
  onToggle: () => void;
}

export default function InputModeToggle({ mode, onToggle }: Props) {
  return (
    <div
      className="input-toggle"
      title={mode === "numpad" ? "Cambiar a escritura" : "Cambiar a teclado"}
    >
      <span
        className={`input-toggle__icon ${mode === "numpad" ? "input-toggle__icon--active" : ""}`}
      >
        ⌨️
      </span>
      <button
        className={`input-toggle__switch ${mode === "canvas" ? "input-toggle__switch--canvas" : ""}`}
        onClick={onToggle}
        aria-label={mode === "numpad" ? "Activar escritura" : "Activar teclado"}
      >
        <span className="input-toggle__knob" />
      </button>
      <span
        className={`input-toggle__icon ${mode === "canvas" ? "input-toggle__icon--active" : ""}`}
      >
        ✏️
      </span>
    </div>
  );
}
