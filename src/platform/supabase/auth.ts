import { getSupabase, isSupabaseConfigured } from "./client";
import { isAuthPasswordValid, sanitizePlainText, SCHOOL_NAME_MAX_LEN } from "./formLimits";
import type { School } from "./types";

const PENDING_SCHOOL_KEY = "educolor_pending_school";

type PendingSchoolPayload = { name: string; email: string };

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

function readPendingSchoolPayload(): PendingSchoolPayload | null {
  try {
    const raw = localStorage.getItem(PENDING_SCHOOL_KEY)?.trim() || null;
    if (!raw) return null;
    // Legado: solo el nombre (inseguro entre usuarios del mismo navegador) → ignorar.
    if (!raw.startsWith("{")) return null;
    const parsed = JSON.parse(raw) as Partial<PendingSchoolPayload>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    if (name.length < 2 || !email.includes("@")) return null;
    return { name, email };
  } catch {
    return null;
  }
}

/** localStorage ligado al email del alta (sobrevive al enlace del correo). */
export function storePendingSchoolName(name: string, email: string): void {
  try {
    const payload: PendingSchoolPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };
    localStorage.setItem(PENDING_SCHOOL_KEY, JSON.stringify(payload));
  } catch {
    // storage no disponible
  }
}

export function takePendingSchoolName(): string | null {
  try {
    const payload = readPendingSchoolPayload();
    localStorage.removeItem(PENDING_SCHOOL_KEY);
    return payload?.name ?? null;
  } catch {
    return null;
  }
}

/** Solo válido si el email coincide con el usuario de la sesión actual. */
export function peekPendingSchoolNameForEmail(email: string | null | undefined): string | null {
  const payload = readPendingSchoolPayload();
  if (!payload || !email) return null;
  return payload.email === email.trim().toLowerCase() ? payload.name : null;
}

export type AuthResult =
  { ok: true; needsEmailConfirm?: boolean; message?: string } | { ok: false; message: string };

/** Mensajes genéricos (OWASP A07): no revelar si email/nombre existen ni el estado de confirmación. */
const MSG_CREDS_INVALID = "Credenciales inválidas.";
/** D-037: tras 3 fallos (email+IP) o mientras dura el bloqueo. */
export const MSG_LOGIN_LOCKOUT =
  "Demasiadas credenciales inválidas. Espera 15 minutos. Si el email está registrado, recibirás un enlace para definir una contraseña nueva.";
const MSG_PASSWORD_INVALID = "La contraseña no cumple con las restricciones.";
const MSG_RATE_LIMIT = "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
const MSG_FORGOT_NEUTRAL =
  "Si el email está registrado, recibirás un enlace para definir una contraseña nueva.";

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) return MSG_RATE_LIMIT;
  if (lower.includes("password") && !lower.includes("invalid login") && !lower.includes("banned")) {
    return MSG_PASSWORD_INVALID;
  }
  // Incluye: invalid login, banned, email not confirmed, already registered, duplicate…
  return MSG_CREDS_INVALID;
}

