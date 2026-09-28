import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ComparisonScreen } from "./ComparisonScreen";
import { createComparisonExercise, isCorrectComparison } from "../../../core/activities/comparison";
import type { ComparisonChoice, ComparisonExercise } from "../../../core/activities/comparison";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const TOTAL_EXERCISES = 10;
const AUTO_ADVANCE_MS = 900;

/** Ojo: esta familia usa `(seed, difficulty)`, al revés que `numeracion1119`. */
const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("comparison", mockOnExit, difficulty, seed);

/**
 * El enunciado lo compone el renderer a partir de `question` y `answer`, así que
 * el test lo deriva de los mismos datos del motor en vez de leerlo del DOM.
 */
const expectedPrompt = (ex: ComparisonExercise) =>
  ex.answer === "equal"
    ? "¿Tienen los mismos objetos?"
    : `¿Qué grupo tiene ${ex.question === "more" ? "MÁS" : "MENOS"} objetos?`;

const answerButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".cmp__answer-btn"));

/** Etiqueta de cada botón, para no depender del orden en que se renderizan. */
const CHOICE_LABELS: Record<ComparisonChoice, string> = {
  left: "← Izquierda",
  equal: "Iguales",
  right: "Derecha →",
};

const clickChoice = (container: HTMLElement, choice: ComparisonChoice) => {
  const button = answerButtons(container).find(
    (b) => b.textContent?.trim() === CHOICE_LABELS[choice],
  );
  if (!button) throw new Error(`No hay ningún botón para la opción "${choice}"`);
  fireEvent.click(button);
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("ComparisonScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta el enunciado y el contador del primer ejercicio", () => {
    const seed = 4242;
    const ex = createComparisonExercise(seed, "hard");

    const { container } = render(<ComparisonScreen {...buildProps("hard", seed)} />);

    expect(container.querySelector(".cmp__prompt")?.textContent).toBe(expectedPrompt(ex));
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${TOTAL_EXERCISES}`,
    );
  });

  it("dibuja tantos objetos como indica el motor en cada lado", () => {
    const seed = 4242;
    const ex = createComparisonExercise(seed, "hard");

    const { container } = render(<ComparisonScreen {...buildProps("hard", seed)} />);

    const boxes = container.querySelectorAll(".cmp__objects");
    expect(boxes[0].querySelectorAll("img")).toHaveLength(ex.leftCount);
    expect(boxes[1].querySelectorAll("img")).toHaveLength(ex.rightCount);
  });

  it("es una actividad de opción: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<ComparisonScreen {...buildProps("hard")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("`easy` y `medium` ofrecen 2 opciones y `hard` y `expert` ofrecen 3", () => {
    const seed = 4242;
    const expectedButtons: Record<ActivityDifficulty, number> = {
      easy: 2,
      medium: 2,
      hard: 3,
      expert: 3,
    };

    (Object.keys(expectedButtons) as ActivityDifficulty[]).forEach((difficulty) => {
      const ex = createComparisonExercise(seed, difficulty);
      expect(ex.allowEqual).toBe(difficulty === "hard" || difficulty === "expert");

      const { container, unmount } = render(<ComparisonScreen {...buildProps(difficulty, seed)} />);
      expect(answerButtons(container)).toHaveLength(expectedButtons[difficulty]);
      unmount();
    });
  });

  it("acierto: resalta la caja correcta y avanza solo al siguiente ejercicio", () => {
    // Se busca una semilla cuyo primer ejercicio no sea "equal", porque con
    // `allowEqual` la respuesta "igual" no tiene caja que resaltar.
    const seed = [4242, 7, 99, 123, 555].find(
      (s) => createComparisonExercise(s, "hard").answer !== "equal",
    );
    expect(seed).toBeDefined();
    const ex = createComparisonExercise(seed!, "hard");

    const { container } = render(<ComparisonScreen {...buildProps("hard", seed!)} />);
    clickChoice(container, ex.answer);

    expect(container.querySelector(".cmp__box--correct")).not.toBeNull();
    expect(container.querySelector(".activity-actions")).toBeNull();

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2 / ${TOTAL_EXERCISES}`,
    );
  });

  it("acierto: la respuesta `equal` se celebra sin resaltar ninguna caja", () => {
    const seed = [4242, 7, 99, 123, 555].find(
      (s) => createComparisonExercise(s, "hard").answer === "equal",
    );
    expect(seed).toBeDefined();
    const ex = createComparisonExercise(seed!, "hard");

    const { container } = render(<ComparisonScreen {...buildProps("hard", seed!)} />);
    expect(container.querySelector(".cmp__prompt")?.textContent).toBe(expectedPrompt(ex));
    clickChoice(container, "equal");

    // Con "igual" no hay caja correcta que resaltar, pero tampoco error.
    expect(container.querySelector(".cmp__box--correct")).toBeNull();
    expect(container.querySelector(".cmp__box--wrong")).toBeNull();
    expect(container.querySelector(".activity-actions")).toBeNull();

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2 / ${TOTAL_EXERCISES}`,
    );
  });

  it("acierto: la selección marca la caja pulsada antes de evaluarse", () => {
    const seed = 4242;
    const ex = createComparisonExercise(seed, "medium");
    // El enunciado de `medium` no es "equal", así que hay caja marcada.
    expect(ex.answer).not.toBe("equal");

    const { container } = render(<ComparisonScreen {...buildProps("medium", seed)} />);
    clickChoice(container, ex.answer);

    // `cmp__box--picked` desaparece al evaluarse y queda `--correct`.
    expect(container.querySelector(".cmp__box--picked")).toBeNull();
    expect(container.querySelector(".cmp__box--correct")).not.toBeNull();
  });

  it("fallo: resalta la caja equivocada y ofrece reintentar y siguiente", () => {
    const seed = 4242;
    const ex = createComparisonExercise(seed, "medium");
    const wrong: ComparisonChoice = ex.answer === "left" ? "right" : "left";

    const { container } = render(<ComparisonScreen {...buildProps("medium", seed)} />);
    clickChoice(container, wrong);

    expect(container.querySelector(".cmp__box--wrong")).not.toBeNull();
    expect(container.querySelector(".cmp__box--correct")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: reintentar deja el mismo ejercicio y no avanza", () => {
    const seed = 4242;
    const ex = createComparisonExercise(seed, "medium");
    const wrong: ComparisonChoice = ex.answer === "left" ? "right" : "left";

    const { container } = render(<ComparisonScreen {...buildProps("medium", seed)} />);
    clickChoice(container, wrong);
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${TOTAL_EXERCISES}`,
    );
    expect(container.querySelector(".cmp__box--wrong")).toBeNull();
    expect(container.querySelector(".activity-actions")).toBeNull();
  });

  it("tras reintentar, acertar el mismo ejercicio tampoco lo suma", () => {
    // `handleRetry` marca `isFirstAttempt = false`, así que el acierto posterior
    // avanza pero no computa en el resumen.
    const seed = 4242;
    const ex = createComparisonExercise(seed, "medium");
    const wrong: ComparisonChoice = ex.answer === "left" ? "right" : "left";

    const { container } = render(<ComparisonScreen {...buildProps("medium", seed)} />);
    clickChoice(container, wrong);
    fireEvent.click(container.querySelector(".activity-action--retry")!);
    clickChoice(container, ex.answer);
    runAutoAdvance();

    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2 / ${TOTAL_EXERCISES}`,
    );
  });

  it("acabar los 10 ejercicios muestra el resumen", () => {
    const seed = 4242;

    const { container } = render(<ComparisonScreen {...buildProps("medium", seed)} />);

    for (let i = 0; i < TOTAL_EXERCISES; i++) {
      // El renderer incrementa la semilla en cada avance, así que el ejercicio
      // se recalcula con `seed + i`.
      const ex = createComparisonExercise(seed + i, "medium");
      clickChoice(container, ex.answer);
      runAutoAdvance();
    }

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(TOTAL_EXERCISES));
  });

  it("el validador del motor coincide con la respuesta que el renderer espera", () => {
    // Guarda de que no se desincronicen el motor y la pantalla.
    const seed = 4242;
    const ex = createComparisonExercise(seed, "hard");

    (["left", "right", "equal"] as ComparisonChoice[]).forEach((choice) => {
      expect(isCorrectComparison(ex, choice)).toBe(choice === ex.answer);
    });
  });
});
