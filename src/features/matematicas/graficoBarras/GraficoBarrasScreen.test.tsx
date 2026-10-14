import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { GraficoBarrasScreen } from "./GraficoBarrasScreen";
import { generateSession, marcasEje } from "../../../core/activities/graficoBarras";
import type { GraficoBarrasExercise } from "../../../core/activities/graficoBarras";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("graficoBarras", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 1100;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".gb__opcion"));

const columnas = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".gb__columna"));
const marcas = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>(".gb__marca")).map((m) => Number(m.textContent));

/** El contador del header. Va a su propio elemento, no al `textContent` entero:
 * concatenado con el enunciado daría un número con los dígitos pegados. */
const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

/** El alto de la barra en porcentaje, tal y como se lo pasa el núcleo. */
const alturaDe = (c: HTMLElement, indice: number): number => {
  const estilo = columnas(c)[indice]?.querySelector<HTMLElement>(".gb__barra")?.style.height;
  if (!estilo) throw new Error(`La columna ${indice} no tiene barra`);
  return Number(estilo.replace("%", ""));
};

const acertar = (c: HTMLElement, v: string) => {
  const boton = c.querySelector<HTMLButtonElement>(`.gb__opciones [data-value="${v}"]`);
  if (!boton) throw new Error(`No hay ninguna opción con el valor "${v}"`);
  fireEvent.click(boton);
};

/** Una opción que no sea la correcta. */
const otra = (ex: GraficoBarrasExercise): string => {
  const distinta = ex.options.find((o) => o !== ex.correctAnswer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta;
};

/** Deja el componente en el ejercicio `indice` de la sesión. */
const irA = (c: HTMLElement, lista: GraficoBarrasExercise[], indice: number) => {
  for (let i = 0; i < indice; i++) {
    acertar(c, lista[i]!.correctAnswer);
    runTimers(AUTOAVANCE_MS);
  }
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

describe("graficoBarras — el gráfico", () => {
  it("dibuja una columna por barra, con su nombre y su emoji", () => {
    const lista = generateSession("hard", 4242);
    const ex = lista[0]!;
    const { container } = render(<GraficoBarrasScreen {...props("hard")} />);

    const cols = columnas(container);
    expect(cols).toHaveLength(ex.bars.length);
    expect(cols.map((c) => c.dataset.etiqueta)).toEqual(ex.bars.map((b) => b.etiqueta));
    expect(container.querySelector(".gb__titulo")).toBeNull();
    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(ex.question);
    for (const [i, barra] of ex.bars.entries()) {
      expect(cols[i]!.querySelector(".gb__emoji")?.textContent).toBe(barra.emoji);
    }
  });

  it("la altura de cada barra es su valor sobre el tope del nivel", () => {
    // El original medía la barra con `valor / maxVal * 140` y el eje con
    // `bottom: 20 + pct * 1.6`: dos fórmulas para la misma altura, con lo que la
    // barra más alta no llegaba a la marca que decía su valor.
    const lista = generateSession("expert", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("expert")} />);
    const ex = lista[0]!;

    for (const [i, barra] of ex.bars.entries()) {
      expect(alturaDe(container, i)).toBeCloseTo((barra.valor / ex.escalaMax) * 100, 6);
    }
  });

  it("el eje lleva las marcas del núcleo, y la más alta es el tope de la escala", () => {
    const lista = generateSession("medium", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("medium")} />);
    const ex = lista[0]!;

    // El DOM las deja de menor a mayor, como el núcleo; cada una se coloca por
    // `bottom`, así que en pantalla se leen de arriba abajo al revés.
    expect(marcas(container)).toEqual(ex.marcas);
    expect(ex.marcas).toEqual(marcasEje(ex.escalaMax));
    expect(ex.marcas[ex.marcas.length - 1]).toBe(ex.escalaMax);
    // Una barra con el valor del tope tiene que llegar a la última marca.
    expect(
      alturaDe(
        container,
        ex.bars.findIndex((b) => b.valor === ex.escalaMax),
      ),
    ).toBe(100);
  });

  it("la escala no cambia entre ejercicios del mismo nivel", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    for (let indice = 0; indice < lista.length; indice++) {
      expect(marcas(container), `en el ejercicio ${indice}`).toEqual(lista[indice]!.marcas);
      expect(lista[indice]!.escalaMax, `en el ejercicio ${indice}`).toBe(lista[0]!.escalaMax);
      if (indice === lista.length - 1) break;
      acertar(container, lista[indice]!.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }
  });

  it("todas las barras caben en el gráfico y ninguna se sale", () => {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as const) {
      const { container, unmount } = render(<GraficoBarrasScreen {...props(dificultad)} />);
      const lista = generateSession(dificultad, 4242);
      for (let indice = 0; indice < lista.length; indice++) {
        const alturas = columnas(container).map((_, i) => alturaDe(container, i));
        expect(Math.max(...alturas), `${dificultad} en el ejercicio ${indice}`).toBeLessThanOrEqual(
          100,
        );
        expect(Math.min(...alturas), `${dificultad} en el ejercicio ${indice}`).toBeGreaterThan(0);
        if (indice === lista.length - 1) break;
        acertar(container, lista[indice]!.correctAnswer);
        runTimers(AUTOAVANCE_MS);
      }
      unmount();
    }
  });
});

