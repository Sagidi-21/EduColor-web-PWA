import type { ActivityManifest } from "../core/content/contracts";
import countingManifest from "./activities/counting.json";

/** Fuente de datos de la PWA: manifiestos JSON validados en tests. */
export const activityManifests: readonly ActivityManifest[] = [
  countingManifest as unknown as ActivityManifest,
];

export function getActivityManifest(id: string): ActivityManifest | undefined {
  return activityManifests.find((manifest) => manifest.id === id);
}
