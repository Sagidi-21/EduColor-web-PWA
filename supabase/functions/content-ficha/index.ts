import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildDefaultAuthzDeps, createAdminClient, resolveCaller } from "../_shared/authz.ts";
import { handleContentFicha } from "../_shared/contentHandlers.ts";
import { json, optionsResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const admin = createAdminClient();
    const caller = await resolveCaller(
      req.headers.get("authorization"),
      buildDefaultAuthzDeps(admin),
    );
    const result = handleContentFicha(caller, body);
    return json(result.body, result.status);
  } catch (e) {
    console.error("[content-ficha]", e instanceof Error ? e.message : "error");
    return json({ error: "Server error" }, 500);
  }
});
