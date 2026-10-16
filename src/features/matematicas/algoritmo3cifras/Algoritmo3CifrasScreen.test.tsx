import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Algoritmo3CifrasScreen } from "./Algoritmo3CifrasScreen";
import { llamadas, generateSession, resultDigits } from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

/**
 * Tests de la pantalla (flujo U→llevar→D→llevar→C, split 2/3–1/3).
 * La comprobación es automática al rellenar la última casilla.
 */

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("algoritmo3cifras", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const sesion = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

function primerEjercicio(difficulty: EngineScreenProps["difficulty"], seed = 4242) {
  const ex = sesion(difficulty, seed)[0];
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} está vacía`);
  return ex;
}

function progreso(container: HTMLElement): string {
  return (container.textContent ?? "").match(/\d+\s*\/\s*\d+/)?.[0] ?? "";
}

const numpad = (container: HTMLElement) => container.querySelector(".shared-numpad")!;

function tecla(container: HTMLElement, t: string) {
  const boton = Array.from(
    numpad(container).querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
  ).find((k) => k.textContent === t);
  if (!boton) throw new Error(`El Numpad no tiene la tecla "${t}"`);
  fireEvent.click(boton);
}

const box = (container: HTMLElement, title: string) => {
  const el = Array.from(container.querySelectorAll<HTMLButtonElement>(".a3c__box")).find(
    (b) => b.getAttribute("title") === title,
  );
  if (!el) throw new Error(`No hay casilla «${title}»`);
  return el;
};

/**
 * Flujo completo: U → llevar D → D → llevar C → C.
 * Las llevadas se rellenan con "0" (no se corrigen; solo el resultado cuenta).
 */
function escribirFlujo(container: HTMLElement, n: number) {
  const padded = String(n).padStart(3, "0");
  const [c, d, u] = padded.split("");
  for (const digit of [u!, "0", d!, "0", c!]) {
    tecla(container, digit);
  }
}

const acertar = (container: HTMLElement, n: number) => escribirFlujo(container, n);
const fallar = (container: HTMLElement, n: number) => escribirFlujo(container, n);

function avanzarHasta(container: HTMLElement, indice: number): Algoritmo3Exercise {
  const lista = sesion("expert", 4242);
  for (let i = 0; i < indice; i++) {
    acertar(container, lista[i]!.result);
    runTimers(AUTOAVANCE_MS);
  }
  return lista[indice]!;
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

describe("algoritmo3cifras — layout pizarra", () => {
  it("no muestra enunciado de texto arriba", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    expect(container.querySelector(".a3c__question")).toBeNull();
  });

  it("parte 2/3–1/3 con numpad y casilla de unidades activa", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    expect(container.querySelector(".a3c__body--split")).not.toBeNull();
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(box(container, "Unidades").className).toContain("a3c__box--active");
    expect(Array.from(container.querySelectorAll(".a3c__box--active"))).toHaveLength(1);
  });

  it("dibuja las cifras de los dos operandos y rótulos C D U", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    const digitos = Array.from(container.querySelectorAll(".a3c__digit")).map((d) => d.textContent);
    expect(digitos).toEqual([
      String(ex.aC),
      String(ex.aD),
      String(ex.aU),
      String(ex.bC),
      String(ex.bD),
      String(ex.bU),
    ]);
    expect(
      Array.from(container.querySelectorAll(".a3c__col-label")).map((r) => r.textContent),
    ).toEqual(["C", "D", "U"]);
  });

  it("100 semillas × 4 niveles: C·D·U en pantalla = cifras reales (ceros incluidos)", () => {
    // Regresión: `n || ""` ocultaba el 0 (p. ej. 279+101 se veía como 1_1).
    const niveles = ["easy", "medium", "hard", "expert"] as const;
    let conCero = 0;

    for (let seed = 1; seed <= 100; seed++) {
      for (const nivel of niveles) {
        const ex = generateSession(nivel, seed)[0]!;
        const { container, unmount } = render(<Algoritmo3CifrasScreen {...props(nivel, seed)} />);
        const digitos = Array.from(container.querySelectorAll(".a3c__digit")).map(
          (d) => d.textContent,
        );
        expect(digitos, `${nivel}/${seed} ${ex.a}${ex.op}${ex.b}`).toEqual([
          String(ex.aC),
          String(ex.aD),
          String(ex.aU),
          String(ex.bC),
          String(ex.bD),
          String(ex.bU),
        ]);
        expect(digitos.join(""), `${nivel}/${seed}`).toBe(
          `${ex.aC}${ex.aD}${ex.aU}${ex.bC}${ex.bD}${ex.bU}`,
        );
        // Ninguna celda vacía: un 0 debe leerse como "0".
        for (const celda of digitos) {
          expect(celda, `${nivel}/${seed}`).toMatch(/^[0-9]$/);
        }
        if ([ex.aC, ex.aD, ex.aU, ex.bC, ex.bD, ex.bU].includes(0)) conCero++;
        unmount();
      }
    }
    // Asegura que el muestreo sí ejerció el caso del cero (si no, el test no sirve).
    expect(conCero).toBeGreaterThan(0);
  });

  it("al sumar rotula llevar y al restar prestar", () => {
    const lista = sesion("expert", 4242);
    const indiceResta = lista.findIndex((e) => e.op === "-");
    expect(indiceResta).toBeGreaterThanOrEqual(0);

    const suma = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    expect(suma.container.querySelector(".a3c__carry-label")?.textContent).toBe("llevar");
    expect(suma.container.querySelector(".a3c__op")?.textContent).toBe("+");
    suma.unmount();

    const resta = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    const ex = avanzarHasta(resta.container, indiceResta);
    expect(ex.op).toBe("-");
    expect(resta.container.querySelector(".a3c__carry-label")?.textContent).toBe("prestar");
    expect(resta.container.querySelector(".a3c__op")?.textContent).toBe("−");
  });
});

describe("algoritmo3cifras — flujo y comprobación automática", () => {
  it("autoavanza U → llevar → D → llevar → C y valida al terminar", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const [c, d, u] = resultDigits(ex);

    expect(box(container, "Unidades").className).toContain("a3c__box--active");
    tecla(container, u);
    expect(box(container, "Llevar a decenas").className).toContain("a3c__box--active");
    tecla(container, "0");
    expect(box(container, "Decenas").className).toContain("a3c__box--active");
    tecla(container, d);
    expect(box(container, "Llevar a centenas").className).toContain("a3c__box--active");
    tecla(container, "0");
    expect(box(container, "Centenas").className).toContain("a3c__box--active");
    tecla(container, c);

    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
    expect(container.querySelector(".a3c__body")?.className).toContain("a3c__body--correct");
    expect(container.querySelector("#cco-comprobar")).toBeNull();
  });

  it("acierto: celebra sin marcar cifras sueltas y avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, ex.result);

    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
    for (const el of container.querySelectorAll(".a3c__box")) {
      expect(el.className).not.toMatch(/wrong/);
    }

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallo: no celebra, no dice en qué cifra falló y no avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);

    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".a3c__body")?.className).toContain("a3c__body--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".shared-numpad")).toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("fallar solo en las decenas falla el ejercicio entero", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const [c, d, u] = resultDigits(ex);
    fallar(container, Number(`${c}${(Number(d) + 1) % 10}${u}`));

    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".a3c__body")?.className).toContain("a3c__body--wrong");
  });
});

describe("algoritmo3cifras — reintentar", () => {
  it("reintentar vacía las casillas y deja volver a contestar", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".a3c__body")?.className).not.toContain("a3c__body--wrong");
    expect(box(container, "Unidades").className).toContain("a3c__box--active");
    expect(box(container, "Unidades").textContent).toBe("_");
    expect(container.querySelector(".shared-numpad")).not.toBeNull();

    acertar(container, ex.result);
    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(box(container, "Unidades").className).toContain("a3c__box--active");
  });

  it("acertar después de fallar no puntúa", () => {
    const lista = sesion("easy", 4242);
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, lista[0]!.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.result);
    runTimers(AUTOAVANCE_MS);

    for (const ex of lista.slice(1)) {
      acertar(container, ex.result);
      runTimers(AUTOAVANCE_MS);
    }

    const resumen = container.querySelector(".summary");
    if (!resumen) throw new Error("No se ha montado el resumen al terminar la sesión");
    expect(resumen.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });
});

describe("algoritmo3cifras — determinismo, resumen y salida", () => {
  it("repetir regenera la misma sesión", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const lista = sesion("easy", 4242);

    for (const ex of lista) {
      acertar(container, ex.result);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(progreso(container)).toBe("1/10");
    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
  });

  it("el botón de salir avisa", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
  });

  it("la rejilla que se monta es la que dice el núcleo", () => {
    const ex = sesion("expert", 4242).find((e) => e.op === "-");
    if (!ex) throw new Error("La sesión expert/4242 no tiene ninguna resta");
    expect(llamadas(ex.op, ex.a, ex.b)).toEqual({ carryUD: ex.carryUD, carryDC: ex.carryDC });
    expect(ex.result).toBe(ex.a - ex.b);
    expect(resultDigits(ex).join("")).toBe(String(ex.result));
  });

  it("no monta numpad y lienzo a la vez", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });
});
