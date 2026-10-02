import { describe, expect, it } from "vitest";
import {
  esBarraHueca,
  ESCALA_MAX,
  generateSession,
  marcasEje,
  SESSION_SIZE,
  validateAnswer,
} from "./graficoBarras";
import type { ActivityDifficulty } from "../content/contracts";
import type { GraficoBarrasExercise, GraficoType } from "./graficoBarras";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Barras por dificultad, como las declara el manifiesto. */
const BARRAS: Record<ActivityDifficulty, number> = { easy: 3, medium: 4, hard: 5, expert: 5 };

/** Tipos que se alternan en cada dificultad. */
const TIPOS: Record<ActivityDifficulty, GraficoType[]> = {
  easy: ["read_value", "find_max", "fill_bar"],
  medium: ["read_value", "find_max", "find_min", "fill_bar"],
  hard: ["read_value", "find_max", "find_min", "compare", "fill_bar"],
  expert: ["compare", "read_value", "find_max", "find_min", "fill_bar", "compare"],
};

/** Cuántas barras nombra el enunciado de máximo o de mínimo. */
const SINGULARES = ["animal", "fruta", "deporte", "asignatura"];

const todas = DIFICULTADES.flatMap((dificultad) =>
  SEMILLAS.map((semilla) => ({ dificultad, exercises: generateSession(dificultad, semilla) })),
);

describe("graficoBarras — generateSession", () => {
  it("completa la sesión de 10 ejercicios en las cuatro dificultades", () => {
    for (const { dificultad, exercises } of todas) {
      expect(exercises, `${dificultad}`).toHaveLength(SESSION_SIZE);
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("los tipos se alternan en el orden declarado, sin repetir de más", () => {
    // Con el sorteo original una sesión podía salir sin un solo `fill_bar`.
    for (const { dificultad, exercises } of todas) {
      for (let i = 0; i < exercises.length; i++) {
        expect(exercises[i]!.type, `${dificultad} en la posición ${i}`).toBe(
          TIPOS[dificultad][i % TIPOS[dificultad].length],
        );
      }
    }
  });

  it("trae todos los tipos que su dificultad declara, y ninguno más", () => {
    for (const { dificultad, exercises } of todas) {
      const tipos = new Set(exercises.map((ex) => ex.type));
      for (const tipo of tipos) expect(TIPOS[dificultad], `${dificultad}: ${tipo}`).toContain(tipo);
      for (const tipo of TIPOS[dificultad])
        expect(tipos, `${dificultad} no trae ${tipo}`).toContain(tipo);
    }
  });

  it("dibuja 3, 4, 5 y 5 barras según la dificultad", () => {
    for (const { dificultad, exercises } of todas) {
      for (const ex of exercises)
        expect(ex.bars, `${dificultad} ${ex.type}`).toHaveLength(BARRAS[dificultad]);
    }
  });

  it("los elementos de cada barra pertenecen a un único tema, sin repetir", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        const etiquetas = ex.bars.map((b) => b.etiqueta);
        expect(new Set(etiquetas).size, `${ex.titulo}: ${etiquetas.join(", ")}`).toBe(
          etiquetas.length,
        );
      }
    }
  });

  it("da a cada barra un valor del rango, distinto del de las demás", () => {
    const topes: Record<ActivityDifficulty, number> = { easy: 8, medium: 12, hard: 15, expert: 15 };
    for (const { dificultad, exercises } of todas) {
      for (const ex of exercises) {
        const valores = ex.bars.map((b) => b.valor);
        for (const v of valores) {
          expect(v, `${dificultad} ${ex.type}`).toBeGreaterThanOrEqual(1);
          expect(v, `${dificultad} ${ex.type}`).toBeLessThanOrEqual(topes[dificultad]);
        }
        expect(new Set(valores).size, `${dificultad} ${ex.titulo}`).toBe(valores.length);
      }
    }
  });

  it("no repite el mismo tipo con la misma barra", () => {
    for (const { exercises } of todas) {
      const claves = exercises.map((ex) => {
        const nombrada =
          ex.type === "compare"
            ? [...ex.bars].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta))[0]!.etiqueta
            : (ex.correctAnswer ?? "");
        return `${ex.type}-${ex.bars.map((b) => b.etiqueta).join("|")}-${nombrada}`;
      });
      expect(new Set(claves).size, "Sesión con ejercicios repetidos").toBe(claves.length);
    }
  });
});

