import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { LineTypesScreen } from "./LineTypesScreen";
import { generateSession, LINES } from "../../../core/activities/lineTypes";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("lineTypes", mockOnExit, difficulty, seed);

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>("button.lt__option"));

describe("LineTypesScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la pregunta fija y el trazo SVG tomado del catálogo del motor", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const ex = session[0];

    const { container } = render(<LineTypesScreen {...props("easy", seed)} />);

    // El enunciado es fijo en el renderer; lo que viene del motor es el trazo.
    expect(container.querySelector(".lt__question")?.textContent).toBe("¿Qué tipo de línea es?");
    expect(ex.line.svg).toBe(LINES.find((l) => l.kind === ex.line.kind)!.svg);
    // La clase va en el propio <svg>, con el trazo inyectado desde el catálogo.
    const svg = container.querySelector(".lt__svg");
    expect(svg).not.toBeNull();
    expect(svg?.tagName.toLowerCase()).toBe("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    // Se comparan los elementos renderizados, no el HTML literal: el parser
    // reabre los tags auto-cerrados que trae el catálogo.
    const tagsOf = (html: string) => Array.from(html.matchAll(/<([a-zA-Z]+)/g)).map((m) => m[1]);
    expect(Array.from(svg!.children).map((c) => c.tagName.toLowerCase())).toEqual(
      tagsOf(ex.line.svg),
    );
  });

  it("ofrece exactamente las opciones que declara el motor, con la correcta incluida", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);

    const { container } = render(<LineTypesScreen {...props("medium", seed)} />);

    const labels = optionButtons(container).map((b) => (b.textContent ?? "").trim());
    expect(labels).toEqual(session[0].options);
    expect(labels).toContain(session[0].answer);
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<LineTypesScreen {...props("hard", seed)} />);

    fireEvent.click(
      optionButtons(container).find((b) => (b.textContent ?? "").trim() === session[0].answer)!,
    );

    expect(container.querySelector("button.lt__option--correct")).not.toBeNull();
    expect(container.querySelector(".lt__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la opción pulsada y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<LineTypesScreen {...props("hard", seed)} />);

    fireEvent.click(optionButtons(container).find((b) => (b.textContent ?? "").trim() === wrong)!);

    expect(container.querySelector("button.lt__option--wrong")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".lt__celebration")).toBeNull();
  });

  it("no monta Numpad ni DigitCell: son actividades de opción", () => {
    const { container } = render(<LineTypesScreen {...props("expert", 4242)} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });
});
