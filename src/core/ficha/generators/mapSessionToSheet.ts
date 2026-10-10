import { countHowManyPrompt, getObjectImage } from "../../../platform/objectImages";
import { moneyImageUrl } from "../../../platform/moneyImages";
import { kiloImageUrl, REFERENCE_URL as KILO_REFERENCE_URL } from "../../../platform/kiloImages";
import { litroImageUrl, litroReferenceUrl } from "../../../platform/litroImages";
import type { MoneyItem } from "../../activities/monedasBilletes";
import type { KiloItem } from "../../activities/elKilo";
import type { LitroItem } from "../../activities/elLitro";
import type {
  AlgoritmoVerticalSheetExercise,
  Amigos10SheetExercise,
  BalanzaPlateSheet,
  BalanzaSheetExercise,
  CintaMetricaSheetExercise,
  ComparisonSheetExercise,
  CountingSheetExercise,
  ElKiloSheetExercise,
  ElLitroSheetExercise,
  GraficoBarrasSheetExercise,
  IgualdadSheetExercise,
  IntervalosTiempoSheetExercise,
  InventarProblemaSheetExercise,
  LaberintoSheetExercise,
  LeftRightSheetExercise,
  MenuCafeteriaSheetExercise,
  MenuItemSheet,
  MonedasBilletesSheetExercise,
  OperationSheetExercise,
  OrderingSheetExercise,
  OrdinalesSheetExercise,
  ParImparSheetExercise,
  PoligonosSheetExercise,
  ProblemaSheetExercise,
  RelacionarCantidadesSheetExercise,
  RelacionarSheetExercise,
  RelacionSumaRestaSheetExercise,
  RelojSheetExercise,
  RepartoIgualSheetExercise,
  RutaCuadriculaSheetExercise,
  Series3CifrasSheetExercise,
  SeriesNumericasSheetExercise,
  SheetConfig,
  SheetExercise,
  SheetShapeVisual,
  TablaNumericaSheetExercise,
  TresSumandosColumnaSheetExercise,
  TresSumandosSheetExercise,
} from "../types";

const ORDINAL_EMOJIS = ["🏀", "⚽", "🎾", "🏈", "🎱", "🏓", "🎯", "🏐", "⚾", "🏒"];

function asRecord(ex: unknown): Record<string, unknown> {
  return ex && typeof ex === "object" ? (ex as Record<string, unknown>) : { value: ex };
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function answerOf(ex: Record<string, unknown>): string | number | undefined {
  if (typeof ex.answer === "number" || typeof ex.answer === "string") return ex.answer;
  if (typeof ex.correctAnswer === "number" || typeof ex.correctAnswer === "string") {
    return ex.correctAnswer;
  }
  if (typeof ex.result === "number") return ex.result;
  if (typeof ex.product === "number") return ex.product;
  if (typeof ex.itemsPerGroup === "number") return ex.itemsPerGroup;
  return undefined;
}

function questionOf(ex: Record<string, unknown>): string {
  if (typeof ex.question === "string") return ex.question;
  if (typeof ex.prompt === "string") return ex.prompt;
  if (typeof ex.story === "string") return ex.story;
  if (Array.isArray(ex.story)) return ex.story.map(String).join(" ");
  if (typeof ex.a === "number" && typeof ex.b === "number") {
    const op = typeof ex.op === "string" ? ex.op : "+";
    const extra = typeof ex.c === "number" ? ` ${op} ${ex.c}` : "";
    return `${ex.a} ${op} ${ex.b}${extra}`;
  }
  if (Array.isArray(ex.addends)) {
    return `${ex.addends.join(" + ")} = ?`;
  }
  if (typeof ex.table === "number" && typeof ex.factor === "number") {
    return `${ex.table} × ${ex.factor} = ?`;
  }
  return "";
}

function mapOperation(ex: Record<string, unknown>, config: SheetConfig): OperationSheetExercise {
  const opRaw = asString(ex.op);
  const op: "+" | "-" = opRaw === "resta" || opRaw === "-" || opRaw === "−" ? "-" : "+";
  return {
    kind: "operation",
    a: asNumber(ex.a),
    b: asNumber(ex.b),
    op,
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    layout: config.layout,
    answer: asNumber(
      ex.answer,
      op === "+" ? asNumber(ex.a) + asNumber(ex.b) : asNumber(ex.a) - asNumber(ex.b),
    ),
  };
}

function mapCounting(ex: Record<string, unknown>, config: SheetConfig): CountingSheetExercise {
  const count = asNumber(ex.count);
  const objectLabel = asString(ex.objectLabel, "objetos");
  const firstStep = Array.isArray(ex.steps) && ex.steps[0] ? asRecord(ex.steps[0]) : null;
  return {
    kind: "counting",
    count,
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    objectLabel,
    question: asString(firstStep?.prompt, countHowManyPrompt(objectLabel)),
    answer: asNumber(firstStep?.correctAnswer, asNumber(ex.answer, count)),
  };
}

function mapComparison(ex: Record<string, unknown>, config: SheetConfig): ComparisonSheetExercise {
  const q = asString(ex.question);
  const questionType: "mas" | "menos" = q === "less" || q === "menos" ? "menos" : "mas";
  const raw = asString(ex.answer);
  const answer: ComparisonSheetExercise["answer"] =
    raw === "equal" || raw === "iguales" || raw === "igual"
      ? "iguales"
      : raw === "left" || raw === "A"
        ? "A"
        : raw === "right" || raw === "B"
          ? "B"
          : undefined;
  const objectLabel = asString(ex.objectSet ?? ex.objectLabel, "objetos");
  const imageUrl = config.withImages
    ? asString(ex.imageUrl) || getObjectImage(objectLabel, asNumber(ex.objectIndex))
    : "";
  return {
    kind: "comparison",
    countA: asNumber(ex.leftCount ?? ex.countA),
    countB: asNumber(ex.rightCount ?? ex.countB),
    imageUrl,
    objectLabel,
    questionType,
    allowEqual: Boolean(ex.allowEqual),
    difficulty: config.difficulty,
    answer,
  };
}

function shapeFromPoligono(raw: unknown, showVertices = false): SheetShapeVisual | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  const drawRaw = asString(s.drawType, "path");
  const drawType: SheetShapeVisual["drawType"] =
    drawRaw === "circle" ||
    drawRaw === "open_line" ||
    drawRaw === "curved_side" ||
    drawRaw === "primitive"
      ? drawRaw
      : "path";
  return {
    path: asString(s.path),
    drawType,
    color: asString(s.color, "#3b82f6"),
    vertexPoints: Array.isArray(s.vertexPoints)
      ? (s.vertexPoints as { x: number; y: number }[])
      : [],
    showVertices,
    label: asString(s.name || s.label) || undefined,
  };
}

