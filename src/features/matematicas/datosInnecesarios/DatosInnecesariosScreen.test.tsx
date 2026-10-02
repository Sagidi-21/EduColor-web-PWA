import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { DatosInnecesariosScreen } from "./DatosInnecesariosScreen";
import { generateSession } from "../../../core/activities/datosInnecesarios";
import type { DatosInnecesariosExercise } from "../../../core/activities/datosInnecesarios";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("datosInnecesarios", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 1200;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const frases = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".di__frase"));

const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

const acertar = (c: HTMLElement, indice: number) => {
  const boton = c.querySelector<HTMLButtonElement>(`.di__frase[data-indice="${indice}"]`);
  if (!boton) throw new Error(`No hay frase con índice "${indice}"`);
  fireEvent.click(boton);
};

const fallar = (c: HTMLElement, ex: DatosInnecesariosExercise) => {
  const incorrecta = [0, 1, 2].find((i) => i !== ex.innecesario)!;
  acertar(c, incorrecta);
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("datosInnecesarios — las frases", () => {
  it("muestra las tres frases con su número y la pregunta", () => {
    const lista = generateSession("easy", 4242);
    const ex = lista[0]!;
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    expect(frases(container)).toHaveLength(3);
    expect(container.querySelector(".di__pregunta")?.textContent).toBe(ex.pregunta);
    for (let i = 0; i < 3; i++) {
      expect(frases(container)[i]!.dataset.indice).toBe(String(i));
      expect(frases(container)[i]!.textContent).toContain(ex.historia[i]);
    }
  });

  it("las frases terminan en punto o interrogación, como en el banco", () => {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as const) {
      const { container, unmount } = render(<DatosInnecesariosScreen {...props(dificultad)} />);
      const lista = generateSession(dificultad, 4242);
      for (const ex of lista) {
        for (const frase of ex.historia) {
          expect(frase).toMatch(/[.?]$/);
        }
        if (ex !== lista[lista.length - 1]) {
          acertar(container, ex.innecesario);
          runTimers(AUTOAVANCE_MS);
        }
      }
      unmount();
    }
  });
});

describe("datosInnecesarios — validación", () => {
  it("acertar marca la frase correcta y pasa sola al siguiente", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    acertar(container, lista[0]!.innecesario);

    expect(frases(container)[lista[0]!.innecesario]!.className).toContain("di__frase--correcta");
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1 / 10");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2 / 10");
    expect(container.querySelector(".di__pregunta")?.textContent).toBe(lista[1]!.pregunta);
  });

  it("fallar marca la frase pulsada, no la correcta, y no avanza solo", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    fallar(container, lista[0]!);

    expect(frases(container)[lista[0]!.innecesario]!.className).not.toContain(
      "di__frase--correcta",
    );
    expect(container.querySelector(".di__frase--fallada")).not.toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1 / 10");
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    fallar(container, ex);
    for (const boton of frases(container)) expect(boton.disabled).toBe(true);

    acertar(container, ex.innecesario);
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1 / 10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    fallar(container, ex);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".di__frase--fallada")).toBeNull();

    acertar(container, ex.innecesario);
    expect(frases(container)[ex.innecesario]!.className).toContain("di__frase--correcta");
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    fallar(container, lista[0]!);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2 / 10");
    expect(container.querySelector(".di__frase--fallada")).toBeNull();
  });

  it("acertar tras fallar no puntúa doble", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    fallar(container, lista[0]!);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.innecesario);
    runTimers(AUTOAVANCE_MS);
    for (const ex of lista.slice(1)) {
      acertar(container, ex.innecesario);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });

  it("acertar los diez muestra la nota máxima", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.innecesario);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("10/10");
  });
});

describe("datosInnecesarios — determinismo y salida", () => {
  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.innecesario);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(container.querySelector(".di__pregunta")?.textContent).toBe(lista[0]!.pregunta);
    expect(container.querySelector(".di__frase--correcta")).toBeNull();
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DatosInnecesariosScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".di__pregunta")?.textContent).toBe(ex.pregunta);
  });
});
