import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Abaco3CifrasScreen } from "./Abaco3CifrasScreen";
import { generateSession } from "../../../core/activities/abaco3cifras";
import type { AbacoExercise } from "../../../core/activities/abaco3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("abaco3cifras", mockOnExit, difficulty, seed);

/** El renderer salta de ejercicio solo tras acertar; 900 ms es su espera. */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".aba__opt"));

/** La sesión completa con la que se ha montado la pantalla. */
const sesion = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

/**
 * Avanza hasta el índice indicado acertando cada ejercicio anterior, y devuelve
 * el ejercicio al que se ha llegado.
 */
function avanzarHasta(container: HTMLElement, indice: number) {
  const lista = sesion("hard", 4242);
  for (let i = 0; i < indice; i++) {
    const previo = lista[i];
    const boton = opciones(container).find(
      (b) =>
        b.dataset.value === previo.correctAnswer || b.textContent?.trim() === previo.correctAnswer,
    );
    if (!boton) throw new Error(`No se encuentra la opción correcta del ejercicio ${i}`);
    fireEvent.click(boton);
    runTimers(AUTOAVANCE_MS);
  }
  return lista[indice];
}

/** Pulsa la opción con ese valor, tanto si es número como si es ábaco. */
function acertar(c: HTMLElement, valor: string) {
  const boton = opciones(c).find(
    (b) => b.dataset.value === valor || b.textContent?.trim() === valor,
  );
  if (!boton) throw new Error(`No hay ninguna opción con el valor "${valor}"`);
  fireEvent.click(boton);
}

/** Una opción que no sea la correcta. */
function otra(ex: AbacoExercise): string {
  const distinta = ex.options.find((o) => o !== ex.correctAnswer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta;
}

/**
 * Las bolitas de un ábaco montado, agrupadas por columna.
 * Las bolitas de una misma columna comparten `cx`, así que se cuentan por `cx`
 * y se ordenan de izquierda a derecha: `[columna Centennial, decena, unidad]`.
 */
function columnasDe(contenedor: Element): number[] {
  const porX = new Map<number, number>();
  for (const b of contenedor.querySelectorAll<SVGCircleElement>(".aba__bolita")) {
    const cx = Number(b.getAttribute("cx"));
    porX.set(cx, (porX.get(cx) ?? 0) + 1);
  }
  return [...porX.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n);
}

/** Las columnas que deberían verse, ignorando las vacías. */
const columnasEsperadas = (ex: AbacoExercise) =>
  [ex.centenas, ex.decenas, ex.unidades].filter((n) => n > 0);

interface Caja {
  w: number;
  h: number;
  puntos: { cx: number; cy: number; r: number }[];
}

/** Cada ábaco montado, con su `viewBox` y las bolitas que contiene. */
function cajasDe(container: Element): Caja[] {
  return Array.from(container.querySelectorAll<SVGSVGElement>(".aba__svg")).map((s) => {
    const [, , w, h] = (s.getAttribute("viewBox") ?? "").split(" ").map(Number);
    return {
      w,
      h,
      puntos: Array.from(s.querySelectorAll<SVGCircleElement>(".aba__bolita")).map((b) => ({
        cx: Number(b.getAttribute("cx")),
        cy: Number(b.getAttribute("cy")),
        r: Number(b.getAttribute("r")),
      })),
    };
  });
}

/**
 * El progreso que muestra la cabecera, "3/10".
 *
 * Es la única señal fiable de que se ha avanzado: la pregunta de `read-abaco` es
 * literalmente la misma en los diez ejercicios, así que comparar su texto no
 * distingue un cambio de ejercicio de quedarse en el mismo.
 */
function progreso(container: HTMLElement): string {
  const texto = container.textContent ?? "";
  return texto.match(/\d+\s*\/\s*\d+/)?.[0] ?? "";
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

describe("abaco3cifras — lectura del ábaco", () => {
  it("muestra la pregunta, el ábaco grande y cuatro opciones numéricas", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    expect(container.querySelector(".aba__question")?.textContent).toBe(ex.question);
    expect(container.querySelector(".aba__abacus")).not.toBeNull();
    expect(opciones(container)).toHaveLength(4);
    expect(opciones(container).map((b) => b.textContent?.trim())).toEqual(ex.options);
    expect(container.querySelector(".aba__opt--abaco")).toBeNull();
  });

  it("el ábaco grande tiene tantas bolitas como columnas tiene el número", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    expect(columnasDe(container.querySelector(".aba__abacus")!)).toEqual(columnasEsperadas(ex));
  });

  it("los rótulos C, D y U están siempre en el ábaco grande", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);
    const textos = Array.from(container.querySelectorAll(".aba__abacus .aba__svg text")).map(
      (t) => t.textContent,
    );
    expect(textos).toEqual(["C", "D", "U"]);
  });

  it("acierto: marca la opción correcta, celebra y avanza solo", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    acertar(container, ex.correctAnswer);

    expect(container.querySelector(".aba__opt--correct")?.textContent?.trim()).toBe(
      ex.correctAnswer,
    );
    expect(container.querySelector(".aba__cheer")).not.toBeNull();
    expect(container.querySelector(".aba__stage")?.className).toContain("aba__stage--correct");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallo: marca la elegida, ofrece reintentar y no avanza solo", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));

    expect(container.querySelector(".aba__opt--wrong")).not.toBeNull();
    expect(container.querySelector(".aba__cheer")).toBeNull();
    expect(container.querySelector(".aba__stage")?.className).toContain("aba__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".aba__opt--wrong")).toBeNull();

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".aba__opt--correct")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".aba__opt--wrong")).toBeNull();
  });
});

