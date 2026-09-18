import type { JSX } from "react";

import "./Numpad.css";

const NUMPAD_KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["←", "0", "✓"],
];

const HORIZONTAL_KEYS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "←", "✓"]
];

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
                className={`shared-numpad__key ${isConf ? "shared-numpad__key--confirm" : ""} ${isDel ? "shared-numpad__key--del" : ""}`}
                onClick={() => {
                  if (isDel) onDelete();
                  else if (isConf) onConfirm();
                  else onDigit(k);
                }}
                disabled={disabled}
              >
                {k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
