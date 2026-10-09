import { Workbox } from "workbox-window";

let wb: Workbox | null = null;

export async function registerSW(): Promise<Workbox | null> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return null;
  }

  wb = new Workbox("/sw.js");

  wb.addEventListener("installed", (event) => {
    if (!event.isUpdate) {
      console.log("[SW] Service worker installed for the first time");
    } else {
      console.log("[SW] Service worker updated");
      if (confirm("Una nueva versión está disponible. ¿Recargar para actualizar?")) {
        window.location.reload();
      }
    }
  });

  wb.addEventListener("waiting", () => {
    console.log("[SW] Service worker waiting");
  });

  wb.addEventListener("controlling", () => {
    console.log("[SW] Service worker controlling");
  });

  try {
    await wb.register();
    console.log("[SW] Registered");
  } catch (err) {
    console.error("[SW] Registration failed:", err);
    wb = null;
  }

  return wb;
}

export function getWorkbox(): Workbox | null {
  return wb;
}
