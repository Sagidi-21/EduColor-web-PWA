import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Numeracion1119Screen } from "./Numeracion1119Screen";
import { generateNumeracion1119Session } from "../../../core/activities/numeracion1119";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { confirmKey, deleteKey, pressNumpad, smokeProps, switchToCanvas } from "../testing/smoke";

const mockOnExit = vi.fn();

/**
 * Ojo con la firma: este es el único motor de la familia que invierte el orden
 * de los argumentos, `(seed, difficulty)` en lugar de `(difficulty, seed)`.
 * El test la respeta tal cual para no perpetuar la inconsistencia.
 */
const session = (difficulty: ActivityDifficulty, seed = 4242) =>
  generateNumeracion1119Session(seed, difficulty);

const buildProps = (difficulty: ActivityDifficulty, seed = 4242) =>
  smokeProps("numeracion1119", mockOnExit, difficulty, seed);

const questionOf = (container: HTMLElement) =>
  container.querySelector(".num__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".num__option"));

/** Teclea la respuesta y confirma con la tecla ✓, como haría el niño. */
const answerWithNumpad = (container: HTMLElement, value: string | number) => {
  String(value)
    .split("")
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
};

const runAutoAdvance = (ms = 1100) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("Numeracion1119Screen smoke", () => {
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

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);

    expect(questionOf(container)).toBe(exercises[0].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("dibuja una decena y tantas unidades como unidades tiene el número", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const number = exercises[0].number;

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);

    expect(container.querySelector(".num__decena")?.textContent).toBe("10");
    expect(container.querySelectorAll(".num__unit-dot")).toHaveLength(number % 10);
  });

  it("`easy` es de opción múltiple: botones, sin Numpad y sin toggle", () => {
    const seed = 4242;
    const exercises = session("easy", seed);
    expect(exercises[0].type).toBe("identify");

    const { container } = render(<Numeracion1119Screen {...buildProps("easy", seed)} />);

    expect(optionButtons(container)).toHaveLength(exercises[0].options!.length);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("las dificultades con respuesta numérica montan Numpad con el teclado completo", () => {
    const seed = 4242;
    expect(session("medium", seed)[0].type).toBe("units");
    expect(session("hard", seed)[0].type).toBe("sequence");

    (["medium", "hard"] as ActivityDifficulty[]).forEach((difficulty) => {
      const { container } = render(<Numeracion1119Screen {...buildProps(difficulty, seed)} />);
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
    const ex = exercises[0];

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.answer);

    expect(container.querySelector(".ops__celebration")?.textContent).toContain("¡Correcto!");
    expect(container.querySelector(".ops__answer-box--correct")).not.toBeNull();
  });

  it("confirmar sin escribir nada no puntúa: sigue en el mismo ejercicio", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);
    pressNumpad(container, confirmKey);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${exercises.length}`,
    );
  });

  it("borrar deshace la última cifra tecleada", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const ex = exercises[0];
    const digits = String(ex.answer).split("");

    const { container } = render(<Numeracion1119Screen {...buildProps("hard", seed)} />);

    // Con la regla nueva, rellenar la ultima casilla valida sola. Para poder
    // borrar hay que quedarse a una cifra por escribir.
    digits.slice(0, -1).forEach((d) => pressNumpad(container, d));
    expect(container.querySelector(".ops__celebration")).toBeNull();

    pressNumpad(container, deleteKey);
    pressNumpad(container, confirmKey);

    // Quedan casillas vacias, asi que confirmar no valida y no hay acierto.
    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("rellenar la última casilla valida sola, sin pulsar ✓", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const ex = exercises[0];

    const { container } = render(<Numeracion1119Screen {...buildProps("hard", seed)} />);

    String(ex.answer)
      .split("")
      .forEach((d) => pressNumpad(container, d));

    expect(container.querySelector(".ops__celebration")).not.toBeNull();
  });

  it("hay una casilla por cifra de la respuesta y se rellenan de izquierda a derecha", () => {
    const seed = 4242;
    const exercises = session("hard", seed);
    const ex = exercises[0];

    const { container } = render(<Numeracion1119Screen {...buildProps("hard", seed)} />);
    const casillas = () => Array.from(container.querySelectorAll<HTMLElement>(".ops__answer-slot"));

    expect(casillas()).toHaveLength(String(ex.answer).length);

    // La primera casilla es la activa y va por el camino de la izquierda.
    expect(casillas()[0].querySelector(".ops__answer-box--active")).not.toBeNull();

    String(ex.answer)
      .split("")
      .forEach((d, i) => {
        pressNumpad(container, d);
        // Tras cada cifra, la activa es la siguiente hacia la derecha.
        const siguiente = casillas()[i + 1];
        if (siguiente) {
          expect(siguiente.querySelector(".ops__answer-box--active")).not.toBeNull();
        }
      });

    // Y cada casilla muestra su propia cifra, en su posicion.
    String(ex.answer)
      .split("")
      .forEach((d, i) => {
        expect(casillas()[i].textContent).toContain(d);
      });
  });

  it("cada ejercicio muestra exactamente las casillas que necesita", () => {
    // El invariante que importa: ni una casilla de mas ni de menos. Un ejercicio
    // cuya respuesta sea de una sola cifra no debe ense�ar casilla de decenas.
    const seed = 4242;
    const ejercicios = session("hard", seed);

    const { container } = render(<Numeracion1119Screen {...buildProps("hard", seed)} />);

    ejercicios.forEach((ex) => {
      expect(container.querySelectorAll(".ops__answer-slot")).toHaveLength(
        String(ex.answer).length,
      );
      // Se responde para poder pasar al siguiente.
      String(ex.answer)
        .split("")
        .forEach((d) => pressNumpad(container, d));
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
  });

  it("acierto: el contador avanza solo y la respuesta correcta se muestra", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, exercises[0].answer);

    // En acierto el renderer enseña la respuesta del motor, no la tecleada.
    expect(container.querySelector(".ops__answer-box--correct")?.textContent).toBe(
      String(exercises[0].answer),
    );

    runAutoAdvance();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${exercises.length}`,
    );
  });

  it("fallo: ofrece reintentar y reinicia el ejercicio sin acumular el acierto", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex = exercises[0];

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);
    answerWithNumpad(container, ex.answer + 1);

    expect(container.querySelector(".ops__celebration")).toBeNull();
    // Este renderer usa `ActionButtons`, a diferencia de sus hermanos 4059 y
    // 6099.
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(questionOf(container)).toBe(ex.question);

    // Reintentar deja el mismo número en pantalla, listo para volver a teclear.
    fireEvent.click(container.querySelector(".activity-action--retry")!);
    expect(questionOf(container)).toBe(ex.question);
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const seed = 4242;

    const { container } = render(<Numeracion1119Screen {...buildProps("medium", seed)} />);
    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    // El DigitCell va con React.lazy: el fallback demuestra que se pidió sin
    // necesidad de cargar el reconocedor.
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });

  it("acabar la sesión muestra el resumen con el total de aciertos", () => {
    const seed = 4242;
    const exercises = session("easy", seed);

    const { container } = render(<Numeracion1119Screen {...buildProps("easy", seed)} />);

    exercises.forEach((ex) => {
      const button = optionButtons(container).find((b) => b.textContent === String(ex.answer));
      fireEvent.click(button!);
      runAutoAdvance();
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(exercises.length));
  });
});
