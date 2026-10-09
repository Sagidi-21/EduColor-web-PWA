import { getEngineRegistration } from "../../content/engine-registry";
import { getActivityManifest } from "../../../manifests/content-registry";
import type { GeneratorDef, SheetConfig, SheetExercise } from "../types";
import { mapSessionToSheet } from "./mapSessionToSheet";
import { getSessionEngine } from "./session-engines";

const SEED_MODULUS = 999983;

export function createGenerator(activityId: string): GeneratorDef {
  const manifest = getActivityManifest(activityId);
  const engine = getSessionEngine(activityId);
  const engineId = manifest?.engineId ?? activityId;
  const registration = getEngineRegistration(engineId);

  if (!manifest || !engine || registration.status !== "available") {
    throw new Error(`No hay generador de ficha para la actividad "${activityId}".`);
  }

  return {
    activityId,
    label: manifest.title,
    icon: manifest.boardCard?.icon ?? "📄",
    supportsImages: engine.supportsImages,
    generate(config: SheetConfig): SheetExercise[] {
      const results: SheetExercise[] = [];
      let seed = config.seed;
      let rounds = 0;

      while (results.length < config.count) {
        const session = engine.generateSession(config.difficulty, seed, config);
        if (session.length === 0) {
          throw new Error(`La actividad "${activityId}" no generó ejercicios (semilla ${seed}).`);
        }
        for (const ex of session) {
          if (results.length >= config.count) break;
          results.push(mapSessionToSheet(activityId, ex, config));
        }
        seed = (seed + 1) % SEED_MODULUS;
        rounds += 1;
        if (rounds > config.count) {
          throw new Error(
            `No se pudieron generar ${config.count} ejercicios para "${activityId}".`,
          );
        }
      }

      return results;
    },
  };
}

export function getGenerator(activityId: string): GeneratorDef {
  return createGenerator(activityId);
}
