import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateSession } from "../../core/activities/operations";
import { isEdgeContentActivity } from "../../core/ficha/edgeContentActivities";
import { getSessionEngine, sessionEngines } from "../../core/ficha/generators/session-engines";

const root = process.cwd();

function readDistJs(): string {
  const assets = resolve(root, "dist/assets");
  if (!existsSync(assets)) return "";
  return readdirSync(assets)
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(resolve(assets, f), "utf8"))
    .join("\n");
}

describe("D2 separación suma (cliente vs Edge)", () => {
  it("suma es actividad Edge y no tiene motor en sessionEngines", () => {
    expect(isEdgeContentActivity("suma")).toBe(true);
    expect(sessionEngines.suma).toBeUndefined();
    expect(getSessionEngine("suma")).toBeUndefined();
  });

  it("resta sigue disponible localmente (compartido / no D2)", () => {
    expect(sessionEngines.resta).toBeDefined();
    expect(generateSession("resta", "easy", 1).length).toBeGreaterThan(0);
  });

  it("operations.ts no contiene el bucle de generación de suma", () => {
    const src = readFileSync(resolve(root, "src/core/activities/operations.ts"), "utf8");
    expect(src).toMatch(/op === "suma"/);
    expect(src).toMatch(/deshabilitada/);
    // No debe quedar el push del motor premium de suma.
    expect(src).not.toMatch(/op:\s*"suma",\s*answer:\s*a\s*\+\s*b/);
    expect(src).not.toMatch(/maxAnswer:\s*5/);
    expect(src).not.toMatch(/minA:\s*1,\s*\n\s*maxA:\s*4/);
  });

  it("session-engines no importa generateOperations para suma", () => {
    const src = readFileSync(resolve(root, "src/core/ficha/generators/session-engines.ts"), "utf8");
    expect(src).not.toMatch(/generateOperations\(\s*["']suma["']/);
    expect(src).not.toMatch(/generateRestaSession\(\s*["']suma["']/);
    expect(src).toMatch(/suma:\s*D2|No registrar motor local/);
  });

  it("src/platform/content-api solo expone el cliente HTTP (sin motor)", () => {
    const dir = resolve(root, "src/platform/content-api");
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files).toEqual(["contentClient.ts"]);
  });

  it("si existe dist/, el artefacto no empaqueta el motor Edge de suma", () => {
    const js = readDistJs();
    if (!js) return; // skip si no hay build previo
    expect(js).not.toContain("generateSumaSession");
    expect(js).not.toContain("Motor puro de");
    expect(js).not.toContain("edge-suma");
    expect(js).toContain("content-session");
    expect(js).toContain("content-ficha");
    const sw = resolve(root, "dist/sw.js");
    if (existsSync(sw)) {
      expect(readFileSync(sw, "utf8")).not.toContain("generateSumaSession");
    }
  });
});
