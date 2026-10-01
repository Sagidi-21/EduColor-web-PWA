import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { PoligonosScreen } from "./PoligonosScreen";
import { choiceOptions, generateSession, SESSION_SIZE } from "../../../core/activities/poligonos";
import type { PoligonoSelectExercise } from "../../../core/activities/poligonos";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("poligonos", mockOnExit, difficulty, seed);

/** El renderer salta de ejercicio solo tras acertar; 900 ms es su espera. */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".pol__option"));

const cardButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".pol__card"));

/** Índice del botón que lleva `value` como `data-value`. */
const indiceDe = (c: HTMLElement, value: string) =>
  optionButtons(c).findIndex((b) => b.dataset.value === value);

/** Pulsa la opción correcta del ejercicio que se está mostrando. */
const acertar = (c: HTMLElement, answer: string) =>
  fireEvent.click(c.querySelector<HTMLButtonElement>(`#pol-option-${indiceDe(c, answer)}`)!);

const primerEjercicio = (difficulty: EngineScreenProps["difficulty"]) =>
  generateSession(difficulty, 4242)[0];

/**
 * Primera semilla cuyo primer ejercicio de `medium` marcará o no los vértices.
 *
 * No se fija la semilla a mano: depende de cómo quede barajada la sesión, y un
 * test que dependa de eso se rompe en cuanto cambia el orden.
 */
const semillaQueEmpiezaCon = (conVertices: boolean) => {
  for (let semilla = 1; semilla <= 500; semilla++) {
    if (generateSession("medium", semilla)[0].showVertices === conVertices) return semilla;
  }
  throw new Error("Ninguna semilla da el primer ejercicio buscado");
};

