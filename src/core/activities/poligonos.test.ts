import { describe, expect, it } from "vitest";
import {
  choiceOptions,
  generateSession,
  POLYGONS,
  SESSION_SIZE,
  SESSION_TARGET,
  SHAPES,
  validateAnswer,
} from "./poligonos";
import type { ActivityDifficulty } from "../content/contracts";

const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

describe("poligonos — catálogo de figuras", () => {
  it("distingue cinco polígonos y tres figuras que no lo son", () => {
    expect(SHAPES).toHaveLength(8);
    expect(POLYGONS.map((s) => s.id)).toEqual(["tri1", "quad1", "quad2", "pent1", "hex1"]);
    expect(SHAPES.filter((s) => !s.isPolygon).map((s) => s.id)).toEqual([
      "circ1",
      "open1",
      "curve_side1",
    ]);
  });

  it("coincide sides y vertices con los puntos que tiene cada figura", () => {
    // Los vértices se dibujan desde `vertexPoints`, así que el número que se
    // pregunta al alumno tiene que ser el número de puntos que se ven.
    SHAPES.forEach((shape) => {
      expect(shape.vertexPoints).toHaveLength(shape.vertices);
      shape.vertexPoints.forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(200);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(200);
      });
    });
  });

  it("da a cada figura un color y un modo de dibujo utilizables", () => {
    SHAPES.forEach((shape) => {
      expect(shape.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(["path", "circle", "open_line", "curved_side"]).toContain(shape.drawType);
      // Solo el círculo no necesita `path`: se dibuja con el elemento `circle`.
      if (shape.drawType !== "circle") expect(shape.path.length).toBeGreaterThan(0);
    });
  });
});

