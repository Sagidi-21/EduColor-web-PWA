import { getSupabase, isSupabaseConfigured } from "./client";
import { isAuthPasswordValid, sanitizePlainText, SCHOOL_NAME_MAX_LEN } from "./formLimits";
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

/** localStorage: sobrevive al enlace del correo (otra pestaña). */
export function storePendingSchoolName(name: string): void {
  try {
    localStorage.setItem(PENDING_SCHOOL_KEY, name.trim());
  } catch {
    // storage no disponible
  }
}

export function takePendingSchoolName(): string | null {
  try {
    const value = localStorage.getItem(PENDING_SCHOOL_KEY)?.trim() || null;
    if (value) localStorage.removeItem(PENDING_SCHOOL_KEY);
    return value;
  } catch {
    return null;
  }
}

export function peekPendingSchoolName(): string | null {
  try {
    return localStorage.getItem(PENDING_SCHOOL_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export type AuthResult =
  { ok: true; needsEmailConfirm?: boolean; message?: string } | { ok: false; message: string };

/** Mensajes genéricos (OWASP A07): no revelar si email/nombre existen ni el estado de confirmación. */
const MSG_CREDS_INVALID = "Las credenciales no son correctas.";
const MSG_PASSWORD_INVALID = "La contraseña no cumple con las restricciones.";
const MSG_RATE_LIMIT = "Demasiados intentos. Espera un momento e inténtalo de nuevo.";

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) return MSG_RATE_LIMIT;
  if (lower.includes("password") && !lower.includes("invalid login")) {
    return MSG_PASSWORD_INVALID;
  }
  // Incluye: invalid login, email not confirmed, already registered, duplicate…
  return MSG_CREDS_INVALID;
}

async function logAuthSecurityEvent(
  eventType: "login_fail" | "signup_fail" | "school_create_fail" | "school_create_ok",
  context?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabase().rpc("log_auth_security_event", {
      p_event_type: eventType,
      p_context: context ? context.slice(0, 240) : null,
    });
  } catch {
    // La auditoría no debe romper el flujo de auth.
  }
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
  if (error) {
    const message = mapAuthError(error.message);
    void logAuthSecurityEvent("login_fail", message);
    return { ok: false, message };
  }
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
  const schoolName = sanitizePlainText(input.schoolName, SCHOOL_NAME_MAX_LEN).trim();
  const email = input.email.trim().slice(0, 254);
  if (schoolName.length < 2 || !email) {
    return { ok: false, message: MSG_CREDS_INVALID };
  }
  if (!isAuthPasswordValid(input.password)) {
    return { ok: false, message: MSG_PASSWORD_INVALID };
  }

  const supabase = getSupabase();

  // Email o nombre ya usados → fallo visible genérico (no “éxito” falso sin correo).
  const { data: unavailable, error: conflictError } = await supabase.rpc(
    "registration_inputs_unavailable",
    { p_email: email, p_name: schoolName },
  );
  if (!conflictError && unavailable === true) {
    void logAuthSecurityEvent("signup_fail", "inputs_unavailable");
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  storePendingSchoolName(schoolName);

  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        display_name: input.displayName.trim() || schoolName,
        pending_school_name: schoolName,
      },
    },
  });
  if (error) {
    const message = mapAuthError(error.message);
    void logAuthSecurityEvent("signup_fail", message);
    return { ok: false, message };
  }

  // Supabase a veces “tiene éxito” con email duplicado y identities vacío (sin enviar correo).
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    void logAuthSecurityEvent("signup_fail", "duplicate_email_identities");
    takePendingSchoolName();
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  // Sin sesión ⇒ confirmación de email (mismo mensaje genérico de UX post-alta).
  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirm: true,
      message:
        "Para completar el registro, abre el enlace enviado a tu correo. Después inicia sesión para terminar de dar de alta el colegio.",
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
  const name = schoolName.trim();
  if (name.length < 2) {
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  const supabase = getSupabase();
  const { data: school, error: schoolError } = await supabase.rpc("create_school_as_owner", {
    p_name: name,
  });

  if (schoolError) {
    const lower = schoolError.message.toLowerCase();
    if (lower.includes("already belongs")) {
      return { ok: true, message: "Ya perteneces a un colegio." };
    }
    const message = mapAuthError(schoolError.message);
    void logAuthSecurityEvent("school_create_fail", schoolError.message.slice(0, 120));
    return { ok: false, message };
  }
  if (!school) {
    void logAuthSecurityEvent("school_create_fail", "empty_rpc_result");
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  takePendingSchoolName();
  void supabase.auth.updateUser({
    data: { pending_school_name: null },
  });
  void logAuthSecurityEvent("school_create_ok");
  return { ok: true, school, message: "Colegio creado." };
}

/**
 * Nombre para crear el colegio si la sesión aún no tiene escuela.
 * Prioriza pending_school_name (signup) frente a display_name genérico.
 */
export async function resolveSchoolNameForBootstrap(): Promise<string | null> {
  const fromStorage = peekPendingSchoolName();
  if (fromStorage) return fromStorage;

  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const pendingMeta =
    typeof meta.pending_school_name === "string" ? meta.pending_school_name.trim() : "";
  if (pendingMeta.length >= 2) return pendingMeta;

  const displayMeta = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  if (displayMeta.length >= 2) return displayMeta;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const fromProfile = profile?.display_name?.trim() ?? "";
  return fromProfile.length >= 2 ? fromProfile : null;
}

export async function fetchMySchools(): Promise<School[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase.from("schools").select("*").order("name");
  if (error || !data) return [];
  return data;
}
