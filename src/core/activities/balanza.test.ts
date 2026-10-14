import { describe, expect, it } from "vitest";
import {
  generateSession,
  SESSION_SIZE,
  SESSION_TARGET,
  validateAnswer,
  WEIGHT_ITEMS,
} from "./balanza";
import type { BalanzaExercise } from "./balanza";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Todas las sesiones de todas las dificultades y semillas, para invariants generales. */
function todasLasSesiones(): { dificultad: ActivityDifficulty; sesion: BalanzaExercise[] }[] {
  return DIFFICULTIES.flatMap((dificultad) =>
    SEMILLAS.map((semilla) => ({ dificultad, sesion: generateSession(dificultad, semilla) })),
  );
}

/** Clave que identifica un ejercicio por lo que el alumno ve y tiene que responder. */
function claveDe(ex: BalanzaExercise): string {
  return [
    ex.type,
    ex.left.emoji,
    ex.left.count,
    ex.left.weightLabel ?? "",
    ex.right.emoji,
    ex.right.count,
    ex.right.weightLabel ?? "",
    ex.right.unknown,
    ex.correctAnswer,
  ].join("|");
}

describe("balanza — catálogo de pesos", () => {
  it("tiene doce objetos con emoji, nombre, género y plural", () => {
    expect(WEIGHT_ITEMS).toHaveLength(12);
    for (const item of WEIGHT_ITEMS) {
      expect(item.emoji, item.id).not.toBe("");
      expect(item.name, item.id).not.toBe("");
      expect(["m", "f"]).toContain(item.gender);
      expect(item.plural, item.id).not.toBe(item.name);
      expect(item.weightGrams, item.id).toBeGreaterThan(0);
    }
  });

  it("usa ids únicos y pesos realistas en gramos", () => {
    expect(new Set(WEIGHT_ITEMS.map((i) => i.id)).size).toBe(WEIGHT_ITEMS.length);
    // Escala coherente con kilos de aula (no 100 g un perrito frente a «2 kg»).
    WEIGHT_ITEMS.forEach((item) => {
      expect(item.weightGrams, item.id).toBeLessThanOrEqual(50000);
      expect(item.weightGrams, item.id).toBeGreaterThanOrEqual(10);
    });
    expect(WEIGHT_ITEMS.find((i) => i.id === "sandia")!.weightGrams).toBe(5000);
    expect(WEIGHT_ITEMS.find((i) => i.id === "perrito")!.weightGrams).toBeGreaterThanOrEqual(5000);
    expect(WEIGHT_ITEMS.find((i) => i.id === "manzana")!.weightGrams).toBe(200);
  });

  it("cada objeto tiene a alguien con quien compararse en `easy`", () => {
    // `easy` exige 1 kg de diferencia entre los dos objetos. Un objeto sin
    // ningún compañero a 1 kg o más se quedaría sin candidatos, así que la
    // enumeración podría devolver una sesión corta. Se comprueba que no hay
    // ningún objeto huérfano en ese sentido.
    for (const item of WEIGHT_ITEMS) {
      const compañeros = WEIGHT_ITEMS.filter(
        (otro) => otro.id !== item.id && Math.abs(otro.weightGrams - item.weightGrams) >= 1000,
      );
      expect(compañeros.length, `${item.name} no se puede comparar en \`easy\``).toBeGreaterThan(0);
    }
  });
});

