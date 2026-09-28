import type { ActivityManifest } from "../../../core/content/contracts";
import type { EngineScreenProps } from "../engine-screens";
import { getActivityManifest } from "../../../manifests/content-registry";

/**
 * Utilidades compartidas por los smoke tests de los renderers.
 *
 * Este módulo solo lo importan los tests: no forma parte del grafo de la app.
 */

/** Carga el manifiesto real de la actividad y falla si no existe. */
export function requireManifest(id: string): ActivityManifest {
  const manifest = getActivityManifest(id);
  if (!manifest) throw new Error(`Falta el manifiesto de ${id} en src/manifests/activities`);
  return manifest;
}

/**
 * Props mínimas de `EngineScreenProps` para montar un renderer en un test.
 * El manifiesto es el real, no una copia, para que el test falle si el
 * manifiesto y el renderer se desincronizan.
 */
export function smokeProps(
  id: string,
  onExit: () => void,
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return {
    activity: requireManifest(id),
    difficulty,
    seed,
    onExit,
    gradeTitle: "1.º de Primaria",
    className: "1.ºA",
    difficultyStars: "★★☆☆",
  };
}

/** Las 4 dificultades, en el orden en que las usa el catálogo. */
export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
