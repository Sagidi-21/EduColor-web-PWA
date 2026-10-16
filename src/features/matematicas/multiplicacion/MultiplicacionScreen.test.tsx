import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { MultiplicacionScreen } from "./MultiplicacionScreen";
import {
  CHOICE_OPS_PER_SCREEN,
  CHOICE_SESSION_SCREENS,
  generateChoiceSession,
  generateMatchSession,
} from "../../../core/activities/multiplicacion";
import type { MatchSession, MultiplicacionExercise } from "../../../core/activities/multiplicacion";
import type { EngineScreenProps } from "../engine-screens";
import { confirmKey, pressNumpad, smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("multiplicacion", mockOnExit, difficulty, seed);

/** El emparejador y el salto del modo escritura, cada uno con su espera. */
const CELEBRACION_MS = 1500;
const WRITE_DONE_MS = 1100;
const ERROR_MS = 700;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const izquierda = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".mul__item--op"));
const derecha = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".mul__item--res"));
const cards = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".mul__card"));
const digitsOf = (card: HTMLElement) =>
  Array.from(card.querySelectorAll<HTMLButtonElement>(".mul__digit"));

/** Rellena la tarjeta `ei` con la respuesta correcta y deja el foco listo. */
function rellenarTarjeta(c: HTMLElement, ei: number, valor: number) {
  const digitos = digitsOf(cards(c)[ei]!);
  fireEvent.click(digitos[0]!);
  String(valor)
    .split("")
    .forEach((d) => pressNumpad(c, d));
}

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

  it("fallo: marca el error, muestra Reintentar/Siguiente y no se limpia solo", () => {
    const sesion = generateMatchSession("easy", 4242);
    const { container, getByText } = render(<MultiplicacionScreen {...props("easy")} />);
    const i = 0;
    const otraColumna = sesion.rightColumn.findIndex((p) => p.id !== sesion.leftColumn[i]!.id)!;

    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[otraColumna]);

    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(2);
    expect(container.querySelectorAll(".mul__item--connected")).toHaveLength(0);
    expect(getByText(/Reintentar/i)).toBeInTheDocument();
    expect(getByText(/Siguiente/i)).toBeInTheDocument();

    runTimers(ERROR_MS);
    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(2);

    fireEvent.click(getByText(/Reintentar/i));
    expect(container.querySelectorAll(".mul__item--wrong")).toHaveLength(0);
    expect(container.querySelector(".mul__match-actions")).toBeNull();
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
    // Tras Reintentar se puede rehacer la pareja; la nota cuenta aciertos a la primera.
    const sesion = generateMatchSession("easy", 4242);
    const { container, getByText } = render(<MultiplicacionScreen {...props("easy")} />);

    const { i } = sitioDe(sesion, sesion.leftColumn[0]!.product);
    const malElegida = sesion.rightColumn.findIndex((p) => p.id !== sesion.leftColumn[i]!.id)!;
    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[malElegida]);
    fireEvent.click(getByText(/Reintentar/i));

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

// ── Modo escritura (hard, expert) ─────────────────────────────────────────────

