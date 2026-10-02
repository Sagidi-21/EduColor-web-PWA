import { describe, expect, it } from "vitest";
import {
  FACTORES,
  generateChoiceSession,
  generateMatchSession,
  generateSession,
  isCorrectPair,
  MODOS,
  MIN_FACTOR,
  SESSION_SIZE,
  validateAnswer,
} from "./multiplicacion";
import type { ActivityDifficulty } from "../content/contracts";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];
const DE_UNIR: ActivityDifficulty[] = ["easy", "medium"];
const DE_OPCION: ActivityDifficulty[] = ["hard", "expert"];

const clave = (ex: { type: string; a: number; b: number }) => `${ex.type}-${ex.a}-${ex.b}`;

describe("multiplicacion — el nivel decide el formato", () => {
  it("los niveles bajos unen columnas y los altos dan ejercicios", () => {
    expect(MODOS).toEqual({
      easy: "match",
      medium: "match",
      hard: "choice",
      expert: "choice",
    });
  });

  it("generateSession devuelve el formato que dice el nivel", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const sesion = generateSession(dificultad, semilla);
        expect(sesion.mode, `${dificultad}/${semilla}`).toBe(MODOS[dificultad]);
        if (sesion.mode === "match") {
          expect(sesion.pairs.length, `${dificultad}/${semilla}`).toBeGreaterThan(0);
        } else {
          expect(sesion.exercises, `${dificultad}/${semilla}`).toHaveLength(SESSION_SIZE);
        }
      }
    }
  });

  it("es determinista con la misma semilla", () => {
    expect(generateSession("easy", 42)).toEqual(generateSession("easy", 42));
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });
});

describe("multiplicacion — modo unir", () => {
  it("el fácil es la tabla del 2 completa, con sus diez filas", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateMatchSession("easy", semilla);
      expect(sesion.pairs, `easy/${semilla}`).toHaveLength(10);
      expect(
        sesion.pairs.every((p) => p.table === 2),
        `easy/${semilla}`,
      ).toBe(true);
      // Los diez factores, cada uno una vez: la tabla entera.
      expect(sesion.pairs.map((p) => p.factor).sort((a, b) => a - b)).toEqual([...FACTORES]);
    }
  });

  it("el medio son cinco filas de la del 2 y cinco de la del 5", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateMatchSession("medium", semilla);
      expect(sesion.pairs, `medium/${semilla}`).toHaveLength(10);
      expect(
        sesion.pairs.filter((p) => p.table === 2),
        `medium/${semilla}`,
      ).toHaveLength(5);
      expect(
        sesion.pairs.filter((p) => p.table === 5),
        `medium/${semilla}`,
      ).toHaveLength(5);
    }
  });

  it("ningún producto se repite, porque si no una tarjeta no tendría pareja", () => {
    // Es lo que hace posible mezclar las dos tablas del medio: `2 × 5` y `5 × 2`
    // son los dos 10, y si entraran las dos habría dos tarjetas de la izquierda
    // apuntando a una sola de la derecha.
    for (const dificultad of DE_UNIR) {
      for (const semilla of SEMILLAS) {
        const { pairs } = generateMatchSession(dificultad, semilla);
        const productos = pairs.map((p) => p.product);
        expect(new Set(productos).size, `${dificultad}/${semilla}`).toBe(productos.length);
      }
    }
  });

  it("cada producto es su tabla por su factor", () => {
    for (const dificultad of DE_UNIR) {
      for (const semilla of SEMILLAS) {
        for (const par of generateMatchSession(dificultad, semilla).pairs) {
          expect(par.product, `${par.table} × ${par.factor}`).toBe(par.table * par.factor);
        }
      }
    }
  });

  it("las dos columnas van barajadas y con las mismas parejas", () => {
    for (const dificultad of DE_UNIR) {
      for (const semilla of SEMILLAS) {
        const sesion = generateMatchSession(dificultad, semilla);
        // Mismos identificadores a ambos lados, que es lo que permite unir.
        expect(sesion.leftColumn.map((p) => p.id).sort((a, b) => a - b)).toEqual(
          sesion.rightColumn.map((p) => p.id).sort((a, b) => a - b),
        );
        // Y ninguna columna conserva el orden del motor, que delataría la unión.
        expect(sesion.leftColumn.map((p) => p.id)).not.toEqual(sesion.pairs.map((p) => p.id));
      }
    }
  });

  it("una pareja es correcta cuando las dos tarjetas dicen el mismo producto", () => {
    const { pairs } = generateMatchSession("medium", 42);
    for (const izquierda of pairs) {
      for (const derecha of pairs) {
        expect(isCorrectPair(izquierda, derecha), `${izquierda.product}/${derecha.product}`).toBe(
          izquierda.product === derecha.product,
        );
      }
    }
  });

  it("el fácil incluye `2 × 1`, que es una fila de la tabla y no un ejercicio degenerado", () => {
    const { pairs } = generateMatchSession("easy", 42);
    const uno = pairs.find((p) => p.factor === 1);
    expect(uno).toBeDefined();
    expect(uno?.product).toBe(2);
  });
});

