import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getGenerator } from "./generators/registry";
import { mapSessionToSheet } from "./generators/mapSessionToSheet";
import { Abaco3CifrasRenderer } from "./renderers/components/Abaco3CifrasRenderer";
import { LecturaNumerosRenderer } from "./renderers/components/LecturaNumerosRenderer";
import { NumeracionRenderer } from "./renderers/components/NumeracionRenderer";
import { RedondeoRenderer } from "./renderers/components/RedondeoRenderer";
import { TablaNumericaRenderer } from "./renderers/components/TablaNumericaRenderer";
import { isFullWidthExercise } from "./renderers/pageLayout";
import { solutionAnswerOf } from "./renderers/solutionAnswer";
import type {
  Abaco3CifrasSheetExercise,
  LecturaNumerosSheetExercise,
  Numeracion1119SheetExercise,
  Numeracion4059SheetExercise,
  Numeracion6099SheetExercise,
  RedondeoSheetExercise,
  SheetConfig,
  TablaNumericaSheetExercise,
} from "./types";

type Difficulty = SheetConfig["difficulty"];

function cfg(activityId: string, difficulty: Difficulty): SheetConfig {
  return { activityId, difficulty, count: 10, withImages: false, seed: 42 };
}

function generate<T>(id: string, difficulty: Difficulty): T[] {
  return getGenerator(id).generate(cfg(id, difficulty)) as T[];
}

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("tablaNumerica ficha", () => {
  it("easy: rejilla 10×10 con casilla amarilla y respuesta numérica", () => {
    const list = generate<TablaNumericaSheetExercise>("tablaNumerica", "easy");
    expect(list).toHaveLength(10);
    for (const ex of list) {
      expect(ex.kind).toBe("tablaNumerica");
      expect(ex.variant).toBe("missing");
      expect(ex.cells).toHaveLength(100);
      expect(ex.cols).toBe(10);
      expect(ex.rows).toBe(10);
      const targets = ex.cells.filter((c) => c.state === "target");
      expect(targets).toHaveLength(1);
      expect(String(targets[0]!.value)).toBe(String(ex.answer));
    }
    const markup = html(createElement(TablaNumericaRenderer, { ex: list[0]!, showAnswer: false }));
    expect(markup).toContain("ficha-tabla__cell--target");
    expect(markup).toContain("ficha-tabla__cell--blank");
    expect((markup.match(/<tr>/g) ?? []).length).toBeGreaterThanOrEqual(11);
  });

  it("medium: 4 símbolos y respuesta = casilla preguntada", () => {
    const [ex] = generate<TablaNumericaSheetExercise>("tablaNumerica", "medium");
    expect(ex!.variant).toBe("symbol");
    const symbols = ex!.cells.filter((c) => c.state === "symbol");
    expect(symbols).toHaveLength(4);
    expect(symbols.some((c) => c.symbol === ex!.targetSymbol)).toBe(true);
    const asked = symbols.find((c) => c.symbol === ex!.targetSymbol)!;
    expect(String(ex!.answer)).toBe(String(asked.value));
  });

  it("hard: colorear, soluciones = lista de números (no la regla)", () => {
    const [ex] = generate<TablaNumericaSheetExercise>("tablaNumerica", "hard");
    expect(ex!.variant).toBe("colorear");
    expect(ex!.question.startsWith("Colorea")).toBe(true);
    expect(ex!.ruleLabel).toBeTruthy();
    expect(String(ex!.answer)).toMatch(/^\d+(, \d+)+$/);
    const markup = html(createElement(TablaNumericaRenderer, { ex: ex!, showAnswer: false }));
    expect(markup).not.toContain("ficha-tabla__blank");
  });

  it("soluciones: solo la respuesta, sin rejilla", () => {
    const [ex] = generate<TablaNumericaSheetExercise>("tablaNumerica", "easy");
    expect(solutionAnswerOf(ex!)).toBe(String(ex!.answer));
    const markup = html(createElement(TablaNumericaRenderer, { ex: ex!, showAnswer: true }));
    expect(markup).toContain("ficha-answer");
    expect(markup).not.toContain("ficha-tabla__grid");
  });

  it("alumno a ancho completo; soluciones en 2 columnas", () => {
    const [ex] = generate<TablaNumericaSheetExercise>("tablaNumerica", "easy");
    expect(isFullWidthExercise(ex!)).toBe(true);
    expect(isFullWidthExercise(ex!, { showAnswer: true })).toBe(false);
  });
});