describe("multiplicacion modo escritura", () => {
  const valorIncorrecto = (ex: MultiplicacionExercise): number => {
    const right = ex.correctAnswer;
    const len = String(right).length;
    for (const delta of [1, -1, 2, -2]) {
      const n = right + delta;
      if (n > 0 && String(n).length === len && n !== right) return n;
    }
    return right > 1 ? right - 1 : right + 1;
  };

  const completarPantalla = (c: HTMLElement, ops: MultiplicacionExercise[]) => {
    for (let i = 0; i < ops.length; i++) {
      rellenarTarjeta(c, i, ops[i]!.correctAnswer);
    }
    pressNumpad(c, confirmKey);
  };

  it("muestra tres tarjetas, numpad y progreso 1/6", () => {
    const pantallas = generateChoiceSession("hard", 4242);
    expect(pantallas).toHaveLength(CHOICE_SESSION_SCREENS);
    expect(pantallas[0]).toHaveLength(CHOICE_OPS_PER_SCREEN);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    expect(cards(container)).toHaveLength(CHOICE_OPS_PER_SCREEN);
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".mul__opt")).toBeNull();
    expect(progreso(container)).toBe(`1/${CHOICE_SESSION_SCREENS}`);
  });

  it("hard dibuja apoyo visual en productos; expert no", () => {
    const hardLista = generateChoiceSession("hard", 4242)[0]!;
    const hardIdx = hardLista.findIndex((ex) => ex.type === "product");
    expect(hardIdx).toBeGreaterThanOrEqual(0);
    const hard = render(<MultiplicacionScreen {...props("hard")} />);
    expect(cards(hard.container)[hardIdx]!.querySelectorAll(".mul__group").length).toBe(
      hardLista[hardIdx]!.a,
    );
    hard.unmount();

    const expert = render(<MultiplicacionScreen {...props("expert")} />);
    expect(expert.container.querySelectorAll(".mul__group")).toHaveLength(0);
    expert.unmount();
  });

  it("acertar una pantalla celebra y pasa a la siguiente", () => {
    const pantallas = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    completarPantalla(container, pantallas[0]!);
    expect(container.querySelector(".mul__write")?.className).toContain("mul__write--correct");
    expect(progreso(container)).toBe(`1/${CHOICE_SESSION_SCREENS}`);

    runTimers(WRITE_DONE_MS);
    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(progreso(container)).toBe(`2/${CHOICE_SESSION_SCREENS}`);
    expect(cards(container)).toHaveLength(CHOICE_OPS_PER_SCREEN);
  });

  it("completar las seis pantallas sin fallos llega al resumen 6/6", () => {
    const pantallas = generateChoiceSession("hard", 4242);
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);

    for (let s = 0; s < CHOICE_SESSION_SCREENS; s++) {
      completarPantalla(container, pantallas[s]!);
      runTimers(WRITE_DONE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${CHOICE_SESSION_SCREENS}/${CHOICE_SESSION_SCREENS}`,
    );
  });

  it("fallo: marca la tarjeta, muestra Reintentar/Siguiente y no avanza solo", () => {
    const lista = generateChoiceSession("hard", 4242)[0]!;
    const { container, getByText } = render(<MultiplicacionScreen {...props("hard")} />);

    rellenarTarjeta(container, 0, valorIncorrecto(lista[0]!));
    pressNumpad(container, confirmKey);

    expect(cards(container)[0]!.className).toContain("mul__card--wrong");
    expect(getByText(/Reintentar/i)).toBeInTheDocument();
    expect(getByText(/Siguiente/i)).toBeInTheDocument();

    runTimers(WRITE_DONE_MS * 2);
    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(progreso(container)).toBe(`1/${CHOICE_SESSION_SCREENS}`);
  });

  it("tras reintentar la pantalla cuenta 0 si hubo fallo", () => {
    const pantallas = generateChoiceSession("hard", 4242);
    const lista = pantallas[0]!;
    const { container, getByText } = render(<MultiplicacionScreen {...props("hard")} />);

    rellenarTarjeta(container, 0, valorIncorrecto(lista[0]!));
    pressNumpad(container, confirmKey);
    fireEvent.click(getByText(/Reintentar/i));

    expect(cards(container)[0]!.className).not.toContain("mul__card--wrong");
    completarPantalla(container, lista);
    runTimers(WRITE_DONE_MS);

    // Pantalla 1 no suma; quedan pantallas 2..6 por hacer.
    expect(progreso(container)).toBe(`2/${CHOICE_SESSION_SCREENS}`);

    for (let s = 1; s < CHOICE_SESSION_SCREENS; s++) {
      completarPantalla(container, pantallas[s]!);
      runTimers(WRITE_DONE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${CHOICE_SESSION_SCREENS - 1}/${CHOICE_SESSION_SCREENS}`,
    );
  });

  it("el recuadro activo se marca al seleccionarlo", () => {
    const { container } = render(<MultiplicacionScreen {...props("hard")} />);
    const segundo = digitsOf(cards(container)[1]!)[0]!;
    fireEvent.click(segundo);
    expect(segundo.className).toContain("mul__digit--active");
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
