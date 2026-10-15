import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { CapacidadScreen } from "./CapacidadScreen";
import { generateSession } from "../../../core/activities/capacidad";
import type { CapacidadExercise } from "../../../core/activities/capacidad";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return smokeProps("capacidad", mockOnExit, difficulty, seed);
}

const questionOf = (container: HTMLElement) =>
  container.querySelector(".cap__question")?.textContent ?? "";

const numpadKeys = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key")).map(
    (k) => k.getAttribute("aria-label") ?? k.textContent,
  );

const digitKey = (container: HTMLElement, digit: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key")).find(
    (k) => k.textContent === digit,
  )!;

describe("CapacidadScreen smoke", () => {
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
    const session = generateSession("easy", seed);

    const { container } = render(<CapacidadScreen {...buildProps("easy", seed)} />);

    expect(questionOf(container)).toBe(session[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session.length}`,
    );
  });

  it("un tipo compare se resuelve con botones y sin Numpad", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const compare = session.find((ex) => ex.type === "compare")!;
    expect(compare).toBeDefined();

    const { container } = render(<CapacidadScreen {...buildProps("easy", seed)} />);

    // `easy` empieza en compare, así que no hay teclado ni canvas.
    expect(session[0].type).toBe("compare");
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("un tipo numérico monta el Numpad con el teclado completo", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    expect(session[0].type).toBe("read");

    const { container } = render(<CapacidadScreen {...buildProps("medium", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(numpadKeys(container)).toEqual([
      "7",
      "8",
      "9",
      "4",
      "5",
      "6",
      "1",
      "2",
      "3",
      "Borrar",
      "0",
      "Confirmar",
    ]);
    expect(container.querySelector(".input-toggle")).not.toBeNull();
  });

  it("escribir con el Numpad y confirmar marca la respuesta correcta", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    const ex: CapacidadExercise = session[0];
    const digits = String(ex.answer).split("");

    const { container } = render(<CapacidadScreen {...buildProps("medium", seed)} />);

    digits.forEach((d) => fireEvent.click(digitKey(container, d)));
    fireEvent.click(digitKey(container, "✓"));

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
    expect(container.querySelector(".ops__answer-box--correct")).not.toBeNull();
  });

  it("al cambiar a modo escritura se monta el DigitCell y no el Numpad", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    expect(session[0].type).toBe("read");

    const { container } = render(<CapacidadScreen {...buildProps("medium", seed)} />);

    // El toggle es el único control del header en los tipos numéricos.
    const toggle = container.querySelector<HTMLButtonElement>(".input-toggle__switch");
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle!);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    // El DigitCell va con React.lazy, así que llega en suspense; el fallback
    // demuestra que se pidió, que es justo lo que queríamos comprobar.
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });
});
