// El estado de la migración está en un solo sitio: el inventario. Este test lo
// comprueba contra el código, para que esa tabla no se pueda quedar atrás.
//
// Deriva el estado de `getEngineRegistration()` (qué motores se pueden lanzar) y de
// lo que hay en disco, y luego falla si:
//
//   1. El inventario marca como migrada una actividad que el registro da como
//      pendiente, o al revés.
//   2. Una fila repetida, una actividad que no existe, o alguna de las 62 sin fila.
//   3. La tabla de verificación nombra una actividad no migrada, o deja fuera una
//      que sí lo está, o declara un fichero que no está en disco.
//   4. MIGRACION_MAP.md afirma lo contrario del registro, o apunta a un motor que no
//      existe en electron-reference/.
//   5. Otro documento vuelve a copiar la lista de actividades migradas.
//
// No se comprueban las cifras de tests: ageing tan rápido como el resto, y una
// cifra desfasada no rompe nada. Lo que se comprueba es que el fichero exista,
// que es lo que falla cuando alguien migra y no anota.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getEngineRegistration } from "../core/content/engine-registry";
import { activityManifests } from "./content-registry";

/** Sube desde este fichero hasta la raiz del proyecto, buscando package.json. */
function raizProyecto(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = join(dir, "..");
  }
  return process.cwd();
}

const RAIZ = raizProyecto();
const ENGINES_ELECTRON = join(RAIZ, "electron-reference/Colegio/src/renderer/src/core/engines");

/**
 * `electron-reference/` está en `.gitignore`: es una copia local del proyecto
 * Electron y no forma parte del repositorio. Todo lo que necesite mirar dentro
 * tiene que ser opcional, porque si no este test pasa en el portátil del
 * profesor y falla en cualquier otro clon y en CI, por un motivo que no tiene
 * nada que ver con lo que está comprobando.
 */
const HAY_REFERENCIA = existsSync(ENGINES_ELECTRON);

const leido = (rel: string): string => readFileSync(join(RAIZ, rel), "utf8");

/** Estado real, derivado del registro. Es la verdad contra la que se mide. */
const migrados = new Set<string>(
  activityManifests
    .map((m) => m.engineId)
    .filter((engineId) => getEngineRegistration(engineId).status === "available"),
);
const idsCatalogo = activityManifests.map((m) => m.id);

/** Filas de la tabla principal del catálogo: id -> celdas de la fila. */
function filasDeCatalogo(inventario: string): Map<string, string[]> {
  const tabla = inventario.split("## Catálogo")[1]?.split("## Siguiente motor")[0] ?? "";
  const salida = new Map<string, string[]>();
  for (const linea of tabla.split(/\r?\n/)) {
    if (!linea.startsWith("| `")) continue;
    const id = linea.match(/^\| `([A-Za-z0-9]+)`/)?.[1];
    if (!id) continue;
    salida.set(id, [...(salida.get(id) ?? []), linea]);
  }
  return salida;
}

/**
 * Filas de la tabla de verificación: id -> rutas declaradas de núcleo y renderer.
 * Las rutas se leen de la tabla en vez de escribirse aquí a propósito: si el test
 * tuviera su propia lista de ficheros, sería una segunda copia que envejecería
 * igual que las que vigila.
 */
