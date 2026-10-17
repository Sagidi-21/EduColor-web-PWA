import { getSupabase, isSupabaseConfigured } from "./client";
import type { School } from "./types";

const PENDING_SCHOOL_KEY = "educolor_pending_school";

export function slugifySchoolName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "colegio";
}

export function storePendingSchoolName(name: string): void {
  sessionStorage.setItem(PENDING_SCHOOL_KEY, name.trim());
}

export function takePendingSchoolName(): string | null {
  const value = sessionStorage.getItem(PENDING_SCHOOL_KEY)?.trim() || null;
  if (value) sessionStorage.removeItem(PENDING_SCHOOL_KEY);
  return value;
}

export function peekPendingSchoolName(): string | null {
  return sessionStorage.getItem(PENDING_SCHOOL_KEY)?.trim() || null;
}

export type AuthResult =
  { ok: true; needsEmailConfirm?: boolean; message?: string } | { ok: false; message: string };

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (lower.includes("email not confirmed")) {
    return "Confirma tu email antes de entrar (revisa la bandeja de entrada).";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "Ese email ya tiene cuenta. Entra o recupera la contraseña.";
  }
  if (lower.includes("password"))
    return "La contraseña no cumple los requisitos (mín. 6 caracteres).";
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  return message || "No se pudo completar la operación.";
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado en este entorno." };
  }
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}

export async function signUpOwner(input: {
  email: string;
  password: string;
  displayName: string;
  schoolName: string;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado en este entorno." };
  }
  const schoolName = input.schoolName.trim();
  if (schoolName.length < 2) {
    return { ok: false, message: "Escribe el nombre del colegio (mín. 2 caracteres)." };
  }
  if (input.password.length < 8) {
    return { ok: false, message: "La contraseña debe tener al menos 8 caracteres (OWASP)." };
  }
  if (input.password.length > 64) {
    return { ok: false, message: "La contraseña no puede superar 64 caracteres." };
  }

  const supabase = getSupabase();
  storePendingSchoolName(schoolName);

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { display_name: input.displayName.trim() || schoolName },
    },
  });
  if (error) return { ok: false, message: mapAuthError(error.message) };

  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirm: true,
      message:
        "Cuenta creada. Confirma el email y vuelve a entrar para terminar de registrar el colegio.",
    };
  }

  const created = await ensureOwnerSchool(schoolName);
  if (!created.ok) return created;
  return { ok: true, message: "Colegio creado." };
}

export async function signOut(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { ok: true };
  const { error } = await getSupabase().auth.signOut();
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}

/** Crea el colegio + membresía owner si el usuario aún no pertenece a ninguno. */
export async function ensureOwnerSchool(
  schoolName: string,
): Promise<AuthResult & { school?: School }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado en este entorno." };
  }
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: "No hay sesión activa." };
  }

  const { data: existing, error: memError } = await supabase
    .from("school_memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  if (memError) return { ok: false, message: memError.message };
  if (existing && existing.length > 0) {
    return { ok: true, message: "Ya perteneces a un colegio." };
  }

  const name = schoolName.trim();
  const slug = `${slugifySchoolName(name)}-${user.id.slice(0, 8)}`;

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .insert({ name, slug })
    .select("*")
    .single();
  if (schoolError || !school) {
    return { ok: false, message: schoolError?.message ?? "No se pudo crear el colegio." };
  }

  const { error: ownerError } = await supabase.from("school_memberships").insert({
    school_id: school.id,
    user_id: user.id,
    role: "owner",
  });
  if (ownerError) {
    return { ok: false, message: ownerError.message };
  }

  takePendingSchoolName();
  return { ok: true, school, message: "Colegio creado." };
}

export async function fetchMySchools(): Promise<School[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase.from("schools").select("*").order("name");
  if (error || !data) return [];
  return data;
}
