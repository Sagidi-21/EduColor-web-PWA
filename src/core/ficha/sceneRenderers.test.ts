import { describe, expect, it } from "vitest";
import { generateFicha } from "./fichaGenerator";
import type { SheetConfig } from "./types";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

const cfg = (
  activityId: string,
  difficulty: SheetConfig["difficulty"],
  withImages = true,
): SheetConfig => ({
  activityId,
  difficulty,
  count: 6,
  withImages,
  seed: 7,
});

function html(
  activityId: string,
  difficulty: SheetConfig["difficulty"],
  mode: "alumno" | "soluciones",
  withImages = true,
) {
  return generateFicha({ activityId, config: cfg(activityId, difficulty, withImages), mode }).html;
}

function everyDifficulty(activityId: string, check: (alumno: string, soluciones: string) => void) {
  for (const d of DIFFICULTIES) {
    check(html(activityId, d, "alumno"), html(activityId, d, "soluciones"));
  }
}

describe("fichas con escena dibujada", () => {
  it("laberintoMatematico dibuja el tablero; soluciones rellenan casillas (sin enunciado alumno)", () => {
    for (const id of ["laberintoMatematico", "laberintoMatematico2"]) {
      everyDifficulty(id, (alumno, soluciones) => {
        expect(alumno).toContain("ficha-laberinto__svg");
        expect(alumno).toContain("ficha-laberinto__blank");
        expect(alumno).not.toContain("ficha-laberinto--sol");
        expect(soluciones).toContain("ficha-laberinto__svg");
        expect(soluciones).toContain("ficha-laberinto--sol");
        expect(soluciones).not.toContain("ficha-laberinto__blank");
        expect(soluciones).not.toContain("Haz cada operación");
      });
    }
  });

  it("rutaCuadricula dibuja la cuadrícula; soluciones = tablero con camino ejemplo + Ej.", () => {
    everyDifficulty("rutaCuadricula", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-ruta__svg");
      expect(alumno).toContain("ficha-ruta__box");
      expect(soluciones).toContain("ficha-ruta__svg");
      expect(soluciones).toContain("ficha-ruta--sol");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).toMatch(/Ej\.:/);
      expect(soluciones).not.toContain("ficha-ruta__box");
      expect(soluciones).not.toContain("ficha-ruta__question");
    });
  });

  it("rutaCuadricula siempre dibuja iconos como en pizarra (🚶 🏫 🌳)", () => {
    const conImg = html("rutaCuadricula", "easy", "alumno", true);
    const sinImg = html("rutaCuadricula", "easy", "alumno", false);
    for (const alumno of [conImg, sinImg]) {
      expect(alumno).toContain("ficha-ruta__svg");
      expect(alumno).toContain("🚶");
      expect(alumno).toContain("🏫");
      expect(alumno).toContain("🌳");
    }
  });

  it("posicionesAula dibuja la escena del aula con opciones ○", () => {
    everyDifficulty("posicionesAula", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-posiciones__svg");
      expect(alumno).toContain("ficha-posiciones__choice-mark");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-posiciones__svg");
    });
  });

  it("probabilidad dibuja la bolsa o el contexto con opciones ○", () => {
    everyDifficulty("probabilidad", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-prob__choice-mark");
      expect(alumno).toMatch(/ficha-prob__bag-svg|ficha-prob__context/);
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-prob__choices");
    });
  });

  it("capacidad dibuja recipientes o vasos; soluciones solo la respuesta", () => {
    everyDifficulty("capacidad", (alumno, soluciones) => {
      expect(alumno).toMatch(/ficha-capacidad__vessel|ficha-capacidad__cup/);
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toMatch(/ficha-capacidad__vessel|ficha-capacidad__cup/);
    });
  });

  it("balanzaEquilibra muestra paleta y hueco en la balanza; sin zona Pongo", () => {
    everyDifficulty("balanzaEquilibra", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-balanza-eq__palette");
      expect(alumno).toContain("ficha-balanza-eq__svg");
      expect(alumno).not.toContain("ficha-balanza-eq__fill");
      expect(alumno).not.toContain(">Pongo");
      // Sin interrogante en el platillo derecho (el alumno escribe en el hueco).
      expect(alumno).not.toMatch(/>\s*\?\s*</);
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-balanza-eq__palette");
    });
    // Expert: dos tipos de pesa → dos huecos en fila con kg debajo.
    const expert = html("balanzaEquilibra", "expert", "alumno");
    expect(expert).toContain("ficha-balanza-eq__svg--wide");
    expect(expert).toContain(">1 kg<");
    expect(expert).toContain(">2 kg<");
    // Soluciones expert: combinaciones con ambos tipos, separadas por |.
    const expertSol = html("balanzaEquilibra", "expert", "soluciones");
    expect(expertSol).toMatch(/\d+×1 kg/);
    expect(expertSol).toMatch(/×2 kg/);
    expect(expertSol).toContain(" | ");
  });

  it("balanza easy/medium/hard pide redondear; expert pide escribir el número", () => {
    for (const d of ["easy", "medium"] as const) {
      const alumno = html("balanza", d, "alumno");
      expect(alumno).toContain("redondea la correcta");
      expect(alumno).toContain("ficha-balanza__choices");
      expect(alumno).toContain("ficha-balanza__beam");
    }
    const hard = html("balanza", "hard", "alumno");
    expect(hard).toContain("redondea la correcta");
    expect(hard).toContain("ficha-balanza__choices");
    expect(hard).toContain("ficha-balanza__compare");
    expect(hard).not.toContain("ficha-balanza__beam");
    expect(hard).toContain("MENOS");
    expect(hard).toContain("IGUAL");
    expect(hard).toContain("MÁS");
    const medium = html("balanza", "medium", "alumno");
    expect(medium).toContain("MENOS");
    expect(medium).toContain("IGUAL");
    expect(medium).toContain("MÁS");
    const expert = html("balanza", "expert", "alumno");
    expect(expert).toContain("escribe el número correcto");
    expect(expert).not.toContain("redondea la correcta");
    expect(expert).not.toContain("ficha-balanza__choices");
    expect(html("balanza", "easy", "soluciones")).toContain("ficha-answer");
    expect(html("balanza", "easy", "soluciones")).not.toContain("ficha-balanza__beam");
  });

  it("menuCafeteria muestra la carta de precios; soluciones solo la respuesta", () => {
    everyDifficulty("menuCafeteria", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-menu__card");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-menu__card");
    });
  });

  it("reloj: alumno con reloj; soluciones sin dibujo", () => {
    for (const id of ["reloj", "relojPonerHora"]) {
      everyDifficulty(id, (alumno, soluciones) => {
        expect(alumno).toContain("ficha-reloj");
        expect(soluciones).toContain("ficha-answer");
        expect(soluciones).not.toContain("ficha-reloj__body");
      });
    }
  });

  it("reloj: easy pide redondear centrado; hard digital_read en aside", () => {
    const easy = html("reloj", "easy", "alumno");
    expect(easy).toContain("redondea la correcta");
    expect(easy).toContain("ficha-reloj--analog_to_digital");
    expect(easy).toContain("ficha-reloj--mc");

    const medium = html("reloj", "medium", "alumno");
    expect(medium).toContain("redondea la correcta");

    // Seed 7 en hard suele incluir digital_read; si no, el mapa unitario lo cubre.
    const hard = html("reloj", "hard", "alumno");
    if (hard.includes("¿Cómo se lee esta hora?")) {
      expect(hard).toContain("ficha-reloj--aside");
      expect(hard).toContain("redondea la correcta");
    }
  });

  it("leftRight: alumno con ○ / cajas; soluciones solo la respuesta", () => {
    everyDifficulty("leftRight", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-leftright");
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-leftright__scene");
      expect(soluciones).not.toContain("ficha-leftright__pair");
    });
  });

  it("monedasBilletes: easy/medium/hard con opciones; expert en 2 filas", () => {
    for (const d of ["easy", "medium", "hard"] as const) {
      const alumno = html("monedasBilletes", d, "alumno");
      expect(alumno).toContain("ficha-money__choices");
      expect(alumno).toContain("redondea la correcta");
      expect(html("monedasBilletes", d, "soluciones")).toContain("ficha-answer");
      expect(html("monedasBilletes", d, "soluciones")).not.toContain("ficha-money__choices");
    }
    const easy = html("monedasBilletes", "easy", "alumno");
    expect(easy).toContain("ficha-money--centered");
    expect(easy).toContain("ficha-money--identify");

    const expert = html("monedasBilletes", "expert", "alumno");
    expect(expert).toContain("ficha-money--shopping");
    expect(expert).toContain("ficha-money__grid");
    expect(expert).toContain("ficha-money__row--shop");
    expect(expert).not.toContain("ficha-money__choices");
  });

  it("elKilo/elLitro: siempre pide redondear (también compare en expert)", () => {
    for (const id of ["elKilo", "elLitro"] as const) {
      everyDifficulty(id, (alumno, soluciones) => {
        expect(alumno).toContain("redondea la correcta");
        expect(alumno).toContain("ficha-photo");
        expect(soluciones).toContain("ficha-answer");
        expect(soluciones).not.toContain("redondea la correcta");
        expect(soluciones).not.toContain("ficha-photo__items");
      });
    }
  });

  it("cuerpos3d: figura + opciones horizontales + hint; soluciones solo respuesta", () => {
    everyDifficulty("cuerpos3d", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-cuerpos3d__figure");
      expect(alumno).toContain("ficha-cuerpos3d__svg");
      expect(alumno).toContain("ficha-cuerpos3d__choices");
      expect(alumno).toContain("redondea la correcta");
      expect(alumno).toContain("var(--color-primary");
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-cuerpos3d__figure");
      expect(soluciones).not.toContain("ficha-cuerpos3d__choices");
      expect(soluciones).not.toContain("redondea la correcta");
    });
  });

  it("circuloCircunferencia: figura color de clase + opciones + hint; soluciones solo respuesta", () => {
    everyDifficulty("circuloCircunferencia", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-cc");
      expect(alumno).toContain("ficha-cc__choices");
      expect(alumno).toContain("redondea la correcta");
      expect(alumno).toMatch(/ficha-cc__svg|ficha-cc__emoji/);
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-cc__choices");
      expect(soluciones).not.toContain("redondea la correcta");
    });
    const easy = html("circuloCircunferencia", "easy", "alumno");
    expect(easy).toContain("var(--color-primary");
    expect(easy).toContain("ficha-cc__svg");
  });

  it("simetria: figura color de clase + hint; which-shape con dibujos; soluciones solo respuesta", () => {
    everyDifficulty("simetria", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-simetria");
      expect(alumno).toContain("redondea la correcta");
      expect(alumno).toContain("var(--color-primary");
      expect(alumno).toMatch(/ficha-simetria__figure|ficha-simetria__options/);
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-simetria__figure");
      expect(soluciones).not.toContain("ficha-simetria__options");
      expect(soluciones).not.toContain("redondea la correcta");
    });
    // medium+ incluye which-shape → figuras-opción dibujadas
    const medium = html("simetria", "medium", "alumno");
    expect(medium).toContain("ficha-simetria__options");
    expect(medium).toContain("ficha-simetria--which");
  });
});