function filasDeVerificacion(
  inventario: string,
): Map<string, { nucleo: string; renderer: string }> {
  const seccion = inventario.split("## Verificación de la PWA")[1] ?? "";
  const salida = new Map<string, { nucleo: string; renderer: string }>();
  for (const linea of seccion.split(/\r?\n/)) {
    if (!linea.startsWith("| `")) continue;
    const celdas = [...linea.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const id = celdas[0];
    const nucleo = celdas[1];
    const renderer = celdas[2];
    if (!id || !nucleo || !renderer) continue;
    salida.set(id, { nucleo, renderer });
  }
  return salida;
}

/** Fila de una de las dos tablas de actividades del mapa. */
interface FilaMapa {
  engineId: string;
  /** Ruta del motor en Electron, como `operations/SumaRenderer`. Vacía si no la hay. */
  motorElectron: string;
  migrada: boolean;
}

/**
 * Filas de las tablas de actividades de MIGRACION_MAP.md, con su estado.
 *
 * El orden de las celdas es el que hace que esto sea correcto y no un `find()`
 * sobre cualquier cosa con barra: la primera celda es el `engineId` y la segunda
 * es el motor de Electron. Las siguientes son el núcleo y el renderer **de la
 * PWA**, cuyas carpetas (`ordering/`, `series/`, `algoritmoColumna/`…) no existen
 * en `engines/` y no deben compararse contra ahí.
 */
function filasDeMapa(mapa: string): FilaMapa[] {
  const filas: FilaMapa[] = [];
  for (const linea of mapa.split(/\r?\n/)) {
    if (!linea.startsWith("| `")) continue;
    const diceMigrada = linea.includes("✅");
    const dicePendiente = linea.includes("⏳");
    if (diceMigrada === dicePendiente) continue; // fila de infraestructura
    const celdas = [...linea.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const engineId = celdas[0];
    if (!engineId) continue;
    filas.push({
      engineId,
      motorElectron: celdas[1]?.includes("/") ? celdas[1] : "",
      migrada: diceMigrada,
    });
  }
  return filas;
}

describe("El estado de la migración está en un solo sitio", () => {
  it("el registro y los manifiestos dan 40 de 62", () => {
    // Cifra que repiten la cabecera del inventario y ESTADO_DEL_PROYECTO. Si
    // cambia, hay que actualizar esos dos sitios y este test avisa de que lo hagas.
    expect(activityManifests).toHaveLength(62);
    expect(migrados.size).toBe(40);
  });

  it("el inventario marca migrada exactamente lo que el registro da como lanzable", () => {
    const filas = filasDeCatalogo(leido("docs/INVENTARIO_MIGRACION_ACTIVIDADES.md"));

    const repetidas = idsCatalogo.filter((id) => (filas.get(id)?.length ?? 0) > 1);
    expect(repetidas, `Filas repetidas en el inventario: ${repetidas.join(", ")}`).toEqual([]);

    const huerfanas = [...filas.keys()].filter((id) => !idsCatalogo.includes(id));
    expect(huerfanas, `Filas que no son actividades del catálogo: ${huerfanas.join(", ")}`).toEqual(
      [],
    );

    const sinFila = idsCatalogo.filter((id) => !filas.has(id));
    expect(sinFila, `Actividades sin fila en el inventario: ${sinFila.join(", ")}`).toEqual([]);

    const marcadas = [...filas.entries()]
      .filter(([, celdas]) => celdas.some((c) => c.includes("✅")))
      .map(([id]) => id);
    const sobran = marcadas.filter((id) => !migrados.has(id)).sort();
    const faltan = [...migrados].filter((id) => !marcadas.includes(id)).sort();

    expect(
      sobran,
      `El inventario las da por migradas y el registro no las tiene como lanzables: ${sobran.join(", ")}`,
    ).toEqual([]);
    expect(
      faltan,
      `El registro las tiene como lanzables y el inventario no las marca: ${faltan.join(", ")}`,
    ).toEqual([]);
  });

  it("la tabla de verificación cubre las 34 migradas y sus ficheros existen", () => {
    const verificacion = filasDeVerificacion(leido("docs/INVENTARIO_MIGRACION_ACTIVIDADES.md"));

    const fuera = [...verificacion.keys()].filter((id) => !migrados.has(id)).sort();
    const ausente = [...migrados].filter((id) => !verificacion.has(id)).sort();
    expect(fuera, `La tabla lista actividades no migradas: ${fuera.join(", ")}`).toEqual([]);
    expect(ausente, `La tabla de verificación no lista: ${ausente.join(", ")}`).toEqual([]);

    const rutas: string[] = [];
    for (const [id, { nucleo, renderer }] of verificacion) {
      const nucleoPath = `src/core/activities/${nucleo}`;
      const rendererPath = `src/features/matematicas/${renderer}`;
      if (!existsSync(join(RAIZ, nucleoPath))) rutas.push(`${id}: falta ${nucleoPath}`);
      if (!existsSync(join(RAIZ, rendererPath))) rutas.push(`${id}: falta ${rendererPath}`);

      // El smoke del renderer es obligatorio por Definition of Done. Se busca en
      // el mismo directorio y no con el nombre exacto porque `suma` y `resta` no
      // tienen smoke propio: comparten `OperationsScreen.test.tsx`.
      const dir = join(
        RAIZ,
        "src/features/matematicas",
        renderer.slice(0, renderer.lastIndexOf("/")),
      );
      const smokes = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".test.tsx")) : [];
      if (smokes.length === 0)
        rutas.push(`${id}: no hay ningún smoke en el directorio de ${renderer}`);
    }
    expect(
      rutas,
      `La tabla de verificación declara ficheros que no están:\n  ${rutas.join("\n  ")}`,
    ).toEqual([]);
  });

  it("toda actividad migrada tiene además un test de núcleo en disco", () => {
    // El core no siempre se llama como la actividad: `ordenar` vive en
    // `ordering.ts`, `suma` y `resta` comparten `operations.ts`. Por eso se
    // comprueba que cada fichero de núcleo tenga su test, en vez de buscar
    // `<id>.test.ts`.
    const nucleos =
      leido("docs/INVENTARIO_MIGRACION_ACTIVIDADES.md")
        .split("## Verificación de la PWA")[1]
        ?.split(/\r?\n/)
        .map((l) => l.match(/^\| `[A-Za-z0-9]+` \| `([A-Za-z0-9]+\.ts)`/)?.[1])
        .filter((n): n is string => Boolean(n)) ?? [];

    expect(nucleos.length, "No se han podido leer los núcleos de la tabla").toBeGreaterThan(0);

    const sinTest = [...new Set(nucleos)].filter(
      (n) => !existsSync(join(RAIZ, `src/core/activities/${n.replace(/\.ts$/, ".test.ts")}`)),
    );
    expect(sinTest, `Núcleos sin fichero de test: ${sinTest.join(", ")}`).toEqual([]);
  });

  it("MIGRACION_MAP.md cubre las 62 y no se contradice con el registro", () => {
    const filas = filasDeMapa(leido("docs/MIGRACION_MAP.md"));

    const ausentes = idsCatalogo.filter((id) => !filas.some((f) => f.engineId === id));
    expect(ausentes, `El mapa no mapea: ${ausentes.join(", ")}`).toEqual([]);

    const errores = filas.flatMap((f) => {
      const real = migrados.has(f.engineId);
      if (f.migrada && !real)
        return [`${f.engineId}: el mapa dice migrada, el registro no la tiene disponible`];
      if (!f.migrada && real)
        return [`${f.engineId}: el mapa dice pendiente, el registro sí la tiene disponible`];
      return [];
    });
    expect(errores, `MIGRACION_MAP.md contradice al registro:\n  ${errores.join("\n  ")}`).toEqual(
      [],
    );
  });

  it.skipIf(!HAY_REFERENCIA)(
    "MIGRACION_MAP.md no apunta a motores que no existen en electron-reference/",
    () => {
      // Solo tiene sentido con la copia local del proyecto Electron delante. Sin
      // ella no se puede afirmar nada sobre el lado de Electron, y el test se salta
      // en vez de dar por inexistente todo lo que no encuentra en disco.
      // La excepción que hubo para `laberintoMatematico2` ya no hace falta: su
      // celda de motor dice "comparte renderer con `laberintoMatematico`", que no
      // lleva barra, así que `motorElectron` queda vacía y esta comprobación no lo
      // mira. Una fila que sí nombre una carpeta debe nombrarla de verdad.
      const inventadas = filasDeMapa(leido("docs/MIGRACION_MAP.md"))
        .filter((f) => f.motorElectron !== "")
        .filter((f) => !existsSync(join(ENGINES_ELECTRON, f.motorElectron.split("/")[0])))
        .map((f) => f.motorElectron.split("/")[0]);
      expect(
        [...new Set(inventadas)],
        `MIGRACION_MAP.md apunta a motores inexistentes: ${[...new Set(inventadas)].join(", ")}`,
      ).toEqual([]);
    },
  );

  it("los documentos sin estado enlazan al inventario en vez de listar actividades", () => {
    // No se comprueba cuántas actividades nombra cada uno: hablar de un motor
    // concreto al explicar un bug es legítimo. Lo que no puede volver a pasar es
    // que un documento tenga su propia lista de "migradas", y la forma de
    // evitarlo es que enlace a quien la tiene.
    const conLista = [
      "docs/ESTADO_DEL_PROYECTO.md",
      "docs/ROADMAP_DE_EJECUCION_DETALLADO.md",
      "docs/EJECUCION_PASO_A_PASO.md",
      "docs/ROADMAP_MAESTRO.md",
    ];
    const sinEnlace = conLista.filter(
      (doc) => !leido(doc).includes("INVENTARIO_MIGRACION_ACTIVIDADES.md"),
    );
    expect(
      sinEnlace,
      `Documentos que deberían enlazar al inventario y no lo hacen: ${sinEnlace.join(", ")}`,
    ).toEqual([]);
  });
});
