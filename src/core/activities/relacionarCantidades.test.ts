import { describe, expect, it } from "vitest";
import {
  figurasDe,
  generateRound,
  generateSession,
  isCorrectPair,
  PAREJAS_POR_PANTALLA,
  PAREJAS_POR_PANTALLA_EXPERT,
  parejasPorPantalla,
  representacion,
} from "./relacionarCantidades";
import type { ActivityDifficulty } from "../content/contracts";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Todas las parejas de todas las pantallas de una llamada. */
const parejas = (dificultad: ActivityDifficulty, semilla = 42) =>
  generateSession(dificultad, semilla, 4).flatMap((r) => r.pairs);

/** El número que aparece en el texto de una tarjeta, para contrastarlo. */
const numeros = (texto: string): number[] => (texto.match(/\d+/g) ?? []).map(Number);

describe("relacionarCantidades — representacion", () => {
  it("una caja por cien, una por diez y las unidades sueltas", () => {
    expect(representacion(0)).toEqual({ centenas: 0, decenas: 0, unidades: 0 });
    expect(representacion(7)).toEqual({ centenas: 0, decenas: 0, unidades: 7 });
    expect(representacion(10)).toEqual({ centenas: 0, decenas: 1, unidades: 0 });
    // El ejemplo del enunciado: 14 son una caja de diez y cuatro figuras.
    expect(representacion(14)).toEqual({ centenas: 0, decenas: 1, unidades: 4 });
    // Y 347, que es donde entra la caja de cien: tres de cien, cuatro de diez
    // y siete sueltas. Antes esto se resolvía con un «+34 × 10» que no se
    // entendía, y el profesor pidió las tres cajas dibujadas.
    expect(representacion(347)).toEqual({ centenas: 3, decenas: 4, unidades: 7 });
    expect(representacion(999)).toEqual({ centenas: 9, decenas: 9, unidades: 9 });
  });

  it("ni las unidades ni las decenas pasan de nueve, para que no se confundan con una caja", () => {
    for (let total = 0; total <= 999; total++) {
      const r = representacion(total);
      expect(r.unidades, `total ${total}`).toBeGreaterThanOrEqual(0);
      expect(r.unidades, `total ${total}`).toBeLessThanOrEqual(9);
      expect(r.decenas, `total ${total}`).toBeGreaterThanOrEqual(0);
      expect(r.decenas, `total ${total}`).toBeLessThanOrEqual(9);
      expect(r.centenas, `total ${total}`).toBeGreaterThanOrEqual(0);
      expect(r.centenas, `total ${total}`).toBeLessThanOrEqual(9);
    }
  });

  it("las cajas y las sueltas reconstruyen la cantidad exacta", () => {
    for (let total = 0; total <= 999; total++) {
      const r = representacion(total);
      expect(figurasDe(r), `total ${total}`).toBe(total);
    }
  });

  it("dibuja la cantidad entera: no queda nada por declarar", () => {
    // La etiqueta «+N × 10» ya no existe, así que no hay ningún tramo de la
    // cantidad que quede solo escrito. Si esto falla, alguien ha reintroducido
    // una forma de «declarar en alto» en vez de dibujar.
    for (let total = 0; total <= 999; total++) {
      const r = representacion(total);
      const dibujado = r.centenas * 100 + r.decenas * 10 + r.unidades;
      expect(dibujado, `total ${total}`).toBe(total);
    }
  });
});

