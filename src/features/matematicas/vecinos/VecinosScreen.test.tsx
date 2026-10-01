import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { VecinosScreen } from "./VecinosScreen";
import { generateVecinosSession } from "../../../core/activities/vecinos";
import type { VecinosExercise } from "../../../core/activities/vecinos";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

/** Ojo: esta familia usa `(seed, difficulty)`, al revés que `numeracion1119`. */
const session = (difficulty: ActivityDifficulty, seed = 4242) =>
  generateVecinosSession(seed, difficulty);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("vecinosNumero", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".vec__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".vec__opt"));

/**
 * En el tipo `ambos` el renderer parte la respuesta combinada `7·8` en dos
 * casillas con un separador, así que el texto del botón no es el de la opción.
 * El resto de tipos sí lo es.
 */
const clickOption = (container: HTMLElement, ex: VecinosExercise, text: string) => {
  const button =
    ex.type === "ambos"
      ? container.querySelectorAll<HTMLButtonElement>(".vec__opt-pair")[0]
      : optionButtons(container).find((b) => b.textContent === text);
  if (!button) throw new Error(`No hay ninguna opción para "${text}"`);
  fireEvent.click(button);
};

const wrongOptionOf = (ex: VecinosExercise) => {
  const wrong = ex.options.find((o) => o !== ex.correctAnswer);
  if (wrong === undefined) throw new Error("El ejercicio no ofrece ninguna opción incorrecta");
  return wrong;
};

const runAutoAdvance = (ms = 1100) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("VecinosScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con el contador 1/N y 4 opciones", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<VecinosScreen {...buildProps("medium", seed)} />);

    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
    expect(optionButtons(container)).toHaveLength(exercises[0].options.length);
    expect(exercises[0].options.length).toBe(4);
  });

  it("es una actividad de opción: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<VecinosScreen {...buildProps("medium")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("el tipo `anterior` deja hueco solo a la izquierda y enseña el posterior", () => {
    // En `easy` el tipo alterna con el PRNG, así que se busca la semilla cuyo
    // primer ejercicio sea de tipo `anterior` en lugar de asumirlo.
    const seed = [4242, 7, 99, 123, 555].find((s) => session("easy", s)[0]?.type === "anterior");
    expect(seed).toBeDefined();

    const { container } = render(<VecinosScreen {...buildProps("easy", seed!)} />);
    const houses = container.querySelectorAll(".vec__house");

    // Con `anterior` solo falta la casa izquierda; la derecha ya se enseña.
    expect(houses[0].className).toContain("vec__house--blank");
    expect(houses[2].className).not.toContain("vec__house--blank");
    expect(houses[2].textContent).toContain(String(session("easy", seed!)[0].posterior));
  });

  it("el tipo `posterior` deja hueco solo a la derecha", () => {
    const seed = [4242, 7, 99, 123, 555].find((s) => session("easy", s)[0]?.type === "posterior");
    expect(seed).toBeDefined();

    const { container } = render(<VecinosScreen {...buildProps("easy", seed!)} />);
    const houses = container.querySelectorAll(".vec__house");

    expect(houses[0].className).not.toContain("vec__house--blank");
    expect(houses[2].className).toContain("vec__house--blank");
  });

  it("el tipo `ambos` deja los dos huecos vacíos", () => {
    const seed = 4242;
    const ex = session("hard", seed)[0];
    expect(ex.type).toBe("ambos");

    const { container } = render(<VecinosScreen {...buildProps("hard", seed)} />);
    const houses = container.querySelectorAll(".vec__house");

    expect(houses[0].className).toContain("vec__house--blank");
    expect(houses[2].className).toContain("vec__house--blank");
    expect(container.querySelector(".vec__options--ambos")).not.toBeNull();
  });

  it("la casa central muestra siempre el número del ejercicio", () => {
    const seed = 4242;

    (["easy", "medium", "hard", "expert"] as ActivityDifficulty[]).forEach((difficulty) => {
      const ex = session(difficulty, seed)[0];
      const { container, unmount } = render(<VecinosScreen {...buildProps(difficulty, seed)} />);

      const center = container.querySelector(".vec__house--center");
      expect(center?.textContent).toContain(String(ex.number));
      unmount();
    });
  });

  it("acierto: marca la opción y avanza solo", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex = exercises[0];

    const { container } = render(<VecinosScreen {...buildProps("medium", seed)} />);
    clickOption(container, ex, ex.correctAnswer);

    expect(container.querySelector(".vec__cheer")?.textContent).toContain("¡Correcto!");
    expect(container.querySelector(".vec__opt--correct")).not.toBeNull();
    expect(container.querySelector(".activity-actions")).toBeNull();

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("fallo: marca la opción pulsada y ofrece reintentar y siguiente", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<VecinosScreen {...buildProps("medium", seed)} />);
    clickOption(container, ex, wrongOptionOf(ex));

    expect(container.querySelector(".vec__cheer")).toBeNull();
    expect(container.querySelector(".vec__opt--wrong")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: reintentar deja el mismo ejercicio limpio", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<VecinosScreen {...buildProps("medium", seed)} />);
    clickOption(container, ex, wrongOptionOf(ex));
    const question = questionOf(container);
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    expect(questionOf(container)).toBe(question);
    expect(container.querySelector(".activity-actions")).toBeNull();
    expect(container.querySelector(".vec__opt--wrong")).toBeNull();
  });

  it("`hard` y `expert` son siempre de tipo `ambos`, con respuesta combinada", () => {
    const seed = 4242;

    (["hard", "expert"] as ActivityDifficulty[]).forEach((difficulty) => {
      session(difficulty, seed).forEach((ex) => {
        expect(ex.type).toBe("ambos");
        // La respuesta del motor es `anterior·posterior`.
        expect(ex.correctAnswer).toBe(`${ex.anterior}·${ex.posterior}`);
        expect(ex.options).toHaveLength(4);
      });
    });
  });

  it("acabar la sesión muestra el resumen con el total de aciertos", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<VecinosScreen {...buildProps("easy", seed)} />);

    exercises.forEach((ex) => {
      clickOption(container, ex, ex.correctAnswer);
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });

  it("pulsar 'Repetir' devuelve los mismos ejercicios (reutiliza la semilla de sesión)", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<VecinosScreen {...buildProps("easy", seed)} />);
    const firstQuestion = questionOf(container);

    exercises.forEach((ex) => {
      clickOption(container, ex, ex.correctAnswer);
      runAutoAdvance();
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(questionOf(container)).toBe(firstQuestion);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });
});
