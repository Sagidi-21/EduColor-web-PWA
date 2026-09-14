import { generateSession } from "./igualdad";
import { describe, it, expect } from "vitest";
import type { ActivityDifficulty } from "../content/contracts";

describe("igualdad generator", () => {
  const difficulties: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];

  difficulties.forEach((difficulty) => {
    describe(`difficulty: ${difficulty}`, () => {
      it("generates 10 exercises", () => {
        const exercises = generateSession(difficulty, 12345);
        expect(exercises).toHaveLength(10);
      });

      it("generates exercises with correct structure", () => {
        const exercises = generateSession(difficulty, 12345);
        exercises.forEach((ex) => {
          expect(ex).toHaveProperty("type");
          expect(ex).toHaveProperty("a");
          expect(ex).toHaveProperty("b");
          expect(ex).toHaveProperty("c");
          expect(ex).toHaveProperty("imageUrl");
          if (difficulty === "expert") {
            expect(ex.imageUrl).toBe("");
          }
        });
      });

      it("generates exercises with correct types for difficulty", () => {
        const exercises = generateSession(difficulty, 12345);
        const expectedTypes = {
          easy: ["resultado"],
          medium: ["resultado", "sumando"],
          hard: ["resultado", "sumando", "descomposicion"],
          expert: ["resultado", "sumando", "descomposicion"]
        }[difficulty];

        exercises.forEach((ex) => {
          expect(expectedTypes).toContain(ex.type);
        });
      });

      it("generates exercises with correct math for each type", () => {
        const exercises = generateSession(difficulty, 12345);
        exercises.forEach((ex) => {
          switch (ex.type) {
            case "resultado":
              expect(ex.c).toBe(ex.a + ex.b);
              break;
            case "sumando":
              expect(ex.c).toBe(ex.a + ex.b);
              break;
            case "descomposicion":
              expect(ex.c).toBe(ex.a + ex.b);
              break;
          }
        });
      });
    });
  });
});