describe("PoligonosScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la figura y el enunciado que dicta el motor", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<PoligonosScreen {...props("easy")} />);

    expect(container.querySelector(".pol__shape-box")).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector(".pol__question")?.textContent).toBe(ex.question);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe(ex.shape.name);
  });

  it("respeta el tamaño de sesión de la dificultad en el progreso", () => {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as const) {
      const { container } = render(<PoligonosScreen {...props(dificultad)} />);
      expect(container.querySelector(".activity-header__counter")?.getAttribute("aria-label")).toBe(
        `Ejercicio 1 / ${SESSION_SIZE[dificultad]}`,
      );
      cleanup();
    }
  });

  it("ofrece las opciones del motor, con la correcta presente y sin repetir", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<PoligonosScreen {...props("medium")} />);

    const valores = optionButtons(container).map((b) => b.dataset.value);
    expect(valores.sort()).toEqual(
      choiceOptions(ex)
        .map((o) => o.value)
        .sort(),
    );
    expect(new Set(valores).size).toBe(valores.length);
    expect(valores).toContain(ex.answer);
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const ex = primerEjercicio("hard");
    const { container } = render(<PoligonosScreen {...props("hard")} />);

    acertar(container, ex.answer);

    expect(container.querySelector(".pol__option--correct")).not.toBeNull();
    expect(container.querySelector(".pol__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la pulsada, no celebra y ofrece reintentar", () => {
    const ex = primerEjercicio("hard");
    const falla = choiceOptions(ex).find((o) => o.value !== ex.answer)!.value;
    const { container } = render(<PoligonosScreen {...props("hard")} />);

    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#pol-option-${indiceDe(container, falla)}`)!,
    );

    expect(container.querySelector(".pol__option--wrong")).not.toBeNull();
    expect(container.querySelector(".pol__option--correct")).toBeNull();
    expect(container.querySelector(".pol__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar borra la marca de fallo y vuelve a habilitar los botones", () => {
    const ex = primerEjercicio("hard");
    const falla = choiceOptions(ex).find((o) => o.value !== ex.answer)!.value;
    const { container } = render(<PoligonosScreen {...props("hard")} />);

    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#pol-option-${indiceDe(container, falla)}`)!,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".pol__option--wrong")).toBeNull();
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("acertar tras un fallo no suma a la cuenta de correctas", () => {
    const sesion = generateSession("hard", 4242);
    const falla = choiceOptions(sesion[0]).find((o) => o.value !== sesion[0].answer)!.value;
    const { container } = render(<PoligonosScreen {...props("hard")} />);

    // El primer ejercicio se falla, se reintenta y se acierta: cuenta como fallado.
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#pol-option-${indiceDe(container, falla)}`)!,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, sesion[0].answer);
    runTimers(AUTOAVANCE_MS);

    // Los otros tres se aciertan a la primera, así que el resumen queda en 3 de 4.
    for (const ex of sesion.slice(1)) {
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("3/4");
  });

  it("avanza solo tras acertar y termina en el resumen", () => {
    const total = SESSION_SIZE.hard;
    const sesion = generateSession("hard", 4242);
    const { container } = render(<PoligonosScreen {...props("hard")} />);

    for (const ex of sesion) {
      expect(container.querySelector(".pol__question")?.textContent).toBe(ex.question);
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(`${total}/${total}`);
  });

  it("pulsar 'Repetir' devuelve la misma figura y enunciado (reutiliza la semilla)", () => {
    const seed = 4242;
    const sesion = generateSession("hard", seed);
    const { container } = render(<PoligonosScreen {...props("hard", seed)} />);

    const firstQuestion = container.querySelector(".pol__question")?.textContent ?? "";

    for (const ex of sesion) {
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(container.querySelector(".pol__question")?.textContent).toBe(firstQuestion);
  });

  it("en expert muestra la rejilla y acepta la única tarjeta correcta", () => {
    const ex = primerEjercicio("expert") as PoligonoSelectExercise;
    const { container } = render(<PoligonosScreen {...props("expert")} />);

    expect(container.querySelector(".pol__shape-box")).toBeNull();
    expect(cardButtons(container)).toHaveLength(4);
    expect(cardButtons(container).map((b) => b.id.replace("pol-card-", ""))).toEqual(
      ex.optionsList.map((s) => s.id),
    );

    fireEvent.click(container.querySelector<HTMLButtonElement>(`#pol-card-${ex.answer}`)!);
    expect(container.querySelector(".pol__card--correct")).not.toBeNull();
  });

  it("en expert, fallar una tarjeta no marca ninguna como correcta", () => {
    const ex = primerEjercicio("expert") as PoligonoSelectExercise;
    const otra = ex.optionsList.find((s) => s.id !== ex.answer)!;
    const { container } = render(<PoligonosScreen {...props("expert")} />);

    fireEvent.click(container.querySelector<HTMLButtonElement>(`#pol-card-${otra.id}`)!);

    expect(container.querySelector(".pol__card--wrong")).not.toBeNull();
    expect(container.querySelector(".pol__card--correct")).toBeNull();
  });

  it("en medium marca los vértices solo cuando la pregunta los pide", () => {
    const lados = { ...props("medium", semillaQueEmpiezaCon(false)) };
    const vertices = { ...props("medium", semillaQueEmpiezaCon(true)) };

    const primero = render(<PoligonosScreen {...lados} />);
    expect(primero.container.querySelector(".pol__question")?.textContent).toContain("LADOS");
    expect(primero.container.querySelector(".pol__vertex")).toBeNull();
    cleanup();

    const segundo = render(<PoligonosScreen {...vertices} />);
    const ex = generateSession("medium", vertices.seed)[0];
    expect(segundo.container.querySelector(".pol__question")?.textContent).toContain("VÉRTICES");
    // Un punto por vértice, que es lo que el alumno tiene que contar.
    expect(segundo.container.querySelectorAll(".pol__vertex")).toHaveLength(ex.shape.vertices);
  });

  it("no monta Numpad ni DigitCell: son actividades de opción", () => {
    const { container } = render(<PoligonosScreen {...props("expert")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });
});
