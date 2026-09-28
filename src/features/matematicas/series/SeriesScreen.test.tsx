import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { SeriesScreen } from "./SeriesScreen";
import { generateSeriesSession } from "../../../core/activities/series";
import type { SeriesExercise } from "../../../core/activities/series";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

/** Ojo: esta familia usa `(seed, difficulty)`, al revés que `numeracion1119`. */
const session = (difficulty: ActivityDifficulty, seed = 4242) =>
  generateSeriesSession(seed, difficulty);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("seriesNumericas", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".ser__question")?.textContent ?? "";

/**
 * El enunciado no viene del motor: lo compone el renderer a partir del `step`
 * del ejercicio (`¿Qué número falta? (de 5 en 5)`), así que el test lo compone
 * igual a partir de los mismos datos en lugar de leerlo del estado del
 * componente.
 */
const expectedQuestion = (ex: SeriesExercise) => `¿Qué número falta? (de ${ex.step} en ${ex.step})`;

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".ser__opt"));

const clickOption = (container: HTMLElement, ex: SeriesExercise, text: string) => {
  const button = optionButtons(container).find((b) => b.textContent === text);
  if (!button) throw new Error(`No hay ninguna opción con el texto "${text}"`);
  fireEvent.click(button);
};

const wrongOptionOf = (ex: SeriesExercise) => {
  const wrong = ex.options.find((o) => o !== ex.correctAnswer);
  if (wrong === undefined) throw new Error("El ejercicio no ofrece ninguna opción incorrecta");
  return wrong;
};

const runAutoAdvance = (ms = 1100) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("SeriesScreen smoke", () => {
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
    const exercises = session("medium", seed);

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);

    expect(questionOf(container)).toBe(expectedQuestion(exercises[0]));
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("es una actividad de opción: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<SeriesScreen {...buildProps("medium")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("dibuja la serie con un hueco y 4 opciones", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);

    expect(container.querySelectorAll(".ser__box")).toHaveLength(ex.sequence.length);
    expect(container.querySelectorAll(".ser__box--blank")).toHaveLength(1);
    expect(optionButtons(container)).toHaveLength(ex.options.length);
    expect(ex.options.length).toBe(4);
  });

  it("el hueco de la serie ocupa la posición que dice el motor", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);

    // El motor marca el hueco con -1; el hueco renderizado debe caer en ese índice.
    expect(ex.sequence[ex.blankIndex]).toBe(-1);
    const boxes = container.querySelectorAll(".ser__box");
    expect(boxes[ex.blankIndex].className).toContain("ser__box--blank");
  });

  it("acierto: marca la opción y avanza solo al siguiente ejercicio", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);
    clickOption(container, exercises[0], exercises[0].correctAnswer);

    expect(container.querySelector(".ser__cheer")?.textContent).toContain("¡Correcto!");
    expect(
      optionButtons(container).find((b) => b.textContent === exercises[0].correctAnswer)!.className,
    ).toContain("ser__opt--correct");
    expect(container.querySelector(".activity-actions")).toBeNull();

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("fallo: marca la opción pulsada y ofrece reintentar y siguiente", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];
    const wrong = wrongOptionOf(ex);

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);
    clickOption(container, ex, wrong);

    expect(container.querySelector(".ser__cheer")).toBeNull();
    expect(optionButtons(container).find((b) => b.textContent === wrong)!.className).toContain(
      "ser__opt--wrong",
    );
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: reintentar deja el mismo ejercicio limpio", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);
    clickOption(container, ex, wrongOptionOf(ex));
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    expect(questionOf(container)).toBe(expectedQuestion(ex));
    expect(container.querySelector(".activity-actions")).toBeNull();
    expect(container.querySelector(".ser__opt--wrong")).toBeNull();
  });

  it("las cuatro dificultades generan series válidas con 4 opciones", () => {
    const seed = 4242;
    const expectedStepPool: Record<ActivityDifficulty, number[]> = {
      easy: [1],
      medium: [1, 2, 5],
      hard: [1, 2, 5, 10],
      expert: [2, 5, 10],
    };

    (Object.keys(expectedStepPool) as ActivityDifficulty[]).forEach((difficulty) => {
      session(difficulty, seed).forEach((ex) => {
        expect(expectedStepPool[difficulty]).toContain(ex.step);
        expect(ex.sequence).toHaveLength(5);
        expect(ex.options).toHaveLength(4);
        expect(ex.options).toContain(ex.correctAnswer);
        // `easy` y `medium` solo ascendentes; `hard` y `expert` pueden bajar.
        if (difficulty === "easy" || difficulty === "medium") {
          expect(ex.ascending).toBe(true);
        }
      });
    });
  });

  it("acabar la sesión muestra el resumen con el total de aciertos", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<SeriesScreen {...buildProps("medium", seed)} />);

    exercises.forEach((ex) => {
      clickOption(container, ex, ex.correctAnswer);
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
