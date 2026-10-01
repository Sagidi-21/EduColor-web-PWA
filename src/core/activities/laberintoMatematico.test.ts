import { describe, it, expect } from "vitest";
import {
  generateSession,
  validateNode,
  FIN_NODES,
  FILLABLE_NODES,
  type LaberintoExercise,
  type LaberintoGrade,
  type NodeId,
} from "./laberintoMatematico";
import type { ActivityDifficulty } from "../content/contracts";

const GRADES: LaberintoGrade[] = ["1", "2"];
const DIFFICULTIES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];

/** Todas las combinaciones que el motor tiene que sostener. */
function todasLasSesiones(): { grade: LaberintoGrade; d: ActivityDifficulty; s: number }[] {
  const out: { grade: LaberintoGrade; d: ActivityDifficulty; s: number }[] = [];
  for (const grade of GRADES)
    for (const d of DIFFICULTIES) for (const s of [1, 42, 4242, 999983]) out.push({ grade, d, s });
  return out;
}

/** Reaplica las flechas del ejercicio y compara con la solución que da el motor. */
function cumpleAristas(ex: LaberintoExercise): boolean {
  return FILLABLE_NODES.every((n) => {
    const edge = ex.edges.find((e) => e.to === n);
    if (!edge) return false;
    const base = ex.answers[edge.from];
    return base + (edge.op === "+" ? edge.value : -edge.value) === ex.answers[n];
  });
}

