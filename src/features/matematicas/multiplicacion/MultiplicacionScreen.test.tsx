import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { MultiplicacionScreen } from "./MultiplicacionScreen";
import {
  generateChoiceSession,
  generateMatchSession,
} from "../../../core/activities/multiplicacion";
import type { MatchSession, MultiplicacionExercise } from "../../../core/activities/multiplicacion";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("multiplicacion", mockOnExit, difficulty, seed);

/** El emparejador y el salto del modo opción múltiple, cada uno con su espera. */
const CELEBRACION_MS = 1500;
const AUTOAVANCE_MS = 900;
const ERROR_MS = 700;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const izquierda = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".mul__item--op"));
const derecha = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".mul__item--res"));
const opciones = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>(".mul__opt"));

/** Los índices de una pareja concreta, deducidos del motor, no del DOM. */
function sitioDe(sesion: MatchSession, product: number) {
  return {
    i: sesion.leftColumn.findIndex((p) => p.product === product),
    d: sesion.rightColumn.findIndex((p) => p.product === product),
  };
}

function unir(c: HTMLElement, sesion: MatchSession, product: number) {
  const { i, d } = sitioDe(sesion, product);
  if (i < 0 || d < 0) throw new Error(`La tabla no tiene el producto ${product}`);
  fireEvent.click(izquierda(c)[i]);
  fireEvent.click(derecha(c)[d]);
}

/** Une todas las parejas, en el orden en que aparecen en la columna izquierda. */
function unirTodas(c: HTMLElement, sesion: MatchSession) {
  for (const par of sesion.leftColumn) unir(c, sesion, par.product);
}

const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ── Modo unir ─────────────────────────────────────────────────────────────────

describe("multiplicacion modo unir", () => {
  it("monta las dos columnas con una tarjeta por fila, sin contador de ejercicios", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    expect(container.querySelector(".mul__instruction")?.textContent).toBe(
      "Toca una operación y luego el producto que le corresponde",
    );
    expect(izquierda(container)).toHaveLength(sesion.pairs.length);
    expect(derecha(container)).toHaveLength(sesion.pairs.length);
    // Un único tablero de emparejar: progreso 1/1 (los niveles altos usan n/total).
    expect(progreso(container)).toBe("1/1");
  });

  it("la izquierda muestra las operaciones y la derecha los productos del motor", () => {
    const sesion = generateMatchSession("medium", 4242);
    const { container } = render(<MultiplicacionScreen {...props("medium")} />);

    expect(izquierda(container).map((n) => n.textContent)).toEqual(
      sesion.leftColumn.map((p) => `${p.table} × ${p.factor}`),
    );
    expect(derecha(container).map((n) => n.textContent)).toEqual(
      sesion.rightColumn.map((p) => String(p.product)),
    );
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("acierto: unir marca ambos lados como conectados y dibuja una línea", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);
    const { i, d } = sitioDe(sesion, sesion.leftColumn[0]!.product);

    fireEvent.click(izquierda(container)[i]);
    expect(izquierda(container)[i]!.className).toContain("mul__item--selected");

    fireEvent.click(derecha(container)[d]);

    expect(izquierda(container)[i]!.className).toContain("mul__item--connected");
    expect(derecha(container)[d]!.className).toContain("mul__item--connected");
    expect(container.querySelectorAll(".mul__line")).toHaveLength(1);
  });

  it("sin seleccionar nada a la izquierda, la derecha no responde", () => {
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    fireEvent.click(derecha(container)[0]);

    expect(container.querySelectorAll(".mul__item--connected")).toHaveLength(0);
    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(0);
  });

  it("pulsar dos veces la misma operación la deselecciona", () => {
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    fireEvent.click(izquierda(container)[0]);
    expect(izquierda(container)[0]!.className).toContain("mul__item--selected");

    fireEvent.click(izquierda(container)[0]);
    expect(izquierda(container)[0]!.className).not.toContain("mul__item--selected");
  });

  it("fallo: marca el error en los dos lados y lo borra solo", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);
    const i = 0;
    const otraColumna = sesion.rightColumn.findIndex((p) => p.id !== sesion.leftColumn[i]!.id)!;

    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[otraColumna]);

    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(2);
    expect(container.querySelectorAll(".mul__item--connected")).toHaveLength(0);

    runTimers(ERROR_MS);
    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(0);
  });

  it("al completar la hoja celebra y pasa al resumen", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    unirTodas(container, sesion);

    expect(container.querySelector(".mul__celebrate")?.textContent).toContain("¡Muy bien!");

    runTimers(CELEBRACION_MS);
    expect(container.querySelector(".summary__stars")).not.toBeNull();
  });

  it("aciertarlo todo da la nota máxima", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    unirTodas(container, sesion);
    runTimers(CELEBRACION_MS);

    expect(container.textContent).toContain(`${sesion.pairs.length}/${sesion.pairs.length}`);
  });

  it("fallar una unión no impide acabar, pero la nota ya no es perfecta", () => {
    // Una pareja fallada parpadea y luego se rehace, así que al final quedan
    // todas unidas. Lo que distingue a los dos casos es cuántas se acertaron a
    // la primera, y por eso la nota no sale perfecta.
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    const { i } = sitioDe(sesion, sesion.leftColumn[0]!.product);
    const malElegida = sesion.rightColumn.findIndex((p) => p.id !== sesion.leftColumn[i]!.id)!;
    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[malElegida]);
    runTimers(ERROR_MS);

    unirTodas(container, sesion);
    runTimers(CELEBRACION_MS);

    expect(container.textContent).toContain(`${sesion.pairs.length - 1}/${sesion.pairs.length}`);
  });

  it("repetir devuelve la misma hoja, con la misma semilla", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    unirTodas(container, sesion);
    runTimers(CELEBRACION_MS);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(izquierda(container).map((n) => n.textContent)).toEqual(
      sesion.leftColumn.map((p) => `${p.table} × ${p.factor}`),
    );
  });

  it("se puede completar también la hoja repetida", () => {
    // El `key` del emparejador no puede dependerse solo de los `id` de las
    // parejas: al repetir se usa la misma semilla, los ids son los mismos y el
    // componente no se remonta. Entonces conserva el aviso de "ya completada" y
    // la segunda hoja se queda sin resumen, sin avisar de nada.
    const sesion = generateMatchSession("easy", 4242);
    const { container } = render(<MultiplicacionScreen {...props("easy")} />);

    unirTodas(container, sesion);
    runTimers(CELEBRACION_MS);
    expect(container.querySelector(".summary__stars")).not.toBeNull();

    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);
    unirTodas(container, sesion);
    runTimers(CELEBRACION_MS);

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.textContent).toContain(`${sesion.pairs.length}/${sesion.pairs.length}`);
  });
});

