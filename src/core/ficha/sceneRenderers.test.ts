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

  it("leftRight: alumno con ○ / cajas; soluciones solo la respuesta", () => {
    everyDifficulty("leftRight", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-leftright");
      expect(alumno).not.toContain("ficha-answer");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-leftright__scene");
      expect(soluciones).not.toContain("ficha-leftright__pair");
    });
  });
});
