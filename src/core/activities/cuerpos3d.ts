import type { ActivityDifficulty } from "../content/contracts";

/**
 * Núcleo de `cuerpos3d`: cuerpos geométricos, generación de ejercicios y validación.
 *
 * No importa React ni nada del navegador. El renderer solo dibuja lo que esto
 * devuelve, y una hoja de ejercicios podrá hacerlo mismo más adelante.
 */

export type Cuerpo = "cubo" | "esfera" | "cilindro" | "cono" | "prisma" | "piramide";
export type C3DType =
  "identify-name" | "count-faces" | "count-edges" | "count-vertices" | "real-object";

export interface C3DExercise {
  type: C3DType;
  shape: Cuerpo;
  question: string;
  correctAnswer: string;
  options: string[];
}

interface CuerpoData {
  name: string;
  faces: number;
  edges: number;
  vertices: number;
  realObjects: string[];
}

const CUERPOS: Record<Cuerpo, CuerpoData> = {
  cubo: {
    name: "Cubo",
    faces: 6,
    edges: 12,
    vertices: 8,
    realObjects: ["un dado", "una caja de cartón"],
  },
  esfera: {
    name: "Esfera",
    faces: 0,
    edges: 0,
    vertices: 0,
    realObjects: ["una pelota", "un globo"],
  },
  cilindro: {
    name: "Cilindro",
    faces: 3,
    edges: 2,
    vertices: 0,
    realObjects: ["una lata", "un tubo"],
  },
  cono: {
    name: "Cono",
    faces: 2,
    edges: 1,
    vertices: 1,
    realObjects: ["un cucurucho", "un embudo"],
  },
  prisma: {
    name: "Prisma triangular",
    faces: 5,
    edges: 9,
    vertices: 6,
    realObjects: ["una tienda de campaña", "un Toblerone"],
  },
  piramide: {
    name: "Pirámide",
    faces: 5,
    edges: 8,
    vertices: 5,
    realObjects: ["la pirámide de Egipto", "un techo a cuatro aguas"],
  },
};

const SHAPES_BY_DIFF: Record<ActivityDifficulty, Cuerpo[]> = {
  easy: ["cubo", "esfera", "cilindro", "cono"],
  medium: ["cubo", "esfera", "cilindro", "cono", "prisma"],
  hard: ["cubo", "esfera", "cilindro", "cono", "prisma", "piramide"],
  expert: ["cubo", "esfera", "cilindro", "cono", "prisma", "piramide"],
};

const TYPES_BY_DIFF: Record<ActivityDifficulty, C3DType[]> = {
  easy: ["identify-name", "real-object"],
  medium: ["identify-name", "real-object", "count-faces"],
  hard: ["identify-name", "real-object", "count-faces", "count-vertices"],
  expert: ["identify-name", "real-object", "count-faces", "count-vertices", "count-edges"],
};

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Genera una sesión de 10 ejercicios de cuerpos geométricos 3D. */
export function generateSession(difficulty: ActivityDifficulty, seed: number): C3DExercise[] {
  const rng = lcg(seed);
  const shapes = SHAPES_BY_DIFF[difficulty];
  const types = TYPES_BY_DIFF[difficulty];
  const out: C3DExercise[] = [];
  const used = new Set<string>();
  let tries = 0;

  while (out.length < 10 && tries < 300) {
    tries++;
    const shape = pick(rng, shapes);
    const type = pick(rng, types);
    const key = `${shape}-${type}`;
    if (used.has(key)) continue;
    used.add(key);

    const data = CUERPOS[shape];

    let question = "";
    let correctAnswer = "";
    let options: string[] = [];

    if (type === "identify-name") {
      question = "¿Cómo se llama este cuerpo geométrico?";
      correctAnswer = data.name;
      const wrongs = new Set<string>([correctAnswer]);
      for (const s of shapes) {
        if (wrongs.size >= 4) break;
        wrongs.add(CUERPOS[s].name);
      }
      options = shuffle(rng, Array.from(wrongs));
    } else if (type === "real-object") {
      const obj = pick(rng, data.realObjects);
      question = `¿Qué cuerpo geométrico tiene la forma de ${obj}?`;
      correctAnswer = data.name;
      const wrongs = new Set<string>([correctAnswer]);
      for (const s of shapes) {
        if (wrongs.size >= 4) break;
        wrongs.add(CUERPOS[s].name);
      }
      options = shuffle(rng, Array.from(wrongs));
    } else if (type === "count-faces") {
      question = `¿Cuántas caras tiene el ${data.name.toLowerCase()}?`;
      correctAnswer = String(data.faces);
      const vals = new Set<string>([correctAnswer]);
      while (vals.size < 4) vals.add(String(Math.floor(rng() * 12)));
      options = Array.from(vals).sort((a, b) => Number(a) - Number(b));
    } else if (type === "count-vertices") {
      question = `¿Cuántos vértices tiene el ${data.name.toLowerCase()}?`;
      correctAnswer = String(data.vertices);
      const vals = new Set<string>([correctAnswer]);
      while (vals.size < 4) vals.add(String(Math.floor(rng() * 12)));
      options = Array.from(vals).sort((a, b) => Number(a) - Number(b));
    } else if (type === "count-edges") {
      question = `¿Cuántas aristas tiene el ${data.name.toLowerCase()}?`;
      correctAnswer = String(data.edges);
      const vals = new Set<string>([correctAnswer]);
      while (vals.size < 4) vals.add(String(Math.floor(rng() * 15)));
      options = Array.from(vals).sort((a, b) => Number(a) - Number(b));
    }

    if (options.length >= 4) {
      out.push({ type, shape, question, correctAnswer, options });
    }
  }
  return out;
}

/** Comprueba si la respuesta elegida es correcta. */
export function validateAnswer(ex: C3DExercise, answer: string): boolean {
  return ex.correctAnswer === answer;
}