describe("poligonos — generateSession", () => {
  it("respeta el tamaño de sesión de cada dificultad en todas las semillas", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        const sesion = generateSession(dificultad, semilla);
        expect(sesion, `${dificultad}/${semilla}`).toHaveLength(SESSION_SIZE[dificultad]);
        expect(sesion.length).toBeLessThanOrEqual(SESSION_TARGET);
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("no repite ejercicio dentro de una sesión", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const semilla of SEMILLAS) {
        const claves = generateSession(dificultad, semilla).map((ex) =>
          ex.type === "count_elements"
            ? `${ex.type}:${ex.shape.id}:${ex.showVertices}`
            : `${ex.type}:${ex.shape.id}`,
        );
        expect(new Set(claves).size, `${dificultad}/${semilla}`).toBe(claves.length);
      }
    }
  });

  it("usa un tipo de pregunta según la dificultad", () => {
    const esperado = {
      easy: "is_polygon",
      medium: "count_elements",
      hard: "name",
      expert: "expert_select",
    } as const;
    for (const dificultad of DIFFICULTIES) {
      generateSession(dificultad, 42).forEach((ex) => expect(ex.type).toBe(esperado[dificultad]));
    }
  });

  it("en easy pregunta por todas las figuras, y la respuesta sigue a isPolygon", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateSession("easy", semilla);
      expect(new Set(sesion.map((ex) => ex.shape.id)).size).toBe(SHAPES.length);
      sesion.forEach((ex) => {
        expect(ex.type).toBe("is_polygon");
        expect(ex.answer).toBe(ex.shape.isPolygon ? "yes" : "no");
        expect(choiceOptions(ex).map((o) => o.value)).toEqual(["yes", "no"]);
      });
    }
  });

  it("en easy explica por qué la figura no es polígono cuando es el caso", () => {
    const sesion = generateSession("easy", 42);
    const circulo = sesion.find((ex) => ex.shape.id === "circ1")!;
    const abierta = sesion.find((ex) => ex.shape.id === "open1")!;
    const curva = sesion.find((ex) => ex.shape.id === "curve_side1")!;

    expect(circulo.hint).toContain("curvas");
    expect(curva.hint).toContain("curvas");
    expect(abierta.hint).toContain("abierta");
  });

  it("en medium cuenta lados o vértices de polígonos, nunca de figuras que no lo son", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateSession("medium", semilla);
      expect(sesion).toHaveLength(10);
      sesion.forEach((ex) => {
        if (ex.type !== "count_elements") throw new Error("easy hace count_elements");
        expect(ex.shape.isPolygon).toBe(true);
        expect(ex.question.includes("LADOS")).toBe(!ex.showVertices);
        expect(ex.question.includes("VÉRTICES")).toBe(ex.showVertices);
        expect(ex.answer).toBe(String(ex.showVertices ? ex.shape.vertices : ex.shape.sides));
      });
      // Cada polígono aparece dos veces: una contando lados y otra vértices.
      expect(new Set(sesion.map((ex) => ex.shape.id)).size).toBe(POLYGONS.length);
    }
  });

  it("en medium ofrece siempre 3, 4, 5 y 6, sin repetir y con la respuesta dentro", () => {
    for (const semilla of SEMILLAS) {
      generateSession("medium", semilla).forEach((ex) => {
        if (ex.type !== "count_elements") throw new Error("medium hace count_elements");
        const valores = ex.options.map((o) => o.value);
        expect(valores.sort()).toEqual(["3", "4", "5", "6"]);
        expect(valores).toContain(ex.answer);
      });
    }
  });

  it("marca los vértices solo cuando la pregunta los pide", () => {
    const sesion = generateSession("medium", 42);
    sesion.forEach((ex) => {
      if (ex.type !== "count_elements") throw new Error("medium hace count_elements");
      expect(ex.showVertices).toBe(ex.question.includes("VÉRTICES"));
    });
  });

  it("en hard nombra cada polígono con su número de lados", () => {
    for (const semilla of SEMILLAS) {
      const sesion = generateSession("hard", semilla);
      expect(sesion).toHaveLength(4);
      sesion.forEach((ex) => {
        if (ex.type !== "name") throw new Error("hard hace name");
        expect(ex.answer).toBe(ex.shape.name);
        expect(ex.shape.sides).toBeLessThanOrEqual(5);
        expect(choiceOptions(ex).map((o) => o.value)).toContain(ex.answer);
      });
    }
  });

  it("en expert ofrece cuatro tarjetas y solo una cumple la condición", () => {
    for (const semilla of SEMILLAS) {
      generateSession("expert", semilla).forEach((ex) => {
        if (ex.type !== "expert_select") throw new Error("expert hace expert_select");

        expect(ex.optionsList).toHaveLength(4);
        expect(new Set(ex.optionsList.map((s) => s.id)).size).toBe(4);
        expect(ex.optionsList.map((s) => s.id)).toContain(ex.answer);

        // `quad1` y `quad2` son los dos cuadriláteros. Si los dos estuvieran en
        // la misma rejilla habría dos respuestas correctas.
        const cumplen = ex.optionsList.filter(
          (s) => s.isPolygon && s.sides === ex.shape.sides && s.vertices === ex.shape.vertices,
        );
        expect(cumplen).toHaveLength(1);
        expect(cumplen[0].id).toBe(ex.answer);
      });
    }
  });

  it("en expert la pregunta nombra los lados y los vértices del objetivo", () => {
    generateSession("expert", 42).forEach((ex) => {
      if (ex.type !== "expert_select") throw new Error("expert hace expert_select");
      expect(ex.question).toContain(`${ex.shape.sides} lados`);
      expect(ex.question).toContain(`${ex.shape.vertices} vértices`);
    });
  });

  it("pregunta siempre y no deja el ejercicio sin enunciado", () => {
    for (const dificultad of DIFFICULTIES) {
      generateSession(dificultad, 42).forEach((ex) =>
        expect(ex.question.length).toBeGreaterThan(5),
      );
    }
  });
});

describe("poligonos — validateAnswer", () => {
  it("acepta solo la respuesta exacta", () => {
    for (const dificultad of DIFFICULTIES) {
      for (const ex of generateSession(dificultad, 42)) {
        expect(validateAnswer(ex, ex.answer)).toBe(true);
        expect(validateAnswer(ex, `${ex.answer} `)).toBe(false);
        expect(validateAnswer(ex, "")).toBe(false);
      }
    }
  });

  it("no acepta un id de figura que no es la respuesta en expert", () => {
    const sesion = generateSession("expert", 42);
    sesion.forEach((ex) => {
      if (ex.type !== "expert_select") throw new Error("expert hace expert_select");
      const otra = ex.optionsList.find((s) => s.id !== ex.answer)!;
      expect(validateAnswer(ex, otra.id)).toBe(false);
    });
  });
});
