import { describe, expect, it } from "vitest";
import {
  figurasDe,
  generateRound,
  generateSession,
  isCorrectPair,
  MAX_BLOQUES,
  PAREJAS_POR_PANTALLA,
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
  it("un bloque por decena y las unidades sueltas", () => {
    expect(representacion(0)).toEqual({ bloques: 0, unidades: 0, decenasOcultas: 0 });
    expect(representacion(7)).toEqual({ bloques: 0, unidades: 7, decenasOcultas: 0 });
    expect(representacion(10)).toEqual({ bloques: 1, unidades: 0, decenasOcultas: 0 });
    // El ejemplo del enunciado: 14 son diez figuras marcadas ×10 y cuatro.
    expect(representacion(14)).toEqual({ bloques: 1, unidades: 4, decenasOcultas: 0 });
  });

  it("las unidades nunca pasan de nueve, para que no se confundan con un bloque", () => {
    for (let total = 0; total <= 300; total++) {
      const r = representacion(total);
      expect(r.unidades, `total ${total}`).toBeGreaterThanOrEqual(0);
      expect(r.unidades, `total ${total}`).toBeLessThanOrEqual(9);
    }
  });

  it("lo dibujado más lo declarado reconstruye la cantidad", () => {
    for (let total = 0; total <= 999; total++) {
      const r = representacion(total);
      const dibujado = r.bloques * 10 + r.unidades;
      const declarado = r.decenasOcultas * 10;
      expect(dibujado + declarado, `total ${total}`).toBe(total);
      expect(figurasDe(r), `total ${total}`).toBe(dibujado);
    }
  });

  it("nunca dibuja más de MAX_BLOQUES bloques", () => {
    for (let total = 0; total <= 999; total++) {
      expect(representacion(total).bloques, `total ${total}`).toBeLessThanOrEqual(MAX_BLOQUES);
    }
  });

  it("hasta 59 no hay nada que declarar, así que la tarjeta lo enseña entero", () => {
    for (let total = 0; total <= 59; total++) {
      expect(representacion(total).decenasOcultas, `total ${total}`).toBe(0);
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
    // En `expert` los números llegan a 999, así que se excluye: ahí sí puede
    // haber decenas que la tarjeta declara en vez de dibujar.
    for (const dificultad of ["easy", "medium", "hard"] as const) {
      for (const semilla of SEMILLAS) {
        for (const par of parejas(dificultad, semilla)) {
          for (const cantidad of par.izquierda) {
            expect(cantidad.total, `${dificultad}: ${par.leftText}`).toBeGreaterThan(0);
            const r = representacion(cantidad.total);
            // En estos tres niveles no hay nada que declarar: sale entero.
            expect(r.decenasOcultas, `${dificultad}: ${par.leftText}`).toBe(0);
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
  it("trae cuatro parejas por pantalla", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const pantalla of generateSession(dificultad, semilla, 3)) {
          expect(pantalla.pairs, `${dificultad}/${semilla}`).toHaveLength(PAREJAS_POR_PANTALLA);
          expect(pantalla.leftColumn).toHaveLength(PAREJAS_POR_PANTALLA);
          expect(pantalla.rightColumn).toHaveLength(PAREJAS_POR_PANTALLA);
        }
      }
    }
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
    let conDecenasOcultas = 0;
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
        if (representacion(total!).decenasOcultas > 0) conDecenasOcultas++;
      }
    }
    // Y cuando no cabe entero, la tarjeta lo declara en alto.
    expect(conDecenasOcultas).toBeGreaterThan(0);
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