describe("numeración con bloques decenas/unidades", () => {
  it("1119: bloques en todos los tipos; MC solo en easy", () => {
    const easy = generate<Numeracion1119SheetExercise>("numeracion1119", "easy");
    for (const ex of easy) {
      expect(ex.type).toBe("identify");
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels).toHaveLength(4);
      expect(ex.question).toBe("Redondea el número que representa la imagen.");
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-tens-blocks");
      // Sin ○: el alumno redondea el número a mano.
      expect(markup).not.toContain("○");
      // 1 decena + n unidades
      expect((markup.match(/<rect/g) ?? []).length).toBe(1);
      expect((markup.match(/<circle/g) ?? []).length).toBe(ex.number % 10);
    }
    const medium = generate<Numeracion1119SheetExercise>("numeracion1119", "medium");
    for (const ex of medium) {
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels).toBeUndefined();
      expect(ex.showAnswerBoxes).toBe(false);
      expect(ex.questionBelowImage).toBe(true);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).not.toContain("ficha-numeracion__box");
      expect(markup).toContain("ficha-numeracion--prompt-below");
      // Imagen antes del enunciado en el HTML.
      const blocksAt = markup.indexOf("ficha-numeracion__blocks");
      const questionAt = markup.indexOf("ficha-numeracion__question");
      expect(blocksAt).toBeGreaterThan(-1);
      expect(questionAt).toBeGreaterThan(blocksAt);
    }

    const expert = generate<Numeracion1119SheetExercise>("numeracion1119", "expert");
    const identify = expert.filter((ex) => ex.type === "identify");
    expect(identify.length).toBeGreaterThan(0);
    for (const ex of identify) {
      expect(ex.choiceLabels?.length).toBe(4);
      expect(ex.questionBelowImage).toBe(false);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-numeracion__choices");
      expect(markup).not.toContain("○");
    }
  });

  it("4059: bloques con decenas y unidades correctas", () => {
    const list = generate<Numeracion4059SheetExercise>("numeracion4059", "easy");
    expect(list.length).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.kind).toBe("numeracion4059");
      expect(ex.type).toBe("identify");
      expect(ex.showBlocks).toBe(true);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect((markup.match(/<rect/g) ?? []).length).toBe(Math.floor(ex.number / 10));
      expect((markup.match(/<circle/g) ?? []).length).toBe(ex.number % 10);
    }
  });

  it("6099: identify con bloques y MC; word con MC sin bloques", () => {
    const easy = generate<Numeracion6099SheetExercise>("numeracion6099", "easy");
    for (const ex of easy) {
      expect(ex.type).toBe("identify");
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels?.length).toBeGreaterThan(0);
    }
    const medium = generate<Numeracion6099SheetExercise>("numeracion6099", "medium");
    const units = medium.find((e) => e.type === "units");
    const word = medium.find((e) => e.type === "word");
    expect(units?.showBlocks).toBe(false);
    expect(units?.choiceLabels).toBeUndefined();
    expect(word?.showBlocks).toBe(false);
    expect(word?.choiceLabels?.length).toBeGreaterThan(0);
  });

  it("soluciones: solo la respuesta", () => {
    const [ex] = generate<Numeracion4059SheetExercise>("numeracion4059", "easy");
    expect(solutionAnswerOf(ex!)).toBe(String(ex!.answer));
    const markup = html(createElement(NumeracionRenderer, { ex: ex!, showAnswer: true }));
    expect(markup).toContain("ficha-answer");
    expect(markup).not.toContain("ficha-tens-blocks");
  });
});