describe("relacionarCantidades — cada tarjeta dibuja lo que dice", () => {
  it("la derecha dibuja la cantidad que anuncia su texto, no la que se añade o quita", () => {
    // El original guardaba en `rightCount` lo añadido o quitado mientras el
    // texto decía «Ahora tengo 25»: pintaba cinco objetos junto a un texto que
    // hablaba de veinticinco. Esta es la comprobación que lo evita.
    for (const semilla of SEMILLAS) {
      for (const par of parejas("medium", semilla)) {
        const der = numeros(par.rightText);
        const anunciado = der[der.length - 1]!;
        expect(par.derecha.total, `${par.leftText} → ${par.rightText}`).toBe(anunciado);
      }
    }
  });

  it("en fácil y difícil la derecha dibuja el cambio que anuncia", () => {
    for (const dificultad of ["easy", "hard"] as const) {
      for (const semilla of SEMILLAS) {
        for (const par of parejas(dificultad, semilla)) {
          const anunciado = numeros(par.rightText).at(-1)!;
          expect(par.derecha.total, `${dificultad}: ${par.rightText}`).toBe(anunciado);
        }
      }
    }
  });

  it("la izquierda dibuja entero lo que dice, sin recortarlo a diez figuras", () => {
    // El original pintaba `Math.min(10, cantidad)`, y «Tengo 25» salía con diez.
    // Ahora entra también `expert`: con las cajas de cien y de diez dibujadas,
    // hasta 999 sale entero y no queda nada por declarar.
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const par of parejas(dificultad, semilla)) {
          for (const cantidad of par.izquierda) {
            expect(cantidad.total, `${dificultad}: ${par.leftText}`).toBeGreaterThan(0);
            const r = representacion(cantidad.total);
            // Nada queda sin dibujar: sale entero en los cuatro niveles.
            expect(figurasDe(r), `${dificultad}: ${par.leftText}`).toBe(cantidad.total);
          }
          if (par.izquierda.length === 1) {
            // Con una sola cantidad dibujada, esa es la que da el texto.
            expect(par.izquierda[0]!.total, par.leftText).toBe(numeros(par.leftText)[0]);
          }
        }
      }
    }
  });

  it("el nivel de grupos dibuja los dos grupos que nombra el texto", () => {
    // El original solo pintaba `leftCountA`, así que el grupo B aparecía en el
    // texto y no en el dibujo.
    let vistos = 0;
    for (const semilla of SEMILLAS) {
      for (const par of parejas("hard", semilla)) {
        const [a, b] = numeros(par.leftText);
        if (par.izquierda.length !== 2) continue;
        vistos++;
        expect(par.izquierda[0]!.total, par.leftText).toBe(a);
        expect(par.izquierda[1]!.total, par.leftText).toBe(b);
        expect(par.izquierda[0]!.rotulo).toBe("Grupo A");
        expect(par.izquierda[1]!.rotulo).toBe("Grupo B");
      }
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it("el texto de la derecha y la cantidad nunca se contradicen", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const par of parejas(dificultad, semilla)) {
          const anunciado = numeros(par.rightText).at(-1);
          if (anunciado !== undefined) expect(par.derecha.total, par.rightText).toBe(anunciado);
        }
      }
    }
  });
});

describe("relacionarCantidades — pantallas", () => {
  it("trae cinco parejas por pantalla en expert y cuatro en los demás niveles", () => {
    // En `expert` (solo texto) hay 5 chips; los otros niveles conservan 4.
    for (const dificultad of DIFICULTADES) {
      const esperado = dificultad === "expert" ? PAREJAS_POR_PANTALLA_EXPERT : PAREJAS_POR_PANTALLA;
      for (const semilla of SEMILLAS) {
        for (const pantalla of generateSession(dificultad, semilla, 3)) {
          expect(pantalla.pairs, `${dificultad}/${semilla}`).toHaveLength(esperado);
          expect(pantalla.leftColumn).toHaveLength(esperado);
          expect(pantalla.rightColumn).toHaveLength(esperado);
        }
      }
    }
  });

  it("el número de parejas por pantalla es 5 solo en expert", () => {
    expect(parejasPorPantalla("expert")).toBe(5);
    expect(parejasPorPantalla("easy")).toBe(4);
    expect(parejasPorPantalla("medium")).toBe(4);
    expect(parejasPorPantalla("hard")).toBe(4);
  });

  it("las dos columnas tienen las mismas parejas, barajadas por separado", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const pantallas = generateSession(dificultad, semilla, 3);
        for (const pantalla of pantallas) {
          expect(pantalla.leftColumn.map((p) => p.id).sort()).toEqual(
            pantalla.rightColumn.map((p) => p.id).sort(),
          );
        }
        // Y al menos una de las pantallas sale barajada de verdad: con cuatro
        // parejas, que una pantalla concreta conserve el orden puede pasar por
        // casualidad, pero no pueden pasarlo todas.
        const algunaBarajada = pantallas.some(
          (p) => p.leftColumn.map((x) => x.id).join() !== p.pairs.map((x) => x.id).join(),
        );
        expect(algunaBarajada, `${dificultad}/${semilla}`).toBe(true);
      }
    }
  });

  it("todas las parejas de una pantalla tienen opciones únicas", () => {
    // Tras la modificación, comprobamos que el texto izquierdo y derecho no
    // se repita dentro de la misma pantalla para evitar ambigüedades.
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const pantallas = generateSession(dificultad, semilla, 3);
        for (const pantalla of pantallas) {
          const textosIzquierda = new Set(pantalla.pairs.map((p) => p.leftText));
          const textosDerecha = new Set(pantalla.pairs.map((p) => p.rightText));
          expect(textosIzquierda.size, `Textos izquierda únicos en ${dificultad}`).toBe(
            pantalla.pairs.length,
          );
          expect(textosDerecha.size, `Textos derecha únicos en ${dificultad}`).toBe(
            pantalla.pairs.length,
          );
        }
      }
    }
  });

  it("es determinista con la misma semilla", () => {
    expect(generateSession("medium", 42)).toEqual(generateSession("medium", 42));
    expect(generateSession("hard", 42)).not.toEqual(generateSession("hard", 43));
  });

  it("todas las parejas de una pantalla comparten imagen", () => {
    for (const dificultad of DIFICULTADES) {
      const pantalla = generateRound(dificultad, lcgStub(42));
      expect(new Set(pantalla.pairs.map((p) => p.imageUrl)).size).toBe(1);
      expect(new Set(pantalla.pairs.map((p) => p.objectLabel)).size).toBe(1);
    }
  });

  it("una pareja es correcta cuando las dos tarjetas son la misma", () => {
    const pantalla = generateRound("medium", lcgStub(42));
    for (const izquierda of pantalla.pairs) {
      for (const derecha of pantalla.pairs) {
        expect(isCorrectPair(izquierda, derecha)).toBe(izquierda.id === derecha.id);
      }
    }
  });
});

