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
  });

  describe("LEVELS", () => {
    const levelIds: CurriculumLevelId[] = [
      "1-L1",
      "1-L2",
      "1-L3",
      "1-L4",
      "2-L1",
      "2-L2",
      "2-L3",
      "2-L4",
    ];

    it("define los 8 niveles curriculares", () => {
      levelIds.forEach((id) => {
        expect(LEVELS[id]).toBeDefined();
      });
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
  });

  describe("CURRICULUM_LEVELS", () => {
    it("tiene 8 configuraciones con campos completos", () => {
      const ids: CurriculumLevelId[] = [
        "1-L1",
        "1-L2",
        "1-L3",
        "1-L4",
        "2-L1",
        "2-L2",
        "2-L3",
        "2-L4",
      ];
      ids.forEach((id) => {
        const cfg = CURRICULUM_LEVELS[id];
        expect(cfg.minCount).toBe(LEVELS[id].rangeMin);
        expect(cfg.maxCount).toBe(LEVELS[id].rangeMax);
        expect(cfg.visualArrangement).toBe(LEVELS[id].visualArrangement);
        expect(cfg.interactionType).toBeTruthy();
      });
    });
  });

  describe("LEVELS", () => {
    const levelIds: CurriculumLevelId[] = [
      "1-L1",
      "1-L2",
      "1-L3",
      "1-L4",
      "2-L1",
      "2-L2",
      "2-L3",
      "2-L4",
    ];

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
      expect(LEVELS["1-L3"].rangeMin).toBe(10);
      expect(LEVELS["1-L3"].rangeMax).toBe(50);
      expect(LEVELS["1-L4"].rangeMin).toBe(10);
      expect(LEVELS["1-L4"].rangeMax).toBe(99);
      expect(LEVELS["2-L1"].rangeMin).toBe(100);
      expect(LEVELS["2-L1"].rangeMax).toBe(200);
      expect(LEVELS["2-L2"].rangeMin).toBe(100);
      expect(LEVELS["2-L2"].rangeMax).toBe(999);
      expect(LEVELS["2-L3"].rangeMin).toBe(1);
      expect(LEVELS["2-L3"].rangeMax).toBe(999);
      expect(LEVELS["2-L4"].rangeMin).toBe(100);
      expect(LEVELS["2-L4"].rangeMax).toBe(500);
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
      expect(LEVELS["1-L2"].name).toBe("Cuadrícula, Decenas y Unidades");
      expect(LEVELS["2-L4"].name).toBe("Arreglos Matriciales");
    });
  });

  describe("CURRICULUM_LEVELS", () => {
    it("tiene 8 configuraciones con campos completos", () => {
      const ids: CurriculumLevelId[] = [
        "1-L1",
        "1-L2",
        "1-L3",
        "1-L4",
        "2-L1",
        "2-L2",
        "2-L3",
        "2-L4",
      ];
      ids.forEach((id) => {
        const cfg = CURRICULUM_LEVELS[id];
        expect(cfg.minCount).toBe(LEVELS[id].rangeMin);
        expect(cfg.maxCount).toBe(LEVELS[id].rangeMax);
        expect(cfg.visualArrangement).toBe(LEVELS[id].visualArrangement);
      });
    });
  });

  describe("generateLevelConfig", () => {
    it("devuelve la config del nivel", () => {
      const cfg = generateLevelConfig("1-L3");
      expect(cfg.minCount).toBe(10);
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

    it("el count está dentro del rango", () => {
      const exercises = generateSession({ ...baseConfig, minCount: 3, maxCount: 5 }, 42);
      exercises.forEach((ex) => {
        expect(ex.count).toBeGreaterThanOrEqual(3);
        expect(ex.count).toBeLessThanOrEqual(5);
      });
    });

    it("tiene un paso COUNT_TOTAL con la respuesta correcta", () => {
      const exercises = generateSession(baseConfig, 42);
      exercises.forEach((ex) => {
        expect(ex.steps).toHaveLength(1);
        expect(ex.steps[0].answerType).toBe("COUNT_TOTAL");
        expect(ex.steps[0].correctAnswer).toBe(ex.count);
        expect(ex.steps[0].options).toContain(ex.count);
        expect(ex.steps[0].options).toHaveLength(4);
      });
    });
  });

  describe("generateSessionForLevel", () => {
    const levelIds: CurriculumLevelId[] = [
      "1-L1",
      "1-L2",
      "1-L3",
      "1-L4",
      "2-L1",
      "2-L2",
      "2-L3",
      "2-L4",
    ];

    it("produce 10 ejercicios por nivel", () => {
      levelIds.forEach((id) => {
        const exercises = generateSessionForLevel(id, 42);
        expect(exercises).toHaveLength(10);
      });
    });

    it("1-L2 tiene 3 pasos (TENS, UNITS, TOTAL)", () => {
      const exercises = generateSessionForLevel("1-L2", 42);
      exercises.forEach((ex) => {
        expect(ex.steps).toHaveLength(3);
        expect(ex.steps[0].answerType).toBe("COUNT_TENS");
        expect(ex.steps[1].answerType).toBe("COUNT_UNITS");
        expect(ex.steps[2].answerType).toBe("COUNT_TOTAL");
      });
    });

    it("2-L3 tiene 1 paso (COMPOSE_NUMBER) — nivel sin andamiaje", () => {
      const exercises = generateSessionForLevel("2-L3", 42);
      exercises.forEach((ex) => {
        expect(ex.steps).toHaveLength(1);
        expect(ex.steps[0].answerType).toBe("COMPOSE_NUMBER");
      });
    });

    it("2-L2 tiene 4 pasos (HUNDREDS, TENS, UNITS, COMPOSE)", () => {
      const exercises = generateSessionForLevel("2-L2", 42);
      exercises.forEach((ex) => {
        expect(ex.steps).toHaveLength(4);
        expect(ex.steps[0].answerType).toBe("COUNT_HUNDREDS");
        expect(ex.steps[1].answerType).toBe("COUNT_TENS");
        expect(ex.steps[2].answerType).toBe("COUNT_UNITS");
        expect(ex.steps[3].answerType).toBe("COMPOSE_NUMBER");
      });
    });

    it("GroupFrames se generan correctamente para arreglos estructurados", () => {
      const ex1L3 = generateSessionForLevel("1-L3", 42)[0];
      expect(ex1L3.groupFrames).toBeDefined();
      expect(ex1L3.groupFrames!.length).toBeGreaterThan(0);

      // En 1-L3 si el número no es múltiplo de 10, hay un frame parcial
      const hasPartial = ex1L3.groupFrames!.some((gf) => !gf.isComplete);
      const isMultiple10 = ex1L3.count % 10 === 0;
      expect(hasPartial).toBe(!isMultiple10);
    });
  });

  describe("generateSessionForLevel", () => {
    const levelIds: CurriculumLevelId[] = [
      "1-L1",
      "1-L2",
      "1-L3",
      "1-L4",
      "2-L1",
      "2-L2",
      "2-L3",
      "2-L4",
    ];

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
          expect(ex.steps[0].correctAnswer).toBeDefined();
        });
      });
    });

    it("cada ejercicio incluye arreglo y mecánica", () => {
      levelIds.forEach((id) => {
        const level = LEVELS[id];
        const cfg = CURRICULUM_LEVELS[id];
        const exercises = generateSessionForLevel(id, 42);
        exercises.forEach((ex) => {
          expect(ex.visualArrangement).toBe(level.visualArrangement);
          expect(ex.interactionType).toBe(cfg.interactionType);
        });
      });
    });

    it("las options incluyen el correctAnswer sin duplicados", () => {
      levelIds.forEach((id) => {
        const exercises = generateSessionForLevel(id, 42);
        exercises.forEach((ex) => {
          expect(ex.steps[0].options).toContain(ex.steps[0].correctAnswer);
          expect(new Set(ex.steps[0].options).size).toBe(4);
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
        { minCount: 3, maxCount: 5, quantity: 1, randomLayout: false, difficulty: "easy" },
        42,
      );
      const step = exercises[0].steps[0];
      expect(validateAnswer(step, step.correctAnswer)).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      const exercises = generateSession(
        { minCount: 3, maxCount: 5, quantity: 1, randomLayout: false, difficulty: "easy" },
        42,
      );
      const step = exercises[0].steps[0];
      const wrong = step.correctAnswer === 3 ? 5 : 3;
      expect(validateAnswer(step, wrong)).toBe(false);
    });
  });
});
