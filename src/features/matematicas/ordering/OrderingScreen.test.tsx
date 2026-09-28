import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { OrderingScreen } from "./OrderingScreen";
import { createOrderingSession, isCorrectOrderingValue } from "../../../core/activities/ordering";
import type { OrderingExercise } from "../../../core/activities/ordering";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const WRONG_FLASH_MS = 700;
const AUTO_ADVANCE_MS = 900;

/** Ojo: esta familia usa `(seed, difficulty)`, al revés que `numeracion1119`. */
const session = (difficulty: ActivityDifficulty, seed = 4242) =>
  createOrderingSession(seed, difficulty);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("ordenar", mockOnExit, difficulty, seed);

const instructionOf = (container: HTMLElement) =>
  container.querySelector(".ord__instruction")?.textContent ?? "";

/** El enunciado lo compone el renderer a partir de `direction`. */
const expectedInstruction = (ex: OrderingExercise) =>
  `Ordena de ${ex.direction === "ascending" ? "menor a mayor" : "mayor a menor"} →`;

const cardButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".ord__card"));

const slots = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ord__slot"));

const clickCard = (container: HTMLElement, value: number) => {
  const button = cardButtons(container).find((b) => b.textContent?.trim() === String(value));
  if (!button) throw new Error(`No hay ninguna tarjeta con el número ${value}`);
  fireEvent.click(button);
};

/** Coloca todas las cartas en el orden correcto según el motor. */
const solve = (container: HTMLElement, ex: OrderingExercise) => {
  ex.sortedNumbers.forEach((value) => clickCard(container, value));
};

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("OrderingScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta el enunciado, las tarjetas y el contador 1/N", () => {
    const seed = 4242;
    const ex = session("easy", seed)[0];

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);

    expect(instructionOf(container)).toBe(expectedInstruction(ex));
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session("easy", seed).length}`,
    );
    expect(cardButtons(container)).toHaveLength(ex.numbers.length);
    expect(slots(container)).toHaveLength(ex.sortedNumbers.length);
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<OrderingScreen {...buildProps("easy")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("`easy` ordena siempre de menor a mayor y `medium` puede ir al revés", () => {
    const seed = 4242;
    session("easy", seed).forEach((ex) => expect(ex.direction).toBe("ascending"));

    const directions = new Set(
      [7, 99, 123, 555, 4242].flatMap((s) => session("medium", s).map((ex) => ex.direction)),
    );
    expect(directions).toContain("ascending");
  });

  it("acierto: cada carta colocada ocupa su hueco y se marca como correcta", () => {
    const seed = 4242;
    const ex = session("easy", seed)[0];

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);
    const first = ex.sortedNumbers[0];
    clickCard(container, first);

    const placed = slots(container);
    expect(placed[0].textContent).toBe(String(first));
    expect(placed[0].className).toContain("ord__slot--correct");
    // La tarjeta usada desaparece del grupo disponible.
    expect(cardButtons(container)).toHaveLength(ex.numbers.length - 1);
  });

  it("acierto: al colocar todas las cartas celebra y avanza solo", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    const ex = exercises[0];

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);
    solve(container, ex);

    expect(container.querySelector(".ord__celebrate")?.textContent).toContain("¡Muy bien!");
    expect(slots(container).every((s) => s.className.includes("ord__slot--correct"))).toBe(true);

    runTimers(AUTO_ADVANCE_MS);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
    // El ejercicio nuevo arranca con los huecos vacíos.
    expect(slots(container).every((s) => !s.className.includes("ord__slot--correct"))).toBe(true);
  });

  it("fallo: la carta equivocada se muestra en el hueco y se borra sola a los 700 ms", () => {
    const seed = 4242;
    const ex = session("easy", seed)[0];
    const wrong = ex.numbers.find((n) => n !== ex.sortedNumbers[0]);
    expect(wrong).toBeDefined();

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);
    clickCard(container, wrong!);

    // No hay botones de reintento ni de siguiente: el fallo se agota solo.
    expect(container.querySelector(".activity-actions")).toBeNull();
    expect(container.querySelector(".wrong-feedback")).toBeNull();
    const failed = slots(container)[0];
    expect(failed.className).toContain("ord__slot--wrong");
    expect(failed.textContent).toBe(String(wrong));

    runTimers(WRONG_FLASH_MS);
    const cleared = slots(container)[0];
    expect(cleared.className).not.toContain("ord__slot--wrong");
    expect(cleared.textContent).toBe("");
  });

  it("mientras parpadea el fallo, el resto de tarjetas no responden", () => {
    const seed = 4242;
    const ex = session("easy", seed)[0];
    const wrong = ex.numbers.find((n) => n !== ex.sortedNumbers[0]);

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);
    clickCard(container, wrong!);
    // La tarjeta buena sigue visible, pero el click se ignora hasta que pare.
    clickCard(container, ex.sortedNumbers[0]);

    expect(slots(container)[0].className).toContain("ord__slot--wrong");
    expect(container.querySelector(".ord__celebrate")).toBeNull();
  });

  it("el validador del motor coincide con el orden que el renderer espera", () => {
    const seed = 4242;
    const ex = session("hard", seed)[0];

    ex.sortedNumbers.forEach((value, position) => {
      expect(isCorrectOrderingValue(ex, position, value)).toBe(true);
    });
    // Ningún valor ajeno vale para ninguna posición.
    const fueraDeRango = ex.sortedNumbers[0] - 1;
    ex.sortedNumbers.forEach((_, position) => {
      expect(isCorrectOrderingValue(ex, position, fueraDeRango)).toBe(
        fueraDeRango === ex.sortedNumbers[position],
      );
    });
  });

  it("acabar la sesión muestra el resumen con todos los ejercicios correctos", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<OrderingScreen {...buildProps("easy", seed)} />);

    exercises.forEach((ex) => {
      solve(container, ex);
      runTimers(AUTO_ADVANCE_MS);
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