describe("balanza — generateSession", () => {
  it("respeta el tamaño de sesión de cada dificultad en todas las semillas", () => {
    for (const { dificultad, sesion } of todasLasSesiones()) {
      expect(sesion.length, dificultad).toBe(SESSION_SIZE[dificultad]);
      expect(sesion.length, dificultad).toBeLessThanOrEqual(SESSION_TARGET);
      expect(sesion.length, dificultad).toBeGreaterThan(0);
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("hard", 42)).not.toEqual(generateSession("hard", 43));
  });

  it("no repite ejercicio dentro de una sesión", () => {
    for (const { dificultad, sesion } of todasLasSesiones()) {
      const claves = sesion.map(claveDe);
      expect(new Set(claves).size, dificultad).toBe(claves.length);
    }
  });

  it("usa el tipo de ejercicio que corresponde a la dificultad", () => {
    const tipoDe: Record<ActivityDifficulty, string> = {
      easy: "direct",
      medium: "scale",
      hard: "kilo",
      expert: "balance_math",
    };
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(ex.type, `${dificultad}/${semilla}`).toBe(tipoDe[dificultad]);
        }
      }
    }
  });

  it("ofrece siempre la respuesta correcta entre las opciones, sin repetir valores", () => {
    for (const { dificultad, sesion } of todasLasSesiones()) {
      for (const ex of sesion) {
        const valores = ex.options.map((o) => o.value);
        expect(valores, dificultad).toContain(String(ex.correctAnswer));
        expect(new Set(valores).size, dificultad).toBe(valores.length);
        expect(valores.length, dificultad).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("pide cuatro opciones numéricas distintas en expert", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        expect(ex.options, `seed ${semilla}`).toHaveLength(4);
        const numeros = ex.options.map((o) => Number(o.value));
        numeros.forEach((n) => expect(Number.isInteger(n), ex.correctAnswer).toBe(true));
        expect(numeros).toContain(Number(ex.correctAnswer));
        expect(Math.min(...numeros)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("los objetos pesados caen en la sesión de `hard` y los ligeros en `easy`", () => {
    // El filtrado por peso es lo que hace las dos dificultades distintas: en
    // `hard` se compara con pesas de kilo, así que solo valen objetos de aula.
    const hard = new Set(generateSession("hard", 4242).flatMap((ex) => [ex.left.emoji]));
    const easy = new Set(generateSession("easy", 4242).flatMap((ex) => [ex.left.emoji]));
    const pesados = WEIGHT_ITEMS.filter((i) => i.weightGrams > 1000).map((i) => i.emoji);
    const ligeros = WEIGHT_ITEMS.filter((i) => i.weightGrams < 50).map((i) => i.emoji);

    pesados.forEach((emoji) => expect(hard, `${emoji} no es de aula`).not.toContain(emoji));
    ligeros.forEach((emoji) => expect(hard, `${emoji} no llega a medio kilo`).not.toContain(emoji));
    expect(hard.size).toBeGreaterThan(1);
    expect(easy.size).toBeGreaterThan(1);
  });
});

describe("balanza — direct (easy)", () => {
  it("pregunta por un objeto de cada lado y nunca por el mismo dos veces", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        expect(ex.left.emoji).not.toBe(ex.right.emoji);
        expect(ex.left.count).toBe(1);
        expect(ex.right.count).toBe(1);
      }
    }
  });

  it("solo ofrece parejas que se diferencian en 1 kg o más", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        expect(Math.abs(ex.leftTotalGrams - ex.rightTotalGrams)).toBeGreaterThanOrEqual(1000);
      }
    }
  });

  it("responde con el lado que pesa más, o con el otro si se preguntaba por el menos", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        const masPesado = ex.leftTotalGrams > ex.rightTotalGrams ? "left" : "right";
        const menosPesado = masPesado === "left" ? "right" : "left";
        const preguntaMas = ex.question.includes("MÁS");
        expect(ex.correctAnswer, ex.question).toBe(preguntaMas ? masPesado : menosPesado);
        expect(ex.tilt, ex.question).toBe(masPesado);
      }
    }
  });

  it("nombra los dos objetos con el artículo en el enunciado y sin él en las opciones", () => {
    // El enunciado dice "el" o "la" según el género; las opciones solo el nombre
    // («Elefante», «Bicicleta»).
    const articuloDe = (id: string) => {
      const item = WEIGHT_ITEMS.find((i) => i.id === id)!;
      return item.gender === "m" ? `el ${item.name}` : `la ${item.name}`;
    };
    const opcionDe = (id: string) => {
      const item = WEIGHT_ITEMS.find((i) => i.id === id)!;
      return item.name.charAt(0).toUpperCase() + item.name.slice(1);
    };
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("easy", semilla)) {
        const izq = WEIGHT_ITEMS.find((i) => i.emoji === ex.left.emoji)!;
        const der = WEIGHT_ITEMS.find((i) => i.emoji === ex.right.emoji)!;
        expect(ex.question, ex.question).toContain(articuloDe(izq.id));
        expect(ex.question, ex.question).toContain(articuloDe(der.id));
        expect(ex.options.map((o) => o.label)).toEqual([opcionDe(izq.id), opcionDe(der.id)]);
      }
    }
  });
});

