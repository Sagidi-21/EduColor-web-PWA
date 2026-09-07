import type { ActivityManifest } from "../core/content/contracts";

/** Fuente de datos de la PWA: todos los manifiestos JSON, sin registro manual. */
const manifestModules = import.meta.glob("./activities/*.json", {
  eager: true,
  import: "default",
});

export const activityManifestEntries: readonly {
  source: string;
  manifest: ActivityManifest;
}[] = Object.entries(manifestModules).map(([source, manifest]) => ({
  source,
  manifest: manifest as ActivityManifest,
}));

export const activityManifests: readonly ActivityManifest[] = activityManifestEntries.map(
  (entry) => entry.manifest,
);

export function getActivityManifest(id: string): ActivityManifest | undefined {
  return activityManifests.find((manifest) => manifest.id === id);
}
