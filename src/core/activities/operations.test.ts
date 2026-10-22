import { describe, it, expect } from "vitest";
import {
  attachSumaImages,
  generateSession,
  validateAnswer,
  showImageSupport,
  type OperationsExercise,
} from "./operations";

describe("operations/engine", () => {
  describe("generateSession", () => {
    describe("suma (D2)", () => {
      it("rechaza generación local de suma", () => {
        expect(() => generateSession("suma", "easy", 42)).toThrow(/deshabilitada|content-session/i);
      });
    });

    describe("resta", () => {
      it("produce 10 ejercicios por sesión", () => {
        const exercises = generateSession("resta", "easy", 42);
        expect(exercises).toHaveLength(10);
      });

      it('produce ejercicios con op "resta"', () => {
        const exercises = generateSession("resta", "easy", 42);
        exercises.forEach((ex) => expect(ex.op).toBe("resta"));
      });

      it("el resultado (answer) es siempre la resta correcta", () => {
        const exercises = generateSession("resta", "easy", 42);
        exercises.forEach((ex) => {
          expect(ex.answer).toBe(ex.a - ex.b);
        });
      });

      it("el minuendo (a) es siempre mayor o igual al sustraendo (b)", () => {
        const exercises = generateSession("resta", "medium", 42);
        exercises.forEach((ex) => {
          expect(ex.a).toBeGreaterThanOrEqual(ex.b);
          expect(ex.answer).toBeGreaterThanOrEqual(0);
        });
      });

      it("respetando rango easy (minA 2-5, minB 1-4, maxAnswer 4)", () => {
        const exercises = generateSession("resta", "easy", 42);
        exercises.forEach((ex) => {
          expect(ex.a).toBeGreaterThanOrEqual(2);
          expect(ex.a).toBeLessThanOrEqual(5);
          expect(ex.b).toBeGreaterThanOrEqual(1);
          expect(ex.b).toBeLessThanOrEqual(4);
          expect(ex.answer).toBeLessThanOrEqual(4);
        });
      });

      it("respetando rango expert (minA 10-30, maxAnswer 29)", () => {
        const exercises = generateSession("resta", "expert", 42);
        exercises.forEach((ex) => {
          expect(ex.a).toBeGreaterThanOrEqual(10);
          expect(ex.a).toBeLessThanOrEqual(30);
          expect(ex.answer).toBeLessThanOrEqual(29);
        });
      });

      it("produces reproducible results with same seed", () => {
        const a = generateSession("resta", "easy", 42);
        const b = generateSession("resta", "easy", 42);
        expect(a).toEqual(b);
      });
    });
  });

  describe("validateAnswer", () => {
    const sample: OperationsExercise = {
      a: 2,
      b: 3,
      op: "suma",
      answer: 5,
      imageUrl: "",
    };

    it("devuelve true para respuesta correcta", () => {
      expect(validateAnswer(sample, "5")).toBe(true);
    });

    it("devuelve true para respuesta correcta de resta", () => {
      const exercises = generateSession("resta", "easy", 42);
      const ex = exercises[0]!;
      expect(validateAnswer(ex, String(ex.answer))).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      expect(validateAnswer(sample, "6")).toBe(false);
    });

    it("devuelve false para NaN", () => {
      expect(validateAnswer(sample, "abc")).toBe(false);
    });
  });

  describe("showImageSupport", () => {
    it("en suma easy devuelve true", () => {
      expect(showImageSupport("suma", "easy")).toBe(true);
    });

    it("en suma medium devuelve false", () => {
      expect(showImageSupport("suma", "medium")).toBe(false);
    });

    it("en resta easy devuelve true", () => {
      expect(showImageSupport("resta", "easy")).toBe(true);
    });

    it("en resta expert devuelve false", () => {
      expect(showImageSupport("resta", "expert")).toBe(false);
    });
  });

  describe("attachSumaImages", () => {
    it("no inventa a/b; solo rellena imageUrl en easy", () => {
      const base: OperationsExercise[] = [
        { a: 1, b: 2, op: "suma", answer: 3, imageUrl: "" },
        { a: 2, b: 2, op: "suma", answer: 4, imageUrl: "" },
      ];
      const withImg = attachSumaImages(base, "easy");
      expect(withImg.map((e) => `${e.a}+${e.b}`)).toEqual(["1+2", "2+2"]);
      const noImg = attachSumaImages(base, "medium");
      expect(noImg.every((e) => e.imageUrl === "")).toBe(true);
    });
  });
});
