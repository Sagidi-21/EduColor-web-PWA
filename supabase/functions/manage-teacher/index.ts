import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-authorization",
};

type Action = "activate" | "deactivate" | "remove";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: { membershipId?: string; action?: string };
    try {
      body = (await req.json()) as { membershipId?: string; action?: string };
    } catch {
      return json({ ok: false, message: "Petición inválida." }, 400);
    }

    const membershipId = (body.membershipId ?? "").trim();
    const action = (body.action ?? "").trim() as Action;
    if (!membershipId || !["activate", "deactivate", "remove"].includes(action)) {
      return json({ ok: false, message: "Revisa los datos." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      "";
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ ok: false, message: "Servidor no configurado." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ ok: false, message: "No autenticado." }, 401);
    }

    // Cliente del owner (JWT): lectura RLS + RPCs que comprueban is_school_owner.
    // No usar service_role sobre school_memberships: en este proyecto no tiene GRANT de tabla.
    const asOwner = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await asOwner.auth.getUser();
    if (userError || !user) {
      return json({ ok: false, message: "No autenticado." }, 401);
    }

    const { data: membership, error: memError } = await asOwner
      .from("school_memberships")
      .select("id, school_id, user_id, role")
      .eq("id", membershipId)
      .maybeSingle();

    if (memError || !membership) {
      return json(
        {
          ok: false,
          message: "No se encontró al docente en el colegio.",
          detail: memError?.message
            ? memError.message.slice(0, 160)
            : `membership_id recibido: ${membershipId}`,
        },
        404,
      );
    }
    if (membership.role !== "teacher") {
      return json({ ok: false, message: "Solo se pueden gestionar docentes." }, 400);
    }

    const teacherUserId = membership.user_id as string;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "activate" || action === "deactivate") {
      const active = action === "activate";
      const { error: rpcError } = await asOwner.rpc("owner_set_teacher_active", {
        p_membership_id: membershipId,
        p_active: active,
      });
      if (rpcError) {
        console.error("owner_set_teacher_active", rpcError.message);
        return json(
          {
            ok: false,
            message: active ? "No se pudo activar al docente." : "No se pudo desactivar al docente.",
            detail: rpcError.message.slice(0, 160),
          },
          400,
        );
      }

      if (active) {
        const { error: unbanError } = await admin.auth.admin.updateUserById(teacherUserId, {
          ban_duration: "none",
        });
        if (unbanError) {
          console.error("unban", unbanError.message);
          return json(
            {
              ok: false,
              message:
                "Se marcó activo en el colegio, pero no se pudo desbloquear el login. Inténtalo de nuevo.",
              detail: unbanError.message.slice(0, 160),
            },
            400,
          );
        }
      } else {
        const { error: banError } = await admin.auth.admin.updateUserById(teacherUserId, {
          ban_duration: "87600h",
        });
        if (banError) {
          console.error("ban", banError.message);
          return json(
            {
              ok: false,
              message:
                "Se desactivó en el colegio, pero no se pudo cerrar el acceso Auth. Inténtalo de nuevo.",
              detail: banError.message.slice(0, 160),
            },
            400,
          );
        }
      }

      return json({ ok: true });
    }

    // remove: ban primero (igual que desactivar → corte de sesión al instante),
    // luego membresía y borrado Auth.
    const { error: banBeforeRemoveError } = await admin.auth.admin.updateUserById(
      teacherUserId,
      { ban_duration: "87600h" },
    );
    if (banBeforeRemoveError) {
      console.error("ban before remove", banBeforeRemoveError.message);
      return json(
        {
          ok: false,
          message: "No se pudo cerrar la sesión del docente. Inténtalo de nuevo.",
          detail: banBeforeRemoveError.message.slice(0, 160),
        },
        400,
      );
    }

    const { error: removeRpcError } = await asOwner.rpc("owner_remove_teacher", {
      p_membership_id: membershipId,
    });
    if (removeRpcError) {
      console.error("owner_remove_teacher", removeRpcError.message);
      return json(
        {
          ok: false,
          message: "Se cerró el acceso, pero no se pudo quitar del colegio.",
          detail: removeRpcError.message.slice(0, 160),
        },
        400,
      );
    }

    const { error: delUserError } = await admin.auth.admin.deleteUser(teacherUserId);
    if (delUserError) {
      console.error("deleteUser", delUserError.message);
      return json(
        {
          ok: false,
          message:
            "Se quitó del colegio, pero no se pudo borrar la cuenta Auth. Revísalo en el panel.",
          detail: delUserError.message.slice(0, 160),
        },
        400,
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error("manage-teacher unhandled", err);
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
