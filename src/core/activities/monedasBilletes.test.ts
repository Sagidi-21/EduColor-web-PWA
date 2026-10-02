import { describe, expect, it } from "vitest";
import {
  BILLETES,
  descomponer,
  formatearCentes,
  generateSession,
  MONEDAS,
  pagoExacto,
  PRODUCTOS,
  SESSION_SIZE,
  TODO_EL_DINERO,
  totalCesta,
  validateAnswer,
} from "./monedasBilletes";
import type {
  ChangeExercise,
  EquivalenceExercise,
  IdentifyExercise,
  MonedasExercise,
  ShoppingExercise,
} from "./monedasBilletes";
import type { ActivityDifficulty } from "../content/contracts";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

const todas = DIFICULTADES.flatMap((dificultad) =>
  SEMILLAS.map((semilla) => ({ dificultad, exercises: generateSession(dificultad, semilla) })),
);

/** Los ejercicios de opción múltiple, que son los que se contestan con botones. */
const conBoton = (exercises: MonedasExercise[]) =>
  exercises.filter(
    (ex): ex is IdentifyExercise | EquivalenceExercise | ChangeExercise => ex.type !== "shopping",
  );

describe("monedasBilletes — el catálogo de dinero", () => {
  it("tiene las ocho monedas de euro y los cuatro billetes de 5 a 50", () => {
    expect(MONEDAS.map((m) => m.valor)).toEqual([1, 2, 5, 10, 20, 50, 100, 200]);
    expect(BILLETES.map((m) => m.valor)).toEqual([500, 1000, 2000, 5000]);
    // Los de 100 € y 200 € están en `src/assets` y no se usan, como en el
    // original: son demasiado para el curso.
    expect(TODO_EL_DINERO.some((m) => m.valor >= 10000)).toBe(false);
  });

  it("cada pieza declara un fichero distinto y coherente con su valor", () => {
    const ficheros = TODO_EL_DINERO.map((m) => m.fichero);
    expect(new Set(ficheros).size).toBe(ficheros.length);
    for (const moneda of MONEDAS) expect(moneda.tipo).toBe("moneda");
    for (const billete of BILLETES) expect(billete.tipo).toBe("billete");
  });

  it("cada pieza se escribe como la escribe el niño", () => {
    for (const pieza of TODO_EL_DINERO) expect(pieza.corta).toBe(formatearCentes(pieza.valor));
  });

  it("formatea los céntimos con el criterio del original", () => {
    expect(formatearCentes(5)).toBe("5c");
    expect(formatearCentes(99)).toBe("99c");
    expect(formatearCentes(100)).toBe("1€");
    expect(formatearCentes(150)).toBe("1,50€");
    expect(formatearCentes(5000)).toBe("50€");
  });
});

describe("monedasBilletes — descomponer", () => {
  it("descompone un importe en las piezas más grandes, y suma exactamente", () => {
    for (const importe of [1, 2, 5, 7, 30, 45, 95, 100, 150, 205, 300, 500, 750, 1000, 2500]) {
      const piezas = descomponer(importe);
      expect(totalCesta(piezas), `descomponer(${importe})`).toBe(importe);
    }
  });

  it("prefiere el billete grande antes que un montón de monedas", () => {
    // Es lo que se hace al pagar en un mostrador, y sin eso un pago de 5 € se
    // pintaría como 25 monedas de 20 céntimos.
    expect(descomponer(500).map((p) => p.corta)).toEqual(["5€"]);
    expect(descomponer(700).map((p) => p.corta)).toEqual(["5€", "2€"]);
    expect(descomponer(1200).map((p) => p.corta)).toEqual(["10€", "2€"]);
  });

  it("nunca devuelve una lista vacía para un importe positivo", () => {
    expect(descomponer(1)).toHaveLength(1);
    expect(descomponer(5000)).toHaveLength(1);
  });
});

