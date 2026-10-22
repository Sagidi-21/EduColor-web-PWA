/** Espejo de supabase/functions/_shared/demoAllowlist.ts — mantener sincronizado (D0/D1). */
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

const demoSet = new Set<string>(DEMO_ALLOWED_ACTIVITY_IDS);

export function isDemoActivityAllowed(activityId: string): boolean {
  return demoSet.has(activityId);
}

export const EDGE_IMPLEMENTED_ACTIVITY_IDS = ["suma"] as const;

export function isEdgeImplementedActivity(activityId: string): boolean {
  return (EDGE_IMPLEMENTED_ACTIVITY_IDS as readonly string[]).includes(activityId);
}
