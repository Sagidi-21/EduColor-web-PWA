import { describe, expect, it } from "vitest";
import {
  COLUMNS,
  decodeOption,
  decompose,
  encodeOption,
  generateSession,
  RANGES,
  SESSION_SIZE,
  TYPE_POOLS,
  validateAnswer,
} from "./abaco3cifras";
import type { AbacoType } from "./abaco3cifras";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

describe("abaco3cifras — descomposición y codificación", () => {
  it("descompone un número de tres cifras en sus columnas", () => {
    expect(decompose(100)).toEqual({ c: 1, d: 0, u: 0 });
    expect(decompose(999)).toEqual({ c: 9, d: 9, u: 9 });
    expect(decompose(457)).toEqual({ c: 4, d: 5, u: 7 });
    expect(decompose(380)).toEqual({ c: 3, d: 8, u: 0 });
  });

  it("codifica y decodifica las bolitas sin perder información", () => {
    for (const c of [0, 1, 5, 9]) {
      for (const d of [0, 3, 9]) {
        for (const u of [0, 7, 9]) {
          const opcion = encodeOption(c, d, u);
          expect(decodeOption(opcion), opcion).toEqual({ c, d, u });
        }
      }
    }
  });

  it("recompone el número a partir de sus columnas", () => {
    for (const n of [100, 299, 456, 700, 999]) {
      const { c, d, u } = decompose(n);
      expect(c * 100 + d * 10 + u, String(n)).toBe(n);
    }
  });

  it("las tres columnas valen 100, 10 y 1", () => {
    expect(COLUMNS.map((c) => [c.id, c.base])).toEqual([
      ["C", 100],
      ["D", 10],
      ["U", 1],
    ]);
  });
});

describe("abaco3cifras — generateSession", () => {
  it("completa la sesión de 10 ejercicios en todas las semillas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        expect(generateSession(dificultad, semilla), `${dificultad}/${semilla}`).toHaveLength(
          SESSION_SIZE,
        );
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("no repite la combinación número:tipo", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        const claves = generateSession(dificultad, semilla).map((ex) => `${ex.number}-${ex.type}`);
        expect(new Set(claves).size, `${dificultad}/${semilla}`).toBe(claves.length);
      }
    }
  });

  it("respeta el rango de tres cifras de cada dificultad", () => {
    for (const dificultad of DIFFICULTIES) {
      const [min, max] = RANGES[dificultad];
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(ex.number, `${dificultad}/${semilla}`).toBeGreaterThanOrEqual(min);
          expect(ex.number, `${dificultad}/${semilla}`).toBeLessThanOrEqual(max);
          expect(ex.number, ex.question).toBeGreaterThanOrEqual(100);
          expect(ex.number, ex.question).toBeLessThanOrEqual(999);
        }
      }
    }
  });

  it("las columnas del ejercicio coinciden con las de su número", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect({ c: ex.centenas, d: ex.decenas, u: ex.unidades }, String(ex.number)).toEqual(
            decompose(ex.number),
          );
        }
      }
    }
  });

  it("easy solo genera `read-abaco` y las otras dificultades amplían el conjunto", () => {
    for (const semilla of SEMILLAS) {
      expect(
        generateSession("easy", semilla).every((ex) => ex.type === "read-abaco"),
        `easy/${semilla}`,
      ).toBe(true);
      for (const tipo of ["find-abaco", "valor-posicional"] as AbacoType[]) {
        expect(TYPE_POOLS.easy.includes(tipo), `easy no incluye ${tipo}`).toBe(false);
        expect(TYPE_POOLS.medium.includes(tipo), `medium incluye ${tipo}`).toBe(
          tipo === "find-abaco",
        );
        expect(TYPE_POOLS.hard.includes(tipo), `hard incluye ${tipo}`).toBe(true);
        expect(TYPE_POOLS.expert.includes(tipo), `expert incluye ${tipo}`).toBe(true);
      }
    }
  });

  it("medium y hard sacan de verdad los tipos que su lista promete", () => {
    for (const semilla of SEMILLAS) {
      const tipos = (d: ActivityDifficulty) =>
        new Set(generateSession(d, semilla).map((e) => e.type));
      expect(tipos("medium").has("read-abaco"), `medium/${semilla}`).toBe(true);
      expect(tipos("medium").has("find-abaco"), `medium/${semilla}`).toBe(true);
      expect(tipos("medium").has("valor-posicional"), `medium/${semilla}`).toBe(false);
      expect(tipos("hard").size, `hard/${semilla}`).toBe(3);
    }
  });
});

