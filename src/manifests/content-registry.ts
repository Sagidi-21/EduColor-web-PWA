import type { ActivityManifest } from "../core/content/contracts";

/** Fuente de datos de la PWA: todos los manifiestos JSON, sin registro manual. */
const manifestModules = import.meta.glob("./activities/*.json", {
  eager: true,
  import: "default",
});

export const activityManifests: readonly ActivityManifest[] = Object.values(
  manifestModules,
) as ActivityManifest[];

export function getActivityManifest(id: string): ActivityManifest | undefined {
  return activityManifests.find((manifest) => manifest.id === id);
}
