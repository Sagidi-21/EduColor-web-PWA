import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { OperationsScreen } from "./OperationsScreen";
import { generateSession } from "../../../core/activities/operations";
import { smokeProps, typeOnNumpad, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";
import type { OperationsExercise } from "../../../core/activities/operations";

const mockFetchSumaSession = vi.fn();

vi.mock("../../../platform/content-api/contentClient", () => ({
  ContentClientError: class ContentClientError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status = 0) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
  fetchSumaSession: (...args: unknown[]) => mockFetchSumaSession(...args),
}));

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("suma", mockOnExit, difficulty, seed);

const vboxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".ops__vbox"));

/** Sesión fija de suma (como respondería Edge); no usa el motor local. */
function fixedSumaSession(seed: number): OperationsExercise[] {
  void seed;
  return [
    { a: 1, b: 2, op: "suma", answer: 3, imageUrl: "" },
    { a: 2, b: 2, op: "suma", answer: 4, imageUrl: "" },
    { a: 1, b: 1, op: "suma", answer: 2, imageUrl: "" },
    { a: 3, b: 1, op: "suma", answer: 4, imageUrl: "" },
    { a: 2, b: 1, op: "suma", answer: 3, imageUrl: "" },
    { a: 1, b: 3, op: "suma", answer: 4, imageUrl: "" },
    { a: 4, b: 1, op: "suma", answer: 5, imageUrl: "" },
    { a: 2, b: 3, op: "suma", answer: 5, imageUrl: "" },
    { a: 3, b: 2, op: "suma", answer: 5, imageUrl: "" },
    { a: 1, b: 4, op: "suma", answer: 5, imageUrl: "" },
  ];
}

async function renderSumaReady(difficulty: EngineScreenProps["difficulty"] = "easy", seed = 4242) {
  mockFetchSumaSession.mockResolvedValue(fixedSumaSession(seed));
  const view = render(<OperationsScreen {...props(difficulty, seed)} />);
  await waitFor(() => {
    expect(view.container.querySelector(".ops__vertical")).not.toBeNull();
  });
  return view;
}

describe("OperationsScreen smoke (suma vía Edge y resta local)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
    mockFetchSumaSession.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la operación vertical con los operandos del servidor", async () => {
    const seed = 4242;
    const session = fixedSumaSession(seed);
    const ex = session[0]!;

    const { container } = await renderSumaReady("easy", seed);

    expect(ex.op).toBe("suma");
    expect(container.querySelector(".ops__vertical")).not.toBeNull();
    expect(container.querySelectorAll(".ops__vcell").length).toBeGreaterThan(0);
    expect(vboxes(container)).toHaveLength(String(ex.answer).length);
    expect(mockFetchSumaSession).toHaveBeenCalled();
  });

  it("teclea la respuesta y confirma al soltar el último dígito", async () => {
    const seed = 4242;
    const ex = fixedSumaSession(seed)[0]!;
    const { container } = await renderSumaReady("easy", seed);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    typeOnNumpad(container, ex.answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("resta: monta la misma columna y valida la diferencia (local)", () => {
    const seed = 4242;
    const session = generateSession("resta", "easy", seed);
    const ex = session[0]!;

    const { container } = render(
      <OperationsScreen {...smokeProps("resta", mockOnExit, "easy", seed)} />,
    );

    expect(ex.a).toBeGreaterThanOrEqual(ex.b);
    typeOnNumpad(container, ex.answer);
    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
    expect(mockFetchSumaSession).not.toHaveBeenCalled();
  });

  it("fallo: no celebra y ofrece reintentar o siguiente", async () => {
    const seed = 4242;
    const wrong = fixedSumaSession(seed)[0]!.answer + 1;
    const { container } = await renderSumaReady("easy", seed);

    typeOnNumpad(container, wrong);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", async () => {
    const { container } = await renderSumaReady("easy", 4242);

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("la casilla se marca como activa y la pulsada pasa a ser la activa", async () => {
    const mediumSession: OperationsExercise[] = [
      { a: 5, b: 6, op: "suma", answer: 11, imageUrl: "" },
      { a: 4, b: 7, op: "suma", answer: 11, imageUrl: "" },
    ];
    mockFetchSumaSession.mockResolvedValue(mediumSession);
    const { container } = render(<OperationsScreen {...props("medium", 7)} />);
    await waitFor(() => {
      expect(vboxes(container)).toHaveLength(2);
    });

    const boxes = vboxes(container);
    expect(boxes[1]!.className).toContain("ops__vbox--active");

    fireEvent.click(boxes[0]!);
    expect(vboxes(container)[0]!.className).toContain("ops__vbox--active");
    expect(vboxes(container)[1]!.className).not.toContain("ops__vbox--active");
  });

  it("pulsar 'Repetir' vuelve a pedir la sesión al servidor", async () => {
    const seed = 4242;
    const exercises = fixedSumaSession(seed);
    mockFetchSumaSession.mockResolvedValue(exercises);

    const { container } = render(<OperationsScreen {...props("easy", seed)} />);
    await waitFor(() => expect(container.querySelector(".ops__vertical")).not.toBeNull());

    const firstExercise = container.querySelector(".ops__exercise")?.textContent ?? "";

    for (const ex of exercises) {
      typeOnNumpad(container, ex.answer);
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    const callsBeforeRestart = mockFetchSumaSession.mock.calls.length;
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    await waitFor(() => {
      expect(mockFetchSumaSession.mock.calls.length).toBeGreaterThan(callsBeforeRestart);
      expect(container.querySelector(".summary__stars")).toBeNull();
      expect(container.querySelector(".ops__exercise")?.textContent).toBe(firstExercise);
    });
  });
});
