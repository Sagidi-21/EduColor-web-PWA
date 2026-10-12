import { describe, it, expect } from "vitest";
import {
  generateSession,
  validateAnswer,
  MAS_ITEMS,
  MENOS_ITEMS,
  LITRO_ITEMS,
  itemFolder,
} from "./elLitro";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const SEEDS = [1, 7, 42, 99, 123, 999983];

describe("elLitro — catálogos de recipientes", () => {
  it("no tiene nombres duplicados dentro de cada categoría", () => {
    [MAS_ITEMS, MENOS_ITEMS, LITRO_ITEMS].forEach((pool) => {
      expect(new Set(pool.map((i) => i.name)).size).toBe(pool.length);
    });
  });

  it("no repite un nombre entre las tres categorías", () => {
    const all = [...MAS_ITEMS, ...MENOS_ITEMS, ...LITRO_ITEMS].map((i) => i.name);
    expect(new Set(all).size).toBe(all.length);
  });

  it("cada elemento declara un fichero de imagen .png no vacío", () => {
    [...MAS_ITEMS, ...MENOS_ITEMS, ...LITRO_ITEMS].forEach((item) => {
      expect(item.file.length).toBeGreaterThan(0);
      expect(item.file.endsWith(".png")).toBe(true);
    });
  });

  it("cada elemento apunta a la carpeta que le corresponde", () => {
    MAS_ITEMS.forEach((i) => expect(itemFolder(i)).toBe("+litro"));
    LITRO_ITEMS.forEach((i) => expect(itemFolder(i)).toBe("litro"));
    MENOS_ITEMS.forEach((i) => expect(itemFolder(i)).toBe("-litro"));
  });

  it("tiene suficientes recipientes para 10 ejercicios sin repetir", () => {
    expect(MAS_ITEMS.length + MENOS_ITEMS.length).toBeGreaterThanOrEqual(10);
  });
});

describe("elLitro — generateSession", () => {
  it("genera 10 ejercicios en las cuatro dificultades", () => {
    DIFFICULTIES.forEach((diff) => {
      SEEDS.forEach((seed) => {
        expect(generateSession(diff, seed)).toHaveLength(10);
      });
    });
  });

  it("mantiene el invariante de 10 en un barrido amplio de 400 seeds", () => {
    // Sustituye a la red de seguridad que se quito del motor: en vez de
    // asegurar el invariante en tiempo de ejecucion, se demuestra con
    // evidencia que el bucle siempre llega a 10.
    DIFFICULTIES.forEach((diff) => {
      for (let seed = 0; seed < 400; seed++) {
        expect(generateSession(diff, seed), `dificultad ${diff}, seed ${seed}`).toHaveLength(10);
      }
    });
  });

  it("nunca produce dos ejercicios idénticos consecutivos en el barrido", () => {
    DIFFICULTIES.forEach((diff) => {
      for (let seed = 0; seed < 200; seed++) {
        const list = generateSession(diff, seed);
        const key = (ex: (typeof list)[number]) =>
          `${ex.type}:${ex.items.map((x) => x.name).join("|")}`;
        for (let i = 1; i < list.length; i++) {
          expect(key(list[i]), `dificultad ${diff}, seed ${seed}, ejercicio ${i}`).not.toBe(
            key(list[i - 1]),
          );
        }
      }
    });
  });

  it("es determinista con la misma seed", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 123)).toEqual(generateSession(diff, 123));
    });
  });

  it("produce sesiones distintas con seeds distintas", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 1)).not.toEqual(generateSession(diff, 2));
    });
  });

  it("easy solo clasifica", () => {
    SEEDS.forEach((seed) => {
      generateSession("easy", seed).forEach((ex) => expect(ex.type).toBe("classify"));
    });
  });

  it("medium usa clasificar y cuál tiene más", () => {
    SEEDS.forEach((seed) => {
      const types = new Set(generateSession("medium", seed).map((ex) => ex.type));
      expect(types.has("classify")).toBe(true);
      expect(types.has("which-more")).toBe(true);
      expect(types.has("which-less")).toBe(false);
    });
  });

  it("expert mezcla los tres tipos", () => {
    const types = new Set(generateSession("expert", 42).map((ex) => ex.type));
    expect(types).toEqual(new Set(["classify", "which-more", "which-less"]));
  });

  it("clasificar: la respuesta coincide con la categoría del recipiente", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        if (ex.type !== "classify") return;
        const item = ex.items[0];
        expect(ex.items).toHaveLength(1);
        expect(ex.options).toEqual(["Más de 1 L", "Menos de 1 L"]);
        expect(ex.answer).toBe(item.category === "mas" ? "Más de 1 L" : "Menos de 1 L");
        expect(ex.question).toMatch(/^¿(El|La) /);
        expect(ex.question).toContain(item.name);
        expect(ex.question).toContain("tiene más o menos de 1 litro?");
      });
    });
  });

  it("comparar: la respuesta es siempre uno de los dos recipientes mostrados", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        if (ex.type === "classify") return;
        expect(ex.items).toHaveLength(2);
        const names = ex.items.map((i) => i.name);
        expect(new Set(names).size).toBe(2);
        const labels = ex.options.map((o) => o.toLowerCase());
        expect(labels).toHaveLength(2);
        expect(labels).toContain(ex.answer.toLowerCase());
        expect(ex.question).toBe(
          ex.type === "which-more"
            ? "¿Cuál tiene más de 1 litro?"
            : "¿Cuál tiene menos de 1 litro?",
        );
      });
    });
  });

  it("comparar: en which-more gana el recipiente grande y en which-less el pequeño", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 7).forEach((ex) => {
        if (ex.type === "classify") return;
        const [first, second] = ex.items;
        const [big, small] = first.category === "mas" ? [first, second] : [second, first];
        expect(big.category).toBe("mas");
        expect(small.category).toBe("menos");
        const expected = ex.type === "which-more" ? big.name : small.name;
        expect(ex.answer).toBe(expected.charAt(0).toUpperCase() + expected.slice(1));
      });
    });
  });

  it("nunca repite dos ejercicios idénticos consecutivos", () => {
    DIFFICULTIES.forEach((diff) => {
      SEEDS.forEach((seed) => {
        const list = generateSession(diff, seed);
        for (let i = 1; i < list.length; i++) {
          const prev = list[i - 1];
          const cur = list[i];
          const sameItems =
            cur.items.map((x) => x.name).join("|") === prev.items.map((x) => x.name).join("|");
          expect(sameItems && cur.type === prev.type).toBe(false);
        }
      });
    });
  });

  it("ningún recipiente se clasifica con una capacidad contradictoria", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 21).forEach((ex) => {
        if (ex.type !== "classify") return;
        const cat = ex.items[0].category;
        expect(["mas", "menos"]).toContain(cat);
        expect(ex.answer).toBe(cat === "mas" ? "Más de 1 L" : "Menos de 1 L");
      });
    });
  });
});

describe("elLitro — validateAnswer", () => {
  it("acepta la respuesta correcta y rechaza el resto", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        expect(validateAnswer(ex, "quiza")).toBe(false);
      });
    });
  });

  it("tolera espacios y mayúsculas/minúsculas", () => {
    generateSession("easy", 42).forEach((ex) => {
      expect(validateAnswer(ex, `  ${ex.answer.toUpperCase()}  `)).toBe(true);
    });
  });
});
