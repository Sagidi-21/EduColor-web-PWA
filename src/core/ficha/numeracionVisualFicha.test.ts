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
import { pairIntoRows } from "./renderers/exerciseLayout";
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
  it("easy: ventana ±20 con casilla amarilla y respuesta numérica", () => {
    const list = generate<TablaNumericaSheetExercise>("tablaNumerica", "easy");
    expect(list).toHaveLength(10);
    for (const ex of list) {
      expect(ex.kind).toBe("tablaNumerica");
      expect(ex.variant).toBe("missing");
      const answer = Number(ex.answer);
      const start = Math.max(0, answer - 20);
      const end = Math.min(99, answer + 20);
      const expectedLen = end - start + 1;
      expect(ex.cells).toHaveLength(expectedLen);
      expect(ex.cells[0]!.value).toBe(start);
      expect(ex.cells[ex.cells.length - 1]!.value).toBe(end);
      expect(ex.cols).toBe(10);
      expect(ex.rows).toBe(Math.ceil(expectedLen / 10));
      expect(ex.cells.length).toBeLessThanOrEqual(100);
      const targets = ex.cells.filter((c) => c.state === "target");
      expect(targets).toHaveLength(1);
      expect(String(targets[0]!.value)).toBe(String(ex.answer));
    }
    const markup = html(createElement(TablaNumericaRenderer, { ex: list[0]!, showAnswer: false }));
    expect(markup).toContain("ficha-tabla__cell--target");
    expect(markup).toContain("ficha-tabla__cell--blank");
    expect((markup.match(/<tr>/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("medium: 3–5 a buscar (+3 señuelos), respuesta = casillas", () => {
    const [ex] = generate<TablaNumericaSheetExercise>("tablaNumerica", "medium");
    expect(ex!.variant).toBe("symbol");
    const symbols = ex!.cells.filter((c) => c.state === "symbol");
    expect(symbols.length).toBeGreaterThanOrEqual(6);
    expect(symbols.length).toBeLessThanOrEqual(8);
    expect(ex!.targetSymbols!.length).toBeGreaterThanOrEqual(3);
    expect(ex!.targetSymbols!.length).toBeLessThanOrEqual(5);
    expect(String(ex!.answer)).toMatch(/^\d+(, \d+)+$/);
    const askedCells = String(ex!.answer).split(", ").map(Number);
    expect(askedCells).toHaveLength(ex!.targetSymbols!.length);
    askedCells.forEach((value, i) => {
      const cell = symbols.find((c) => c.value === value);
      expect(cell?.symbol).toBe(ex!.targetSymbols![i]);
    });
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

  it("4059: misma visual que 1119 (MC identify; units/sequence/jump debajo)", () => {
    const easy = generate<Numeracion4059SheetExercise>("numeracion4059", "easy");
    expect(easy.length).toBeGreaterThan(0);
    for (const ex of easy) {
      expect(ex.kind).toBe("numeracion4059");
      expect(ex.type).toBe("identify");
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels).toHaveLength(4);
      expect(ex.question).toBe("Redondea el número que representa la imagen.");
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-tens-blocks--stack");
      expect(markup).not.toContain("•");
      expect((markup.match(/<rect/g) ?? []).length).toBe(Math.floor(ex.number / 10));
      expect((markup.match(/<circle/g) ?? []).length).toBe(ex.number % 10);
      // Misma disposición que 11–19: body con bloques + columna de opciones.
      expect(markup).toContain("ficha-numeracion__body");
      expect(markup).toContain("ficha-numeracion__choices");
      const bodyAt = markup.indexOf("ficha-numeracion__body");
      const blocksAt = markup.indexOf("ficha-numeracion__blocks");
      const choicesAt = markup.indexOf("ficha-numeracion__choices");
      expect(blocksAt).toBeGreaterThan(bodyAt);
      expect(choicesAt).toBeGreaterThan(blocksAt);
    }

    const medium = generate<Numeracion4059SheetExercise>("numeracion4059", "medium");
    for (const ex of medium) {
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels).toBeUndefined();
      expect(ex.showAnswerBoxes).toBe(false);
      expect(ex.questionBelowImage).toBe(true);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).not.toContain("ficha-numeracion__box");
      expect(markup).toContain("ficha-numeracion--prompt-below");
      expect(markup).toContain("ficha-tens-blocks--row");
    }

    const expert = generate<Numeracion4059SheetExercise>("numeracion4059", "expert");
    const identify = expert.filter((ex) => ex.type === "identify");
    const jump = expert.filter((ex) => ex.type === "jump");
    expect(identify.length).toBeGreaterThan(0);
    for (const ex of identify) {
      expect(ex.choiceLabels?.length).toBe(4);
      expect(ex.questionBelowImage).toBe(false);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-numeracion__body");
      expect(markup).toContain("ficha-numeracion__choices");
      expect(markup).not.toContain("•");
    }
    expect(jump.length).toBeGreaterThan(0);
    for (const ex of jump) {
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels).toBeUndefined();
      expect(ex.questionBelowImage).toBe(true);
      expect(ex.showAnswerBoxes).toBe(false);
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-tens-blocks--row");
    }
  });

  it("6099: identify/word MC; units/sequence/jump con enunciado debajo", () => {
    const easy = generate<Numeracion6099SheetExercise>("numeracion6099", "easy");
    for (const ex of easy) {
      expect(ex.type).toBe("identify");
      expect(ex.showBlocks).toBe(true);
      expect(ex.choiceLabels?.length).toBeGreaterThan(0);
      expect(ex.question).toBe("Redondea el número que representa la imagen.");
      const markup = html(createElement(NumeracionRenderer, { ex, showAnswer: false }));
      expect(markup).not.toContain("•");
    }

    const medium = generate<Numeracion6099SheetExercise>("numeracion6099", "medium");
    const units = medium.find((e) => e.type === "units");
    const word = medium.find((e) => e.type === "word");
    expect(units?.showBlocks).toBe(true);
    expect(units?.choiceLabels).toBeUndefined();
    expect(units?.questionBelowImage).toBe(true);
    expect(units?.showAnswerBoxes).toBe(false);
    expect(word?.showBlocks).toBe(false);
    expect(word?.choiceLabels?.length).toBeGreaterThan(0);
    expect(word?.questionBelowImage).toBe(false);

    const expert = generate<Numeracion6099SheetExercise>("numeracion6099", "expert");
    const jump = expert.find((e) => e.type === "jump");
    expect(jump?.showBlocks).toBe(true);
    expect(jump?.questionBelowImage).toBe(true);
    expect(jump?.showAnswerBoxes).toBe(false);
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
  it("read-abaco: SVG con bolitas C/D/U y • opciones", () => {
    const list = generate<Abaco3CifrasSheetExercise>("abaco3cifras", "easy");
    for (const ex of list) {
      expect(ex.variant).toBe("read-abaco");
      expect(ex.columns.c * 100 + ex.columns.d * 10 + ex.columns.u).toBe(ex.number);
      expect(ex.choiceLabels).toHaveLength(4);
      expect(ex.answer).toBe(String(ex.number));
      const markup = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-abaco-svg");
      expect(markup).toContain("•");
      expect((markup.match(/<circle/g) ?? []).length).toBe(
        ex.columns.c + ex.columns.d + ex.columns.u,
      );
    }
  });

  it("medium: todos a 2/fila; find-abaco emparejados entre sí", () => {
    const list = generate<Abaco3CifrasSheetExercise>("abaco3cifras", "medium");
    expect(list.every((ex) => !isFullWidthExercise(ex))).toBe(true);
    const cells = list.map((ex, i) => ({
      ex,
      number: i + 1,
      full: false,
      variant: "",
    }));
    const rows = pairIntoRows(cells);
    for (const row of rows) {
      expect(row.length).toBeGreaterThanOrEqual(1);
      expect(row.length).toBeLessThanOrEqual(2);
      const variants = row.map((c) => (c.ex as Abaco3CifrasSheetExercise).variant);
      const hasFind = variants.some((v) => v === "find-abaco");
      const hasCompact = variants.some((v) => v !== "find-abaco");
      expect(hasFind && hasCompact).toBe(false);
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
    expect(isFullWidthExercise(ex)).toBe(false);
    const markup = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: false }));
    expect((markup.match(/<svg/g) ?? []).length).toBe(4);
    expect(markup).not.toContain("ficha-abaco__badge");
    expect(markup).toContain("redondea la correcta");
    expect(markup).toContain("ficha-abaco__q-num");
    const sol = html(createElement(Abaco3CifrasRenderer, { ex, showAnswer: true }));
    expect(sol).not.toContain("<svg");
  });
});

describe("lecturaNumeros ficha", () => {
  it("cifra→palabra: número grande + • palabras", () => {
    const list = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "easy");
    for (const ex of list) {
      expect(ex.variant).toBe("cifra-to-palabra");
      expect(ex.display).toBe(String(ex.number));
      expect(ex.choiceLabels).toContain(String(ex.answer));
      const markup = html(createElement(LecturaNumerosRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-lectura__display");
      expect(markup).toContain("•");
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

  it("hard/expert: un ejercicio por fila en alumno; easy en 2 columnas", () => {
    const easy = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "easy")[0]!;
    const hard = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "hard")[0]!;
    const expert = generate<LecturaNumerosSheetExercise>("lecturaNumeros", "expert")[0]!;
    expect(isFullWidthExercise(easy)).toBe(false);
    expect(isFullWidthExercise(hard)).toBe(true);
    expect(isFullWidthExercise(expert)).toBe(true);
    expect(isFullWidthExercise(hard, { showAnswer: true })).toBe(false);
  });
});

describe("redondeo ficha", () => {
  it("easy/medium: recta sin badge; easy opciones repartidas; medium mismo gap que hard", () => {
    for (const d of ["easy", "medium"] as const) {
      const list = generate<RedondeoSheetExercise>("redondeo", d);
      expect(list.length).toBeGreaterThan(0);
      for (const ex of list) {
        expect(ex.difficulty).toBe(d);
        expect(ex.upperDecade - ex.lowerDecade).toBe(10);
        expect(ex.choiceLabels.length).toBeGreaterThanOrEqual(2);
        expect(ex.choiceLabels).toContain(String(ex.answer));
        const markup = html(createElement(RedondeoRenderer, { ex, showAnswer: false }));
        expect(markup).not.toContain("ficha-redondeo__badge");
        expect(markup).toContain("ficha-redondeo__line");
        expect(markup).toContain(
          d === "easy" ? "ficha-redondeo__choices--spread" : "ficha-redondeo__choices--center",
        );
        expect(markup).toContain("var(--color-primary");
        expect(markup).toContain(String(ex.lowerDecade));
        expect(markup).toContain(String(ex.upperDecade));
        expect(markup).toContain("•");
      }
    }
  });

  it("hard: recta sin extremos, opciones centradas", () => {
    const list = generate<RedondeoSheetExercise>("redondeo", "hard");
    expect(list.length).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.difficulty).toBe("hard");
      const markup = html(createElement(RedondeoRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-redondeo__badge");
      expect(markup).toContain("ficha-redondeo__line");
      expect(markup).toContain("ficha-redondeo__choices--center");
      const svg = markup.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? "";
      // Solo la etiqueta del número en la marca; sin números de extremos.
      expect((svg.match(/<text /g) ?? []).length).toBe(1);
      expect(svg).toContain(`>${ex.number}<`);
    }
  });

  it("expert: solo badge centrado, sin recta", () => {
    const list = generate<RedondeoSheetExercise>("redondeo", "expert");
    expect(list.length).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.difficulty).toBe("expert");
      const markup = html(createElement(RedondeoRenderer, { ex, showAnswer: false }));
      expect(markup).toContain("ficha-redondeo__badge");
      expect(markup).toContain("ficha-redondeo--expert");
      expect(markup).not.toContain("ficha-redondeo__line");
      expect(markup).toContain("ficha-redondeo__choices--center");
    }
  });

  it("soluciones: solo la respuesta", () => {
    const [ex] = generate<RedondeoSheetExercise>("redondeo", "easy");
    expect(solutionAnswerOf(ex!)).toBe(String(ex!.answer));
    const markup = html(createElement(RedondeoRenderer, { ex: ex!, showAnswer: true }));
    expect(markup).not.toContain("<svg");
  });
});
