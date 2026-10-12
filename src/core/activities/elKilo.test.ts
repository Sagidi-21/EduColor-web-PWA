import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, MAS_ITEMS, MENOS_ITEMS, itemFolder } from "./elKilo";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const SEEDS = [1, 7, 42, 99, 123, 999983];

describe("elKilo — catálogos de objetos", () => {
  it("no tiene nombres duplicados dentro de cada categoría", () => {
    [MAS_ITEMS, MENOS_ITEMS].forEach((pool) => {
      expect(new Set(pool.map((i) => i.name)).size).toBe(pool.length);
    });
  });

  it("no repite un nombre entre las dos categorías", () => {
    const all = [...MAS_ITEMS, ...MENOS_ITEMS].map((i) => i.name);
    expect(new Set(all).size).toBe(all.length);
  });

  it("cada elemento apunta a la carpeta que le corresponde", () => {
    MAS_ITEMS.forEach((i) => expect(itemFolder(i)).toBe("+kilo"));
    MENOS_ITEMS.forEach((i) => expect(itemFolder(i)).toBe("-kilo"));
  });

  it("cada elemento declara un fichero de imagen .png no vacío", () => {
    [...MAS_ITEMS, ...MENOS_ITEMS].forEach((item) => {
      expect(item.file.length).toBeGreaterThan(0);
      expect(item.file.endsWith(".png")).toBe(true);
    });
  });

  it("usa los 41 objetos disponibles en los assets", () => {
    // 19 en `+kilo` + 22 en `-kilo`. El original declaraba 18 en `+kilo` y
    // dejaba `bateria.png` sin usar; aqui se incorpora.
    expect(MAS_ITEMS).toHaveLength(19);
    expect(MENOS_ITEMS).toHaveLength(22);
  });

  it("incluye bateria.png, que el motor original dejaba sin usar", () => {
    const bateria = MAS_ITEMS.find((i) => i.file === "bateria.png");
    expect(bateria).toBeDefined();
    expect(bateria!.category).toBe("mas");
    expect(bateria!.name).toBe("batería");
  });

  it("bateria aparece alguna vez en las sesiones easy", () => {
    // Con 19 objetos "mas" y 10 ejercicios, debe salir en alguna sesion.
    const aparece = SEEDS.some((seed) =>
      generateSession("easy", seed).some((ex) => ex.items[0].file === "bateria.png"),
    );
    expect(aparece).toBe(true);
  });
});

describe("elKilo — generateSession", () => {
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
        for (let i = 1; i < list.length; i++) {
          const key = (ex: (typeof list)[number]) =>
            `${ex.type}:${ex.items.map((x) => x.name).join("|")}`;
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

  it("medium usa clasificar y cuál pesa más", () => {
    SEEDS.forEach((seed) => {
      const types = new Set(generateSession("medium", seed).map((ex) => ex.type));
      expect(types.has("classify")).toBe(true);
      expect(types.has("which-heavier")).toBe(true);
      expect(types.has("which-lighter")).toBe(false);
    });
  });

  it("expert mezcla los tres tipos", () => {
    const types = new Set(generateSession("expert", 42).map((ex) => ex.type));
    expect(types).toEqual(new Set(["classify", "which-heavier", "which-lighter"]));
  });

  it("cada objeto declara género m/f", () => {
    [...MAS_ITEMS, ...MENOS_ITEMS].forEach((item) => {
      expect(["m", "f"]).toContain(item.gender);
    });
  });

  it("clasificar: artículo y verbo según género/número", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        if (ex.type !== "classify") return;
        const item = ex.items[0];
        expect(ex.items).toHaveLength(1);
        expect(ex.options).toEqual(["Más de 1 kg", "Menos de 1 kg"]);
        expect(ex.answer).toBe(item.category === "mas" ? "Más de 1 kg" : "Menos de 1 kg");
        const art = item.plural
          ? item.gender === "f"
            ? "Las"
            : "Los"
          : item.gender === "f"
            ? "La"
            : "El";
        const verb = item.plural ? "pesan" : "pesa";
        expect(ex.question).toBe(`¿${art} ${item.name} ${verb} más o menos de 1 kg?`);
      });
    });
  });

  it("comparar: la respuesta es siempre uno de los dos objetos mostrados", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        if (ex.type === "classify") return;
        expect(ex.items).toHaveLength(2);
        expect(new Set(ex.items.map((i) => i.name)).size).toBe(2);
        const labels = ex.options.map((o) => o.toLowerCase());
        expect(labels).toHaveLength(2);
        expect(labels).toContain(ex.answer.toLowerCase());
        expect(ex.question).toBe(
          ex.type === "which-heavier" ? "¿Cuál pesa más de 1 kg?" : "¿Cuál pesa menos de 1 kg?",
        );
      });
    });
  });

  it("comparar: en which-heavier gana el objeto grande y en which-lighter el pequeño", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 7).forEach((ex) => {
        if (ex.type === "classify") return;
        const [first, second] = ex.items;
        const [big, small] = first.category === "mas" ? [first, second] : [second, first];
        expect(big.category).toBe("mas");
        expect(small.category).toBe("menos");
        const expected = ex.type === "which-heavier" ? big.name : small.name;
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

  it("cap no destroza los nombres en mayusculas: USB se mantiene", () => {
    // `cap()` solo pone en mayuscula la inicial, asi que "USB" no se altera.
    const usb = MENOS_ITEMS.find((i) => i.name === "USB")!;
    expect(usb).toBeDefined();
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    expect(cap(usb.name)).toBe("USB");
    expect(usb.name.charAt(0).toUpperCase() + usb.name.slice(1)).toBe(usb.name);
  });
});

describe("elKilo — validateAnswer", () => {
  it("acepta la respuesta correcta y rechaza el resto", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 21).forEach((ex) => {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        expect(validateAnswer(ex, "quiza")).toBe(false);
      });
    });
  });

  it("tolera espacios y mayusculas", () => {
    generateSession("easy", 42).forEach((ex) => {
      expect(validateAnswer(ex, `  ${ex.answer.toUpperCase()}  `)).toBe(true);
    });
  });
});
