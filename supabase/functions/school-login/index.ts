import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
};

const MSG_LOCKOUT =
  "Demasiadas credenciales inválidas. Espera 15 minutos. Si el email está registrado, recibirás un enlace para definir una contraseña nueva.";
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

    // Preferir SITE_URL (prod Netlify) para que el enlace del correo abra la PWA correcta.
    const siteOrigin = (
      Deno.env.get("SITE_URL") ||
      req.headers.get("origin") ||
      "http://localhost:5173"
    ).replace(/\/$/, "");

    const ipHash = await hashIp(clientIp(req));
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const guard = await loadGuard(admin, email);
    if (guard?.locked_until && new Date(guard.locked_until).getTime() > Date.now()) {
      // 200: supabase.functions.invoke a veces no expone el body en 4xx.
      return json({ ok: false, message: MSG_LOCKOUT, locked: true });
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
      // Fallo siempre; lockout aparte (solo al activar el bloqueo de 15 min).
      await logSec(admin, "login_fail", email.slice(0, 80));
      if (result.newlyLocked) await logSec(admin, "login_lockout", email.slice(0, 80));
      return json({
        ok: false,
        message: result.locked ? MSG_LOCKOUT : MSG_CREDS,
        locked: result.locked,
      });
    }

    const allowed = await userHasAppAccess(admin, signed.user, email);
    if (!allowed) {
      try {
        await userClient.auth.signOut();
      } catch {
        // ignore
      }
      const result = await registerFailure(admin, email, ipHash, supabaseUrl, anonKey, siteOrigin);
      await logSec(admin, "login_fail", "inactive_or_removed");
      if (result.newlyLocked) await logSec(admin, "login_lockout", "inactive_or_removed");
      return json({
        ok: false,
        message: result.locked ? MSG_LOCKOUT : MSG_CREDS,
        locked: result.locked,
      });
    }

    await clearGuard(admin, email);

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

type AuthUser = {
  id: string;
  user_metadata?: Record<string, unknown> | null;
};

async function userHasAppAccess(
  admin: ReturnType<typeof createClient>,
  user: AuthUser,
  emailNorm: string,
): Promise<boolean> {
  const { data: adminRow } = await admin
    .from("platform_admins")
    .select("email_norm")
    .eq("email_norm", emailNorm)
    .maybeSingle();
  if (adminRow) return true;

  const { data: rpcOk } = await admin.rpc("session_has_app_access", { p_user_id: user.id });
  if (rpcOk === true) return true;

  // Fallback si la RPC aún no está desplegada.
  const { data, error } = await admin
    .from("school_memberships")
    .select("role, is_active")
    .eq("user_id", user.id);
  if (!error && data?.length) {
    const active = data.some(
      (row: { role: string; is_active: boolean | null }) =>
        row.role === "owner" || row.is_active === true || row.is_active === null,
    );
    if (active) return true;
  }

  // Alta post-confirm: permite sesión para bootstrap create_school + WaitingApproval
  // (AppShell no deja entrar al home mientras status=pending).
  const pending =
    typeof user.user_metadata?.pending_school_name === "string"
      ? user.user_metadata.pending_school_name.trim()
      : "";
  return pending.length >= 2;
}

async function loadGuard(admin: ReturnType<typeof createClient>, email: string) {
  const { data } = await admin
    .from("auth_login_guards")
    .select("fail_count, locked_until")
    .eq("email_norm", email)
    .maybeSingle();
  return data as { fail_count: number; locked_until: string | null } | null;
}

async function clearGuard(admin: ReturnType<typeof createClient>, email: string) {
  await admin.from("auth_login_guards").delete().eq("email_norm", email);
}

async function registerFailure(
  admin: ReturnType<typeof createClient>,
  email: string,
  ipHash: string,
  supabaseUrl: string,
  anonKey: string,
  siteOrigin: string,
): Promise<{ locked: boolean; newlyLocked: boolean }> {
  const now = Date.now();
  const existing = await loadGuard(admin, email);
  let failCount = (existing?.fail_count ?? 0) + 1;
  let lockedUntil: string | null = existing?.locked_until ?? null;

  if (lockedUntil && new Date(lockedUntil).getTime() > now) {
    return { locked: true, newlyLocked: false };
  }

  if (lockedUntil && new Date(lockedUntil).getTime() <= now) {
    failCount = 1;
    lockedUntil = null;
  }

  let locked = false;
  let newlyLocked = false;
  if (failCount >= MAX_FAILS) {
    locked = true;
    newlyLocked = true;
    lockedUntil = new Date(now + LOCK_MINUTES * 60_000).toISOString();
    failCount = MAX_FAILS;
  }

  const { error: upsertError } = await admin.from("auth_login_guards").upsert(
    {
      email_norm: email,
      ip_hash: ipHash,
      fail_count: failCount,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email_norm" },
  );
  if (upsertError) {
    console.error("auth_login_guards upsert", upsertError.message);
  }

  if (newlyLocked) {
    await sendRecoveryEmail(supabaseUrl, anonKey, admin, email, siteOrigin, "lockout");
    // D16: await obligatorio — si va en void, Deno corta el fetch a Resend al devolver la respuesta.
    try {
      await notifyOpsLockout(email, ipHash);
    } catch (err) {
      console.error("notifyOpsLockout (no bloquea lockout)", err);
    }
  }

  return { locked, newlyLocked };
}

async function logSec(
  admin: ReturnType<typeof createClient>,
  eventType: "login_fail" | "login_lockout",
  context: string,
): Promise<void> {
  const { error } = await admin.rpc("log_auth_security_event", {
    p_event_type: eventType,
    p_context: context,
  });
  if (error) console.error("log_auth_security_event", eventType, error.message);
}

/** Destinatarios ops por defecto (D16); override con secret OPS_ALERT_EMAILS. */
/** Con onboarding@resend.dev solo llega al email de la cuenta Resend. */
const DEFAULT_OPS_ALERT_EMAILS = "salvadorginestarhernandez@gmail.com";

async function notifyOpsLockout(attemptedEmail: string, ipHash: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!apiKey) {
    console.warn("notifyOpsLockout: RESEND_API_KEY no configurado; se omite aviso ops");
    return;
  }
  const raw = Deno.env.get("OPS_ALERT_EMAILS")?.trim() || DEFAULT_OPS_ALERT_EMAILS;
  const to = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  if (!to.length) {
    console.warn("notifyOpsLockout: OPS_ALERT_EMAILS vacío");
    return;
  }
  const from = Deno.env.get("RESEND_FROM")?.trim() || "EduColor Ops <onboarding@resend.dev>";
  const subject = "EduColor: bloqueo de login (3 fallos)";
  const text = [
    "Se ha bloqueado un intento de Entrar al Colegio tras 3 credenciales inválidas.",
    "",
    `Email intentado: ${attemptedEmail}`,
    `ip_hash (auditoría): ${ipHash.slice(0, 16)}…`,
    `Bloqueo: ${LOCK_MINUTES} minutos.`,
    "",
    "Revisa también el chip Seguridad (24 h) en Admin Central / auth_security_events.",
  ].join("\n");

  // Un destinatario por petición: más fiable con onboarding@resend.dev.
  for (const recipient of to) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [recipient], subject, text }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error("notifyOpsLockout Resend", recipient, res.status, body.slice(0, 400));
      } else {
        console.log("notifyOpsLockout ok", recipient, body.slice(0, 120));
      }
    } catch (err) {
      console.error("notifyOpsLockout", recipient, err);
    }
  }
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
