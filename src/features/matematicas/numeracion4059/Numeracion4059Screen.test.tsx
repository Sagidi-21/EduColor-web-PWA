import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Numeracion4059Screen } from "./Numeracion4059Renderer";
import { generateSession } from "../../../core/activities/numeracion4059";
import type { Num4059Exercise } from "../../../core/activities/numeracion4059";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { confirmKey, deleteKey, pressNumpad, smokeProps, switchToCanvas } from "../testing/smoke";

const mockOnExit = vi.fn();

const session = (difficulty: ActivityDifficulty, seed = 4242) => generateSession(difficulty, seed);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("numeracion4059", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".n4059__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".n4059__option"));

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

describe("Numeracion4059Screen smoke", () => {
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

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);

    expect(questionOf(container)).toBe(exercises[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("dibuja un bloque `10` por decena y un punto por unidad", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const number = exercises[0].number;

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);

    expect(container.querySelectorAll(".n4059__decena")).toHaveLength(Math.floor(number / 10));
    expect(container.querySelectorAll(".n4059__unit-dot")).toHaveLength(number % 10);
  });

  it("`easy` es de opción múltiple: botones, sin Numpad y sin toggle", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    expect(exercises[0].type).toBe("identify");

    const { container } = render(<Numeracion4059Screen {...buildProps("easy", seed)} />);

    expect(optionButtons(container)).toHaveLength(exercises[0].options!.length);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("`medium`, `hard` y `expert` montan Numpad con el teclado completo", () => {
    const seed = 4242;
    expect(session("medium", seed)[0].type).toBe("units");
    expect(session("hard", seed)[0].type).toBe("sequence");

    (["medium", "hard", "expert"] as ActivityDifficulty[]).forEach((difficulty) => {
      const { container } = render(<Numeracion4059Screen {...buildProps(difficulty, seed)} />);
      expect(container.querySelector(".shared-numpad")).not.toBeNull();
      expect(
        Array.from(container.querySelectorAll(".shared-numpad__key")).map((k) => k.textContent),
      ).toEqual(["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "✓"]);
      expect(container.querySelector(".input-toggle")).not.toBeNull();
      cleanup();
    });
  });

  it("teclear la respuesta y confirmar marca el acierto", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, exercises[0].answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Muy bien!");
    expect(container.querySelector(".ops__answer-box--correct")).not.toBeNull();
  });

  it("confirmar vacío no puntúa y no avanza de ejercicio", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("borrar quita la última cifra de la casilla activa", () => {
    // En `hard` las respuestas son de dos cifras, que es donde el borrado tiene
    // sentido: hay una casilla por cifra y se ve cual se queda vacia.
    const seed = 4242;
    const exercises = session("hard", seed);
    const digits = String(exercises[0].answer).split("");

    const { container } = render(<Numeracion4059Screen {...buildProps("hard", seed)} />);

    const casillas = () => Array.from(container.querySelectorAll<HTMLElement>(".ops__answer-slot"));

    // Con la regla nueva rellenar la ultima casilla valida sola, asi que para
    // poder borrar se deja una cifra sin escribir.
    digits.slice(0, -1).forEach((d) => pressNumpad(container, d));
    pressNumpad(container, deleteKey);

    // La casilla activa queda vacia y la seleccion vuelve a la anterior.
    expect(casillas()[digits.length - 2].textContent).toContain("_");
    expect(container.querySelector(".ops__celebration")).toBeNull();
  });

  it("una respuesta incorrecta ofrece reintentar y siguiente", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const digits = String(exercises[0].answer).split("");
    // Se cambia la ultima cifra por otra cualquiera: el resultado es erroneo.
    const ultimo = digits[digits.length - 1] === "0" ? "1" : "0";

    const { container } = render(<Numeracion4059Screen {...buildProps("hard", seed)} />);
    digits.slice(0, -1).forEach((d) => pressNumpad(container, d));
    pressNumpad(container, ultimo);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: el botón de reintentar deja el mismo ejercicio limpio", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex: Num4059Exercise = exercises[0];

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.answer + 1);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-actions")).not.toBeNull();
    expect(questionOf(container)).toBe(ex.question);

    fireEvent.click(container.querySelector(".activity-action--retry")!);
    expect(questionOf(container)).toBe(ex.question);
    expect(container.querySelector(".activity-actions")).toBeNull();
  });

  it("acierto: el contador avanza solo y la casilla muestra la respuesta", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion4059Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, exercises[0].answer);

    expect(container.querySelector(".ops__answer-box--correct")?.textContent).toBe(
      String(exercises[0].answer),
    );

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<Numeracion4059Screen {...buildProps("medium")} />);
    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("acabar la sesión muestra el resumen con el total de aciertos", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<Numeracion4059Screen {...buildProps("easy", seed)} />);

    exercises.forEach((ex) => {
      fireEvent.click(optionButtons(container).find((b) => b.textContent === String(ex.answer))!);
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
