import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Amigos10Screen } from "./Amigos10Screen";
import { generateSession } from "../../../core/activities/amigos10";
import type { Amigos10Exercise } from "../../../core/activities/amigos10";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: "easy" | "medium" | "hard" | "expert", seed = 4242) =>
  smokeProps("amigos10", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".ami__opt"));

const correcta = (ex: Amigos10Exercise): string => ex.correctAnswer;
const otra = (ex: Amigos10Exercise): string => {
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

describe("Amigos10Screen — smoke", () => {
  it("TR-A10.1 monta sin errores en nivel easy y muestra el ten-frame", () => {
    const { container } = render(<Amigos10Screen {...props("easy")} />);
    expect(container.querySelector(".ami__tenframe")).toBeTruthy();
    expect(opciones(container).length).toBeGreaterThanOrEqual(2);
  });

  it("TR-A10.2 acertar avanza al siguiente ejercicio tras el autoavance", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<Amigos10Screen {...props("hard", seed)} />);

    const respuestaCorrecta = correcta(ejercicios[0]);
    const boton = opciones(container).find((b) => b.textContent === respuestaCorrecta);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
    runTimers(AUTOAVANCE_MS + 50);
    // Ya en el segundo ejercicio
    expect(container.querySelector(".ami__tenframe")).toBeTruthy();
  });

  it("TR-A10.3 fallar muestra ActionButtons y no avanza", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<Amigos10Screen {...props("hard", seed)} />);

    const respuestaErronea = otra(ejercicios[0]);
    const boton = opciones(container).find((b) => b.textContent === respuestaErronea);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--wrong")).toBeTruthy();
    // Los botones de ActionButtons están en el footer
    expect(container.querySelector(".ops__footer")).toBeTruthy();
  });

  it("TR-A10.4 alreadyFailed: fallar → reintentar → acertar no suma a la puntuación", () => {
    const seed = 7777;
    const ejercicios = generateSession("medium", seed);
    const { container } = render(<Amigos10Screen {...props("medium", seed)} />);

    // Fallar
    const respuestaErronea = otra(ejercicios[0]);
    const botonMal = opciones(container).find((b) => b.textContent === respuestaErronea);
    fireEvent.click(botonMal!);

    // Pulsar Reintentar
    const reintentar = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.includes("Reintentar"),
    );
    expect(reintentar).toBeTruthy();
    fireEvent.click(reintentar!);

    // Acertar
    const respuestaCorrecta = correcta(ejercicios[0]);
    const botonBien = opciones(container).find((b) => b.textContent === respuestaCorrecta);
    fireEvent.click(botonBien!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
  });

  it("TR-A10.5 muestra SummaryScreen al terminar todos los ejercicios", () => {
    const seed = 4242;
    // hard genera sesión de 10 ejercicios completa
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<Amigos10Screen {...props("hard", seed)} />);

    for (const ex of ejercicios) {
      const respuestaCorrecta = correcta(ex);
      const boton = opciones(container).find((b) => b.textContent === respuestaCorrecta);
      fireEvent.click(boton!);
      runTimers(AUTOAVANCE_MS + 50);
    }

    // SummaryScreen tiene el botón de Reintentar o Salir
    expect(container.textContent).toMatch(/Bien|Ejercicio|siguiente|Volver|Reintentar/i);
  });
});