describe("balanza — scale (medium)", () => {
  it("pone el mismo objeto en los dos platos, de 1 a 6 unidades", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("medium", semilla)) {
        expect(ex.left.emoji, ex.question).toBe(ex.right.emoji);
        for (const lado of [ex.left, ex.right]) {
          expect(lado.count).toBeGreaterThanOrEqual(1);
          expect(lado.count).toBeLessThanOrEqual(6);
        }
      }
    }
  });

  it("inclina la balanza hacia el plato con más objetos y la deja nivel si hay los mismos", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("medium", semilla)) {
        if (ex.left.count > ex.right.count) expect(ex.tilt, ex.question).toBe("left");
        else if (ex.left.count < ex.right.count) expect(ex.tilt, ex.question).toBe("right");
        else expect(ex.tilt, ex.question).toBe("equal");
      }
    }
  });

  it("responde siempre con la inclinación y ofrece las tres opciones", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("medium", semilla)) {
        expect(ex.correctAnswer).toBe(ex.tilt);
        expect(["left", "right", "equal"]).toContain(ex.correctAnswer);
        expect(ex.options.map((o) => o.value)).toEqual(["left", "right", "equal"]);
      }
    }
  });

  it("el enunciado está terminado y nombra los dos grupos", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("medium", semilla)) {
        expect(ex.question.endsWith("?")).toBe(true);
        expect(ex.question).not.toContain("...");
        expect(ex.question).toContain("IZQUIERDA");
        expect(ex.question).toContain("DERECHA");
      }
    }
  });

  it("incluye un caso de 'pesan igual' en todas las sesiones", () => {
    // Sin garantizarlo, el niño puede recorrer toda la sesión sin ver una
    // balanza equilibrada, que es justo el caso que enseña a usarla.
    for (const semilla of SEMILLAS) {
      const sesion = generateSession("medium", semilla);
      expect(sesion.filter((ex) => ex.tilt === "equal").length, `seed ${semilla}`).toBe(1);
    }
  });
});

describe("balanza — kilo (hard)", () => {
  it("pone pesas de referencia a la derecha, con su etiqueta escrita una vez", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("hard", semilla)) {
        expect(ex.right.emoji).toBe("🧱");
        expect(ex.right.weightLabel, ex.question).toMatch(/^(¼|½) kg|^[123] kg$/);
        expect(ex.right.unknown).toBe(false);
      }
    }
  });

  it("pregunta por un grupo de 1 a 4 objetos y una referencia de ¼ a 3 kg", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("hard", semilla)) {
        expect(ex.left.count).toBeGreaterThanOrEqual(1);
        expect(ex.left.count).toBeLessThanOrEqual(4);
        expect(ex.rightTotalGrams).toBeGreaterThanOrEqual(250);
        expect(ex.rightTotalGrams).toBeLessThanOrEqual(3000);
      }
    }
  });

  it("traduce la comparación de gramos a la opción de más, menos o igual", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("hard", semilla)) {
        const esperado =
          ex.leftTotalGrams > ex.rightTotalGrams
            ? "more"
            : ex.leftTotalGrams < ex.rightTotalGrams
              ? "less"
              : "equal";
        expect(ex.correctAnswer, ex.question).toBe(esperado);
        expect(ex.tilt).toBe(
          esperado === "more" ? "left" : esperado === "less" ? "right" : "equal",
        );
        expect(ex.options.map((o) => o.value)).toEqual(["more", "less", "equal"]);
      }
    }
  });

  it("la etiqueta de la opción coincide con la pesa dibujada", () => {
    // El original rotulaba cada bloque dividiendo el total entre el número de
    // bloques, así que una pesa de 2 kg se pintaba como "1 kg" repetido dos
    // veces. Aquí la referencia se escribe una vez y las opciones la repiten.
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("hard", semilla)) {
        for (const opcion of ex.options) {
          expect(opcion.label, ex.question).toContain(ex.right.weightLabel!);
        }
      }
    }
  });

  it("el caso de igualdad (2 libros = 1 kg) sale siempre", () => {
    // El enunciado pide "más, menos o igual" y una de las tres respuestas tiene
    // que ser alcanzable. Se garantiza 2×500 g = 1 kg en todas las sesiones.
    const libro = WEIGHT_ITEMS.find((i) => i.id === "libro")!;
    expect(libro.weightGrams * 2).toBe(1000);

    for (const semilla of SEMILLAS) {
      const iguales = generateSession("hard", semilla).filter(
        (ex) => ex.leftTotalGrams === ex.rightTotalGrams,
      );
      expect(iguales, `seed ${semilla}`).toHaveLength(1);
      const [ex] = iguales;
      expect(ex.left.count).toBe(2);
      expect(ex.left.emoji).toBe("📘");
      expect(ex.right.weightLabel).toBe("1 kg");
      expect(ex.correctAnswer).toBe("equal");
      expect(ex.tilt).toBe("equal");
    }
  });

  it("en hard la inclinación y la respuesta coinciden con los gramos reales", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("hard", semilla)) {
        expect(ex.leftTotalGrams).toBeGreaterThan(0);
        expect(ex.rightTotalGrams).toBeGreaterThan(0);
        if (ex.leftTotalGrams > ex.rightTotalGrams) {
          expect(ex.tilt).toBe("left");
          expect(ex.correctAnswer).toBe("more");
        } else if (ex.leftTotalGrams < ex.rightTotalGrams) {
          expect(ex.tilt).toBe("right");
          expect(ex.correctAnswer).toBe("less");
        } else {
          expect(ex.tilt).toBe("equal");
          expect(ex.correctAnswer).toBe("equal");
        }
        // Relación plausible: el grupo no es 4× más ligero/pesado que la pesa.
        expect(ex.leftTotalGrams).toBeGreaterThanOrEqual(ex.rightTotalGrams / 4);
        expect(ex.leftTotalGrams).toBeLessThanOrEqual(ex.rightTotalGrams * 4);
      }
    }
  });

  it("no ofrece dos veces el mismo par de objeto y referencia", () => {
    // Los candidatos de igualdad se apartan de la bolsa barajada, así que no
    // pueden volver a salir por la vía normal.
    for (const semilla of SEMILLAS) {
      const claves = generateSession("hard", semilla).map(
        (ex) => `${ex.left.emoji}${ex.left.count}:${ex.right.weightLabel}`,
      );
      expect(new Set(claves).size).toBe(claves.length);
    }
  });
});

