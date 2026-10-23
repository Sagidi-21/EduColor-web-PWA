/** Lectura / limpieza de `?setPassword=` y `?src=` en la URL. */

export function readSetPasswordFromUrl(): { active: boolean; source: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setPassword") === "1") {
      return { active: true, source: params.get("src")?.trim() || "forgot" };
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
