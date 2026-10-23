import type { GradeId } from "../content/contracts";

export const DEMO_MODE_KEY = "educolor_demo_mode";
export const AUTH_SKIP_KEY = "educolor_auth_skip_local";

/** Azul por defecto de la app (styles.css --color-primary). */
export const DEMO_ACCENT_COLOR = "#2563eb";

/**
 * Actividades permitidas en DEMO (fuente de verdad del cliente para contención UI).
 * No es autorización de servidor: el bundle puede seguir exponiendo el resto.
 */
export const DEMO_ALLOWED_ACTIVITY_IDS: readonly string[] = [
  "counting",
  "comparison",
  "ordenar",
  "seriesNumericas",
  "relacionar",
  "amigos10",
  "leftRight",
  "multiplicacion",
] as const;

const demoAllowedSet = new Set(DEMO_ALLOWED_ACTIVITY_IDS);

/** @deprecated Preferir DEMO_ALLOWED_ACTIVITY_IDS / isDemoActivityAllowed. */
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

export function readAuthSkip(): boolean {
  try {
    return sessionStorage.getItem(AUTH_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAuthSkip(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(AUTH_SKIP_KEY, "1");
    else sessionStorage.removeItem(AUTH_SKIP_KEY);
  } catch {
    // sessionStorage no disponible
  }
}

export function isDemoActivityAllowed(activityId: string): boolean {
  return demoAllowedSet.has(activityId);
}

/** @deprecated Preferir isDemoActivityAllowed(activityId). */
export function isDemoUnitAllowed(gradeId: GradeId, unit: number): boolean {
  const allowed = DEMO_ALLOWED_UNITS[gradeId];
  return allowed?.includes(unit) ?? false;
}

export interface LocalAccessFlags {
  authSkipped: boolean;
  demoMode: boolean;
}

/**
 * Empareja flags locales: auth_skip sin DEMO no puede abrir el catálogo completo.
 * - skip sin demo → fuerza demo
 * - demo sin skip → limpia demo huérfana (no basta para entrar a la app)
 *
 * Contención de cliente; no sustituye autorización en servidor.
 */
export function normalizeLocalAccessFlags(
  flags: LocalAccessFlags = {
    authSkipped: readAuthSkip(),
    demoMode: readDemoMode(),
  },
): LocalAccessFlags {
  const authSkipped = flags.authSkipped;
  let demoMode = flags.demoMode;

  if (authSkipped && !demoMode) {
    demoMode = true;
    writeDemoMode(true);
  } else if (!authSkipped && demoMode) {
    demoMode = false;
    writeDemoMode(false);
  }

  if (authSkipped) writeAuthSkip(true);
  else writeAuthSkip(false);

  return { authSkipped, demoMode };
}

/** Activa DEMO + skip de forma atómica (único camino legítimo sin cuenta). */
export function enterLocalDemoFlags(): LocalAccessFlags {
  writeDemoMode(true);
  writeAuthSkip(true);
  return { authSkipped: true, demoMode: true };
}

/** Limpia DEMO y skip. */
export function clearLocalDemoFlags(): LocalAccessFlags {
  writeDemoMode(false);
  writeAuthSkip(false);
  return { authSkipped: false, demoMode: false };
}
