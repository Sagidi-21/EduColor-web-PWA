/**
 * El service worker solo se registra en builds de produccion usando workbox-window.
 *
 * En desarrollo Vite sirve los modulos en `/src/...` sin hash de contenido, y
 * `sw.js` los cachea con `cacheFirst` bajo esa URL exacta. El resultado es que
 * cualquier cambio posterior en un `.tsx` sigue sirviendo la copia antigua
 * desde la cache: el codigo del repo ya no es el que se ve en la pantalla.
 *
 * Ese fallo costo una sesion entera de diagnostico sobre un emoji que ya se
 * habia borrado del componente, asi que la condicion se vigila aqui.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MAIN_PATH = path.resolve(process.cwd(), "src/main.tsx");
const main = readFileSync(MAIN_PATH, "utf8");

describe("registro del service worker", () => {
  it("usa workbox-window y se registra solo en produccion", () => {
    expect(main).toContain('import { registerSW } from "./platform/serviceWorkerRegistration"');
    expect(main).toContain("registerSW();");
  });

  it("el modulo de registro verifica import.meta.env.PROD", () => {
    const modPath = path.resolve(process.cwd(), "src/platform/serviceWorkerRegistration.ts");
    const mod = readFileSync(modPath, "utf8");
    expect(mod).toContain("import.meta.env.PROD");
    expect(mod).toContain("Workbox");
    expect(mod).not.toContain("navigator.serviceWorker.register");
  });
});
