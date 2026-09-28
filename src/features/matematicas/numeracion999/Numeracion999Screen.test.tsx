import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Numeracion999Screen } from "./Numeracion999Renderer";
import { generateSession } from "../../../core/activities/numeracion999";
import type { N999Exercise } from "../../../core/activities/numeracion999";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const buildProps = (difficulty: ActivityDifficulty = "hard", seed = 4242) =>
  smokeProps("numeracion999", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".n999__question")?.textContent ?? "";

const options = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".n999__opt"));

const optionWithText = (container: HTMLElement, text: string) => {
  const button = options(container).find((o) => o.textContent === text);
  if (!button) throw new Error(`No hay ninguna opción con el texto "${text}"`);
  return button;
};

/** Una opción presente en la lista que no es la correcta. */
const wrongOptionText = (ex: N999Exercise) => {
  const wrong = ex.options.find((o) => o !== ex.correctAnswer);
  if (wrong === undefined) throw new Error(`El ejercicio no ofrece ninguna opción incorrecta`);
  return wrong;
};

/**
 * Deja correr el temporizador de autoavance del acierto.
 *
 * Va dentro de `act` porque el `setTimeout` del efecto dispara un `setState`,
 * y sin envolverlo React no vuelca el cambio antes de la siguiente aserción.
 */
const runAutoAdvance = (ms = 1100) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("Numeracion999Screen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la pregunta del motor y el contador 1/N", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<Numeracion999Screen {...buildProps("hard", seed)} />);

    expect(questionOf(container)).toBe(session[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session.length}`,
    );
  });

  it("es una actividad de opción: nunca monta Numpad ni DigitCell", () => {
    // Todos los tipos del motor (`cifra-to-cdu`, `cdu-to-cifra`,
    // `valor-posicional` y `anterior-posterior`) se resuelven pulsando una
    // opción, así que el toggle de modo de entrada no debe existir.
    const { container } = render(<Numeracion999Screen {...buildProps()} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("cada tipo de ejercicio muestra sus 4 opciones y el apoyo visual correcto", () => {
    const seed = 4242;
    const session = generateSession("expert", seed);

    // `expert` es la única dificultad cuyo pool incluye los cuatro tipos, así
    // que basta con avanzar por la sesión entera para verlos todos.
    const seen = new Set<{ cduCard: boolean; numberDisplay: boolean }>();
    const { container } = render(<Numeracion999Screen {...buildProps("expert", seed)} />);

    for (let i = 0; i < session.length; i++) {
      expect(options(container).length).toBeGreaterThanOrEqual(4);
      seen.add({
        cduCard: container.querySelector(".n999__cdu-card") !== null,
        numberDisplay: container.querySelector(".n999__number-display") !== null,
      });
      // Pasamos al siguiente sin acertar: el botón de "Siguiente" solo aparece
      // tras un fallo.
      fireEvent.click(optionWithText(container, wrongOptionText(session[i])));
      fireEvent.click(container.querySelector(".wrong-feedback__btn--next")!);
    }

    // `cdu-to-cifra` muestra la tarjeta de valor posicional; el resto, el
    // número grande.
    expect([...seen].some((s) => s.cduCard)).toBe(true);
    expect([...seen].some((s) => s.numberDisplay)).toBe(true);
  });

  it("elegir la opción correcta marca el acierto y avanza sola", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const ex = session[0];

    const { container } = render(<Numeracion999Screen {...buildProps("hard", seed)} />);
    expect(questionOf(container)).toBe(ex.question);

    fireEvent.click(optionWithText(container, ex.correctAnswer));

    expect(container.querySelector(".n999__cheer")?.textContent).toContain("¡Correcto!");
    expect(optionWithText(container, ex.correctAnswer).className).toContain("n999__opt--correct");
    expect(container.querySelector(".wrong-feedback")).toBeNull();

    // El acierto autoavanza sin que el niño toque nada.
    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${session.length}`,
    );
  });

  it("elegir una opción incorrecta muestra el reintento y no suma el acierto", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);
    const ex = session[0];
    const wrong = wrongOptionText(ex);

    const { container } = render(<Numeracion999Screen {...buildProps("hard", seed)} />);
    fireEvent.click(optionWithText(container, wrong));

    expect(optionWithText(container, wrong).className).toContain("n999__opt--wrong");
    expect(container.querySelector(".n999__cheer")).toBeNull();
    expect(container.querySelector(".wrong-feedback")).not.toBeNull();

    // Reintentar deja el mismo ejercicio limpio y sin fallo previo acumulado.
    fireEvent.click(container.querySelector(".wrong-feedback__btn--retry")!);
    expect(questionOf(container)).toBe(ex.question);
    expect(container.querySelector(".wrong-feedback")).toBeNull();
    expect(optionWithText(container, wrong).className).not.toContain("n999__opt--wrong");
  });

  it("acabar la sesión muestra el resumen con los aciertos contados", () => {
    const seed = 4242;
    const session = generateSession("hard", seed);

    const { container } = render(<Numeracion999Screen {...buildProps("hard", seed)} />);

    session.forEach((ex) => {
      fireEvent.click(optionWithText(container, ex.correctAnswer));
      runAutoAdvance();
    });

    // El resumen es el único punto donde el contador se sustituye por el
    // bloque de resultados, así que basta con comprobar que se llegó.
    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(session.length));
  });
});
