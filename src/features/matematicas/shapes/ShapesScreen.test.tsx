import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ShapesScreen } from "./ShapesScreen";
import { generateSession, SHAPES } from "../../../core/activities/shapes";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("shapes", mockOnExit, difficulty, seed);

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>("button.shp__option"));

describe("ShapesScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la figura, el color y la rotación que dicta el motor", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const ex = session[0];

    const { container } = render(<ShapesScreen {...props("easy", seed)} />);

    expect(ex.shape).toBeDefined();
    expect(SHAPES.find((s) => s.id === ex.shape.id)).toEqual(ex.shape);
    expect(container.querySelector(".shp__stage") ?? container.firstElementChild).not.toBeNull();
  });

  it("ofrece las opciones del motor, con la correcta presente y sin repetir", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);
    const ex = session[0];

    const { container } = render(<ShapesScreen {...props("medium", seed)} />);

    const ids = optionButtons(container).map((b) => b.id.replace("shp-option-", ""));
    expect(ids).toEqual(ex.options.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(ex.correctAnswer);
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<ShapesScreen {...props("hard", seed)} />);

    fireEvent.click(container.querySelector(`#shp-option-${session[0].correctAnswer}`)!);

    expect(container.querySelector(`.shp__option--correct`)).not.toBeNull();
    expect(container.querySelector(".shp__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la pulsada, no celebra y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrongId = session[0].options.find((o) => o.id !== session[0].correctAnswer)!.id;

    const { container } = render(<ShapesScreen {...props("hard", seed)} />);

    fireEvent.click(container.querySelector(`#shp-option-${wrongId}`)!);

    expect(container.querySelector(`.shp__option--wrong`)).not.toBeNull();
    expect(container.querySelector(".shp__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar devuelve los botones a idle", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrongId = session[0].options.find((o) => o.id !== session[0].correctAnswer)!.id;

    const { container } = render(<ShapesScreen {...props("hard", seed)} />);

    fireEvent.click(container.querySelector(`#shp-option-${wrongId}`)!);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".shp__option--wrong")).toBeNull();
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("no monta Numpad ni DigitCell: son actividades de opción", () => {
    const { container } = render(<ShapesScreen {...props("expert", 4242)} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });

  it("pulsar 'Repetir' devuelve la misma figura (reutiliza la semilla de sesión)", () => {
    const seed = 4242;
    const exercises = generateSession("hard", seed);

    const { container } = render(<ShapesScreen {...props("hard", seed)} />);
    const firstQuestion = container.querySelector(".shp__question")?.textContent ?? "";

    const runAutoAdvance = (ms = 900) => {
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    };

    exercises.forEach((ex) => {
      fireEvent.click(container.querySelector(`#shp-option-${ex.correctAnswer}`)!);
      runAutoAdvance();
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(container.querySelector(".shp__question")?.textContent).toBe(firstQuestion);
  });
});
