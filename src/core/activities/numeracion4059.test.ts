import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, type Num4059Exercise } from "./numeracion4059";

describe("numeracion4059", () => {
  it("genera 10 ejercicios por defecto", () => {
    const session = generateSession("easy", 42);
    expect(session).toHaveLength(10);
  });

  it("easy solo usa tipo identify", () => {
    const session = generateSession("easy", 42);
    session.forEach((ex) => {
      expect(ex.type).toBe("identify");
    });
  });

  it("medium usa types units", () => {
    const session = generateSession("medium", 42);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("units")).toBe(true);
  });

  it("hard usa sequence", () => {
    const session = generateSession("hard", 42);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("sequence")).toBe(true);
  });

  it("expert usa todos los tipos", () => {
    const session = generateSession("expert", 42);
    const types = new Set(session.map((ex) => ex.type));
    expect(types.has("identify")).toBe(true);
    expect(types.has("units")).toBe(true);
    expect(types.has("sequence")).toBe(true);
    expect(types.has("jump")).toBe(true);
  });

  it("semilla reproducible", () => {
    const a = generateSession("easy", 42);
    const b = generateSession("easy", 42);
    expect(a).toEqual(b);
  });

  it("semilla diferente genera resultados distintos", () => {
    const a = generateSession("easy", 42);
    const b = generateSession("easy", 99);
    expect(a).not.toEqual(b);
  });

  it("todos los números están en rango 40-59", () => {
    const session = generateSession("easy", 42);
    session.forEach((ex) => {
      expect(ex.number).toBeGreaterThanOrEqual(40);
      expect(ex.number).toBeLessThanOrEqual(59);
    });
  });

  it("validateAnswer acepta respuesta correcta", () => {
    const ex: Num4059Exercise = {
      type: "identify",
      number: 42,
      question: "",
      options: [],
      answer: 42,
    };
    expect(validateAnswer(ex, "42")).toBe(true);
  });

  it("validateAnswer rechaza respuesta incorrecta", () => {
    const ex: Num4059Exercise = {
      type: "identify",
      number: 42,
      question: "",
      options: [],
      answer: 42,
    };
    expect(validateAnswer(ex, "41")).toBe(false);
  });

  it("validateAnswer rechaza string vacío", () => {
    const ex: Num4059Exercise = {
      type: "identify",
      number: 42,
      question: "",
      options: [],
      answer: 42,
    };
    expect(validateAnswer(ex, "")).toBe(false);
  });
});
