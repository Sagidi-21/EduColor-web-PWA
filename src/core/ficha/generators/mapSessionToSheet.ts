import { getObjectImage } from "../../../platform/objectImages";
import type {
  AlgoritmoVerticalSheetExercise,
  ComparisonSheetExercise,
  CountingSheetExercise,
  IgualdadSheetExercise,
  LaberintoSheetExercise,
  LeftRightSheetExercise,
  OperationSheetExercise,
  OrderingSheetExercise,
  ParImparSheetExercise,
  PoligonosSheetExercise,
  ProblemaSheetExercise,
  RelacionarSheetExercise,
  RelacionSumaRestaSheetExercise,
  RelojSheetExercise,
  RepartoIgualSheetExercise,
  RutaCuadriculaSheetExercise,
  SheetConfig,
  SheetExercise,
  SheetShapeVisual,
  TablaNumericaSheetExercise,
  TresSumandosColumnaSheetExercise,
  TresSumandosSheetExercise,
} from "../types";

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
    question: asString(firstStep?.prompt, `¿Cuántos ${objectLabel} hay?`),
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

function mapTresSumandos(ex: Record<string, unknown>): TresSumandosSheetExercise {
  return {
    kind: "tresSumandos",
    a: asNumber(ex.a),
    b: asNumber(ex.b),
    c: asNumber(ex.c),
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
  const answer: "par" | "impar" | undefined =
    raw === "par" || raw === "even"
      ? "par"
      : raw === "impar" || raw === "odd"
        ? "impar"
        : undefined;
  return {
    kind: "parImpar",
    question: questionOf(ex),
    number: asNumber(ex.number),
    imageUrl: config.withImages ? asString(ex.imageUrl) : "",
    answer,
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
      return mapTresSumandos(ex);
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
      return {
        kind: "ordinales",
        question: questionOf(ex),
        count: asNumber(ex.count),
        imageUrl: config.withImages ? asString(ex.imageUrl) : "",
        answer: asNumber(ex.answer),
      };
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
      return mapQuestionKind("series3Cifras", ex);
    case "seriesNumericas":
      return mapQuestionKind("seriesNumericas", ex);
    case "cintaMetrica":
      return mapQuestionKind("cintaMetrica", ex);
    case "intervalosTiempo":
      return mapQuestionKind("intervalosTiempo", ex);
    case "elKilo":
      return mapQuestionKind("elKilo", ex);
    case "elLitro":
      return mapQuestionKind("elLitro", ex);
    case "vecinosNumero":
      return mapQuestionKind("vecinosNumero", ex);
    case "amigos10":
      return mapQuestionKind("amigos10", ex);
    case "lecturaNumeros":
      return mapQuestionKind("lecturaNumeros", ex);
    case "dobleYMitad":
      return mapQuestionKind("dobleYMitad", ex);
    case "abaco3cifras":
      return mapQuestionKind("abaco3Cifras", ex);
    case "algoritmo3cifras":
      return mapQuestionKind("algoritmo3Cifras", ex);
    case "graficoBarras":
      return mapQuestionKind("graficoBarras", ex);
    case "menuCafeteria":
      return mapQuestionKind("menuCafeteria", ex);
    case "monedasBilletes":
      return mapQuestionKind("monedasBilletes", ex);
    case "inventarProblema":
      return mapQuestionKind("inventarProblema", ex);
    case "balanza":
    case "balanzaEquilibra":
      return {
        kind: "balanza",
        question: questionOf(ex),
        leftText: asString(ex.leftText ?? (ex.left ? JSON.stringify(ex.left) : "izquierda")),
        rightText: asString(ex.rightText ?? (ex.right ? JSON.stringify(ex.right) : "derecha")),
        imageUrl: config.withImages ? asString(ex.imageUrl) : "",
        answer: undefined,
      };
    case "ordenar":
      return mapOrdering(ex);
    case "relacionar":
      return mapRelacionar(ex, config);
    case "relacionarCantidades":
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
