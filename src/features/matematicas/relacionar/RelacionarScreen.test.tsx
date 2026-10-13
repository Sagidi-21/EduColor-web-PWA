import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelacionarScreen } from "./RelacionarScreen";
import { generateSession } from "../../../core/activities/relacionar";
import type { RelacionarSession } from "../../../core/activities/relacionar";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const TOTAL_ROUNDS = 10;
const ROUND_ADVANCE_MS = 1500;
const WRONG_FLASH_MS = 700;

const session = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed, TOTAL_ROUNDS);

const buildProps = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("relacionar", mockOnExit, difficulty, seed);

const leftItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".rel__item--num"));

const rightItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".rel__item--imgs"));

/**
 * Une el número de la izquierda con su grupo de la derecha.
 *
 * La columna derecha se baraja, y el DOM no expone el `id` de la pareja, así que
 * la posición se deduce de `rightColumn` del motor, que es determinista para una
 * semilla dada. Si el renderer y el motor se desincronizaran, el clic ya no
 * conectaría y el test fallaría.
 */
const connectPair = (container: HTMLElement, round: RelacionarSession, number: number) => {
  const leftIndex = round.leftColumn.findIndex((p) => p.number === number);
  const rightIndex = round.rightColumn.findIndex((p) => p.number === number);
  expect(leftIndex).toBeGreaterThanOrEqual(0);
  expect(rightIndex).toBeGreaterThanOrEqual(0);

  fireEvent.click(leftItems(container)[leftIndex]);
  fireEvent.click(rightItems(container)[rightIndex]);
};

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("RelacionarScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta las dos columnas con una pareja por elemento y el contador 1/10", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    expect(container.querySelector(".rel__instruction")?.textContent).toBe(
      "Toca un número y luego el grupo que le corresponde",
    );
    expect(container.querySelector(".rel__main--side")).not.toBeNull();
    expect(container.querySelector(".rel__main--board-center")).not.toBeNull();
    expect(leftItems(container)).toHaveLength(round.pairs.length);
    expect(rightItems(container)).toHaveLength(round.pairs.length);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${TOTAL_ROUNDS}`,
    );
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<RelacionarScreen {...buildProps("easy")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("en hard/expert las columnas van arriba; en easy/medium centradas", () => {
    const { container: hard } = render(<RelacionarScreen {...buildProps("hard")} />);
    expect(hard.querySelector(".rel__main--board-top")).not.toBeNull();

    const { container: medium } = render(<RelacionarScreen {...buildProps("medium")} />);
    expect(medium.querySelector(".rel__main--board-center")).not.toBeNull();
  });

  it("la columna izquierda muestra los números de la ronda", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    const numbers = Array.from(container.querySelectorAll(".rel__number")).map((n) =>
      Number(n.textContent),
    );
    expect(numbers).toEqual(round.leftColumn.map((p) => p.number));
  });

  it("acierto: unir la pareja marca ambos lados como conectados", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];
    const leftIndex = round.leftColumn.findIndex((p) => p.number === round.leftColumn[0].number);
    const rightIndex = round.rightColumn.findIndex((p) => p.number === round.leftColumn[0].number);

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    // Seleccionar en la izquierda y, sin volver a tocarla, elegir su pareja.
    fireEvent.click(leftItems(container)[leftIndex]);
    expect(leftItems(container)[leftIndex].className).toContain("rel__item--selected");

    fireEvent.click(rightItems(container)[rightIndex]);

    expect(leftItems(container)[leftIndex].className).toContain("rel__item--connected");
    expect(rightItems(container)[rightIndex].className).toContain("rel__item--connected");
  });

  it("acierto: al completar la ronda celebra y avanza sola a la siguiente", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    round.leftColumn.forEach((pair) => connectPair(container, round, pair.number));

    expect(container.querySelector(".rel__celebrate")?.textContent).toContain("¡Muy bien!");

    runTimers(ROUND_ADVANCE_MS);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2 / ${TOTAL_ROUNDS}`,
    );
    // La ronda nueva empieza sin conexiones.
    expect(container.querySelectorAll(".rel__item--connected")).toHaveLength(0);
  });

  it("fallo: unir con el grupo equivocado marca el error y lo borra solo a los 700 ms", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];
    const leftIndex = 0;
    const wrongRightIndex = round.rightColumn.findIndex(
      (p) => p.id !== round.leftColumn[leftIndex].id,
    );

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    fireEvent.click(leftItems(container)[leftIndex]);
    fireEvent.click(rightItems(container)[wrongRightIndex]);

    expect(container.querySelectorAll(".rel__item--wrong").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".rel__item--connected")).toHaveLength(0);

    runTimers(WRONG_FLASH_MS);
    expect(container.querySelectorAll(".rel__item--wrong")).toHaveLength(0);
  });

  it("sin seleccionar nada en la izquierda, la columna derecha no responde", () => {
    const seed = 4242;

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);
    fireEvent.click(rightItems(container)[0]);

    expect(container.querySelectorAll(".rel__item--connected")).toHaveLength(0);
    expect(container.querySelectorAll(".rel__item--wrong")).toHaveLength(0);
  });

  it("pulsar dos veces el mismo número deselecciona", () => {
    const { container } = render(<RelacionarScreen {...buildProps("easy")} />);

    fireEvent.click(leftItems(container)[0]);
    expect(leftItems(container)[0].className).toContain("rel__item--selected");

    fireEvent.click(leftItems(container)[0]);
    expect(leftItems(container)[0].className).not.toContain("rel__item--selected");
  });

  it("el motor baraja las dos columnas de forma independiente", () => {
    const seed = 4242;
    const round = session("easy", seed)[0];

    // Que coincidan no es imposible, pero si el `shuffle` desapareciera las dos
    // columnas serían idénticas y esta comprobación lo detectaría.
    expect(round.leftColumn).not.toEqual(round.rightColumn);
    expect(round.leftColumn.map((p) => p.id).sort()).toEqual(
      round.rightColumn.map((p) => p.id).sort(),
    );
  });

  it("acabar las 10 rondas muestra el resumen", () => {
    const seed = 4242;
    const rounds = session("easy", seed);

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);

    rounds.forEach((round) => {
      round.leftColumn.forEach((pair) => connectPair(container, round, pair.number));
      runTimers(ROUND_ADVANCE_MS);
    });

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.textContent).toContain(String(TOTAL_ROUNDS));
  });

  it("pulsar 'Repetir' devuelve las mismas parejas (reutiliza la semilla de sesión)", () => {
    const seed = 4242;
    const rounds = session("easy", seed);

    const { container } = render(<RelacionarScreen {...buildProps("easy", seed)} />);
    const firstNumbers = Array.from(container.querySelectorAll(".rel__number")).map((n) =>
      Number(n.textContent),
    );

    rounds.forEach((round) => {
      round.leftColumn.forEach((pair) => connectPair(container, round, pair.number));
      runTimers(ROUND_ADVANCE_MS);
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    const afterRestartNumbers = Array.from(container.querySelectorAll(".rel__number")).map((n) =>
      Number(n.textContent),
    );
    expect(afterRestartNumbers).toEqual(firstNumbers);
  });
});