// ── Modo opción múltiple ──────────────────────────────────────────────────────

describe("multiplicacion modo opción múltiple", () => {
  const otraOpcion = (ex: MultiplicacionExercise): number => {
    const distinta = ex.options.find((o) => o !== ex.correctAnswer);
    if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
    return distinta;
  };

  const acertar = (c: HTMLElement, valor: number) => {
    const boton = c.querySelector<HTMLButtonElement>(`.mul__opt[data-value="${valor}"]`);
    if (!boton) throw new Error(`No hay ninguna opción con el valor "${valor}"`);
    fireEvent.click(boton);
  };

  it("muestra el enunciado y las cuatro opciones que genera el núcleo", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    expect(container.querySelector(".mul__equation")?.textContent).toBe(lista[0]!.question);
    expect(opciones(container).map((b) => Number(b.dataset.value))).toEqual(lista[0]!.options);
    expect(progreso(container)).toBe("1/10");
  });

  it("acierto: marca la opción, celebra y avanza solo", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, lista[0]!.correctAnswer);

    expect(container.querySelector(".mul__opt--correct")?.textContent).toBe(
      String(lista[0]!.correctAnswer),
    );
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallo: marca la elegida, no celebra y no avanza solo", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, otraOpcion(lista[0]!));

    expect(container.querySelector(".mul__opt--wrong")).not.toBeNull();
    expect(container.querySelector(".mul__opt--correct")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, otraOpcion(lista[0]!));
    for (const boton of opciones(container)) expect(boton.disabled).toBe(true);

    acertar(container, lista[0]!.correctAnswer);
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, otraOpcion(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".mul__opt--wrong")).toBeNull();

    acertar(container, lista[0]!.correctAnswer);
    expect(container.querySelector(".mul__opt--correct")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el botón de siguiente avanza tras un fallo", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, otraOpcion(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".mul__opt--wrong")).toBeNull();
  });

  it("acertar tras fallar no puntúa doble", () => {
    const lista = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    acertar(container, otraOpcion(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.correctAnswer);
    runTimers(AUTOAVANCE_MS);
    for (const ex of lista.slice(1)) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });

  it("la pista solo aparece en el producto, y no regala la respuesta", () => {
    // En `count-groups` el enunciado ya dice los grupos y los objetos, así que
    // dividirlos sería la respuesta.
    let vistaCountGroups = false;
    for (let i = 0; i < 10 && !vistaCountGroups; i++) {
      const lista = generateChoiceSession("expert", 4242);
      const c = render(<MultiplicacionScreen {...props("expert")} />);
      for (let j = 0; j < i; j++) {
        acertar(c.container, lista[j]!.correctAnswer);
        runTimers(AUTOAVANCE_MS);
      }
      const ex = lista[i]!;
      if (ex.type === "count-groups") {
        expect(c.container.querySelector(".mul__pista")).toBeNull();
        vistaCountGroups = true;
      } else if (ex.type === "product") {
        expect(c.container.querySelector(".mul__pista")?.textContent).toBe(
          `Piensa en la tabla del ${ex.table}`,
        );
      }
      c.unmount();
    }
    expect(vistaCountGroups).toBe(true);
  });

  it("dibuja los grupos de puntos solo en el producto", () => {
    const lista = generateChoiceSession("hard", 4242);
    const producto = lista.find((ex) => ex.type === "product")!;
    // Se avanza hasta ese ejercicio acertando los anteriores.
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);
    for (const ex of lista.slice(0, lista.indexOf(producto))) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelectorAll(".mul__group")).toHaveLength(producto.a);
    expect(container.querySelectorAll(".mul__group")[0]?.children).toHaveLength(producto.b);
  });
});

// ── Común ─────────────────────────────────────────────────────────────────────

describe("multiplicacion — salida", () => {
  it.each(["easy", "hard"] as const)("el botón de salir avisa en %s", (nivel) => {
    const { container } = render(<MultiplicacionScreen {...props(nivel)} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
  });
});
