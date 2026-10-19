/** Azul marino fijo del owner (migración + UI). */
export const OWNER_AVATAR_COLOR = "#001F3F";
export const OWNER_AVATAR_INITIALS = "OW";

/** Docente desactivado (solo listado Profesorado; no llega al header). */
export const INACTIVE_AVATAR_COLOR = "#E2E8F0";
export const INACTIVE_AVATAR_TEXT = "#0F172A";

/** Color visible de la bola: gris fijo si está desactivado. */
export function resolveAvatarColors(
  storedHex: string | null | undefined,
  isActive = true,
): { bg: string; fg: string } {
  if (!isActive) {
    return { bg: INACTIVE_AVATAR_COLOR, fg: INACTIVE_AVATAR_TEXT };
  }
  const bg = normalizeHexColor(storedHex) ?? OWNER_AVATAR_COLOR;
  return { bg, fg: avatarTextColor(bg) };
}

export function normalizeHexColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim().toUpperCase();
  if (!v) return null;
  if (!v.startsWith("#")) v = `#${v}`;
  if (!/^#[0-9A-F]{6}$/.test(v)) return null;
  return v;
}

/** Iniciales del docente (nombre + primer apellido). */
export function teacherInitials(
  firstName?: string | null,
  lastName1?: string | null,
  email?: string | null,
): string {
  const a = (firstName ?? "").trim().charAt(0);
  const b = (lastName1 ?? "").trim().charAt(0);
  const fromName = `${a}${b}`.toUpperCase();
  if (fromName) return fromName;
  const local = (email ?? "").split("@")[0]?.trim() ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return "?";
}

/** Texto blanco sobre fondos oscuros; negro sobre claros. */
export function avatarTextColor(bgHex: string): "#FFFFFF" | "#0F172A" {
  const hex = normalizeHexColor(bgHex) ?? OWNER_AVATAR_COLOR;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  // Luminancia relativa aproximada.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0F172A" : "#FFFFFF";
}
