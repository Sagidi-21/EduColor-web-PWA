import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Algoritmo3CifrasScreen } from "./Algoritmo3CifrasScreen";
import { llamadas, generateSession, resultDigits } from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

/**
 * Tests de la pantalla, no de la operación.
 *
 * La operación encolumnada (casillas de llevar, bandeja, numpad) tiene sus tests
 * en `ColumnCarryOperation.test.tsx`. Aquí solo se comprueba lo que la pantalla
 * decide: qué exercise va, cuándo se da por bueno o fallado, y que el resultado
 * no se juzgue cifra a cifra.
 */

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

const sesion = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

function primerEjercicio(difficulty: EngineScreenProps["difficulty"], seed = 4242) {
  const ex = sesion(difficulty, seed)[0];
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} está vacía`);
  return ex;
}

/** Avanza hasta el índice pedido acertando los anteriores, y devuelve el ejercicio. */
function avanzarHasta(container: HTMLElement, indice: number): Algoritmo3Exercise {
  const lista = sesion("expert", 4242);
  for (let i = 0; i < indice; i++) {
    acertar(container, lista[i].result);
    runTimers(AUTOAVANCE_MS);
  }
  return lista[indice]!;
}

/** El progreso de la cabecera, "3/10". */
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

/**
 * Escribe un resultado tal y como lo escribiría el niño: empezando por las
 * unidades, porque las casillas se rellenan de derecha a izquierda.
 */
function escribirResultado(container: HTMLElement, n: number) {
  String(n)
    .split("")
    .reverse()
    .forEach((d) => tecla(container, d));
}

const comprobar = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>("#cco-comprobar")!;

/** Escribe el resultado correcto y lo comprueba: el ejercicio queda resuelto. */
const acertar = (container: HTMLElement, n: number) => {
  escribirResultado(container, n);
  fireEvent.click(comprobar(container));
};

/** Escribe un resultado equivocado y lo comprueba. */
const fallar = (container: HTMLElement, n: number) => {
  escribirResultado(container, n);
  fireEvent.click(comprobar(container));
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

describe("algoritmo3cifras — el enunciado", () => {
  it("el enunciado escrito coincide con la operación de la rejilla", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    expect(container.querySelector(".a3c__question")?.textContent).toBe(ex.question);
  });

  it("dibuja las cifras de los dos sumandos en su columna", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    const filas = container.querySelectorAll(".cco__row .cco__digit");
    expect(Array.from(filas).map((f) => f.textContent)).toEqual([
      String(ex.aC),
      String(ex.aD),
      String(ex.aU),
      String(ex.bC),
      String(ex.bD),
      String(ex.bU),
    ]);
  });

  it("los rótulos C, D y U están encima de las columnas", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const rotulos = Array.from(container.querySelectorAll(".cco__col-label")).map(
      (r) => r.textContent,
    );
    expect(rotulos).toEqual(["C", "D", "U"]);
  });

  it("las casillas del resultado están vacías y el cursor está en las unidades", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    const casillas = container.querySelectorAll(".cco__result-cell");
    expect(casillas).toHaveLength(3);
    expect(container.querySelector("#cco-cifra-2")?.className).toContain(
      "cco__result-cell--active",
    );
    // La primera casilla de derecha a izquierda, las centenas, sin cursor y vacía.
    expect(container.querySelector("#cco-cifra-0")?.textContent).toBe("");
  });

  it("al sumar rotula las casillas de llevar y al restar, de prestar", () => {
    const lista = sesion("expert", 4242);
    const indiceResta = lista.findIndex((e) => e.op === "-");
    expect(indiceResta).toBeGreaterThanOrEqual(0);

    const suma = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    expect(suma.container.querySelector(".cco__carry-label")?.textContent).toBe("llevar");
    expect(suma.container.querySelector(".cco__op-symbol")?.textContent).toBe("+");
    suma.unmount();

    const resta = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    const ex = avanzarHasta(resta.container, indiceResta);
    expect(ex.op).toBe("-");
    expect(resta.container.querySelector(".cco__carry-label")?.textContent).toBe("prestar");
    expect(resta.container.querySelector(".cco__op-symbol")?.textContent).toBe("−");
  });

  it("las casillas de llevar existen siempre,RESTA incluida: es el niño quien decide", () => {
    const lista = sesion("expert", 4242);
    const indiceResta = lista.findIndex((e) => e.op === "-");
    const resta = render(<Algoritmo3CifrasScreen {...props("expert")} />);
    avanzarHasta(resta.container, indiceResta);

    // Antes las llevadas venían dadas por el generador. Ahora la casilla está
    // siempre, y vacía: escribirla o no es parte del razonamiento del niño.
    const casillas = resta.container.querySelector('[data-testid="cco-fila-llevar"]')!;
    expect(casillas.querySelectorAll(".cco__carry-slot")).toHaveLength(2);
    expect(casillas.querySelector("#cco-llevar-0")?.textContent).toBe("·");
    expect(casillas.querySelector("#cco-llevar-1")?.textContent).toBe("·");
  });
});

describe("algoritmo3cifras — una sola comprobación", () => {
  it("no deja comprobar hasta que las tres casillas están rellenas", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    expect(comprobar(container).disabled).toBe(true);
    tecla(container, "3");
    expect(comprobar(container).disabled).toBe(true);
    tecla(container, "3");
    expect(comprobar(container).disabled).toBe(true);
    tecla(container, "6");
    expect(comprobar(container).disabled).toBe(false);
  });

  it("acierto: celebra, no marca casillas sueltas y avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    acertar(container, ex.result);

    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
    expect(container.querySelector(".a3c__stage")?.className).toContain("a3c__stage--correct");
    // El veredicto es del ejercicio entero, no de una cifra.
    for (const i of [0, 1, 2]) {
      expect(container.querySelector(`#cco-cifra-${i}`)?.className).not.toMatch(/correct|wrong/);
    }
    expect(container.querySelector(".a3c__cheer")).not.toBeNull();

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallo: no celebra, no dice en qué cifra falló y no avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);

    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".a3c__stage")?.className).toContain("a3c__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    // Lo esencial: ni una casilla con marca, ni texto que señale la cifra.
    for (const i of [0, 1, 2]) {
      expect(container.querySelector(`#cco-cifra-${i}`)?.className).not.toMatch(/correct|wrong/);
    }
    expect(container.querySelector(".cco__explain, .cco__error, .cco__fallo")).toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("fallar solo en las decenas falla el ejercicio entero", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    const [c, d] = resultDigits(ex);
    // Se escribe bien la cifra de las centenas y mal la de las decenas.
    fallar(container, Number(`${c}${(Number(d) + 1) % 10}${resultDigits(ex)[2]}`));

    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(container.querySelector(".a3c__stage")?.className).toContain("a3c__stage--wrong");
  });

  it("no deja comprobar dos veces el mismo ejercicio", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);
    // Con el veredicto ya dado, ni el botón ni la ✓ hacen nada.
    expect(comprobar(container).disabled).toBe(true);
    tecla(container, "✓");
    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(progreso(container)).toBe("1/10");
  });

  it("la casilla de llevar no cuenta para poder comprobar", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    // Se escribe la casilla de llevar y las tres principales siguen vacías.
    fireEvent.click(container.querySelector<HTMLButtonElement>("#cco-llevar-1")!);
    tecla(container, "1");

    expect(comprobar(container).disabled).toBe(true);
  });

  it("las casillas de llevar no se corrigen: quedan escritas aunque el ejercicio falle", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fireEvent.click(container.querySelector<HTMLButtonElement>("#cco-llevar-1")!);
    tecla(container, "7");
    fallar(container, ex.result + 1);

    expect(container.querySelector("#cco-llevar-1")?.textContent).toBe("7");
    expect(container.querySelector("#cco-llevar-1")?.className).not.toMatch(/correct|wrong/);
  });
});

