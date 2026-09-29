/**
 * El service worker solo se registra en builds de produccion.
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
  it("solo se registra en produccion", () => {
    expect(main).toMatch(/import\.meta\.env\.PROD\s*&&\s*"serviceWorker" in navigator/);
  });

  it("no registra el service worker sin la guarda de produccion", () => {
    // Si alguien quita la guarda, esta asercion falla aunque la anterior
    // deje de encontrar el patron completo.
    const lineasConRegistro = main.split("\n").filter((l) => l.includes("serviceWorker.register"));
    expect(lineasConRegistro).toHaveLength(1);
    const bloque = main.slice(main.indexOf("serviceWorker.register") - 200, main.length);
    expect(bloque).toContain("import.meta.env.PROD");
  });
});
