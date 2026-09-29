import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { WeekDaysScreen } from "./WeekDaysScreen";
import { generateSession, DAYS } from "../../../core/activities/weekDays";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("weekDays", mockOnExit, difficulty, seed);

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>("button.wd__option"));

describe("WeekDaysScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la pregunta del motor y el contador 1/N", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<WeekDaysScreen {...props("easy", seed)} />);

    expect(container.querySelector(".wd__question")?.textContent).toBe(session[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${session.length}`,
    );
  });

  it("ofrece los días que declara el motor, sin repetir y con la respuesta incluida", () => {
    const seed = 4242;
    const session = generateSession("medium", seed);

    const { container } = render(<WeekDaysScreen {...props("medium", seed)} />);

    const labels = optionButtons(container).map((b) => (b.textContent ?? "").trim());
    expect(labels).toEqual(session[0].options);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain(session[0].answer);
    // Ningún día fuera del catálogo.
    labels.forEach((l) => expect(DAYS).toContain(l));
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<WeekDaysScreen {...props("hard", seed)} />);

    fireEvent.click(
      optionButtons(container).find((b) => (b.textContent ?? "").trim() === session[0].answer)!,
    );

    expect(container.querySelector("button.wd__option--correct")).not.toBeNull();
    expect(container.querySelector(".wd__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la pulsada, no celebra y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<WeekDaysScreen {...props("hard", seed)} />);

    fireEvent.click(optionButtons(container).find((b) => (b.textContent ?? "").trim() === wrong)!);

    expect(container.querySelector("button.wd__option--wrong")).not.toBeNull();
    expect(container.querySelector(".wd__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar devuelve el estado a idle y rehabilita los botones", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<WeekDaysScreen {...props("hard", seed)} />);

    fireEvent.click(optionButtons(container).find((b) => (b.textContent ?? "").trim() === wrong)!);
    expect(optionButtons(container).every((b) => b.disabled)).toBe(true);

    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector("button.wd__option--wrong")).toBeNull();
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("no monta Numpad ni DigitCell: son actividades de opción", () => {
    const { container } = render(<WeekDaysScreen {...props("expert", 4242)} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });
});
