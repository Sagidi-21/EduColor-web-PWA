import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ParImparScreen } from "./ParImparScreen";
import { generateSession, requiresWriting } from "../../../core/activities/parImpar";
import type { ParImparExercise } from "../../../core/activities/parImpar";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return smokeProps("parImpar", mockOnExit, difficulty, seed);
}

const questionOf = (container: HTMLElement) =>
  container.querySelector(".pi__question")?.textContent ?? "";

const optionLabels = (ex: ParImparExercise) => (ex.options ?? []).map((o) => o.label);

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("button.pi__option"));

const clickOptionWithLabel = (container: HTMLElement, label: string) => {
  const target = optionButtons(container).find((b) => (b.textContent ?? "").trim() === label);
  if (!target) throw new Error(`No hay opción con la etiqueta "${label}"`);
  fireEvent.click(target);
};

/** La opción cuyo `value` es el indicado, buscando por la respuesta del motor. */
const clickOptionWithValue = (container: HTMLElement, ex: ParImparExercise, value: string) => {
  const option = (ex.options ?? []).find((o) => o.value === value);
  if (!option) throw new Error(`El ejercicio no declara la opción "${value}"`);
  clickOptionWithLabel(container, option.label);
};

describe("ParImparScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la pregunta del primer ejercicio y el contador 1/N", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ParImparScreen {...buildProps("easy", seed)} />);

    expect(questionOf(container)).toBe(session[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/10");
  });

  it("pinta exactamente los objetos que dice el motor y las opciones con sus etiquetas", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ParImparScreen {...buildProps("easy", seed)} />);

    const objects = container.querySelectorAll(".pi__object");
    expect(objects.length).toBe(session[0].visualItems?.count);
    objects.forEach((o) => expect(o.textContent).toBe(session[0].visualItems?.emoji));

    expect(optionButtons(container).map((b) => (b.textContent ?? "").trim())).toEqual(
      optionLabels(session[0]),
    );
  });

  it("acierto: marca la opción correcta y muestra la celebración", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<ParImparScreen {...buildProps("hard", seed)} />);

    clickOptionWithValue(container, session[0], session[0].answer);

    expect(container.querySelector("button.pi__option--correct")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la opción pulsada y ofrece reintentar o siguiente", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrong = (session[0].options ?? []).find((o) => o.value !== session[0].answer)!;

    const { container } = render(<ParImparScreen {...buildProps("hard", seed)} />);

    clickOptionWithLabel(container, wrong.label);

    expect(container.querySelector("button.pi__option--wrong")).not.toBeNull();
    expect(container.querySelector(".wrong-feedback__btn--retry")).not.toBeNull();
    expect(container.querySelector(".wrong-feedback__btn--next")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")).toBeNull();
  });

  it("reintentar limpia el estado de la respuesta", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrong = (session[0].options ?? []).find((o) => o.value !== session[0].answer)!;

    const { container } = render(<ParImparScreen {...buildProps("hard", seed)} />);

    clickOptionWithLabel(container, wrong.label);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".wrong-feedback__btn--retry")!);

    expect(container.querySelector("button.pi__option--wrong")).toBeNull();
    expect(container.querySelector(".wrong-feedback")).toBeNull();
  });

  it("un ejercicio de escritura monta Numpad y no monta el DigitCell", () => {
    const seed = 4242;
    const session = generateSession("expert", seed);
    const writeIndex = session.findIndex(requiresWriting);

    const { container } = render(<ParImparScreen {...buildProps("expert", seed)} />);

    // El primer ejercicio de expert es de teoría: ni Numpad ni DigitCell.
    expect(requiresWriting(session[0])).toBe(false);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(optionButtons(container).length).toBeGreaterThan(0);

    // Se llega al de escritura contestando los de teoría previos.
    for (let i = 0; i < writeIndex; i++) {
      clickOptionWithLabel(container, optionLabels(session[i])[0]);
      fireEvent.click(container.querySelector<HTMLButtonElement>(".wrong-feedback__btn--next")!);
    }

    expect(requiresWriting(session[writeIndex])).toBe(true);
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(optionButtons(container).length).toBe(0);
    expect(questionOf(container)).toBe(session[writeIndex].question);
  });
});