describe("graficoBarras — la escala y el eje", () => {
  it("el tope de la escala es el del nivel, no el del ejercicio", () => {
    // El original lo calculaba con `Math.max(...bars)` y lo redibujaba en cada
    // ejercicio: una barra que llenaba el gráfico en una pantalla se quedaba a
    // medias en la siguiente.
    for (const { dificultad, exercises } of todas) {
      for (const ex of exercises) {
        expect(ex.escalaMax, `${dificultad} ${ex.type}`).toBe(ESCALA_MAX[dificultad]);
        for (const barra of ex.bars) expect(barra.valor).toBeLessThanOrEqual(ex.escalaMax);
      }
    }
  });

  it("todos los ejercicios de un nivel llevan la misma escala y las mismas marcas", () => {
    for (const dificultad of DIFICULTADES) {
      const escalas = new Set(
        SEMILLAS.flatMap((semilla) =>
          generateSession(dificultad, semilla).map((ex) =>
            JSON.stringify([ex.escalaMax, ex.marcas]),
          ),
        ),
      );
      expect(escalas.size, `${dificultad} cambia de escala entre ejercicios`).toBe(1);
    }
  });

  it("las marcas son enteros, crecientes,IGUALES y acaban en el tope", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        const marcas = ex.marcas;
        expect(marcas.length).toBeGreaterThan(1);
        for (const m of marcas) expect(Number.isInteger(m), `marca ${m}`).toBe(true);
        for (let i = 1; i < marcas.length; i++) {
          expect(marcas[i]!).toBeGreaterThan(marcas[i - 1]!);
          expect(marcas[i]! - marcas[i - 1]!).toBe(marcas[0]!);
        }
        expect(marcas[marcas.length - 1]).toBe(ex.escalaMax);
      }
    }
  });

  it("las marcas dividen el tope, para que la barra se pueda leer", () => {
    // Con 15 son 5, 10 y 15; no 3,75, 7,5 y 11,25.
    expect(marcasEje(8)).toEqual([2, 4, 6, 8]);
    expect(marcasEje(12)).toEqual([3, 6, 9, 12]);
    expect(marcasEje(15)).toEqual([5, 10, 15]);
    for (const { exercises } of todas) {
      for (const ex of exercises) expect(ex.marcas).toEqual(marcasEje(ex.escalaMax));
    }
  });
});

describe("graficoBarras — los enunciados", () => {
  it("el título del gráfico es el de un tema, con su sustantivo en singular", () => {
    // El original sacaba el singular con `replace("s favoritos", "")` y con
    // «Frutas preferidas» no quitaba nada: la pregunta salía «¿Qué frutas
    // preferidas tiene MÁS votos?».
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type !== "find_max" && ex.type !== "find_min") continue;
        expect(ex.question, `«${ex.question}» no es un enunciado de máximo o mínimo`).toMatch(
          /^¿Qué (animal|fruta|deporte|asignatura) tiene (MÁS|MENOS) votos\?$/,
        );
      }
    }
  });

  it("ningún enunciado repite el título dentro de la pregunta", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        const titulo = ex.titulo.toLowerCase();
        expect(ex.question.toLowerCase().includes(titulo), ex.question).toBe(false);
      }
    }
  });

  it("«más» solo se pregunta cuando la primera barra tiene más votos que la segunda", () => {
    // El original sorteaba el orden de las dos barras, calculaba `Math.abs` y lo
    // formulaba como «más»: la frase podía ser falsa.
    let vistas = 0;
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type !== "compare") continue;
        vistas++;
        const [, a, b] = ex.question.match(/«([^»]+)»[^«]*«([^»]+)»/) ?? [];
        const barraA = ex.bars.find((x) => x.etiqueta === a);
        const barraB = ex.bars.find((x) => x.etiqueta === b);
        expect(barraA, ex.question).toBeDefined();
        expect(barraB, ex.question).toBeDefined();
        expect(barraA!.valor, ex.question).toBeGreaterThan(barraB!.valor);
        expect(ex.correctAnswer).toBe(String(barraA!.valor - barraB!.valor));
      }
    }
    expect(vistas, "No ha salido ningún ejercicio de comparación").toBeGreaterThan(0);
  });

  it("en «leer el valor» y «faltan los datos», la respuesta es la barra nombrada", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type !== "read_value" && ex.type !== "fill_bar") continue;
        const nombrada = ex.question.match(/«(.+?)»/)?.[1];
        const barra = ex.bars.find((b) => b.etiqueta === nombrada);
        expect(barra, `${ex.type}: ${ex.question}`).toBeDefined();
        expect(ex.correctAnswer).toBe(String(barra!.valor));
      }
    }
  });

  it("máximo y mínimo responden con la etiqueta de la barra que corresponde", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type !== "find_max" && ex.type !== "find_min") continue;
        const esMax = ex.question.includes("MÁS");
        const winner = ex.bars.reduce((a, b) => (b.valor > a.valor === esMax ? b : a));
        expect(ex.correctAnswer, ex.question).toBe(winner.etiqueta);
        const perdedores = ex.bars.filter((b) => b !== winner);
        for (const p of perdedores) {
          if (esMax) expect(p.valor).toBeLessThan(winner.valor);
          else expect(p.valor).toBeGreaterThan(winner.valor);
        }
      }
    }
  });
});

