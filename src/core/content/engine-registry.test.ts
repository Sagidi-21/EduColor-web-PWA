import { describe, expect, it } from "vitest";
import type { ActivityManifest } from "./contracts";
import { canLaunchActivity, getEngineRegistration } from "./engine-registry";

const pendingActivity: ActivityManifest = {
  schemaVersion: 1,
  order: 1,
  id: "ghost-activity",
  engineId: "motor-inexistente",
  subjectId: "mathematics",
  gradeIds: ["grade-1"],
  curriculumBlockIds: ["mathematics-grade-1-unit-1"],
  title: "Actividad sin motor",
  description: "No debe poder lanzarse",
  status: "available",
  parameters: [],
};

describe("registro de motores", () => {
  it("trata un motor inexistente como pendiente y bloquea el lanzamiento", () => {
    expect(getEngineRegistration("motor-inexistente")).toEqual({
      id: "motor-inexistente",
      status: "pending",
    });
    expect(canLaunchActivity(pendingActivity)).toBe(false);
  });

  it("marca comparison como motor PWA disponible", () => {
    expect(getEngineRegistration("comparison").status).toBe("available");
  });
});
