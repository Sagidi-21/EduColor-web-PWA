import { isDemoActivityAllowed } from "./demoAllowlist";

export type CallerKind = "anonymous" | "demo" | "registered";

export interface ContentCaller {
  kind: CallerKind;
  userId?: string;
  demoSessionId?: string;
}

export type AuthzDecision =
  { ok: true; caller: ContentCaller } | { ok: false; status: 401 | 403; error: string };

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

export function clientAuthFieldsRejected(body: Record<string, unknown>): boolean {
  const banned = ["role", "isDemo", "isPremium", "isAdmin", "entitlement", "allowedActivityIds"];
  return banned.some((k) => Object.prototype.hasOwnProperty.call(body, k));
}

export function isDemoTokenExpired(expiresAtIso: string, nowMs: number): boolean {
  return new Date(expiresAtIso).getTime() <= nowMs;
}
