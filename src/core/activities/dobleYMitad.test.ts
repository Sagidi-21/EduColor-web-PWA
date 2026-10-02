import { describe, expect, it } from "vitest";
import { generateSession, huecoEnElResultado, SESSION_SIZE, validateAnswer } from "./dobleYMitad";
import type { ActivityDifficulty } from "../content/contracts";
import type { DobleType } from "./dobleYMitad";

const DIFICULTADES: ActivityDifficulty[] = ["easy", "medium", "hard", "expert"];
const SEMILLAS = [1, 42, 777, 4242, 999983];

/** Tipos que declara cada dificultad, en el orden en que se alternan. */
const TIPOS: Record<ActivityDifficulty, DobleType[]> = {
  easy: ["doble"],
  medium: ["doble", "mitad"],
  hard: ["doble", "mitad", "find-original-doble"],
  expert: ["doble", "mitad", "find-original-doble", "find-original-mitad"],
};

const clave = (ex: { type: string; number: number }) => `${ex.type}-${ex.number}`;

describe("dobleYMitad — generateSession", () => {
  it("completa la sesión sin repetir tipo y número", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const sesion = generateSession(dificultad, semilla);
        expect(sesion, `${dificultad}/${semilla}`).toHaveLength(SESSION_SIZE);
        const claves = sesion.map(clave);
        expect(new Set(claves).size, `${dificultad}/${semilla} repite ejercicio`).toBe(
          SESSION_SIZE,
        );
      }
    }
  });

  it("es determinista con la misma semilla y distinto con otra", () => {
    expect(generateSession("expert", 42)).toEqual(generateSession("expert", 42));
    expect(generateSession("medium", 42)).not.toEqual(generateSession("medium", 43));
  });

  it("trae todos los tipos que su dificultad declara, y ninguno más", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const tipos = new Set(generateSession(dificultad, semilla).map((ex) => ex.type));
        for (const tipo of tipos) {
          expect(TIPOS[dificultad], `${dificultad}/${semilla}: ${tipo}`).toContain(tipo);
        }
        for (const tipo of TIPOS[dificultad]) {
          expect(tipos, `${dificultad}/${semilla} no trae ${tipo}`).toContain(tipo);
        }
      }
    }
  });

  it("los tipos se alternan en el orden declarado, sin repetir de más", () => {
    // Es lo que garantiza que el nivel que define un tipo no se quede sin él.
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        const sesion = generateSession(dificultad, semilla);
        for (let i = 0; i < sesion.length; i++) {
          expect(sesion[i]!.type, `${dificultad}/${semilla} en la posición ${i}`).toBe(
            TIPOS[dificultad][i % TIPOS[dificultad].length],
          );
        }
      }
    }
  });

  it("respeta el rango de cada dificultad", () => {
    const topes: Record<ActivityDifficulty, number> = {
      easy: 10,
      medium: 20,
      hard: 50,
      expert: 100,
    };
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(ex.number, `${dificultad}/${semilla}: ${ex.question}`).toBeLessThanOrEqual(
            topes[dificultad],
          );
          expect(ex.number, ex.question).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("dobleYMitad — enunciados", () => {
  it("el doble multiplica por dos y la mitad reparte en dos", () => {
    for (const dificultad of DIFICULTADES) {
      for (const ex of generateSession(dificultad, 42)) {
        if (ex.type === "doble") {
          expect(ex.result, ex.question).toBe(ex.number * 2);
          expect(ex.operacion).toBe("x2");
          expect(ex.question).toBe(`¿Cuánto es el doble de ${ex.number}?`);
        } else if (ex.type === "mitad") {
          expect(ex.result, ex.question).toBe(ex.number / 2);
          expect(ex.operacion).toBe("div2");
          expect(ex.question).toBe(`¿Cuánto es la mitad de ${ex.number}?`);
        }
      }
    }
  });

  it("la mitad solo sale de números pares", () => {
    // 7 no tiene mitad limpia, así que ni la pregunta ni la respuesta.
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          if (ex.type !== "mitad") continue;
          expect(ex.number % 2, ex.question).toBe(0);
          expect(Number.isInteger(ex.result), ex.question).toBe(true);
        }
      }
    }
  });

  it("en los tipos inversos la respuesta es el número del que se partió", () => {
    for (const ex of generateSession("expert", 42)) {
      if (ex.type === "find-original-doble") {
        expect(ex.result, ex.question).toBe(ex.number / 2);
        expect(ex.result * 2, ex.question).toBe(ex.number);
        expect(ex.question).toBe(`Si el doble de un número es ${ex.number}, ¿cuál es ese número?`);
      } else if (ex.type === "find-original-mitad") {
        expect(ex.result, ex.question).toBe(ex.number * 2);
        expect(ex.question).toBe(`Si la mitad de un número es ${ex.number}, ¿cuál es ese número?`);
      }
    }
  });

  it("el enunciado da el número original o el resultado, y el hueco va en el otro lado", () => {
    for (const dificultad of DIFICULTADES) {
      for (const ex of generateSession(dificultad, 42)) {
        const esperado = ex.type === "doble" || ex.type === "mitad" ? "original" : "resultado";
        expect(ex.conocido, ex.question).toBe(esperado);
        expect(huecoEnElResultado(ex), ex.question).toBe(ex.conocido === "original");
      }
    }
  });

  it("los distractores del nivel experto que buscan la mitad son pares", () => {
    // Si entre los distractores hubiera un impar, el niño lo descartaría de un
    // vistazo por no poder ser el doble de una mitad.
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        if (ex.type !== "find-original-mitad") continue;
        for (const otra of ex.options) {
          if (otra === ex.correctAnswer) continue;
          expect(otra % 2, `${ex.question} / ${otra}`).toBe(0);
        }
      }
    }
  });
});

