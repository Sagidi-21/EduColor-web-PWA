/** Allowlist demo — espejo de public.demo_allowed_activities (seed migración D0). */
export const DEMO_ALLOWED_ACTIVITY_IDS = [
  "counting",
  "comparison",
  "ordenar",
  "seriesNumericas",
  "relacionar",
  "amigos10",
  "leftRight",
  "multiplicacion",
] as const;

export type DemoAllowedActivityId = (typeof DEMO_ALLOWED_ACTIVITY_IDS)[number];

const demoSet = new Set<string>(DEMO_ALLOWED_ACTIVITY_IDS);

export function isDemoActivityAllowed(activityId: string): boolean {
  return demoSet.has(activityId);
}

/** Actividades con motor Edge en D1 (piloto). */
export const EDGE_IMPLEMENTED_ACTIVITY_IDS = ["suma"] as const;

export function isEdgeImplementedActivity(activityId: string): boolean {
  return (EDGE_IMPLEMENTED_ACTIVITY_IDS as readonly string[]).includes(activityId);
}
