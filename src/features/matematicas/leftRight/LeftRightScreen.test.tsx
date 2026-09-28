import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { LeftRightScreen } from "./LeftRightScreen";
import { generateSession, validateAnswer } from "../../../core/activities/leftRight";
import type { LeftRightExercise } from "../../../core/activities/leftRight";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 900;

/**
 * Ojo: esta familia usa `(difficulty, seed)`, el orden mayoritario, y además
 * `seed` tiene valor por defecto `42` en el motor. Es la inversa de
 * `numeracion1119`.
 */
const session = (difficulty: ActivityDifficulty, seed = 4242) => generateSession(difficulty, seed);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("leftRight", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".lr__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".lr__option"));

const charBoxes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".lr__char-box"));

/**
 * La sesión es una unión de dos ejercicios: el de opciones, con `options` y
 * `answer`, y el de personaje, que se resuelve arrastrando. En `easy` el motor
 * solo produce el primero, así que se estrecha el tipo sin hacer aserciones.
 */
const optionExercise = (difficulty: ActivityDifficulty, seed = 4242): LeftRightExercise => {
  const ex = session(difficulty, seed)[0];
  if (!("options" in ex)) throw new Error("Se esperaba un ejercicio de opciones");
  return ex;
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("LeftRightScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la pregunta del motor y el contador 1/N", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<LeftRightScreen {...buildProps("easy", seed)} />);

    expect(questionOf(container)).toBe(exercises[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${exercises.length}`,
    );
  });

  it("es una actividad de interacción: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<LeftRightScreen {...buildProps("easy")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("acierto: marca la opción correcta y avanza solo", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    const ex = optionExercise("easy", seed);

    const { container } = render(<LeftRightScreen {...buildProps("easy", seed)} />);
    const button = optionButtons(container).find((b) => b.textContent === ex.answer);
    expect(button).toBeDefined();
    fireEvent.click(button!);

    expect(button!.className).toContain("lr__option--correct");
    expect(container.querySelector(".wrong-feedback")).toBeNull();

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2 / ${exercises.length}`,
    );
  });

  it("fallo: marca la opción pulsada y ofrece reintentar y siguiente", () => {
    const seed = 4242;
    const ex = optionExercise("easy", seed);
    const wrong = ex.options.find((o) => o !== ex.answer);
    expect(wrong).toBeDefined();

    const { container } = render(<LeftRightScreen {...buildProps("easy", seed)} />);
    const button = optionButtons(container).find((b) => b.textContent === wrong);
    fireEvent.click(button!);

    expect(button!.className).toContain("lr__option--wrong");
    // Este renderer usa `WrongFeedback`, a diferencia de sus hermanos del lote.
    expect(container.querySelector(".wrong-feedback__btn--retry")).not.toBeNull();
    expect(container.querySelector(".wrong-feedback__btn--next")).not.toBeNull();
  });

  it("fallo: reintentar deja el mismo ejercicio limpio", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    const ex = optionExercise("easy", seed);
    const wrong = ex.options.find((o) => o !== ex.answer);

    const { container } = render(<LeftRightScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButtons(container).find((b) => b.textContent === wrong)!);
    fireEvent.click(container.querySelector(".wrong-feedback__btn--retry")!);

    expect(questionOf(container)).toBe(ex.question);
    expect(container.querySelector(".wrong-feedback")).toBeNull();
    expect(container.querySelector(".lr__option--wrong")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${exercises.length}`,
    );
  });

  it("el motor es determinista: dos llamadas con la misma semilla dan el mismo ejercicio", () => {
    const a = session("expert", 4242)[0];
    const b = session("expert", 4242)[0];
    expect(a).toEqual(b);
  });

  it("el validador del motor acepta solo la respuesta declarada", () => {
    const seed = 4242;
    const ex = optionExercise("easy", seed);

    expect(validateAnswer(ex, ex.answer)).toBe(true);
    ex.options
      .filter((o) => o !== ex.answer)
      .forEach((wrong) => expect(validateAnswer(ex, wrong)).toBe(false));
  });

  it("`expert` empieza en modo personaje, que no monta botones de opción", () => {
    // Los primeros ejercicios de `expert` son `char-click`, resueltos pulsando
    // una de las dos cajas, no eligiendo entre botones de texto.
    const seed = 4242;

    const { container } = render(<LeftRightScreen {...buildProps("expert", seed)} />);

    expect(charBoxes(container).length).toBeGreaterThan(0);
    expect(optionButtons(container)).toHaveLength(0);
  });

  it("modo `char-click`: pulsar la caja correcta valida y avanza solo", () => {
    // Se busca la semilla cuyo primer ejercicio sea `char-click` con respuesta
    // conocida, en lugar de asumirlo.
    const seed = [4242, 7, 99, 123, 555].find((s) => {
      const ex = session("expert", s)[0] as unknown as { kind?: string; answer?: string };
      return ex?.kind === "char-click" && ex.answer === "box-left";
    });
    expect(seed).toBeDefined();

    const { container } = render(<LeftRightScreen {...buildProps("expert", seed!)} />);
    fireEvent.click(charBoxes(container)[0]);

    expect(charBoxes(container)[0].className).toContain("lr__char-box--correct");

    runAutoAdvance();
    // El contador de este renderer separa con espacios: "2 / 10".
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2 / 10");
  });

  it("modo `char-click`: pulsar la caja equivocada marca el fallo", () => {
    const seed = [4242, 7, 99, 123, 555].find((s) => {
      const ex = session("expert", s)[0] as unknown as { kind?: string; answer?: string };
      return ex?.kind === "char-click" && ex.answer === "box-left";
    });
    expect(seed).toBeDefined();

    const { container } = render(<LeftRightScreen {...buildProps("expert", seed!)} />);
    fireEvent.click(charBoxes(container)[1]);

    expect(charBoxes(container)[1].className).toContain("lr__char-box--wrong");
    expect(container.querySelector(".wrong-feedback__btn--retry")).not.toBeNull();
  });

  it("el arrastre de objetos queda fuera del smoke por depender del DOM real", () => {
    // `handleObjDown` lee `getComputedStyle(el).left/.top` y las coordenadas de
    // `clientX`/`clientY`; en happy-dom todo eso vale 0 o NaN, así que el
    // arrastre no se puede reproducir con fiabilidad. Se comprueba únicamente
    // que la zona de arrastre se monta, y el arrastre en sí queda para el pase
    // manual en pizarra, igual que el trazo del `DigitCell`.
    // La zona solo existe en el modo personaje y cuando no es `char-click`.
    // En `expert` los ejercicios van mezclados, así que se busca uno de arrastre
    // en toda la sesión y se avanza hasta él.
    const seed = [4242, 7, 99, 123, 555].find((s) =>
      session("expert", s).some((e) => (e as { kind?: string }).kind === "char-drag-one"),
    );
    expect(seed).toBeDefined();

    const target = session("expert", seed!).findIndex(
      (e) => (e as { kind?: string }).kind === "char-drag-one",
    );
    const { container } = render(<LeftRightScreen {...buildProps("expert", seed!)} />);

    // Se avanzan los ejercicios anteriores acertándolos, para llegar al de
    // arrastre sin depender del arrastre en sí.
    for (let i = 0; i < target; i++) {
      const ex = session("expert", seed!)[i] as unknown as { answer: string };
      const index = ex.answer === "box-right" ? 1 : 0;
      fireEvent.click(charBoxes(container)[index]);
      runAutoAdvance();
    }

    expect(container.querySelector(".lr__drag-area")).not.toBeNull();
    expect(container.querySelectorAll(".lr__drag-obj").length).toBeGreaterThan(0);
  });
});
