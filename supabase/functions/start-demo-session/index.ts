import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAdminClient, sha256Hex } from "../_shared/authz.ts";
import { DEMO_ALLOWED_ACTIVITY_IDS } from "../_shared/demoAllowlist.ts";
import { json, optionsResponse } from "../_shared/http.ts";

const DEMO_TTL_MINUTES = 30;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashIp(ip: string): Promise<string | null> {
  if (!ip) return null;
  return sha256Hex(ip);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const admin = createAdminClient();
    const rawToken = randomToken();
    const tokenHash = await sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + DEMO_TTL_MINUTES * 60_000).toISOString();
    const forwarded = req.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "";
    const ipHash = await hashIp(ip);

    // Rate limit simple: máx. 20 sesiones / hora / ip_hash (si hay IP).
    if (ipHash) {
      const since = new Date(Date.now() - 60 * 60_000).toISOString();
      const { count, error: countErr } = await admin
        .from("demo_sessions")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", since);
      if (!countErr && typeof count === "number" && count >= 20) {
        return json({ error: "Too many demo sessions" }, 429);
      }
    }

    const { error } = await admin.from("demo_sessions").insert({
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_hash: ipHash,
    });
    if (error) {
      console.error("[start-demo-session] insert", error.message);
      return json({ error: "Unable to create demo session" }, 500);
    }

    return json({
      ok: true,
      expiresAt,
      allowedActivityIds: [...DEMO_ALLOWED_ACTIVITY_IDS],
      // Token opaco; el cliente debe enviar Authorization: Bearer demo_<token>
      token: `demo_${rawToken}`,
    });
  } catch (e) {
    console.error("[start-demo-session]", e instanceof Error ? e.message : "error");
    return json({ error: "Server not configured" }, 500);
  }
});
