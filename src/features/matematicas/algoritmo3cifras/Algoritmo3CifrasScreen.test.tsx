import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Algoritmo3CifrasScreen } from "./Algoritmo3CifrasScreen";
import { llamadas, generateSession } from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("algoritmo3cifras", mockOnExit, difficulty, seed);

/** El renderer salta de ejercicio solo tras acertar; 900 ms es su espera. */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".a3c__opt"));

const sesion = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

function primerEjercicio(difficulty: EngineScreenProps["difficulty"], seed = 4242) {
  const ex = sesion(difficulty, seed)[0];
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} está vacía`);
  return ex;
}

/** Un ejercicio de la sesión con la operación pedida. */
function primerDeOperacion(
  difficulty: EngineScreenProps["difficulty"],
  op: "+" | "-",
  seed = 4242,
): Algoritmo3Exercise {
  const ex = sesion(difficulty, seed).find((e) => e.op === op);
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} no tiene ninguna operación "${op}"`);
  return ex;
}

/** Avanza hasta el índice pedido acertando los anteriores, y devuelve el ejercicio. */
function avanzarHasta(container: HTMLElement, indice: number) {
  const lista = sesion("expert", 4242);
  for (let i = 0; i < indice; i++) {
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#a3c-opt-${lista[i].correctAnswer}`)!,
    );
    runTimers(AUTOAVANCE_MS);
  }
  return lista[indice];
}

const acertar = (c: HTMLElement, valor: string) => {
  const boton = c.querySelector<HTMLButtonElement>(`#a3c-opt-${valor}`);
  if (!boton) throw new Error(`No hay ninguna opción con el valor "${valor}"`);
  fireEvent.click(boton);
};

/** Una opción que no sea la correcta. */
function otra(ex: Algoritmo3Exercise): string {
  const distinta = ex.options.find((o) => o !== ex.correctAnswer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta;
}

/** El progreso de la cabecera, "3 / 10". */
function progreso(container: HTMLElement): string {
  return (container.textContent ?? "").match(/\d+\s*\/\s*\d+/)?.[0] ?? "";
}

/** Las cifras de una fila del algoritmo, en el orden en que se pintan. */
function fila(container: HTMLElement, indice: number): string[] {
  const fila = container.querySelectorAll(".a3c__algo .a3c__row")[indice];
  if (!fila) throw new Error(`La fila ${indice} no está en la rejilla`);
  return Array.from(fila.querySelectorAll(".a3c__cell, .a3c__result-cell")).map(
    (c) => c.textContent ?? "",
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("algoritmo3cifras — la operación en columnas", () => {
  it("dibuja las cifras de los dos sumandos en su columna", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    // Las filas con cifras van en este orden: sumando A, sumando B y resultado. La de
    // llevadas se intercala delante, pero solo al sumar, así que desplaza el índice.
    const base = ex.op === "+" ? 1 : 0;
    expect(fila(container, base)).toEqual([String(ex.aC), String(ex.aD), String(ex.aU)]);
    expect(fila(container, base + 1)).toEqual([String(ex.bC), String(ex.bD), String(ex.bU)]);
  });

  it("los rótulos C, D y U están encima de las columnas", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const rotulos = Array.from(container.querySelectorAll(".a3c__cell--label")).map(
      (r) => r.textContent,
    );
    expect(rotulos).toEqual(["C", "D", "U"]);
  });

  it("el resultado aparece con interrogantes hasta que se contesta", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const resultado = container.querySelectorAll(".a3c__result-cell");
    expect(resultado).toHaveLength(3);
    for (const celda of resultado) expect(celda.textContent).toBe("?");
  });

  it("el signo de la operación es el que toca", () => {
    const suma = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    expect(suma.container.querySelector(".a3c__op-symbol")?.textContent).toBe("+");
    suma.unmount();

    const lista = sesion("expert", 4242);
    const indice = lista.findIndex((e) => e.op === "-");
    const resta = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    const ex = avanzarHasta(resta.container, indice);
    expect(ex.op).toBe("-");
    expect(resta.container.querySelector(".a3c__op-symbol")?.textContent).toBe("−");
  });

  it("el enunciado escrito coincide con la operación de la rejilla", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    expect(container.querySelector(".a3c__question")?.textContent).toBe(ex.question);
  });
});

