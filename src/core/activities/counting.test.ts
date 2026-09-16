import { describe, it, expect } from "vitest";
import {
  generateSession,
  validateAnswer,
  PRESET_CONFIGS,
  generateLevelConfig,
  generateSessionForLevel,
  LEVELS,
  CURRICULUM_LEVELS,
  type CountingConfig,
  type CurriculumLevelId,
} from "./counting";

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

  describe("LEVELS", () => {
    const levelIds: CurriculumLevelId[] = ["1-L1", "1-L2", "1-L3", "1-L4", "2-L1", "2-L2", "2-L3", "2-L4"];

    it("define los 8 niveles curriculares", () => {
      levelIds.forEach((id) => {
        expect(LEVELS[id]).toBeDefined();
      });
    });

    it("ranges por nivel", () => {
      expect(LEVELS["1-L1"].rangeMin).toBe(1);
      expect(LEVELS["1-L1"].rangeMax).toBe(10);
      expect(LEVELS["1-L2"].rangeMin).toBe(1);
      expect(LEVELS["1-L2"].rangeMax).toBe(20);
      expect(LEVELS["1-L3"].rangeMin).toBe(1);
      expect(LEVELS["1-L3"].rangeMax).toBe(50);
      expect(LEVELS["1-L4"].rangeMin).toBe(1);
      expect(LEVELS["1-L4"].rangeMax).toBe(99);
      expect(LEVELS["2-L1"].rangeMin).toBe(100);
      expect(LEVELS["2-L1"].rangeMax).toBe(200);
      expect(LEVELS["2-L2"].rangeMin).toBe(100);
      expect(LEVELS["2-L2"].rangeMax).toBe(500);
      expect(LEVELS["2-L3"].rangeMin).toBe(100);
      expect(LEVELS["2-L3"].rangeMax).toBe(999);
      expect(LEVELS["2-L4"].rangeMin).toBe(1);
      expect(LEVELS["2-L4"].rangeMax).toBe(999);
    });

    it("cada nivel tiene arreglo visual y mecánica definidos", () => {
      levelIds.forEach((id) => {
        const level = LEVELS[id];
        expect(level.visualArrangement).toBeTruthy();
        expect(level.interactiveMechanic).toBeTruthy();
        expect(level.pdi).toBeTruthy();
        expect(level.cognitiveSkill).toBeGreaterThanOrEqual(1);
      });
    });

    it("names son los del currículo", () => {
      expect(LEVELS["1-L1"].name).toBe("Conteo 1 a 1 y Subitización");
      expect(LEVELS["1-L2"].name).toBe("Cuadrículas y Conteo por Pares");
      expect(LEVELS["2-L4"].name).toBe("Conteo Condicional y Patrones");
    });
  });

  describe("CURRICULUM_LEVELS", () => {
    it("tiene 8 configuraciones con campos completos", () => {
      const ids: CurriculumLevelId[] = ["1-L1", "1-L2", "1-L3", "1-L4", "2-L1", "2-L2", "2-L3", "2-L4"];
      ids.forEach((id) => {
        const cfg = CURRICULUM_LEVELS[id];
        expect(cfg.minCount).toBe(LEVELS[id].rangeMin);
        expect(cfg.maxCount).toBe(LEVELS[id].rangeMax);
        expect(cfg.visualArrangement).toBe(LEVELS[id].visualArrangement);
        expect(cfg.interactiveMechanic).toBe(LEVELS[id].interactiveMechanic);
      });
    });
  });

  describe("generateLevelConfig", () => {
    it("devuelve la config del nivel", () => {
      const cfg = generateLevelConfig("1-L3");
      expect(cfg.minCount).toBe(1);
      expect(cfg.maxCount).toBe(50);
      expect(cfg.visualArrangement).toBe("semi-dispersed-tens");
    });

    it("es reproducible", () => {
      const a = generateLevelConfig("2-L2");
      const b = generateLevelConfig("2-L2");
      expect(a).toEqual(b);
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

  describe("generateSessionForLevel", () => {
    const levelIds: CurriculumLevelId[] = ["1-L1", "1-L2", "1-L3", "1-L4", "2-L1", "2-L2", "2-L3", "2-L4"];

    it("produce 10 ejercicios por nivel", () => {
      levelIds.forEach((id) => {
        const exercises = generateSessionForLevel(id, 42);
        expect(exercises).toHaveLength(10);
      });
    });

    it("cada ejercicio está dentro del rango del nivel", () => {
      levelIds.forEach((id) => {
        const level = LEVELS[id];
        const exercises = generateSessionForLevel(id, 42);
        exercises.forEach((ex) => {
          expect(ex.count).toBeGreaterThanOrEqual(level.rangeMin);
          expect(ex.count).toBeLessThanOrEqual(level.rangeMax);
          expect(ex.correctAnswer).toBe(ex.count);
        });
      });
    });

    it("cada ejercicio incluye arreglo y mecánica", () => {
      levelIds.forEach((id) => {
        const level = LEVELS[id];
        const exercises = generateSessionForLevel(id, 42);
        exercises.forEach((ex) => {
          expect(ex.visualArrangement).toBe(level.visualArrangement);
          expect(ex.interactiveMechanic).toBe(level.interactiveMechanic);
        });
      });
    });

    it("las options incluyen el correctAnswer sin duplicados", () => {
      levelIds.forEach((id) => {
        const exercises = generateSessionForLevel(id, 42);
        exercises.forEach((ex) => {
          expect(ex.options).toContain(ex.correctAnswer);
          expect(new Set(ex.options).size).toBe(4);
        });
      });
    });

    it("es reproducible con el mismo seed", () => {
      const a = generateSessionForLevel("1-L3", 123);
      const b = generateSessionForLevel("1-L3", 123);
      expect(a).toEqual(b);
    });

    it("diferentes niveles generan ejercicios distintos con mismo seed", () => {
      const a = generateSessionForLevel("1-L1", 42);
      const b = generateSessionForLevel("2-L1", 42);
      expect(a[0].count).not.toBe(b[0].count);
    });

    it("positions coincide con count", () => {
      const exercises = generateSessionForLevel("1-L1", 42);
      exercises.forEach((ex) => {
        expect(ex.positions).toHaveLength(ex.count);
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
