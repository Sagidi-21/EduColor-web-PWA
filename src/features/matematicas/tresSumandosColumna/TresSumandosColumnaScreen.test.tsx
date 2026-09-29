import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TresSumandosColumnaScreen } from "./TresSumandosColumnaScreen";
import { generateSession } from "../../../core/activities/tresSumandosColumna";
import { smokeProps, typeUnitsFirst, switchToCanvas } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("tresSumandosColumna", mockOnExit, difficulty, seed);

const boxes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>(".tsc__box"));

describe("TresSumandosColumnaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("muestra los tres sumandos en columna y las dos casillas D/U", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];

    const { container } = render(<TresSumandosColumnaScreen {...props("easy", seed)} />);

    expect(container.querySelector(".tsc__grid")).not.toBeNull();
    const labels = Array.from(container.querySelectorAll(".tsc__col-label")).map(
      (l) => l.textContent,
    );
    expect(labels).toEqual(["D", "U"]);
    expect(boxes(container)).toHaveLength(2);

    // Los dígitos que pinta salen del descompuesto del motor.
    const digits = Array.from(container.querySelectorAll(".tsc__digit")).map((d) => d.textContent);
    expect(digits).toContain(String(ex.aU));
    expect(digits).toContain(String(ex.bU));
    expect(digits).toContain(String(ex.cU));
  });

  it("empieza con la casilla de las unidades activa", () => {
    const { container } = render(<TresSumandosColumnaScreen {...props("easy", 4242)} />);

    expect(boxes(container)[1].className).toContain("tsc__box--active");
    expect(boxes(container)[0].className).not.toContain("tsc__box--active");
  });

  it("teclea de derecha a izquierda y valida la suma de los tres sumandos", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];
    expect(ex.answer).toBe(ex.a + ex.b + ex.c);

    const { container } = render(<TresSumandosColumnaScreen {...props("easy", seed)} />);

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    typeUnitsFirst(container, ex.answer);

    expect(container.querySelector(".tsc__celebration")?.textContent).toContain("¡Muy bien!");
    expect(boxes(container).every((b) => b.className.includes("tsc__box--correct"))).toBe(true);
  });

  it("fallo: no celebra y marca las casillas como erróneas", () => {
    const seed = 4242;
    const ex = generateSession("easy", seed)[0];
    const wrong = ex.answer === 99 ? 98 : ex.answer + 1;

    const { container } = render(<TresSumandosColumnaScreen {...props("easy", seed)} />);

    typeUnitsFirst(container, wrong);

    expect(container.querySelector(".tsc__celebration")).toBeNull();
    expect(boxes(container).every((b) => b.className.includes("tsc__box--wrong"))).toBe(true);
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("la casilla pulsada pasa a ser la activa", () => {
    const { container } = render(<TresSumandosColumnaScreen {...props("easy", 4242)} />);

    fireEvent.click(boxes(container)[0]);

    expect(boxes(container)[0].className).toContain("tsc__box--active");
    expect(boxes(container)[1].className).not.toContain("tsc__box--active");
  });

  it("al cambiar a modo escritura se monta el DigitCell y desaparece el Numpad", () => {
    const { container } = render(<TresSumandosColumnaScreen {...props("easy", 4242)} />);

    switchToCanvas(container);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab--loading")).not.toBeNull();
  });
});
