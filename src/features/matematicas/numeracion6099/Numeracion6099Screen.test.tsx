import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Numeracion6099Screen } from "./Numeracion6099Renderer";
import { generateSession } from "../../../core/activities/numeracion6099";
import type { Num6099Exercise } from "../../../core/activities/numeracion6099";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { confirmKey, deleteKey, pressNumpad, smokeProps, switchToCanvas } from "../testing/smoke";

const mockOnExit = vi.fn();

const session = (difficulty: ActivityDifficulty, seed = 4242) => generateSession(difficulty, seed);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("numeracion6099", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".n6099__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".n6099__option"));

/** Los tipos que el renderer resuelve con botones y no con Numpad. */
const isChoiceType = (ex: Num6099Exercise) => ex.type === "identify" || ex.type === "word";

const answerWithNumpad = (container: HTMLElement, value: string | number) => {
  String(value)
    .split("")
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
};

const runAutoAdvance = (ms = 900) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("Numeracion6099Screen smoke", () => {
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
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion6099Screen {...buildProps("medium", seed)} />);

    expect(questionOf(container)).toBe(exercises[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("dibuja un bloque `10` por decena y un punto por unidad", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    const number = exercises[0].number;

    const { container } = render(<Numeracion6099Screen {...buildProps("easy", seed)} />);

    expect(container.querySelectorAll(".n6099__decena")).toHaveLength(Math.floor(number / 10));
    expect(container.querySelectorAll(".n6099__unit-dot")).toHaveLength(number % 10);
  });

  it("es de opción múltiple en los tipos `identify` y `word`, sin Numpad", () => {
    const seed = 4242;
    const exercises = session("expert", seed);
    // `expert` es la única dificultad que mezcla los cinco tipos.
    expect(exercises.some(isChoiceType)).toBe(true);
    expect(exercises.some((ex) => !isChoiceType(ex))).toBe(true);

    // Un tipo de opción resuelve con botones, así que no monta ni Numpad ni el
    // toggle de modo de entrada. La pantalla de la sesión empieza en el primer
    // ejercicio, que en `expert` es `identify`.
    expect(exercises[0].type).toBe("identify");

    const { container } = render(<Numeracion6099Screen {...buildProps("expert", seed)} />);

    expect(optionButtons(container).length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("el tipo numérico monta Numpad y el toggle de modo de entrada", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    expect(exercises[0].type).toBe("sequence");

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(
      Array.from(container.querySelectorAll(".shared-numpad__key")).map((k) => k.textContent),
    ).toEqual(["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "✓"]);
    expect(container.querySelector(".input-toggle")).not.toBeNull();
  });

  it("el motor alterna tipos de opción y numéricos dentro de la misma sesión", () => {
    // Es la diferencia con 1119 y 4059: aquí la dificultad no decide el modo de
    // entrada, lo decide el tipo del ejercicio en pantalla.
    const seed = 4242;
    const exercises = session("medium", seed);
    const kinds = new Set(exercises.map((ex) => (isChoiceType(ex) ? "choice" : "numpad")));

    expect(kinds).toEqual(new Set(["choice", "numpad"]));
  });

  it("teclear la respuesta y confirmar marca el acierto", () => {
    const seed = 4242;
    const exercises = session("hard", seed);

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);
    answerWithNumpad(container, exercises[0].answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
    expect(container.querySelector(".ops__answer-box--correct")).not.toBeNull();
  });

  it("confirmar vacío no puntúa y no avanza de ejercicio", () => {
    const seed = 4242;
    const exercises = session("hard", seed);

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("borrar quita la última cifra y el siguiente fallo ofrece reintentar", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const ex = exercises[0];

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);
    String(ex.answer)
      .split("")
      .forEach((d) => pressNumpad(container, d));
    pressNumpad(container, deleteKey);
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".wrong-feedback__btn--retry")).not.toBeNull();
  });

  it("fallo: el botón de reintentar deja el mismo ejercicio limpio", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const ex = exercises[0];
    // El anterior siempre está a distancia 1, así que +1 nunca es la respuesta.
    const wrong =
      ex.answer === String(Number(ex.answer) + 1) ? ex.answer : String(Number(ex.answer) + 1);

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);
    answerWithNumpad(container, wrong);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".wrong-feedback")).not.toBeNull();
    expect(questionOf(container)).toBe(ex.question);

    fireEvent.click(container.querySelector(".wrong-feedback__btn--retry")!);
    expect(questionOf(container)).toBe(ex.question);
    expect(container.querySelector(".wrong-feedback")).toBeNull();
  });

  it("acierto: el contador avanza solo y la casilla muestra la respuesta", () => {
    const seed = 4242;
    const exercises = session("hard", seed);

    const { container } = render(<Numeracion6099Screen {...buildProps("hard", seed)} />);
    answerWithNumpad(container, exercises[0].answer);

    expect(container.querySelector(".ops__answer-box--correct")?.textContent).toBe(
      exercises[0].answer,
    );

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<Numeracion6099Screen {...buildProps("hard")} />);
    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("acabar la sesión muestra el resumen tras alternar opción y numpad", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion6099Screen {...buildProps("medium", seed)} />);

    exercises.forEach((ex) => {
      if (isChoiceType(ex)) {
        fireEvent.click(
          optionButtons(container).find((b) => b.textContent === ex.answer) ??
            container.querySelector<HTMLButtonElement>(".n6099__option")!,
        );
      } else {
        answerWithNumpad(container, ex.answer);
      }
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
