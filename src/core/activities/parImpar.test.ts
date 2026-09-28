import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, requiresWriting } from "./parImpar";
import type { ParImparExercise } from "./parImpar";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

/** Varias seeds para no depender de una tirada concreta del LCG. */
const SEEDS = [1, 7, 42, 99, 123, 2024, 55555];

const isOdd = (n: number) => n % 2 !== 0;

describe("parImpar — generateSession", () => {
  it("genera 10 ejercicios en las cuatro dificultades", () => {
    DIFFICULTIES.forEach((diff) => {
      SEEDS.forEach((seed) => {
        expect(generateSession(diff, seed)).toHaveLength(10);
      });
    });
  });

  it("es determinista con la misma seed y distinto con seeds distintas", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 123)).toEqual(generateSession(diff, 123));
      expect(generateSession(diff, 1)).not.toEqual(generateSession(diff, 2));
    });
  });

  it("respeta el tipo de ejercicio de cada dificultad", () => {
    SEEDS.forEach((seed) => {
      expect(generateSession("easy", seed).every((e) => e.type === "visual")).toBe(true);
      expect(generateSession("medium", seed).every((e) => e.type === "select")).toBe(true);
      expect(generateSession("hard", seed).every((e) => e.type === "rule")).toBe(true);
    });
  });

  it("en expert alterna teoría y escritura, con ambos presentes", () => {
    SEEDS.forEach((seed) => {
      const types = generateSession("expert", seed).map((e) => e.type);
      expect(types).toContain("theory");
      expect(types).toContain("write");
      // 10 ejercicios alternando entre dos tipos: 5 de cada uno.
      expect(types.filter((t) => t === "write")).toHaveLength(5);
    });
  });
});

describe("parImpar — easy (visual)", () => {
  it("mantiene el rango de 2 a 10 objetos pensado para contar", () => {
    SEEDS.forEach((seed) => {
      generateSession("easy", seed).forEach((ex) => {
        expect(ex.number).toBeGreaterThanOrEqual(2);
        expect(ex.number).toBeLessThanOrEqual(10);
        expect(ex.visualItems?.count).toBe(ex.number);
        expect(ex.visualItems?.emoji).toBeTruthy();
      });
    });
  });

  it("no repite ni cantidad ni combinación de cantidad y objeto", () => {
    SEEDS.forEach((seed) => {
      const keyOf = (ex: ParImparExercise) => `${ex.number}-${ex.visualItems?.emoji}`;
      const keys = generateSession("easy", seed).map(keyOf);
      expect(new Set(keys).size).toBe(10);
    });
  });

  it("la respuesta coincide con la paridad de la cantidad", () => {
    SEEDS.forEach((seed) => {
      generateSession("easy", seed).forEach((ex) => {
        expect(ex.answer).toBe(ex.number % 2 === 0 ? "par" : "impar");
      });
    });
  });

  it("ofrece las dos opciones con su explicación para 1.º", () => {
    const [ex] = generateSession("easy", 42);
    expect(ex.options?.map((o) => o.value)).toEqual(["par", "impar"]);
    expect(ex.options?.[0].label).toContain("tienen pareja");
    expect(ex.options?.[1].label).toContain("sobra uno");
  });
});

describe("parImpar — medium (select)", () => {
  it("presenta 4 opciones distintas, una correcta y tres de la paridad contraria", () => {
    SEEDS.forEach((seed) => {
      generateSession("medium", seed).forEach((ex) => {
        const values = (ex.options ?? []).map((o) => o.value);
        expect(values).toHaveLength(4);
        expect(new Set(values).size).toBe(4);
        expect(values).toContain(ex.answer);

        const correct = Number(ex.answer);
        const asked = isOdd(correct) ? "IMPAR" : "PAR";
        expect(ex.question).toContain(asked);

        values.forEach((v) => {
          const n = Number(v);
          if (v === ex.answer) return;
          expect(isOdd(n)).toBe(!isOdd(correct));
        });
      });
    });
  });

  it("mantiene los números dentro del 0-30", () => {
    SEEDS.forEach((seed) => {
      generateSession("medium", seed).forEach((ex) => {
        (ex.options ?? []).forEach((o) => {
          const n = Number(o.value);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(30);
        });
      });
    });
  });
});

describe("parImpar — hard (rule)", () => {
  it("clasifica números del 30 al 99 con la respuesta correcta", () => {
    SEEDS.forEach((seed) => {
      generateSession("hard", seed).forEach((ex) => {
        expect(ex.number).toBeGreaterThanOrEqual(30);
        expect(ex.number).toBeLessThanOrEqual(99);
        expect(ex.answer).toBe(isOdd(ex.number) ? "impar" : "par");
        expect(ex.options?.map((o) => o.value)).toEqual(["par", "impar"]);
      });
    });
  });

  it("no clasifica dos veces el mismo número", () => {
    SEEDS.forEach((seed) => {
      const numbers = generateSession("hard", seed).map((ex) => ex.number);
      expect(new Set(numbers).size).toBe(10);
    });
  });
});

