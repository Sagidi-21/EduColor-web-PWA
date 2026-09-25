import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./shapes";

describe("shapes — generateSession", () => {
  it("genera la cantidad de ejercicios correcta por dificultad", () => {
    expect(generateSession("easy", 1)).toHaveLength(10);
    expect(generateSession("medium", 1)).toHaveLength(10);
    expect(generateSession("hard", 1)).toHaveLength(10);
    expect(generateSession("expert", 1)).toHaveLength(12);
  });

  it("es determinista con la misma seed", () => {
    const a = generateSession("medium", 123);
    const b = generateSession("medium", 123);
    expect(a).toEqual(b);
  });

  it("ofrece el número correcto de opciones por dificultad", () => {
    const easy = generateSession("easy", 1);
    easy.forEach((ex) => expect(ex.options).toHaveLength(3));

    const hard = generateSession("hard", 1);
    hard.forEach((ex) => expect(ex.options).toHaveLength(5));
  });

  it("incluye la respuesta correcta entre las opciones", () => {
    const session = generateSession("hard", 42);
    session.forEach((ex) => {
      const isIncluded = ex.options.some((opt) => opt.id === ex.correctAnswer);
      expect(isIncluded).toBe(true);
    });
  });

  it("solo aplica rotación en dificultades medium y hard", () => {
    const easy = generateSession("easy", 1);
    easy.forEach((ex) => expect(ex.rotation).toBe(0));

    const expert = generateSession("expert", 1);
    expert.forEach((ex) => expect(ex.rotation).toBe(0));

    const medium = generateSession("medium", 42);
    const mediumRotated = medium.some((ex) => ex.rotation !== 0);
    expect(mediumRotated).toBe(true);
  });

  describe("modo expert (imágenes reales)", () => {
    it("no incluye imageUrl si no se pasa provider", () => {
      const expert = generateSession("expert", 1);
      expert.forEach((ex) => expect(ex.imageUrl).toBeUndefined());
    });

    it("inyecta la URL de la imagen si el provider la tiene", () => {
      const mockProvider = {
        circulo: ["img/circulo1.jpg", "img/circulo2.jpg"],
        cuadrado: ["img/cuadrado1.jpg"],
      };

      const expert = generateSession("expert", 1, mockProvider);
      let foundImage = false;
      expert.forEach((ex) => {
        if (ex.shape.id === "circulo" || ex.shape.id === "cuadrado") {
          expect(ex.imageUrl).toBeDefined();
          foundImage = true;
        }
      });
      expect(foundImage).toBe(true);
    });
  });
});

describe("shapes — validateAnswer", () => {
  it("acepta la respuesta correcta", () => {
    const session = generateSession("easy", 1);
    const ex = session[0];
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
  });

  it("rechaza una respuesta incorrecta", () => {
    const session = generateSession("easy", 1);
    const ex = session[0];
    const wrong = ex.options.find((o) => o.id !== ex.correctAnswer);
    expect(validateAnswer(ex, wrong!.id)).toBe(false);
  });
});
