import { getSupabase, isSupabaseConfigured } from "./client";
import {
  EMAIL_MAX_LEN,
  isAuthPasswordValid,
  PERSON_NAME_MAX_LEN,
  sanitizeEmailInput,
  sanitizePlainText,
} from "./formLimits";

export interface PendingInviteRow {
  id: string;
  email: string;
  first_name: string;
  last_name_1: string;
  last_name_2: string;
  sent_at: string;
  expires_at: string;
  status: string;
}

export interface AcceptedTeacherRow {
  membership_id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name_1: string | null;
  last_name_2: string | null;
  is_active: boolean;
  accepted_at: string | null;
  sent_at: string | null;
}

export interface StaffLists {
  pending: PendingInviteRow[];
  accepted: AcceptedTeacherRow[];
}

/** Chips de Profesorado: misma regla que la UI (aceptadas = total memberships teacher). */
export function staffChipCounts(lists: {
  pending: PendingInviteRow[];
  accepted: AcceptedTeacherRow[];
}): { pending: number; accepted: number; active: number; inactive: number } {
  const accepted = lists.accepted.length;
  const active = lists.accepted.filter((row) => row.is_active).length;
  return {
    pending: lists.pending.length,
    accepted,
    active,
    inactive: accepted - active,
  };
}

export type CreateInviteResult =
  { ok: true; inviteUrl: string; expiresAt: string } | { ok: false; message: string };

function mapInviteError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invite rate limit")) {
    const marker = "invite rate limit:";
    const idx = message.toLowerCase().indexOf(marker);
    const time = idx >= 0 ? message.slice(idx + marker.length).trim() || "más tarde" : "más tarde";
    return `Has sobrepasado el límite de invitaciones por hora. Puedes volver a invitar a las ${time}.`;
  }
  if (lower.includes("cannot invite self")) {
    return "No puedes invitarte a ti mismo.";
  }
  if (lower.includes("email unavailable")) {
    return "Las credenciales no son correctas.";
  }
  if (lower.includes("not owner")) {
    return "Solo el administrador del colegio puede gestionar profesores.";
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export async function fetchMyRole(schoolId: string): Promise<"owner" | "teacher" | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase().rpc("get_my_school_role", {
    p_school_id: schoolId,
  });
  if (error || typeof data !== "string") return null;
  if (data === "owner" || data === "teacher") return data;
  return null;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export type StaffListsResult =
  | { ok: true; pending: PendingInviteRow[]; accepted: AcceptedTeacherRow[] }
  | { ok: false; message: string; pending: []; accepted: [] };

export async function listSchoolStaff(schoolId: string): Promise<StaffListsResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado.", pending: [], accepted: [] };
  }
  const { data, error } = await getSupabase().rpc("owner_list_staff", {
    p_school_id: schoolId,
  });
  if (error || !data) {
    console.error("[teachers] owner_list_staff", error);
    return {
      ok: false,
      message: error?.message
        ? `No se pudo cargar el profesorado: ${error.message}`
        : "No se pudo cargar el profesorado.",
      pending: [],
      accepted: [],
    };
  }
  const raw =
    typeof data === "string"
      ? (JSON.parse(data) as { pending?: unknown; accepted?: unknown })
      : (data as { pending?: unknown; accepted?: unknown });
  const accepted = asArray<Record<string, unknown>>(raw.accepted).map((row) => {
    const membershipId = String(row.membership_id ?? row.id ?? "").trim();
    const activeRaw = row.is_active;
    return {
      membership_id: membershipId,
      user_id: String(row.user_id ?? ""),
      email: (row.email as string | null) ?? null,
      first_name: (row.first_name as string | null) ?? null,
      last_name_1: (row.last_name_1 as string | null) ?? null,
      last_name_2: (row.last_name_2 as string | null) ?? null,
      // null/undefined → activo (filas antiguas); solo false es desactivado.
      is_active: activeRaw === false || activeRaw === "false" ? false : true,
      accepted_at: (row.accepted_at as string | null) ?? null,
      sent_at: (row.sent_at as string | null) ?? null,
    } satisfies AcceptedTeacherRow;
  });
  return {
    ok: true,
    pending: asArray<PendingInviteRow>(raw.pending),
    accepted,
  };
}

