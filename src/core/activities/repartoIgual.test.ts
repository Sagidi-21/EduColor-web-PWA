import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./repartoIgual";

describe("repartoIgual", () => {
  describe("generateSession", () => {
    it("genera 10 ejercicios con total = groups * itemsPerGroup", () => {
      const exercises = generateSession("easy");
      expect(exercises.length).toBe(10);
      exercises.forEach((ex) => {
        expect(ex.total).toBe(ex.groups * ex.itemsPerGroup);
      });
    });

    it("es determinista", () => {
      const s1 = generateSession("medium", 123);
      const s2 = generateSession("medium", 123);
      expect(s1).toEqual(s2);
    });

    it("respeta límites de dificultad", () => {
      const easy = generateSession("easy");
      easy.forEach((ex) => {
        expect(ex.groups).toBeGreaterThanOrEqual(2);
        expect(ex.groups).toBeLessThanOrEqual(3);
        expect(ex.itemsPerGroup).toBeGreaterThanOrEqual(2);
        expect(ex.itemsPerGroup).toBeLessThanOrEqual(4);
      });

      const expert = generateSession("expert");
      expert.forEach((ex) => {
        expect(ex.groups).toBeGreaterThanOrEqual(3);
        expect(ex.groups).toBeLessThanOrEqual(10);
        expect(ex.itemsPerGroup).toBeGreaterThanOrEqual(4);
        expect(ex.itemsPerGroup).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("validateAnswer", () => {
    it("acepta la respuesta correcta", () => {
      const ex = { total: 12, groups: 3, itemsPerGroup: 4 };
      expect(validateAnswer(ex, 4)).toBe(true);
    });

    it("rechaza la respuesta incorrecta", () => {
      const ex = { total: 12, groups: 3, itemsPerGroup: 4 };
      expect(validateAnswer(ex, 3)).toBe(false);
      expect(validateAnswer(ex, 12)).toBe(false);
    });
  });
});
