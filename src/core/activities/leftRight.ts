import type { ActivityDifficulty } from "../content/contracts";
import { IMAGE_CATEGORIES, pickImage } from "../../platform/objectImages";
import { CHARACTER_IMAGES } from "../../platform/characterImages";

export type Side = "izquierda" | "derecha";

const CATEGORY_LABELS: Record<string, string> = {
  coches: "coche",
  flores: "flor",
  globos: "globo",
  manzanas: "manzana",
  minions: "minion",
  monstruos: "monstruo",
  pajaros: "pájaro",
};

const LABEL_ART: Record<string, string> = {
  coche: "el",
  flor: "la",
  globo: "el",
  manzana: "la",
  minion: "el",
  monstruo: "el",
  pájaro: "el",
};
function art(label: string, capital = false): string {
  const a = LABEL_ART[label] ?? "el";
  return capital ? a.charAt(0).toUpperCase() + a.slice(1) : a;
}
function del_(label: string): string {
  return (LABEL_ART[label] ?? "el") === "la" ? "de la" : "del";
}

const EMOJI_PAIRS = [
  ["🐱", "🐶"],
  ["🍎", "🍌"],
  ["🌸", "🌻"],
  ["⭐", "🌙"],
  ["🚗", "🚌"],
  ["🎈", "🎀"],
  ["🍓", "🍇"],
  ["🦋", "🐝"],
  ["🏠", "🏫"],
  ["📚", "✏️"],
];

const POS_POOL = [
  { x: 4, y: 6 },
  { x: 30, y: 10 },
  { x: 56, y: 5 },
  { x: 78, y: 8 },
  { x: 6, y: 50 },
  { x: 35, y: 48 },
  { x: 60, y: 52 },
  { x: 80, y: 47 },
];

export interface LeftRightExercise {
  kind?: undefined;
  leftObj: string;
  rightObj: string;
  leftImgUrl: string;
  rightImgUrl: string;
  question: string;
  options: string[];
  answer: string;
}

export interface DragObject {
  label: string;
  imgUrl: string;
  startX: number;
  startY: number;
  targetBox: "box-left" | "box-right" | null;
}

export interface LeftRightCharExercise {
  kind: "char-click" | "char-drag-one" | "char-drag-both";
  charImgUrl: string;
  charName: string;
  perspective: "frente" | "espaldas";
  question: string;
  answer: "box-left" | "box-right" | "both";
  objects: DragObject[];
}

export type AnyLRExercise = LeftRightExercise | LeftRightCharExercise;
export interface SessionResult {
  total: number;
  correct: number;
  duration: number;
}

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function charAnswer(perspective: "frente" | "espaldas", charSide: Side): "box-left" | "box-right" {
  if (perspective === "espaldas") return charSide === "derecha" ? "box-right" : "box-left";
  return charSide === "derecha" ? "box-left" : "box-right";
}

function charHandForBox(box: "box-left" | "box-right", perspective: "frente" | "espaldas"): Side {
  if (perspective === "espaldas") return box === "box-left" ? "izquierda" : "derecha";
  return box === "box-left" ? "derecha" : "izquierda";
}

function catLabel(cat: { name: string } | undefined): string {
  return cat ? (CATEGORY_LABELS[cat.name] ?? cat.name) : "objeto";
}