export async function createTeacherInvite(input: {
  schoolId: string;
  email: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
}): Promise<CreateInviteResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }
  const email = sanitizeEmailInput(input.email).toLowerCase();
  const firstName = sanitizePlainText(input.firstName, PERSON_NAME_MAX_LEN).trim();
  const lastName1 = sanitizePlainText(input.lastName1, PERSON_NAME_MAX_LEN).trim();
  const lastName2 = sanitizePlainText(input.lastName2, PERSON_NAME_MAX_LEN).trim();
  if (
    email.length > EMAIL_MAX_LEN ||
    firstName.length < 1 ||
    lastName1.length < 1 ||
    !email.includes("@")
  ) {
    return { ok: false, message: "Revisa los datos del formulario." };
  }

  const { data, error } = await getSupabase().rpc("owner_create_teacher_invite", {
    p_school_id: input.schoolId,
    p_email: email,
    p_first_name: firstName,
    p_last_name_1: lastName1,
    p_last_name_2: lastName2,
  });

  if (error || !data) {
    console.error("[teachers] owner_create_teacher_invite", error);
    return { ok: false, message: mapInviteError(error?.message ?? error?.code ?? "") };
  }

  const payload = data as { token?: string; expires_at?: string };
  if (!payload.token) {
    return { ok: false, message: "No se pudo generar la invitación." };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/?invite=${encodeURIComponent(payload.token)}`;
  return {
    ok: true,
    inviteUrl,
    expiresAt: payload.expires_at ?? "",
  };
}

export async function cancelTeacherInvite(
  inviteId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase no está configurado." };
  const { error } = await getSupabase().rpc("owner_cancel_invite", { p_invite_id: inviteId });
  if (error) return { ok: false, message: mapInviteError(error.message) };
  return { ok: true };
}

async function invokeManageTeacher(
  membershipId: string,
  action: "activate" | "deactivate" | "remove",
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase no está configurado." };

  const id = (membershipId ?? "").trim();
  if (!id) {
    return {
      ok: false,
      message:
        "Falta el identificador del docente (membership_id vacío). Recarga Profesorado e inténtalo de nuevo.",
    };
  }

  const { data, error } = await getSupabase().functions.invoke("manage-teacher", {
    body: { membershipId: id, action },
  });

  const payloadFromError = await readFunctionsErrorPayload(error);
  const payload = (data ?? payloadFromError) as {
    ok?: boolean;
    message?: string;
    detail?: string;
  } | null;

  if (error && !payload) {
    if (/failed to send|not found|FunctionsRelayError|404/i.test(error.message)) {
      return {
        ok: false,
        message: `No se pudo contactar con manage-teacher (${error.message}).`,
      };
    }
    return { ok: false, message: mapInviteError(error.message) };
  }

  if (!payload?.ok) {
    const base = payload?.message ?? "No se pudo completar la operación.";
    const detail = typeof payload?.detail === "string" ? payload.detail.trim() : "";
    const withId = `${base} [acción=${action}; id=${id.slice(0, 8)}…]`;
    return {
      ok: false,
      message: detail && !withId.includes(detail) ? `${withId} (${detail})` : withId,
    };
  }
  return { ok: true };
}

export async function setTeacherActive(
  membershipId: string,
  active: boolean,
): Promise<{ ok: boolean; message?: string }> {
  return invokeManageTeacher(membershipId, active ? "activate" : "deactivate");
}

export async function removeTeacher(
  membershipId: string,
): Promise<{ ok: boolean; message?: string }> {
  return invokeManageTeacher(membershipId, "remove");
}

export type InvitePreview =
  | {
      ok: true;
      inviteId: string;
      schoolId: string;
      schoolName: string;
      email: string;
      firstName: string;
      lastName1: string;
      lastName2: string;
      expiresAt: string;
    }
  | { ok: false; message: string };

export async function peekTeacherInvite(token: string): Promise<InvitePreview> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }
  const trimmed = token.trim();
  if (trimmed.length < 16) {
    return { ok: false, message: "El enlace de invitación no es válido." };
  }
  const { data, error } = await getSupabase().rpc("peek_teacher_invite", {
    p_token: trimmed,
  });
  if (error || !data) {
    return { ok: false, message: "No se pudo comprobar la invitación." };
  }
  const raw = data as {
    ok?: boolean;
    reason?: string;
    invite_id?: string;
    school_id?: string;
    school_name?: string;
    email?: string;
    first_name?: string;
    last_name_1?: string;
    last_name_2?: string;
    expires_at?: string;
  };
  if (!raw.ok) {
    return { ok: false, message: mapPeekReason(raw.reason ?? "invalid") };
  }
  return {
    ok: true,
    inviteId: raw.invite_id ?? "",
    schoolId: raw.school_id ?? "",
    schoolName: raw.school_name ?? "Colegio",
    email: raw.email ?? "",
    firstName: raw.first_name ?? "",
    lastName1: raw.last_name_1 ?? "",
    lastName2: raw.last_name_2 ?? "",
    expiresAt: raw.expires_at ?? "",
  };
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

export type AcceptInviteResult =
  { ok: true; needsSignIn?: boolean; message?: string } | { ok: false; message: string };

async function readFunctionsErrorPayload(error: unknown): Promise<Record<string, unknown> | null> {
  if (!error || typeof error !== "object") return null;
  const ctx = (error as { context?: Response }).context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    const body = await ctx.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Crea la cuenta del docente (email ya verificado vía invite) y abre sesión. */
export async function acceptTeacherInvite(
  token: string,
  password: string,
): Promise<AcceptInviteResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }
  if (!isAuthPasswordValid(password)) {
    return { ok: false, message: "La contraseña no cumple con las restricciones." };
  }

  const { data, error } = await getSupabase().functions.invoke("accept-teacher-invite", {
    body: { token: token.trim(), password },
  });

  const payloadFromError = await readFunctionsErrorPayload(error);
  const payload = (data ?? payloadFromError) as {
    ok?: boolean;
    message?: string;
    detail?: string;
    needsSignIn?: boolean;
    access_token?: string;
    refresh_token?: string;
  } | null;

  if (error && !payload) {
    if (/failed to send|not found|FunctionsRelayError|404/i.test(error.message)) {
      return {
        ok: false,
        message:
          "El alta de docentes aún no está desplegada en el servidor. Despliega la función accept-teacher-invite.",
      };
    }
    return { ok: false, message: "No se pudo completar el registro. Inténtalo de nuevo." };
  }

  if (!payload?.ok) {
    const base = payload?.message ?? "No se pudo completar el registro.";
    const detail = typeof payload?.detail === "string" ? payload.detail.trim() : "";
    return {
      ok: false,
      message: detail && !base.includes(detail) ? `${base} (${detail})` : base,
    };
  }

  // No abrir sesión aquí: la UI muestra el popup y el docente entra desde
  // «Entrar al Colegio» con email + contraseña.
  return {
    ok: true,
    needsSignIn: true,
    message: payload.message ?? "Cuenta creada. Entra con tu email y contraseña.",
  };
}