describe("algoritmo3cifras — reintentar", () => {
  it("reintentar vacía las casillas y deja volver a contestar", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".a3c__stage")?.className).not.toContain("a3c__stage--wrong");
    expect(comprobar(container).disabled).toBe(true);
    expect(container.querySelector("#cco-cifra-0")?.textContent).toBe("");

    acertar(container, ex.result);
    expect(container.querySelector(".a3c__cheer")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("reintentar también vacía las casillas de llevar", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fireEvent.click(container.querySelector<HTMLButtonElement>("#cco-llevar-0")!);
    tecla(container, "1");
    fallar(container, 999);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector("#cco-llevar-0")?.textContent).toBe("·");
  });

  it("el botón de siguiente avanza tras un fallo y limpia la operación", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    fallar(container, ex.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".a3c__stage")?.className).not.toContain("a3c__stage--wrong");
    expect(container.querySelector("#cco-cifra-2")?.className).toContain(
      "cco__result-cell--active",
    );
  });

  it("acertar después de fallar no puntúa doble", () => {
    const lista = sesion("easy", 4242);
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);

    // El primer ejercicio se falla, se reintenta y se acierta. Aun así no cuenta:
    // el niño tuvo que pasar por el fallo para conocer el resultado.
    fallar(container, lista[0]!.result + 1);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.result);
    runTimers(AUTOAVANCE_MS);

    for (const ex of lista.slice(1)) {
      acertar(container, ex.result);
      runTimers(AUTOAVANCE_MS);
    }

    // Diez ejercicios, nueve acertados: el primero se cuenta como fallado.
    const resumen = container.querySelector(".summary");
    if (!resumen) throw new Error("No se ha montado el resumen al terminar la sesión");
    expect(resumen.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });
});

describe("algoritmo3cifras — determinismo, resumen y salida", () => {
  it("repetir regenera la misma sesión, con la misma semilla", () => {
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

    expect(container.querySelector(".a3c__question")?.textContent).toBe(lista[0]!.question);
    expect(container.querySelector(".a3c__cheer")).toBeNull();
    expect(comprobar(container).disabled).toBe(true);
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
    const ex = sesion("expert", 4242).find((e) => e.op === "-");
    if (!ex) throw new Error("La sesión expert/4242 no tiene ninguna resta");
    expect(llamadas(ex.op, ex.a, ex.b)).toEqual({ carryUD: ex.carryUD, carryDC: ex.carryDC });
    expect(ex.result).toBe(ex.a - ex.b);
    // `resultDigits` es lo que el niño tiene que acabar escribiendo.
    expect(resultDigits(ex).join("")).toBe(String(ex.result));
  });

  it("no monta ni numpad ni lienzo a la vez: manda el modo elegido", () => {
    const { container } = render(<Algoritmo3CifrasScreen {...props("easy")} />);
    // Por defecto está en numpad, así que no hay lienzo montado.
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector('[data-testid="cco-lienzo"]')).toBeNull();
  });
});
