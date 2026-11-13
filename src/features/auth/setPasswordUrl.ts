/** Lectura / limpieza de `?setPassword=` / `type=recovery` y `?src=` en la URL. */

function hashParams(): URLSearchParams {
  try {
    const raw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(raw);
  } catch {
    return new URLSearchParams();
  }
}

/**
 * True si la URL indica el flujo de contraseña nueva (query custom o redirect Auth).
 * Incluye `type=recovery` en query/hash por si Supabase cae al Site URL sin `setPassword`.
 */
export function readSetPasswordFromUrl(): { active: boolean; source: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const hash = hashParams();
    const source = params.get("src")?.trim() || hash.get("src")?.trim() || "forgot";
    if (params.get("setPassword") === "1") {
      return { active: true, source };
    }
    const type = params.get("type") || hash.get("type");
    if (type === "recovery") {
      return { active: true, source };
    }
  } catch {
    // ignore
  }
  return { active: false, source: "forgot" };
}

export function clearSetPasswordFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("setPassword") && !url.searchParams.has("src")) return;
    url.searchParams.delete("setPassword");
    url.searchParams.delete("src");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next || "/");
  } catch {
    // ignore
  }
}
