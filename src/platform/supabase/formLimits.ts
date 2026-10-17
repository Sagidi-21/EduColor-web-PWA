/** Límites y saneado de campos de auth (anti-payload / XSS en UI). */

export const PASSWORD_MIN_LEN = 8;
export const PASSWORD_MAX_LEN = 24;
export const EMAIL_MAX_LEN = 254;
export const SCHOOL_NAME_MAX_LEN = 120;
export const PERSON_NAME_MAX_LEN = 80;

/** Quita controles y <> ; recorta a maxLen. React ya escapa al pintar. */
export function sanitizePlainText(value: string, maxLen: number): string {
  let out = "";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || ch === "<" || ch === ">") continue;
    out += ch;
    if (out.length >= maxLen) break;
  }
  return out;
}

export function sanitizeEmailInput(value: string): string {
  return sanitizePlainText(value, EMAIL_MAX_LEN).replace(/\s/g, "");
}

export function isAuthPasswordValid(value: string): boolean {
  if (value.length < PASSWORD_MIN_LEN || value.length > PASSWORD_MAX_LEN) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export function isAuthEmailValid(value: string): boolean {
  const email = value.trim();
  if (email.length < 5 || email.length > EMAIL_MAX_LEN) return false;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
}
