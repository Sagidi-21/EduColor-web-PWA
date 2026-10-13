import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getGenerator } from "./generators/registry";
import { Algoritmo3CifrasRenderer } from "./renderers/components/Algoritmo3CifrasRenderer";
import { ExerciseRenderer } from "./renderers/components/ExerciseRenderer";
import { MultiplicacionRenderer } from "./renderers/components/MultiplicacionRenderer";
import { RectaNumericaRenderer } from "./renderers/components/RectaNumericaRenderer";
import { SumaLlevandoRenderer } from "./renderers/components/SumaLlevandoRenderer";
import { isFullWidthExercise, pageSizeForExercises } from "./renderers/pageLayout";
import { solutionAnswerOf } from "./renderers/solutionAnswer";
import type {
  Algoritmo3CifrasSheetExercise,
  MultiplicacionSheetExercise,
  RectaNumericaSheetExercise,
  SheetConfig,
  SheetExercise,
  SumaLlevandoSheetExercise,
} from "./types";

type Difficulty = SheetConfig["difficulty"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

function generate<T extends SheetExercise>(id: string, difficulty: Difficulty, count = 10): T[] {
  const config: SheetConfig = { activityId: id, difficulty, count, withImages: false, seed: 42 };
  return getGenerator(id).generate(config) as T[];
}

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("multiplicacion ficha (unir columnas)", () => {
  it.each(DIFFICULTIES)("%s: bloques con parejas únicas y respuesta «a × b = p»", (difficulty) => {
    const list = generate<MultiplicacionSheetExercise>("multiplicacion", difficulty, 4);
    expect(list.length).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.kind).toBe("multiplicacion");
      expect(ex.left.length).toBeGreaterThan(0);
      expect(ex.left.length).toBeLessThanOrEqual(5);
      expect(ex.right).toHaveLength(ex.left.length);
      const products = ex.right.map((r) => r.product);
      expect(new Set(products).size).toBe(products.length);
      for (const l of ex.left) {
        const r = ex.right.find((x) => x.id === l.id);
        expect(r?.product).toBe(l.table * l.factor);
      }
      expect(ex.answer).toHaveLength(ex.left.length);
      for (const a of ex.answer ?? []) expect(a).toMatch(/^\d+ × \d+ = \d+$/);
    }
  });

  it("alumno: puntos de unión en ambas columnas; soluciones: solo respuesta", () => {
    const [ex] = generate<MultiplicacionSheetExercise>("multiplicacion", "easy", 1);
    const alumno = html(createElement(MultiplicacionRenderer, { ex: ex!, showAnswer: false }));
    expect(alumno).toContain("ficha-relacionar__dot");
    expect(alumno).toContain("ficha-mult");
    expect(alumno).toContain("ficha-mult__table");
    expect(alumno.match(/ficha-relacionar__dot/g)).toHaveLength(ex!.left.length * 2);
    expect(alumno).toContain("Une cada multiplicación");

    const sol = html(createElement(ExerciseRenderer, { ex: ex!, showAnswer: true }));
    expect(sol).toContain("ficha-answer");
    expect(sol).not.toContain("ficha-relacionar__dot");
    expect(sol).not.toContain("Une cada");
    expect(sol).toContain(solutionAnswerOf(ex!));
    expect(solutionAnswerOf(ex!)).toContain(" · ");
  });
});

describe("sumaLlevando ficha (casilla de llevada)", () => {
  it.each(DIFFICULTIES)("%s: kind propio con sumandos y respuesta", (difficulty) => {
    const list = generate<SumaLlevandoSheetExercise>("sumaLlevando", difficulty);
    expect(list).toHaveLength(10);
    for (const ex of list) {
      expect(ex.kind).toBe("sumaLlevando");
      expect(ex.addends.length).toBe(difficulty === "easy" || difficulty === "medium" ? 2 : 3);
      expect(ex.answer).toBe(ex.addends.reduce((a, b) => a + b, 0));
    }
  });

  it("alumno: llevada + operación sin casillas de resultado; soluciones: solo el número", () => {
    const [ex] = generate<SumaLlevandoSheetExercise>("sumaLlevando", "hard", 1);
    const alumno = html(createElement(SumaLlevandoRenderer, { ex: ex!, showAnswer: false }));
    expect(alumno).toContain("ficha-sumall__carry");
    expect(alumno).toContain("ficha-sumall--write");
    expect(alumno).not.toContain("ficha-sumall__blank");
    expect(alumno).not.toContain(String(ex!.answer));

    const sol = html(createElement(ExerciseRenderer, { ex: ex!, showAnswer: true }));
    expect(sol).toBe(`<div class="ficha-answer">${ex!.answer}</div>`);
  });
});

