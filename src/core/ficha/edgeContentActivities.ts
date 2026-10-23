/**
 * Actividades cuyo contenido ya no se genera en el cliente (D2+).
 * La UI no es autorización: Edge rechaza demo/anónimo.
 */
export const EDGE_CONTENT_ACTIVITY_IDS = ["suma"] as const;

export function isEdgeContentActivity(activityId: string): boolean {
  return (EDGE_CONTENT_ACTIVITY_IDS as readonly string[]).includes(activityId);
}

/** Metadatos UI sin tirar del motor local. */
export function edgeActivitySupportsImages(activityId: string): boolean {
  return activityId === "suma";
}
