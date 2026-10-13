import { countHowManyPrompt, getObjectImage } from "../../../platform/objectImages";
import { moneyImageUrl } from "../../../platform/moneyImages";
import { kiloImageUrl, REFERENCE_URL as KILO_REFERENCE_URL } from "../../../platform/kiloImages";
import { litroImageUrl, litroReferenceUrl } from "../../../platform/litroImages";
import type { MoneyItem } from "../../activities/monedasBilletes";
import type { KiloItem } from "../../activities/elKilo";
import type { LitroItem } from "../../activities/elLitro";
import { formatWeightSolutions } from "../../activities/balanzaEquilibra";
import { marcasEje } from "../../activities/graficoBarras";
import { timeLabel } from "../../activities/shared/timeLabel";
import {
  capitalizeFirst,
  handForBox,
  parseBagContext,
  printDragQuestion,
  shortestRouteArrows,
} from "./sceneHelpers";
import type {
  Algoritmo3CifrasSheetExercise,
  CapacidadSheetExercise,
  AlgoritmoVerticalSheetExercise,
  Amigos10SheetExercise,
  BalanzaPlateSheet,
  BalanzaSheetExercise,
  CintaMetricaSheetExercise,
  CirculoCircunferenciaSheetExercise,
  ComparisonSheetExercise,
  CountingSheetExercise,
  Cuerpos3DSheetExercise,
  DatosInnecesariosSheetExercise,
  ElKiloSheetExercise,
  ElLitroSheetExercise,
  GraficoBarrasSheetExercise,
  IgualdadSheetExercise,
  IntervalosTiempoSheetExercise,
  InventarProblemaSheetExercise,
  LaberintoSheetExercise,
  LeftRightDragObjectSheet,
  LeftRightSheetExercise,
  MenuCafeteriaSheetExercise,
  MenuItemSheet,
  MonedasBilletesSheetExercise,
  MultiplicacionSheetExercise,
  OperationSheetExercise,
  OrderingSheetExercise,
  OrdinalesSheetExercise,
  ParImparSheetExercise,
  PoligonosSheetExercise,
  PosicionesAulaSheetExercise,
  ProbabilidadSheetExercise,
  ProblemaSheetExercise,
  Problemas2PasosSheetExercise,
  RectaNumericaSheetExercise,
  RelacionarCantidadesSheetExercise,
  RelacionarSheetExercise,
  RelacionSumaRestaSheetExercise,
  RelojClockChoiceSheet,
  RelojSheetExercise,
  RepartoIgualSheetExercise,
  RutaCuadriculaSheetExercise,
  Series3CifrasSheetExercise,
  SeriesNumericasSheetExercise,
  SheetConfig,
  SheetExercise,
  SheetShapeVisual,
  SimetriaSheetExercise,
  SumaLlevandoSheetExercise,
  TablaNumericaCellKind,
  TablaNumericaSheetCell,
  TablaNumericaSheetExercise,
  TresSumandosColumnaSheetExercise,
  TresSumandosSheetExercise,
} from "../types";

const ORDINAL_EMOJIS_FALLBACK = [
  "🏀",
  "⚽",
  "🎾",
  "🏈",
  "🎱",
  "🏓",
  "🎯",
  "🏐",
  "⚾",
  "🏒",
  "🏉",
  "🎳",
  "🏸",
  "🥊",
  "⛸️",
  "🎿",
  "🥇",
  "🏆",
  "🎽",
  "🧢",
];

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

function choiceLabelsFromOptions(optionsRaw: unknown): string[] {
  if (!Array.isArray(optionsRaw)) return [];
  return optionsRaw
    .map((opt) => {
      if (opt && typeof opt === "object") {
        const o = opt as Record<string, unknown>;
        return asString(o.label) || asString(o.value) || asString(o.id);
      }
      return asString(opt);
    })
    .filter(Boolean);
}

