import { describe, expect, it } from "vitest";
import { mapSessionToSheet } from "./mapSessionToSheet";
import type { SheetConfig } from "../types";

const config: SheetConfig = {
  activityId: "suma",
  difficulty: "easy",
  count: 10,
  withImages: true,
  seed: 1,
};

describe("mapSessionToSheet", () => {
  it("mapea suma a operation", () => {
    const ex = mapSessionToSheet(
      "suma",
      { a: 2, b: 3, op: "suma", answer: 5, imageUrl: "x.png" },
      config,
    );
    expect(ex).toMatchObject({ kind: "operation", a: 2, b: 3, op: "+", answer: 5 });
  });

  it("mapea resta a operation con op -", () => {
    const ex = mapSessionToSheet("resta", { a: 5, b: 2, op: "resta", answer: 3 }, config);
    expect(ex).toMatchObject({ kind: "operation", op: "-", answer: 3 });
  });

  it("mapea counting", () => {
    const ex = mapSessionToSheet(
      "counting",
      {
        count: 4,
        objectLabel: "manzanas",
        imageUrl: "a.png",
        steps: [{ prompt: "¿Cuántas manzanas hay?", correctAnswer: 4 }],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "counting",
      count: 4,
      imageUrl: "a.png",
      objectLabel: "manzanas",
      question: "¿Cuántas manzanas hay?",
      answer: 4,
    });
  });

  it("counting sin prompt usa Cuántas/Cuántos según el género", () => {
    const femenino = mapSessionToSheet(
      "counting",
      { count: 3, objectLabel: "flores", imageUrl: "f.png" },
      config,
    );
    const masculino = mapSessionToSheet(
      "counting",
      { count: 3, objectLabel: "coches", imageUrl: "c.png" },
      config,
    );
    expect(femenino).toMatchObject({ question: "¿Cuántas flores hay?" });
    expect(masculino).toMatchObject({ question: "¿Cuántos coches hay?" });
  });

  it("mapea comparison left/right a A/B", () => {
    const ex = mapSessionToSheet(
      "comparison",
      {
        leftCount: 3,
        rightCount: 5,
        objectSet: "coches",
        objectIndex: 0,
        question: "more",
        answer: "right",
        allowEqual: false,
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "comparison",
      countA: 3,
      countB: 5,
      questionType: "mas",
      allowEqual: false,
      difficulty: "easy",
      answer: "B",
    });
    if (ex.kind === "comparison") {
      expect(ex.imageUrl.length).toBeGreaterThan(0);
    }
  });

  it("mapea comparison equal a iguales con allowEqual", () => {
    const ex = mapSessionToSheet(
      "comparison",
      {
        leftCount: 7,
        rightCount: 7,
        objectSet: "globos",
        objectIndex: 0,
        question: "more",
        answer: "equal",
        allowEqual: true,
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "comparison",
      countA: 7,
      countB: 7,
      allowEqual: true,
      answer: "iguales",
    });
  });

  it("mapea poligonos con figura SVG", () => {
    const ex = mapSessionToSheet(
      "poligonos",
      {
        question: "¿Cuántos lados?",
        answer: "3",
        showVertices: true,
        shape: {
          name: "Triángulo",
          path: "M 100 30 L 170 150 L 30 150 Z",
          drawType: "path",
          color: "#3b82f6",
          vertexPoints: [
            { x: 100, y: 30 },
            { x: 170, y: 150 },
            { x: 30, y: 150 },
          ],
        },
      },
      config,
    );
    expect(ex.kind).toBe("poligonos");
    if (ex.kind === "poligonos") {
      expect(ex.shape?.path).toContain("M 100 30");
      expect(ex.shape?.showVertices).toBe(true);
    }
  });

  it("poligonos expert: sin figura de referencia, solo opciones figurativas", () => {
    const shape = {
      id: "tri",
      name: "Triángulo",
      path: "M 100 30 L 170 150 L 30 150 Z",
      drawType: "path",
      color: "#3b82f6",
      sides: 3,
      vertices: 3,
      isPolygon: true,
    };
    const ex = mapSessionToSheet(
      "poligonos",
      {
        type: "expert_select",
        question: "Selecciona el polígono que tiene exactamente 3 lados y 3 vértices.",
        answer: "tri",
        shape,
        optionsList: [shape, { ...shape, id: "hex", name: "Hexágono", sides: 6, vertices: 6 }],
      },
      { ...config, difficulty: "expert" },
    );
    expect(ex.kind).toBe("poligonos");
    if (ex.kind === "poligonos") {
      expect(ex.shape).toBeUndefined();
      expect(ex.optionsList).toHaveLength(2);
      expect(ex.choiceLabels).toBeUndefined();
    }
  });

  it("mapea shapes con opciones de texto como en pizarra", () => {
    const ex = mapSessionToSheet(
      "shapes",
      {
        shape: { id: "circulo", label: "círculo", type: "circle" },
        color: "#ef4444",
        rotation: 0,
        options: [
          { id: "circulo", label: "círculo", type: "circle" },
          { id: "cuadrado", label: "cuadrado", type: "square" },
          { id: "triangulo", label: "triángulo", type: "triangle" },
        ],
        correctAnswer: "circulo",
      },
      config,
    );
    expect(ex.kind).toBe("poligonos");
    if (ex.kind === "poligonos") {
      expect(ex.question).toBe("¿Cómo se llama esta figura?");
      expect(ex.answer).toBe("círculo");
      expect(ex.shape?.primitive).toBe("circle");
      expect(ex.choiceLabels).toEqual(["círculo", "cuadrado", "triángulo"]);
      expect(ex.imageUrl).toBeUndefined();
    }
  });

  it("mapea shapes expert con foto y pregunta de objeto", () => {
    const ex = mapSessionToSheet(
      "shapes",
      {
        shape: { id: "ovalo", label: "óvalo", type: "oval" },
        color: "#3b82f6",
        rotation: 0,
        options: [
          { id: "ovalo", label: "óvalo", type: "oval" },
          { id: "circulo", label: "círculo", type: "circle" },
        ],
        correctAnswer: "ovalo",
        imageUrl: "/shapes/ovalo.jpg",
      },
      { ...config, withImages: true },
    );
    expect(ex.kind).toBe("poligonos");
    if (ex.kind === "poligonos") {
      expect(ex.question).toBe("¿Qué forma tiene este objeto?");
      expect(ex.answer).toBe("óvalo");
      expect(ex.imageUrl).toBe("/shapes/ovalo.jpg");
      expect(ex.choiceLabels).toEqual(["óvalo", "círculo"]);
    }
  });

  it("mapea lineTypes con svg del line", () => {
    const ex = mapSessionToSheet(
      "lineTypes",
      {
        line: {
          kind: "horizontal",
          label: "Horizontal",
          svg: '<line x1="30" y1="100" x2="270" y2="100"/>',
        },
        options: ["Horizontal", "Vertical"],
        answer: "Horizontal",
      },
      config,
    );
    expect(ex.kind).toBe("lineTypes");
    if (ex.kind === "lineTypes") {
      expect(ex.svg).toContain("line");
    }
  });

  it("mapea tresSumandos con imageUrl cuando withImages", () => {
    const ex = mapSessionToSheet(
      "tresSumandos",
      { a: 1, b: 2, c: 3, answer: 6, imageUrl: "/obj.png" },
      config,
    );
    expect(ex).toMatchObject({
      kind: "tresSumandos",
      a: 1,
      b: 2,
      c: 3,
      answer: 6,
      imageUrl: "/obj.png",
    });
  });

  it("omite imageUrl de tresSumandos si withImages es false", () => {
    const ex = mapSessionToSheet(
      "tresSumandos",
      { a: 1, b: 2, c: 3, answer: 6, imageUrl: "/obj.png" },
      { ...config, withImages: false },
    );
    expect(ex).toMatchObject({ kind: "tresSumandos", imageUrl: "" });
  });

  it("mapea igualdad resultado con imageUrl", () => {
    const ex = mapSessionToSheet(
      "igualdad",
      { type: "resultado", a: 2, b: 3, c: 5, answer: 5, imageUrl: "/igl.png" },
      config,
    );
    expect(ex).toMatchObject({
      kind: "igualdad",
      type: "result",
      a: 2,
      b: 3,
      c: 5,
      imageUrl: "/igl.png",
      answer: 5,
    });
  });

  it("mapea algoritmoVertical y restaColumna", () => {
    const sum = mapSessionToSheet(
      "algoritmoVertical",
      { a: 23, b: 14, aD: 2, aU: 3, bD: 1, bU: 4, answer: 37 },
      config,
    );
    expect(sum).toMatchObject({ kind: "algoritmoVertical", op: "+", answer: 37 });

    const sub = mapSessionToSheet(
      "restaColumna",
      { a: 23, b: 14, aD: 2, aU: 3, bD: 1, bU: 4, answer: 9 },
      config,
    );
    expect(sub).toMatchObject({ kind: "algoritmoVertical", op: "-", answer: 9 });
  });

  it("mapea sumaLlevando a su propio kind con sumandos y respuesta", () => {
    const ex = mapSessionToSheet("sumaLlevando", { addends: [12, 15, 8], answer: 35 }, config);
    expect(ex).toMatchObject({ kind: "sumaLlevando", addends: [12, 15, 8], answer: 35 });

    const two = mapSessionToSheet("sumaLlevando", { addends: [18, 7] }, config);
    expect(two).toMatchObject({ kind: "sumaLlevando", addends: [18, 7], answer: 25 });
  });

  it("mapea algoritmo3cifras con cifras C·D·U y rótulo llevar/prestar", () => {
    const sum = mapSessionToSheet(
      "algoritmo3cifras",
      { op: "+", a: 178, b: 245, result: 423, aC: 1, aD: 7, aU: 8, bC: 2, bD: 4, bU: 5 },
      config,
    );
    expect(sum).toMatchObject({
      kind: "algoritmo3Cifras",
      op: "+",
      aC: 1,
      aD: 7,
      aU: 8,
      bC: 2,
      bD: 4,
      bU: 5,
      carryLabel: "llevar",
      answer: 423,
    });

    const sub = mapSessionToSheet(
      "algoritmo3cifras",
      { op: "-", a: 523, b: 178, result: 345 },
      config,
    );
    expect(sub).toMatchObject({
      kind: "algoritmo3Cifras",
      op: "-",
      aC: 5,
      aD: 2,
      aU: 3,
      bC: 1,
      bD: 7,
      bU: 8,
      carryLabel: "prestar",
      answer: 345,
    });
  });

  it("mapea rectaNumerica a su propio kind (ya no cae en problemas)", () => {
    const ex = mapSessionToSheet("rectaNumerica", { target: 7, max: 20, labelEvery: 5 }, config);
    expect(ex).toEqual({
      kind: "rectaNumerica",
      target: 7,
      max: 20,
      labelEvery: 5,
      answer: 7,
    });
  });

  it("mapea multiplicacion como unir columnas con parejas de solución", () => {
    const p0 = { id: 0, table: 2, factor: 3, product: 6 };
    const p1 = { id: 1, table: 2, factor: 5, product: 10 };
    const ex = mapSessionToSheet(
      "multiplicacion",
      { mode: "match", pairs: [p0, p1], leftColumn: [p1, p0], rightColumn: [p0, p1] },
      config,
    );
    expect(ex).toEqual({
      kind: "multiplicacion",
      left: [
        { id: 1, table: 2, factor: 5 },
        { id: 0, table: 2, factor: 3 },
      ],
      right: [
        { id: 0, product: 6 },
        { id: 1, product: 10 },
      ],
      answer: ["2 × 3 = 6", "2 × 5 = 10"],
    });
  });

  it("mapea problemas con story y answer", () => {
    const ex = mapSessionToSheet(
      "problemas",
      { story: "Había 3 perros.", question: "¿Cuántos hay ahora?", answer: 5 },
      config,
    );
    expect(ex.kind).toBe("problemas");
    if (ex.kind === "problemas") {
      expect(ex.question).toContain("Cuántos");
      expect(ex.answer).toBe(5);
    }
  });

  it("mapea problemas con emoji y ecuación a ± b", () => {
    const ex = mapSessionToSheet(
      "problemas",
      {
        story: "Hay 3 perros. Llegan 2 más.",
        question: "¿Cuántos perros hay ahora?",
        emoji: "🐶",
        a: 3,
        b: 2,
        op: "suma",
        answer: 5,
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "problemas",
      emoji: "🐶",
      a: 3,
      b: 2,
      op: "+",
      answer: 5,
      highlightKeyNumbers: true,
    });
    expect(ex).not.toMatchObject({ showWriteArea: true });
    const sin = mapSessionToSheet(
      "problemas",
      { story: "x", question: "y", emoji: "🐶", a: 3, b: 2, op: "resta", answer: 1 },
      { ...config, withImages: false },
    );
    expect(sin).toMatchObject({ op: "-", emoji: undefined });
  });

  it("problemas hard: solo enunciado + hueco; números clave resaltados (como easy/medium)", () => {
    const ex = mapSessionToSheet(
      "problemas",
      {
        story: "Hay 8 perros. Se van 3.",
        question: "¿Cuántos perros quedan?",
        emoji: "🐶",
        a: 8,
        b: 3,
        op: "resta",
        answer: 5,
      },
      { ...config, difficulty: "hard" },
    );
    expect(ex.kind).toBe("problemas");
    if (ex.kind === "problemas") {
      expect(ex.a).toBeUndefined();
      expect(ex.b).toBeUndefined();
      expect(ex.op).toBeUndefined();
      expect(ex.showWriteArea).toBe(true);
      expect(ex.highlightKeyNumbers).toBe(true);
      expect(ex.answer).toBe(5);
    }
  });

  it("problemas expert: solo enunciado + hueco; sin resaltar números", () => {
    const ex = mapSessionToSheet(
      "problemas",
      {
        story: "Hay 12 perros. Se van 5.",
        question: "¿Cuántos perros quedan?",
        a: 12,
        b: 5,
        op: "resta",
        answer: 7,
      },
      { ...config, difficulty: "expert" },
    );
    expect(ex.kind).toBe("problemas");
    if (ex.kind === "problemas") {
      expect(ex.a).toBeUndefined();
      expect(ex.op).toBeUndefined();
      expect(ex.showWriteArea).toBe(true);
      expect(ex.highlightKeyNumbers).toBeUndefined();
    }
  });

  it("mapea weekDays con opciones y día resaltado", () => {
    const ex = mapSessionToSheet(
      "weekDays",
      {
        question: "¿Qué día va después del martes?",
        options: ["lunes", "miércoles", "jueves", "domingo"],
        answer: "miércoles",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "weekDay",
      highlightDay: "martes",
      choiceLabels: ["lunes", "miércoles", "jueves", "domingo"],
      answer: "miércoles",
    });
  });

  it("mapea vecinosNumero con vía, pregunta y opciones", () => {
    const ex = mapSessionToSheet(
      "vecinosNumero",
      {
        number: 5,
        type: "ambos",
        anterior: 4,
        posterior: 6,
        correctAnswer: "4-6",
        options: ["4-6", "3-6", "4-7", "5-6"],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "vecinosNumero",
      number: 5,
      askType: "ambos",
      question: "¿Cuáles son los vecinos?",
      answer: "4 - 6",
    });
    if (ex.kind === "vecinosNumero") expect(ex.choiceLabels?.[0]).toBe("4 - 6");
  });

  it("mapea dobleYMitad con cajas y opciones", () => {
    const ex = mapSessionToSheet(
      "dobleYMitad",
      {
        type: "doble",
        number: 4,
        result: 8,
        operacion: "x2",
        conocido: "original",
        question: "¿Cuánto es el doble de 4?",
        correctAnswer: 8,
        options: [8, 6, 7, 10],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "dobleYMitad",
      number: 4,
      operacion: "x2",
      conocido: "original",
      choiceLabels: ["8", "6", "7", "10"],
      answer: 8,
    });
  });

  it("mapea elLitro/elKilo con choiceLabels desde options", () => {
    const ex = mapSessionToSheet(
      "elKilo",
      {
        items: [],
        question: "¿Cuál pesa más?",
        options: ["Sandía", "Pluma"],
        answer: "Sandía",
      },
      config,
    );
    expect(ex).toMatchObject({ kind: "elKilo", choiceLabels: ["Sandía", "Pluma"] });
  });

  it("elLitro: opciones solo en classify; which-more/less sin choiceLabels", () => {
    const classify = mapSessionToSheet(
      "elLitro",
      {
        type: "classify",
        items: [{ name: "botella grande", file: "x.png", category: "mas" }],
        question: "¿La botella grande tiene más o menos de 1 litro?",
        options: ["Más de 1 L", "Menos de 1 L"],
        answer: "Más de 1 L",
      },
      config,
    );
    expect(classify).toMatchObject({
      kind: "elLitro",
      choiceLabels: ["Más de 1 L", "Menos de 1 L"],
    });

    const compare = mapSessionToSheet(
      "elLitro",
      {
        type: "which-more",
        items: [
          { name: "cubo", file: "a.png", category: "mas" },
          { name: "vaso", file: "b.png", category: "menos" },
        ],
        question: "¿Cuál tiene más de 1 litro?",
        options: ["Cubo", "Vaso"],
        answer: "Cubo",
      },
      { ...config, difficulty: "hard" },
    );
    expect(compare.kind).toBe("elLitro");
    if (compare.kind === "elLitro") {
      expect(compare.choiceLabels).toBeUndefined();
    }

    const expert = mapSessionToSheet(
      "elLitro",
      {
        type: "classify",
        items: [{ name: "vaso", file: "v.png", category: "menos" }],
        question: "¿El vaso tiene más o menos de 1 litro?",
        options: ["Más de 1 L", "Menos de 1 L"],
        answer: "Menos de 1 L",
      },
      { ...config, difficulty: "expert", withImages: true },
    );
    expect(expert.kind).toBe("elLitro");
    if (expert.kind === "elLitro") {
      expect(expert.referenceUrl).toBeUndefined();
    }
  });

  it("mapea repartoIgual", () => {
    const ex = mapSessionToSheet(
      "repartoIgual",
      { total: 12, groups: 3, itemsPerGroup: 4 },
      config,
    );
    expect(ex).toMatchObject({
      kind: "repartoIgual",
      total: 12,
      groups: 3,
      answer: 4,
      showVisual: true,
    });
    const hard = mapSessionToSheet(
      "repartoIgual",
      { total: 12, groups: 3, itemsPerGroup: 4 },
      { ...config, difficulty: "hard" },
    );
    expect(hard).toMatchObject({ kind: "repartoIgual", showVisual: false });
  });

  it("mapea problemas2pasos con tracker y opciones", () => {
    const ex = mapSessionToSheet(
      "problemas2pasos",
      {
        type: "add-sub",
        op1: "+",
        op2: "-",
        a: 10,
        b: 5,
        c: 3,
        mid: 15,
        result: 12,
        story: ["Juan tiene 10.", "Le dan 5.", "Da 3."],
        question: "¿Cuántos le quedan?",
        correctAnswer: "12",
        options: ["10", "12", "14", "15"],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "problemas2pasos",
      steps: { a: 10, b: 5, c: 3, op1: "+", op2: "-" },
      choiceLabels: ["10", "12", "14", "15"],
      answer: 12,
    });
  });

  it("mapea simetria con figura y opciones; which-shape sin figura", () => {
    const ex = mapSessionToSheet(
      "simetria",
      {
        type: "is-symmetric",
        shape: "cuadrado",
        axes: 4,
        question: "¿Tiene el cuadrado algún eje de simetría?",
        correctAnswer: "Sí",
        options: ["Sí", "No"],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "simetria",
      shape: "cuadrado",
      choiceLabels: ["Sí", "No"],
      answer: "Sí",
    });
    const which = mapSessionToSheet(
      "simetria",
      {
        type: "which-shape",
        shape: "cuadrado",
        axes: 4,
        question: "¿Cuál tiene eje?",
        correctAnswer: "Cuadrado",
        options: ["Cuadrado", "Rombo"],
      },
      config,
    );
    expect(which).toMatchObject({ kind: "simetria", shape: undefined });
  });

  it("mapea cuerpos3d con cuerpo y opciones", () => {
    const ex = mapSessionToSheet(
      "cuerpos3d",
      {
        type: "count-faces",
        shape: "cubo",
        question: "¿Cuántas caras tiene el cubo?",
        correctAnswer: "6",
        options: ["2", "4", "6", "8"],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "cuerpos3d",
      shape: "cubo",
      choiceLabels: ["2", "4", "6", "8"],
      answer: "6",
    });
  });

  it("mapea circuloCircunferencia con figura/objeto y opciones", () => {
    const raw = {
      type: "real-object",
      shapeType: "circulo",
      objectName: "una moneda",
      objectEmoji: "🪙",
      question: "🪙 Una moneda… ¿es un círculo o una circunferencia?",
      options: ["Círculo", "Circunferencia"],
      correctAnswer: "Círculo",
    };
    const ex = mapSessionToSheet("circuloCircunferencia", raw, config);
    expect(ex).toMatchObject({
      kind: "circuloCircunferencia",
      type: "real-object",
      shapeType: "circulo",
      objectEmoji: "🪙",
      choiceLabels: ["Círculo", "Circunferencia"],
      answer: "Círculo",
    });
    const sin = mapSessionToSheet("circuloCircunferencia", raw, { ...config, withImages: false });
    expect(sin).toMatchObject({ objectEmoji: undefined });
  });

  it("mapea ordenar con números y dirección", () => {
    const ex = mapSessionToSheet(
      "ordenar",
      {
        numbers: [5, 2, 6],
        sortedNumbers: [2, 5, 6],
        direction: "ascending",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "ordenar",
      numbers: [5, 2, 6],
      direction: "ascending",
      answer: [2, 5, 6],
    });
  });

  it("mapea amigos10 con ten-frame cuando withImages", () => {
    const ex = mapSessionToSheet(
      "amigos10",
      {
        given: 3,
        complement: 7,
        type: "complement",
        question: "¿Cuánto le falta al 3 para llegar a 10?",
        correctAnswer: "7",
        options: ["7", "6", "8", "5"],
      },
      { ...config, activityId: "amigos10", withImages: true },
    );
    expect(ex).toMatchObject({
      kind: "amigos10",
      given: 3,
      showVisual: true,
      answer: 7,
      question: "¿Cuánto le falta al 3 para llegar a 10?",
    });
  });

  it("omite ten-frame de amigos10 si withImages es false", () => {
    const ex = mapSessionToSheet(
      "amigos10",
      {
        given: 4,
        complement: 6,
        question: "4 + ___ = 10",
        correctAnswer: "6",
      },
      { ...config, activityId: "amigos10", withImages: false },
    );
    expect(ex).toMatchObject({ kind: "amigos10", given: 4, showVisual: false, answer: 6 });
  });

  it("mapea seriesNumericas con secuencia y hueco", () => {
    const ex = mapSessionToSheet(
      "seriesNumericas",
      {
        sequence: [2, 4, -1, 8, 10],
        blankIndex: 2,
        step: 2,
        ascending: true,
        correctAnswer: "6",
        options: ["6", "5", "7", "4"],
      },
      { ...config, difficulty: "easy" },
    );
    expect(ex).toMatchObject({
      kind: "seriesNumericas",
      sequence: [2, 4, -1, 8, 10],
      blankIndex: 2,
      step: 2,
      ascending: true,
      question: "¿Qué número falta? (de 2 en 2)",
      answer: 6,
    });
  });

  it("mapea seriesNumericas hard sin pista de salto", () => {
    const ex = mapSessionToSheet(
      "seriesNumericas",
      {
        sequence: [20, 15, -1, 5, 0],
        blankIndex: 2,
        step: 5,
        ascending: false,
        correctAnswer: "10",
      },
      { ...config, difficulty: "hard" },
    );
    expect(ex).toMatchObject({
      kind: "seriesNumericas",
      ascending: false,
      question: "¿Qué número falta?",
      answer: 10,
    });
  });

  it("mapea series3cifras con secuencia", () => {
    const ex = mapSessionToSheet(
      "series3cifras",
      {
        sequence: [100, 110, -1, 130, 140],
        blankIndex: 2,
        step: 10,
        ascending: true,
        correctAnswer: "120",
      },
      { ...config, difficulty: "medium" },
    );
    expect(ex).toMatchObject({
      kind: "series3Cifras",
      sequence: [100, 110, -1, 130, 140],
      answer: 120,
      question: "¿Qué número falta? (de 10 en 10)",
    });
  });

  it("mapea monedasBilletes identify con URL de moneda", () => {
    const ex = mapSessionToSheet(
      "monedasBilletes",
      {
        type: "identify",
        item: {
          valor: 100,
          etiqueta: "1 euro",
          corta: "1€",
          tipo: "moneda",
          fichero: "1euro.png",
        },
        question: "¿Cuánto vale?",
        answer: "1€",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "monedasBilletes",
      type: "identify",
      question: "¿Cuánto vale?",
      answer: "1€",
    });
    if (ex.kind === "monedasBilletes") {
      expect(ex.money.length).toBe(1);
      expect(ex.money[0]?.url.length).toBeGreaterThan(0);
    }
  });

  it("mapea elKilo con fotos de objetos", () => {
    const ex = mapSessionToSheet(
      "elKilo",
      {
        type: "classify",
        items: [{ name: "sandía", file: "sandia.png", category: "mas" }],
        question: "¿Pesa más o menos de 1 kg?",
        answer: "Más de 1 kg",
      },
      config,
    );
    expect(ex.kind).toBe("elKilo");
    if (ex.kind === "elKilo") {
      expect(ex.items[0]?.imageUrl.length).toBeGreaterThan(0);
      expect(ex.referenceUrl?.length).toBeGreaterThan(0);
    }
  });

  it("mapea relacionarCantidades con dibujo y textos", () => {
    const ex = mapSessionToSheet(
      "relacionarCantidades",
      {
        pairs: [],
        leftColumn: [
          {
            id: 0,
            leftText: "Tengo 25",
            rightText: "25",
            izquierda: [{ total: 25 }],
            derecha: { total: 25 },
            imageUrl: "/obj.png",
            objectLabel: "manzanas",
          },
        ],
        rightColumn: [
          {
            id: 0,
            leftText: "Tengo 25",
            rightText: "25",
            izquierda: [{ total: 25 }],
            derecha: { total: 25 },
            imageUrl: "/obj.png",
            objectLabel: "manzanas",
          },
        ],
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "relacionarCantidades",
      imageUrl: "/obj.png",
      left: [{ id: 0, text: "Tengo 25" }],
      right: [{ id: 0, letter: "A", text: "25" }],
      answer: ["Tengo 25 → A"],
    });
  });

  it("mapea parImpar visual con emoji", () => {
    const ex = mapSessionToSheet(
      "parImpar",
      {
        type: "visual",
        question: "¿Es par o impar?",
        number: 4,
        answer: "par",
        visualItems: { emoji: "🍎", count: 4 },
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "parImpar",
      emoji: "🍎",
      emojiCount: 4,
      answer: "par",
    });
  });

  it("parImpar write: sin recuadro ni opciones; solución con todas las posibilidades", () => {
    const ex = mapSessionToSheet(
      "parImpar",
      {
        type: "write",
        question: "Escribe todos los números PARES que haya entre 50 y 56.",
        number: 0,
        answer: "52",
        extraData: { validAnswers: ["52", "54"] },
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "parImpar",
      writeIn: false,
      choiceLabels: [],
      answer: "52, 54",
    });
  });

  it("mapea ordinales con fila y emoji", () => {
    const ex = mapSessionToSheet(
      "ordinales",
      {
        type: "identify",
        rowSize: 5,
        target: 3,
        fromRight: false,
        question: "¿En qué posición está la estrella?",
        answer: 3,
        emoji: "🏀",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "ordinales",
      count: 5,
      target: 3,
      fromRight: false,
      answer: 3,
    });
    if (ex.kind === "ordinales") {
      expect(ex.emoji.length).toBeGreaterThan(0);
    }
  });

  it("identify (easy/expert) pide redondear la posición en la ficha", () => {
    for (const difficulty of ["easy", "expert"] as const) {
      const ex = mapSessionToSheet(
        "ordinales",
        {
          type: "identify",
          rowSize: 5,
          target: 3,
          fromRight: false,
          question: "¿Cuál es el 3º?",
          answer: 3,
          emoji: "⚽",
        },
        { ...config, difficulty },
      );
      expect(ex).toMatchObject({
        kind: "ordinales",
        variant: "identify",
        question: "Redondea la posición 3º",
        difficulty,
      });
    }
  });

  it("mapea balanza con platos emoji", () => {
    const ex = mapSessionToSheet(
      "balanza",
      {
        question: "¿Qué lado pesa más?",
        left: { emoji: "🍉", count: 2, weightLabel: null, unknown: false },
        right: { emoji: "🧱", count: 1, weightLabel: "1 kg", unknown: false },
        tilt: "left",
        correctAnswer: "left",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "balanza",
      variant: "compare",
      left: { emoji: "🍉", count: 2 },
      right: { emoji: "🧱", count: 1, weightLabel: "1 kg" },
      answer: "left",
    });
  });

  it("en easy de balanza añade opciones para redondear y etiqueta de respuesta", () => {
    const ex = mapSessionToSheet(
      "balanza",
      {
        question: "¿Qué pesa MÁS, el coche o el perrito?",
        left: { emoji: "🚗", count: 1, weightLabel: null, unknown: false },
        right: { emoji: "🐶", count: 1, weightLabel: null, unknown: false },
        tilt: "left",
        correctAnswer: "left",
        options: [
          { label: "El coche", value: "left" },
          { label: "El perrito", value: "right" },
        ],
      },
      { ...config, difficulty: "easy" },
    );
    expect(ex).toMatchObject({
      kind: "balanza",
      choiceLabels: ["El coche", "El perrito"],
      answer: "El coche",
    });
  });

  it("en medium de balanza añade MENOS / IGUAL / MÁS para redondear", () => {
    const ex = mapSessionToSheet(
      "balanza",
      {
        question: "¿Pesa MÁS, MENOS o IGUAL?",
        left: { emoji: "🍎", count: 3, weightLabel: null, unknown: false },
        right: { emoji: "🍎", count: 2, weightLabel: null, unknown: false },
        tilt: "left",
        correctAnswer: "left",
        options: [
          { label: "Pesa MÁS el de la izquierda", value: "left" },
          { label: "Pesa MENOS el de la izquierda", value: "right" },
          { label: "Pesan IGUAL", value: "equal" },
        ],
      },
      { ...config, difficulty: "medium" },
    );
    expect(ex).toMatchObject({
      kind: "balanza",
      choiceLabels: ["MENOS", "IGUAL", "MÁS"],
      answer: "MÁS",
    });
  });

  it("en hard de balanza añade MENOS / IGUAL / MÁS y oculta la balanza inclinada", () => {
    const ex = mapSessionToSheet(
      "balanza",
      {
        question: "¿Pesa MÁS, MENOS o IGUAL que 1 kg?",
        left: { emoji: "🍉", count: 2, weightLabel: null, unknown: false },
        right: { emoji: "🧱", count: 1, weightLabel: "1 kg", unknown: false },
        tilt: "left",
        correctAnswer: "more",
        options: [
          { label: "Más que 1 kg", value: "more" },
          { label: "Menos que 1 kg", value: "less" },
          { label: "Igual que 1 kg", value: "equal" },
        ],
      },
      { ...config, difficulty: "hard" },
    );
    expect(ex).toMatchObject({
      kind: "balanza",
      showScale: false,
      choiceLabels: ["MENOS", "IGUAL", "MÁS"],
      answer: "MÁS",
    });
    if (ex.kind === "balanza") expect(ex.tilt).toBeUndefined();
  });

  it("en expert de balanza marca writeHint y no añade opciones MC", () => {
    const ex = mapSessionToSheet(
      "balanza",
      {
        question: "¿Cuántos kg de peso hay a la derecha?",
        left: {
          emoji: "🍉",
          count: 1,
          weightLabel: "5 kg",
          weightBlocks: 2,
          weightBlocksLabel: "2 kg",
          unknown: false,
        },
        right: { emoji: "🧱", count: 0, weightLabel: null, unknown: true },
        tilt: "equal",
        correctAnswer: "7",
        options: [
          { label: "6 kg", value: "6" },
          { label: "7 kg", value: "7" },
        ],
      },
      { ...config, difficulty: "expert" },
    );
    expect(ex).toMatchObject({
      kind: "balanza",
      writeHint: true,
      answer: "7 kg",
      left: {
        emoji: "🍉",
        weightLabel: "5 kg",
        weightBlocks: 2,
        weightBlocksLabel: "2 kg",
      },
    });
    if (ex.kind === "balanza") expect(ex.choiceLabels).toBeUndefined();
  });

  it("mapea graficoBarras con barras", () => {
    const ex = mapSessionToSheet(
      "graficoBarras",
      {
        titulo: "Animales",
        bars: [
          { etiqueta: "Perro", emoji: "🐶", valor: 5 },
          { etiqueta: "Gato", emoji: "🐱", valor: 3 },
        ],
        escalaMax: 6,
        blankBarIndex: 1,
        question: "¿Cuántos votos tiene el gato?",
        correctAnswer: "3",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "graficoBarras",
      titulo: "Animales",
      blankBarIndex: 1,
      answer: "3",
    });
    if (ex.kind === "graficoBarras") expect(ex.bars).toHaveLength(2);
  });

  it("mapea menuCafeteria con bandeja", () => {
    const ex = mapSessionToSheet(
      "menuCafeteria",
      {
        tray: [{ emoji: "🍝", name: "Pasta", price: 6 }],
        question: "¿Cuánto cuesta la bandeja?",
        correctAnswer: "6€",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "menuCafeteria",
      tray: [{ emoji: "🍝", name: "Pasta", price: 6 }],
      answer: "6€",
    });
  });

  it("mapea cintaMetrica con emoji del objeto", () => {
    const ex = mapSessionToSheet(
      "cintaMetrica",
      {
        item: { name: "un lápiz", size: 15, unit: "cm", emoji: "✏️" },
        question: "¿En qué unidad lo mides?",
        correctAnswer: "cm",
      },
      config,
    );
    expect(ex).toMatchObject({
      kind: "cintaMetrica",
      emoji: "✏️",
      itemName: "un lápiz",
      answer: "cm",
    });
  });

  it("mapea inventarProblema e intervalosTiempo", () => {
    const inv = mapSessionToSheet(
      "inventarProblema",
      {
        items: [{ emoji: "👟", name: "zapatillas", price: 30 }],
        budget: 50,
        question: "¿Puedes comprarlas?",
        correctAnswer: "sí",
      },
      config,
    );
    expect(inv).toMatchObject({
      kind: "inventarProblema",
      budget: 50,
      items: [{ emoji: "👟", price: 30 }],
      answer: "sí",
    });

    const intv = mapSessionToSheet(
      "intervalosTiempo",
      {
        type: "which-longer",
        activities: [
          { name: "recreo", emoji: "🏃", seconds: 1800, label: "30 minutos" },
          { name: "clase", emoji: "📚", seconds: 3600, label: "1 hora" },
        ],
        showBars: true,
        question: "¿Qué dura más?",
        correctAnswer: "clase",
      },
      config,
    );
    expect(intv).toMatchObject({
      kind: "intervalosTiempo",
      showBars: true,
      answer: "clase",
    });
    if (intv.kind === "intervalosTiempo") expect(intv.activities).toHaveLength(2);
  });

  it("mapea relacionar a columnas con letras y respuestas número→letra", () => {
    const ex = mapSessionToSheet(
      "relacionar",
      {
        pairs: [
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
        ],
        leftColumn: [
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
        ],
        rightColumn: [
          { id: 0, number: 3, imageUrl: "/a.png", objectLabel: "manzanas" },
          { id: 1, number: 1, imageUrl: "/b.png", objectLabel: "peras" },
        ],
      },
      { ...config, withImages: true },
    );
    expect(ex).toMatchObject({
      kind: "relacionar",
      left: [
        { id: 1, number: 1 },
        { id: 0, number: 3 },
      ],
      right: [
        { id: 0, letter: "A", count: 3, imageUrl: "/a.png" },
        { id: 1, letter: "B", count: 1, imageUrl: "/b.png" },
      ],
      answer: ["1 → B", "3 → A"],
    });
  });
});
