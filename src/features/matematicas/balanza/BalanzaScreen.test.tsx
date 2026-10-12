import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { BalanzaScreen } from "./BalanzaScreen";
import { generateSession, SESSION_SIZE, WEIGHT_ITEMS } from "../../../core/activities/balanza";
import type { BalanzaExercise } from "../../../core/activities/balanza";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("balanza", mockOnExit, difficulty, seed);

/** El renderer salta de ejercicio solo tras acertar; 900 ms es su espera. */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const optionButtons = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".blz__option"));

/** Índice del botón que lleva `value` como `data-value`. */
const indiceDe = (c: HTMLElement, value: string) =>
  optionButtons(c).findIndex((b) => b.dataset.value === value);

/** Pulsa la opción correcta del ejercicio que se está mostrando. */
const acertar = (c: HTMLElement, answer: string) =>
  fireEvent.click(c.querySelector<HTMLButtonElement>(`#blz-option-${indiceDe(c, answer)}`)!);

/** El ejercicio que el motor ha puesto en pantalla. */
const primerEjercicio = (difficulty: EngineScreenProps["difficulty"]): BalanzaExercise =>
  generateSession(difficulty, 4242)[0];

describe("BalanzaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta la balanza, los dos platos y el enunciado que dicta el motor", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<BalanzaScreen {...props("easy")} />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll(".blz__plato")).toHaveLength(2);
    expect(container.querySelector(".blz__question")?.textContent).toBe(ex.question);
  });

  it("dibuja un objeto por unidad en cada plato", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<BalanzaScreen {...props("medium")} />);

    const [izq, der] = container.querySelectorAll(".blz__plato");
    expect(izq.querySelectorAll(".blz__objeto")).toHaveLength(ex.left.count);
    expect(der.querySelectorAll(".blz__objeto")).toHaveLength(ex.right.count);
    // Y los emojis dibujados son los que dice el motor, no los que elija el test.
    Array.from(izq.querySelectorAll(".blz__objeto")).forEach((nodo) => {
      expect(nodo.textContent).toBe(ex.left.emoji);
    });
  });

  it("inclina la balanza hacia el plato que pesa más", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<BalanzaScreen {...props("medium")} />);

    // La inclinación es un dato pedagógico, no un premio por acertar: el niño
    // tiene que ver desde el principio hacia dónde cae la balanza.
    expect(container.querySelector("svg")?.getAttribute("data-tilt")).toBe(ex.tilt);

    const brazo = container.querySelector(".blz__brazo")!;
    const yIzq = Number(brazo.getAttribute("y1"));
    const yDer = Number(brazo.getAttribute("y2"));
    if (ex.tilt === "left") expect(yIzq).toBeGreaterThan(yDer);
    else if (ex.tilt === "right") expect(yDer).toBeGreaterThan(yIzq);
    else expect(yIzq).toBe(yDer);
  });

  it("deja la balanza nivelada cuando los dos pesos son iguales", () => {
    // La sesión de `medium` garantiza un caso de igualdad; se busca la semilla
    // que lo pone primero en lugar de fijarla a mano, porque depende de cómo
    // quede barajada la sesión.
    let semilla = 0;
    for (let s = 1; s <= 500; s++) {
      if (generateSession("medium", s)[0].tilt === "equal") {
        semilla = s;
        break;
      }
    }
    expect(semilla, "ninguna semilla empieza con un caso de igualdad").toBeGreaterThan(0);

    const { container } = render(<BalanzaScreen {...props("medium", semilla)} />);
    const brazo = container.querySelector(".blz__brazo")!;
    expect(Number(brazo.getAttribute("y1"))).toBe(Number(brazo.getAttribute("y2")));
  });

  it("respeta el tamaño de sesión de la dificultad en el progreso", () => {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as const) {
      const { container } = render(<BalanzaScreen {...props(dificultad)} />);
      expect(container.querySelector(".activity-header__counter")?.getAttribute("aria-label")).toBe(
        `Ejercicio 1 / ${SESSION_SIZE[dificultad]}`,
      );
      cleanup();
    }
  });

  it("ofrece las opciones del motor, con la correcta presente y sin repetir", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<BalanzaScreen {...props("medium")} />);

    const valores = optionButtons(container).map((b) => b.dataset.value);
    expect(valores.sort()).toEqual(ex.options.map((o) => o.value).sort());
    expect(new Set(valores).size).toBe(valores.length);
    expect(valores).toContain(ex.correctAnswer);
  });

  it("acierto: marca la opción correcta y celebra", () => {
    const ex = primerEjercicio("hard");
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    acertar(container, ex.correctAnswer);

    expect(container.querySelector(".blz__option--correct")).not.toBeNull();
    expect(container.querySelector(".blz__celebration")?.textContent).toContain("¡Muy bien!");
  });

  it("fallo: marca la pulsada, no celebra y ofrece reintentar", () => {
    const ex = primerEjercicio("hard");
    const falla = ex.options.find((o) => o.value !== ex.correctAnswer)!.value;
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#blz-option-${indiceDe(container, falla)}`)!,
    );

    expect(container.querySelector(".blz__option--wrong")).not.toBeNull();
    expect(container.querySelector(".blz__option--correct")).toBeNull();
    expect(container.querySelector(".blz__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar borra la marca de fallo y vuelve a habilitar los botones", () => {
    const ex = primerEjercicio("hard");
    const falla = ex.options.find((o) => o.value !== ex.correctAnswer)!.value;
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#blz-option-${indiceDe(container, falla)}`)!,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    // El original de Electron limpiaba un campo que no existía en su estado, así
    // que el botón fallado se quedaba marcado con la respuesta equivocada.
    expect(container.querySelector(".blz__option--wrong")).toBeNull();
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("acertar tras un fallo no suma a la cuenta de correctas", () => {
    const sesion = generateSession("hard", 4242);
    const falla = sesion[0].options.find((o) => o.value !== sesion[0].correctAnswer)!.value;
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    // El primer ejercicio se falla, se reintenta y se acierta: cuenta como fallado.
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(`#blz-option-${indiceDe(container, falla)}`)!,
    );
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, sesion[0].correctAnswer);
    runTimers(AUTOAVANCE_MS);

    // Los otros nueve se aciertan a la primera, así que el resumen queda en 9 de 10.
    for (const ex of sesion.slice(1)) {
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });

  it("avanza solo tras acertar y termina en el resumen", () => {
    const total = SESSION_SIZE.hard;
    const sesion = generateSession("hard", 4242);
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    for (const ex of sesion) {
      expect(container.querySelector(".blz__question")?.textContent).toBe(ex.question);
      acertar(container, ex.correctAnswer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(`${total}/${total}`);
  });

  it("en hard rotula la pesa de referencia una sola vez, junto a la bandeja", () => {
    const ex = primerEjercicio("hard");
    const { container } = render(<BalanzaScreen {...props("hard")} />);

    const pesas = container.querySelectorAll(".blz__pesa");
    expect(pesas).toHaveLength(1);
    expect(pesas[0].textContent).toBe(ex.right.weightLabel);
  });

  it("en expert deja vacío el plato que hay que deducir", () => {
    // Sin kilos ni `?`: el original revelaba la respuesta en el dibujo.
    const sesion = generateSession("expert", 4242);
    const { container } = render(<BalanzaScreen {...props("expert")} />);

    const [, derecho] = container.querySelectorAll(".blz__plato");
    expect(derecho.querySelector(".blz__interrogacion")).toBeNull();
    expect(derecho.querySelectorAll(".blz__objeto")).toHaveLength(0);
    sesion.forEach((ex) => expect(ex.right.unknown).toBe(true));
  });

  it("en expert muestra cuatro opciones numéricas con la correcta", () => {
    const ex = primerEjercicio("expert");
    const { container } = render(<BalanzaScreen {...props("expert")} />);

    const botones = optionButtons(container);
    expect(botones).toHaveLength(4);
    expect(botones.map((b) => b.dataset.value)).toContain(ex.correctAnswer);
  });

  it("describe la balanza para quien no ve el dibujo", () => {
    const { container } = render(<BalanzaScreen {...props("medium")} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toContain("Balanza");
  });

  it("no monta Numpad ni DigitCell: es una actividad de opción", () => {
    const { container } = render(<BalanzaScreen {...props("expert")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });

  it("el catálogo que recibe el renderer no puede venir vacío", () => {
    // El renderer no elige objetos: los recibe del motor. Este test solo deja
    // constancia de que ninguno llega sin emoji ni sin peso declarado.
    expect(WEIGHT_ITEMS.every((i) => i.emoji && i.weightGrams > 0)).toBe(true);
  });
});