function mapPoligonos(ex: Record<string, unknown>): PoligonosSheetExercise {
  const showVertices = Boolean(ex.showVertices);
  const optionsList = Array.isArray(ex.optionsList)
    ? ex.optionsList
        .map((opt) => shapeFromPoligono(opt, false))
        .filter((s): s is SheetShapeVisual => Boolean(s))
    : undefined;
  return {
    kind: "poligonos",
    question: questionOf(ex),
    answer: answerOf(ex),
    shape: shapeFromPoligono(ex.shape, showVertices),
    optionsList,
  };
}

function mapShapes(ex: Record<string, unknown>, config: SheetConfig): PoligonosSheetExercise {
  const shapeRaw =
    ex.shape && typeof ex.shape === "object" ? (ex.shape as Record<string, unknown>) : {};
  const primitive = asString(shapeRaw.type || shapeRaw.primitive) as SheetShapeVisual["primitive"];
  const shape: SheetShapeVisual = {
    path: "",
    drawType: "primitive",
    color: asString(ex.color, "#3b82f6"),
    primitive:
      primitive === "circle" ||
      primitive === "square" ||
      primitive === "triangle" ||
      primitive === "rectangle" ||
      primitive === "rhombus" ||
      primitive === "oval"
        ? primitive
        : "circle",
    rotation: asNumber(ex.rotation),
    label: asString(shapeRaw.label),
  };
  return {
    kind: "poligonos",
    question: questionOf(ex) || "¿Qué forma es?",
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
    shape,
    imageUrl: config.withImages ? asString(ex.imageUrl) || undefined : undefined,
  };
}

function mapTresSumandos(
  ex: Record<string, unknown>,
  config: SheetConfig,
): TresSumandosSheetExercise {
  return {
    kind: "tresSumandos",
    a: asNumber(ex.a),
    b: asNumber(ex.b),
    c: asNumber(ex.c),
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    answer: asNumber(ex.answer, asNumber(ex.a) + asNumber(ex.b) + asNumber(ex.c)),
  };
}

