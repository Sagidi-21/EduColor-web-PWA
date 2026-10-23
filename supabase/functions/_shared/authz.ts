import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ContentCaller } from "./authzPolicy.ts";
import { isDemoTokenExpired } from "./authzPolicy.ts";

export type { ContentCaller, CallerKind, AuthzDecision } from "./authzPolicy.ts";
export { authorizeActivity, clientAuthFieldsRejected, isDemoTokenExpired } from "./authzPolicy.ts";

export interface AuthzDeps {
  admin: SupabaseClient;
  getUserFromJwt: (jwt: string) => Promise<{ id: string } | null>;
  sessionHasAppAccess: (userId: string) => Promise<boolean>;
  now?: () => Date;
}

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) {
    throw new Error("missing_supabase_admin_env");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Resuelve el caller. No confía en body.role / isDemo / isPremium.
 * Authorization: Bearer <user_jwt> | Bearer demo_<token>
 */
export async function resolveCaller(
  authHeader: string | null,
  deps: AuthzDeps,
): Promise<ContentCaller> {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { kind: "anonymous" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) return { kind: "anonymous" };

  if (token.startsWith("demo_")) {
    const raw = token.slice("demo_".length);
    if (raw.length < 16) return { kind: "anonymous" };
    const tokenHash = await sha256Hex(raw);
    const now = deps.now?.() ?? new Date();
    const { data, error } = await deps.admin
      .from("demo_sessions")
      .select("id, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error || !data) return { kind: "anonymous" };
    if (isDemoTokenExpired(data.expires_at as string, now.getTime())) {
      return { kind: "anonymous" };
    }
    return { kind: "demo", demoSessionId: data.id as string };
  }

  const user = await deps.getUserFromJwt(token);
  if (!user?.id) return { kind: "anonymous" };
  const ok = await deps.sessionHasAppAccess(user.id);
  if (!ok) return { kind: "anonymous" };
  return { kind: "registered", userId: user.id };
}

export function buildDefaultAuthzDeps(admin: SupabaseClient): AuthzDeps {
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  return {
    admin,
    async getUserFromJwt(jwt: string) {
      if (!url || !anonKey) return null;
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await userClient.auth.getUser(jwt);
      if (error || !data.user) return null;
      return { id: data.user.id };
    },
    async sessionHasAppAccess(userId: string) {
      const { data, error } = await admin.rpc("session_has_app_access", {
        p_user_id: userId,
      });
      if (error) return false;
      return Boolean(data);
    },
  };
}
