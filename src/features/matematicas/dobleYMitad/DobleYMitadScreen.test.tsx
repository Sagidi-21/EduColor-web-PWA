import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { DobleYMitadScreen } from "./DobleYMitadScreen";
import { generateSession } from "../../../core/activities/dobleYMitad";
import type { DobleYMitadExercise } from "../../../core/activities/dobleYMitad";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("dobleYMitad", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".dob__opt"));
const cajaIzquierda = (c: HTMLElement) => c.querySelector(".dob__box")!;
const cajaDerecha = (c: HTMLElement) => c.querySelectorAll(".dob__box")[1]!;

/** El contador del header. Va a su propio elemento, no al `textContent` entero:
 * concatenado con el enunciado daría un número con los dígitos pegados. */
const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

const valor = (caja: Element): string => caja.querySelector(".dob__box-value")!.textContent ?? "";
const etiqueta = (caja: Element): string =>
  caja.querySelector(".dob__box-label")!.textContent ?? "";

const acertar = (c: HTMLElement, v: number) => {
  const boton = c.querySelector<HTMLButtonElement>(`.dob__opt[data-value="${v}"]`);
  if (!boton) throw new Error(`No hay ninguna opción con el valor "${v}"`);
  fireEvent.click(boton);
};

/** Una opción que no sea la correcta. */
const otra = (ex: DobleYMitadExercise): number => {
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
  cleanup();
  vi.useRealTimers();
});

describe("dobleYMitad — el enunciado", () => {
  it("muestra el enunciado que genera el núcleo, con sus cuatro opciones", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    expect(container.querySelector(".dob__question")?.textContent).toBe(ex.question);
    expect(opciones(container).map((b) => Number(b.dataset.value))).toEqual(ex.options);
    expect(progreso(container)).toBe("1/10");
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<DobleYMitadScreen {...props("expert")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("cuando el enunciado da el número, el hueco está en el doble o la mitad", () => {
    // easy solo trae dobles, así que el hueco siempre cae a la derecha.
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);
    const ex = generateSession("easy", 4242)[0]!;

    expect(ex.conocido).toBe("original");
    expect(valor(cajaIzquierda(container))).toBe(String(ex.number));
    expect(valor(cajaDerecha(container))).toBe("?");
    expect(cajaDerecha(container).className).toContain("dob__box--blank");
    expect(container.querySelector(".dob__arrow")?.textContent).toBe("×2");
    expect(etiqueta(cajaDerecha(container))).toBe("Doble");
  });

  it("cuando el enunciado da el resultado, el hueco está en el número", () => {
    // En `hard` el tercer tipo es el inverso del doble, y en `expert` también el
    // de la mitad.
    for (const nivel of ["hard", "expert"] as const) {
      const lista = generateSession(nivel, 4242);
      const inverso = lista.findIndex((ex) => ex.conocido === "resultado");
      expect(inverso, `${nivel} no trae ejercicios inversos`).toBeGreaterThanOrEqual(0);

      const c = render(<DobleYMitadScreen {...props(nivel)} />);
      for (let i = 0; i < inverso; i++) {
        acertar(c.container, lista[i]!.correctAnswer);
        runTimers(AUTOAVANCE_MS);
      }

      const ex = lista[inverso]!;
      expect(valor(cajaIzquierda(c.container))).toBe("?");
      expect(cajaIzquierda(c.container).className).toContain("dob__box--blank");
      expect(valor(cajaDerecha(c.container))).toBe(String(ex.number));
      // La flecha y la etiqueta siguen nombrando la operación del enunciado.
      expect(c.container.querySelector(".dob__arrow")?.textContent).toBe(
        ex.operacion === "x2" ? "×2" : "÷2",
      );
      expect(etiqueta(cajaDerecha(c.container))).toBe(ex.operacion === "x2" ? "Doble" : "Mitad");
      c.unmount();
    }
  });

  it("la mitad se rotula como ÷2 y «Mitad»", () => {
    // medium es el primer nivel con mitades, y es el segundo ejercicio.
    const lista = generateSession("medium", 4242);
    const indice = lista.findIndex((ex) => ex.type === "mitad");
    expect(indice).toBeGreaterThanOrEqual(0);

    const { container } = render(<DobleYMitadScreen {...props("medium")} />);
    for (let i = 0; i < indice; i++) {
      acertar(container, lista[i]!.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".dob__arrow")?.textContent).toBe("÷2");
    expect(etiqueta(cajaDerecha(container))).toBe("Mitad");
  });
});

describe("dobleYMitad — responder", () => {
  it("acierto: celebra, marca la opción y avanza solo", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    acertar(container, ex.correctAnswer);

    expect(container.querySelector(".dob__opt--correct")?.textContent).toBe(
      String(ex.correctAnswer),
    );
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallo: marca la elegida, no celebra y no avanza solo", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    acertar(container, otra(ex));

    expect(container.querySelector(".dob__opt--wrong")).not.toBeNull();
    expect(container.querySelector(".dob__opt--correct")).toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    acertar(container, otra(ex));
    for (const boton of opciones(container)) expect(boton.disabled).toBe(true);

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".dob__opt--wrong")).toBeNull();

    acertar(container, ex.correctAnswer);
    expect(container.querySelector(".dob__opt--correct")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".dob__opt--wrong")).toBeNull();
  });

  it("acertar tras fallar no puntúa doble", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

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
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("10/10");
  });
});

describe("dobleYMitad — determinismo y salida", () => {
  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const lista = generateSession("easy", 4242);
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(container.querySelector(".dob__question")?.textContent).toBe(lista[0]!.question);
    expect(container.querySelector(".dob__opt--correct")).toBeNull();
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = generateSession("easy", 4242)[0]!;
    const { container } = render(<DobleYMitadScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".dob__question")?.textContent).toBe(ex.question);
  });
});