function mapIgualdad(ex: Record<string, unknown>, config: SheetConfig): IgualdadSheetExercise {
  const raw = asString(ex.type);
  const type: IgualdadSheetExercise["type"] =
    raw === "sumando" || raw === "addend"
      ? "addend"
      : raw === "descomposicion" || raw === "decompose"
        ? "decompose"
        : "result";
  return {
    kind: "igualdad",
    type,
    a: asNumber(ex.a),
    b: asNumber(ex.b),
    c: asNumber(ex.c),
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    answer: asNumber(ex.answer),
  };
}

function mapAlgoritmoVertical(
  ex: Record<string, unknown>,
  op: "+" | "-" = "+",
): AlgoritmoVerticalSheetExercise {
  const a = asNumber(ex.a);
  const b = asNumber(ex.b);
  return {
    kind: "algoritmoVertical",
    op,
    a,
    b,
    aD: asNumber(ex.aD, Math.floor(a / 10)),
    aU: asNumber(ex.aU, a % 10),
    bD: asNumber(ex.bD, Math.floor(b / 10)),
    bU: asNumber(ex.bU, b % 10),
    answer: asNumber(ex.answer, op === "+" ? a + b : a - b),
  };
}

function mapTresSumandosColumna(ex: Record<string, unknown>): TresSumandosColumnaSheetExercise {
  const a = asNumber(ex.a);
  const b = asNumber(ex.b);
  const c = asNumber(ex.c);
  return {
    kind: "tresSumandosColumna",
    a,
    b,
    c,
    aD: asNumber(ex.aD, Math.floor(a / 10)),
    aU: asNumber(ex.aU, a % 10),
    bD: asNumber(ex.bD, Math.floor(b / 10)),
    bU: asNumber(ex.bU, b % 10),
    cD: asNumber(ex.cD, Math.floor(c / 10)),
    cU: asNumber(ex.cU, c % 10),
    answer: asNumber(ex.answer, a + b + c),
  };
}

function mapSumaLlevando(ex: Record<string, unknown>): SheetExercise {
  const addends = Array.isArray(ex.addends) ? ex.addends.map((n) => asNumber(n)) : [];
  if (addends.length === 3) {
    return {
      kind: "tresSumandos",
      a: addends[0]!,
      b: addends[1]!,
      c: addends[2]!,
      imageUrl: "",
      answer: asNumber(ex.answer, addends[0]! + addends[1]! + addends[2]!),
    };
  }
  if (addends.length >= 2) {
    return {
      kind: "operation",
      a: addends[0]!,
      b: addends[1]!,
      op: "+",
      imageUrl: "",
      answer: asNumber(ex.answer, addends[0]! + addends[1]!),
    };
  }
  return mapQuestionKind("algoritmo3Cifras", ex);
}

function mapLeftRight(ex: Record<string, unknown>, config: SheetConfig): LeftRightSheetExercise {
  const raw = asString(ex.answer);
  const answer: "left" | "right" | undefined =
    raw === "left" || raw === "box-left"
      ? "left"
      : raw === "right" || raw === "box-right"
        ? "right"
        : undefined;
  return {
    kind: "leftRight",
    leftObj: asString(ex.leftObj, "A"),
    rightObj: asString(ex.rightObj, "B"),
    leftImgUrl: config.withImages ? asString(ex.leftImgUrl) : "",
    rightImgUrl: config.withImages ? asString(ex.rightImgUrl) : "",
    question: questionOf(ex),
    answer,
  };
}

function mapParImpar(ex: Record<string, unknown>, config: SheetConfig): ParImparSheetExercise {
  const raw = asString(ex.answer).toLowerCase();
  const answer: "par" | "impar" | string | undefined =
    raw === "par" || raw === "even"
      ? "par"
      : raw === "impar" || raw === "odd"
        ? "impar"
        : asString(ex.answer) || undefined;
  const visual =
    ex.visualItems && typeof ex.visualItems === "object"
      ? (ex.visualItems as Record<string, unknown>)
      : null;
  const emoji = config.withImages && visual ? asString(visual.emoji) || undefined : undefined;
  const emojiCount =
    config.withImages && visual ? asNumber(visual.count, asNumber(ex.number)) : undefined;
  return {
    kind: "parImpar",
    question: questionOf(ex),
    number: asNumber(ex.number),
    emoji,
    emojiCount,
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    answer,
  };
}

function mapOrdinales(ex: Record<string, unknown>, config: SheetConfig): OrdinalesSheetExercise {
  const rowSize = asNumber(ex.rowSize, asNumber(ex.count, 5));
  const target = asNumber(ex.target, 1);
  const emoji = config.withImages ? ORDINAL_EMOJIS[(target + rowSize) % ORDINAL_EMOJIS.length] : "";
  return {
    kind: "ordinales",
    question: questionOf(ex),
    count: rowSize,
    emoji,
    target,
    fromRight: Boolean(ex.fromRight),
    imageUrl: "",
    answer: asNumber(ex.answer),
  };
}