describe("abaco3cifras — los tres tipos de ejercicio", () => {
  it("`read-abaco` acierta con el número del ábaco y ofrece 4 números distintos", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        expect(ex.type).toBe("read-abaco");
        expect(ex.question).toBe("¿Qué número muestra el ábaco?");
        expect(ex.correctAnswer).toBe(String(ex.number));
        expect(ex.options).toHaveLength(4);
        expect(new Set(ex.options).size, ex.correctAnswer).toBe(4);
        expect(ex.options).toContain(ex.correctAnswer);
        expect(ex.options.map(Number).sort((a, b) => a - b)).toEqual(ex.options.map(Number));
      }
    }
  });

  it("`find-abaco` acierta con las bolitas del número y ofrece 4 ábacos distintos", () => {
    for (const dificultad of ["medium", "hard", "expert"] as ActivityDifficulty[]) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla).filter(
          (e) => e.type === "find-abaco",
        )) {
          expect(ex.question, ex.question).toBe(`¿Qué ábaco representa el número ${ex.number}?`);
          expect(ex.correctAnswer).toBe(encodeOption(ex.centenas, ex.decenas, ex.unidades));
          expect(ex.options).toHaveLength(4);
          expect(new Set(ex.options).size, ex.correctAnswer).toBe(4);
          for (const opcion of ex.options) {
            const { c, d, u } = decodeOption(opcion);
            expect(c, opcion).toBeLessThanOrEqual(9);
            expect(d, opcion).toBeLessThanOrEqual(9);
            expect(u, opcion).toBeLessThanOrEqual(9);
          }
          // Solo una opción puede representar el número pedido.
          const representacionDe = (o: string) => {
            const { c, d, u } = decodeOption(o);
            return c * 100 + d * 10 + u;
          };
          expect(
            ex.options.filter((o) => representacionDe(o) === ex.number),
            ex.question,
          ).toEqual([ex.correctAnswer]);
        }
      }
    }
  });

  it("`valor-posicional` ofrece múltiplos de la columna y el valor correcto es el de la pregunta", () => {
    for (const dificultad of ["hard", "expert"] as ActivityDifficulty[]) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla).filter(
          (e) => e.type === "valor-posicional",
        )) {
          const nombreColumna = ex.question.match(/columna de (\w+)/)?.[1];
          const columna = COLUMNS.find((c) => c.name === nombreColumna);
          expect(columna, ex.question).toBeDefined();
          const base = columna!.base;

          const bolitas = Number(ex.question.match(/con (\d+) bolitas/)?.[1]);
          expect(bolitas, ex.question).toBeGreaterThanOrEqual(0);
          expect(bolitas, ex.question).toBeLessThanOrEqual(9);
          expect(bolitas, ex.question).toBe(
            columna!.id === "C" ? ex.centenas : columna!.id === "D" ? ex.decenas : ex.unidades,
          );
          expect(ex.correctAnswer, ex.question).toBe(String(bolitas * base));

          expect(ex.options).toHaveLength(4);
          expect(new Set(ex.options).size, ex.question).toBe(4);
          for (const opcion of ex.options) {
            expect(Number(opcion) % base, `${ex.question} / ${opcion}`).toBe(0);
            expect(Number(opcion) / base, opcion).toBeLessThanOrEqual(9);
          }
          expect(ex.options).toContain(ex.correctAnswer);
        }
      }
    }
  });

  it("los tres tipos salen con la pregunta que corresponde", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type === "read-abaco") expect(ex.question).toBe("¿Qué número muestra el ábaco?");
          if (ex.type === "find-abaco")
            expect(ex.question).toContain(`representa el número ${ex.number}`);
          if (ex.type === "valor-posicional")
            expect(ex.question).toContain("bolitas en la columna de");
        }
      }
    }
  });
});

describe("abaco3cifras — validateAnswer", () => {
  it("acepta la respuesta correcta y rechaza las otras tres", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
          for (const otra of ex.options) {
            if (otra === ex.correctAnswer) continue;
            expect(validateAnswer(ex, otra), `${ex.question} / ${otra}`).toBe(false);
          }
          expect(validateAnswer(ex, ""), ex.question).toBe(false);
          expect(validateAnswer(ex, `${ex.correctAnswer} `), ex.question).toBe(false);
        }
      }
    }
  });
});
