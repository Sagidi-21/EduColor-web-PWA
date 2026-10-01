import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelacionSumaRestaScreen } from "./RelacionSumaRestaScreen";
import { allCorrect, validateAnswers } from "../../../core/activities/relacionSumaResta";
import type { EngineScreenProps } from "../engine-screens";
import { confirmKey, deleteKey, pressNumpad, smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 1200;

const buildProps = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("relacionSumaResta", mockOnExit, difficulty, seed);

/**
 * `initSession` usa la `seed` que llega por props, así que el ejercicio es
 * reproducible. El test lo lee de lo que el renderer muestra: cada fila expone
 * sus dos operandos, y las tres filas son `total − partA`, `total − partB` y
 * `partA + partB`.
 */
const readOperands = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".relsr__equation-row")).map((row) => {
    const numbers = Array.from(row.querySelectorAll(".relsr__number")).map((n) =>
      Number(n.textContent),
    );
    const operator = row.querySelector(".relsr__op")?.textContent?.trim();
    return { left: numbers[0], right: numbers[1], operator };
  });

const readInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".relsr__input")).map((i) =>
    (i.textContent ?? "").trim(),
  );

/** Las tres respuestas correctas, deducidas de la segunda fila. */
const answersOf = (container: HTMLElement) => {
  const rows = readOperands(container);
  const total = rows[0].left;
  const partA = rows[0].right;
  const partB = rows[1].right;
  return [partB, partA, total];
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/**
 * Rellena las tres casillas en el orden en que las pide el algoritmo: se teclea
 * la cifra de la casilla activa y el `✓` pasa a la siguiente. Solo en la tercera
 * el `✓` valida.
 */
const solveAll = (container: HTMLElement, answers: number[]) => {
  answers.forEach((answer) => {
    String(answer)
      .split("")
      .forEach((d) => pressNumpad(container, d));
    pressNumpad(container, confirmKey);
  });
};

describe("RelacionSumaRestaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta tres ecuaciones con su hueco y el contador 1/N", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    const rows = container.querySelectorAll(".relsr__equation-row");
    expect(rows).toHaveLength(3);
    expect(container.querySelectorAll(".relsr__input")).toHaveLength(3);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1 / 10");
  });

  it("las tres ecuaciones enlazan el total con las dos partes, y suman", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const rows = readOperands(container);
    const [partB, partA, total] = answersOf(container);

    expect(rows[0]).toMatchObject({ left: total, right: partA });
    expect(rows[1]).toMatchObject({ left: total, right: partB });
    expect(rows[2]).toMatchObject({ left: partA, right: partB });
    // Las partes suman el total: es lo que hace coherente al ejercicio.
    expect(partA + partB).toBe(total);
  });

  it("monta el Numpad con el teclado completo y sin DigitCell", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(
      Array.from(container.querySelectorAll(".shared-numpad__key")).map((k) => k.textContent),
    ).toEqual(["7", "8", "9", "4", "5", "6", "1", "2", "3", "←", "0", "✓"]);
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("empieza con la primera casilla activa", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const inputs = container.querySelectorAll(".relsr__input");

    expect(inputs[0].className).toContain("relsr__input--active");
    expect(inputs[1].className).not.toContain("relsr__input--active");
    expect(inputs[2].className).not.toContain("relsr__input--active");
  });

  it("`✓` avanza de casilla y solo valida en la tercera", () => {
    // A diferencia de `repartoIgual`, aquí el `✓` NO valida directamente: pasa a
    // la siguiente casilla y solo en la última dispara la corrección.
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);

    // Con las casillas vacías, dos `✓` solo mueven el cursor.
    pressNumpad(container, confirmKey);
    pressNumpad(container, confirmKey);
    expect(container.querySelectorAll(".relsr__input")[2].className).toContain(
      "relsr__input--active",
    );
    expect(container.querySelector(".relsr__celebration")).toBeNull();

    // Se vuelve al principio y se resuelve de una en una.
    fireEvent.click(container.querySelectorAll(".relsr__equation-row")[0]);
    solveAll(container, answers);

    expect(container.querySelector(".relsr__celebration")?.textContent).toContain("¡Muy bien!");
    expect(readInputs(container)).toEqual(answers.map(String));
  });

  it("acierto: al validar se muestran las tres respuestas correctas", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    solveAll(container, answersOf(container));

    expect(container.querySelectorAll(".relsr__input--correct")).toHaveLength(3);
    expect(container.querySelector(".activity-actions")).toBeNull();
  });

  it("acierto: el contador avanza solo tras 1200 ms", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    solveAll(container, answersOf(container));

    runAutoAdvance(AUTO_ADVANCE_MS - 100);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1 / 10");

    runAutoAdvance(200);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2 / 10");
  });

  it("fallo: una sola respuesta incorrecta invalida las tres", () => {
    // El renderer solo usa `allCorrect`, así que la corrección parcial no se ve.
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);
    // Se altera la primera cifra en lugar de sumar uno, para no desbordar el
    // número de casillas cuando el resultado ya tiene todas las cifras puestas.
    const last = String(answers[2]);
    const broken = (last[0] === "9" ? "8" : "9") + last.slice(1);
    const wrong = [answers[0], answers[1], Number(broken)];
    expect(wrong[2]).not.toBe(answers[2]);

    solveAll(container, wrong);

    expect(container.querySelector(".relsr__celebration")).toBeNull();
    expect(container.querySelectorAll(".relsr__input--wrong")).toHaveLength(3);
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("pulsar una fila mueve la casilla activa a esa ecuación", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const rows = container.querySelectorAll(".relsr__equation-row");

    fireEvent.click(rows[1]);

    expect(container.querySelectorAll(".relsr__input")[1].className).toContain(
      "relsr__input--active",
    );
    expect(container.querySelectorAll(".relsr__input")[0].className).not.toContain(
      "relsr__input--active",
    );
  });

  it("borrar quita la última cifra de la casilla activa", () => {
    // Ojo: este renderer usa la `seed` de props, así que el número de cifras
    // es reproducible.
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const digits = String(answersOf(container)[0]).split("");

    digits.forEach((d) => pressNumpad(container, d));
    expect(readInputs(container)[0]).toBe(digits.join(""));

    pressNumpad(container, deleteKey);

    expect(readInputs(container)[0]).toBe(digits.slice(0, -1).join(""));
  });

  it("el validador del motor exige las tres respuestas a la vez", () => {
    // Guarda de la regla que aplica el renderer: todo o nada.
    const ex = { total: 12, partA: 5, partB: 7 };
    const good: [string, string, string] = ["7", "5", "12"];

    expect(validateAnswers(ex, good)).toEqual([true, true, true]);
    expect(allCorrect(validateAnswers(ex, good))).toBe(true);

    // Con una sola incorrecta, ninguna de las tres se da por buena en el
    // resultado final aunque las otras dos lo estén.
    expect(allCorrect(validateAnswers(ex, ["7", "5", "13"]))).toBe(false);
  });
});