describe("graficoBarras — la barra sin datos", () => {
  it("el ejercicio de «faltan los datos» oculta el número y conserva la altura", () => {
    const lista = generateSession("easy", 4242);
    const indice = lista.findIndex((ex) => ex.type === "fill_bar");
    expect(indice, "La sesión fácil no trae ningún ejercicio sin datos").toBeGreaterThanOrEqual(0);

    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);
    irA(container, lista, indice);

    const ex = lista[indice]!;
    const hueco = ex.blankBarIndex!;
    const columnasHueco = Array.from(
      container.querySelectorAll<HTMLElement>(".gb__columna"),
    ).filter((c) => c.querySelector('[data-hueco="true"]') !== null);
    expect(columnasHueco).toHaveLength(1);
    expect(columnasHueco[0]!.dataset.etiqueta).toBe(ex.bars[hueco]!.etiqueta);
    expect(columnasHueco[0]!.querySelector(".gb__valor")?.textContent).toBe("?");
    // La altura es la del valor: es de donde se lee lo que falta.
    expect(alturaDe(container, hueco)).toBeCloseTo((ex.bars[hueco]!.valor / ex.escalaMax) * 100, 6);
  });

  it("las demás barras siguen mostrando su número", () => {
    const lista = generateSession("easy", 4242);
    const indice = lista.findIndex((ex) => ex.type === "fill_bar");
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);
    irA(container, lista, indice);

    const ex = lista[indice]!;
    for (const [i, barra] of ex.bars.entries()) {
      if (i === ex.blankBarIndex) continue;
      const valor = columnas(container)[i]!.querySelector(".gb__valor")!.textContent;
      expect(valor, `la barra ${barra.etiqueta}`).toBe(String(barra.valor));
    }
  });

  it("ningún otro ejercicio dibuja una barra hueca", () => {
    const lista = generateSession("medium", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("medium")} />);

    for (const [indice, ex] of lista.entries()) {
      const huecos = container.querySelectorAll('[data-hueco="true"]').length;
      expect(huecos, `en el ejercicio ${indice} (${ex.type})`).toBe(ex.type === "fill_bar" ? 1 : 0);
      if (indice === lista.length - 1) break;
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }
  });
});

describe("graficoBarras — el enunciado y las opciones", () => {
  it("muestra el enunciado del núcleo y sus opciones, en el orden que genera", () => {
    const ex = generateSession("hard", 4242)[0]!;
    const { container } = render(<GraficoBarrasScreen {...props("hard")} />);

    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(ex.question);
    expect(opciones(container).map((b) => b.dataset.value)).toEqual(ex.options);
    expect(progreso(container)).toBe("1/10");
  });

  it("el enunciado de máximo y mínimo usa el sustantivo en singular", () => {
    // Con el original, el tema de frutas salía como «¿Qué frutas preferidas
    // tiene MÁS votos?».
    const lista = generateSession("hard", 7);
    const { container } = render(<GraficoBarrasScreen {...props("hard", 7)} />);
    const encontrados = new Set<string>();

    for (const ex of lista) {
      if (ex.type !== "find_max" && ex.type !== "find_min") continue;
      encontrados.add(ex.question);
    }
    expect(encontrados.size, "No ha salido ninguna pregunta de máximo o mínimo").toBeGreaterThan(0);
    for (const enunciado of encontrados) {
      expect(enunciado).toMatch(
        /^¿Qué (animal|fruta|deporte|asignatura) tiene (MÁS|MENOS) votos\?$/,
      );
    }
    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(lista[0]!.question);
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<GraficoBarrasScreen {...props("expert")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("acertar marca la opción correcta y pasa sola al siguiente", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, lista[0]!.correctAnswer);
    expect(container.querySelector(".gb__opcion--correcta")).not.toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(lista[1]!.question);
  });

  it("fallar marca la opción pulsada, no la correcta, y no avanza solo", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));

    expect(container.querySelector(".gb__opcion--fallada")).not.toBeNull();
    expect(container.querySelector(".gb__opcion--correcta")).toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    for (const boton of opciones(container)) expect(boton.disabled).toBe(true);

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".gb__opcion--fallada")).toBeNull();

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".gb__opcion--correcta")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".gb__opcion--fallada")).toBeNull();
  });

  it("acertar tras fallar no puntúa doble", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.correctAnswer);
    runTimers(AUTOAVANCE_MS);
    for (const ex of lista.slice(1)) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    // Diez ejercicios, nueve acertados: el primero cuenta como fallado.
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });

  it("acertar los diez muestra la nota máxima", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("10/10");
  });
});

describe("graficoBarras — determinismo y salida", () => {
  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(lista[0]!.question);
    expect(container.querySelector(".gb__opcion--correcta")).toBeNull();
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<GraficoBarrasScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".gb__enunciado")?.textContent).toBe(ex.question);
  });
});
