import type { JSX } from "react";

import "./Numpad.css";

const NUMPAD_KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["←", "0", "✓"],
];

const HORIZONTAL_KEYS = [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "←", "✓"]];

export function Numpad({
  onDigit,
  onDelete,
  onConfirm,
  disabled,
  layout = "grid",
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  disabled: boolean;
  layout?: "grid" | "horizontal";
}): JSX.Element {
  const keyRows = layout === "horizontal" ? HORIZONTAL_KEYS : NUMPAD_KEYS;

  return (
    <div className={`shared-numpad shared-numpad--${layout}`}>
      {keyRows.map((row, r) => (
        <div key={r} className="shared-numpad__row">
          {row.map((k) => {
            const isDel = k === "←";
            const isConf = k === "✓";
            return (
              <button
                key={k}
                type="button"
                className={`shared-numpad__key ${isConf ? "shared-numpad__key--confirm" : ""} ${isDel ? "shared-numpad__key--del" : ""}`}
                onClick={() => {
                  if (isDel) onDelete();
                  else if (isConf) onConfirm();
                  else onDigit(k);
                }}
                disabled={disabled}
                aria-label={isDel ? "Borrar" : isConf ? "Confirmar" : undefined}
              >
                {isDel ? (
                  <svg
                    className="shared-numpad__del-icon"
                    viewBox="0 0 24 24"
                    width="1em"
                    height="1em"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M20 11H7.83l4.58-4.59L11 5l-7 7 7 7 1.41-1.41L7.83 13H20v-2z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  k
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