describe("abaco3cifras ficha", () => {
  it("read-abaco: SVG con bolitas C/D/U y ○ opciones", () => {
    const list = generate<Abaco3CifrasSheetExercise>("abaco3cifras", "easy");
    for (const ex of list) {
      expect(ex.variant).toBe("read-abaco");
      expect(ex.columns.c * 100 + ex.columns.d * 10 + ex.columns.u).toBe(ex.number);
      expect(ex.choiceLabels).toHaveLength(4);
      expect(ex.answer).toBe(String(ex.number));
      const markup = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-abaco-svg");
      expect(markup).toContain("○");
      expect((markup.match(/<circle/g) ?? []).length).toBe(
        ex.columns.c + ex.columns.d + ex.columns.u,
      );
    }
  });

  it("find-abaco: 4 ábacos con letras y solución = letra", () => {
    const session = Array.from({ length: 12 }, (_, i) =>
      mapSessionToSheet(
        "abaco3cifras",
        {
          type: "find-abaco",
          number: 213 + i,
          centenas: 2,
          decenas: 1,
          unidades: 3,
          question: "¿Qué ábaco representa el número 213?",
          correctAnswer: "2-1-3",
          options: ["1-1-1", "4-0-2", "2-1-3", "9-9-9"],
        },
        cfg("abaco3cifras", "medium"),
      ),
    ) as Abaco3CifrasSheetExercise[];
    const ex = session[0]!;
    expect(ex.variant).toBe("find-abaco");
    expect(ex.abacoOptions?.map((o) => o.letter)).toEqual(["A", "B", "C", "D"]);
    expect(ex.answer).toBe("C");
    expect(solutionAnswerOf(ex)).toBe("C");
    expect(isFullWidthExercise(ex)).toBe(true);
    const markup = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: false }));
    expect((markup.match(/<svg/g) ?? []).length).toBe(4);
    const sol = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: true }));
    expect(sol).not.toContain("<svg");
  });
});

describe("lecturaNumeros ficha", () => {
  it("cifra→palabra: número grande + ○ palabras", () => {
    const list = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "easy");
    for (const ex of list) {
      expect(ex.variant).toBe("cifra-to-palabra");
      expect(ex.display).toBe(String(ex.number));
      expect(ex.choiceLabels).toContain(String(ex.answer));
      const markup = html(createElement(LecturaNumerosRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-lectura__display");
      expect(markup).toContain("○");
    }
  });

  it("palabra→cifra: palabra entre comillas y respuesta cifra", () => {
    const list = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "expert");
    const w = list.find((e) => e.variant === "palabra-to-cifra");
    expect(w).toBeDefined();
    expect(w!.display).toBe(`"${w!.word}"`);
    expect(w!.answer).toBe(String(w!.number));
    const markup = html(createElement(LecturaNumerosRenderer, { ex: w!, showAnswer: false }));
    expect(markup).toContain("ficha-lectura__display--word");
    const sol = html(createElement(LecturaNumerosRenderer, { ex: w!, showAnswer: true }));
    expect(sol).not.toContain("ficha-lectura__display");
  });
});

describe("redondeo ficha", () => {
  it("badge + recta de decenas + ○ opciones", () => {
    for (const d of ["easy", "medium"] as const) {
      const list = generate<RedondeoSheetExercise>("redondeo", d);
      expect(list.length).toBeGreaterThan(0);
      for (const ex of list) {
        expect(ex.upperDecade - ex.lowerDecade).toBe(10);
        expect(ex.choiceLabels.length).toBeGreaterThanOrEqual(2);
        expect(ex.choiceLabels).toContain(String(ex.answer));
        const markup = html(createElement(RedondeoRenderer, { ex, showAnswer: false }));
        expect(markup).toContain("ficha-redondeo__badge");
        expect(markup).toContain("ficha-redondeo__line");
        expect(markup).toContain("○");
      }
    }
  });

  it("soluciones: solo la respuesta", () => {
    const [ex] = generate<RedondeoSheetExercise>("redondeo", "easy");
    expect(solutionAnswerOf(ex!)).toBe(String(ex!.answer));
    const markup = html(createElement(RedondeoRenderer, { ex: ex!, showAnswer: true }));
    expect(markup).not.toContain("<svg");
  });
});
