import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { TablaNumericaScreen } from "./TablaNumericaScreen";
import { generateSession } from "../../../core/activities/tablaNumerica";
import { deleteKey, numpadKey, smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("tablaNumerica", mockOnExit, difficulty, seed);

const cells = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".tbl__cell"));

describe("TablaNumericaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("pinta la rejilla completa y marca la casilla objetivo", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const ex = session[0];

    const { container } = render(<TablaNumericaScreen {...props("easy", seed)} />);

    expect(cells(container)).toHaveLength(ex.gridState.length);
    const target = container.querySelector(`#tbl-cell-${ex.targetIndex}`);
    expect(target?.className).toContain("tbl__cell--target");
    // Solo una casilla objetivo en toda la rejilla.
    expect(container.querySelectorAll(".tbl__cell--target")).toHaveLength(1);
  });

  it("escribe la respuesta con el Numpad y marca la casilla acertada", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const ex = session[0];

    const { container } = render(<TablaNumericaScreen {...props("easy", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(ex.answer.split("").length).toBeGreaterThan(0);
    ex.answer.split("").forEach((d) => fireEvent.click(numpadKey(container, d)));
    fireEvent.click(numpadKey(container, "✓"));

    expect(container.querySelector(`#tbl-cell-${ex.targetIndex}`)?.className).toContain(
      "tbl__cell--ok",
    );
    expect(container.querySelector(".tbl__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("medium: une símbolos con números y celebra al completar", async () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    const ex = session[0];
    expect(ex.matchLeft!.length).toBeGreaterThanOrEqual(3);

    const { container } = render(<TablaNumericaScreen {...props("medium", seed)} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".tbl__columns")).not.toBeNull();
    expect(container.querySelector(".tbl__stage--split")).not.toBeNull();

    expect(container.querySelectorAll(".tbl__item--sym")).toHaveLength(ex.matchLeft!.length);

    for (const pair of ex.matchLeft!) {
      const left = Array.from(container.querySelectorAll(".tbl__item--sym")).find(
        (el) => el.textContent === pair.symbol && !el.className.includes("connected"),
      );
      const right = Array.from(container.querySelectorAll(".tbl__item--num")).find(
        (el) => el.textContent === String(pair.id) && !el.className.includes("connected"),
      );
      expect(left).toBeTruthy();
      expect(right).toBeTruthy();
      fireEvent.click(left!);
      fireEvent.click(right!);
    }

    expect(container.querySelectorAll(".tbl__item--connected")).toHaveLength(
      ex.matchLeft!.length * 2,
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(container.querySelector(".tbl__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: no celebra y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = String((session[0].targetIndex + 1) % 100);

    const { container } = render(<TablaNumericaScreen {...props("easy", seed)} />);

    wrong.split("").forEach((d) => fireEvent.click(numpadKey(container, d)));
    fireEvent.click(numpadKey(container, "✓"));

    expect(container.querySelector(".tbl__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("el botón de borrar del Numpad quita el último dígito", () => {
    const { container } = render(<TablaNumericaScreen {...props("easy", 4242)} />);

    const box = () => container.querySelector(".ops__answer-box")?.textContent ?? "";
    fireEvent.click(numpadKey(container, "7"));
    fireEvent.click(numpadKey(container, "4"));
    expect(box()).toContain("74");

    fireEvent.click(numpadKey(container, deleteKey));
    expect(box()).not.toContain("74");
  });

  it("al pasar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<TablaNumericaScreen {...props("easy", 4242)} />);

    expect(container.querySelector(".input-toggle")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".input-toggle__switch")!);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("el tipo colorear muestra enunciado a la izquierda y contador a la derecha", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const ex = session[0];
    expect(ex.type).toBe("colorear");
    expect(ex.ruleLabel).toBeTruthy();

    const { container } = render(<TablaNumericaScreen {...props("hard", seed)} />);

    expect(container.querySelector(".tbl__question--color")?.textContent).toBe(ex.question);
    expect(container.querySelector(".tbl__color-count")?.textContent?.trim()).toBe(
      `0 / ${ex.validSet!.length}`,
    );
  });
});
