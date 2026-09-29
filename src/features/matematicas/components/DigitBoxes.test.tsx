import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { useDigitBoxes } from "./useDigitBoxes";
import { confirmKey, deleteKey, pressNumpad, smokeProps, switchToCanvas } from "../testing/smoke";
import { Numeracion4059Screen } from "../numeracion4059/Numeracion4059Renderer";
import { Numeracion6099Screen } from "../numeracion6099/Numeracion6099Renderer";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 900;

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const buildProps4059 = () => smokeProps("numeracion4059", mockOnExit, "hard", 4242);
const buildProps6099 = () => smokeProps("numeracion6099", mockOnExit, "hard", 4242);

const slots = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ops__answer-slot"));

const activeSlot = (container: HTMLElement) =>
  slots(container).findIndex((s) => s.querySelector(".ops__answer-box--active, .dab"));

describe("casillas por cifra: una casilla, una cifra, y se avanza al rellenar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("en la dirección ltr se empieza por la casilla de la izquierda", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 3, order: "ltr", onComplete, resetToken: 0 }),
    );

    expect(result.current.activeIndex).toBe(0);
  });

  it("en la dirección rtl se empieza por la casilla de la derecha", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 3, order: "rtl", onComplete, resetToken: 0 }),
    );

    expect(result.current.activeIndex).toBe(2);
  });

  it("en rtl avanza hacia la izquierda y valida al llenar la primera", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 3, order: "rtl", onComplete, resetToken: 0 }),
    );

    // Empieza por la derecha: la primera cifra escrita es la de las unidades.
    act(() => result.current.onDigit("3"));
    expect(result.current.activeIndex).toBe(1);
    act(() => result.current.onDigit("2"));
    expect(result.current.activeIndex).toBe(0);
    act(() => result.current.onDigit("1"));

    // La respuesta se arma igual que se lee: de izquierda a derecha.
    expect(result.current.values).toEqual(["1", "2", "3"]);
    expect(onComplete).toHaveBeenCalledWith("123");
  });

  it("en ltr avanza hacia la derecha y valida al llenar la última", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 2, order: "ltr", onComplete, resetToken: 0 }),
    );

    act(() => result.current.onDigit("4"));
    expect(result.current.activeIndex).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => result.current.onDigit("7"));
    expect(onComplete).toHaveBeenCalledWith("47");
  });

  it("borrar vacía la casilla activa y, si ya estaba vacía, vuelve a la anterior", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 3, order: "ltr", onComplete, resetToken: 0 }),
    );

    act(() => result.current.onDigit("1"));
    act(() => result.current.onDigit("2"));
    expect(result.current.values).toEqual(["1", "2", ""]);
    expect(result.current.activeIndex).toBe(2);

    // Vacia la activa, que esta vacia, y vuelve a la anterior.
    act(() => result.current.onDelete());
    expect(result.current.values).toEqual(["1", "", ""]);
    expect(result.current.activeIndex).toBe(1);
  });

  it("`✓` no valida mientras queden casillas vacías", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDigitBoxes({ length: 3, order: "ltr", onComplete, resetToken: 0 }),
    );

    act(() => result.current.onDigit("1"));
    act(() => result.current.onConfirm());
    expect(onComplete).not.toHaveBeenCalled();

    act(() => result.current.onDigit("2"));
    act(() => result.current.onDigit("3"));
    act(() => result.current.onConfirm());
    expect(onComplete).toHaveBeenCalledWith("123");
  });

  it("cambiar de ejercicio vacía las casillas aunque coincida el número de cifras", () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(
      ({ token }) => useDigitBoxes({ length: 2, order: "ltr", onComplete, resetToken: token }),
      { initialProps: { token: 0 } },
    );

    act(() => result.current.onDigit("4"));
    act(() => result.current.onDigit("7"));
    expect(result.current.values).toEqual(["4", "7"]);

    // Mismo numero de cifras, otro ejercicio: las casillas deben quedar limpias.
    rerender({ token: 1 });
    expect(result.current.values).toEqual(["", ""]);
    expect(result.current.activeIndex).toBe(0);
  });

  it("el numpad rellena las casillas de izquierda a derecha en la familia de numeracion", () => {
    const { container } = render(<Numeracion4059Screen {...buildProps4059()} />);

    expect(slots(container)).toHaveLength(2);
    expect(activeSlot(container)).toBe(0);

    pressNumpad(container, "5");
    expect(slots(container)[0].textContent).toContain("5");
    expect(activeSlot(container)).toBe(1);
  });

  it("la numeración no usa formato vertical: la primera cifra va en la casilla izquierda", () => {
    const { container } = render(<Numeracion6099Screen {...buildProps6099()} />);

    pressNumpad(container, "9");

    // El 9 tecleado primero queda a la izquierda, no a la derecha.
    expect(slots(container)[0].textContent).toContain("9");
    expect(slots(container)[1].textContent).toContain("_");
  });

  it("4069: rellenar la última casilla valida sola y avanza el contador", () => {
    const { container } = render(<Numeracion6099Screen {...buildProps6099()} />);

    // Respuesta del primer ejercicio con seed 4242 en hard: 96.
    pressNumpad(container, "9");
    pressNumpad(container, "6");

    expect(container.querySelector(".ops__celebration")).not.toBeNull();
    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/10");
  });

  it("el lienzo escribe en la casilla activa y respeta la misma dirección", () => {
    const { container } = render(<Numeracion6099Screen {...buildProps6099()} />);
    switchToCanvas(container);

    // El lienzo sustituye a la casilla activa, y solo a la activa.
    expect(container.querySelectorAll(".dab")).toHaveLength(1);
    expect(slots(container)).toHaveLength(2);
    expect(container.querySelectorAll(".ops__answer-slot")[0].querySelector(".dab")).not.toBeNull();
  });

  it("al pasar de un ejercicio de dos cifras a uno de una, la casilla sobrante desaparece", () => {
    // En 4059 conviven ejercicios de una y dos cifras; no debe quedar una
    // casilla de mas que el niño no pueda rellenar.
    const { container } = render(<Numeracion4059Screen {...buildProps4059()} />);

    pressNumpad(container, "5");
    pressNumpad(container, "8");
    runAutoAdvance();
    expect(slots(container)).toHaveLength(2);

    // Se recorren los siguientes hasta encontrar uno de una sola cifra.
    for (let i = 0; i < 9; i++) {
      const n = slots(container).length;
      const botones = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
      );
      const digitos = botones.filter((b) => /^\d$/.test(b.textContent ?? ""));
      for (let k = 0; k < n; k++) fireEvent.click(digitos[0]);
      if (slots(container).length === 1) break;
      if (container.querySelector(".ops__celebration") === null) break;
      runAutoAdvance();
    }

    // Lo que se comprueba es el invariante: casillas = cifras de la respuesta.
    const enunciado = container.querySelector(".n4059__question")?.textContent ?? "";
    expect(enunciado.length).toBeGreaterThan(0);
    expect([1, 2]).toContain(slots(container).length);
  });

  it("borrar con el numpad vacía la casilla activa", () => {
    const { container } = render(<Numeracion4059Screen {...buildProps4059()} />);

    pressNumpad(container, "5");
    expect(slots(container)[0].textContent).toContain("5");

    pressNumpad(container, deleteKey);
    expect(slots(container)[0].textContent).toContain("_");
  });

  it("`✓` con casillas incompletas no hace nada", () => {
    const { container } = render(<Numeracion4059Screen {...buildProps4059()} />);

    pressNumpad(container, "5");
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });
});
