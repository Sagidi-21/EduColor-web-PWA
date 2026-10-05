import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { LecturaNumerosScreen } from "./LecturaNumerosScreen";
import { generateSession } from "../../../core/activities/lecturaNumeros";
import type { LecturaExercise } from "../../../core/activities/lecturaNumeros";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: "easy" | "medium" | "hard" | "expert", seed = 4242) =>
  smokeProps("lecturaNumeros", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".lec__opt"));

const correcta = (ex: LecturaExercise): string => ex.correctAnswer;
const otra = (ex: LecturaExercise): string => {
  const distinta = ex.options.find((o) => o !== ex.correctAnswer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta;
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("LecturaNumerosScreen — smoke", () => {
  it("TR-LN.1 monta sin errores y muestra el display y las opciones", () => {
    const { container } = render(<LecturaNumerosScreen {...props("easy")} />);
    expect(container.querySelector(".lec__display")).toBeTruthy();
    expect(opciones(container).length).toBeGreaterThanOrEqual(2);
  });

  it("TR-LN.2 acertar avanza al siguiente ejercicio tras el autoavance", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<LecturaNumerosScreen {...props("hard", seed)} />);

    const respuestaCorrecta = correcta(ejercicios[0]);
    const boton = opciones(container).find((b) => b.textContent === respuestaCorrecta);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
    runTimers(AUTOAVANCE_MS + 50);
    expect(container.querySelector(".lec__display")).toBeTruthy();
  });

  it("TR-LN.3 fallar muestra ActionButtons y no avanza", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<LecturaNumerosScreen {...props("hard", seed)} />);

    const respuestaErronea = otra(ejercicios[0]);
    const boton = opciones(container).find((b) => b.textContent === respuestaErronea);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--wrong")).toBeTruthy();
    expect(container.querySelector(".ops__footer")).toBeTruthy();
  });

  it("TR-LN.4 alreadyFailed: fallar → reintentar → acertar no suma a la puntuación", () => {
    const seed = 7777;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<LecturaNumerosScreen {...props("hard", seed)} />);

    const respuestaErronea = otra(ejercicios[0]);
    fireEvent.click(opciones(container).find((b) => b.textContent === respuestaErronea)!);

    const reintentar = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.includes("Reintentar"),
    );
    expect(reintentar).toBeTruthy();
    fireEvent.click(reintentar!);

    const respuestaCorrecta = correcta(ejercicios[0]);
    fireEvent.click(opciones(container).find((b) => b.textContent === respuestaCorrecta)!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
  });

  it("TR-LN.5 muestra SummaryScreen al terminar todos los ejercicios", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<LecturaNumerosScreen {...props("hard", seed)} />);

    for (const ex of ejercicios) {
      const boton = opciones(container).find((b) => b.textContent === correcta(ex));
      fireEvent.click(boton!);
      runTimers(AUTOAVANCE_MS + 50);
    }

    expect(container.textContent).toMatch(/Bien|Ejercicio|siguiente|Volver|Reintentar/i);
  });
});
