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
  it("laberintoMatematico dibuja el tablero SVG; soluciones solo la respuesta", () => {
    for (const id of ["laberintoMatematico", "laberintoMatematico2"]) {
      everyDifficulty(id, (alumno, soluciones) => {
        expect(alumno).toContain("ficha-laberinto__svg");
        expect(alumno).not.toContain("ficha-answer");
        expect(soluciones).toContain("ficha-answer");
        expect(soluciones).not.toContain("ficha-laberinto__svg");
      });
    }
  });

  it("rutaCuadricula dibuja la cuadrícula y casillas de flechas; soluciones solo la ruta", () => {
    everyDifficulty("rutaCuadricula", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-ruta__svg");
      expect(alumno).toContain("ficha-ruta__box");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-ruta__svg");
    });
  });

  it("rutaCuadricula sin imágenes no usa emojis en la leyenda", () => {
    const alumno = html("rutaCuadricula", "easy", "alumno", false);
    expect(alumno).toContain("ficha-ruta__svg");
    expect(alumno).not.toContain("🚶");
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

  it("balanzaEquilibra muestra la paleta de pesas; soluciones solo la respuesta", () => {
    everyDifficulty("balanzaEquilibra", (alumno, soluciones) => {
      expect(alumno).toContain("ficha-balanza-eq__palette");
      expect(alumno).toContain("ficha-balanza-eq__fill");
      expect(soluciones).toContain("ficha-answer");
      expect(soluciones).not.toContain("ficha-balanza-eq__palette");
    });
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