describe("generateSession", () => {
  it("devuelve una sesion de 5 ejercicios en las 4 dificultades y los 2 cursos", () => {
    for (const { grade, d, s } of todasLasSesiones()) {
      const sesion = generateSession(d, s, grade);
      expect(sesion.length, `${grade}/${d}/semilla ${s}`).toBe(5);
    }
  });

  it("es determinista: la misma semilla da exactamente la misma sesion", () => {
    for (const { grade, d, s } of todasLasSesiones()) {
      expect(generateSession(d, s, grade), `${grade}/${d}/${s}`).toEqual(
        generateSession(d, s, grade),
      );
    }
  });

  it("semillas distintas dan sesiones distintas", () => {
    for (const grade of GRADES) {
      for (const d of DIFFICULTIES) {
        expect(generateSession(d, 1, grade), `${grade}/${d}`).not.toEqual(
          generateSession(d, 2, grade),
        );
      }
    }
  });

  it("el nodo de inicio no lo escribe el nino y los otros 8 si", () => {
    // Nueve nodos en total: `S` es el de inicio y los ocho demas se rellenan.
    expect(FILLABLE_NODES).toHaveLength(8);
    expect(FILLABLE_NODES).not.toContain("S");

    for (const { grade, d, s } of todasLasSesiones()) {
      for (const ex of generateSession(d, s, grade)) {
        expect(ex.answers.S, `${grade}/${d}/${s}`).toBe(ex.start);
        // Las 8 flechas, en el orden fijo de la topologia.
        expect(ex.edges).toHaveLength(8);
        expect(ex.edges.map((e) => `${e.from}${e.to}${e.direction}`)).toEqual([
          "SAright",
          "ABright",
          "BCright",
          "ADdown",
          "BEdown",
          "DFdown",
          "EGdown",
          "GHright",
        ]);
      }
    }
  });

  it("la solucion de cada nodo es la que resulta de aplicar su flecha", () => {
    for (const { grade, d, s } of todasLasSesiones()) {
      for (const ex of generateSession(d, s, grade)) {
        expect(cumpleAristas(ex), `${grade}/${d}/${s}: ${JSON.stringify(ex.answers)}`).toBe(true);
      }
    }
  });

  it("ningun nodo se sale del rango de la dificultad y ninguno queda negativo", () => {
    // Techos del original: 1.º → 10/20/59/99, 2.º → 99/199/999/999.
    const maxPorCurso: Record<LaberintoGrade, Record<ActivityDifficulty, number>> = {
      "1": { easy: 10, medium: 20, hard: 59, expert: 99 },
      "2": { easy: 99, medium: 199, hard: 999, expert: 999 },
    };

    for (const { grade, d, s } of todasLasSesiones()) {
      const techo = maxPorCurso[grade][d];
      for (const ex of generateSession(d, s, grade)) {
        for (const n of Object.keys(ex.answers) as NodeId[]) {
          expect(ex.answers[n], `${grade}/${d}/${s}: nodo ${n}`).toBeGreaterThanOrEqual(0);
          expect(ex.answers[n], `${grade}/${d}/${s}: nodo ${n}`).toBeLessThanOrEqual(techo);
        }
      }
    }
  });

  it("las tres salidas tienen valores distintos, para que la pregunta no sea ambigua", () => {
    for (const { grade, d, s } of todasLasSesiones()) {
      for (const ex of generateSession(d, s, grade)) {
        const salidas = FIN_NODES.map((f) => ex.answers[f.node]);
        expect(new Set(salidas).size, `${grade}/${d}/${s}: ${salidas.join(",")}`).toBe(3);
        expect(ex.fins).toEqual(FIN_NODES);
      }
    }
  });

  it("la respuesta final es el mayor o el menor de TODOS los nodos, no solo de las salidas", () => {
    for (const { grade, d, s } of todasLasSesiones()) {
      for (const ex of generateSession(d, s, grade)) {
        const todos = Object.values(ex.answers);
        const esperado = ex.mode === "mayor" ? Math.max(...todos) : Math.min(...todos);
        // `correctFin` es un nodo, y su valor es el que la pregunta pide.
        expect(ex.answers[ex.correctFin], `${grade}/${d}/${s}`).toBe(esperado);
        expect(ex.question).toBe(
          ex.mode === "mayor"
            ? "¿Cuál es el número mayor al que has llegado?"
            : "¿Cuál es el número menor al que has llegado?",
        );
      }
    }
  });

  it("en 1.º `easy` solo hay sumas y el techo es 10", () => {
    // Es la unica configuracion del original sin restas: el niño de 1.º empieza
    // sumando y el numero nunca pasa de 10.
    for (const s of [1, 42, 4242, 999983]) {
      for (const ex of generateSession("easy", s, "1")) {
        expect(
          ex.edges.every((e) => e.op === "+"),
          `semilla ${s}`,
        ).toBe(true);
        expect(
          ex.edges.every((e) => [1, 2, 3].includes(e.value)),
          `semilla ${s}`,
        ).toBe(true);
        expect(Math.max(...Object.values(ex.answers))).toBeLessThanOrEqual(10);
      }
    }
  });

  it("1.º `easy` y 2.º `easy` son EJERCICIOS DISTINTOS, no el mismo con otro nombre", () => {
    // La tabla del original: 1.º easy = sumas de 1..3 hasta 10; 2.º easy = sumas
    // y restas de 5/10/15 hasta 99. Si se colara la tabla de 1.º, aparecerían
    // restas en el nivel fácil de 1.º o numeros de dos cifras donde no toca.
    const dePrimero = generateSession("easy", 42, "1");
    const deSegundo = generateSession("easy", 42, "2");

    expect(dePrimero).not.toEqual(deSegundo);

    // 1.º easy nunca sale de 10 ni tiene restas.
    expect(dePrimero.every((ex) => Object.values(ex.answers).every((v) => v <= 10))).toBe(true);
    expect(dePrimero.every((ex) => ex.edges.every((e) => e.op === "+"))).toBe(true);

    // 2.º easy sí tiene restas, y los saltos son de 5, 10 o 15.
    expect(deSegundo.some((ex) => ex.edges.some((e) => e.op === "-"))).toBe(true);
    expect(deSegundo.every((ex) => ex.edges.every((e) => [5, 10, 15].includes(e.value)))).toBe(
      true,
    );
    expect(deSegundo.some((ex) => Math.max(...Object.values(ex.answers)) > 10)).toBe(true);
  });

  it("1.º y 2.º difieren en las cuatro dificultades, no solo en `easy`", () => {
    for (const d of DIFFICULTIES) {
      expect(generateSession(d, 42, "1"), d).not.toEqual(generateSession(d, 42, "2"));
    }
  });
});

describe("validateNode", () => {
  it("acepta el valor que el motor da para ese nodo", () => {
    for (const grade of GRADES) {
      for (const d of DIFFICULTIES) {
        for (const ex of generateSession(d, 42, grade)) {
          for (const n of FILLABLE_NODES) {
            expect(validateNode(ex, n, ex.answers[n]), `${grade}/${d}/${n}`).toBe(true);
          }
        }
      }
    }
  });

  it("rechaza cualquier otro numero", () => {
    for (const grade of GRADES) {
      for (const ex of generateSession("medium", 4242, grade)) {
        for (const n of FILLABLE_NODES) {
          const bueno = ex.answers[n];
          expect(validateNode(ex, n, bueno + 1)).toBe(false);
          expect(validateNode(ex, n, bueno - 1)).toBe(false);
        }
      }
    }
  });

  it("rechaza el valor de un nodo vecino: no basta con acertar en otra casilla", () => {
    const ex = generateSession("medium", 7, "1")[0];
    const a = ex.answers.A;
    const vecino = FILLABLE_NODES.find((n) => n !== "A" && ex.answers[n] !== a);
    if (vecino === undefined) return; // en esta semilla no hay vecino con otro valor
    expect(validateNode(ex, "A", ex.answers[vecino])).toBe(false);
  });
});
