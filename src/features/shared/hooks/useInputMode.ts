import { useState, useCallback } from "react";

export type InputMode = "numpad" | "canvas";

const KEY = "educolor-input-mode";

export function useInputMode() {
  const [mode, setModeState] = useState<InputMode>(
    () => (localStorage.getItem(KEY) as InputMode) ?? "numpad",
  );

  const setMode = useCallback((m: InputMode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "numpad" ? "canvas" : "numpad"),
    [mode, setMode],
  );

  return { mode, toggle };
}