describe("dobleYMitad — opciones", () => {
  it("son siempre cuatro, distintas, con la correcta dentro y nunca cero", () => {
    for (const dificultad of DIFICULTADES) {
      for (const semilla of SEMILLAS) {
        for (const ex of generateSession(dificultad, semilla)) {
          expect(ex.options, ex.question).toHaveLength(4);
          expect(new Set(ex.options).size, ex.question).toBe(4);
          expect(ex.options, ex.question).toContain(ex.correctAnswer);
          for (const opt of ex.options) expect(opt, ex.question).toBeGreaterThan(0);
        }
      }
    }
  });

  it("las opciones no vienen ordenadas, para que la posición no dé la respuesta", () => {
    // El original las ordenaba y además las sacaba de una ventana alrededor de la
    // correcta, así que quedaban como una progresión: el doble de 3 daba
    // {3, 6, 9, 12} y se podía acertar sin multiplicar.
    let desordenadas = 0;
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        if ([...ex.options].sort((a, b) => a - b).join() !== ex.options.join()) desordenadas++;
      }
    }
    expect(desordenadas).toBeGreaterThan(0);
  });

  it("la opción correcta no cae siempre en la misma posición", () => {
    const posiciones = new Set<number>();
    for (const semilla of SEMILLAS) {
      for (const ex of generateSession("expert", semilla)) {
        posiciones.add(ex.options.indexOf(ex.correctAnswer));
      }
    }
    expect(posiciones.size).toBeGreaterThan(1);
  });
});

describe("dobleYMitad — validateAnswer", () => {
  it("acepta la correcta y rechaza cualquier otra opción", () => {
    for (const dificultad of DIFICULTADES) {
      for (const ex of generateSession(dificultad, 42)) {
        expect(validateAnswer(ex, ex.correctAnswer), ex.question).toBe(true);
        for (const otra of ex.options) {
          if (otra === ex.correctAnswer) continue;
          expect(validateAnswer(ex, otra), `${ex.question} / ${otra}`).toBe(false);
        }
      }
    }
  });

  it("no acepta un número que no está entre las opciones", () => {
    for (const ex of generateSession("expert", 42)) {
      expect(validateAnswer(ex, ex.correctAnswer + 1)).toBe(false);
      expect(validateAnswer(ex, 0)).toBe(false);
    }
  });
});
