/**
 * Cliente HTTP hacia Edge content-session / content-ficha.
 * No incluye motor de generación: solo transporta JWT y parsea la respuesta.
 */
import { getSupabase, isSupabaseConfigured } from "../supabase/client";
import type { OperationsExercise } from "../../core/activities/operations";
import type { OperationSheetExercise } from "../../core/ficha/types";

export type ContentDifficulty = "easy" | "medium" | "hard" | "expert";

export type ContentClientErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "bad_request"
  | "not_implemented"
  | "server"
  | "network"
  | "invalid_response";

export class ContentClientError extends Error {
  readonly code: ContentClientErrorCode;
  readonly status: number;

  constructor(code: ContentClientErrorCode, message: string, status = 0) {
    super(message);
    this.name = "ContentClientError";
    this.code = code;
    this.status = status;
  }
}

async function invokeJson(
  functionName: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
  if (!isSupabaseConfigured()) {
    throw new ContentClientError("not_configured", "Supabase no está configurado", 0);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  // supabase-js mete el JSON de error en `data` cuando FunctionsHttpError;
  // también puede venir en error.context.
  if (error) {
    const ctx = error as { context?: Response; message?: string };
    let status = 0;
    let payload: Record<string, unknown> | null = null;
    if (ctx.context && typeof ctx.context.json === "function") {
      status = ctx.context.status;
      try {
        payload = (await ctx.context.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }
    const msg =
      (payload && typeof payload.error === "string" && payload.error) ||
      ctx.message ||
      "Error al llamar a la función";
    throw mapHttpError(status || 500, msg);
  }

  if (!data || typeof data !== "object") {
    throw new ContentClientError("invalid_response", "Respuesta vacía del servidor", 502);
  }
  return { status: 200, data: data as Record<string, unknown> };
}

function mapHttpError(status: number, message: string): ContentClientError {
  if (status === 401) return new ContentClientError("unauthorized", message, status);
  if (status === 403) return new ContentClientError("forbidden", message, status);
  if (status === 400) return new ContentClientError("bad_request", message, status);
  if (status === 501) return new ContentClientError("not_implemented", message, status);
  if (status === 0) return new ContentClientError("network", message, status);
  return new ContentClientError("server", message, status || 500);
}

function parseSumaExercises(raw: unknown): OperationsExercise[] {
  if (!Array.isArray(raw)) {
    throw new ContentClientError("invalid_response", "exercises inválidos", 502);
  }
  const out: OperationsExercise[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const ex = item as Record<string, unknown>;
    const a = ex.a;
    const b = ex.b;
    const answer = ex.answer;
    if (typeof a !== "number" || typeof b !== "number" || typeof answer !== "number") {
      throw new ContentClientError("invalid_response", "ejercicio suma mal formado", 502);
    }
    out.push({
      a,
      b,
      op: "suma",
      answer,
      imageUrl: typeof ex.imageUrl === "string" ? ex.imageUrl : "",
    });
  }
  if (out.length === 0) {
    throw new ContentClientError("invalid_response", "sesión suma vacía", 502);
  }
  return out;
}

function parseFichaExercises(raw: unknown): OperationSheetExercise[] {
  if (!Array.isArray(raw)) {
    throw new ContentClientError("invalid_response", "exercises ficha inválidos", 502);
  }
  const out: OperationSheetExercise[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const ex = item as Record<string, unknown>;
    const a = ex.a;
    const b = ex.b;
    if (typeof a !== "number" || typeof b !== "number") {
      throw new ContentClientError("invalid_response", "ficha suma mal formada", 502);
    }
    const row: OperationSheetExercise = {
      kind: "operation",
      a,
      b,
      op: "+",
      imageUrl: typeof ex.imageUrl === "string" ? ex.imageUrl : "",
    };
    if (typeof ex.answer === "number") row.answer = ex.answer;
    out.push(row);
  }
  if (out.length === 0) {
    throw new ContentClientError("invalid_response", "ficha suma vacía", 502);
  }
  return out;
}

/** Sesión interactiva de suma (usuario registrado con JWT). */
export async function fetchSumaSession(input: {
  difficulty: ContentDifficulty;
  seed: number;
}): Promise<OperationsExercise[]> {
  const { data } = await invokeJson("content-session", {
    activityId: "suma",
    difficulty: input.difficulty,
    seed: input.seed,
  });
  return parseSumaExercises(data.exercises);
}

/** Ejercicios de ficha/soluciones de suma vía Edge. */
export async function fetchSumaFichaExercises(input: {
  difficulty: ContentDifficulty;
  seed: number;
  count: number;
  modes: Array<"alumno" | "soluciones">;
  withImages: boolean;
}): Promise<OperationSheetExercise[]> {
  const { data } = await invokeJson("content-ficha", {
    activityId: "suma",
    difficulty: input.difficulty,
    seed: input.seed,
    count: input.count,
    modes: input.modes,
    withImages: input.withImages,
  });
  return parseFichaExercises(data.exercises);
}