export function generateSession(difficulty: ActivityDifficulty, seed = 42): AnyLRExercise[] {
  const rng = lcg(seed);
  const count = 10;
  const out: AnyLRExercise[] = [];
  const useImages = IMAGE_CATEGORIES.length >= 2;
  const cats = useImages ? shuffle([...IMAGE_CATEGORIES], rng) : [];
  const emojiPairs = useImages ? [] : shuffle([...EMOJI_PAIRS], rng);

  function makePair(i: number) {
    if (useImages) {
      const catA = cats[i % cats.length];
      const catB = cats[(i + 1) % cats.length] ?? cats[0];
      const flip = rng() > 0.5;
      const [cL, cR] = flip ? [catB, catA] : [catA, catB];
      return {
        leftObj: catLabel(cL),
        rightObj: catLabel(cR),
        leftImgUrl: pickImage(cL, rng),
        rightImgUrl: pickImage(cR, rng),
      };
    }
    const [a, b] = emojiPairs[i % emojiPairs.length];
    const flip = rng() > 0.5;
    return { leftObj: flip ? b : a, rightObj: flip ? a : b, leftImgUrl: "", rightImgUrl: "" };
  }

  const shuffledChars = CHARACTER_IMAGES.length > 0 ? shuffle([...CHARACTER_IMAGES], rng) : [];

  for (let i = 0; i < count; i++) {
    const { leftObj, rightObj, leftImgUrl, rightImgUrl } = makePair(i);
    const sideOpts = shuffle(["izquierda", "derecha"] as string[], rng);

    if (difficulty === "easy") {
      const askLeft = rng() > 0.5;
      out.push({
        leftObj,
        rightObj,
        leftImgUrl,
        rightImgUrl,
        question: `¿Dónde está ${art(askLeft ? leftObj : rightObj)} ${askLeft ? leftObj : rightObj}?`,
        options: sideOpts,
        answer: askLeft ? "izquierda" : "derecha",
      });
    } else if (difficulty === "medium") {
      const askLeft = i % 2 === 0;
      out.push({
        leftObj,
        rightObj,
        leftImgUrl,
        rightImgUrl,
        question: askLeft ? "¿Cuál está a la izquierda?" : "¿Cuál está a la derecha?",
        options: shuffle([leftObj, rightObj] as string[], rng),
        answer: askLeft ? leftObj : rightObj,
      });
    } else if (difficulty === "hard") {
      const type = i % 3;
      if (type === 0) {
        const askLeft = rng() > 0.5;
        out.push({
          leftObj,
          rightObj,
          leftImgUrl,
          rightImgUrl,
          question: `¿Dónde está ${art(askLeft ? leftObj : rightObj)} ${askLeft ? leftObj : rightObj}?`,
          options: sideOpts,
          answer: askLeft ? "izquierda" : "derecha",
        });
      } else if (type === 1) {
        const askLeft = i % 6 < 3;
        out.push({
          leftObj,
          rightObj,
          leftImgUrl,
          rightImgUrl,
          question: askLeft ? "¿Cuál está a la izquierda?" : "¿Cuál está a la derecha?",
          options: shuffle([leftObj, rightObj] as string[], rng),
          answer: askLeft ? leftObj : rightObj,
        });
      } else {
        const n = randInt(rng, 0, 1);
        const [tgt, ref] = n === 0 ? [leftObj, rightObj] : [rightObj, leftObj];
        out.push({
          leftObj,
          rightObj,
          leftImgUrl,
          rightImgUrl,
          question: `${art(tgt, true)} ${tgt} está a la ___ ${del_(ref)} ${ref}`,
          options: sideOpts,
          answer: n === 0 ? "izquierda" : "derecha",
        });
      }
    } else {
      if (shuffledChars.length === 0) {
        const n = randInt(rng, 0, 1);
        const [tgt, ref] = n === 0 ? [leftObj, rightObj] : [rightObj, leftObj];
        out.push({
          leftObj,
          rightObj,
          leftImgUrl,
          rightImgUrl,
          question: `${art(tgt, true)} ${tgt} está a la ___ ${del_(ref)} ${ref}`,
          options: sideOpts,
          answer: n === 0 ? "izquierda" : "derecha",
        });
        continue;
      }

      const char = shuffledChars[i % shuffledChars.length];
      const targetCharSide = (rng() > 0.5 ? "derecha" : "izquierda") as Side;
      const answer = charAnswer(char.perspective, targetCharSide);
      const base = { charImgUrl: char.url, charName: char.name, perspective: char.perspective };

      if (i < 4) {
        out.push({
          kind: "char-click",
          ...base,
          question: `¿Cuál es la mano ${targetCharSide} de ${char.name}?`,
          answer,
          objects: [],
        });
      } else if (i < 7) {
        const positions = shuffle([...POS_POOL], rng).slice(0, 3);
        const c0 = cats[i % cats.length];
        const c1 = cats[(i + 1) % cats.length];
        const c2 = cats[(i + 2) % cats.length];
        const targetLabel = catLabel(c0);
        const objects: DragObject[] = shuffle(
          [
            {
              label: targetLabel,
              imgUrl: c0 ? pickImage(c0, rng) : "",
              startX: positions[0].x,
              startY: positions[0].y,
              targetBox: answer,
            },
            {
              label: catLabel(c1),
              imgUrl: c1 ? pickImage(c1, rng) : "",
              startX: positions[1].x,
              startY: positions[1].y,
              targetBox: null,
            },
            {
              label: catLabel(c2),
              imgUrl: c2 ? pickImage(c2, rng) : "",
              startX: positions[2].x,
              startY: positions[2].y,
              targetBox: null,
            },
          ],
          rng,
        );
        out.push({
          kind: "char-drag-one",
          ...base,
          question: `Arrastra ${art(targetLabel)} ${targetLabel} a la mano ${targetCharSide} de ${char.name}`,
          answer,
          objects,
        });
      } else {
        const positions = shuffle([...POS_POOL], rng).slice(0, 4);
        const c0 = cats[i % cats.length];
        const c1 = cats[(i + 3) % cats.length];
        const c2 = cats[(i + 1) % cats.length];
        const c3 = cats[(i + 2) % cats.length];
        const lbl0 = catLabel(c0);
        const lbl1 = catLabel(c1);
        const handLeft = charHandForBox("box-left", char.perspective);
        const handRight = charHandForBox("box-right", char.perspective);
        const objects: DragObject[] = shuffle(
          [
            {
              label: lbl0,
              imgUrl: c0 ? pickImage(c0, rng) : "",
              startX: positions[0].x,
              startY: positions[0].y,
              targetBox: "box-left",
            },
            {
              label: lbl1,
              imgUrl: c1 ? pickImage(c1, rng) : "",
              startX: positions[1].x,
              startY: positions[1].y,
              targetBox: "box-right",
            },
            {
              label: catLabel(c2),
              imgUrl: c2 ? pickImage(c2, rng) : "",
              startX: positions[2].x,
              startY: positions[2].y,
              targetBox: null,
            },
            {
              label: catLabel(c3),
              imgUrl: c3 ? pickImage(c3, rng) : "",
              startX: positions[3].x,
              startY: positions[3].y,
              targetBox: null,
            },
          ],
          rng,
        );
        out.push({
          kind: "char-drag-both",
          ...base,
          question: `Pon ${art(lbl0)} ${lbl0} en la mano ${handLeft} y ${art(lbl1)} ${lbl1} en la mano ${handRight} de ${char.name}`,
          answer: "both",
          objects,
        });
      }
    }
  }
  return out;
}

export function validateAnswer(ex: AnyLRExercise, choice: string): boolean {
  return choice === ex.answer;
}
