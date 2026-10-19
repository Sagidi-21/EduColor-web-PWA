import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { token?: string; password?: string };
    try {
      body = (await req.json()) as { token?: string; password?: string };
    } catch {
      return json({ ok: false, message: "Petición inválida." }, 400);
    }

    const token = (body.token ?? "").trim();
    const password = body.password ?? "";

    if (token.length < 16 || password.length < 8 || password.length > 24) {
      return json({ ok: false, message: "Revisa los datos del formulario." }, 400);
    }
    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return json({ ok: false, message: "La contraseña no cumple con las restricciones." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, message: "Servidor no configurado." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const invite = await loadInvite(admin, token);
    if (!invite.ok) {
      return json({ ok: false, message: invite.message }, 400);
    }

    let userId: string | null = null;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: invite.first_name,
        last_name_1: invite.last_name_1,
        last_name_2: invite.last_name_2,
        school_id: invite.school_id,
      },
    });

    if (createError || !created.user) {
      const msg = (createError?.message ?? "").toLowerCase();
      console.error("createUser", createError?.message, createError?.status);

      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        // Reintento tras alta parcial: iniciar sesión y completar membresía.
        if (anonKey) {
          const recovered = await recoverExistingUser(
            supabaseUrl,
            anonKey,
            admin,
            invite.email,
            password,
            token,
          );
          if (recovered.ok) {
            return json(recovered.body);
          }
          if (recovered.message) {
            return json({ ok: false, message: recovered.message }, recovered.status ?? 400);
          }
        }
        return json(
          {
            ok: false,
            message: "Este email ya tiene cuenta. Usa Entrar al Colegio con tu contraseña.",
          },
          409,
        );
      }

      if (
        msg.includes("weak") ||
        msg.includes("pwned") ||
        msg.includes("leaked") ||
        msg.includes("easy to guess")
      ) {
        return json(
          {
            ok: false,
            message:
              "Esa contraseña es demasiado común o ha aparecido en filtraciones. Elige otra distinta.",
          },
          400,
        );
      }

      return json(
        {
          ok: false,
          message: "No se pudo crear la cuenta. Inténtalo de nuevo.",
          detail: (createError?.message ?? "no user").slice(0, 200),
        },
        400,
      );
    }

    userId = created.user.id;
    const complete = await completeInvite(admin, token, userId);
    if (!complete.ok) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (cleanupErr) {
        console.error("deleteUser cleanup", cleanupErr);
      }
      return json(
        {
          ok: false,
          message: complete.message,
          detail: complete.detail,
        },
        400,
      );
    }

    return await sessionOrNeedsSignIn(supabaseUrl, anonKey, invite.email, password);
  } catch (err) {
    console.error("accept-teacher-invite unhandled", err);
    const detail = err instanceof Error ? err.message : String(err);
    return json(
      {
        ok: false,
        message: "No se pudo completar la operación. Inténtalo de nuevo.",
        detail: detail.slice(0, 200),
      },
      500,
    );
  }
});

type InviteOk = {
  ok: true;
  email: string;
  first_name: string;
  last_name_1: string;
  last_name_2: string;
  school_id: string;
};

async function loadInvite(
  admin: SupabaseClient,
  token: string,
): Promise<InviteOk | { ok: false; message: string }> {
  const { data: peek, error: peekError } = await admin.rpc("peek_teacher_invite", {
    p_token: token,
  });
  if (peekError) {
    console.error("peek_teacher_invite", peekError.message);
    return {
      ok: false,
      message: `No se pudo comprobar la invitación. (${peekError.message.slice(0, 120)})`,
    };
  }

  const raw =
    typeof peek === "string"
      ? (JSON.parse(peek) as Record<string, unknown>)
      : ((peek ?? {}) as Record<string, unknown>);

  if (raw.ok !== true) {
    return { ok: false, message: mapPeekReason(String(raw.reason ?? "invalid")) };
  }

  return {
    ok: true,
    email: String(raw.email ?? ""),
    first_name: String(raw.first_name ?? ""),
    last_name_1: String(raw.last_name_1 ?? ""),
    last_name_2: String(raw.last_name_2 ?? ""),
    school_id: String(raw.school_id ?? ""),
  };
}

async function completeInvite(
  admin: SupabaseClient,
  token: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string; detail?: string }> {
  const { error: completeError } = await admin.rpc("complete_teacher_invite", {
    p_token: token,
    p_user_id: userId,
  });
  if (!completeError) return { ok: true };

  console.error("complete_teacher_invite", completeError.message);
  const msg = completeError.message.toLowerCase();
  if (msg.includes("expired")) {
    return { ok: false, message: mapPeekReason("expired"), detail: completeError.message };
  }
  if (msg.includes("email mismatch")) {
    return {
      ok: false,
      message: "El email de la cuenta no coincide con la invitación.",
      detail: completeError.message,
    };
  }
  return {
    ok: false,
    message: "No se pudo completar la invitación. Inténtalo de nuevo.",
    detail: completeError.message.slice(0, 200),
  };
}

async function recoverExistingUser(
  supabaseUrl: string,
  anonKey: string,
  admin: SupabaseClient,
  email: string,
  password: string,
  token: string,
): Promise<
  { ok: true; body: Record<string, unknown> } | { ok: false; message?: string; status?: number }
> {
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signed, error: signError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signError || !signed.user) {
    console.error("recover signIn", signError?.message);
    return {
      ok: false,
      message: "Este email ya tiene cuenta. Usa Entrar al Colegio con tu contraseña.",
      status: 409,
    };
  }

  const complete = await completeInvite(admin, token, signed.user.id);
  if (!complete.ok) {
    // Si la invitación ya quedó aceptada por este usuario, dar por bueno.
    const peek = await loadInvite(admin, token);
    if (!peek.ok && peek.message.includes("ya fue usada")) {
      return {
        ok: true,
        body: {
          ok: true,
          access_token: signed.session?.access_token,
          refresh_token: signed.session?.refresh_token,
          needsSignIn: !signed.session,
        },
      };
    }
    return { ok: false, message: complete.message, status: 400 };
  }

  if (signed.session) {
    return {
      ok: true,
      body: {
        ok: true,
        access_token: signed.session.access_token,
        refresh_token: signed.session.refresh_token,
      },
    };
  }
  return {
    ok: true,
    body: {
      ok: true,
      needsSignIn: true,
      message: "Cuenta creada. Entra con tu email y contraseña.",
    },
  };
}

async function sessionOrNeedsSignIn(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
) {
  if (anonKey) {
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signed, error: signError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });
    if (!signError && signed.session) {
      return json({
        ok: true,
        access_token: signed.session.access_token,
        refresh_token: signed.session.refresh_token,
      });
    }
    console.error("signInWithPassword", signError?.message);
  }

  return json({
    ok: true,
    needsSignIn: true,
    message: "Cuenta creada. Entra con tu email y contraseña.",
  });
}

function mapPeekReason(reason: string): string {
  if (reason === "expired") {
    return "Esta invitación ha caducado (válida 72 horas). Pide una nueva al administrador del colegio.";
  }
  if (reason === "accepted") {
    return "Esta invitación ya fue usada. Entra al colegio con tu email y contraseña.";
  }
  if (reason === "cancelled") {
    return "Esta invitación fue cancelada. Contacta con el administrador del colegio.";
  }
  return "El enlace de invitación no es válido.";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
