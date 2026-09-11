import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, showImageSupport } from "./operations";

describe("operations/engine", () => {
  describe("generateSession", () => {
    describe("suma", () => {
      it("produce 10 ejercicios por sesión", () => {
        const exercises = generateSession("suma", "easy", 42);
        expect(exercises).toHaveLength(10);
      });

      it('produce ejercicios con op "suma"', () => {
        const exercises = generateSession("suma", "easy", 42);
        exercises.forEach((ex) => expect(ex.op).toBe("suma"));
      });

      it("el resultado (answer) es siempre la suma correcta", () => {
        const exercises = generateSession("suma", "easy", 42);
        exercises.forEach((ex) => {
          expect(ex.answer).toBe(ex.a + ex.b);
        });
      });

      it("respetando rango easy (1-4 + 1-4, maxAnswer 5)", () => {
        const exercises = generateSession("suma", "easy", 42);
        exercises.forEach((ex) => {
          expect(ex.a).toBeGreaterThanOrEqual(1);
          expect(ex.a).toBeLessThanOrEqual(4);
          expect(ex.b).toBeGreaterThanOrEqual(1);
          expect(ex.b).toBeLessThanOrEqual(4);
          expect(ex.answer).toBeLessThanOrEqual(5);
        });
      });

      it("respetando rango expert (1-15, maxAnswer 30)", () => {
        const exercises = generateSession("suma", "expert", 42);
        exercises.forEach((ex) => {
          expect(ex.a).toBeGreaterThanOrEqual(1);
          expect(ex.a).toBeLessThanOrEqual(15);
          expect(ex.b).toBeGreaterThanOrEqual(1);
          expect(ex.b).toBeLessThanOrEqual(15);
          expect(ex.answer).toBeLessThanOrEqual(30);
        });
      });

      it("no repite pares (a, b) dentro de una sesión", () => {
        const exercises = generateSession("suma", "easy", 42);
        const keys = new Set(exercises.map((ex) => `${ex.a}-${ex.b}`));
        expect(keys.size).toBe(exercises.length);
      });

      it("produces reproducible results with same seed", () => {
        const a = generateSession("suma", "easy", 42);
        const b = generateSession("suma", "easy", 42);
        expect(a).toEqual(b);
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
    it("devuelve true para respuesta correcta de suma", () => {
      const exercises = generateSession("suma", "easy", 42);
      const ex = exercises[0];
      expect(validateAnswer(ex, String(ex.answer))).toBe(true);
    });

    it("devuelve true para respuesta correcta de resta", () => {
      const exercises = generateSession("resta", "easy", 42);
      const ex = exercises[0];
      expect(validateAnswer(ex, String(ex.answer))).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      const exercises = generateSession("suma", "easy", 42);
      const ex = exercises[0];
      const wrong = String(ex.answer + 1);
      expect(validateAnswer(ex, wrong)).toBe(false);
    });

    it("devuelve false para NaN", () => {
      const exercises = generateSession("suma", "easy", 42);
      expect(validateAnswer(exercises[0], "abc")).toBe(false);
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
});

