import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { OperationsScreen } from "./OperationsScreen";
import { generateSession } from "../../../core/activities/operations";
import { smokeProps, typeOnNumpad, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("suma", mockOnExit, difficulty, seed);

const vboxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".ops__vbox"));

describe("OperationsScreen smoke (suma y resta)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la operación vertical con los operandos del motor", () => {
    const seed = 4242;
    const session = generateSession("suma", "easy", seed);
    const ex = session[0];

    const { container } = render(<OperationsScreen {...props("easy", seed)} />);

    expect(ex.op).toBe("suma");
    expect(container.querySelector(".ops__vertical")).not.toBeNull();
    expect(container.querySelectorAll(".ops__vcell").length).toBeGreaterThan(0);
    // Una caja de respuesta por dígito de la respuesta.
    expect(vboxes(container)).toHaveLength(String(ex.answer).length);
  });

  it("teclea la respuesta y confirma al soltar el último dígito", () => {
    const seed = 4242;
    const session = generateSession("suma", "easy", seed);
    const ex = session[0];

    const { container } = render(<OperationsScreen {...props("easy", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    typeOnNumpad(container, ex.answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("resta: monta la misma columna y valida la diferencia", () => {
    const seed = 4242;
    const session = generateSession("resta", "easy", seed);
    const ex = session[0];

    const { container } = render(
      <OperationsScreen {...smokeProps("resta", mockOnExit, "easy", seed)} />,
    );

    expect(ex.a).toBeGreaterThanOrEqual(ex.b);
    typeOnNumpad(container, ex.answer);
    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: no celebra y ofrece reintentar o siguiente", () => {
    const seed = 4242;
    const session = generateSession("suma", "easy", seed);
    const wrong = session[0].answer + 1;

    const { container } = render(<OperationsScreen {...props("easy", seed)} />);

    typeOnNumpad(container, wrong);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<OperationsScreen {...props("easy", 4242)} />);

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("la casilla se marca como activa y la pulsada pasa a ser la activa", () => {
    // Se busca una seed cuya respuesta tenga 2 dígitos, para que haya dos casillas
    // y se pueda comprobar que la activa cambia de una a otra.
    const seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(
      (s) => String(generateSession("suma", "medium", s)[0].answer).length === 2,
    )!;
    expect(seed).toBeDefined();

    const { container } = render(<OperationsScreen {...props("medium", seed)} />);

    const boxes = vboxes(container);
    expect(boxes).toHaveLength(2);
    // Al montar, la casilla de las unidades es la activa.
    expect(boxes[1].className).toContain("ops__vbox--active");

    fireEvent.click(boxes[0]);
    expect(vboxes(container)[0].className).toContain("ops__vbox--active");
    expect(vboxes(container)[1].className).not.toContain("ops__vbox--active");
  });
});
