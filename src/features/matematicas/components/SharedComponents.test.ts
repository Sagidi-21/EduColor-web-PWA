// Vigila que el mobiliario compartido no se duplique.
//
// NO falla si encuentra una excepción: avisa y sigue. La idea es que el agente te
// lo diga y tú decidas. Si un ejercicio necesita de verdad otra versión, se
// documenta en COMPONENTES_COMPARTIDOS.md y se añade a ESTAS listas de excepciones.
// Lo único que hace caer el test es que falte una pieza compartida, que sí es un
// fallo real de compilación.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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

// Piezas que deben existir para que el resto del documento sea cierto.
const COMPARTIDOS = {
  ActionButtons: "src/features/matematicas/components/ActivityActionButtons.tsx",
  DigitBoxes: "src/features/matematicas/components/DigitBoxes.tsx",
  useDigitBoxes: "src/features/matematicas/components/useDigitBoxes.ts",
  Numpad: "src/features/shared/components/Numpad.tsx",
  InputModeToggle: "src/features/shared/components/InputModeToggle.tsx",
  ActivityHeader: "src/features/matematicas/components/ActivityHeader.tsx",
  SummaryScreen: "src/features/matematicas/components/SummaryScreen.tsx",
  DifficultyReveal: "src/features/matematicas/components/DifficultyReveal.tsx",
  ActivityErrorBoundary: "src/features/matematicas/components/ActivityErrorBoundary.tsx",
  NoExerciseNotice: "src/features/matematicas/components/NoExerciseNotice.tsx",
};

/** Excepciones conocidas y documentadas. Añadir solo con la decisión escrita. */
const EXCEPCIONES: Record<string, string[]> = {
  numpadLocal: [],
  botonesPropios: [],
  pantallaNivel: [],
  returnNull: [],
};

function* fuentes(dir: string): Generator<string> {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules") continue;
      yield* fuentes(ruta);
    } else if (entrada.name.endsWith(".tsx") && !entrada.name.includes(".test.")) {
      yield ruta;
    }
  }
}

const relativa = (ruta: string) => ruta.slice(RAIZ.length + 1).replace(/\\/g, "/");

describe("Mobiliario compartido sin duplicar", () => {
  it("las piezas compartidas existen", () => {
    const faltan = Object.entries(COMPARTIDOS)
      .filter(([, ruta]) => !existsSync(join(RAIZ, ruta)))
      .map(([nombre]) => nombre);
    expect(faltan, `Piezas compartidas desaparecidas: ${faltan.join(", ")}`).toEqual([]);
  });

  it("avisa de las duplicaciones", () => {
    const numpadLocal: string[] = [];
    const botonesPropios: string[] = [];
    const pantallaNivel: string[] = [];
    const returnNull: string[] = [];

    for (const abs of fuentes(join(RAIZ, "src"))) {
      const rel = relativa(abs);
      const txt = readFileSync(abs, "utf8");

      // Un Numpad definido fuera del compartido.
      if (!rel.endsWith(COMPARTIDOS.Numpad) && /export (?:function|const) Numpad/.test(txt)) {
        numpadLocal.push(rel);
      }
      // Botones de reintentar/siguiente definidos a mano.
      if (!rel.endsWith(COMPARTIDOS.ActionButtons)) {
        const define = /className="[^"]*activity-action--retry/.test(txt);
        if (define) botonesPropios.push(rel);
      }
      // Una segunda pantalla de nivel o dificultad.
      if (
        !rel.endsWith(COMPARTIDOS.DifficultyReveal) &&
        /className="[^"]*diff-reveal__/.test(txt)
      ) {
        pantallaNivel.push(rel);
      }
      // Pantalla en blanco silenciosa: una guarda `if (!<ejercicio>) return null`
      // dentro de un renderer deja la pantalla vacía sin decir nada. Es el patrón
      // que se sustituyó por NoExerciseNotice en los 4 renderers ya corregidos.
      const esRenderer = /^src\/features\/matematicas\//.test(rel) && !rel.includes("/components/");
      const guardiaVacia =
        /if\s*\(\s*!\s*(current|currentRound|currentStep|currentExercise|session|exercise)\b[^{;]*\)\s*(\{[^}]*)?\s*return null/.test(
          txt,
        );
      if (esRenderer && guardiaVacia) returnNull.push(rel);
    }

    const duplicados = [
      ["numpad local (debe ser el de shared)", numpadLocal, EXCEPCIONES.numpadLocal],
      [
        "botones propios de reintentar (debe ser ActionButtons)",
        botonesPropios,
        EXCEPCIONES.botonesPropios,
      ],
      [
        "pantalla de nivel propia (debe ser DifficultyReveal)",
        pantallaNivel,
        EXCEPCIONES.pantallaNivel,
      ],
      ["return null silencioso (pantalla en blanco)", returnNull, EXCEPCIONES.returnNull],
    ] as const;

    const nuevas = duplicados
      .map(([que, hallados, permitidos]) => ({
        que,
        nuevas: hallados.filter((f) => !permitidos.includes(f)),
      }))
      .filter((d) => d.nuevas.length > 0);

    if (nuevas.length > 0) {
      // Se escribe en stderr y no con console.warn porque el reporter por
      // defecto de `npm test` se come la salida de los tests que pasan: con
      // console.warn el aviso no se ve, y un aviso que no se ve no avisa.
      process.stderr.write(
        [
          "",
          "",
          "  ╔══════════════════════════════════════════════════════════════╗",
          "  ║  AVISO DEL AGENTE — mobiliario compartido duplicado            ║",
          "  ╚══════════════════════════════════════════════════════════════╝",
          ...nuevas.map(
            (d) => `    · ${d.que}:\n${d.nuevas.map((f) => `        ${f}`).join("\n")}\n`,
          ),
          "    Reutiliza la pieza compartida. Si este ejercicio necesita de",
          "    verdad otra versión, documéntalo en docs/COMPONENTES_COMPARTIDOS.md",
          "    y añade el fichero a EXCEPCIONES en este test.",
          "",
          "",
        ].join("\n"),
      );
    }

    // Avisa, pero no falla: la decisión de romper el patrón es del profesor.
    expect(true).toBe(true);
  });
});