export async function logAuthSecurityEvent(
  eventType:
    | "login_fail"
    | "signup_fail"
    | "school_create_fail"
    | "school_create_ok"
    | "password_reset_ok"
    | "password_reset_request",
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

/**
 * Acceso a la app: membresía owner o teacher activo.
 * Alta de colegio pendiente solo si ESTE usuario tiene `pending_school_name` en metadata
 * o un pending en localStorage ligado a SU email (nunca un pending ajeno del mismo PC).
 */
export async function sessionHasAppAccess(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (isAdmin === true) return true;

  const { data: rpcAccess } = await supabase.rpc("session_has_app_access", {
    p_user_id: userId,
  });
  if (rpcAccess === true) return true;

  const { data, error } = await supabase
    .from("school_memberships")
    .select("role, is_active")
    .eq("user_id", userId);

  if (!error && data && data.length > 0) {
    return data.some(
      (row) => row.role === "owner" || row.is_active === true || row.is_active === null,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return false;

  const meta = user.user_metadata ?? {};
  const pendingMeta =
    typeof meta.pending_school_name === "string" ? meta.pending_school_name.trim() : "";
  if (pendingMeta.length >= 2) return true;

  return Boolean(peekPendingSchoolNameForEmail(user.email));
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado en este entorno." };
  }
  const supabase = getSupabase();
  // D-037: login vía Edge (lockout email+IP; ban/membresía en servidor).
  const { data, error } = await supabase.functions.invoke("school-login", {
    body: { email: email.trim().toLowerCase(), password },
  });
  const payload = data as {
    ok?: boolean;
    message?: string;
    locked?: boolean;
    access_token?: string;
    refresh_token?: string;
  } | null;

  if (error && !payload) {
    const message = mapAuthError(error.message);
    void logAuthSecurityEvent("login_fail", message);
    return { ok: false, message };
  }

  if (!payload?.ok) {
    const message =
      payload?.locked || payload?.message === MSG_LOGIN_LOCKOUT
        ? MSG_LOGIN_LOCKOUT
        : (payload?.message ?? MSG_CREDS_INVALID);
    return { ok: false, message };
  }

  if (!payload.access_token || !payload.refresh_token) {
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (sessionError) {
    return { ok: false, message: MSG_CREDS_INVALID };
  }

  return { ok: true };
}

/** D-037: Olvidé la contraseña — correo neutro, sin lockout. */
export async function requestNewPassword(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado en este entorno." };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { ok: true, message: MSG_FORGOT_NEUTRAL };
  }
  const { data, error } = await getSupabase().functions.invoke("request-new-password", {
    body: { email: trimmed },
  });
  const payload = data as { ok?: boolean; message?: string } | null;
  if (error && !payload) {
    return { ok: true, message: MSG_FORGOT_NEUTRAL };
  }
  return { ok: true, message: payload?.message ?? MSG_FORGOT_NEUTRAL };
}

/** Tras definir contraseña nueva (recovery): anula lockouts de ese email (D-037). */
export async function clearLoginGuardAfterPasswordChange(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabase().functions.invoke("clear-login-guard", { body: {} });
  } catch {
    // no bloquear el flujo de contraseña
  }
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

  storePendingSchoolName(schoolName, email);

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
 * Solo metadata de alta (`pending_school_name`) o localStorage del mismo email.
 * Nunca display_name / perfil: un docente no debe convertirse en owner por su nombre.
 */
export async function resolveSchoolNameForBootstrap(): Promise<string | null> {
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

  return peekPendingSchoolNameForEmail(user.email);
}

export async function fetchMySchools(): Promise<School[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Preferir colegios donde soy owner (evita mirar un colegio «fantasma» como primary).
  const { data: memberships, error: memError } = await supabase
    .from("school_memberships")
    .select("school_id, role, created_at")
    .eq("user_id", user.id);
  if (memError || !memberships?.length) {
    const { data, error } = await supabase.from("schools").select("*").order("name");
    if (error || !data) return [];
    return data;
  }

  const ids = [...new Set(memberships.map((row) => row.school_id).filter(Boolean))];
  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("*")
    .in("id", ids);
  if (schoolsError || !schools?.length) return [];

  const roleBySchool = new Map(
    memberships.map((row) => [row.school_id, { role: row.role, created_at: row.created_at }]),
  );
  return [...schools].sort((a, b) => {
    const aOwner = roleBySchool.get(a.id)?.role === "owner" ? 0 : 1;
    const bOwner = roleBySchool.get(b.id)?.role === "owner" ? 0 : 1;
    if (aOwner !== bOwner) return aOwner - bOwner;
    const aCreated = roleBySchool.get(a.id)?.created_at ?? "";
    const bCreated = roleBySchool.get(b.id)?.created_at ?? "";
    if (aCreated !== bCreated) return aCreated.localeCompare(bCreated);
    return a.name.localeCompare(b.name, "es");
  });
}
