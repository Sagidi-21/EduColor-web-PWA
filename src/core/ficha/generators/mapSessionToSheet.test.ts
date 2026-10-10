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

  it("mapea sumaLlevando con 3 sumandos", () => {
    const ex = mapSessionToSheet("sumaLlevando", { addends: [12, 15, 8], answer: 35 }, config);
    expect(ex).toMatchObject({ kind: "tresSumandos", a: 12, b: 15, c: 8, answer: 35 });
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

  it("mapea repartoIgual", () => {
    const ex = mapSessionToSheet(
      "repartoIgual",
      { total: 12, groups: 3, itemsPerGroup: 4 },
      config,
    );
    expect(ex).toMatchObject({ kind: "repartoIgual", total: 12, groups: 3, answer: 4 });
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

  it("mapea ordinales con fila y estrella", () => {
    const ex = mapSessionToSheet(
      "ordinales",
      {
        type: "identify",
        rowSize: 5,
        target: 3,
        fromRight: false,
        question: "¿En qué posición está la estrella?",
        answer: 3,
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
