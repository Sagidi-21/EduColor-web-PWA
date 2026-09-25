import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, DAYS, type Day } from "./weekDays";

describe("weekDays — generateSession", () => {
  it("genera exactamente 7 ejercicios", () => {
    const session = generateSession("easy", 42);
    expect(session).toHaveLength(7);
  });

  it("es determinista con la misma seed", () => {
    const a = generateSession("medium", 123);
    const b = generateSession("medium", 123);
    expect(a).toEqual(b);
  });

  it("produce resultados diferentes con seeds distintas", () => {
    const a = generateSession("hard", 1);
    const b = generateSession("hard", 2);
    expect(a).not.toEqual(b);
  });

  it("cada ejercicio tiene 4 opciones distintas", () => {
    const session = generateSession("easy", 42);
    session.forEach((ex) => {
      expect(ex.options).toHaveLength(4);
      const unique = new Set(ex.options);
      expect(unique.size).toBe(4);
    });
  });

  it("la respuesta correcta siempre está entre las opciones", () => {
    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      const session = generateSession(diff, 7);
      session.forEach((ex) => {
        expect(ex.options).toContain(ex.answer);
      });
    }
  });

  it("todas las opciones son días válidos", () => {
    const session = generateSession("expert", 99);
    session.forEach((ex) => {
      ex.options.forEach((opt) => {
        expect(DAYS).toContain(opt);
      });
      expect(DAYS).toContain(ex.answer);
    });
  });

  describe("easy — responde con el día siguiente", () => {
    it("la respuesta es siempre el día siguiente al mencionado", () => {
      const session = generateSession("easy", 1);
      session.forEach((ex) => {
        const dayMentioned = DAYS.find((d) => ex.question.includes(d));
        expect(dayMentioned).toBeDefined();
        const expectedIdx = (DAYS.indexOf(dayMentioned!) + 1) % 7;
        expect(ex.answer).toBe(DAYS[expectedIdx]);
      });
    });
  });

  describe("medium — responde con el día anterior", () => {
    it("la respuesta es siempre el día anterior al mencionado", () => {
      const session = generateSession("medium", 1);
      session.forEach((ex) => {
        const dayMentioned = DAYS.find((d) => ex.question.includes(d));
        expect(dayMentioned).toBeDefined();
        const expectedIdx = (DAYS.indexOf(dayMentioned!) + 6) % 7;
        expect(ex.answer).toBe(DAYS[expectedIdx]);
      });
    });
  });

  describe("hard — N días después", () => {
    it("la pregunta menciona un número de días", () => {
      const session = generateSession("hard", 42);
      session.forEach((ex) => {
        expect(ex.question).toMatch(/\d+ días después/);
      });
    });
  });

  describe("expert — mezcla los tres tipos", () => {
    it("contiene los tres tipos de preguntas", () => {
      const session = generateSession("expert", 42);
      const hasDespues = session.some((ex) => ex.question.includes("va después"));
      const hasAntes = session.some((ex) => ex.question.includes("va antes"));
      const hasNDias = session.some((ex) => ex.question.match(/\d+ días después/));
      expect(hasDespues).toBe(true);
      expect(hasAntes).toBe(true);
      expect(hasNDias).toBe(true);
    });
  });
});

describe("weekDays — validateAnswer", () => {
  it("acepta la respuesta correcta", () => {
    const ex = {
      question: "¿Qué día va después del lunes?",
      options: ["lunes", "martes", "miércoles", "jueves"] as Day[],
      answer: "martes" as Day,
    };
    expect(validateAnswer(ex, "martes")).toBe(true);
  });

  it("rechaza una respuesta incorrecta", () => {
    const ex = {
      question: "¿Qué día va después del lunes?",
      options: ["lunes", "martes", "miércoles", "jueves"] as Day[],
      answer: "martes" as Day,
    };
    expect(validateAnswer(ex, "lunes")).toBe(false);
    expect(validateAnswer(ex, "miércoles")).toBe(false);
  });

  it("es sensible al caso exacto del string", () => {
    const ex = {
      question: "¿Qué día va después del lunes?",
      options: ["lunes", "martes", "miércoles", "jueves"] as Day[],
      answer: "martes" as Day,
    };
    expect(validateAnswer(ex, "Martes")).toBe(false);
    expect(validateAnswer(ex, "MARTES")).toBe(false);
  });
});
