import type { GradeId } from "../content/contracts";

export const DEMO_MODE_KEY = "educolor_demo_mode";

/** Azul por defecto de la app (styles.css --color-primary). */
export const DEMO_ACCENT_COLOR = "#2563eb";

/** Unidades liberadas en DEMO por curso. */
export const DEMO_ALLOWED_UNITS: Readonly<Record<GradeId, readonly number[]>> = {
  "grade-1": [1, 4],
  "grade-2": [12, 14],
};

export function readDemoMode(): boolean {
  try {
    return sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDemoMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(DEMO_MODE_KEY, "1");
    else sessionStorage.removeItem(DEMO_MODE_KEY);
  } catch {
    // sessionStorage no disponible
  }
}

export function isDemoUnitAllowed(gradeId: GradeId, unit: number): boolean {
  const allowed = DEMO_ALLOWED_UNITS[gradeId];
  return allowed?.includes(unit) ?? false;
}