describe("relacionarCantidades — rangos de cada dificultad", () => {
  it("fácil no pasa de 10 y su cambio es menor que 10", () => {
    for (const par of parejas("easy")) {
      const [tengo, quiero] = numeros(par.leftText);
      expect(tengo!).toBeLessThanOrEqual(10);
      expect(quiero!).toBeLessThanOrEqual(10);
      expect(quiero! - tengo!).toBe(par.derecha.total);
      expect(par.derecha.total).toBeGreaterThan(0);
    }
  });

  it("medio añade y quita sin salir de 30 y sin quedarse sin nada", () => {
    for (const par of parejas("medium")) {
      const anade = /Añado/.test(par.leftText);
      const [cantidad, cambio] = numeros(par.leftText);
      const final = par.derecha.total;
      // Y la cuenta sale: el enunciado nunca afirma una suma falsa.
      expect(final, par.leftText).toBe(anade ? cantidad! + cambio! : cantidad! - cambio!);
      if (anade) {
        expect(final, par.leftText).toBeLessThanOrEqual(30);
      } else {
        expect(final, par.leftText).toBeGreaterThan(0);
      }
    }
  });

  it("difícil trabaja con grupos de 20 a 45 y diferencias de hasta 50", () => {
    for (const par of parejas("hard")) {
      for (const cantidad of par.izquierda) {
        expect(cantidad.total).toBeLessThanOrEqual(45);
      }
      expect(par.derecha.total).toBeGreaterThan(0);
      expect(par.derecha.total).toBeLessThanOrEqual(40);
    }
  });

  it("experto llega hasta 999 y la derecha son las unidades", () => {
    for (const semilla of SEMILLAS) {
      for (const par of parejas("expert", semilla)) {
        const [total] = numeros(par.leftText);
        expect(total!).toBeLessThanOrEqual(999);
        // «3 C + 4 D + 7 U» o «4 D + 7 U»: las partes dependen de cuántas haya.
        const partes = par.rightText.split(/[+]/).map((p) => numeros(p)[0]!);
        const esperado = partes.reduce((total, parte, i) => {
          const valor = Math.pow(10, partes.length - 1 - i);
          return total + parte * valor;
        }, 0);
        expect(total!, par.rightText).toBe(esperado);
        // La derecha dibuja las unidades, que es la parte que se ve.
        expect(par.derecha.total).toBe(partes.at(-1));
      }
    }
  });

  it("en experto la cantidad de tres cifras sale entera en cajas de cien y de diez", () => {
    // Antes, a partir de cinco cajas de diez, el resto se declaraba con un
    // «+N × 10». Ahora no hay nada que declarar: 457 son cuatro cajas de cien,
    // cinco de diez y siete figuras sueltas.
    let conCajaDeCien = 0;
    for (const semilla of SEMILLAS) {
      for (const par of parejas("expert", semilla)) {
        const [total] = numeros(par.leftText);
        const r = representacion(total!);
        expect(figurasDe(r), par.leftText).toBe(total);
        if (r.centenas > 0) conCajaDeCien++;
      }
    }
    expect(conCajaDeCien).toBeGreaterThan(0);
  });
});

/** Un LCG con la misma semilla que el motor, para pasar una pantalla suelta. */
function lcgStub(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