describe("abaco3cifras — ningún ábaco se recorta", () => {
  /**
   * Regresión del recorte. En Electron el `viewBox` medía 220 de alto y las
   * bolitas se apilaban desde la base hacia arriba: con nueve bolitas la última
   * caía en `cy = -70`, por encima del recuadro, y la columna llena se cortaba
   * justo en el caso que la actividad pretende enseñar. Ahora el alto sale de
   * las nueve bolitas que caben en la columna, así que ninguna se sale.
   */
  it("ninguna bolita se sale por ningún borde de su ábaco", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("expert")} />);

    const cajas = cajasDe(container);
    expect(cajas.length).toBeGreaterThan(0);
    for (const caja of cajas) {
      for (const p of caja.puntos) {
        expect(p.cy - p.r, `bolita por encima (cy=${p.cy}, r=${p.r})`).toBeGreaterThanOrEqual(0);
        expect(p.cy + p.r, `bolita por debajo (cy=${p.cy}, r=${p.r})`).toBeLessThanOrEqual(caja.h);
        expect(p.cx - p.r, `bolita a la izquierda (cx=${p.cx})`).toBeGreaterThanOrEqual(0);
        expect(p.cx + p.r, `bolita a la derecha (cx=${p.cx})`).toBeLessThanOrEqual(caja.w);
      }
    }
  });

  it("el ábaco grande es lo bastante alto para la columna llena", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("expert")} />);
    const [caja] = cajasDe(container.querySelector(".aba__abacus")!);
    const másAlta = Math.min(...caja.puntos.map((p) => p.cy - p.r));

    // Si el alto fuese el fijo de Electron (220), la novena bolita caería en -70.
    expect(másAlta, "ninguna bolita puede quedar fuera del recuadro").toBeGreaterThanOrEqual(0);
    expect(caja.h).toBeGreaterThan(220);
  });

  it("las cajas de opción miden lo mismo, para que los ábacos sean comparables", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("hard")} />);
    const alturas = cajasDe(container).map((c) => c.h);
    expect(alturas.length).toBeGreaterThan(0);
    expect(new Set(alturas).size, `alturas distintas: ${alturas.join(", ")}`).toBe(1);
    expect(new Set(cajasDe(container).map((c) => c.w)).size).toBe(1);
  });

  it("ninguna columna del ábaco grande pasa de nueve bolitas", () => {
    // El recuadro está dimensionado para nueve bolitas por columna: si algún
    // ejercicio pintara más, la columna se saldría del ábaco.
    const { container } = render(<Abaco3CifrasScreen {...props("expert")} />);
    const columnas = columnasDe(container.querySelector(".aba__abacus")!);

    expect(columnas.length).toBeGreaterThan(0);
    for (const n of columnas) expect(n).toBeLessThanOrEqual(9);
    expect(columnas).toEqual(columnasEsperadas(sesion("expert")[0]));
  });
});

describe("abaco3cifras — elegir el ábaco del número", () => {
  it("muestra el número en primary y cuatro ábacos en fila, sin número suelto", () => {
    const lista = sesion("hard", 4242);
    const indice = lista.findIndex((e) => e.type === "find-abaco");
    const { container } = render(<Abaco3CifrasScreen {...props("hard")} />);
    const ex = avanzarHasta(container, indice);

    expect(ex.type).toBe("find-abaco");
    expect(container.querySelector(".aba__number-badge")).toBeNull();
    expect(container.querySelector(".aba__abacus")).toBeNull();
    expect(container.querySelector(".aba__question--find")).not.toBeNull();
    expect(container.querySelector(".aba__question-num")?.textContent).toBe(String(ex.number));
    expect(container.querySelector(".aba__body--find")).not.toBeNull();
    expect(opciones(container)).toHaveLength(4);
    expect(container.querySelectorAll(".aba__opt--abaco")).toHaveLength(4);
  });

  it("cada opción dibuja un ábaco distinto y de una sola columna cada una", () => {
    const lista = sesion("hard", 4242);
    const indice = lista.findIndex((e) => e.type === "find-abaco");
    const { container } = render(<Abaco3CifrasScreen {...props("hard")} />);
    avanzarHasta(container, indice);

    const dibujos = opciones(container).map((b) => columnasDe(b).join("/"));
    expect(dibujos).toHaveLength(4);
    for (const columnas of dibujos) {
      for (const n of columnas.split("/").filter(Boolean).map(Number)) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(9);
      }
    }
  });

  it("acertar marca el ábaco correcto y avanza", () => {
    const lista = sesion("hard", 4242);
    const indice = lista.findIndex((e) => e.type === "find-abaco");
    const { container } = render(<Abaco3CifrasScreen {...props("hard")} />);
    const ex = avanzarHasta(container, indice);

    const esperado = columnasEsperadas(ex).join("/");
    const correcto = opciones(container).find((b) => columnasDe(b).join("/") === esperado);
    if (!correcto) throw new Error(`Ninguna opción dibuja ${esperado}`);
    fireEvent.click(correcto);

    expect(container.querySelector(".aba__opt--correct")).not.toBeNull();
    runTimers(AUTOAVANCE_MS);
    expect(container.querySelector(".aba__question")?.textContent).not.toBe(ex.question);
  });
});

describe("abaco3cifras — determinismo, resumen y salida", () => {
  it("no monta Numpad ni DigitCell: se responde con un toque", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("expert")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });

  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);
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

    expect(container.querySelector(".aba__question")?.textContent).toBe(lista[0].question);
    expect(container.querySelector(".aba__opt--correct")).toBeNull();
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = sesion("easy")[0];
    const { container } = render(<Abaco3CifrasScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".aba__question")?.textContent).toBe(ex.question);
  });
});
