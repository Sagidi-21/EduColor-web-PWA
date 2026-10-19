import { getSupabase, isSupabaseConfigured } from "../../platform/supabase/client";

/** Marca de flujo recovery en curso (evita que SchoolAuth cierre la sesión). */
export const PW_RECOVERY_FLAG = "educolor_pw_recovery";
/** Fingerprint del enlace ya consumido en esta pestaña (anti Strict Mode). */
const PW_RECOVERY_FP = "educolor_pw_recovery_fp";

export const MSG_RECOVERY_USED =
  "Este enlace ya se ha usado o no es válido. Solicita uno nuevo desde «Olvidé la contraseña».";

export const MSG_RECOVERY_EXPIRED =
  "El enlace ha caducado o la sesión de recuperación no está activa. Solicita uno nuevo.";

export function markPasswordRecoveryActive(): void {
  try {
    sessionStorage.setItem(PW_RECOVERY_FLAG, "1");
  } catch {
    // ignore
  }
}

export function clearPasswordRecoveryActive(): void {
  try {
    sessionStorage.removeItem(PW_RECOVERY_FLAG);
    sessionStorage.removeItem(PW_RECOVERY_FP);
  } catch {
    // ignore
  }
}

export function isPasswordRecoveryActive(): boolean {
  try {
    return sessionStorage.getItem(PW_RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

function rememberLocalFingerprint(fp: string): void {
  try {
    sessionStorage.setItem(PW_RECOVERY_FP, fp);
  } catch {
    // ignore
  }
}

function localFingerprint(): string | null {
  try {
    return sessionStorage.getItem(PW_RECOVERY_FP);
  } catch {
    return null;
  }
}

/** Huella estable del access_token (SHA-256 hex). */
export async function fingerprintAccessToken(accessToken: string): Promise<string> {
  const data = new TextEncoder().encode(accessToken);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ConsumeRecoveryResult =
  { ok: true } | { ok: false; reason: "already_used" | "invalid" | "not authenticated" | "error" };

/** Marca el enlace como consumido (un solo uso al abrir). */
export async function consumePasswordRecoveryLink(
  accessToken: string,
): Promise<ConsumeRecoveryResult> {
  if (!isSupabaseConfigured() || !accessToken) {
    return { ok: false, reason: "invalid" };
  }
  try {
    const fingerprint = await fingerprintAccessToken(accessToken);
    // Misma pestaña / Strict Mode: ya lo abrimos con éxito.
    if (localFingerprint() === fingerprint) {
      markPasswordRecoveryActive();
      return { ok: true };
    }

    const { data, error } = await getSupabase().rpc("consume_password_recovery", {
      p_fingerprint: fingerprint,
    });
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      // Migración aún no aplicada: un solo uso local en esta pestaña.
      if (msg.includes("consume_password_recovery") || msg.includes("schema cache")) {
        rememberLocalFingerprint(fingerprint);
        markPasswordRecoveryActive();
        return { ok: true };
      }
      console.error("[passwordRecovery] consume", error.message);
      return { ok: false, reason: "error" };
    }
    const payload = data as { ok?: boolean; reason?: string } | null;
    if (payload?.ok) {
      rememberLocalFingerprint(fingerprint);
      markPasswordRecoveryActive();
      return { ok: true };
    }
    const reason = payload?.reason;
    if (reason === "already_used") {
      // Doble evento con el mismo token ya insertado: permitir si es nuestra pestaña.
      if (localFingerprint() === fingerprint) {
        markPasswordRecoveryActive();
        return { ok: true };
      }
      return { ok: false, reason: "already_used" };
    }
    if (reason === "invalid" || reason === "not authenticated") {
      return { ok: false, reason };
    }
    return { ok: false, reason: "error" };
  } catch (err) {
    console.error("[passwordRecovery] consume", err);
    return { ok: false, reason: "error" };
  }
}