describe("algoritmo3cifras — la fila de llevadas", () => {
  it("medium dibuja un 1 solo sobre las decenas", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<Algoritmo3CifrasScreen {...props("medium")} />);

    const filaLlevadas = container.querySelector('[data-testid="a3c-fila-llevadas"]')!;
    expect(filaLlevadas).not.toBeNull();
    const unos = Array.from(filaLlevadas.querySelectorAll(".a3c__carry"))
      .map((c) => c.textContent)
      .filter((t) => t === "1");
    expect(unos).toHaveLength(1);
    expect(ex.carryUD).toBe(true);
    expect(ex.carryDC).toBe(false);
  });

  it("hard dibuja un 1 solo sobre las centenas", () => {
    const ex = primerEjercicio("hard");
    const { container } = render(<Algoritmo3CifrasScreen {...props("hard")} />);

    const filaLlevadas = container.querySelector('[data-testid="a3c-fila-llevadas"]')!;
    const unos = Array.from(filaLlevadas.querySelectorAll(".a3c__carry")).filter(
      (c) => c.textContent === "1",
    );
    expect(unos).toHaveLength(1);
    expect(ex.carryDC).toBe(true);
    expect(ex.carryUD).toBe(false);
  });

  it("expert suma dibuja los dos unos", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    const lista = sesion("expert", 4242);
    const indice = lista.findIndex((e) => e.op === "+");
    const ex = avanzarHasta(container, indice);

    expect(ex.op).toBe("+");
    const unos = Array.from(
      container.querySelectorAll('[data-testid="a3c-fila-llevadas"] .a3c__carry'),
    ).filter((c) => c.textContent === "1");
    expect(unos).toHaveLength(2);
  });

  it("la resta no dibuja fila de llevadas", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    const lista = sesion("expert", 4242);
    const indice = lista.findIndex((e) => e.op === "-");
    avanzarHasta(container, indice);

    expect(container.querySelector('[data-testid="a3c-fila-llevadas"]')).toBeNull();
  });

  it("las llevadas dibujadas son las que dicen las cifras del ejercicio", () => {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as const) {
      const lista = sesion(dificultad, 4242);
      const { container, unmount } = render(<Algoritmo3CifrasScreen {...props(dificultad)} />);
      // Se mira el primer ejercicio de sumas de la sesión, que es lo que hay
      // montado; las restas se comprueban en el bloque deexpert.
      const ex = lista[0];
      const filaLlevadas = container.querySelector('[data-testid="a3c-fila-llevadas"]');
      if (ex.op === "+") {
        const unos = Array.from(filaLlevadas!.querySelectorAll(".a3c__carry")).filter(
          (c) => c.textContent === "1",
        ).length;
        expect(unos, `${dificultad} ${ex.question}`).toBe(
          (ex.carryUD ? 1 : 0) + (ex.carryDC ? 1 : 0),
        );
      }
      unmount();
    }
  });
});

describe("algoritmo3cifras — responder", () => {
  it("acierto: marca la opción, celebra, enseña el resultado y avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, ex.correctAnswer);

    expect(container.querySelector(".a3c__opt--correct")?.textContent).toBe(ex.correctAnswer);
    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
    expect(container.querySelector(".a3c__stage")?.className).toContain("a3c__stage--correct");

    const resultado = Array.from(container.querySelectorAll(".a3c__result-cell")).map(
      (c) => c.textContent,
    );
    expect(resultado.join("")).toBe(ex.correctAnswer);

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2 / 10");
  });

  it("fallo: marca la elegida, enseña el resultado y no avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));

    expect(container.querySelector(".a3c__opt--wrong")).not.toBeNull();
    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".a3c__stage")?.className).toContain("a3c__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    const resultado = Array.from(container.querySelectorAll(".a3c__result-cell")).map(
      (c) => c.textContent,
    );
    expect(resultado.join("")).toBe(ex.correctAnswer);

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1 / 10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".a3c__opt--wrong")).toBeNull();

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".a3c__opt--correct")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2 / 10");
    expect(container.querySelector(".a3c__opt--wrong")).toBeNull();
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    for (const boton of opciones(container)) expect(boton.disabled).toBe(true);

    fireEvent.click(container.querySelector<HTMLButtonElement>(`#a3c-opt-${ex.correctAnswer}`)!);
    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(progreso(container)).toBe("1 / 10");
  });

  it("monta cuatro opciones, la correcta entre ellas", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    expect(opciones(container)).toHaveLength(4);
    expect(opciones(container).map((b) => b.dataset.value)).toEqual(ex.options);
  });
});

describe("algoritmo3cifras — determinismo, resumen y salida", () => {
  it("no monta Numpad ni DigitCell: la actividad es de opción múltiple", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });

  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const lista = sesion("easy", 4242);

    for (const ex of lista) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(container.querySelector(".a3c__question")?.textContent).toBe(lista[0].question);
    expect(container.querySelector(".a3c__opt--correct")).toBeNull();
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".a3c__question")?.textContent).toBe(ex.question);
  });

  it("la rejilla que se monta es la que dice el núcleo, operación incluida", () => {
    const ex = primerDeOperacion("expert", "-");
    expect(llamadas(ex.op, ex.a, ex.b)).toEqual({ carryUD: ex.carryUD, carryDC: ex.carryDC });
    expect(ex.result).toBe(ex.a - ex.b);
  });
});
