import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, PRESET_CONFIGS, type CountingConfig } from "./counting";

describe("counting/engine", () => {
  describe("PRESET_CONFIGS", () => {
    it("define configs para todas las dificultades", () => {
      expect(PRESET_CONFIGS.easy).toBeDefined();
      expect(PRESET_CONFIGS.medium).toBeDefined();
      expect(PRESET_CONFIGS.hard).toBeDefined();
      expect(PRESET_CONFIGS.expert).toBeDefined();
    });

    it("easy: minCount 1, maxCount 5", () => {
      expect(PRESET_CONFIGS.easy.minCount).toBe(1);
      expect(PRESET_CONFIGS.easy.maxCount).toBe(5);
    });

    it("expert: minCount 10, maxCount 20", () => {
      expect(PRESET_CONFIGS.expert.minCount).toBe(10);
      expect(PRESET_CONFIGS.expert.maxCount).toBe(20);
    });

    it("easy no usa layout aleatorio", () => {
      expect(PRESET_CONFIGS.easy.randomLayout).toBe(false);
    });

    it("hard usa layout aleatorio", () => {
      expect(PRESET_CONFIGS.hard.randomLayout).toBe(true);
    });
  });

  describe("generateSession", () => {
    const baseConfig: CountingConfig = {
      minCount: 1,
      maxCount: 5,
      quantity: 10,
      randomLayout: false,
      difficulty: "easy",
    };

    it("produce exactamente `quantity` ejercicios", () => {
      const exercises = generateSession({ ...baseConfig, quantity: 7 }, 42);
      expect(exercises).toHaveLength(7);
    });

    it("produce 10 ejercicios por defecto (quantity=10)", () => {
      const exercises = generateSession(baseConfig, 42);
      expect(exercises).toHaveLength(10);
    });

    it("produces reproducible results with same seed", () => {
      const a = generateSession(baseConfig, 42);
      const b = generateSession(baseConfig, 42);
      expect(a).toEqual(b);
    });

    it("el count está dentro del rango [minCount, maxCount]", () => {
      const exercises = generateSession({ ...baseConfig, minCount: 3, maxCount: 5 }, 42);
      exercises.forEach((ex) => {
        expect(ex.count).toBeGreaterThanOrEqual(3);
        expect(ex.count).toBeLessThanOrEqual(5);
      });
    });

    it("el correctAnswer coincide con count", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.correctAnswer).toBe(ex.count);
      });
    });

    it("las options incluyen el correctAnswer", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.options).toContain(ex.correctAnswer);
      });
    });

    it("las options tienen exactamente 4 elementos", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.options).toHaveLength(4);
      });
    });

    it("las options no tienen duplicados (4 valores distintos)", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        const unique = new Set(ex.options);
        expect(unique.size).toBe(4);
      });
    });

    it("el número de positions coincide con count", () => {
      const exercises = generateSession({ ...baseConfig, minCount: 3, maxCount: 3 }, 42);
      exercises.forEach((ex) => {
        expect(ex.positions).toHaveLength(ex.count);
      });
    });

    it("el objectLabel es no vacío", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.objectLabel).toBeTruthy();
      });
    });

    it("el imageUrl es no vacío (categorías disponibles)", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.imageUrl).toBeTruthy();
      });
    });

    it("el id es único secuencial", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex, i) => {
        expect(ex.id).toBe(i);
      });
    });
  });

  describe("validateAnswer", () => {
    it("devuelve true para respuesta correcta", () => {
      const exercises = generateSession(
        {
          minCount: 3,
          maxCount: 5,
          quantity: 10,
          randomLayout: false,
          difficulty: "easy",
        },
        42,
      );
      const ex = exercises[0];
      expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      const exercises = generateSession(
        {
          minCount: 3,
          maxCount: 5,
          quantity: 10,
          randomLayout: false,
          difficulty: "easy",
        },
        42,
      );
      const ex = exercises[0];
      const wrong = ex.correctAnswer === 3 ? 5 : 3;
      expect(validateAnswer(ex, wrong)).toBe(false);
    });
  });
});
