import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { SumaLlevandoScreen } from "./SumaLlevandoScreen";
import { generateSession } from "../../../core/activities/sumaLlevando";
import { smokeProps, typeOnNumpad, carryOf, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("sumaLlevando", mockOnExit, difficulty, seed);

const boxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".sumall__box"));

/**
 * Las casillas se localizan por su título y no por su posición en el DOM: la de
 * "Llevar" se pinta antes que la fila del resultado, así que el orden del DOM
 * es llevar, decenas, unidades, mientras que el orden de los pasos del
 * algoritmo es unidades, llevar, decenas.
 */
const boxByTitle = (c: HTMLElement, title: string) => {
  const box = boxes(c).find((b) => b.getAttribute("title") === title);
  if (!box) throw new Error(`No hay ninguna casilla titulada "${title}"`);
  return box;
};

/**
 * Recorre los tres pasos del algoritmo manual: unidades → llevar → decenas
 * (autoavance del numpad).
 */
function answerByHand(container: HTMLElement, ex: { answer: number; addends: number[] }) {
  typeOnNumpad(container, ex.answer % 10);
  typeOnNumpad(container, carryOf(ex.addends));
  typeOnNumpad(container, Math.floor(ex.answer / 10));
}

describe("SumaLlevandoScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("muestra las casillas empezando por unidades y el numpad visible", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];

    const { container } = render(<SumaLlevandoScreen {...props("easy", seed)} />);

    expect(boxes(container)).toHaveLength(3);
    const titles = boxes(container)
      .map((b) => b.getAttribute("title"))
      .sort();
    expect(titles).toEqual(["Decenas", "Llevar", "Unidades"]);

    expect(boxByTitle(container, "Unidades").className).toContain("sumall__box--active");
    expect(
      boxes(container).filter((b) => b.className.includes("sumall__box--active")),
    ).toHaveLength(1);
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(ex.addends.reduce((a, b) => a + b, 0)).toBe(ex.answer);
  });

  it("autoavanza unidades → llevar → decenas y valida al terminar", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];

    const { container } = render(<SumaLlevandoScreen {...props("easy", seed)} />);

    typeOnNumpad(container, ex.answer % 10);
    expect(boxByTitle(container, "Llevar").className).toContain("sumall__box--active");
    expect(container.querySelector(".shared-numpad")).not.toBeNull();

    typeOnNumpad(container, carryOf(ex.addends));
    expect(boxByTitle(container, "Decenas").className).toContain("sumall__box--active");

    typeOnNumpad(container, Math.floor(ex.answer / 10));
    expect(container.querySelector(".sumall__celebration")?.textContent).toContain("¡Correcto!");
    expect(container.querySelector(".shared-numpad")).toBeNull();
  });

  it("hard usa tres sumandos y la misma secuencia de tres pasos", () => {
    const seed = 4242;
    const ex = generateSession("hard", seed)[0];
    expect(ex.type).toBe("3-addends");
    expect(ex.addends).toHaveLength(3);

    const { container } = render(<SumaLlevandoScreen {...props("hard", seed)} />);

    answerByHand(container, ex);
    expect(container.querySelector(".sumall__celebration")?.textContent).toContain("¡Correcto!");
  });

  it("fallo: no celebra, oculta el numpad y ofrece reintentar o siguiente", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];

    const { container } = render(<SumaLlevandoScreen {...props("easy", seed)} />);

    typeOnNumpad(container, ex.answer % 10);
    typeOnNumpad(container, 9);
    typeOnNumpad(container, Math.floor(ex.answer / 10));

    expect(container.querySelector(".sumall__celebration")).toBeNull();
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("la casilla pulsada pasa a ser el paso activo sin ocultar el numpad", () => {
    const { container } = render(<SumaLlevandoScreen {...props("easy", 4242)} />);

    fireEvent.click(boxByTitle(container, "Decenas"));

    expect(boxByTitle(container, "Decenas").className).toContain("sumall__box--active");
    expect(boxByTitle(container, "Unidades").className).not.toContain("sumall__box--active");
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
  });

  it("al cambiar a modo escritura el DigitCell queda montado (panel no desaparece)", () => {
    const { container } = render(<SumaLlevandoScreen {...props("easy", 4242)} />);

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(boxByTitle(container, "Unidades").className).toContain("sumall__box--active");
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("pulsar 'Repetir' devuelve el mismo primer ejercicio (reutiliza la semilla)", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<SumaLlevandoScreen {...props("easy", seed)} />);

    const firstStage = container.querySelector(".sumall__stage")?.textContent ?? "";

    session.forEach((ex) => {
      answerByHand(container, ex);
      act(() => {
        vi.advanceTimersByTime(1200);
      });
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(container.querySelector(".sumall__stage")?.textContent).toBe(firstStage);
  });
});
