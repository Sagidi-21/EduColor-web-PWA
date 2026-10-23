import { isDemoActivityAllowed } from "./demoAllowlist.ts";

export type CallerKind = "anonymous" | "demo" | "registered";

export interface ContentCaller {
  kind: CallerKind;
  userId?: string;
  demoSessionId?: string;
}

export type AuthzDecision =
  { ok: true; caller: ContentCaller } | { ok: false; status: 401 | 403; error: string };

/**
 * ¿Puede este caller obtener contenido de activityId?
 * - anonymous → 401
 * - demo → solo allowlist demo (suma premium → 403)
 * - registered → permitido a nivel de rol (el handler comprueba motor implementado)
 */
export function authorizeActivity(caller: ContentCaller, activityId: string): AuthzDecision {
  if (caller.kind === "anonymous") {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (caller.kind === "demo") {
    if (!isDemoActivityAllowed(activityId)) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, caller };
  }
  return { ok: true, caller };
}

/** Rechaza campos de autorización enviados por el cliente (no se usan). */
export function clientAuthFieldsRejected(body: Record<string, unknown>): boolean {
  const banned = ["role", "isDemo", "isPremium", "isAdmin", "entitlement", "allowedActivityIds"];
  return banned.some((k) => Object.prototype.hasOwnProperty.call(body, k));
}

export function isDemoTokenExpired(expiresAtIso: string, nowMs: number): boolean {
  return new Date(expiresAtIso).getTime() <= nowMs;
}
