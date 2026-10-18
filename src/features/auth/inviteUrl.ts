/** Lectura / limpieza del token `?invite=` en la URL. */

export const INVITE_SUCCESS_FLASH_KEY = "educolor_invite_registered";

export function readInviteTokenFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite")?.trim() || null;
    return token && token.length >= 16 ? token : null;
  } catch {
    return null;
  }
}

export function clearInviteFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("invite")) return;
    url.searchParams.delete("invite");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next || "/");
  } catch {
    // ignore
  }
}

export function setInviteSuccessFlash(): void {
  try {
    sessionStorage.setItem(INVITE_SUCCESS_FLASH_KEY, "1");
  } catch {
    // ignore
  }
}

export function takeInviteSuccessFlash(): boolean {
  try {
    const ok = sessionStorage.getItem(INVITE_SUCCESS_FLASH_KEY) === "1";
    if (ok) sessionStorage.removeItem(INVITE_SUCCESS_FLASH_KEY);
    return ok;
  } catch {
    return false;
  }
}
