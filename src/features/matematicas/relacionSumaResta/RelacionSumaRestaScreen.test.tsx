import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelacionSumaRestaScreen } from "./RelacionSumaRestaScreen";
import { allCorrect, validateAnswers } from "../../../core/activities/relacionSumaResta";
import type { EngineScreenProps } from "../engine-screens";
import { deleteKey, pressNumpad, smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 1200;

const buildProps = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("relacionSumaResta", mockOnExit, difficulty, seed);

const readOperands = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".relsr__op-col")).map((col) => ({
    left: Number(col.dataset.left),
    right: Number(col.dataset.right),
    operator: col.dataset.op,
  }));

const answersOf = (container: HTMLElement) => {
  const rows = readOperands(container);
  const total = rows[0].left;
  const partA = rows[0].right;
  const partB = rows[1].right;
  return [partB, partA, total];
};

const readOverviewInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".relsr__op-col")).map((col) => {
    const boxes = Array.from(col.querySelectorAll<HTMLElement>(".relsr__box"));
    const d = (boxes[0]?.textContent ?? "").trim();
    const u = (boxes[1]?.textContent ?? "").trim();
    if (!d && !u) return "";
    return String(parseInt(`${d}${u}`, 10));
  });

/** Escribe un número en detalle: U → D (la D cierra y vuelve al overview). */
const typeDetailAnswer = (container: HTMLElement, answer: number) => {
  pressNumpad(container, String(answer % 10));
  pressNumpad(container, String(Math.floor(answer / 10)));
};

const openOp = (container: HTMLElement, index: number) => {
  fireEvent.click(container.querySelectorAll(".relsr__op-col")[index]);
};

/** Completa las tres ops desde el overview. */
const solveAll = (container: HTMLElement, answers: number[]) => {
  answers.forEach((answer, i) => {
    openOp(container, i);
    typeDetailAnswer(container, answer);
  });
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
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

  it("overview: tres ops, enunciado de selección y sin numpad/canvas", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    expect(container.querySelectorAll(".relsr__op-col")).toHaveLength(3);
    expect(container.querySelector(".relsr__hint")?.textContent).toMatch(/selecciónalas/i);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/10");
  });

  it("las tres operaciones enlazan el total con las dos partes", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const rows = readOperands(container);
    const [partB, partA, total] = answersOf(container);

    expect(rows[0]).toMatchObject({ left: total, right: partA, operator: "-" });
    expect(rows[1]).toMatchObject({ left: total, right: partB, operator: "-" });
    expect(rows[2]).toMatchObject({ left: partA, right: partB, operator: "+" });
    expect(partA + partB).toBe(total);
  });

  it("al elegir una op entra al detalle con numpad y toggle, sin enunciado", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    openOp(container, 0);

    expect(container.querySelector(".relsr__detail")).not.toBeNull();
    expect(container.querySelector(".relsr__intro")).toBeNull();
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(container.querySelector(".input-toggle")).not.toBeNull();
    expect(container.querySelectorAll(".relsr__op-col")).toHaveLength(0);
  });

  it("al completar U→D vuelve al overview con la cifra y sin color aún", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);

    openOp(container, 0);
    typeDetailAnswer(container, answers[0]);

    expect(container.querySelector(".relsr__overview")).not.toBeNull();
    expect(readOverviewInputs(container)[0]).toBe(String(answers[0]));
    expect(container.querySelectorAll(".relsr__box--correct")).toHaveLength(0);
    expect(container.querySelectorAll(".relsr__box--wrong")).toHaveLength(0);
    expect(container.querySelector(".relsr__celebration")).toBeNull();
  });

  it("se puede reentrar en una op ya hecha", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);

    openOp(container, 0);
    typeDetailAnswer(container, answers[0]);
    openOp(container, 0);

    expect(container.querySelector(".relsr__detail")).not.toBeNull();
  });

  it("acierto de las tres: verde, celebración y autoavance", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);

    solveAll(container, answersOf(container));

    expect(container.querySelector(".relsr__celebration")?.textContent).toContain("¡Muy bien!");
    expect(container.querySelectorAll(".relsr__box--correct")).toHaveLength(6);
    expect(container.querySelector(".activity-actions")).toBeNull();

    runAutoAdvance(AUTO_ADVANCE_MS - 100);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/10");
    runAutoAdvance(200);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/10");
  });

  it("fallo: marca solo las malas en rojo y muestra reintentar/siguiente", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);
    const wrongLast = answers[2] === 99 ? 98 : answers[2] + 1;

    solveAll(container, [answers[0], answers[1], wrongLast]);

    expect(container.querySelector(".relsr__celebration")).toBeNull();
    expect(container.querySelectorAll(".relsr__box--correct").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".relsr__box--wrong").length).toBeGreaterThan(0);
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("reintentar limpia solo las operaciones incorrectas", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answers = answersOf(container);
    const wrongLast = answers[2] === 99 ? 98 : answers[2] + 1;

    solveAll(container, [answers[0], answers[1], wrongLast]);
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    const inputs = readOverviewInputs(container);
    expect(inputs[0]).toBe(String(answers[0]));
    expect(inputs[1]).toBe(String(answers[1]));
    expect(inputs[2]).toBe("");
    expect(container.querySelectorAll(".relsr__box--wrong")).toHaveLength(0);
    expect(container.querySelector(".activity-actions")).toBeNull();
  });

  it("en detalle, borrar vacía la cifra activa", () => {
    const { container } = render(<RelacionSumaRestaScreen {...buildProps("medium")} />);
    const answer = answersOf(container)[0];

    openOp(container, 0);
    pressNumpad(container, String(answer % 10));
    // Tras U, foco en D
    expect(container.querySelector('[data-digit="D"]')?.className).toContain(
      "relsr__detail-box--active",
    );

    pressNumpad(container, deleteKey);
    expect(container.querySelector('[data-digit="U"]')?.className).toContain(
      "relsr__detail-box--active",
    );
  });

  it("el validador del motor exige las tres respuestas a la vez", () => {
    const ex = { total: 12, partA: 5, partB: 7 };
    const good: [string, string, string] = ["7", "5", "12"];

    expect(validateAnswers(ex, good)).toEqual([true, true, true]);
    expect(allCorrect(validateAnswers(ex, good))).toBe(true);
    expect(allCorrect(validateAnswers(ex, ["7", "5", "13"]))).toBe(false);
  });
});
