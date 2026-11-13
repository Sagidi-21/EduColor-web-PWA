import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
};

/** Respuesta neutra: no filtrar si el email existe (D-037). */
const MSG_NEUTRAL =
  "Si el email está registrado, recibirás un enlace para definir una contraseña nueva.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { email?: string };
    try {
      body = (await req.json()) as { email?: string };
    } catch {
      return json({ ok: true, message: MSG_NEUTRAL });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) {
      return json({ ok: true, message: MSG_NEUTRAL });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey) {
      return json({ ok: true, message: MSG_NEUTRAL });
    }

    // Preferir SITE_URL (prod Netlify) sobre Origin: el correo debe abrir la PWA publicada.
    const origin = (
      Deno.env.get("SITE_URL") ||
      req.headers.get("origin") ||
      "http://localhost:5173"
    ).replace(/\/$/, "");
    const redirectTo = `${origin}/?setPassword=1&src=forgot`;

    const anon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) console.error("request-new-password", error.message);

    if (serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      void admin.rpc("log_auth_security_event", {
        p_event_type: "password_reset_request",
        p_context: `forgot:${email.slice(0, 60)}`,
      });
    }

    return json({ ok: true, message: MSG_NEUTRAL });
  } catch (err) {
    console.error("request-new-password unhandled", err);
    return json({ ok: true, message: MSG_NEUTRAL });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