describe("balanza — balance_math (expert)", () => {
  it("la equivalencia responde con el número de plátanos que equilibra las piñas", () => {
    // 1 piña = 3 plátanos, así que 2 piñas piden 6. Se comprueba contra la regla
    // enunciada, no contra un número fijado a mano.
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        if (ex.left.emoji !== "🍍") continue;
        expect(ex.correctAnswer).toBe(String(ex.left.count * 3));
        expect(ex.right.unknown).toBe(true);
        expect(ex.tilt, "el enunciado ya dice que la balanza está equilibrada").toBe("equal");
      }
    }
  });

  it("el problema de peso suma la sandía y las pesas de la izquierda", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        if (ex.left.emoji !== "🍉") continue;
        const extraKg = ex.left.weightBlocks ?? 0;
        expect(extraKg).toBeGreaterThanOrEqual(1);
        expect(ex.left.weightLabel).toBe("5 kg");
        expect(ex.left.weightBlocksLabel).toBe(`${extraKg} kg`);
        expect(Number(ex.correctAnswer)).toBe(5 + extraKg);
        // La derecha es lo que hay que deducir: bandeja vacía.
        expect(ex.right.unknown).toBe(true);
      }
    }
  });

  it("trae las tres equivalencias y los tres problemas de peso en cada sesión", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateSession("expert", semilla);
      expect(sesion.filter((ex) => ex.left.emoji === "🍍")).toHaveLength(3);
      expect(sesion.filter((ex) => ex.left.emoji === "🍉")).toHaveLength(3);
    }
  });

  it("las opciones numéricas nunca ofrecen cero ni negativos", () => {
    // Con los valores de `expert` la guarda `candidato >= 1` nunca descarta nada
    // —el más pequeño es 3—, pero sigue estando porque la función es genérica:
    // un valor correcto de 1 llenaría el hueco con 0 y con negativos si nadie
    // lo impidiera, y esos sí aparecerían en pantalla.
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        for (const opcion of ex.options) {
          expect(Number(opcion.value), opcion.label).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});

describe("balanza — validateAnswer", () => {
  it("acepta solo el valor exacto del ejercicio", () => {
    for (const { dificultad, sesion } of todasLasSesiones()) {
      for (const ex of sesion) {
        expect(validateAnswer(ex, ex.correctAnswer), dificultad).toBe(true);
        expect(validateAnswer(ex, ""), dificultad).toBe(false);
        const falsa = ex.options.find((o) => o.value !== ex.correctAnswer)?.value;
        if (falsa) expect(validateAnswer(ex, falsa), dificultad).toBe(false);
      }
    }
  });

  it("no acepta el numero con espacios ni en otro idioma", () => {
    const [equivalencia] = generateSession("expert", 42);
    expect(validateAnswer(equivalencia, ` ${equivalencia.correctAnswer} `)).toBe(false);
    expect(validateAnswer(equivalencia, "6 plátanos")).toBe(false);
  });
});
