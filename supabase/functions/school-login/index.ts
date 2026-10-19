import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
};

const MSG_LOCKOUT = "Demasiadas credenciales inválidas. Espera 15 minutos.";
const MSG_CREDS = "Credenciales inválidas.";
const MAX_FAILS = 3;
const LOCK_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { email?: string; password?: string };
    try {
      body = (await req.json()) as { email?: string; password?: string };
    } catch {
      return json({ ok: false, message: "Petición inválida." }, 400);
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    if (!email.includes("@") || password.length < 1) {
      return json({ ok: false, message: MSG_CREDS }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ ok: false, message: "Servidor no configurado." }, 500);
    }

    const siteOrigin =
      req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";

    const ipHash = await hashIp(clientIp(req));
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const guard = await loadGuard(admin, email, ipHash);
    if (guard?.locked_until && new Date(guard.locked_until).getTime() > Date.now()) {
      return json({ ok: false, message: MSG_LOCKOUT, locked: true }, 429);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signed, error: signError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signError || !signed.session || !signed.user) {
      const result = await registerFailure(admin, email, ipHash, supabaseUrl, anonKey, siteOrigin);
      void admin.rpc("log_auth_security_event", {
        p_event_type: result.locked ? "login_lockout" : "login_fail",
        p_context: email.slice(0, 80),
      });
      return json(
        {
          ok: false,
          message: result.locked ? MSG_LOCKOUT : MSG_CREDS,
          locked: result.locked,
        },
        result.locked ? 429 : 401,
      );
    }

    const allowed = await userHasAppAccess(admin, signed.user.id);
    if (!allowed) {
      try {
        await userClient.auth.signOut();
      } catch {
        // ignore
      }
      const result = await registerFailure(admin, email, ipHash, supabaseUrl, anonKey, siteOrigin);
      void admin.rpc("log_auth_security_event", {
        p_event_type: result.locked ? "login_lockout" : "login_fail",
        p_context: "inactive_or_removed",
      });
      return json(
        {
          ok: false,
          message: result.locked ? MSG_LOCKOUT : MSG_CREDS,
          locked: result.locked,
        },
        result.locked ? 429 : 401,
      );
    }

    await clearGuard(admin, email, ipHash);

    return json({
      ok: true,
      access_token: signed.session.access_token,
      refresh_token: signed.session.refresh_token,
    });
  } catch (err) {
    console.error("school-login", err);
    return json({ ok: false, message: "No se pudo iniciar sesión. Inténtalo de nuevo." }, 500);
  }
});

async function userHasAppAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("school_memberships")
    .select("role, is_active")
    .eq("user_id", userId);
  if (error || !data?.length) return false;
  return data.some(
    (row: { role: string; is_active: boolean | null }) =>
      row.role === "owner" || row.is_active === true || row.is_active === null,
  );
}

async function loadGuard(admin: ReturnType<typeof createClient>, email: string, ipHash: string) {
  const { data } = await admin
    .from("auth_login_guards")
    .select("fail_count, locked_until")
    .eq("email_norm", email)
    .eq("ip_hash", ipHash)
    .maybeSingle();
  return data as { fail_count: number; locked_until: string | null } | null;
}

async function clearGuard(admin: ReturnType<typeof createClient>, email: string, ipHash: string) {
  await admin.from("auth_login_guards").delete().eq("email_norm", email).eq("ip_hash", ipHash);
}

async function registerFailure(
  admin: ReturnType<typeof createClient>,
  email: string,
  ipHash: string,
  supabaseUrl: string,
  anonKey: string,
  siteOrigin: string,
): Promise<{ locked: boolean }> {
  const now = Date.now();
  const existing = await loadGuard(admin, email, ipHash);
  let failCount = (existing?.fail_count ?? 0) + 1;
  let lockedUntil: string | null = existing?.locked_until ?? null;

  if (lockedUntil && new Date(lockedUntil).getTime() > now) {
    return { locked: true };
  }

  if (lockedUntil && new Date(lockedUntil).getTime() <= now) {
    failCount = 1;
    lockedUntil = null;
  }

  let locked = false;
  if (failCount >= MAX_FAILS) {
    locked = true;
    lockedUntil = new Date(now + LOCK_MINUTES * 60_000).toISOString();
    failCount = MAX_FAILS;
  }

  await admin.from("auth_login_guards").upsert(
    {
      email_norm: email,
      ip_hash: ipHash,
      fail_count: failCount,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email_norm,ip_hash" },
  );

  if (locked) {
    await sendRecoveryEmail(supabaseUrl, anonKey, admin, email, siteOrigin, "lockout");
  }

  return { locked };
}

async function sendRecoveryEmail(
  supabaseUrl: string,
  anonKey: string,
  admin: ReturnType<typeof createClient>,
  email: string,
  siteOrigin: string,
  src: "lockout" | "forgot",
) {
  // Supabase no envía correo si el email no existe (y no filtramos en la API).
  const redirectTo = `${siteOrigin.replace(/\/$/, "")}/?setPassword=1&src=${src}`;
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) console.error("resetPasswordForEmail", error.message);
  else {
    void admin.rpc("log_auth_security_event", {
      p_event_type: "password_reset_request",
      p_context: `${src}:${email.slice(0, 60)}`,
    });
  }
}

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
