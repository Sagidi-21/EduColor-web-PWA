import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelojScreen } from "./RelojScreen";
import * as relojEngine from "../../../core/activities/reloj";
import type { RelojExercise } from "../../../core/activities/reloj";
import { timeLabel } from "../../../core/activities/shared/timeLabel";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("reloj", mockOnExit, difficulty, seed);

/**
 * El salto al siguiente ejercicio tras acertar son 900 ms: el valor unificado
 * con el resto de actividades de la PWA, no los 1300 ms de Electron.
 */
const AUTOAVANCE_MS = 900;

const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".reloj__option"));

/** Índice del botón que lleva `value` como `data-value`. */
const indiceDe = (c: HTMLElement, value: string) =>
  optionButtons(c).findIndex((b) => b.dataset.value === value);

/** Pulsa la opción indicada, sea la correcta o una distractora. */
const pulsar = (c: HTMLElement, value: string) =>
  fireEvent.click(c.querySelector<HTMLButtonElement>(`#reloj-option-${indiceDe(c, value)}`)!);

const acertar = (c: HTMLElement, ex: RelojExercise) => pulsar(c, ex.correctAnswer);

const primeraDistractora = (ex: RelojExercise) =>
  ex.options.find((o) => o.value !== ex.correctAnswer)!.value;

/**
 * Primera semilla cuyo primer ejercicio es del tipo pedido.
 *
 * No se fija a mano: depende de cómo caiga el reparto de tipos, y un test que
 * dependa de eso se rompe en cuanto cambie el orden del generador.
 */
const semillaQueEmpiezaCon = (tipo: RelojExercise["type"], minutos?: number) => {
  for (let semilla = 1; semilla <= 500; semilla++) {
    for (const diff of ["medium", "hard", "expert"] as const) {
      const ex = relojEngine.generateSession(diff, semilla)[0];
      if (ex.type === tipo && (minutos === undefined || ex.minutes === minutos)) {
        return { diff, semilla };
      }
    }
  }
  throw new Error(`Ninguna semilla empieza por un ejercicio de tipo ${tipo}`);
};