describe("algoritmo3cifras ficha (C·D·U con llevadas)", () => {
  it.each(DIFFICULTIES)("%s: cifras, rótulo y resultado coherentes", (difficulty) => {
    const list = generate<Algoritmo3CifrasSheetExercise>("algoritmo3cifras", difficulty);
    expect(list.length).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.kind).toBe("algoritmo3Cifras");
      expect(ex.aC * 100 + ex.aD * 10 + ex.aU).toBe(ex.a);
      expect(ex.bC * 100 + ex.bD * 10 + ex.bU).toBe(ex.b);
      expect(ex.answer).toBe(ex.op === "+" ? ex.a + ex.b : ex.a - ex.b);
      expect(ex.carryLabel).toBe(ex.op === "+" ? "llevar" : "prestar");
    }
  });

  it("alumno: 2 casillas de llevar, sin recuadros de resultado; soluciones: solo resultado", () => {
    const [ex] = generate<Algoritmo3CifrasSheetExercise>("algoritmo3cifras", "medium", 1);
    const alumno = html(createElement(Algoritmo3CifrasRenderer, { ex: ex!, showAnswer: false }));
    expect(alumno.match(/ficha-alg3__carry"/g)).toHaveLength(2);
    expect(alumno).toContain("ficha-alg3--write");
    expect(alumno).not.toContain("ficha-alg3__blank");
    for (const col of [">C<", ">D<", ">U<"]) expect(alumno).toContain(col);
    expect(alumno).toContain("llevar");

    const sol = html(createElement(ExerciseRenderer, { ex: ex!, showAnswer: true }));
    expect(sol).toBe(`<div class="ficha-answer">${ex!.answer}</div>`);
  });

  it("expert con resta rotula «prestar»", () => {
    const list = generate<Algoritmo3CifrasSheetExercise>("algoritmo3cifras", "expert", 10);
    const resta = list.find((e) => e.op === "-");
    if (resta) {
      const markup = html(
        createElement(Algoritmo3CifrasRenderer, { ex: resta, showAnswer: false }),
      );
      expect(markup).toContain("prestar");
      expect(markup).toContain("−");
    }
  });
});

describe("rectaNumerica ficha (SVG)", () => {
  it.each(DIFFICULTIES)("%s: kind propio (ya no problemas) con max y target", (difficulty) => {
    const list = generate<RectaNumericaSheetExercise>("rectaNumerica", difficulty);
    expect(list).toHaveLength(10);
    for (const ex of list) {
      expect(ex.kind).toBe("rectaNumerica");
      expect(ex.target).toBeGreaterThan(0);
      expect(ex.target).toBeLessThan(ex.max);
      expect(ex.answer).toBe(ex.target);
    }
  });

  it("alumno: SVG con marcas y etiquetas; soluciones: recta con marca vertical", () => {
    const [ex] = generate<RectaNumericaSheetExercise>("rectaNumerica", "medium", 1);
    const alumno = html(createElement(RectaNumericaRenderer, { ex: ex!, showAnswer: false }));
    expect(alumno).toContain("<svg");
    expect(alumno).toContain("ficha-recta__target");
    expect(alumno).not.toContain("ficha-recta__answer-mark");
    // 0..max → max + 1 marcas.
    expect(alumno.match(/<line /g)!.length).toBeGreaterThanOrEqual(ex!.max + 1);
    expect(alumno).toContain(`>${ex!.max}</text>`);

    const sol = html(createElement(ExerciseRenderer, { ex: ex!, showAnswer: true }));
    expect(sol).toContain("<svg");
    expect(sol).toContain("ficha-recta__answer-mark");
    expect(sol).not.toContain("ficha-recta__question");
    expect(sol).not.toContain("Marca el");
  });

  it("hard/expert: una por fila (ancha); easy/medium: dos columnas", () => {
    const easy = generate<RectaNumericaSheetExercise>("rectaNumerica", "easy", 1)[0]!;
    const hard = generate<RectaNumericaSheetExercise>("rectaNumerica", "hard", 1)[0]!;
    expect(isFullWidthExercise(easy)).toBe(false);
    expect(isFullWidthExercise(hard)).toBe(true);
    expect(isFullWidthExercise(hard, { showAnswer: true })).toBe(true);
    expect(pageSizeForExercises([easy])).toBe(10);
    expect(pageSizeForExercises([hard])).toBe(6);
    const hardAlumno = html(createElement(RectaNumericaRenderer, { ex: hard, showAnswer: false }));
    expect(hardAlumno).toContain("ficha-recta--wide");
  });
});

describe("pageSizeForExercises (cálculo)", () => {
  it("define tamaños de página propios para los cuatro kinds", () => {
    const mult = generate<MultiplicacionSheetExercise>("multiplicacion", "easy", 2);
    const suma = generate<SumaLlevandoSheetExercise>("sumaLlevando", "easy", 2);
    const alg = generate<Algoritmo3CifrasSheetExercise>("algoritmo3cifras", "easy", 2);
    const recta = generate<RectaNumericaSheetExercise>("rectaNumerica", "easy", 2);
    expect(pageSizeForExercises(mult)).toBe(8);
    expect(pageSizeForExercises(mult, { showAnswer: true })).toBe(12);
    expect(pageSizeForExercises(suma)).toBe(9);
    expect(pageSizeForExercises(suma, { showAnswer: true })).toBe(18);
    expect(pageSizeForExercises(alg)).toBe(9);
    expect(pageSizeForExercises(alg, { showAnswer: true })).toBe(18);
    expect(pageSizeForExercises(recta)).toBe(10);
  });
});
