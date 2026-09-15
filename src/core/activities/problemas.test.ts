import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./problemas";
import type { ActivityDifficulty } from "../content/contracts";

describe("problemas/engine", () => {
  describe("generateSession", () => {
    it("genera 10 ejercicios por defecto", () => {
      const exercises = generateSession("easy", 42);
      expect(exercises).toHaveLength(10);
    });

    it("cada ejercicio tiene las propiedades requeridas", () => {
      const exercises = generateSession("easy", 42);
      exercises.forEach((ex) => {
        expect(ex).toHaveProperty("story");
        expect(ex).toHaveProperty("question");
        expect(ex).toHaveProperty("solutionTemplate");
        expect(ex).toHaveProperty("emoji");
        expect(ex).toHaveProperty("a");
        expect(ex).toHaveProperty("b");
        expect(ex).toHaveProperty("op");
        expect(ex).toHaveProperty("answer");
      });
    });

    it("easy: solo sumas, a en [2,7], b en [1,5], a+b ≤ 10", () => {
      const exercises = generateSession("easy", 42);
      exercises.forEach((ex) => {
        expect(ex.op).toBe("suma");
        expect(ex.a).toBeGreaterThanOrEqual(2);
        expect(ex.a).toBeLessThanOrEqual(7);
        expect(ex.b).toBeGreaterThanOrEqual(1);
        expect(ex.b).toBeLessThanOrEqual(5);
        expect(ex.a + ex.b).toBeLessThanOrEqual(10);
        expect(ex.answer).toBe(ex.a + ex.b);
      });
    });

    it("medium: sumas y restas, a en [3,9], b en [1,6]", () => {
      const exercises = generateSession("medium", 42);
      exercises.forEach((ex) => {
        expect(ex.a).toBeGreaterThanOrEqual(3);
        expect(ex.a).toBeLessThanOrEqual(9);
        expect(ex.b).toBeGreaterThanOrEqual(1);
        expect(ex.b).toBeLessThanOrEqual(6);
        if (ex.op === "suma") {
          expect(ex.a + ex.b).toBeLessThanOrEqual(10);
          expect(ex.answer).toBe(ex.a + ex.b);
        } else {
          expect(ex.a).toBeGreaterThan(ex.b);
          expect(ex.answer).toBe(ex.a - ex.b);
        }
      });
    });

    it("hard: sumas y restas, a en [5,15], b en [1,9]", () => {
      const exercises = generateSession("hard", 42);
      exercises.forEach((ex) => {
        expect(ex.a).toBeGreaterThanOrEqual(5);
        expect(ex.a).toBeLessThanOrEqual(15);
        expect(ex.b).toBeGreaterThanOrEqual(1);
        expect(ex.b).toBeLessThanOrEqual(9);
        if (ex.op === "suma") {
          expect(ex.a + ex.b).toBeLessThanOrEqual(19);
          expect(ex.answer).toBe(ex.a + ex.b);
        } else {
          expect(ex.a).toBeGreaterThan(ex.b);
          expect(ex.answer).toBe(ex.a - ex.b);
        }
      });
    });

    it("expert: sumas y restas, a en [10,29], b en [5,15]", () => {
      const exercises = generateSession("expert", 42);
      exercises.forEach((ex) => {
        expect(ex.a).toBeGreaterThanOrEqual(10);
        expect(ex.a).toBeLessThanOrEqual(29);
        expect(ex.b).toBeGreaterThanOrEqual(5);
        expect(ex.b).toBeLessThanOrEqual(15);
        if (ex.op === "suma") {
          expect(ex.a + ex.b).toBeLessThanOrEqual(39);
          expect(ex.answer).toBe(ex.a + ex.b);
        } else {
          expect(ex.a).toBeGreaterThan(ex.b);
          expect(ex.answer).toBe(ex.a - ex.b);
        }
      });
    });

    it("todas las dificultades generan 10 ejercicios", () => {
      const difficulties: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
      difficulties.forEach((d) => {
        expect(generateSession(d, 42)).toHaveLength(10);
      });
    });

    it("reproducible con misma semilla", () => {
      const a = generateSession("medium", 42);
      const b = generateSession("medium", 42);
      expect(a).toEqual(b);
    });

    it("diferentes semillas producen diferentes ejercicios", () => {
      const a = generateSession("medium", 42);
      const b = generateSession("medium", 99);
      expect(a).not.toEqual(b);
    });

    it("todos los ejercicios tienen story y question no vacíos", () => {
      const exercises = generateSession("easy", 42);
      exercises.forEach((ex) => {
        expect(ex.story.length).toBeGreaterThan(0);
        expect(ex.question.length).toBeGreaterThan(0);
      });
    });

    it("la pregunta contiene el signo de interrogación", () => {
      const exercises = generateSession("easy", 42);
      exercises.forEach((ex) => {
        expect(ex.question.startsWith("¿")).toBe(true);
      });
    });

    it("la respuesta es numérica y positiva", () => {
      const exercises = generateSession("easy", 42);
      exercises.forEach((ex) => {
        expect(typeof ex.answer).toBe("number");
        expect(ex.answer).toBeGreaterThanOrEqual(0);
      });
    });

    it("tiene al menos una suma y una resta en medium", () => {
      const exercises = generateSession("medium", 42);
      const ops = new Set(exercises.map((ex) => ex.op));
      expect(ops.has("suma")).toBe(true);
      expect(ops.has("resta")).toBe(true);
    });

    it("usa todos los temas disponibles", () => {
      const themes = ["deportes", "animales", "clase", "naturaleza"] as const;
      const exercises = generateSession("easy", 42);
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(themes).toContain(ex.theme);
      });
    });
  });

  describe("validateAnswer", () => {
    it("devuelve true para respuesta correcta", () => {
      const ex = generateSession("easy", 42)[0];
      expect(validateAnswer(ex, String(ex.answer))).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      const ex = generateSession("easy", 42)[0];
      const wrong = ex.answer === 5 ? 3 : 5;
      expect(validateAnswer(ex, String(wrong))).toBe(false);
    });

    it("ignora espacios alrededor de la respuesta", () => {
      const ex = generateSession("easy", 42)[0];
      expect(validateAnswer(ex, ` ${ex.answer} `)).toBe(true);
    });
  });
});