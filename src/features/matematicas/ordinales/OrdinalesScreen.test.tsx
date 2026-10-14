import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { OrdinalesScreen } from "./OrdinalesScreen";
import { generateSession } from "../../../core/activities/ordinales";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("ordinales", mockOnExit, difficulty, seed);

describe("OrdinalesScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("identify: fila sin marca previa ni opciones; se pulsa la imagen", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    expect(container.querySelectorAll(".ord__item")).toHaveLength(session[0].rowSize);
    expect(container.querySelectorAll(".ord__object--highlight")).toHaveLength(0);
    expect(container.querySelector("button.ord__option")).toBeNull();
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
    expect(container.querySelector(".ord__question")?.textContent).toBe(session[0].question);
    expect(container.querySelector(".ord__direction")).not.toBeNull();
    expect(container.querySelectorAll("button.ord__item--btn")).toHaveLength(session[0].rowSize);
  });

  it("identify: acierto al pulsar la posición correcta", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    fireEvent.click(container.querySelector(`#ord-item-${session[0].answer}`)!);

    expect(container.querySelector(".ord__object--correct")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("identify: fallo al pulsar otra posición y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].answer === 1 ? 2 : 1;

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    fireEvent.click(container.querySelector(`#ord-item-${wrong}`)!);

    expect(container.querySelector(".ord__object--wrong")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")).toBeNull();
  });

  it("position (medium) muestra el sentido del conteo izquierda → derecha", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    expect(session[0].type).toBe("position");

    const { container } = render(<OrdinalesScreen {...props("medium", seed)} />);

    expect(container.querySelector(".ord__direction")).not.toBeNull();
    expect(container.querySelector(".ord__direction-hint")?.textContent).toContain(
      "izquierda a derecha",
    );
  });

  it("una dificultad numérica monta Numpad y toggle, y acepta la respuesta escrita", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    expect(session[0].type).toBe("fromRight");

    const { container } = render(<OrdinalesScreen {...props("hard", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".input-toggle")).not.toBeNull();
    expect(container.querySelector(".ord__direction")).not.toBeNull();
    expect(container.querySelector("button.ord__item--btn")).toBeNull();
    expect(container.querySelectorAll(".ord__object--highlight")).toHaveLength(1);

    String(session[0].answer)
      .split("")
      .forEach((d) => {
        const key = Array.from(
          container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
        ).find((k) => k.textContent === d);
        fireEvent.click(key!);
      });
    const confirm = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
    ).find((k) => k.textContent === "✓");
    fireEvent.click(confirm!);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("al pasar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<OrdinalesScreen {...props("hard", 4242)} />);

    fireEvent.click(container.querySelector<HTMLButtonElement>(".input-toggle__switch")!);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });
});
