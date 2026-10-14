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
  ActivityCelebration: "src/features/matematicas/components/ActivityCelebration.tsx",
};

/**
 * Excepciones: piezas duplicadas que se aceptan a propósito.
 *
 * Cada una lleva su motivo. Una excepción sin explicación escrita es un
 * olvido, no una decisión, así que el motivo es obligatorio.
 */
interface Excepcion {
  motivo: string;
  ficheros: string[];
}

const EXCEPCIONES: Record<string, Excepcion[]> = {
  numpadLocal: [],
  botonesPropios: [],
  pantallaNivel: [],
  returnNull: [
    {
      motivo:
        "Guarda inalcanzable. El avance comprueba `next >= total` (o `nextIdx >= rounds.length`) y, en vez de avanzar, muestra el resumen; el contador nunca pasa del último, así que `current` nunca es undefined. Se deja tal cual porque el código funciona y AGENT_RULES §4 prohíbe tocarlo sin motivo real. Si algún día se rompe el avance, esta excepción es lo primero que hay que quitar.",
      ficheros: [
        "src/features/matematicas/algoritmoColumna/AlgoritmoColumnaScreen.tsx",
        "src/features/matematicas/igualdad/IgualdadScreen.tsx",
        "src/features/matematicas/leftRight/LeftRightScreen.tsx",
        "src/features/matematicas/problemas/ProblemaScreen.tsx",
        "src/features/matematicas/rectaNumerica/RectaNumericaScreen.tsx",
        "src/features/matematicas/relacionar/RelacionarScreen.tsx",
        "src/features/matematicas/relacionSumaResta/RelacionSumaRestaScreen.tsx",
        "src/features/matematicas/repartoIgual/RepartoIgualScreen.tsx",
        "src/features/matematicas/shapes/ShapesScreen.tsx",
        "src/features/matematicas/sumaLlevando/SumaLlevandoScreen.tsx",
        "src/features/matematicas/tresSumandos/TresSumandosScreen.tsx",
        "src/features/matematicas/tresSumandosColumna/TresSumandosColumnaScreen.tsx",
        "src/features/matematicas/vecinos/VecinosScreen.tsx",
        "src/features/matematicas/weekDays/WeekDaysScreen.tsx",
      ],
    },
    {
      motivo:
        "Caso distinto: aquí la sesión viene de un contexto de React, no de un índice. No es inalcanzable por la misma razón, pero solo se ve la vista de ejercicio tras pasar por el catálogo, que es lo que crea la sesión, y al recargar la página se vuelve al catálogo. Aun así es la más frágil de las dos: si algún día se renderiza `ExerciseView` sin sesión, esto sí dejaría la pantalla en blanco. Candidato a pasar a `NoExerciseNotice` cuando se toque ese fichero.",
      ficheros: ["src/features/matematicas/ExerciseView.tsx"],
    },
  ],
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
    // Cada hallazgo dice qué pieza sobra, en qué fichero y en qué línea, y cuál
    // hay que usar en su lugar. Sin la línea no se puede ir a mirar.
    type Hallazgo = { donde: string; usar: string };
    const numpadLocal: Hallazgo[] = [];
    const botonesPropios: Hallazgo[] = [];
    const pantallaNivel: Hallazgo[] = [];
    const returnNull: Hallazgo[] = [];

    /** Primera línea (1-indexada) que casa con el patrón. */
    const lineaDe = (txt: string, re: RegExp): number => {
      const lineas = txt.split(/\r?\n/);
      const i = lineas.findIndex((l) => re.test(l));
      return i < 0 ? 1 : i + 1;
    };

    for (const abs of fuentes(join(RAIZ, "src"))) {
      const rel = relativa(abs);
      const txt = readFileSync(abs, "utf8");

      const reNumpad = /export (?:function|const) Numpad/;
      if (!rel.endsWith(COMPARTIDOS.Numpad) && reNumpad.test(txt)) {
        numpadLocal.push({ donde: `${rel}:${lineaDe(txt, reNumpad)}`, usar: COMPARTIDOS.Numpad });
      }

      const reBoton = /className="[^"]*activity-action--retry/;
      if (!rel.endsWith(COMPARTIDOS.ActionButtons) && reBoton.test(txt)) {
        botonesPropios.push({
          donde: `${rel}:${lineaDe(txt, reBoton)}`,
          usar: COMPARTIDOS.ActionButtons,
        });
      }

      const reNivel = /className="[^"]*diff-reveal__/;
      if (!rel.endsWith(COMPARTIDOS.DifficultyReveal) && reNivel.test(txt)) {
        pantallaNivel.push({
          donde: `${rel}:${lineaDe(txt, reNivel)}`,
          usar: COMPARTIDOS.DifficultyReveal,
        });
      }

      // Pantalla en blanco silenciosa: una guarda `if (!<ejercicio>) return null`
      // dentro de un renderer deja la pantalla vacía sin decir nada. Es el patrón
      // que se sustituyó por NoExerciseNotice en los 4 renderers ya corregidos.
      const esRenderer = /^src\/features\/matematicas\//.test(rel) && !rel.includes("/components/");
      const reGuardia =
        /if\s*\(\s*!\s*(current|currentRound|currentStep|currentExercise|session|exercise)\b[^{;]*\)\s*(\{[^}]*)?\s*return null/;
      if (esRenderer && reGuardia.test(txt)) {
        returnNull.push({
          donde: `${rel}:${lineaDe(txt, reGuardia)}`,
          usar: COMPARTIDOS.NoExerciseNotice,
        });
      }
    }

    const duplicados = [
      ["Numpad definido fuera del compartido", numpadLocal, EXCEPCIONES.numpadLocal],
      ["Botones de reintentar/siguiente propios", botonesPropios, EXCEPCIONES.botonesPropios],
      ["Pantalla de nivel o dificultad propia", pantallaNivel, EXCEPCIONES.pantallaNivel],
      ["Guarda 'return null' que deja la pantalla en blanco", returnNull, EXCEPCIONES.returnNull],
    ] as const;

    const nuevas = duplicados
      .map(([que, hallados, permitidos]) => ({
        que,
        nuevas: hallados.filter(
          (h) => !permitidos.some((e) => e.ficheros.includes(h.donde.split(":")[0])),
        ),
      }))
      .filter((d) => d.nuevas.length > 0);

    if (nuevas.length > 0) {
      const total = nuevas.reduce((n, d) => n + d.nuevas.length, 0);
      // Se escribe en stderr y no con console.warn porque el reporter por
      // defecto de `npm test` se come la salida de los tests que pasan: con
      // console.warn el aviso no se ve, y un aviso que no se ve no avisa.
      process.stderr.write(
        [
          "",
          "",
          "  ╔══════════════════════════════════════════════════════════════════════╗",
          `  ║  AVISO DEL AGENTE — ${total} ${total === 1 ? "duplicación" : "duplicaciones"} de mobiliario compartido`.padEnd(
            78,
          ) + "║",
          "  ╚══════════════════════════════════════════════════════════════════════╝",
          ...nuevas.flatMap((d) => [
            "",
            `  ${d.que}:`,
            ...d.nuevas.map((h) => `      está en  ${h.donde}`),
            `      usa en su lugar  ${d.nuevas[0].usar}`,
          ]),
          "",
          "  Por qué: el mobiliario es compartido a propósito. Si dos pantallas lo",
          "  hacen por su cuenta, se ven distinto y nadie sabe cuál manda.",
          "  Si aquí el ejercicio necesita de verdad otra versión, documéntalo en",
          "  docs/COMPONENTES_COMPARTIDOS.md y añade el fichero a EXCEPCIONES en",
          "  src/features/matematicas/components/SharedComponents.test.ts",
          "",
          "",
        ].join("\n"),
      );
    }

    // Avisa, pero no falla: la decisión de romper el patrón es del profesor.
    expect(true).toBe(true);
  });
});
