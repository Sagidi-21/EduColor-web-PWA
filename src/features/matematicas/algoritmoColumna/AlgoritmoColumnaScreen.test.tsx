import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { AlgoritmoColumnaScreen } from "./AlgoritmoColumnaScreen";
import { generateSession as generateAddition } from "../../../core/activities/algoritmoVertical";
import { generateSession as generateSubtraction } from "../../../core/activities/restaColumna";
import { smokeProps, typeUnitsFirst, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (
  activity: "algoritmoVertical" | "restaColumna",
  difficulty: EngineScreenProps["difficulty"],
  seed: number,
) => smokeProps(activity, mockOnExit, difficulty, seed);

const boxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".algcol__box"));

describe("AlgoritmoColumnaScreen smoke (algoritmoVertical y restaColumna)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("muestra la rejilla D/U con las dos casillas de respuesta", () => {
    const seed = 4242;
    const session = generateAddition("easy", seed);
    const ex = session[0];

    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", seed)} />,
    );

    expect(container.querySelector(".algcol__grid")).not.toBeNull();
    // Cabecera de columnas: el resultado se teclea en decenas y unidades.
    const labels = Array.from(container.querySelectorAll(".algcol__col-label")).map(
      (l) => l.textContent,
    );
    expect(labels).toEqual(["D", "U"]);
    expect(boxes(container)).toHaveLength(2);
    expect(ex.answer).toBe(ex.a + ex.b);
  });

  it("empieza con la casilla de las unidades activa", () => {
    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", 4242)} />,
    );

    expect(boxes(container)[1].className).toContain("algcol__box--active");
    expect(boxes(container)[0].className).not.toContain("algcol__box--active");
  });

  it("teclea de derecha a izquierda y valida la suma", () => {
    const seed = 4242;
    const ex = generateAddition("easy", seed)[0];

    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", seed)} />,
    );

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    typeUnitsFirst(container, ex.answer);

    expect(container.querySelector(".algcol__celebration")?.textContent).toContain("¡Muy bien!");
    expect(boxes(container).every((b) => b.className.includes("algcol__box--correct"))).toBe(true);
  });

  it("resta: reutiliza el mismo renderer y valida la diferencia", () => {
    const seed = 4242;
    const ex = generateSubtraction("easy", seed)[0];

    const { container } = render(
      <AlgoritmoColumnaScreen {...props("restaColumna", "easy", seed)} />,
    );

    expect(ex.answer).toBe(ex.a - ex.b);
    typeUnitsFirst(container, ex.answer);
    expect(container.querySelector(".algcol__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: no celebra y ofrece reintentar o siguiente", () => {
    const seed = 4242;
    const ex = generateAddition("easy", seed)[0];
    const wrong = ex.answer === 99 ? 98 : ex.answer + 1;

    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", seed)} />,
    );

    typeUnitsFirst(container, wrong);

    expect(container.querySelector(".algcol__celebration")).toBeNull();
    expect(boxes(container).every((b) => b.className.includes("algcol__box--wrong"))).toBe(true);
    expect(
      container.querySelector(".activity-action--retry, .wrong-feedback__btn--retry"),
    ).not.toBeNull();
  });

  it("la casilla pulsada pasa a ser la activa", () => {
    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", 4242)} />,
    );

    fireEvent.click(boxes(container)[0]);

    expect(boxes(container)[0].className).toContain("algcol__box--active");
    expect(boxes(container)[1].className).not.toContain("algcol__box--active");
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(
      <AlgoritmoColumnaScreen {...props("algoritmoVertical", "easy", 4242)} />,
    );

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });
});
