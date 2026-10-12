import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TablaNumericaScreen } from "./TablaNumericaScreen";
import { generateSession } from "../../../core/activities/tablaNumerica";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("tablaNumerica", mockOnExit, difficulty, seed);

const cells = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".tbl__cell"));
const numpadKey = (c: HTMLElement, key: string) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".shared-numpad__key")).find(
    (k) => k.textContent === key,
  )!;

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
    const target = cells(container)[ex.targetIndex];
    expect(target.className).toContain("tbl__cell--target");
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

    expect(cells(container)[ex.targetIndex].className).toContain("tbl__cell--ok");
    expect(container.querySelector(".tbl__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("medium: al pulsar las casillas de los símbolos pedidos celebra", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    const ex = session[0];
    expect(ex.validSet!.length).toBeGreaterThanOrEqual(2);

    const { container } = render(<TablaNumericaScreen {...props("medium", seed)} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.textContent).toContain(`0 / ${ex.validSet!.length}`);

    ex.validSet!.forEach((pos) => {
      fireEvent.click(container.querySelector(`#tbl-cell-${pos}`)!);
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

    fireEvent.click(numpadKey(container, "←"));
    expect(box()).not.toContain("74");
  });

  it("al pasar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<TablaNumericaScreen {...props("easy", 4242)} />);

    expect(container.querySelector(".input-toggle")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".input-toggle__switch")!);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("el tipo colorear muestra la regla y el contador de casillas", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const ex = session[0];
    expect(ex.type).toBe("colorear");
    expect(ex.ruleLabel).toBeTruthy();

    const { container } = render(<TablaNumericaScreen {...props("hard", seed)} />);

    expect(container.querySelector(".tbl__color-rule-text")?.textContent).toBe(ex.ruleLabel);
    expect(container.textContent).toContain(`0 / ${ex.validSet!.length}`);
  });
});