describe("RelojScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("monta con la pregunta del motor y el contador 1/N", () => {
    const seed = 4242;
    const session = relojEngine.generateSession("easy", seed);

    const { container } = render(<RelojScreen {...props("easy", seed)} />);

    expect(container.querySelector(".reloj__question")?.textContent).toBe(session[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session.length}`,
    );
  });

  it("pinta el reloj con agujas y el título de la actividad en la cabecera", () => {
    const { container } = render(<RelojScreen {...props("easy")} />);

    expect(container.querySelector(".reloj__clock-svg")).not.toBeNull();
    expect(container.querySelector(".activity-header__title")?.textContent).toBe("El reloj");
  });

  it("ofrece las opciones del motor, con la correcta presente y sin repetir", () => {
    const ex = relojEngine.generateSession("medium", 4242)[0];
    const { container } = render(<RelojScreen {...props("medium")} />);

    const valores = optionButtons(container).map((b) => b.dataset.value);
    expect(valores.sort()).toEqual(ex.options.map((o) => o.value).sort());
    expect(new Set(valores).size).toBe(valores.length);
    expect(valores).toContain(ex.correctAnswer);
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const ex = relojEngine.generateSession("hard", 4242)[0];
    const { container } = render(<RelojScreen {...props("hard")} />);

    acertar(container, ex);

    expect(container.querySelector(".reloj__option--correct")).not.toBeNull();
    expect(container.querySelector(".reloj__celebration")?.textContent).toContain("¡Correcto!");
  });

  it("fallo: marca la pulsada, no celebra y ofrece reintentar", () => {
    const ex = relojEngine.generateSession("hard", 4242)[0];
    const { container } = render(<RelojScreen {...props("hard")} />);

    pulsar(container, primeraDistractora(ex));

    expect(container.querySelector(".reloj__option--wrong")).not.toBeNull();
    expect(container.querySelector(".reloj__option--correct")).toBeNull();
    expect(container.querySelector(".reloj__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar borra la marca de fallo y vuelve a habilitar los botones", () => {
    const ex = relojEngine.generateSession("hard", 4242)[0];
    const { container } = render(<RelojScreen {...props("hard")} />);

    pulsar(container, primeraDistractora(ex));
    expect(optionButtons(container).every((b) => b.disabled)).toBe(true);

    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".reloj__option--wrong")).toBeNull();
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("no avanza solo tras fallar: el ejercicio sigue en pantalla", () => {
    const ex = relojEngine.generateSession("hard", 4242)[0];
    const { container } = render(<RelojScreen {...props("hard")} />);

    pulsar(container, primeraDistractora(ex));
    runTimers(AUTOAVANCE_MS * 3);

    expect(container.querySelector(".reloj__question")?.textContent).toBe(ex.question);
    expect(container.querySelector(".summary")).toBeNull();
  });

  it("avanza solo tras acertar y termina en el resumen", () => {
    const sesion = relojEngine.generateSession("hard", 4242);
    const { container } = render(<RelojScreen {...props("hard")} />);

    for (const ex of sesion) {
      expect(container.querySelector(".reloj__question")?.textContent).toBe(ex.question);
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${sesion.length}/${sesion.length}`,
    );
  });

  it("Repetir vuelve a la misma sesión, no a una nueva al azar", () => {
    // El resumen reinicia con la semilla de la sesión en curso (AGENT_RULES.md
    // §17): con `Date.now() % 999983` el niño vería un ejercicio distinto cada
    // vez que pulsa Repetir.
    const sesion = relojEngine.generateSession("hard", 4242);
    const { container } = render(<RelojScreen {...props("hard")} />);

    for (const ex of sesion) {
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    }
    expect(container.querySelector(".summary")).not.toBeNull();

    fireEvent.click(container.querySelector(".summary__btn--primary")!);

    expect(container.querySelector(".summary")).toBeNull();
    expect(container.querySelector(".reloj__question")?.textContent).toBe(sesion[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${sesion.length}`,
    );
  });

  it("acertar tras un fallo no suma a la cuenta de correctas", () => {
    const sesion = relojEngine.generateSession("hard", 4242);
    const { container } = render(<RelojScreen {...props("hard")} />);

    // El primer ejercicio se falla, se reintenta y se acierta: cuenta como fallado.
    pulsar(container, primeraDistractora(sesion[0]));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, sesion[0]);
    runTimers(AUTOAVANCE_MS);

    // Los demás se aciertan a la primera, así que el resumen queda en 9 de 10.
    for (const ex of sesion.slice(1)) {
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${sesion.length - 1}/${sesion.length}`,
    );
  });

  it("analog_to_digital y match_scene muestran agujas; los otros dos, display digital", () => {
    for (const tipo of [
      "analog_to_digital",
      "digital_to_analog",
      "match_scene",
      "digital_read",
    ] as const) {
      const { diff, semilla } = semillaQueEmpiezaCon(tipo);
      const { container } = render(<RelojScreen {...props(diff, semilla)} />);

      const conAgujas = tipo === "analog_to_digital" || tipo === "match_scene";
      expect(container.querySelector(".reloj__clock-svg") !== null).toBe(conAgujas);
      expect(container.querySelector(".reloj__digital-display") !== null).toBe(!conAgujas);

      cleanup();
    }
  });

  it("en digital_to_analog las opciones son relojes, no textos", () => {
    const { diff, semilla } = semillaQueEmpiezaCon("digital_to_analog");
    const { container } = render(<RelojScreen {...props(diff, semilla)} />);

    const botones = optionButtons(container);
    expect(botones).toHaveLength(4);
    botones.forEach((b) => {
      const svg = b.querySelector("svg")!;
      expect(svg).not.toBeNull();
      expect(b.textContent?.trim()).toBe("");
      // La esfera de las opciones es de 96 px, no los 60 px que venía de Electron.
      expect(svg.getAttribute("width")).toBe("96");
      expect(svg.getAttribute("height")).toBe("96");
    });
    // El enunciado anuncia la hora digital, que es lo que hay que traducir.
    expect(container.querySelector(".reloj__digital-display")?.textContent).toContain(
      relojEngine.generateSession(diff, semilla)[0].hours,
    );
  });

  it("en el resto de tipos las opciones se leen como texto", () => {
    const sesion = relojEngine.generateSession("hard", 4242);
    const ex = sesion[0];
    const { container } = render(<RelojScreen {...props("hard")} />);

    expect(ex.type === "digital_to_analog").toBe(false);
    optionButtons(container).forEach((b, i) => {
      expect(b.querySelector("svg")).toBeNull();
      expect(b.textContent).toBe(ex.options[i].label);
      // Con texto visible el nombre accesible ya lo es: aquí no se pone aria-label.
      expect(b.getAttribute("aria-label")).toBeNull();
    });
  });

  it("el display digital rellena con dos cifras los minutos", () => {
    const { diff, semilla } = semillaQueEmpiezaCon("digital_read");
    const ex = relojEngine.generateSession(diff, semilla)[0];
    const { container } = render(<RelojScreen {...props(diff, semilla)} />);

    expect(container.querySelector(".reloj__digital-display")?.textContent).toBe(
      `${ex.hours}:${String(ex.minutes).padStart(2, "0")}`,
    );
  });

  it("el display digital se nombra con los minutos rellenos, no con 7:5", () => {
    // 5 minutos solo salen en `expert`, donde el pool son los doce minutos.
    const { diff, semilla } = semillaQueEmpiezaCon("digital_read", 5);
    const ex = relojEngine.generateSession(diff, semilla)[0];
    const { container } = render(<RelojScreen {...props(diff, semilla)} />);

    const display = container.querySelector(".reloj__digital-display")!;
    expect(display.getAttribute("aria-label")).toBe(
      `Reloj digital: ${ex.hours}:${String(ex.minutes).padStart(2, "0")}`,
    );
    // El texto visible y el nombre accesible dicen lo mismo.
    expect(display.getAttribute("aria-label")).toContain(display.textContent);
    expect(display.getAttribute("aria-label")).toMatch(/^Reloj digital: \d{1,2}:\d{2}$/);
  });

  it("en digital_to_analog el botón de la esfera se llama con la hora en palabras", () => {
    const { diff, semilla } = semillaQueEmpiezaCon("digital_to_analog");
    const ex = relojEngine.generateSession(diff, semilla)[0];
    const { container } = render(<RelojScreen {...props(diff, semilla)} />);

    optionButtons(container).forEach((b, i) => {
      const [h, m] = ex.options[i].value.split(":").map(Number);
      const nombre = b.getAttribute("aria-label");
      // "las 3 en punto", no "Las 3:00": la hora digital no es un nombre.
      expect(nombre).toBe(timeLabel(h, m));
      expect(nombre).toMatch(/^la[s]? \d{1,2} /);
      expect(nombre).not.toContain(":");
      expect(nombre).not.toBe(`Las ${ex.options[i].label}`);
    });
  });

  it("a la una, el botón de la esfera se llama 'la 1...' y no 'las 1...'", () => {
    // Sesión cuyo primer ejercicio de digital_to_analog ofrece la una.
    const encontrada = (() => {
      for (let semilla = 1; semilla <= 500; semilla++) {
        for (const diff of ["medium", "expert"] as const) {
          const ex = relojEngine.generateSession(diff, semilla)[0];
          if (ex.type === "digital_to_analog" && ex.options.some((o) => /^1:/.test(o.value))) {
            return { diff, semilla };
          }
        }
      }
      throw new Error("Ninguna semilla ofrece la una como opción con esfera");
    })();

    const { diff, semilla } = encontrada;
    const ex = relojEngine.generateSession(diff, semilla)[0];
    const { container } = render(<RelojScreen {...props(diff, semilla)} />);

    const conLaUna = optionButtons(container).filter((b) => /^1:/.test(b.dataset.value ?? ""));
    expect(conLaUna.length).toBeGreaterThan(0);
    conLaUna.forEach((b) => {
      expect(b.getAttribute("aria-label")).toMatch(/^la 1 /);
      expect(b.getAttribute("aria-label")).not.toMatch(/^las /);
    });
    expect(conLaUna.map((b) => b.getAttribute("aria-label"))).toEqual(
      ex.options
        .filter((o) => /^1:/.test(o.value))
        .map((o) => timeLabel(1, Number(o.value.split(":")[1]))),
    );
  });

  it("ninguna opción se queda sin nombre accesible", () => {
    for (const tipo of ["digital_to_analog", "digital_read", "match_scene"] as const) {
      const { diff, semilla } = semillaQueEmpiezaCon(tipo);
      const { container } = render(<RelojScreen {...props(diff, semilla)} />);

      optionButtons(container).forEach((b) => {
        const nombre = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim();
        expect(nombre.length).toBeGreaterThan(0);
      });

      cleanup();
    }
  });

  it("no monta Numpad ni DigitCell: el reloj se resuelve siempre con botones", () => {
    DIFFICULTIES.forEach((diff) => {
      const { container } = render(<RelojScreen {...props(diff)} />);
      expect(container.querySelector(".shared-numpad")).toBeNull();
      expect(container.querySelector(".dab")).toBeNull();
      expect(container.querySelector(".input-toggle")).toBeNull();
      cleanup();
    });
  });

  it("sin ejercicios avisa y ofrece volver al catálogo", () => {
    vi.spyOn(relojEngine, "generateSession").mockReturnValue([]);

    const { container } = render(<RelojScreen {...props("easy")} />);

    expect(container.textContent).toContain("No hay ningun ejercicio que mostrar");
    fireEvent.click(container.querySelector<HTMLButtonElement>(".act-error__btn")!);
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });
});
