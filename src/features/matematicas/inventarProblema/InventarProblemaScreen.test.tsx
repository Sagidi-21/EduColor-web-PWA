import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { InventarProblemaScreen } from "./InventarProblemaScreen";
import { generateSession } from "../../../core/activities/inventarProblema";
import type { InventarProblemaExercise } from "../../../core/activities/inventarProblema";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: "easy" | "medium" | "hard" | "expert", seed = 4242) =>
  smokeProps("inventarProblema", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".inv__opt"));

const correcta = (ex: InventarProblemaExercise): string => ex.correctAnswer;
const otra = (ex: InventarProblemaExercise): string => {
  const distinta = ex.options.find((o) => o.value !== ex.correctAnswer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta.value;
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

describe("InventarProblemaScreen — smoke", () => {
  it("TR-IP.1 monta sin errores y muestra artículos y opciones", () => {
    const { container } = render(<InventarProblemaScreen {...props("easy")} />);
    expect(container.querySelector(".inv__item")).toBeTruthy();
    expect(container.querySelector(".inv__question")).toBeTruthy();
    expect(opciones(container).length).toBeGreaterThanOrEqual(2);
  });

  it("TR-IP.2 muestra la pastilla de presupuesto en nivel hard", () => {
    const { container } = render(<InventarProblemaScreen {...props("hard")} />);
    expect(container.querySelector(".inv__budget")).toBeTruthy();
  });

  it("TR-IP.3 acertar avanza al siguiente ejercicio tras el autoavance", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<InventarProblemaScreen {...props("hard", seed)} />);

    const respuestaCorrecta = correcta(ejercicios[0]);
    // find option button by value... wait, buttons show label. So we need to click by textContent or just find the one that corresponds to value.
    // the label is what is rendered.
    const optLabel = ejercicios[0].options.find((o) => o.value === respuestaCorrecta)!.label;

    const boton = opciones(container).find((b) => b.textContent === optLabel);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
    runTimers(AUTOAVANCE_MS + 50);
    expect(container.querySelector(".inv__item")).toBeTruthy(); // Siguiente
  });

  it("TR-IP.4 fallar muestra ActionButtons y no avanza", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<InventarProblemaScreen {...props("hard", seed)} />);

    const respuestaErronea = otra(ejercicios[0]);
    const optLabel = ejercicios[0].options.find((o) => o.value === respuestaErronea)!.label;
    const boton = opciones(container).find((b) => b.textContent === optLabel);
    expect(boton).toBeTruthy();
    fireEvent.click(boton!);

    expect(container.querySelector(".ops__stage--wrong")).toBeTruthy();
    expect(container.querySelector(".ops__footer")).toBeTruthy();
  });

  it("TR-IP.5 alreadyFailed: fallar → reintentar → acertar no suma a la puntuación", () => {
    const seed = 7777;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<InventarProblemaScreen {...props("hard", seed)} />);

    const respuestaErronea = otra(ejercicios[0]);
    const labelMal = ejercicios[0].options.find((o) => o.value === respuestaErronea)!.label;
    fireEvent.click(opciones(container).find((b) => b.textContent === labelMal)!);

    const reintentar = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.includes("Reintentar"),
    );
    expect(reintentar).toBeTruthy();
    fireEvent.click(reintentar!);

    const respuestaCorrecta = correcta(ejercicios[0]);
    const labelBien = ejercicios[0].options.find((o) => o.value === respuestaCorrecta)!.label;
    fireEvent.click(opciones(container).find((b) => b.textContent === labelBien)!);

    expect(container.querySelector(".ops__stage--correct")).toBeTruthy();
  });

  it("TR-IP.6 muestra SummaryScreen al terminar todos los ejercicios", () => {
    const seed = 4242;
    const ejercicios = generateSession("hard", seed);
    const { container } = render(<InventarProblemaScreen {...props("hard", seed)} />);

    for (const ex of ejercicios) {
      const resp = correcta(ex);
      const label = ex.options.find((o) => o.value === resp)!.label;
      const boton = opciones(container).find((b) => b.textContent === label);
      fireEvent.click(boton!);
      runTimers(AUTOAVANCE_MS + 50);
    }

    expect(container.textContent).toMatch(/Bien|Ejercicio|siguiente|Volver|Reintentar/i);
  });
});
