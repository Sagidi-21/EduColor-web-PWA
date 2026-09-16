import type { JSX } from "react";

import "./Numpad.css";

const NUMPAD_KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["←", "0", "✓"],
];

export function Numpad({
  onDigit,
  onDelete,
  onConfirm,
  disabled,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  disabled: boolean;
}): JSX.Element {
  return (
    <div className="shared-numpad">
      {NUMPAD_KEYS.map((row, r) => (
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
