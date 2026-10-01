import { describe, it, expect } from "vitest";
import { generateSession, validateAnswer, type RelojPonerHoraExercise } from "./relojPonerHora";
import { timeLabel } from "./reloj";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const CUARTOS = [0, 15, 30, 45];
const DE_CINCO_EN_CINCO = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** `7:05`, el formato con el que el motor escribe la hora digital. */
function horaDigital(h: number, m: number): string {
  return m < 10 ? `${h}:0${m}` : `${h}:${m}`;
}

describe("relojPonerHora — generateSession", () => {
  it("es determinista con la misma seed", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 123)).toEqual(generateSession(diff, 123));
    });
  });

  it("produce sesiones distintas con seeds distintas", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 1)).not.toEqual(generateSession(diff, 2));
    });
  });

  it("la seed por defecto es 42", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff)).toEqual(generateSession(diff, 42));
    });
  });

  it("las cuatro dificultades llenan los 10 ejercicios", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 42)).toHaveLength(10);
    });
  });

  it("easy también llega a 10: el 1 al 12 en punto da 12 combinaciones", () => {
    // Divergencia del generador de Electron, que limitaba el fácil al rango 1-6
    // y por eso se quedaba en 6 ejercicios sin llegar a 10. El resto de
    // dificultades usa las 12 horas, así que el recorte no tenía detrás ninguna
    // razón didáctica: no se pide una hora más sencilla que otra, se pide la
    // misma en punto. Decisión del profesor del 2026-10-01.
    expect(generateSession("easy", 42)).toHaveLength(10);
  });

  it("no repite la combinación hora:minuto", () => {
    DIFFICULTIES.forEach((diff) => {
      const claves = generateSession(diff, 7).map((ex) => `${ex.hours}-${ex.minutes}`);
      expect(new Set(claves).size).toBe(claves.length);
    });
  });

  it("las horas quedan siempre entre 1 y 12", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 2024).forEach((ex) => {
        expect(ex.hours).toBeGreaterThanOrEqual(1);
        expect(ex.hours).toBeLessThanOrEqual(12);
      });
    });
  });

  it("`target` es siempre la hora digital de las agujas pedidas, con minutos rellenos", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 99).forEach((ex) => {
        expect(ex.target).toBe(horaDigital(ex.hours, ex.minutes));
        expect(ex.target).toMatch(/^\d{1,2}:\d{2}$/);
      });
    });
  });

  it("cada `target` es único dentro de la sesión, porque la combinación lo es", () => {
    DIFFICULTIES.forEach((diff) => {
      const targets = generateSession(diff, 11).map((ex) => ex.target);
      expect(new Set(targets).size).toBe(targets.length);
    });
  });

  describe("easy — horas en punto del 1 al 12", () => {
    it("minutos siempre 0 y horas del 1 al 12", () => {
      generateSession("easy", 42).forEach((ex) => {
        expect(ex.minutes).toBe(0);
        expect(ex.hours).toBeGreaterThanOrEqual(1);
        expect(ex.hours).toBeLessThanOrEqual(12);
      });
    });

    it("llega a las 12 horas, no solo a las 6 que daba el rango antiguo", () => {
      // Con el rango 1-6 y los minutos siempre en cero no había más de 6
      // combinaciones, así que la sesión nunca podía llegar a 10.
      const horas = generateSession("easy", 42).map((ex) => ex.hours);
      expect(Math.max(...horas)).toBeGreaterThan(6);
    });

    it("el objetivo es siempre una hora en punto del 1 al 12", () => {
      generateSession("easy", 42).forEach((ex) => expect(ex.target).toMatch(/^(1[0-2]|[1-9]):00$/));
    });
  });

  describe("medium — en punto o y media, del 1 al 12", () => {
    it("los minutos son 0 o 30", () => {
      generateSession("medium", 42).forEach((ex) => expect([0, 30]).toContain(ex.minutes));
    });

    it("aparece al menos una y media", () => {
      expect(generateSession("medium", 42).some((ex) => ex.minutes === 30)).toBe(true);
    });
  });

  describe("hard — en punto, y cuarto, y media y menos cuarto", () => {
    it("los minutos son 0, 15, 30 o 45", () => {
      generateSession("hard", 42).forEach((ex) => expect(CUARTOS).toContain(ex.minutes));
    });

    it("aparece al menos un cuarto que no sea en punto ni y media", () => {
      expect(generateSession("hard", 42).some((ex) => ex.minutes === 15 || ex.minutes === 45)).toBe(
        true,
      );
    });
  });

  describe("expert — cualquier minuto de 5 en 5", () => {
    it("los minutos salen del pool completo", () => {
      const minutos = new Set(generateSession("expert", 42).map((ex) => ex.minutes));
      minutos.forEach((m) => expect(DE_CINCO_EN_CINCO).toContain(m));
    });

    it("aparece al menos un minuto que no sea 0 ni 30", () => {
      expect(
        generateSession("expert", 42).some((ex) => ex.minutes !== 0 && ex.minutes !== 30),
      ).toBe(true);
    });

    it("ningún minuto está fuera de la rejilla de 5 en 5", () => {
      generateSession("expert", 42).forEach((ex) => expect(ex.minutes % 5).toBe(0));
    });
  });

  it("ninguna sesión incluye escenas: este motor pide una hora, no una situación", () => {
    // El original no tiene escenas y esta migración tampoco. Se comprueba que
    // ningún ejercicio trae un texto de enunciado, que es donde aparecerían.
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 42).forEach((ex) => {
        expect(Object.keys(ex).sort()).toEqual(["hours", "minutes", "target"]);
      });
    });
  });

  it("cualquier hora pedida se puede nombrar en voz alta con `timeLabel`", () => {
    // `relojPonerHora` no dice la hora en palabras, pero la pantalla nombra el
    // reloj que está dibujando. Se comprueba que ninguna combinación generada
    // rompe esa función, incluidas las tres ramas de "menos" que adelantan la hora.
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 77).forEach((ex) => {
        const frase = timeLabel(ex.hours, ex.minutes);
        expect(frase).toMatch(/^la[s]? \d{1,2} /);
      });
    });
  });
});

describe("relojPonerHora — validateAnswer", () => {
  const ej: RelojPonerHoraExercise = { hours: 3, minutes: 30, target: "3:30" };

  it("acepta la hora pedida", () => {
    expect(validateAnswer(ej, 3, 30)).toBe(true);
  });

  it("rechaza la hora correcta con otros minutos", () => {
    expect(validateAnswer(ej, 3, 0)).toBe(false);
    expect(validateAnswer(ej, 3, 25)).toBe(false);
  });

  it("rechaza los minutos correctos con otra hora", () => {
    expect(validateAnswer(ej, 12, 30)).toBe(false);
    expect(validateAnswer(ej, 4, 30)).toBe(false);
  });

  it("no acepta la hora reflejada: las doce en punto no son las cero en punto", () => {
    const doce: RelojPonerHoraExercise = { hours: 12, minutes: 0, target: "12:00" };
    expect(validateAnswer(doce, 12, 0)).toBe(true);
    expect(validateAnswer(doce, 0, 0)).toBe(false);
  });

  it("acepta la respuesta de cada ejercicio generado, y solo esa", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 5).forEach((ex) => {
        expect(validateAnswer(ex, ex.hours, ex.minutes)).toBe(true);
        expect(validateAnswer(ex, ex.hours, (ex.minutes + 5) % 60)).toBe(false);
        expect(validateAnswer(ex, (ex.hours % 12) + 1, ex.minutes)).toBe(false);
      });
    });
  });
});
