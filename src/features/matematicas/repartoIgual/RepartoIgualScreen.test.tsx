import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RepartoIgualScreen } from "./RepartoIgualScreen";
import { generateSession, validateAnswer } from "../../../core/activities/repartoIgual";
import type { RepartoIgualExercise } from "../../../core/activities/repartoIgual";
import type { EngineScreenProps } from "../engine-screens";
import { confirmKey, deleteKey, pressNumpad, smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 1200;

const session = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

const buildProps = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("repartoIgual", mockOnExit, difficulty, seed);

const textOf = (container: HTMLElement) =>
  container.querySelector(".reparto__text")?.textContent ?? "";

const answerEl = (container: HTMLElement) =>
  container.querySelector("[data-testid='reparto-answer']");

const answerCls = (container: HTMLElement) => answerEl(container)?.className ?? "";

const answerText = (container: HTMLElement) => answerEl(container)?.textContent ?? "";

const answerWithNumpad = (container: HTMLElement, value: string | number) => {
  String(value)
    .split("")
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("RepartoIgualScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con el texto del motor y el contador 1/N", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex = exercises[0];

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);

    expect(textOf(container)).toBe(
      `Tenemos ${ex.total} objetos y queremos repartirlos en ${ex.groups} grupos iguales.`,
    );
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("monta el Numpad con el teclado completo y sin DigitCell", () => {
    const { container } = render(<RepartoIgualScreen {...buildProps("medium")} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(
      Array.from(container.querySelectorAll(".shared-numpad__key")).map((k) => k.textContent),
    ).toEqual(["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "✓"]);
    // Este renderer no ofrece escritura a mano.
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("dibuja un grupo por cada grupo que pide el motor", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);

    expect(container.querySelectorAll(".reparto__group-box")).toHaveLength(ex.groups);
    expect(answerText(container)).toBe("?");
    expect(container.querySelector(".reparto__answer-row")).toBeNull();
  });

  it("en hard muestra la fila de respuesta y no dibuja grupos", () => {
    const { container } = render(<RepartoIgualScreen {...buildProps("hard")} />);

    expect(container.querySelector(".reparto__groups")).toBeNull();
    expect(container.querySelector(".reparto__answer-row")).not.toBeNull();
    expect(answerText(container)).toBe("?");
  });

  it("teclear la respuesta y confirmar marca el acierto", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.itemsPerGroup);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
    expect(answerCls(container)).toContain("reparto__feedback--correct");
    expect(container.querySelector(".activity-actions")).toBeNull();
  });

  it("confirmar vacío no puntúa y no avanza de ejercicio", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("borrar vacía el hueco y confirmar entonces no hace nada", () => {
    // `itemsPerGroup` es siempre de una sola cifra en las cuatro dificultades,
    // así que borrar deja el hueco vacío y `handleConfirm` sale sin validar
    // cuando no hay nada escrito. El ejercicio sigue intacto.
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex = exercises[0];
    expect(String(ex.itemsPerGroup)).toHaveLength(1);

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    pressNumpad(container, String(ex.itemsPerGroup));
    pressNumpad(container, deleteKey);
    pressNumpad(container, confirmKey);

    expect(answerText(container)).toBe("?");
    expect(answerCls(container)).toContain("reparto__feedback--active");
    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-actions")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("fallo: ofrece reintentar y el hueco queda marcado como fallido", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.itemsPerGroup + 1);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(answerCls(container)).toContain("reparto__feedback--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: reintentar vacía el hueco, a diferencia de relacionSumaResta", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.itemsPerGroup + 1);
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(answerText(container)).toBe("?");
    expect(answerCls(container)).toContain("reparto__feedback--active");
  });

  it("acierto: el contador avanza solo tras 1200 ms", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, exercises[0].itemsPerGroup);

    // Antes del plazo no ha avanzado.
    runAutoAdvance(AUTO_ADVANCE_MS - 100);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );

    runAutoAdvance(200);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("el motor mantiene la coherencia total = grupos × elementos por grupo", () => {
    const seed = 4242;

    (["easy", "medium", "hard", "expert"] as const).forEach((difficulty) => {
      session(difficulty, seed).forEach((ex: RepartoIgualExercise) => {
        expect(ex.total).toBe(ex.groups * ex.itemsPerGroup);
        expect(validateAnswer(ex, ex.itemsPerGroup)).toBe(true);
        expect(validateAnswer(ex, ex.itemsPerGroup + 1)).toBe(false);
      });
    });
  });

  it("acabar la sesión muestra el resumen con el total de aciertos", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<RepartoIgualScreen {...buildProps("medium", seed)} />);

    exercises.forEach((ex) => {
      answerWithNumpad(container, ex.itemsPerGroup);
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
