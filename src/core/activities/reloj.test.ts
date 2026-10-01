import { describe, it, expect } from "vitest";
import {
  generateSession,
  validateAnswer,
  SCENES,
  timeLabel,
  type RelojExercise,
  type RelojMinutes,
} from "./reloj";

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const EXPERT_MINS: RelojMinutes[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** `7:05`, el formato con el que el motor escribe la hora digital. */
function horaDigital(h: number, m: number): string {
  return m < 10 ? `${h}:0${m}` : `${h}:${m}`;
}

describe("reloj — generateSession", () => {
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
    expect(generateSession("hard")).toEqual(generateSession("hard", 42));
  });

  it("las cuatro dificultades llenan los 10 ejercicios", () => {
    DIFFICULTIES.forEach((diff) => {
      expect(generateSession(diff, 42)).toHaveLength(10);
    });
  });

  it("easy también llega a 10: el 1 al 12 en punto da 12 combinaciones", () => {
    // Divergencia del generador de Electron, que limitaba el fácil al rango 1-6
    // y por eso se quedaba en 6 ejercicios. Con el fácil siempre en punto y
    // siempre del mismo tipo, el recorte no tenía detrás ninguna razón
    // didáctica: no se pide una hora más sencilla que otra, se pide la misma en
    // punto. Decisión del profesor del 2026-10-01, el mismo día y por el mismo
    // motivo que en `relojPonerHora`, que tenía el recorte idéntico.
    expect(generateSession("easy", 42)).toHaveLength(10);
  });

  it("no repite la combinación hora:minuto", () => {
    DIFFICULTIES.forEach((diff) => {
      const claves = generateSession(diff, 7).map((ex) => `${ex.hours}-${ex.minutes}`);
      expect(new Set(claves).size).toBe(claves.length);
    });
  });

  it("la respuesta correcta siempre está entre las opciones", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 99).forEach((ex) => {
        expect(ex.options.map((o) => o.value)).toContain(ex.correctAnswer);
      });
    });
  });

  it("cada ejercicio ofrece 4 opciones distintas", () => {
    DIFFICULTIES.forEach((diff) => {
      generateSession(diff, 5).forEach((ex) => {
        const valores = ex.options.map((o) => o.value);
        expect(ex.options).toHaveLength(4);
        expect(new Set(valores).size).toBe(4);
      });
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

  describe("easy — horas en punto del 1 al 12, siempre con aguja", () => {
    it("usa solo el tipo analog_to_digital", () => {
      generateSession("easy", 42).forEach((ex) => expect(ex.type).toBe("analog_to_digital"));
    });

    it("horas del 1 al 12 y minutos siempre 0", () => {
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

    it("las opciones son horas en punto y la respuesta coincide con el enunciado", () => {
      generateSession("easy", 42).forEach((ex) => {
        expect(ex.question).toBe("¿Qué hora marca el reloj?");
        ex.options.forEach((o) => expect(o.value).toMatch(/^\d{1,2}:00$/));
        expect(ex.correctAnswer).toBe(`${ex.hours}:00`);
      });
    });
  });

  describe("medium — en punto o y media, del 1 al 12, tres tipos", () => {
    it("los minutos son 0 o 30", () => {
      generateSession("medium", 42).forEach((ex) => expect([0, 30]).toContain(ex.minutes));
    });

    it("solo usa los tres tipos de su rango, nunca match_scene", () => {
      const permitidos = ["analog_to_digital", "digital_to_analog", "digital_read"];
      generateSession("medium", 42).forEach((ex) => expect(permitidos).toContain(ex.type));
    });

    it("la respuesta es la hora digital, salvo en digital_read que va con palabras", () => {
      generateSession("medium", 42).forEach((ex) => {
        if (ex.type === "digital_read") {
          expect(ex.correctAnswer).toBe(timeLabel(ex.hours, ex.minutes));
        } else {
          expect(ex.correctAnswer).toBe(horaDigital(ex.hours, ex.minutes));
        }
      });
    });

    it("el enunciado de digital_to_analog anuncia la hora digital que se ve", () => {
      generateSession("medium", 42)
        .filter((ex) => ex.type === "digital_to_analog")
        .forEach((ex) => {
          expect(ex.question).toBe(`El reloj digital marca ${ex.correctAnswer}. ¿Cuál es la hora?`);
        });
    });
  });

  describe("hard — en punto, y cuarto, y media y menos cuarto", () => {
    it("los minutos son 0, 15, 30 o 45", () => {
      generateSession("hard", 42).forEach((ex) => expect([0, 15, 30, 45]).toContain(ex.minutes));
    });

    it("solo usa match_scene y digital_read", () => {
      generateSession("hard", 42).forEach((ex) =>
        expect(["match_scene", "digital_read"]).toContain(ex.type),
      );
    });

    it("cada match_scene enuncia la escena de SCENES o, si no hay, la actividad", () => {
      generateSession("hard", 42)
        .filter((ex) => ex.type === "match_scene")
        .forEach((ex) => {
          const escena = SCENES.find((s) => s.hour === ex.hours && s.min === ex.minutes);
          const spoken = timeLabel(ex.hours, ex.minutes);
          expect(ex.question).toBe(
            escena
              ? `Son ${spoken}. ${escena.scene}. ¿Qué hora es?`
              : `La actividad es a ${spoken}. ¿Qué hora marca el reloj?`,
          );
        });
    });

    it("el reloj que acompaña a la escena marca esa misma hora", () => {
      generateSession("hard", 42)
        .filter((ex) => ex.type === "match_scene")
        .forEach((ex) => expect(ex.correctAnswer).toBe(horaDigital(ex.hours, ex.minutes)));
    });
  });

  describe("expert — los doce minutos y los tipos mezclados", () => {
    it("los minutos salen del pool completo", () => {
      const minutos = new Set(generateSession("expert", 42).map((ex) => ex.minutes));
      minutos.forEach((m) => expect(EXPERT_MINS).toContain(m));
    });

    it("aparece al menos un minuto que no sea 0 ni 30", () => {
      const minutos = generateSession("expert", 42).map((ex) => ex.minutes);
      expect(minutos.some((m) => m !== 0 && m !== 30)).toBe(true);
    });

    it("no usa analog_to_digital, que es el tipo exclusivo de easy", () => {
      generateSession("expert", 42).forEach((ex) => expect(ex.type).not.toBe("analog_to_digital"));
    });
  });

  describe("digital_read — las opciones se escriben con palabras", () => {
    const verbales = DIFFICULTIES.flatMap((diff) =>
      generateSession(diff, 11).filter((ex) => ex.type === "digital_read"),
    );

    it("aparece en alguna sesión de cada dificultad que lo permite", () => {
      (["medium", "hard", "expert"] as const).forEach((diff) => {
        expect(generateSession(diff, 11).some((ex) => ex.type === "digital_read")).toBe(true);
      });
      expect(generateSession("easy", 11).some((ex) => ex.type === "digital_read")).toBe(false);
      expect(verbales.length).toBeGreaterThan(0);
    });

    it("la pregunta es siempre la misma y la respuesta verbal no lleva dos puntos", () => {
      verbales.forEach((ex) => {
        expect(ex.question).toBe("¿Cómo se lee esta hora?");
        expect(ex.correctAnswer).not.toContain(":");
        ex.options.forEach((o) => expect(o.label).toBe(o.value));
      });
    });

    it("solo la correcta cita la hora del ejercicio: las distractoras traen otras horas", () => {
      verbales.forEach((ex) => {
        const correcta = ex.options.find((o) => o.value === ex.correctAnswer)!;
        expect(correcta.label).toBe(timeLabel(ex.hours, ex.minutes));
        ex.options
          .filter((o) => o.value !== ex.correctAnswer)
          .forEach((o) => expect(o.label).not.toBe(correcta.label));
      });
    });
  });
});

describe("reloj — validateAnswer", () => {
  const conAgujas: RelojExercise = {
    type: "analog_to_digital",
    hours: 7,
    minutes: 5,
    question: "¿Qué hora marca el reloj?",
    options: [
      { label: "7:05", value: "7:05" },
      { label: "7:00", value: "7:00" },
      { label: "7:15", value: "7:15" },
      { label: "8:05", value: "8:05" },
    ],
    correctAnswer: "7:05",
  };

  it("acepta la respuesta correcta", () => {
    expect(validateAnswer(conAgujas, "7:05")).toBe(true);
  });

  it("rechaza cualquier otra opción del ejercicio", () => {
    expect(validateAnswer(conAgujas, "7:00")).toBe(false);
    expect(validateAnswer(conAgujas, "7:15")).toBe(false);
    expect(validateAnswer(conAgujas, "8:05")).toBe(false);
  });

  it("es sensible al formato exacto: 7:5 no es lo mismo que 7:05", () => {
    expect(validateAnswer(conAgujas, "7:5")).toBe(false);
  });

  it("funciona igual con la respuesta verbal de digital_read", () => {
    const verbal: RelojExercise = {
      type: "digital_read",
      hours: 3,
      minutes: 30,
      question: "¿Cómo se lee esta hora?",
      options: [
        { label: "las 3 y media", value: "las 3 y media" },
        { label: "las 3 y cuarto", value: "las 3 y cuarto" },
        { label: "las 4 menos cuarto", value: "las 4 menos cuarto" },
        { label: "las 4 menos diez", value: "las 4 menos diez" },
      ],
      correctAnswer: "las 3 y media",
    };
    expect(validateAnswer(verbal, "las 3 y media")).toBe(true);
    expect(validateAnswer(verbal, "3:30")).toBe(false);
  });
});

describe("reloj — timeLabel", () => {
  /**
   * Las doce ramas del enunciado con la hora que DEBE nombrarse. En las nueve
   * primeras coincide con la de la aguja; en las tres de "menos" va una posición
   * por delante, porque se dicen respecto de la hora siguiente.
   */
  const RAMAS: [RelojMinutes, string, number][] = [
    [0, "en punto", 7],
    [5, "y cinco", 7],
    [10, "y diez", 7],
    [15, "y cuarto", 7],
    [20, "y veinte", 7],
    [25, "y veinticinco", 7],
    [30, "y media", 7],
    [35, "y treinta y cinco", 7],
    [40, "y cuarenta", 7],
    [45, "menos cuarto", 8],
    [50, "menos diez", 8],
    [55, "menos cinco", 8],
  ];

  /** Los minutos que se dicen respecto de la hora siguiente. */
  const MENOS: RelojMinutes[] = [45, 50, 55];

  /** La hora que sigue a `h` en un reloj de 12 h, con la vuelta a la una. */
  const siguiente = (h: number) => (h === 12 ? 1 : h + 1);

  it("concorda el artículo: a la una se dice 'la 1', al resto 'las N'", () => {
    expect(timeLabel(1, 0)).toBe("la 1 en punto");
    expect(timeLabel(3, 0)).toBe("las 3 en punto");
  });

  it("el singular del 1 también con minutos, no solo en punto", () => {
    expect(timeLabel(1, 5)).toBe("la 1 y cinco");
    expect(timeLabel(1, 15)).toBe("la 1 y cuarto");
    expect(timeLabel(1, 30)).toBe("la 1 y media");
  });

  it("el plural se mantiene con minutos distintos del 0", () => {
    expect(timeLabel(8, 10)).toBe("las 8 y diez");
    expect(timeLabel(12, 30)).toBe("las 12 y media");
  });

  it("las doce ramas del enunciado nombran la hora que les toca", () => {
    RAMAS.forEach(([min, esperado, hora]) => {
      expect(timeLabel(7, min)).toBe(`${hora === 1 ? "la" : "las"} ${hora} ${esperado}`);
    });
  });

  it("'menos ...' adelanta la hora: 12:45 es 'la 1 menos cuarto', no 'las 12'", () => {
    expect(timeLabel(12, 45)).toBe("la 1 menos cuarto");
    expect(timeLabel(10, 55)).toBe("las 11 menos cinco");
    expect(timeLabel(11, 50)).toBe("las 12 menos diez");
    expect(timeLabel(6, 45)).toBe("las 7 menos cuarto");
    expect(timeLabel(1, 45)).toBe("las 2 menos cuarto");
  });

  it("invariante: con 45, 50 y 55 la hora escrita es la siguiente a la de la aguja", () => {
    for (let h = 1; h <= 12; h++) {
      const esperada = siguiente(h);
      const articulo = esperada === 1 ? "la" : "las";
      MENOS.forEach((m) => {
        expect(timeLabel(h, m)).toMatch(new RegExp(`^${articulo} ${esperada} menos `));
      });
    }
  });

  it("ninguna hora escribe el artículo que no le toca a la que nombra", () => {
    // La hora nombrada es la de la aguja, salvo en las ramas de "menos", que van
    // una posición por delante: el artículo tiene que concordar con la que sale.
    for (let h = 1; h <= 12; h++) {
      for (const m of EXPERT_MINS) {
        const frase = timeLabel(h, m);
        const nombrada = MENOS.includes(m) ? siguiente(h) : h;
        if (nombrada === 1) {
          expect(frase.startsWith("las 1 ")).toBe(false);
          expect(frase.startsWith("la 1 ")).toBe(true);
        } else {
          expect(frase).not.toMatch(/^la \d/);
          expect(frase.startsWith(`las ${nombrada} `)).toBe(true);
        }
      }
    }
  });
});

describe("reloj — SCENES", () => {
  /** `hora:minuto` de las escenas que se quitaron por ambigüedad. */
  const AMBIGUAS = ["6:00", "2:00", "3:30", "9:00"];

  it("son 6 escenas", () => {
    expect(SCENES).toHaveLength(6);
  });

  it("son las 6 acordadas, y cada una con una hora que no se repite", () => {
    expect(SCENES.map((s) => [s.hour, s.min])).toEqual([
      [7, 0],
      [8, 0],
      [9, 30],
      [10, 30],
      [5, 0],
      [4, 30],
    ]);
  });

  it("ninguna cae en una hora con dos lecturas posibles en un reloj de 12 h", () => {
    // 6:00 (jugar), 2:00 (comer), 3:30 (siesta) y 9:00 (dormir) existen en un
    // reloj de 12 h tanto por la mañana como por la tarde: no se puede saber.
    const claves = SCENES.map((s) => `${s.hour}:${String(s.min).padStart(2, "0")}`);
    AMBIGUAS.forEach((h) => expect(claves).not.toContain(h));
  });

  it("ninguna repite hora:minuto, que es la clave con la que las busca el generador", () => {
    const claves = SCENES.map((s) => `${s.hour}-${s.min}`);
    expect(new Set(claves).size).toBe(SCENES.length);
  });

  it("el emoji de cada escena sigue llegando al enunciado del ejercicio que la usa", () => {
    // Sin reescribir los textos: se toma el de la propia lista.
    const conEscena = generateSession("hard", 42).filter(
      (ex) =>
        ex.type === "match_scene" &&
        SCENES.some((s) => s.hour === ex.hours && s.min === ex.minutes),
    );
    expect(conEscena.length).toBeGreaterThan(0);
    conEscena.forEach((ex) => {
      const escena = SCENES.find((s) => s.hour === ex.hours && s.min === ex.minutes)!;
      expect(ex.question).toContain(escena.scene);
    });
  });
});