function mapPoligonos(ex: Record<string, unknown>): PoligonosSheetExercise {
  const showVertices = Boolean(ex.showVertices);
  const optionsList = Array.isArray(ex.optionsList)
    ? ex.optionsList
        .map((opt) => shapeFromPoligono(opt, false))
        .filter((s): s is SheetShapeVisual => Boolean(s))
    : undefined;
  // Expert: rejilla de figuras a elegir → sin figura de referencia.
  const hasFigureOptions = Boolean(optionsList && optionsList.length > 0);
  const choiceLabels = choiceLabelsFromOptions(ex.options);
  const answerRaw = answerOf(ex);
  const answerFromOpt = Array.isArray(ex.options)
    ? ex.options.find((opt) => {
        if (!opt || typeof opt !== "object") return false;
        const o = opt as Record<string, unknown>;
        return asString(o.value) === String(answerRaw) || asString(o.id) === String(answerRaw);
      })
    : undefined;
  const answerLabel =
    answerFromOpt && typeof answerFromOpt === "object"
      ? asString((answerFromOpt as Record<string, unknown>).label) || String(answerRaw ?? "")
      : answerRaw;
  return {
    kind: "poligonos",
    question: questionOf(ex),
    answer: answerLabel,
    shape: hasFigureOptions ? undefined : shapeFromPoligono(ex.shape, showVertices),
    optionsList,
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
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

  const optionsRaw = Array.isArray(ex.options) ? ex.options : [];
  const choiceLabels = optionsRaw
    .map((opt) => {
      if (opt && typeof opt === "object") {
        const o = opt as Record<string, unknown>;
        return asString(o.label) || asString(o.id);
      }
      return asString(opt);
    })
    .filter(Boolean);

  const correctId = asString(ex.correctAnswer ?? ex.answer);
  const answerFromOptions = optionsRaw.find((opt) => {
    if (!opt || typeof opt !== "object") return false;
    return asString((opt as Record<string, unknown>).id) === correctId;
  });
  const answerFromOptLabel =
    answerFromOptions && typeof answerFromOptions === "object"
      ? asString((answerFromOptions as Record<string, unknown>).label)
      : "";
  const answerLabel = asString(shapeRaw.label) || answerFromOptLabel || correctId;

  const imageUrl = config.withImages ? asString(ex.imageUrl) || undefined : undefined;
  const question =
    questionOf(ex) || (imageUrl ? "¿Qué forma tiene este objeto?" : "¿Cómo se llama esta figura?");

  return {
    kind: "poligonos",
    question,
    answer: answerLabel || undefined,
    shape,
    imageUrl,
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
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
  const choiceLabels = choiceLabelsFromOptions(ex.options);
  return {
    kind: "igualdad",
    type,
    a: asNumber(ex.a),
    b: asNumber(ex.b),
    c: asNumber(ex.c),
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    answer: answerOf(ex),
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

/** Suma llevando: cuadrícula D·U con casilla de llevada propia (como pizarra). */
function mapSumaLlevando(ex: Record<string, unknown>): SumaLlevandoSheetExercise {
  const addends = Array.isArray(ex.addends) ? ex.addends.map((n) => asNumber(n)) : [];
  return {
    kind: "sumaLlevando",
    addends,
    answer: asNumber(
      ex.answer,
      addends.reduce((acc, n) => acc + n, 0),
    ),
  };
}

/** Algoritmo C·D·U con casillas de llevar/prestar (`ColumnCarryOperation` en pizarra). */
function mapAlgoritmo3Cifras(ex: Record<string, unknown>): Algoritmo3CifrasSheetExercise {
  const opRaw = asString(ex.op);
  const op: "+" | "-" = opRaw === "-" || opRaw === "−" || opRaw === "resta" ? "-" : "+";
  const a = asNumber(ex.a);
  const b = asNumber(ex.b);
  return {
    kind: "algoritmo3Cifras",
    op,
    a,
    b,
    aC: asNumber(ex.aC, Math.floor(a / 100)),
    aD: asNumber(ex.aD, Math.floor((a % 100) / 10)),
    aU: asNumber(ex.aU, a % 10),
    bC: asNumber(ex.bC, Math.floor(b / 100)),
    bD: asNumber(ex.bD, Math.floor((b % 100) / 10)),
    bU: asNumber(ex.bU, b % 10),
    carryLabel: op === "+" ? "llevar" : "prestar",
    answer: asNumber(ex.result ?? ex.answer, op === "+" ? a + b : a - b),
  };
}

/** Recta numérica: SVG con marcas; el alumno señala `target` (sin arrastre en papel). */
function mapRectaNumerica(ex: Record<string, unknown>): RectaNumericaSheetExercise {
  const max = Math.max(1, asNumber(ex.max, 10));
  const target = asNumber(ex.target);
  return {
    kind: "rectaNumerica",
    target,
    max,
    labelEvery: Math.max(1, asNumber(ex.labelEvery, max <= 10 ? 5 : 10)),
    answer: target,
  };
}

/** Multiplicación como unir columnas: operaciones a la izquierda, productos a la derecha. */
function mapMultiplicacion(ex: Record<string, unknown>): MultiplicacionSheetExercise {
  const pairsRaw = Array.isArray(ex.pairs) ? ex.pairs : [];
  const leftRaw = Array.isArray(ex.leftColumn) ? ex.leftColumn : pairsRaw;
  const rightRaw = Array.isArray(ex.rightColumn) ? ex.rightColumn : pairsRaw;

  const left = leftRaw.map((item) => {
    const p = asRecord(item);
    return { id: asNumber(p.id), table: asNumber(p.table), factor: asNumber(p.factor) };
  });
  const right = rightRaw.map((item) => {
    const p = asRecord(item);
    return { id: asNumber(p.id), product: asNumber(p.product) };
  });

  const answer = [...left]
    .sort((x, y) => x.id - y.id)
    .map((l) => {
      const product = right.find((r) => r.id === l.id)?.product ?? l.table * l.factor;
      return `${l.table} × ${l.factor} = ${product}`;
    });

  return { kind: "multiplicacion", left, right, answer };
}

const LEFT_RIGHT_CHAR_KINDS = ["char-click", "char-drag-one", "char-drag-both"] as const;

/** Escena con personaje (nivel experto): caja izquierda | personaje | caja derecha. */
function mapLeftRightChar(
  ex: Record<string, unknown>,
  config: SheetConfig,
  variant: (typeof LEFT_RIGHT_CHAR_KINDS)[number],
): LeftRightSheetExercise {
  const perspective: "frente" | "espaldas" =
    asString(ex.perspective) === "espaldas" ? "espaldas" : "frente";
  const answerBox = asString(ex.answer);
  const objectsRaw = Array.isArray(ex.objects) ? ex.objects.map((o) => asRecord(o)) : [];

  // Solo los objetos que intervienen se «usan» en soluciones; todos se dibujan al alumno.
  const dragObjects: LeftRightDragObjectSheet[] =
    variant === "char-click"
      ? []
      : objectsRaw.map((o) => ({
          label: asString(o.label, "objeto"),
          imageUrl: config.withImages ? asString(o.imgUrl) : "",
        }));

  const handOf = (box: string): string =>
    box === "box-left" || box === "box-right" ? `mano ${handForBox(box, perspective)}` : "mano ?";

  let answer: string | undefined;
  if (variant === "char-click") {
    answer = answerBox === "box-left" || answerBox === "box-right" ? handOf(answerBox) : undefined;
  } else if (variant === "char-drag-one") {
    const target = objectsRaw.find((o) => asString(o.targetBox) === answerBox);
    answer = target ? `${asString(target.label, "objeto")} → ${handOf(answerBox)}` : undefined;
  } else {
    const placed = objectsRaw.filter((o) => {
      const box = asString(o.targetBox);
      return box === "box-left" || box === "box-right";
    });
    answer =
      placed.length > 0
        ? placed
            .map((o) => `${asString(o.label, "objeto")} → ${handOf(asString(o.targetBox))}`)
            .join(" · ")
        : undefined;
  }

  const rawQuestion = questionOf(ex);
  return {
    kind: "leftRight",
    variant,
    leftObj: "",
    rightObj: "",
    leftImgUrl: "",
    rightImgUrl: "",
    question: variant === "char-click" ? rawQuestion : printDragQuestion(rawQuestion),
    // La imagen del personaje es la escena: sin ella no se sabe de frente/espaldas.
    char: {
      imageUrl: asString(ex.charImgUrl),
      name: asString(ex.charName, "el personaje"),
      perspective,
    },
    dragObjects,
    answer,
  };
}

function mapLeftRight(ex: Record<string, unknown>, config: SheetConfig): LeftRightSheetExercise {
  const kindRaw = asString(ex.kind);
  const charVariant = LEFT_RIGHT_CHAR_KINDS.find((k) => k === kindRaw);
  if (charVariant) return mapLeftRightChar(ex, config, charVariant);

  const raw = asString(ex.answer);
  const answer: string | undefined =
    raw === "left" || raw === "box-left" || raw === "izquierda"
      ? "left"
      : raw === "right" || raw === "box-right" || raw === "derecha"
        ? "right"
        : raw || undefined;
  const choices = [...new Set(asStringArray(ex.options))];
  return {
    kind: "leftRight",
    variant: "pair",
    leftObj: asString(ex.leftObj, "A"),
    rightObj: asString(ex.rightObj, "B"),
    leftImgUrl: config.withImages ? asString(ex.leftImgUrl) : "",
    rightImgUrl: config.withImages ? asString(ex.rightImgUrl) : "",
    question: questionOf(ex),
    choiceLabels: choices.length > 0 ? choices : undefined,
    showSideLabels: config.difficulty === "easy",
    answer,
  };
}

function mapParImpar(ex: Record<string, unknown>, config: SheetConfig): ParImparSheetExercise {
  const isWrite = asString(ex.type) === "write";
  const extra =
    ex.extraData && typeof ex.extraData === "object"
      ? (ex.extraData as Record<string, unknown>)
      : null;
  const validAnswers =
    isWrite && Array.isArray(extra?.validAnswers)
      ? extra.validAnswers.map((v) => asString(v)).filter(Boolean)
      : [];

  const raw = asString(ex.answer).toLowerCase();
  // Escritura: la solución lista todas las posibilidades (p. ej. 52, 54).
  const answer: "par" | "impar" | string | undefined = isWrite
    ? validAnswers.length > 0
      ? validAnswers.join(", ")
      : asString(ex.answer) || undefined
    : raw === "par" || raw === "even"
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
  const choiceLabels = choiceLabelsFromOptions(ex.options);
  return {
    kind: "parImpar",
    question: questionOf(ex),
    number: asNumber(ex.number),
    emoji,
    emojiCount,
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    // Escritura: sin • Par/Impar ni recuadro; el alumno escribe los números.
    // `[]` evita el fallback a Par/Impar del renderer.
    choiceLabels: isWrite ? [] : choiceLabels.length > 0 ? choiceLabels : undefined,
    writeIn: false,
    answer,
  };
}

function mapOrdinales(ex: Record<string, unknown>, config: SheetConfig): OrdinalesSheetExercise {
  const rowSize = asNumber(ex.rowSize, asNumber(ex.count, 5));
  const target = asNumber(ex.target, 1);
  const answer = asNumber(ex.answer);
  const rawType = asString(ex.type);
  const variant: "identify" | "position" | "fromRight" =
    rawType === "position" || rawType === "fromRight" ? rawType : "identify";
  const fromEngine = asString(ex.emoji);
  const emoji = config.withImages
    ? fromEngine ||
      ORDINAL_EMOJIS_FALLBACK[(target + rowSize + answer) % ORDINAL_EMOJIS_FALLBACK.length]!
    : "";
  const ordinalLabel =
    answer >= 1 && answer <= 10
      ? ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"][answer - 1]
      : `${answer}º`;
  // Identify (easy y expert en ficha): redondear sobre la serie; sin casilla ni marca.
  const question = variant === "identify" ? `Redondea la posición ${ordinalLabel}` : questionOf(ex);
  return {
    kind: "ordinales",
    variant,
    question,
    count: rowSize,
    emoji,
    target,
    fromRight: Boolean(ex.fromRight),
    difficulty: config.difficulty,
    imageUrl: "",
    answer,
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
  // identify / equivalence / change: MC. shopping (expert): rodear monedas, sin opciones.
  const choiceLabels = type === "shopping" ? undefined : optionLabels(ex.options);
  const question =
    type === "shopping" && !asString(ex.question)
      ? "Rodea las monedas o billetes para pagar exactamente el precio."
      : questionOf(ex);

  return {
    kind: "monedasBilletes",
    type,
    question,
    money,
    choiceLabels,
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

function optionLabels(raw: unknown): string[] | undefined {
  const labels = asStringArray(raw);
  return labels.length > 0 ? labels : undefined;
}

function mapElKilo(ex: Record<string, unknown>, config: SheetConfig): ElKiloSheetExercise {
  const type = asString(ex.type, "classify");
  // classify: Más/Menos de 1 kg.
  // which-heavier / which-lighter: el nombre ya va bajo cada foto → sin opciones.
  const showChoices = type === "classify";
  // Expert: sin pesa de referencia en ninguna pregunta del nivel.
  const showReference = config.withImages && config.difficulty !== "expert";
  return {
    kind: "elKilo",
    question: questionOf(ex),
    items: mapPhotoItems(
      ex.items,
      (item) => kiloImageUrl(item as unknown as KiloItem),
      config.withImages,
    ),
    referenceUrl: showReference ? KILO_REFERENCE_URL : undefined,
    choiceLabels: showChoices ? optionLabels(ex.options) : undefined,
    answer: asString(ex.answer) || undefined,
  };
}

function mapElLitro(ex: Record<string, unknown>, config: SheetConfig): ElLitroSheetExercise {
  const type = asString(ex.type, "classify");
  // classify (easy y mezclas): Más/Menos de 1 L.
  // which-more / which-less: el nombre ya va bajo cada foto → sin opciones.
  const showChoices = type === "classify";
  // Expert: sin botella de referencia en ninguna pregunta del nivel.
  const showReference = config.withImages && config.difficulty !== "expert";
  return {
    kind: "elLitro",
    question: questionOf(ex),
    items: mapPhotoItems(
      ex.items,
      (item) => litroImageUrl(item as unknown as LitroItem),
      config.withImages,
    ),
    referenceUrl: showReference ? litroReferenceUrl() : undefined,
    choiceLabels: showChoices ? optionLabels(ex.options) : undefined,
    answer: asString(ex.answer) || undefined,
  };
}

function mapPlate(raw: unknown, withVisual: boolean): BalanzaPlateSheet {
  const p = asRecord(raw);
  const blocks = asNumber(p.weightBlocks, 0);
  const blocksLabel =
    p.weightBlocksLabel === null || p.weightBlocksLabel === undefined
      ? null
      : asString(p.weightBlocksLabel);
  return {
    emoji: withVisual ? asString(p.emoji, "⬜") : "",
    count: asNumber(p.count, 1),
    weightLabel:
      p.weightLabel === null || p.weightLabel === undefined ? null : asString(p.weightLabel),
    weightBlocks: blocks > 0 ? blocks : undefined,
    weightBlocksLabel: blocks > 0 ? blocksLabel || `${blocks} kg` : undefined,
    unknown: Boolean(p.unknown),
  };
}

/**
 * Medium/hard: MÁS / MENOS / IGUAL en ficha.
 * Medium usa tilt (left/right/equal); hard usa more/less/equal.
 */
const BALANZA_TILT_SHORT: Record<string, string> = {
  left: "MÁS",
  right: "MENOS",
  equal: "IGUAL",
  more: "MÁS",
  less: "MENOS",
};

function mapBalanza(ex: Record<string, unknown>, config: SheetConfig): BalanzaSheetExercise {
  const withVisual = config.withImages;
  const optionsRaw = Array.isArray(ex.options) ? ex.options : [];
  const choiceLabels = choiceLabelsFromOptions(optionsRaw);
  const correct = asString(ex.correctAnswer ?? ex.answer);
  const matched = optionsRaw.find((opt) => {
    if (!opt || typeof opt !== "object") return false;
    return asString((opt as Record<string, unknown>).value) === correct;
  });
  const answerFromOpt = matched
    ? asString((matched as Record<string, unknown>).label) || correct
    : correct;

  // Easy: nombres de objetos. Medium/hard: MENOS / IGUAL / MÁS bajo la balanza.
  // Expert: sin MC; hint «escribe el número correcto».
  let sheetChoices: string[] | undefined;
  let answerLabel = answerFromOpt;
  if (config.difficulty === "easy" && choiceLabels.length > 0) {
    sheetChoices = choiceLabels;
  } else if (config.difficulty === "medium" || config.difficulty === "hard") {
    sheetChoices = ["MENOS", "IGUAL", "MÁS"];
    answerLabel = BALANZA_TILT_SHORT[correct] || answerFromOpt;
  }

  const isHard = config.difficulty === "hard";
  return {
    kind: "balanza",
    variant: "compare",
    question: questionOf(ex),
    left: mapPlate(ex.left, withVisual),
    right: mapPlate(ex.right, withVisual),
    // Hard: sin balanza inclinada (pesos del catálogo no son reales).
    showScale: !isHard,
    tilt: isHard
      ? undefined
      : asString(ex.tilt) === "left" ||
          asString(ex.tilt) === "right" ||
          asString(ex.tilt) === "equal"
        ? (asString(ex.tilt) as "left" | "right" | "equal")
        : undefined,
    choiceLabels: sheetChoices,
    writeHint: config.difficulty === "expert",
    answer: answerLabel || undefined,
  };
}

function mapBalanzaEquilibra(
  ex: Record<string, unknown>,
  _config: SheetConfig,
): BalanzaSheetExercise {
  const target = asNumber(ex.target, 1);
  const leftKind = asString(ex.leftKind, "weights");
  // Esta actividad solo usa emojis (no fotos): siempre hay icono, con o sin «imágenes».
  const rawEmoji = asString(ex.leftEmoji);
  const leftEmoji = rawEmoji || (leftKind === "object" ? "📦" : "🧱");
  const weightChips = weightChipsOf(ex);
  // Expert (1 kg y 2 kg): listar todas las combinaciones; easy/medium/hard: el total.
  const answer =
    weightChips.length > 1 ? formatWeightSolutions(target, weightChips) : `${target} kg`;
  return {
    kind: "balanza",
    variant: "equilibra",
    question:
      questionOf(ex) ||
      "Equilibra la balanza: elige pesas para el platillo derecho (cuántas de cada una).",
    left: {
      emoji: leftEmoji,
      count: leftKind === "weights" ? target : 1,
      weightLabel: asString(ex.leftLabel, `${target} kg`),
      unknown: false,
    },
    right: {
      emoji: "🧱",
      count: 0,
      weightLabel: null,
      unknown: true,
    },
    targetKg: target,
    leftKind: leftKind === "object" ? "object" : "weights",
    weightChips,
    answer,
  };
}

/** Denominaciones de pesa de la paleta de pizarra ([1] o [1, 2]); por defecto 1 kg. */
function weightChipsOf(ex: Record<string, unknown>): number[] {
  const chips = Array.isArray(ex.allowed)
    ? ex.allowed.filter((n): n is number => typeof n === "number" && n > 0)
    : [];
  return chips.length > 0 ? chips : [1];
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

/** Líneas del eje Y en ficha: una por unidad. */
function marcasEjeUnitarias(tope: number): number[] {
  const max = Math.max(1, Math.floor(tope));
  return Array.from({ length: max }, (_, i) => i + 1);
}

/** Números del eje: valores únicos de las columnas, ordenados. */
function etiquetasDesdeColumnas(valores: number[]): number[] {
  return [...new Set(valores.filter((v) => Number.isFinite(v) && v > 0))].sort((a, b) => a - b);
}

function mapGraficoBarras(
  ex: Record<string, unknown>,
  config: SheetConfig,
): GraficoBarrasSheetExercise {
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
  const escalaMax = asNumber(ex.escalaMax, Math.max(1, ...bars.map((b) => b.valor)));
  const isExpert = config.difficulty === "expert";
  return {
    kind: "graficoBarras",
    titulo: asString(ex.titulo, "Gráfico"),
    bars,
    escalaMax,
    marcas: marcasEjeUnitarias(escalaMax),
    etiquetasEje: isExpert
      ? marcasEje(escalaMax)
      : etiquetasDesdeColumnas(bars.map((b) => b.valor)),
    blankBarIndex: blank,
    question: questionOf(ex),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapMenuCafeteria(
  ex: Record<string, unknown>,
  config: SheetConfig,
): MenuCafeteriaSheetExercise {
  const optionsRaw = Array.isArray(ex.options) ? ex.options : [];
  const choiceLabels = choiceLabelsFromOptions(optionsRaw);
  const correct = asString(ex.correctAnswer ?? ex.answer);
  // Hard usa value yes/no con etiqueta «Sí, me llega»: la solución muestra la etiqueta.
  const matched = optionsRaw.find((opt) => {
    if (!opt || typeof opt !== "object") return false;
    return asString((opt as Record<string, unknown>).value) === correct;
  });
  const answerLabel =
    matched && typeof matched === "object"
      ? asString((matched as Record<string, unknown>).label) || correct
      : correct;
  const menu = mapMenuItems(ex.menuItems);
  const difficulty = config.difficulty;
  const selectedHighlight =
    difficulty === "easy" ? "accent" : difficulty === "medium" ? "black" : undefined;
  return {
    kind: "menuCafeteria",
    tray: mapMenuItems(ex.tray),
    menu: menu.length > 0 ? menu : undefined,
    question: questionOf(ex),
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    highlightQuestionPrices: difficulty !== "expert" ? true : undefined,
    selectedHighlight,
    answer: answerLabel || undefined,
  };
}

function mapCintaMetrica(ex: Record<string, unknown>): CintaMetricaSheetExercise {
  const item = ex.item && typeof ex.item === "object" ? asRecord(ex.item) : {};
  const typeRaw = asString(ex.type);
  const exerciseType: "choose-unit" | "estimate" | undefined =
    typeRaw === "estimate" ? "estimate" : typeRaw === "choose-unit" ? "choose-unit" : undefined;
  const choiceLabels = asStringArray(ex.options);
  // choose-unit: el niño rellena el hueco (cm/m); estimate: opciones •.
  const showChoices = exerciseType === "estimate" && choiceLabels.length > 0;
  return {
    kind: "cintaMetrica",
    exerciseType,
    emoji: asString(item.emoji),
    itemName: asString(item.name),
    question: questionOf(ex),
    choiceLabels: showChoices ? choiceLabels : undefined,
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapInventarProblema(
  ex: Record<string, unknown>,
  config?: SheetConfig,
): InventarProblemaSheetExercise {
  const budget =
    typeof ex.budget === "number" && Number.isFinite(ex.budget) ? ex.budget : undefined;
  const difficulty = config?.difficulty;
  const items = mapMenuItems(ex.items);
  const rawAnswer = asString(ex.correctAnswer ?? ex.answer) || undefined;
  const isEasy = difficulty === "easy";
  // En easy la ficha etiqueta A/B y la solución es la letra, no el nombre.
  let answer = rawAnswer;
  if (isEasy && rawAnswer) {
    const idx = items.findIndex((item) => item.name === rawAnswer);
    if (idx >= 0 && idx < 26) answer = String.fromCharCode(65 + idx);
  }
  return {
    kind: "inventarProblema",
    items,
    budget,
    question: questionOf(ex),
    highlightCompare: isEasy ? true : undefined,
    showItemLetters: isEasy ? true : undefined,
    highlightItemPrices: difficulty === "medium" || difficulty === "hard" ? true : undefined,
    highlightQuestionPrices: difficulty === "hard" ? true : undefined,
    leaveWorkSpace:
      difficulty === "medium" || difficulty === "hard" || difficulty === "expert"
        ? true
        : undefined,
    answer,
  };
}

function mapIntervalosTiempo(ex: Record<string, unknown>): IntervalosTiempoSheetExercise {
  const acts = Array.isArray(ex.activities) ? ex.activities : [];
  const choiceLabels = choiceLabelsFromOptions(ex.options);
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
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
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

function mapRepartoIgual(
  ex: Record<string, unknown>,
  config: SheetConfig,
): RepartoIgualSheetExercise {
  const total = asNumber(ex.total);
  const groups = asNumber(ex.groups);
  return {
    kind: "repartoIgual",
    total,
    groups,
    // Misma regla que pizarra: puntos + cajas solo en easy/medium.
    showVisual: config.difficulty === "easy" || config.difficulty === "medium",
    answer: asNumber(ex.itemsPerGroup ?? ex.answer, groups ? total / groups : 0),
  };
}

function digitalTime(hours: number, minutes: number): string {
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/** Hora digital o verbal presente en el enunciado (para color de clase). */
function relojHighlightTime(question: string, hours: number, minutes: number): string | undefined {
  const digital = digitalTime(hours, minutes);
  if (question.includes(digital)) return digital;
  const verbal = timeLabel(hours, minutes);
  if (question.includes(verbal)) return verbal;
  return undefined;
}

/**
 * Reloj (como en pizarra):
 * - analog_to_digital / match_scene: esfera con agujas + opciones ○ (horas digitales).
 * - digital_read: display digital + opciones ○ en palabras (sin esfera);
 *   hard → opciones en vertical a la derecha de la caja.
 * - digital_to_analog: medium → minirelojes A–D (hora ya en enunciado, sin digital);
 *   hard/expert → esfera vacía para dibujar las agujas (+ digital de apoyo).
 */
function mapReloj(ex: Record<string, unknown>, config?: SheetConfig): RelojSheetExercise {
  const type = asString(ex.type);
  const hours = asNumber(ex.hours);
  const minutes = asNumber(ex.minutes);
  const digital = digitalTime(hours, minutes);
  const correct = asString(ex.correctAnswer ?? ex.answer) || undefined;
  const labels = choiceLabelsFromOptions(ex.options);
  const question = questionOf(ex);
  const base = {
    kind: "reloj" as const,
    hours,
    minutes,
    type: type || undefined,
    question,
  };

  if (type === "digital_read") {
    return {
      ...base,
      showAnalog: false,
      showHands: false,
      showDigital: true,
      digitalLabel: digital,
      choiceLabels: labels.length > 0 ? labels : undefined,
      choiceLayout: config?.difficulty === "hard" ? "aside" : "below",
      highlightTime: relojHighlightTime(question, hours, minutes),
      answer: correct,
    };
  }

  if (type === "digital_to_analog") {
    const higherLevel = config?.difficulty === "hard" || config?.difficulty === "expert";
    if (higherLevel || labels.length === 0) {
      // Expert: la hora ya va en el enunciado → sin reloj digital duplicado.
      const showDigital = config?.difficulty !== "expert";
      const drawQuestion = `Dibuja las agujas para que el reloj marque las ${digital}.`;
      return {
        ...base,
        question: drawQuestion,
        showAnalog: true,
        showHands: false,
        drawHands: true,
        showDigital,
        digitalLabel: showDigital ? digital : undefined,
        highlightTime: digital,
        answer: correct ?? digital,
      };
    }
    const clockChoices: RelojClockChoiceSheet[] = labels.map((label, i) => {
      const [h, m] = label.split(":").map((n) => Number(n));
      return {
        letter: String.fromCharCode(65 + i),
        label,
        hours: Number.isFinite(h) ? (h as number) : 12,
        minutes: Number.isFinite(m) ? (m as number) : 0,
      };
    });
    const correctChoice = clockChoices.find((c) => c.label === correct);
    // Medium: la hora ya va en el enunciado → sin reloj digital duplicado.
    return {
      ...base,
      showAnalog: false,
      showHands: false,
      showDigital: false,
      clockChoices,
      highlightTime: relojHighlightTime(question, hours, minutes),
      answer: correctChoice ? `${correctChoice.letter} (${correctChoice.label})` : correct,
    };
  }

  // analog_to_digital, match_scene o motor desconocido: esfera con agujas.
  return {
    ...base,
    showAnalog: true,
    showHands: ex.showHands !== false,
    choiceLabels: labels.length > 0 ? labels : undefined,
    highlightTime: relojHighlightTime(question, hours, minutes),
    answer: correct,
  };
}

/** Pon la hora: reloj digital + esfera vacía para dibujar las agujas. */
function mapRelojPonerHora(ex: Record<string, unknown>): RelojSheetExercise {
  const target = asString(ex.target);
  const hours = asNumber(ex.hours);
  const minutes = asNumber(ex.minutes);
  const question = target ? `Pon las agujas a las ${target}` : "Pon la hora en el reloj";
  return {
    kind: "reloj",
    type: "poner_hora",
    hours,
    minutes,
    showAnalog: true,
    showHands: false,
    drawHands: true,
    showDigital: Boolean(target),
    digitalLabel: target || undefined,
    question,
    highlightTime: target || undefined,
    answer: target || undefined,
  };
}

function mapDatosInnecesarios(ex: Record<string, unknown>): DatosInnecesariosSheetExercise {
  const story = asStringArray(ex.historia).length
    ? asStringArray(ex.historia)
    : asStringArray(ex.story);
  const innecesario = asNumber(ex.innecesario, -1);
  const answerPhrase =
    innecesario >= 0 && innecesario < story.length
      ? story[innecesario]
      : asString(ex.answer) || undefined;
  return {
    kind: "datosInnecesarios",
    story,
    question: asString(ex.pregunta) || questionOf(ex),
    answer: answerPhrase,
  };
}

const TABLA_CELL_STATES: readonly TablaNumericaCellKind[] = [
  "visible",
  "blank",
  "target",
  "symbol",
];

function mapTablaNumerica(ex: Record<string, unknown>): TablaNumericaSheetExercise {
  const gridRaw = Array.isArray(ex.gridState) ? ex.gridState : [];
  const symbolMap =
    ex.symbolMap && typeof ex.symbolMap === "object"
      ? (ex.symbolMap as Record<string, unknown>)
      : {};
  const cells: TablaNumericaSheetCell[] = gridRaw.map((raw, value) => {
    const state = TABLA_CELL_STATES.includes(raw as TablaNumericaCellKind)
      ? (raw as TablaNumericaCellKind)
      : "visible";
    const symbol = state === "symbol" ? asString(symbolMap[String(value)], "?") : undefined;
    return symbol !== undefined ? { value, state, symbol } : { value, state };
  });

  const typeRaw = asString(ex.type);
  const variant: TablaNumericaSheetExercise["variant"] =
    typeRaw === "symbol" || typeRaw === "colorear" ? typeRaw : "missing";

  const validSet = Array.isArray(ex.validSet) ? ex.validSet.map((n) => asNumber(n)) : [];
  const targetSymbol = asString(ex.targetSymbol) || undefined;
  const targetSymbols = Array.isArray(ex.targetSymbols)
    ? ex.targetSymbols.map((s) => asString(s)).filter(Boolean)
    : targetSymbol
      ? targetSymbol.split(/\s+/).filter(Boolean)
      : undefined;
  const ruleLabel = asString(ex.ruleLabel) || undefined;
  // Colorear / medium símbolos: respuesta = lista de casillas (no la regla).
  const answer =
    (variant === "colorear" || variant === "symbol") && validSet.length > 0
      ? validSet.join(", ")
      : (answerOf(ex) ?? undefined);

  const question =
    asString(ex.question) ||
    (variant === "symbol" && targetSymbols && targetSymbols.length > 0
      ? `Busca estos símbolos y escribe en qué casilla está cada uno: ${targetSymbols.join(" ")}`
      : variant === "colorear" && ruleLabel
        ? `Colorea todos los números con ${ruleLabel}.`
        : "¿Qué número falta en la casilla amarilla?");

  // En papel los símbolos van como iconos encima de cada recuadro (color de clase).
  const paperQuestion =
    variant === "symbol"
      ? "Busca estos símbolos y escribe en qué casilla está cada uno."
      : question.replace(/^Haz clic en todos/i, "Colorea todos");

  return {
    kind: "tablaNumerica",
    variant,
    question: paperQuestion,
    cells,
    cols: 10,
    rows: Math.max(1, Math.ceil(cells.length / 10)),
    targetSymbol: targetSymbols?.join(" ") || targetSymbol,
    targetSymbols,
    ruleLabel,
    answer,
  };
}

const LABERINTO_NODE_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/** Soluciones: valor de cada casilla y número final, p. ej. «A 12 · B 15 … → 22». */
function laberintoAnswerText(
  answers: Record<string, number>,
  correctFin: string,
): string | undefined {
  const nodes = LABERINTO_NODE_ORDER.filter((n) => typeof answers[n] === "number");
  if (nodes.length === 0) return undefined;
  const finalValue = answers[correctFin];
  const list = nodes.map((n) => `${n} ${answers[n]}`).join(" · ");
  return typeof finalValue === "number" ? `${list} → ${finalValue}` : list;
}

function mapLaberinto(ex: Record<string, unknown>): LaberintoSheetExercise {
  const answers =
    ex.answers && typeof ex.answers === "object" ? (ex.answers as Record<string, number>) : {};
  const correctFin = asString(ex.correctFin);
  return {
    kind: "laberintoMatematico",
    start: asNumber(ex.start),
    edges: Array.isArray(ex.edges) ? (ex.edges as LaberintoSheetExercise["edges"]) : [],
    answers,
    mode: asString(ex.mode) === "menor" ? "menor" : "mayor",
    correctFin,
    question: questionOf(ex),
    answer: laberintoAnswerText(answers, correctFin),
  };
}

function mapRuta(ex: Record<string, unknown>, config?: SheetConfig): RutaCuadriculaSheetExercise {
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
  const obstacles = Array.isArray(ex.obstacles) ? (ex.obstacles as { x: number; y: number }[]) : [];
  const arrows = asString(ex.answer) || shortestRouteArrows(gridSize, start, end, obstacles) || "";
  return {
    kind: "rutaCuadricula",
    gridSize,
    start,
    end,
    obstacles,
    showEmoji: config ? config.withImages : true,
    // Ejemplo (BFS): hay varios caminos válidos; la hoja lo marca como «Ej.:».
    answer: arrows ? (arrows.startsWith("Ej.") ? arrows : `Ej.: ${arrows}`) : undefined,
  };
}

function mapProblema(ex: Record<string, unknown>, config?: SheetConfig): ProblemaSheetExercise {
  const opRaw = asString(ex.op);
  const op: "+" | "-" | undefined =
    opRaw === "suma" || opRaw === "+"
      ? "+"
      : opRaw === "resta" || opRaw === "-" || opRaw === "−"
        ? "-"
        : undefined;
  const difficulty = config?.difficulty;
  // Hard/expert: solo enunciado + hueco (el niño escribe operación y resultado).
  const writeOnly = difficulty === "hard" || difficulty === "expert";
  const hasEquation =
    !writeOnly && op !== undefined && typeof ex.a === "number" && typeof ex.b === "number";
  const emoji = config?.withImages ? asString(ex.emoji) || undefined : undefined;
  return {
    kind: "problemas",
    story: asStringArray(ex.story),
    question: questionOf(ex),
    emoji,
    ...(hasEquation ? { a: ex.a as number, b: ex.b as number, op } : {}),
    showWriteArea: writeOnly ? true : undefined,
    // Easy/medium/hard: números clave del enunciado con color de clase; expert sin resaltar.
    highlightKeyNumbers: difficulty !== "expert" ? true : undefined,
    answer: answerOf(ex),
  };
}

const WEEK_DAY_NAMES = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

function mapWeekDay(ex: Record<string, unknown>): SheetExercise {
  const question = questionOf(ex);
  const choiceLabels = asStringArray(ex.options);
  return {
    kind: "weekDay",
    question,
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    highlightDay: WEEK_DAY_NAMES.find((d) => question.includes(d)),
    answer: asString(ex.answer) || undefined,
  };
}

function mapVecinosNumero(ex: Record<string, unknown>): SheetExercise {
  const raw = asString(ex.type);
  const askType: "anterior" | "posterior" | "ambos" =
    raw === "anterior" || raw === "posterior" ? raw : "ambos";
  const question =
    questionOf(ex) ||
    (askType === "anterior"
      ? "¿Cuál es el número anterior?"
      : askType === "posterior"
        ? "¿Cuál es el número posterior?"
        : "¿Cuáles son los vecinos?");
  /** Hard/expert: pares «a-p» → «a - p» (guion, no punto medio). */
  const formatPair = (s: string) => s.replace("-", " - ").replace("·", " - ");
  const choiceLabels = asStringArray(ex.options).map(formatPair);
  const answerRaw = answerOf(ex);
  return {
    kind: "vecinosNumero",
    question,
    number: asNumber(ex.number),
    askType,
    anterior: asNumber(ex.anterior),
    posterior: asNumber(ex.posterior),
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    answer: typeof answerRaw === "string" ? formatPair(answerRaw) : answerRaw,
  };
}

function mapDobleYMitad(ex: Record<string, unknown>, config?: SheetConfig): SheetExercise {
  const choiceLabels = asStringArray(ex.options);
  const operacion = asString(ex.operacion);
  const conocido = asString(ex.conocido);
  const answerRaw = answerOf(ex) ?? (typeof ex.result === "number" ? ex.result : undefined);
  // Medium+: el niño hace la operación en vertical (sin opciones ni cajas de relleno).
  const verticalOp = config?.difficulty !== undefined && config.difficulty !== "easy";
  return {
    kind: "dobleYMitad",
    question: questionOf(ex),
    number: typeof ex.number === "number" ? ex.number : undefined,
    operacion: operacion === "x2" || operacion === "div2" ? operacion : undefined,
    conocido: conocido === "original" || conocido === "resultado" ? conocido : undefined,
    verticalOp: verticalOp ? true : undefined,
    choiceLabels: !verticalOp && choiceLabels.length > 0 ? choiceLabels : undefined,
    answer: typeof answerRaw === "number" ? answerRaw : undefined,
  };
}

function sheetOp(raw: unknown): "+" | "-" {
  return raw === "-" || raw === "−" || raw === "resta" ? "-" : "+";
}

function mapProblemas2Pasos(ex: Record<string, unknown>): Problemas2PasosSheetExercise {
  const hasSteps = typeof ex.a === "number" && typeof ex.b === "number" && typeof ex.c === "number";
  const choiceLabels = asStringArray(ex.options);
  return {
    kind: "problemas2pasos",
    story: asStringArray(ex.story),
    question: questionOf(ex),
    ...(hasSteps
      ? {
          steps: {
            a: ex.a as number,
            b: ex.b as number,
            c: ex.c as number,
            op1: sheetOp(ex.op1),
            op2: sheetOp(ex.op2),
          },
        }
      : {}),
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    // correctAnswer viene como string ("12") en el motor.
    answer: asNumber(Number(ex.correctAnswer ?? ex.result ?? ex.answer)),
  };
}

const SIMETRIA_SHAPES: readonly NonNullable<SimetriaSheetExercise["shape"]>[] = [
  "circulo",
  "cuadrado",
  "rectangulo",
  "triangulo-eq",
  "triangulo-iso",
  "triangulo-esc",
  "rombo",
  "pentagono",
  "hexagono",
  "estrella",
];

/** Nombre mostrado en opciones which-shape → id de figura (mismo que el motor). */
const SIMETRIA_NAME_TO_SHAPE: Record<string, NonNullable<SimetriaSheetExercise["shape"]>> = {
  Círculo: "circulo",
  Cuadrado: "cuadrado",
  Rectángulo: "rectangulo",
  "Triángulo equilátero": "triangulo-eq",
  "Triángulo isósceles": "triangulo-iso",
  "Triángulo escaleno": "triangulo-esc",
  Rombo: "rombo",
  "Pentágono regular": "pentagono",
  "Hexágono regular": "hexagono",
  "Estrella de 5 puntas": "estrella",
};

function mapSimetria(ex: Record<string, unknown>): SimetriaSheetExercise {
  const shapeRaw = asString(ex.shape);
  const shape = SIMETRIA_SHAPES.find((s) => s === shapeRaw);
  const isWhichShape = asString(ex.type) === "which-shape";
  const choiceLabels = asStringArray(ex.options);
  const optionShapes = isWhichShape
    ? choiceLabels
        .map((name) => SIMETRIA_NAME_TO_SHAPE[name])
        .filter((s): s is NonNullable<SimetriaSheetExercise["shape"]> => Boolean(s))
    : undefined;
  return {
    kind: "simetria",
    question: questionOf(ex),
    // which-shape: dibujar las opciones (figuras), no una figura de referencia.
    shape: isWhichShape ? undefined : shape,
    choiceLabels: !isWhichShape && choiceLabels.length > 0 ? choiceLabels : undefined,
    optionShapes: optionShapes && optionShapes.length > 0 ? optionShapes : undefined,
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

const CUERPOS_3D: readonly NonNullable<Cuerpos3DSheetExercise["shape"]>[] = [
  "cubo",
  "esfera",
  "cilindro",
  "cono",
  "prisma",
  "piramide",
];

function mapCuerpos3d(ex: Record<string, unknown>): Cuerpos3DSheetExercise {
  const shapeRaw = asString(ex.shape);
  const choiceLabels = asStringArray(ex.options);
  return {
    kind: "cuerpos3d",
    question: questionOf(ex),
    shape: CUERPOS_3D.find((s) => s === shapeRaw),
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    answer: answerOf(ex),
  };
}

function mapCirculoCircunferencia(
  ex: Record<string, unknown>,
  config: SheetConfig,
): CirculoCircunferenciaSheetExercise {
  const type: "classify-shape" | "real-object" =
    asString(ex.type) === "real-object" ? "real-object" : "classify-shape";
  const shapeType: "circulo" | "circunferencia" =
    asString(ex.shapeType) === "circunferencia" ? "circunferencia" : "circulo";
  const choiceLabels = asStringArray(ex.options);
  return {
    kind: "circuloCircunferencia",
    question: questionOf(ex),
    type,
    shapeType,
    objectName: asString(ex.objectName) || undefined,
    objectEmoji: config.withImages ? asString(ex.objectEmoji) || undefined : undefined,
    choiceLabels: choiceLabels.length > 0 ? choiceLabels : undefined,
    answer: answerOf(ex),
  };
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

function mapPosicionesAula(ex: Record<string, unknown>): PosicionesAulaSheetExercise {
  const choices = asStringArray(ex.options);
  return {
    kind: "posicionesAula",
    container: (asString(ex.container, "mesa") ||
      "mesa") as PosicionesAulaSheetExercise["container"],
    object: (asString(ex.object, "libro") || "libro") as PosicionesAulaSheetExercise["object"],
    position: (asString(ex.position, "encima") ||
      "encima") as PosicionesAulaSheetExercise["position"],
    story: asStringArray(ex.story),
    question: questionOf(ex),
    choiceLabels: choices.length > 0 ? choices : undefined,
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
  };
}

function mapProbabilidad(ex: Record<string, unknown>): ProbabilidadSheetExercise {
  const variant: "classify" | "bag" = asString(ex.type) === "bag" ? "bag" : "classify";
  const context = asString(ex.context);
  const choices = asStringArray(ex.options);
  const correct = asString(ex.correctAnswer ?? ex.answer);
  const matchedLabel = choices.find((c) => c.toLowerCase() === correct.toLowerCase());
  const balls = variant === "bag" ? parseBagContext(context) : undefined;
  return {
    kind: "probabilidad",
    variant,
    question: questionOf(ex),
    context: context || undefined,
    balls: balls && balls.length > 0 ? balls : undefined,
    choiceLabels: choices.length > 0 ? choices : undefined,
    answer: matchedLabel ?? (capitalizeFirst(correct) || undefined),
  };
}

function mapCapacidad(ex: Record<string, unknown>): CapacidadSheetExercise {
  const type = asString(ex.type);
  const variant: "compare" | "read" | "fill" =
    type === "read" || type === "fill" ? type : "compare";
  const choices = asStringArray(ex.options);
  const raw = asString(ex.answer);
  return {
    kind: "capacidad",
    variant,
    question: questionOf(ex),
    litersA: typeof ex.litersA === "number" ? ex.litersA : undefined,
    litersB: typeof ex.litersB === "number" ? ex.litersB : undefined,
    maxLiters: typeof ex.maxLiters === "number" ? ex.maxLiters : undefined,
    liters: typeof ex.liters === "number" ? ex.liters : undefined,
    cups: typeof ex.cups === "number" ? ex.cups : undefined,
    choiceLabels: choices.length > 0 ? choices : undefined,
    // Pizarra muestra «N L» al acertar en lectura / vasos; comparar queda A, B o Igual.
    answer: raw && variant !== "compare" ? `${raw} L` : raw || undefined,
  };
}

function mapNumeracion1119(ex: Record<string, unknown>, _config: SheetConfig): SheetExercise {
  const raw = asString(ex.type);
  const type =
    raw === "units" || raw === "unidades"
      ? "units"
      : raw === "sequence" || raw === "secuencia"
        ? "sequence"
        : "identify";
  // Identify (easy y expert) trae opciones numéricas; asStringArray las convierte.
  const options = Array.isArray(ex.options)
    ? ex.options.map((o) => String(o)).filter(Boolean)
    : asStringArray(ex.options);
  const hasChoices = type === "identify" && options.length > 0;
  // Solo ficha: huecos al doble (___ → ______) en units y sequence.
  const question =
    type === "identify"
      ? "Redondea el número que representa la imagen."
      : questionOf(ex).replace(/_+/g, "______");
  return {
    kind: "numeracion1119",
    type,
    number: asNumber(ex.number),
    question,
    // Bloques siempre. Identify = MC a la derecha; units/sequence = imagen + enunciado debajo.
    showBlocks: true,
    choiceLabels: hasChoices ? options : undefined,
    showAnswerBoxes: false,
    questionBelowImage: !hasChoices,
    answer: answerOf(ex),
  };
}

/**
 * Numeración 40-59 / 60-99: misma visual de ficha que 11-19.
 * Diferencias de motor: `jump` (ambos) y `word` (solo 60-99, MC sin bloques).
 */
function mapNumeracionDecenas(
  kind: "numeracion4059" | "numeracion6099",
  ex: Record<string, unknown>,
): SheetExercise {
  const type = asString(ex.type, "identify");
  const options = Array.isArray(ex.options)
    ? ex.options.map((o) => String(o)).filter(Boolean)
    : asStringArray(ex.options);
  // identify / word traen opciones del motor → MC a la derecha.
  const hasChoices = (type === "identify" || type === "word") && options.length > 0;
  // Bloques siempre salvo word (pregunta en letras, sin imagen de bloques).
  const showBlocks = type !== "word";
  const question =
    type === "identify"
      ? "Redondea el número que representa la imagen."
      : questionOf(ex).replace(/_+/g, "______");
  return {
    kind,
    type,
    number: asNumber(ex.number),
    question,
    showBlocks,
    choiceLabels: hasChoices ? options : undefined,
    showAnswerBoxes: false,
    // Con bloques y sin MC: enunciado debajo (units / sequence / jump).
    questionBelowImage: showBlocks && !hasChoices,
    answer: answerOf(ex),
  } as SheetExercise;
}

function mapAbaco3Cifras(ex: Record<string, unknown>): SheetExercise {
  const typeRaw = asString(ex.type);
  const variant: "read-abaco" | "find-abaco" | "valor-posicional" =
    typeRaw === "find-abaco" || typeRaw === "valor-posicional" ? typeRaw : "read-abaco";
  const columns = {
    c: asNumber(ex.centenas),
    d: asNumber(ex.decenas),
    u: asNumber(ex.unidades),
  };
  const options = asStringArray(ex.options);
  const correct = asString(ex.correctAnswer);

  if (variant === "find-abaco") {
    const abacoOptions = options.map((opt, i) => {
      const [c, d, u] = opt.split("-").map((n) => Number(n) || 0);
      return { c: c ?? 0, d: d ?? 0, u: u ?? 0, letter: String.fromCharCode(65 + i) };
    });
    const idx = options.indexOf(correct);
    return {
      kind: "abaco3Cifras",
      variant,
      question: questionOf(ex),
      number: asNumber(ex.number),
      columns,
      abacoOptions,
      // Soluciones: solo la letra del ábaco correcto.
      answer: idx >= 0 ? String.fromCharCode(65 + idx) : undefined,
    };
  }

  return {
    kind: "abaco3Cifras",
    variant,
    question: questionOf(ex),
    number: asNumber(ex.number),
    columns,
    choiceLabels: options,
    answer: correct || undefined,
  };
}

function mapLecturaNumeros(ex: Record<string, unknown>, config: SheetConfig): SheetExercise {
  const variant: "cifra-to-palabra" | "palabra-to-cifra" =
    asString(ex.type) === "palabra-to-cifra" ? "palabra-to-cifra" : "cifra-to-palabra";
  const number = asNumber(ex.number);
  const word = asString(ex.word);
  const isCifraToWord = variant === "cifra-to-palabra";
  return {
    kind: "lecturaNumeros",
    variant,
    question: isCifraToWord ? "¿Cómo se escribe este número?" : "¿Qué número es este?",
    display: isCifraToWord ? String(number) : `"${word}"`,
    number,
    word,
    choiceLabels: asStringArray(ex.options),
    difficulty: config.difficulty,
    answer: asString(ex.correctAnswer) || undefined,
  };
}

function mapRedondeo(ex: Record<string, unknown>, config: SheetConfig): SheetExercise {
  const number = asNumber(ex.number);
  const lower = asNumber(ex.lowerDecade, Math.floor(number / 10) * 10);
  const upper = asNumber(ex.upperDecade, lower + 10);
  return {
    kind: "redondeo",
    variant: asString(ex.type) === "which-closer" ? "which-closer" : "round-to-ten",
    question: questionOf(ex),
    number,
    lowerDecade: lower,
    upperDecade: upper,
    choiceLabels: asStringArray(ex.options),
    difficulty: config.difficulty,
    answer: asString(ex.correctAnswer) || undefined,
  };
}

function mapNumeracion999(ex: Record<string, unknown>): SheetExercise {
  const type = asString(ex.type);
  const showCduCard = type === "cdu-to-cifra";
  return {
    kind: "numeracion999",
    type,
    question: questionOf(ex),
    number: asNumber(ex.number),
    centenas: asNumber(ex.centenas),
    decenas: asNumber(ex.decenas),
    unidades: asNumber(ex.unidades),
    showCduCard,
    choiceLabels: asStringArray(ex.options),
    answer: asString(ex.correctAnswer ?? ex.answer) || undefined,
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
      return mapRepartoIgual(ex, config);
    case "reloj":
      return mapReloj(ex, config);
    case "relojPonerHora":
      return mapRelojPonerHora(ex);
    case "tablaNumerica":
      return mapTablaNumerica(ex);
    case "laberintoMatematico":
    case "laberintoMatematico2":
      return mapLaberinto(ex);
    case "rutaCuadricula":
      return mapRuta(ex, config);
    case "problemas":
      return mapProblema(ex, config);
    case "datosInnecesarios":
      return mapDatosInnecesarios(ex);
    case "problemas2pasos":
      return mapProblemas2Pasos(ex);
    case "posicionesAula":
      return mapPosicionesAula(ex);
    case "numeracion1119":
      return mapNumeracion1119(ex, config);
    case "weekDays":
      return mapWeekDay(ex);
    case "capacidad":
      return mapCapacidad(ex);
    case "ordinales":
      return mapOrdinales(ex, config);
    case "numeracion4059":
      return mapNumeracionDecenas("numeracion4059", ex);
    case "numeracion6099":
      return mapNumeracionDecenas("numeracion6099", ex);
    case "numeracion999":
      return mapNumeracion999(ex);
    case "poligonos":
      return mapPoligonos(ex);
    case "shapes":
      return mapShapes(ex, config);
    case "cuerpos3d":
      return mapCuerpos3d(ex);
    case "simetria":
      return mapSimetria(ex);
    case "circuloCircunferencia":
      return mapCirculoCircunferencia(ex, config);
    case "lineTypes": {
      const line =
        ex.line && typeof ex.line === "object" ? (ex.line as Record<string, unknown>) : {};
      const lineOpts = choiceLabelsFromOptions(ex.options);
      return {
        kind: "lineTypes",
        svg: asString(ex.svg || line.svg),
        options: lineOpts.length > 0 ? lineOpts : asStringArray(ex.options),
        question: questionOf(ex) || "¿Qué tipo de línea es?",
        answer: asString(ex.answer ?? ex.correctAnswer) || undefined,
      };
    }
    case "multiplicacion":
      return mapMultiplicacion(ex);
    case "probabilidad":
      return mapProbabilidad(ex);
    case "redondeo":
      return mapRedondeo(ex, config);
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
      return mapVecinosNumero(ex);
    case "amigos10":
      return mapAmigos10(ex, config);
    case "lecturaNumeros":
      return mapLecturaNumeros(ex, config);
    case "dobleYMitad":
      return mapDobleYMitad(ex, config);
    case "abaco3cifras":
      return mapAbaco3Cifras(ex);
    case "algoritmo3cifras":
      return mapAlgoritmo3Cifras(ex);
    case "graficoBarras":
      return mapGraficoBarras(ex, config);
    case "menuCafeteria":
      return mapMenuCafeteria(ex, config);
    case "monedasBilletes":
      return mapMonedasBilletes(ex, config);
    case "inventarProblema":
      return mapInventarProblema(ex, config);
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
      return mapRectaNumerica(ex);
    default:
      return mapProblema(ex, config);
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
