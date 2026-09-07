import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import type { ActivityManifest } from "../core/content/contracts";
import schema from "./schema/activity-manifest.schema.json";
import { activityManifests, getActivityManifest } from "./content-registry";

const ajv = new Ajv2020({ allErrors: true });
const validateActivity = ajv.compile<ActivityManifest>(schema);

describe("manifiestos de actividad", () => {
  it("cumplen el JSON Schema", () => {
    for (const manifest of activityManifests) {
      expect(validateActivity(manifest), ajv.errorsText(validateActivity.errors)).toBe(true);
    }
  });

  it("usa IDs de actividad únicos y localizables", () => {
    const ids = activityManifests.map((manifest) => manifest.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getActivityManifest("counting")?.title).toBe("Contamos objetos");
  });
});
