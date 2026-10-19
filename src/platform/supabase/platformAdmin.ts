import { getSupabase, isSupabaseConfigured } from "./client";

export type SchoolStatus = "pending" | "active" | "disabled";

export interface AdminSchoolRow {
  id: string;
  name: string;
  slug: string | null;
  status: SchoolStatus;
  created_at: string;
  owner_email: string | null;
  background_url?: string | null;
  logo_ficha_url?: string | null;
}

export interface AdminSecurityEvent {
  id: string;
  event_type: string;
  context: string | null;
  created_at: string;
}

export async function fetchIsPlatformAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await getSupabase().rpc("is_platform_admin");
  if (error) return false;
  return data === true;
}

export async function adminListSchools(): Promise<AdminSchoolRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase().rpc("admin_list_schools");
  if (error || !data) return [];
  return data as AdminSchoolRow[];
}

export async function adminSetSchoolStatus(
  schoolId: string,
  status: SchoolStatus,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await getSupabase().rpc("admin_set_school_status", {
    p_school_id: schoolId,
    p_status: status,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function adminDeleteSchool(
  schoolId: string,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await getSupabase().rpc("admin_delete_school", { p_school_id: schoolId });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function adminListSecurityEvents(limit = 50): Promise<AdminSecurityEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase().rpc("admin_list_security_events", {
    p_limit: limit,
  });
  if (error || !data) return [];
  return data as AdminSecurityEvent[];
}

/** Resumen rápido Seguridad OK/KO a partir de eventos recientes. */
export function summarizeSecurity(events: AdminSecurityEvent[]): {
  ok: boolean;
  lockouts: number;
  fails: number;
} {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => new Date(e.created_at).getTime() >= dayAgo);
  const lockouts = recent.filter((e) => e.event_type === "login_lockout").length;
  const fails = recent.filter((e) => e.event_type === "login_fail").length;
  return { ok: lockouts === 0 && fails < 20, lockouts, fails };
}
