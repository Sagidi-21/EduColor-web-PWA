import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer } from "./redondeo";

describe("redondeo engine", () => {
  it("generateSession crea 10 ejercicios con seed estable en easy", () => {
    const s1 = generateSession("easy", 123);
    const s2 = generateSession("easy", 123);

    expect(s1.length).toBe(10);
    expect(s1).toEqual(s2);

    // En easy, todos los ejercicios son round-to-ten
    s1.forEach((ex) => {
      expect(ex.type).toBe("round-to-ten");
      expect(ex.number).toBeGreaterThan(10);
      expect(ex.number).toBeLessThan(100);
      expect(ex.number % 10).not.toBe(0);
      expect(ex.number % 10).not.toBe(5);
    });
  });

  it("generateSession crea ejercicios mixtos en medium/hard/expert", () => {
    const sMedium = generateSession("medium", 456);
    const sHard = generateSession("hard", 789);

    // En medium números son < 100
    expect(sMedium.every((ex) => ex.number < 100)).toBe(true);

    // En hard números son > 100
    expect(sHard.every((ex) => ex.number > 100)).toBe(true);

    // Puede haber mix de "which-closer" y "round-to-ten" en medium
    const types = new Set(sMedium.map((ex) => ex.type));
    expect(types.size).toBeGreaterThan(0);
  });

  it("round-to-ten tiene 4 opciones y correct answer", () => {
    const session = generateSession("easy", 999);
    const ex = session[0]!;

    expect(ex.options.length).toBe(4);
    expect(ex.options).toContain(ex.correctAnswer);
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);
    expect(validateAnswer(ex, "99999")).toBe(false);
  });

  it("which-closer tiene siempre 4 opciones", () => {
    let closer = null;
    for (let i = 0; i < 50; i++) {
      const session = generateSession("medium", i);
      const found = session.find((s) => s.type === "which-closer");
      if (found) {
        closer = found;
        break;
      }
    }

    expect(closer).not.toBeNull();
    if (closer) {
      expect(closer.options.length).toBe(4);
      expect(closer.options).toContain(closer.correctAnswer);
      expect(validateAnswer(closer, closer.correctAnswer)).toBe(true);
    }
  });

  it("Deduplica ejercicios y evita múltiplos de 10 y acabados en 5", () => {
    const session = generateSession("expert", 111);
    const used = new Set();
    session.forEach((ex) => {
      const key = `${ex.type}-${ex.number}`;
      expect(used.has(key)).toBe(false);
      used.add(key);

      expect(ex.number % 10).not.toBe(0);
      expect(ex.number % 10).not.toBe(5);
    });
  });

  it("expert: el enunciado no repite el número (va en el badge)", () => {
    const session = generateSession("expert", 222);
    for (const ex of session) {
      expect(ex.question).not.toContain(String(ex.number));
    }
  });
});