describe("parImpar — expert", () => {
  it("las preguntas de teoría declaran la respuesta correcta", () => {
    SEEDS.forEach((seed) => {
      generateSession("expert", seed)
        .filter((ex) => ex.type === "theory")
        .forEach((ex) => {
          // par + par = par, impar + impar = par, par + impar = impar.
          const expected = ex.question.includes("un número PAR y uno IMPAR") ? "impar" : "par";
          expect(ex.answer).toBe(expected);
          expect(ex.options?.map((o) => o.value)).toEqual(["par", "impar"]);
        });
    });
  });

  it("las tres teoría de par/impar cubren las tres reglas", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      generateSession("expert", seed)
        .filter((ex) => ex.type === "theory")
        .forEach((ex) => seen.add(ex.question));
    }
    expect(seen.size).toBe(3);
  });

  it("la escritura ofrece solo números de la paridad pedida dentro del rango", () => {
    SEEDS.forEach((seed) => {
      generateSession("expert", seed)
        .filter((ex) => ex.type === "write")
        .forEach((ex) => {
          const valid = ex.extraData?.validAnswers ?? [];
          expect(valid.length).toBeGreaterThan(0);

          const wantsOdd = ex.question.includes("IMPAR");
          const bounds = ex.question.match(/entre (\d+) y (\d+)/);
          expect(bounds).not.toBeNull();
          const start = Number(bounds![1]);
          const end = Number(bounds![2]);

          valid.forEach((v) => {
            const n = Number(v);
            expect(isOdd(n)).toBe(wantsOdd);
            expect(n).toBeGreaterThan(start);
            expect(n).toBeLessThan(end);
            expect(v).toBe(String(n));
          });

          // `answer` es la primera de las válidas, como en el original.
          expect(ex.answer).toBe(valid[0]);
        });
    });
  });

  it("el rango de escritura ofrece 3 impares o 2 pares, según lo pedido", () => {
    SEEDS.forEach((seed) => {
      generateSession("expert", seed)
        .filter((ex) => ex.type === "write")
        .forEach((ex) => {
          const valid = ex.extraData?.validAnswers ?? [];
          // El rango va de start+1 a start+5 y `start` es múltiplo de 10, así
          // que start+1 es impar: 3 impares y 2 pares.
          expect(valid).toHaveLength(ex.question.includes("IMPAR") ? 3 : 2);
          valid.forEach((v) => expect(v).toHaveLength(2));
        });
    });
  });
});

describe("parImpar — requiresWriting", () => {
  it("solo la marca el ejercicio de escritura", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        expect(requiresWriting(ex)).toBe(ex.type === "write");
      });
    });
  });

  it("no aparece ningún ejercicio de escritura fuera de expert", () => {
    (["easy", "medium", "hard"] as const).forEach((diff) => {
      expect(generateSession(diff, 42).some(requiresWriting)).toBe(false);
    });
  });
});

describe("parImpar — validateAnswer", () => {
  it("acepta la respuesta canónica y rechaza el resto", () => {
    const ex = generateSession("hard", 42)[0];
    expect(validateAnswer(ex, ex.answer)).toBe(true);
    expect(validateAnswer(ex, ex.answer === "par" ? "impar" : "par")).toBe(false);
    expect(validateAnswer(ex, "")).toBe(false);
  });

  it("acepta cualquier número válido en el ejercicio de escritura", () => {
    const write = generateSession("expert", 42).find((ex) => ex.type === "write")!;
    const valid = write.extraData!.validAnswers!;
    valid.forEach((v) => expect(validateAnswer(write, v)).toBe(true));
    expect(validateAnswer(write, "4")).toBe(false);
  });

  it("tolera espacios alrededor de la respuesta", () => {
    const write = generateSession("expert", 42).find((ex) => ex.type === "write")!;
    expect(validateAnswer(write, ` ${write.answer} `)).toBe(true);

    const ex = generateSession("easy", 42)[0];
    expect(validateAnswer(ex, ` ${ex.answer} `)).toBe(true);
  });

  it("el tipo visual compara contra las etiquetas de par/impar, no contra el número", () => {
    const ex = generateSession("easy", 42)[0];
    expect(validateAnswer(ex, ex.answer)).toBe(true);
    expect(validateAnswer(ex, String(ex.number))).toBe(false);
  });
});
