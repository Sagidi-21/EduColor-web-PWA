import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TresSumandosScreen } from "./TresSumandosScreen";
import { generateSession } from "../../../core/activities/tresSumandos";
import { smokeProps, typeOnNumpad, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("tresSumandos", mockOnExit, difficulty, seed);

const vboxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".ops__vbox"));

describe("TresSumandosScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la columna con los tres sumandos del motor", () => {
    const seed = 4242;
    const ex = generateSession("easy", undefined, seed)[0];

    const { container } = render(<TresSumandosScreen {...props("easy", seed)} />);

    expect(ex.answer).toBe(ex.a + ex.b + ex.c);
    expect(container.querySelector(".ops__vertical")).not.toBeNull();
    expect(container.querySelectorAll(".ops__vcell").length).toBeGreaterThan(0);
    // Una caja por dígito de la respuesta, como en OperationsScreen.
    expect(vboxes(container)).toHaveLength(String(ex.answer).length);
  });

  it("teclea la respuesta y confirma al soltar el último dígito", () => {
    const seed = 4242;
    const ex = generateSession("easy", undefined, seed)[0];

    const { container } = render(<TresSumandosScreen {...props("easy", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    typeOnNumpad(container, ex.answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: no celebra y ofrece reintentar o siguiente", () => {
    const seed = 4242;
    const ex = generateSession("easy", undefined, seed)[0];
    const wrong = ex.answer + 1;

    const { container } = render(<TresSumandosScreen {...props("easy", seed)} />);

    typeOnNumpad(container, wrong);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(
      container.querySelector(".activity-action--retry, .wrong-feedback__btn--retry"),
    ).not.toBeNull();
  });

  it("la caja de las unidades es la activa al montar y se puede cambiar", () => {
    // Se busca una seed cuya respuesta tenga 2 dígitos para tener dos cajas.
    const seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(
      (s) => String(generateSession("hard", undefined, s)[0].answer).length === 2,
    )!;
    expect(seed).toBeDefined();

    const { container } = render(<TresSumandosScreen {...props("hard", seed)} />);

    const boxes = vboxes(container);
    expect(boxes).toHaveLength(2);
    expect(boxes[1].className).toContain("ops__vbox--active");

    fireEvent.click(boxes[0]);
    expect(vboxes(container)[0].className).toContain("ops__vbox--active");
    expect(vboxes(container)[1].className).not.toContain("ops__vbox--active");
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<TresSumandosScreen {...props("easy", 4242)} />);

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });
});