describe("graficoBarras — la barra sin datos", () => {
  const deHueco = (exercises: GraficoBarrasExercise[]) =>
    exercises.filter((ex) => ex.type === "fill_bar");

  it("solo los ejercicios de «faltan los datos» declaran una barra hueca", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type === "fill_bar") {
          expect(ex.blankBarIndex, ex.question).toBeTypeOf("number");
        } else {
          expect(ex.blankBarIndex, `${ex.type} declara una barra hueca`).toBeUndefined();
        }
      }
    }
  });

  it("el hueco cae dentro del gráfico y es justo la barra de la que habla el enunciado", () => {
    for (const { exercises } of todas) {
      for (const ex of deHueco(exercises)) {
        expect(ex.blankBarIndex!).toBeGreaterThanOrEqual(0);
        expect(ex.blankBarIndex!).toBeLessThan(ex.bars.length);
        expect(ex.bars[ex.blankBarIndex!]!.etiqueta).toBe(ex.question.match(/«(.+?)»/)?.[1]);
      }
    }
  });

  it("la barra hueca conserva su altura, que es de donde se lee la respuesta", () => {
    // Si el hueco se dibujara vacío, «¿cuántos votos tiene?» no tendría
    // respuesta: el valor está en la barra y el enunciado lo dice.
    for (const { exercises } of todas) {
      for (const ex of deHueco(exercises)) {
        const barra = ex.bars[ex.blankBarIndex!]!;
        expect(esBarraHueca(ex, ex.blankBarIndex!)).toBe(true);
        expect(barra.valor).toBe(Number(ex.correctAnswer));
        expect(barra.valor).toBeGreaterThan(0);
      }
    }
  });

  it("esBarraHueca solo señala la barra sin datos del ejercicio que la declara", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        const indices = ex.bars.map((_, i) => i).filter((i) => esBarraHueca(ex, i));
        expect(indices).toEqual(ex.blankBarIndex === undefined ? [] : [ex.blankBarIndex]);
      }
    }
  });
});

describe("graficoBarras — las opciones", () => {
  it("la respuesta correcta está entre las opciones, y solo una vez", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        expect(ex.options, `${ex.type}: ${ex.question}`).toContain(ex.correctAnswer);
        expect(new Set(ex.options).size, `${ex.type}: ${ex.options.join(", ")}`).toBe(
          ex.options.length,
        );
      }
    }
  });

  it("ofrece cuatro opciones, o tres cuando el gráfico solo tiene tres barras", () => {
    for (const { dificultad, exercises } of todas) {
      for (const ex of exercises) {
        const esNombre = ex.type === "find_max" || ex.type === "find_min";
        // Solo las preguntas de nombre se quedan sin cuarto distractor, porque
        // sus distractores son las otras barras del gráfico y en `easy` solo hay
        // dos. Las numéricas siempre ofrecen cuatro.
        const esperadas = esNombre && BARRAS[dificultad] === 3 ? 3 : 4;
        expect(ex.options.length, `${dificultad} ${ex.type}`).toBe(esperadas);
      }
    }
  });

  it("en las preguntas de nombre, las opciones son barras del propio gráfico", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type !== "find_max" && ex.type !== "find_min") continue;
        for (const opcion of ex.options) {
          expect(
            ex.bars.map((b) => b.etiqueta),
            ex.question,
          ).toContain(opcion);
        }
      }
    }
  });

  it("en las preguntas de número, las opciones son números del rango y hay tres", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type === "find_max" || ex.type === "find_min") continue;
        expect(ex.options).toHaveLength(4);
        for (const opcion of ex.options) {
          expect(Number.isInteger(Number(opcion)), `${opcion} no es un número`).toBe(true);
          const v = Number(opcion);
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(ex.escalaMax);
        }
      }
    }
  });

  it("las opciones no salen ordenadas, que era como se adivinaba la respuesta", () => {
    // El original las ordenaba de menor a mayor: con la correcta en medio, la
    // respuesta era siempre el segundo botón.
    let desordenadas = 0;
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        if (ex.type === "find_max" || ex.type === "find_min") continue;
        const numeros = ex.options.map(Number);
        const ordenadas = [...numeros].sort((a, b) => a - b);
        if (numeros.join() !== ordenadas.join()) desordenadas++;
      }
    }
    expect(desordenadas, "Las opciones numéricas siempre han salido ordenadas").toBeGreaterThan(0);
  });

  it("la posición de la correcta no es siempre la misma", () => {
    const posiciones = new Set<number>();
    for (let semilla = 1; semilla <= 40; semilla++) {
      for (const ex of generateSession("hard", semilla)) {
        posiciones.add(ex.options.indexOf(ex.correctAnswer));
      }
    }
    expect(posiciones.size, "La correcta siempre cae en el mismo botón").toBeGreaterThan(1);
  });
});

describe("graficoBarras — validateAnswer", () => {
  it("solo acepta la respuesta correcta", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises) {
        expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
        for (const opcion of ex.options.filter((o) => o !== ex.correctAnswer)) {
          expect(validateAnswer(ex, opcion), `${ex.type}: ${opcion}`).toBe(false);
        }
        expect(validateAnswer(ex, "")).toBe(false);
      }
    }
  });
});

describe("graficoBarras — los temas", () => {
  it("los cuatro títulos son los del original y declaran su singular", () => {
    for (const dificultad of DIFICULTADES) {
      const titulos = new Set(generateSession(dificultad, 7).map((ex) => ex.titulo));
      for (const titulo of titulos) {
        expect(SINGULARES.length).toBe(4);
        expect(titulo).toMatch(/favoritos$|preferidas$|favoritas$/);
      }
    }
  });
});