function moneySheetItems(
  items: unknown,
  withImages: boolean,
): MonedasBilletesSheetExercise["money"] {
  if (!Array.isArray(items) || !withImages) return [];
  return items.map((raw) => {
    const item = asRecord(raw) as unknown as MoneyItem;
    return {
      url: moneyImageUrl(item),
      label: asString(item.etiqueta || item.corta, "dinero"),
    };
  });
}

function mapMonedasBilletes(
  ex: Record<string, unknown>,
  config: SheetConfig,
): MonedasBilletesSheetExercise {
  const typeRaw = asString(ex.type, "identify");
  const type: MonedasBilletesSheetExercise["type"] =
    typeRaw === "equivalence" || typeRaw === "change" || typeRaw === "shopping"
      ? typeRaw
      : "identify";

  let money: MonedasBilletesSheetExercise["money"] = [];
  if (type === "identify" && ex.item) {
    money = moneySheetItems([ex.item], config.withImages);
  } else if (type === "equivalence") {
    money = moneySheetItems(ex.items, config.withImages);
  } else if (type === "change") {
    money = moneySheetItems(ex.pagado, config.withImages);
  } else if (type === "shopping") {
    money = moneySheetItems(ex.disponibles, config.withImages);
  }

  const producto = ex.producto && typeof ex.producto === "object" ? asRecord(ex.producto) : null;

  return {
    kind: "monedasBilletes",
    type,
    question: questionOf(ex),
    money,
    productEmoji: producto ? asString(producto.emoji) || undefined : undefined,
    productName: producto ? asString(producto.nombre) || undefined : undefined,
    productPriceLabel: asString(ex.precioLabel) || undefined,
    answer: typeof ex.answer === "number" ? ex.answer : asString(ex.answer) || undefined,
  };
}

function mapPhotoItems(
  items: unknown,
  resolve: (item: Record<string, unknown>) => string,
  withImages: boolean,
): { name: string; imageUrl: string }[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const item = asRecord(raw);
    return {
      name: asString(item.name),
      imageUrl: withImages ? resolve(item) : "",
    };
  });
}

function mapElKilo(ex: Record<string, unknown>, config: SheetConfig): ElKiloSheetExercise {
  return {
    kind: "elKilo",
    question: questionOf(ex),
    items: mapPhotoItems(
      ex.items,
      (item) => kiloImageUrl(item as unknown as KiloItem),
      config.withImages,
    ),
    referenceUrl: config.withImages ? KILO_REFERENCE_URL : undefined,
    answer: asString(ex.answer) || undefined,
  };
}

function mapElLitro(ex: Record<string, unknown>, config: SheetConfig): ElLitroSheetExercise {
  return {
    kind: "elLitro",
    question: questionOf(ex),
    items: mapPhotoItems(
      ex.items,
      (item) => litroImageUrl(item as unknown as LitroItem),
      config.withImages,
    ),
    referenceUrl: config.withImages ? litroReferenceUrl() : undefined,
    answer: asString(ex.answer) || undefined,
  };
}

function mapPlate(raw: unknown, withVisual: boolean): BalanzaPlateSheet {
  const p = asRecord(raw);
  return {
    emoji: withVisual ? asString(p.emoji, "⬜") : "",
    count: asNumber(p.count, 1),
    weightLabel:
      p.weightLabel === null || p.weightLabel === undefined ? null : asString(p.weightLabel),
    unknown: Boolean(p.unknown),
  };
}

function mapBalanza(ex: Record<string, unknown>, config: SheetConfig): BalanzaSheetExercise {
  const withVisual = config.withImages;
  return {
    kind: "balanza",
    variant: "compare",
    question: questionOf(ex),
    left: mapPlate(ex.left, withVisual),
    right: mapPlate(ex.right, withVisual),
    tilt:
      asString(ex.tilt) === "left" || asString(ex.tilt) === "right" || asString(ex.tilt) === "equal"
        ? (asString(ex.tilt) as "left" | "right" | "equal")
        : undefined,
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapBalanzaEquilibra(
  ex: Record<string, unknown>,
  config: SheetConfig,
): BalanzaSheetExercise {
  const withVisual = config.withImages;
  const target = asNumber(ex.target, 1);
  const leftEmoji = withVisual ? asString(ex.leftEmoji, "🧱") : "";
  const leftKind = asString(ex.leftKind, "weights");
  return {
    kind: "balanza",
    variant: "equilibra",
    question: questionOf(ex) || `Equilibra la balanza: pon ${target} kg a la derecha`,
    left: {
      emoji: leftEmoji,
      count: leftKind === "weights" ? target : 1,
      weightLabel: asString(ex.leftLabel, `${target} kg`),
      unknown: false,
    },
    right: {
      emoji: withVisual ? "⬜" : "",
      count: 0,
      weightLabel: null,
      unknown: true,
    },
    targetKg: target,
    answer: `${target} kg`,
  };
}

function mapMenuItems(raw: unknown): MenuItemSheet[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = asRecord(item);
    return {
      emoji: asString(r.emoji),
      name: asString(r.name),
      price: asNumber(r.price),
    };
  });
}

