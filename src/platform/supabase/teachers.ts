import { getSupabase, isSupabaseConfigured } from "./client";
import {
  EMAIL_MAX_LEN,
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

export async function listSchoolStaff(schoolId: string): Promise<StaffLists> {
  if (!isSupabaseConfigured()) return { pending: [], accepted: [] };
  const { data, error } = await getSupabase().rpc("owner_list_staff", {
    p_school_id: schoolId,
  });
  if (error || !data) return { pending: [], accepted: [] };
  const raw = data as { pending?: PendingInviteRow[]; accepted?: AcceptedTeacherRow[] };
  return {
    pending: Array.isArray(raw.pending) ? raw.pending : [],
    accepted: Array.isArray(raw.accepted) ? raw.accepted : [],
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
    return { ok: false, message: mapInviteError(error?.message ?? "") };
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

export async function setTeacherActive(
  membershipId: string,
  active: boolean,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase no está configurado." };
  const { error } = await getSupabase().rpc("owner_set_teacher_active", {
    p_membership_id: membershipId,
    p_active: active,
  });
  if (error) return { ok: false, message: mapInviteError(error.message) };
  return { ok: true };
}

export async function removeTeacher(
  membershipId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase no está configurado." };
  const { error } = await getSupabase().rpc("owner_remove_teacher", {
    p_membership_id: membershipId,
  });
  if (error) return { ok: false, message: mapInviteError(error.message) };
  return { ok: true };
}