describe("monedasBilletes — generateSession", () => {
  it("completa la sesión de 10 ejercicios en las cuatro dificultades", () => {
    for (const { dificultad, exercises } of todas) {
      expect(exercises, dificultad).toHaveLength(SESSION_SIZE);
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("el nivel fácil trae monedas y solo monedas; el medio, también billetes", () => {
    for (const semilla of SEMILLAS) {
      const faciles = generateSession("easy", semilla) as IdentifyExercise[];
      expect(new Set(faciles.map((ex) => ex.item.tipo)), `easy/${semilla}`).toEqual(
        new Set(["moneda"]),
      );
      const medios = generateSession("medium", semilla) as IdentifyExercise[];
      expect(new Set(medios.map((ex) => ex.item.tipo)), `medium/${semilla}`).toEqual(
        new Set(["moneda", "billete"]),
      );
    }
  });

  it("el enunciado de identificar nombra la pieza que se enseña", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises as IdentifyExercise[]) {
        if (ex.type !== "identify") continue;
        expect(ex.question).toBe(
          ex.item.tipo === "moneda" ? "¿Cuánto vale esta moneda?" : "¿Cuánto vale este billete?",
        );
      }
    }
  });

  it("no repite la misma pieza seguida, y agota la baraja antes de repetir", () => {
    for (const dificultad of ["easy", "medium"] as const) {
      const pool = dificultad === "easy" ? MONEDAS : TODO_EL_DINERO;
      for (const semilla of SEMILLAS) {
        const items = (generateSession(dificultad, semilla) as IdentifyExercise[]).map(
          (ex) => ex.item,
        );
        for (let i = 1; i < items.length; i++) {
          expect(items[i], `${dificultad}/${semilla} repite ${items[i]!.corta} seguidas`).not.toBe(
            items[i - 1],
          );
        }
        // Con diez ejercicios y ocho monedas solo se puede repetir alguna, pero
        // las ocho tienen que salir: es la hoja completa del nivel.
        expect(new Set(items).size, `${dificultad}/${semilla}`).toBe(Math.min(pool.length, 10));
      }
    }
  });

  it("el nivel difícil alterna equivalencia y cambio, sin que falte ninguna", () => {
    // Con el `rng() < 0.5` del original una hoja podía salir de diez
    // equivalencias, sin un solo cambio.
    for (const semilla of SEMILLAS) {
      const tipos = generateSession("hard", semilla).map((ex) => ex.type);
      expect(tipos, `hard/${semilla}`).toEqual(
        tipos.map((_, i) => (i % 2 === 0 ? "equivalence" : "change")),
      );
      expect(new Set(tipos).size).toBe(2);
    }
  });

  it("la equivalencia suma entre dos y cuatro monedas, y el total es el de la respuesta", () => {
    for (const { exercises } of todas) {
      for (const ex of exercises as EquivalenceExercise[]) {
        if (ex.type !== "equivalence") continue;
        expect(ex.items.length).toBeGreaterThanOrEqual(2);
        expect(ex.items.length).toBeLessThanOrEqual(4);
        for (const item of ex.items) expect(item.tipo).toBe("moneda");
        expect(totalCesta(ex.items)).toBe(ex.totalCents);
        expect(ex.answer).toBe(formatearCentes(ex.totalCents));
      }
    }
  });

  it("el precio nunca es cero y ningún producto repite en la hoja de compras", () => {
    for (const { exercises } of todas) {
      const compras = exercises as ShoppingExercise[];
      for (const ex of compras) {
        if (ex.type !== "shopping") continue;
        expect(ex.precio).toBeGreaterThan(0);
        expect(ex.precioLabel).toBe(formatearCentes(ex.precio));
      }
      const nombres = compras
        .filter((ex): ex is ShoppingExercise => ex.type === "shopping")
        .map((ex) => ex.producto.nombre);
      if (nombres.length > 1) expect(new Set(nombres).size).toBe(nombres.length);
    }
  });

  it("la hoja de compras trae los diez productos, con el dinero que cabe en dos veces el precio", () => {
    for (const semilla of SEMILLAS) {
      const compras = generateSession("expert", semilla) as ShoppingExercise[];
      expect(compras).toHaveLength(PRODUCTOS.length);
      expect(new Set(compras.map((ex) => ex.producto.nombre)).size).toBe(PRODUCTOS.length);
      for (const ex of compras) {
        expect(ex.disponibles.length).toBeGreaterThan(0);
        for (const pieza of ex.disponibles) {
          expect(pieza.valor, `${ex.producto.nombre}: ${pieza.corta}`).toBeLessThanOrEqual(
            ex.precio * 2,
          );
          expect(pieza.valor).toBeLessThanOrEqual(2000);
        }
        // El precio siempre se puede pagar con lo que hay en el monedero: si
        // alguna vez no se pudiera, el ejercicio sería imposible de resolver.
        for (const pieza of descomponer(ex.precio)) {
          expect(
            ex.disponibles,
            `${ex.producto.nombre} no tiene ${pieza.corta} para pagar ${ex.precioLabel}`,
          ).toContain(pieza);
        }
      }
    }
  });
});