describe("multiplicacion — modo opción múltiple", () => {
  it("completa la sesión sin repetir tipo, tabla y factor", () => {
    for (const dificultad of DE_OPCION) {
      for (const semilla of SEMILLAS) {
        const sesion = generateChoiceSession(dificultad, semilla);
        expect(sesion, `${dificultad}/${semilla}`).toHaveLength(SESSION_SIZE);
        const claves = sesion.map(clave);
        expect(new Set(claves).size, `${dificultad}/${semilla} repite ejercicio`).toBe(
          SESSION_SIZE,
        );
      }
    }
  });

  it("el segundo factor nunca vale 1, porque no hay nada que calcular", () => {
    for (const dificultad of DE_OPCION) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateChoiceSession(dificultad, semilla)) {
          expect(ex.b, ex.question).toBeGreaterThanOrEqual(MIN_FACTOR);
        }
      }
    }
  });

  it("solo usa las tablas que su dificultad declara", () => {
    const esperadas: Record<ActivityDifficulty, number[]> = {
      easy: [2],
      medium: [2, 5],
      hard: [2, 5, 10],
      expert: [2, 3, 4, 5, 10],
    };
    for (const dificultad of DE_OPCION) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateChoiceSession(dificultad, semilla)) {
          expect(esperadas[dificultad], `${dificultad}/${semilla}: ${ex.question}`).toContain(ex.a);
        }
      }
    }
  });

  it("trae todos los tipos que su dificultad declara, y ninguno más", () => {
    const permitidos: Record<ActivityDifficulty, string[]> = {
      easy: ["product"],
      medium: ["product", "missing-factor-b"],
      hard: ["product", "missing-factor-a", "missing-factor-b"],
      expert: ["product", "missing-factor-a", "missing-factor-b", "count-groups"],
    };
    for (const dificultad of DE_OPCION) {
      for (const semilla of SEMILLAS) {
        const tipos = new Set(generateChoiceSession(dificultad, semilla).map((ex) => ex.type));
        for (const tipo of tipos) {
          expect(permitidos[dificultad], `${dificultad}/${semilla}: ${tipo}`).toContain(tipo);
        }
        for (const tipo of permitidos[dificultad]) {
          expect(tipos, `${dificultad}/${semilla} no trae ${tipo}`).toContain(tipo);
        }
      }
    }
  });

  it("el producto es siempre a por b", () => {
    for (const dificultad of DE_OPCION) {
      for (const ex of generateChoiceSession(dificultad, 42)) {
        if (ex.type !== "product") continue;
        expect(ex.result).toBe(ex.a * ex.b);
        expect(ex.question).toBe(`${ex.a} × ${ex.b} = ___`);
        expect(ex.correctAnswer).toBe(ex.result);
      }
    }
  });

  it("al faltar un factor, lo que falta es el factor y el resultado es el producto", () => {
    for (const dificultad of DE_OPCION) {
      for (const ex of generateChoiceSession(dificultad, 42)) {
        if (ex.type === "missing-factor-b") {
          expect(ex.correctAnswer, ex.question).toBe(ex.b);
          expect(ex.question).toBe(`${ex.a} × ___ = ${ex.result}`);
        } else if (ex.type === "missing-factor-a") {
          expect(ex.correctAnswer, ex.question).toBe(ex.a);
          expect(ex.question).toBe(`___ × ${ex.b} = ${ex.result}`);
        }
      }
    }
  });

  it("en cuenta-grupos la respuesta es el número de grupos", () => {
    for (const ex of generateChoiceSession("expert", 42)) {
      if (ex.type !== "count-groups") continue;
      expect(ex.correctAnswer, ex.question).toBe(ex.b);
      expect(ex.question).toContain(`grupos de ${ex.a}`);
      expect(ex.result / ex.a).toBe(ex.b);
    }
  });

  it("son cuatro opciones distintas, con la correcta entre ellas y sin ceros", () => {
    for (const dificultad of DE_OPCION) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateChoiceSession(dificultad, semilla)) {
          expect(ex.options, ex.question).toHaveLength(4);
          expect(new Set(ex.options).size, ex.question).toBe(4);
          expect(ex.options, ex.question).toContain(ex.correctAnswer);
          for (const opt of ex.options) expect(opt, ex.question).toBeGreaterThan(0);
        }
      }
    }
  });

  it("las opciones no vienen ordenadas, para que la posición no dé la respuesta", () => {
    // El original las ordenaba de menor a mayor, lo que dejaba la correcta
    // correlacionada con su magnitud: `7 × 3 = 21` daba `{7, 14, 21, 28}`.
    let desordenadas = 0;
    for (const semilla of SEMILLAS) {
      for (const ex of generateChoiceSession("expert", semilla)) {
        if ([...ex.options].sort((a, b) => a - b).join() !== ex.options.join()) desordenadas++;
      }
    }
    expect(desordenadas).toBeGreaterThan(0);
  });

  it("la opción correcta no cae siempre en la misma posición", () => {
    const posiciones = new Set<number>();
    for (const semilla of SEMILLAS) {
      for (const ex of generateChoiceSession("expert", semilla)) {
        posiciones.add(ex.options.indexOf(ex.correctAnswer));
      }
    }
    expect(posiciones.size).toBeGreaterThan(1);
  });

  it("validateAnswer acepta la correcta y rechaza cualquier otra", () => {
    for (const dificultad of DE_OPCION) {
      for (const ex of generateChoiceSession(dificultad, 42)) {
        expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
        for (const otra of ex.options) {
          if (otra === ex.correctAnswer) continue;
          expect(validateAnswer(ex, otra), `${ex.question} / ${otra}`).toBe(false);
        }
        expect(validateAnswer(ex, ex.correctAnswer + 1)).toBe(false);
        expect(validateAnswer(ex, 0)).toBe(false);
      }
    }
  });
});
