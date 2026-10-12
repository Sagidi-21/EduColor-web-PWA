import { describe, expect, it } from "vitest";
import { generateSession, validateAnswer } from "./inventarProblema";

describe("inventarProblema", () => {
  it("easy mezcla MÁS BARATO y MÁS CARO con 2 opciones y respuesta correcta", () => {
    const session = generateSession("easy", 123);
    expect(session.length).toBe(10);
    const kinds = new Set<string>();
    for (const ex of session) {
      const cheaper = ex.question.includes("MÁS BARATO");
      const dearer = ex.question.includes("MÁS CARO");
      expect(cheaper || dearer).toBe(true);
      kinds.add(cheaper ? "barato" : "caro");
      expect(ex.options).toHaveLength(2);
      expect(ex.budget).toBeUndefined();

      const p1 = ex.items[0].price;
      const p2 = ex.items[1].price;
      const expectedName = cheaper
        ? p1 < p2
          ? ex.items[0].name
          : ex.items[1].name
        : p1 > p2
          ? ex.items[0].name
          : ex.items[1].name;
      expect(ex.correctAnswer).toBe(expectedName);
    }
    // Con seed 123 deben salir ambos tipos en la sesión.
    expect(kinds.has("barato")).toBe(true);
    expect(kinds.has("caro")).toBe(true);
  });

  it("medium genera preguntas sobre el coste total con 4 opciones", () => {
    const session = generateSession("medium", 456);
    expect(session.length).toBe(10);
    for (const ex of session) {
      expect(ex.question).toContain("juntos");
      expect(ex.options).toHaveLength(4);
      expect(ex.budget).toBeUndefined();

      const total = ex.items[0].price + ex.items[1].price;
      expect(ex.correctAnswer).toBe(String(total));
    }
  });

  it("hard genera preguntas de presupuesto con 2 opciones (sí/no)", () => {
    const session = generateSession("hard", 789);
    expect(session.length).toBe(10);
    for (const ex of session) {
      expect(ex.question).toContain("¿Puedo comprar");
      expect(ex.options).toHaveLength(2);
      expect(ex.budget).toBeDefined();

      const total = ex.items[0].price + ex.items[1].price;
      const canBuy = ex.budget! >= total;
      expect(ex.correctAnswer).toBe(canBuy ? "yes" : "no");
    }
  });

  it("expert genera preguntas de cambio con 4 opciones", () => {
    const session = generateSession("expert", 101);
    expect(session.length).toBe(10);
    for (const ex of session) {
      expect(ex.question).toContain("devuelven");
      expect(ex.options).toHaveLength(4);
      expect(ex.budget).toBeDefined();

      const total = ex.items[0].price + ex.items[1].price;
      const change = ex.budget! - total;
      expect(ex.correctAnswer).toBe(String(change));
    }
  });

  it("es determinista: misma semilla → misma sesión", () => {
    const a = generateSession("medium", 42);
    const b = generateSession("medium", 42);
    expect(a.map((e) => e.correctAnswer)).toEqual(b.map((e) => e.correctAnswer));
  });

  it("validateAnswer devuelve true solo para la respuesta correcta", () => {
    const session = generateSession("hard", 42);
    const ex = session[0];
    expect(validateAnswer(ex, ex.correctAnswer)).toBe(true);

    const wrong = ex.options.find((o) => o.value !== ex.correctAnswer)!;
    expect(validateAnswer(ex, wrong.value)).toBe(false);
  });
});