describe("monedasBilletes — la vuelta", () => {
  const vueltas = (exercises: MonedasExercise[]): ChangeExercise[] =>
    exercises.filter((ex): ex is ChangeExercise => ex.type === "change");

  it("el pago es siempre mayor que el precio, así que el cambio nunca es cero", () => {
    // El original redondeaba el pago hacia arriba y a veces no le sumaba nada
    // más, con lo que llegaba a pagar el precio exacto y la respuesta era 0.
    let vistas = 0;
    for (const { exercises } of todas) {
      for (const ex of vueltas(exercises)) {
        vistas++;
        expect(ex.pagadoCents, ex.question).toBeGreaterThan(ex.precio);
        expect(ex.cambioCents).toBe(ex.pagadoCents - ex.precio);
        expect(ex.cambioCents).toBeGreaterThan(0);
        expect(ex.answer).toBe(formatearCentes(ex.cambioCents));
        expect(ex.answer).not.toBe("0c");
      }
    }
    expect(vistas, "No ha salido ningún ejercicio de cambio").toBeGreaterThan(0);
  });

  it("el enunciado nombra el pago, el precio y el cambio que se pide", () => {
    for (const { exercises } of todas) {
      for (const ex of vueltas(exercises)) {
        expect(ex.question).toBe(`Pagas con ${ex.pagadoLabel}. ¿Cuánto cambio recibes?`);
        expect(ex.precioLabel).toBe(formatearCentes(ex.precio));
      }
    }
  });

  it("el pago se enseña con las piezas que lo componen, y suman el pago", () => {
    for (const { exercises } of todas) {
      for (const ex of vueltas(exercises)) {
        expect(ex.pagado.length, ex.question).toBeGreaterThan(0);
        expect(totalCesta(ex.pagado)).toBe(ex.pagadoCents);
        for (const pieza of ex.pagado) expect(TODO_EL_DINERO).toContain(pieza);
      }
    }
  });

  it("nunca hay dos ejercicios de cambio con el mismo producto", () => {
    for (const { exercises } of todas) {
      const nombres = vueltas(exercises).map((ex) => ex.producto.nombre);
      expect(new Set(nombres).size).toBe(nombres.length);
    }
  });
});

describe("monedasBilletes — las opciones", () => {
  it("la respuesta correcta está entre las opciones, y solo una vez", () => {
    for (const { exercises } of todas) {
      for (const ex of conBoton(exercises)) {
        expect(ex.options, `${ex.type}: ${ex.question}`).toContain(ex.answer);
        expect(new Set(ex.options).size).toBe(ex.options.length);
      }
    }
  });

  it("siempre ofrece cuatro opciones", () => {
    for (const { exercises } of todas) {
      for (const ex of conBoton(exercises)) {
        expect(ex.options, `${ex.type}: ${ex.question}`).toHaveLength(4);
      }
    }
  });

  it("los distractores se parecen a la respuesta: son importes o piezas del catálogo", () => {
    for (const { exercises } of todas) {
      for (const ex of conBoton(exercises)) {
        for (const opcion of ex.options) {
          if (ex.type === "identify") {
            expect(
              TODO_EL_DINERO.map((m) => m.corta),
              opcion,
            ).toContain(opcion);
          } else {
            // Un importe, ni cero ni el mismo dos veces.
            expect(opcion).toMatch(/^\d+(,\d\d)?(c|€)$/);
            expect(opcion).not.toBe("0c");
          }
        }
      }
    }
  });

  it("las opciones no salen siempre ordenadas", () => {
    // El original las ordenaba con `sort`, así que la respuesta se leía por la
    // posición y no por el dinero.
    let desordenadas = 0;
    for (const { exercises } of todas) {
      for (const ex of conBoton(exercises)) {
        if (ex.options.join() !== [...ex.options].sort().join()) desordenadas++;
      }
    }
    expect(desordenadas, "Las opciones siempre han salido ordenadas").toBeGreaterThan(0);
  });

  it("la posición de la correcta no es siempre la misma", () => {
    const posiciones = new Set<number>();
    for (let semilla = 1; semilla <= 30; semilla++) {
      for (const ex of conBoton(generateSession("hard", semilla))) {
        posiciones.add(ex.options.indexOf(ex.answer));
      }
    }
    expect(posiciones.size, "La correcta siempre cae en el mismo botón").toBeGreaterThan(1);
  });
});

describe("monedasBilletes — validateAnswer y pagoExacto", () => {
  it("validateAnswer solo acepta la respuesta correcta", () => {
    for (const { exercises } of todas) {
      for (const ex of conBoton(exercises)) {
        expect(validateAnswer(ex, ex.answer), ex.question).toBe(true);
        for (const opcion of ex.options.filter((o) => o !== ex.answer)) {
          expect(validateAnswer(ex, opcion), `${ex.type}: ${opcion}`).toBe(false);
        }
        expect(validateAnswer(ex, "")).toBe(false);
      }
    }
  });

  it("pagoExacto solo da el acierto con el importe exacto", () => {
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla) as ShoppingExercise[]) {
        expect(pagoExacto(ex, ex.precio)).toBe(true);
        expect(pagoExacto(ex, ex.precio - 1)).toBe(false);
        expect(pagoExacto(ex, ex.precio + 1)).toBe(false);
        expect(pagoExacto(ex, 0)).toBe(false);
      }
    }
  });
});
