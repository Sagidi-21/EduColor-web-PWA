import { describe, it, expect } from "vitest";
import {
  generateSession,
  validateAnswer,
  type LeftRightExercise,
  type LeftRightCharExercise,
} from "./leftRight";

function isChar(ex: unknown): ex is LeftRightCharExercise {
  return (
    typeof ex === "object" &&
    ex !== null &&
    "kind" in ex &&
    (ex as LeftRightCharExercise).kind !== undefined
  );
}

describe("leftRight core", () => {
  describe("estructura general", () => {
    it("genera exactamente 10 ejercicios para easy", () => {
      const exs = generateSession("easy", 42);
      expect(exs).toHaveLength(10);
    });

    it("genera exactamente 10 ejercicios para medium", () => {
      expect(generateSession("medium", 1)).toHaveLength(10);
    });

    it("genera exactamente 10 ejercicios para hard", () => {
      expect(generateSession("hard", 1)).toHaveLength(10);
    });

    it("genera exactamente 10 ejercicios para expert", () => {
      expect(generateSession("expert", 1)).toHaveLength(10);
    });

    it("mismo seed produce misma salida determinista (easy)", () => {
      const a = generateSession("easy", 7);
      const b = generateSession("easy", 7);
      expect(a).toEqual(b);
    });

    it("distinto seed produce distinta salida", () => {
      const a = generateSession("easy", 7);
      const b = generateSession("easy", 997);
      const aAll = a.map((e) => (e as LeftRightExercise).answer).join(",");
      const bAll = b.map((e) => (e as LeftRightExercise).answer).join(",");
      expect(aAll).not.toEqual(bAll);
    });
  });

  describe("dificultad easy", () => {
    const exs = generateSession("easy", 42);

    it("todos los ejercicios son de tipo regular (sin kind)", () => {
      exs.forEach((ex) => expect(isChar(ex)).toBe(false));
    });

    it("answer es siempre izquierda o derecha", () => {
      exs.forEach((ex) => {
        const lr = ex as LeftRightExercise;
        expect(["izquierda", "derecha"]).toContain(lr.answer);
      });
    });

    it("options contiene izquierda y derecha", () => {
      exs.forEach((ex) => {
        const lr = ex as LeftRightExercise;
        expect(lr.options.sort()).toEqual(["derecha", "izquierda"]);
      });
    });

    it("answer coincide con la posición (izquierda = leftObj, derecha = rightObj)", () => {
      exs.forEach((ex) => {
        const lr = ex as LeftRightExercise;
        const askFor =
          lr.question.includes(lr.leftObj) && !lr.question.includes(lr.rightObj)
            ? "left"
            : lr.question.includes(lr.rightObj) && !lr.question.includes(lr.leftObj)
              ? "right"
              : "ambig";
        if (askFor === "left") expect(lr.answer).toBe("izquierda");
        if (askFor === "right") expect(lr.answer).toBe("derecha");
      });
    });
  });

  describe("dificultad medium", () => {
    const exs = generateSession("medium", 42);

    it("todos los ejercicios son de tipo regular", () => {
      exs.forEach((ex) => expect(isChar(ex)).toBe(false));
    });

    it("preguntas alternan askLeft por índice par", () => {
      exs.forEach((ex, i) => {
        const lr = ex as LeftRightExercise;
        const askLeft = i % 2 === 0;
        if (askLeft) {
          expect(lr.question).toBe("¿Cuál está a la izquierda?");
          expect(lr.answer).toBe(lr.leftObj);
        } else {
          expect(lr.question).toBe("¿Cuál está a la derecha?");
          expect(lr.answer).toBe(lr.rightObj);
        }
      });
    });

    it("options contiene los dos objetos", () => {
      exs.forEach((ex) => {
        const lr = ex as LeftRightExercise;
        expect(new Set(lr.options)).toEqual(new Set([lr.leftObj, lr.rightObj]));
      });
    });
  });

  describe("dificultad hard", () => {
    const exs = generateSession("hard", 42);

    it("mezcla 3 subtipos (i%3=0,1,2)", () => {
      const tipos = new Set<string>();
      exs.forEach((ex, i) => {
        const type = i % 3;
        const lr = ex as LeftRightExercise;
        if (type === 0) {
          expect(lr.question.startsWith("¿Dónde está")).toBe(true);
          tipos.add("where");
        } else if (type === 1) {
          expect(
            lr.question === "¿Cuál está a la izquierda?" ||
              lr.question === "¿Cuál está a la derecha?",
          ).toBe(true);
          tipos.add("which");
        } else {
          expect(lr.question).toContain("está a la ___");
          tipos.add("fill");
        }
      });
      expect(tipos.size).toBe(3);
    });

    it("subtipo fill (type 2): answer izquierda cuando target=leftObj, derecha cuando target=rightObj", () => {
      exs.forEach((ex, i) => {
        if (i % 3 !== 2) return;
        const lr = ex as LeftRightExercise;
        const targetIsLeft =
          lr.question.split(" ")[1] === artFromLeftRight(lr.leftObj, lr.question.split(" ")[1]) ||
          lr.question.startsWith(`${capitalize(article(lr.leftObj))} ${lr.leftObj}`);
        expect(targetIsLeft ? "izquierda" : "derecha").toBe(lr.answer);
      });
    });
  });

  describe("dificultad expert", () => {
    const exs = generateSession("expert", 42);

    it("ej 0-3 son char-click", () => {
      for (let i = 0; i < 4; i++) {
        const c = exs[i] as LeftRightCharExercise;
        expect(c.kind).toBe("char-click");
        expect(c.objects).toHaveLength(0);
        expect(["box-left", "box-right"]).toContain(c.answer);
      }
    });

    it("ej 4-6 son char-drag-one", () => {
      for (let i = 4; i < 7; i++) {
        const c = exs[i] as LeftRightCharExercise;
        expect(c.kind).toBe("char-drag-one");
        expect(c.objects).toHaveLength(3);
        const targets = c.objects.filter((o) => o.targetBox !== null);
        const distractors = c.objects.filter((o) => o.targetBox === null);
        expect(targets).toHaveLength(1);
        expect(distractors).toHaveLength(2);
      }
    });

    it("ej 7-9 son char-drag-both con answer=both", () => {
      for (let i = 7; i < 10; i++) {
        const c = exs[i] as LeftRightCharExercise;
        expect(c.kind).toBe("char-drag-both");
        expect(c.objects).toHaveLength(4);
        expect(c.answer).toBe("both");
        const targets = c.objects.filter((o) => o.targetBox !== null);
        const distractors = c.objects.filter((o) => o.targetBox === null);
        expect(targets).toHaveLength(2);
        expect(distractors).toHaveLength(2);
        expect(new Set(targets.map((o) => o.targetBox))).toEqual(
          new Set(["box-left", "box-right"]),
        );
      }
    });

    it("perspectiva frente: mano derecha del personaje = caja izquierda de pantalla", () => {
      const frente = exs
        .map((e) => e as LeftRightCharExercise)
        .filter((e) => e.kind === "char-click" && e.perspective === "frente");
      const preguntasDer = frente.filter((e) => e.question.includes("mano derecha"));
      preguntasDer.forEach((e) => expect(e.answer).toBe("box-left"));
      const preguntasIzq = frente.filter((e) => e.question.includes("mano izquierda"));
      preguntasIzq.forEach((e) => expect(e.answer).toBe("box-right"));
    });

    it("perspectiva espaldas: mano derecha del personaje = caja derecha de pantalla", () => {
      const allExpert = generateSession("expert", 7);
      const espaldas = allExpert
        .map((e) => e as LeftRightCharExercise)
        .filter((e) => e.kind === "char-click" && e.perspective === "espaldas");
      const preguntasDer = espaldas.filter((e) => e.question.includes("mano derecha"));
      preguntasDer.forEach((e) => expect(e.answer).toBe("box-right"));
      const preguntasIzq = espaldas.filter((e) => e.question.includes("mano izquierda"));
      preguntasIzq.forEach((e) => expect(e.answer).toBe("box-left"));
    });
  });

  describe("validateAnswer", () => {
    it("devuelve true para respuesta correcta", () => {
      const ex: LeftRightExercise = {
        leftObj: "coche",
        rightObj: "flor",
        leftImgUrl: "",
        rightImgUrl: "",
        question: "¿Dónde está el coche?",
        options: ["izquierda", "derecha"],
        answer: "izquierda",
      };
      expect(validateAnswer(ex, "izquierda")).toBe(true);
    });

    it("devuelve false para respuesta incorrecta", () => {
      const ex: LeftRightExercise = {
        leftObj: "coche",
        rightObj: "flor",
        leftImgUrl: "",
        rightImgUrl: "",
        question: "¿Dónde está el coche?",
        options: ["izquierda", "derecha"],
        answer: "izquierda",
      };
      expect(validateAnswer(ex, "derecha")).toBe(false);
    });
  });
});

function article(label: string): string {
  const map: Record<string, string> = {
    coche: "el",
    flor: "la",
    globo: "el",
    manzana: "la",
    minion: "el",
    monstruo: "el",
    pájaro: "el",
  };
  return map[label] ?? "el";
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function artFromLeftRight(leftObj: string, _q_unused: string): string {
  void _q_unused;
  return leftObj;
}
