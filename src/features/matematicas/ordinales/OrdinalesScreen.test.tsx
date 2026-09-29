import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { OrdinalesScreen } from "./OrdinalesScreen";
import { generateSession, ORDINAL_LABELS } from "../../../core/activities/ordinales";
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

  it("pinta la fila con los objetos que dicta el motor", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    expect(container.querySelectorAll(".ord__item")).toHaveLength(session[0].rowSize);
    expect(container.querySelectorAll(".ord__object--highlight")).toHaveLength(1);
    expect(container.querySelector(".ord__question")?.textContent).toBe(session[0].question);
  });

  it("easy ofrece los ordinales del motor como botones y no monta Numpad", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    const labels = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.ord__option"),
    ).map((b) => (b.textContent ?? "").trim());
    expect(labels).toEqual(session[0].options!.map((o) => ORDINAL_LABELS[o - 1]));

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("acierto por opción: marca la correcta y celebra", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    const correctLabel = ORDINAL_LABELS[session[0].answer - 1];
    const target = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.ord__option"),
    ).find((b) => (b.textContent ?? "").trim() === correctLabel);
    fireEvent.click(target!);

    expect(container.querySelector("button.ord__option--correct")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo por opción: marca la pulsada y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrongPos = (session[0].options ?? []).find((o) => o !== session[0].answer)!;

    const { container } = render(<OrdinalesScreen {...props("easy", seed)} />);

    const target = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.ord__option"),
    ).find((b) => (b.textContent ?? "").trim() === ORDINAL_LABELS[wrongPos - 1]);
    fireEvent.click(target!);

    expect(container.querySelector("button.ord__option--wrong")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".ops__celebration")).toBeNull();
  });

  it("una dificultad numérica monta Numpad y toggle, y acepta la respuesta escrita", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    expect(session[0].type).toBe("fromRight");

    const { container } = render(<OrdinalesScreen {...props("hard", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".input-toggle")).not.toBeNull();
    expect(container.querySelector(".ord__direction")).not.toBeNull();
    expect(container.querySelector("button.ord__option")).toBeNull();

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
