/**
 * Lógica de handlers content-session / content-ficha (testeable sin Deno).
 * Las Edge Functions delegan aquí tras resolver el caller.
 */
import { authorizeActivity, clientAuthFieldsRejected, type ContentCaller } from "./authzPolicy";
import { isEdgeImplementedActivity } from "./demoAllowlist";
import { generateSumaSession, isSumaDifficulty } from "./sumaEngine";
import { sumaExercisesToSheet, type FichaMode } from "./sumSheet";

export type HandlerResult =
  | { status: 200; body: Record<string, unknown> }
  | { status: 400 | 401 | 403 | 404 | 501; body: { error: string } };

function parseActivityId(body: Record<string, unknown>): string | null {
  const id = body.activityId;
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
}

export function handleContentSession(
  caller: ContentCaller,
  body: Record<string, unknown>,
): HandlerResult {
  if (clientAuthFieldsRejected(body)) {
    return { status: 400, body: { error: "Invalid authorization fields" } };
  }
  const activityId = parseActivityId(body);
  if (!activityId) return { status: 400, body: { error: "Invalid activityId" } };

  const authz = authorizeActivity(caller, activityId);
  if (!authz.ok) return { status: authz.status, body: { error: authz.error } };

  if (!isEdgeImplementedActivity(activityId)) {
    return { status: 501, body: { error: "Activity not implemented on edge" } };
  }

  const difficultyRaw = typeof body.difficulty === "string" ? body.difficulty : "easy";
  if (!isSumaDifficulty(difficultyRaw)) {
    return { status: 400, body: { error: "Invalid difficulty" } };
  }
  const seed =
    typeof body.seed === "number" && Number.isFinite(body.seed) ? Math.floor(body.seed) : 42;
  if (seed < 1) return { status: 400, body: { error: "Invalid seed" } };

  const exercises = generateSumaSession(difficultyRaw, seed);
  return {
    status: 200,
    body: {
      activityId: "suma",
      difficulty: difficultyRaw,
      seed,
      exercises,
      meta: { engineVersion: "1", source: "edge-suma" },
    },
  };
}

export function handleContentFicha(
  caller: ContentCaller,
  body: Record<string, unknown>,
): HandlerResult {
  if (clientAuthFieldsRejected(body)) {
    return { status: 400, body: { error: "Invalid authorization fields" } };
  }
  const activityId = parseActivityId(body);
  if (!activityId) return { status: 400, body: { error: "Invalid activityId" } };

  const authz = authorizeActivity(caller, activityId);
  if (!authz.ok) return { status: authz.status, body: { error: authz.error } };

  if (!isEdgeImplementedActivity(activityId)) {
    return { status: 501, body: { error: "Activity not implemented on edge" } };
  }

  const difficultyRaw = typeof body.difficulty === "string" ? body.difficulty : "easy";
  if (!isSumaDifficulty(difficultyRaw)) {
    return { status: 400, body: { error: "Invalid difficulty" } };
  }
  const seed =
    typeof body.seed === "number" && Number.isFinite(body.seed) ? Math.floor(body.seed) : 42;
  if (seed < 1) return { status: 400, body: { error: "Invalid seed" } };

  const countRaw = typeof body.count === "number" ? Math.floor(body.count) : 10;
  if (countRaw < 1 || countRaw > 30) return { status: 400, body: { error: "Invalid count" } };

  const withImages = body.withImages !== false;
  const modesRaw = Array.isArray(body.modes) ? body.modes : ["alumno"];
  const modes: FichaMode[] = [];
  for (const m of modesRaw) {
    if (m === "alumno" || m === "soluciones") {
      if (!modes.includes(m)) modes.push(m);
    }
  }
  if (modes.length === 0) return { status: 400, body: { error: "Invalid modes" } };

  const session = generateSumaSession(difficultyRaw, seed).slice(0, countRaw);
  const exercises = sumaExercisesToSheet(session, modes, withImages);

  return {
    status: 200,
    body: {
      activityId: "suma",
      difficulty: difficultyRaw,
      seed,
      count: exercises.length,
      modes,
      exercises,
      answersIncluded: modes.includes("soluciones"),
      meta: { engineVersion: "1", source: "edge-suma" },
    },
  };
}