function mapGraficoBarras(ex: Record<string, unknown>): GraficoBarrasSheetExercise {
  const barsRaw = Array.isArray(ex.bars) ? ex.bars : [];
  const bars = barsRaw.map((b) => {
    const bar = asRecord(b);
    return {
      etiqueta: asString(bar.etiqueta),
      emoji: asString(bar.emoji),
      valor: asNumber(bar.valor),
    };
  });
  const blank =
    typeof ex.blankBarIndex === "number" && Number.isFinite(ex.blankBarIndex)
      ? ex.blankBarIndex
      : undefined;
  return {
    kind: "graficoBarras",
    titulo: asString(ex.titulo, "Gráfico"),
    bars,
    escalaMax: asNumber(ex.escalaMax, Math.max(1, ...bars.map((b) => b.valor))),
    blankBarIndex: blank,
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapMenuCafeteria(ex: Record<string, unknown>): MenuCafeteriaSheetExercise {
  return {
    kind: "menuCafeteria",
    tray: mapMenuItems(ex.tray),
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapCintaMetrica(ex: Record<string, unknown>): CintaMetricaSheetExercise {
  const item = ex.item && typeof ex.item === "object" ? asRecord(ex.item) : {};
  return {
    kind: "cintaMetrica",
    emoji: asString(item.emoji),
    itemName: asString(item.name),
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapInventarProblema(ex: Record<string, unknown>): InventarProblemaSheetExercise {
  const budget =
    typeof ex.budget === "number" && Number.isFinite(ex.budget) ? ex.budget : undefined;
  return {
    kind: "inventarProblema",
    items: mapMenuItems(ex.items),
    budget,
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapIntervalosTiempo(ex: Record<string, unknown>): IntervalosTiempoSheetExercise {
  const acts = Array.isArray(ex.activities) ? ex.activities : [];
  return {
    kind: "intervalosTiempo",
    type: asString(ex.type),
    activities: acts.map((a) => {
      const act = asRecord(a);
      return {
        emoji: asString(act.emoji),
        name: asString(act.name),
        label: asString(act.label),
        seconds: asNumber(act.seconds),
      };
    }),
    showBars: Boolean(ex.showBars),
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapRelacionSumaResta(ex: Record<string, unknown>): RelacionSumaRestaSheetExercise {
  const total = asNumber(ex.total);
  const partA = asNumber(ex.partA);
  const partB = asNumber(ex.partB, total - partA);
  return {
    kind: "relacionSumaResta",
    total,
    partA,
    partB,
    answer: { suma: total, resta1: partA, resta2: partB },
  };
}

function mapRepartoIgual(ex: Record<string, unknown>): RepartoIgualSheetExercise {
  const total = asNumber(ex.total);
  const groups = asNumber(ex.groups);
  return {
    kind: "repartoIgual",
    total,
    groups,
    answer: asNumber(ex.itemsPerGroup ?? ex.answer, groups ? total / groups : 0),
  };
}

function mapReloj(ex: Record<string, unknown>): RelojSheetExercise {
  const type = asString(ex.type);
  // En digital_to_analog el alumno pone las agujas: en ficha mostramos cara vacía.
  const showHands = type !== "digital_to_analog" && ex.showHands !== false;
  return {
    kind: "reloj",
    hours: asNumber(ex.hours),
    minutes: asNumber(ex.minutes),
    showHands,
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapTablaNumerica(ex: Record<string, unknown>): TablaNumericaSheetExercise {
  const grid = Array.isArray(ex.gridState)
    ? (ex.gridState as (number | null)[])
    : Array.isArray(ex.cells)
      ? (ex.cells as (number | null)[])
      : [];
  return {
    kind: "tablaNumerica",
    cells: grid,
    cols: asNumber(ex.cols, 10),
    rows: asNumber(ex.rows, Math.ceil(grid.length / 10) || 10),
    answer: Array.isArray(ex.answer) ? (ex.answer as (number | null)[]) : grid,
  };
}

function mapLaberinto(ex: Record<string, unknown>): LaberintoSheetExercise {
  const answers =
    ex.answers && typeof ex.answers === "object" ? (ex.answers as Record<string, number>) : {};
  return {
    kind: "laberintoMatematico",
    start: asNumber(ex.start),
    edges: Array.isArray(ex.edges) ? (ex.edges as LaberintoSheetExercise["edges"]) : [],
    answers,
    mode: asString(ex.mode) === "menor" ? "menor" : "mayor",
    correctFin: asString(ex.correctFin),
    question: questionOf(ex),
    answer: answers,
  };
}

function mapRuta(ex: Record<string, unknown>): RutaCuadriculaSheetExercise {
  const gridSize =
    ex.gridSize && typeof ex.gridSize === "object"
      ? (ex.gridSize as { cols: number; rows: number })
      : { cols: asNumber(ex.cols, 5), rows: asNumber(ex.rows, 5) };
  const start =
    ex.start && typeof ex.start === "object"
      ? (ex.start as { x: number; y: number })
      : { x: 0, y: 0 };
  const end =
    ex.end && typeof ex.end === "object"
      ? (ex.end as { x: number; y: number })
      : { x: gridSize.cols - 1, y: gridSize.rows - 1 };
  return {
    kind: "rutaCuadricula",
    gridSize,
    start,
    end,
    obstacles: Array.isArray(ex.obstacles) ? (ex.obstacles as { x: number; y: number }[]) : [],
    answer: asString(ex.answer) || undefined,
  };
}

function mapProblema(ex: Record<string, unknown>): ProblemaSheetExercise {
  return {
    kind: "problemas",
    story: asStringArray(ex.story),
    question: questionOf(ex),
    answer: answerOf(ex),
  };
}

function mapQuestionKind(
  kind: Extract<SheetExercise, { question: string }>["kind"],
  ex: Record<string, unknown>,
): SheetExercise {
  return {
    kind,
    question: questionOf(ex),
    answer: answerOf(ex),
  } as SheetExercise;
}

function mapAmigos10(ex: Record<string, unknown>, config: SheetConfig): Amigos10SheetExercise {
  const given = asNumber(ex.given);
  const complement = asNumber(ex.complement, Math.max(0, 10 - given));
  const raw = ex.correctAnswer ?? ex.answer ?? complement;
  const parsed =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))
        ? Number(raw)
        : complement;
  return {
    kind: "amigos10",
    question: questionOf(ex),
    given,
    showVisual: config.withImages,
    answer: parsed,
  };
}

function mapPosicionesAula(ex: Record<string, unknown>): SheetExercise {
  return {
    kind: "posicionesAula",
    container: (asString(ex.container, "mesa") || "mesa") as "caja" | "mochila" | "mesa" | "silla",
    object: (asString(ex.object, "libro") || "libro") as "pelota" | "lapiz" | "libro" | "goma",
    position: (asString(ex.position, "encima") || "encima") as
      "dentro" | "fuera" | "encima" | "debajo" | "al lado",
    story: asStringArray(ex.story),
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapNumeracion1119(ex: Record<string, unknown>): SheetExercise {
  const raw = asString(ex.type);
  const type =
    raw === "units" || raw === "unidades"
      ? "units"
      : raw === "sequence" || raw === "secuencia"
        ? "sequence"
        : "identify";
  return {
    kind: "numeracion1119",
    type,
    number: asNumber(ex.number),
    question: questionOf(ex),
    answer: answerOf(ex),
  };
}

/**
 * Mapea un ejercicio de sesión del motor a `SheetExercise` tipado para la ficha.
 * Cada actividad del catálogo tiene un destino; las genéricas caen en pregunta+respuesta.
 */
export function mapSessionToSheet(
  activityId: string,
  sessionEx: unknown,
  config: SheetConfig,
): SheetExercise {
  const ex = asRecord(sessionEx);

  switch (activityId) {
    case "suma":
    case "resta":
      return mapOperation(ex, config);
    case "counting":
      return mapCounting(ex, config);
    case "comparison":
      return mapComparison(ex, config);
    case "tresSumandos":
      return mapTresSumandos(ex, config);
    case "igualdad":
      return mapIgualdad(ex, config);
    case "algoritmoVertical":
      return mapAlgoritmoVertical(ex, "+");
    case "restaColumna":
      return mapAlgoritmoVertical(ex, "-");
    case "tresSumandosColumna":
      return mapTresSumandosColumna(ex);
    case "sumaLlevando":
      return mapSumaLlevando(ex);
    case "leftRight":
      return mapLeftRight(ex, config);
    case "parImpar":
      return mapParImpar(ex, config);
    case "relacionSumaResta":
      return mapRelacionSumaResta(ex);
    case "repartoIgual":
      return mapRepartoIgual(ex);
    case "reloj":
    case "relojPonerHora":
      return mapReloj(ex);
    case "tablaNumerica":
      return mapTablaNumerica(ex);
    case "laberintoMatematico":
    case "laberintoMatematico2":
      return mapLaberinto(ex);
    case "rutaCuadricula":
      return mapRuta(ex);
    case "problemas":
    case "datosInnecesarios":
      return mapProblema(ex);
    case "problemas2pasos":
      return {
        kind: "problemas2pasos",
        story: asStringArray(ex.story),
        question: questionOf(ex),
        answer: asNumber(ex.answer),
      };
    case "posicionesAula":
      return mapPosicionesAula(ex);
    case "numeracion1119":
      return mapNumeracion1119(ex);
    case "weekDays":
      return {
        kind: "weekDay",
        question: questionOf(ex),
        answer: asString(ex.answer) || undefined,
      };
    case "capacidad":
      return mapQuestionKind("capacidad", ex);
    case "ordinales":
      return mapOrdinales(ex, config);
    case "numeracion4059":
      return mapQuestionKind("numeracion4059", ex);
    case "numeracion6099":
      return mapQuestionKind("numeracion6099", ex);
    case "numeracion999":
      return mapQuestionKind("numeracion999", ex);
    case "poligonos":
      return mapPoligonos(ex);
    case "shapes":
      return mapShapes(ex, config);
    case "cuerpos3d":
      return mapQuestionKind("cuerpos3d", ex);
    case "simetria":
      return mapQuestionKind("simetria", ex);
    case "circuloCircunferencia":
      return mapQuestionKind("circuloCircunferencia", ex);
    case "lineTypes": {
      const line =
        ex.line && typeof ex.line === "object" ? (ex.line as Record<string, unknown>) : {};
      return {
        kind: "lineTypes",
        svg: asString(ex.svg || line.svg),
        options: asStringArray(ex.options),
        question: questionOf(ex) || "¿Qué tipo de línea es?",
        answer: asString(ex.answer ?? ex.correctAnswer) || undefined,
      };
    }
    case "multiplicacion":
      return mapQuestionKind("multiplicacion", ex);
    case "probabilidad":
      return mapQuestionKind("probabilidad", ex);
    case "redondeo":
      return mapQuestionKind("redondeo", ex);
    case "series3cifras":
      return mapSeries("series3Cifras", ex, config);
    case "seriesNumericas":
      return mapSeries("seriesNumericas", ex, config);
    case "cintaMetrica":
      return mapCintaMetrica(ex);
    case "intervalosTiempo":
      return mapIntervalosTiempo(ex);
    case "elKilo":
      return mapElKilo(ex, config);
    case "elLitro":
      return mapElLitro(ex, config);
    case "vecinosNumero":
      return mapQuestionKind("vecinosNumero", ex);
    case "amigos10":
      return mapAmigos10(ex, config);
    case "lecturaNumeros":
      return mapQuestionKind("lecturaNumeros", ex);
    case "dobleYMitad":
      return mapQuestionKind("dobleYMitad", ex);
    case "abaco3cifras":
      return mapQuestionKind("abaco3Cifras", ex);
    case "algoritmo3cifras":
      return mapQuestionKind("algoritmo3Cifras", ex);
    case "graficoBarras":
      return mapGraficoBarras(ex);
    case "menuCafeteria":
      return mapMenuCafeteria(ex);
    case "monedasBilletes":
      return mapMonedasBilletes(ex, config);
    case "inventarProblema":
      return mapInventarProblema(ex);
    case "balanza":
      return mapBalanza(ex, config);
    case "balanzaEquilibra":
      return mapBalanzaEquilibra(ex, config);
    case "ordenar":
      return mapOrdering(ex);
    case "relacionar":
      return mapRelacionar(ex, config);
    case "relacionarCantidades":
      return mapRelacionarCantidades(ex, config);
    case "rectaNumerica":
    default:
      return mapProblema(ex);
  }
}

function mapOrdering(ex: Record<string, unknown>): OrderingSheetExercise {
  const numbers = Array.isArray(ex.numbers) ? ex.numbers.map((n) => asNumber(n)) : [];
  const direction: OrderingSheetExercise["direction"] =
    asString(ex.direction) === "descending" ? "descending" : "ascending";
  const sorted = Array.isArray(ex.sortedNumbers)
    ? ex.sortedNumbers.map((n) => asNumber(n))
    : [...numbers].sort((a, b) => (direction === "descending" ? b - a : a - b));
  return {
    kind: "ordenar",
    numbers,
    direction,
    answer: sorted,
  };
}

function mapSeries(
  kind: "seriesNumericas" | "series3Cifras",
  ex: Record<string, unknown>,
  config: SheetConfig,
): SeriesNumericasSheetExercise | Series3CifrasSheetExercise {
  const sequence = Array.isArray(ex.sequence)
    ? ex.sequence.map((n) => (typeof n === "number" && Number.isFinite(n) ? n : -1))
    : [];
  const blankFromSeq = sequence.findIndex((n) => n === -1);
  const blankIndex = asNumber(ex.blankIndex, blankFromSeq >= 0 ? blankFromSeq : 0);
  const step = asNumber(ex.step, 1);
  const ascending = ex.ascending !== false;

  const answerRaw = answerOf(ex);
  let answer: number | undefined;
  if (typeof answerRaw === "number" && Number.isFinite(answerRaw)) {
    answer = answerRaw;
  } else if (typeof answerRaw === "string" && answerRaw.trim() !== "") {
    const parsed = Number(answerRaw);
    if (Number.isFinite(parsed)) answer = parsed;
  }

  // Misma regla que pizarra: pista de salto solo en easy/medium.
  const showDir = config.difficulty === "easy" || config.difficulty === "medium";
  const dir = ascending ? `de ${step} en ${step}` : `bajando de ${step} en ${step}`;
  const question = showDir ? `¿Qué número falta? (${dir})` : "¿Qué número falta?";

  return {
    kind,
    sequence,
    blankIndex,
    step,
    ascending,
    question,
    answer,
  };
}

function mapRelacionar(ex: Record<string, unknown>, config: SheetConfig): RelacionarSheetExercise {
  const leftRaw = Array.isArray(ex.leftColumn) ? ex.leftColumn : [];
  const rightRaw = Array.isArray(ex.rightColumn) ? ex.rightColumn : [];

  const left = leftRaw.map((item) => {
    const pair = asRecord(item);
    return { id: asNumber(pair.id), number: asNumber(pair.number) };
  });

  const right = rightRaw.map((item, i) => {
    const pair = asRecord(item);
    return {
      id: asNumber(pair.id),
      letter: String.fromCharCode(65 + i),
      count: asNumber(pair.number),
      imageUrl: config.withImages ? asString(pair.imageUrl) : "",
      objectLabel: asString(pair.objectLabel, "objetos"),
    };
  });

  const idToLetter = new Map(right.map((r) => [r.id, r.letter]));
  const answer = [...left]
    .sort((a, b) => a.number - b.number)
    .map((l) => `${l.number} → ${idToLetter.get(l.id) ?? "?"}`);

  return { kind: "relacionar", left, right, answer };
}

function mapRelacionarCantidades(
  ex: Record<string, unknown>,
  config: SheetConfig,
): RelacionarCantidadesSheetExercise {
  const leftRaw = Array.isArray(ex.leftColumn) ? ex.leftColumn : [];
  const rightRaw = Array.isArray(ex.rightColumn) ? ex.rightColumn : [];
  const first = leftRaw[0] ? asRecord(leftRaw[0]) : {};

  const left = leftRaw.map((item) => {
    const pair = asRecord(item);
    const cantidadesRaw = Array.isArray(pair.izquierda) ? pair.izquierda : [];
    return {
      id: asNumber(pair.id),
      text: asString(pair.leftText),
      cantidades: cantidadesRaw.map((c) => {
        const cant = asRecord(c);
        return {
          total: asNumber(cant.total),
          rotulo: asString(cant.rotulo) || undefined,
        };
      }),
    };
  });

  const right = rightRaw.map((item, i) => {
    const pair = asRecord(item);
    return {
      id: asNumber(pair.id),
      letter: String.fromCharCode(65 + i),
      text: asString(pair.rightText),
    };
  });

  const idToLetter = new Map(right.map((r) => [r.id, r.letter]));
  const answer = left.map((l) => `${l.text} → ${idToLetter.get(l.id) ?? "?"}`);

  return {
    kind: "relacionarCantidades",
    left,
    right,
    imageUrl: config.withImages ? asString(first.imageUrl) : "",
    objectLabel: asString(first.objectLabel, "objetos"),
    answer,
  };
}
