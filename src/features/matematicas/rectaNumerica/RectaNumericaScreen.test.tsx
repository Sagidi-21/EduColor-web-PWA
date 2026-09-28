import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RectaNumericaScreen } from "./RectaNumericaScreen";
import { generateSession, validateAnswer } from "../../../core/activities/rectaNumerica";
import type { RectaExercise } from "../../../core/activities/rectaNumerica";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const AUTO_ADVANCE_MS = 1300;

/** Geometría de la recta, replicada del renderer para poder arrastrar sin CSS. */
const X0 = 60;
const X1 = 940;
const W = X1 - X0;
const SVG_W = 1000;
const SVG_H = 340;
const LINE_Y = 220;

/** Coordenada de pantalla que corresponde a un valor de la recta. */
const xOf = (value: number, max: number) => X0 + (value / max) * W;

const session = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed);

const buildProps = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("rectaNumerica", mockOnExit, difficulty, seed);

const instructionOf = (container: HTMLElement) =>
  container.querySelector(".rct__instruction")?.textContent ?? "";

const svgOf = (container: HTMLElement) =>
  container.querySelector<SVGSVGElement>(".rct__svg") as SVGSVGElement;

/**
 * happy-dom devuelve siempre un `DOMRect` vacío, así que `toSvg` dividiría por
 * cero y el valor caería siempre en el extremo derecho, sin poder acertar nunca.
 * Se devuelve un rectángulo de 1000×340, que es exactamente el espacio de
 * coordenadas en el que el renderer trabaja, de modo que `clientX` coincide con
 * la coordenada SVG.
 */
const mockRect = () => {
  const spy = vi
    .spyOn(SVGSVGElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ left: 0, top: 0, width: SVG_W, height: SVG_H } as DOMRect);
  return () => spy.mockRestore();
};

/**
 * Arrastra la tarjeta hasta la posición del valor indicado y la suelta.
 *
 * La tarjeta es el único `<g>` del SVG que contiene un `<rect>`; la marca de
 * posición es otro `<g>` pero solo lleva `line` y `circle`.
 */
const dragTo = (container: HTMLElement, clientX: number) => {
  const svg = svgOf(container);
  const card = Array.from(container.querySelectorAll(".rct__svg g")).find((g) =>
    g.querySelector("rect"),
  );
  expect(card).toBeDefined();

  fireEvent.pointerDown(card!);
  fireEvent.pointerMove(svg, { clientX, clientY: LINE_Y - 76 });
  fireEvent.pointerUp(svg);
};

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("RectaNumericaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la instrucción del motor y el contador 1/N", () => {
    const seed = 4242;
    const exercises = session("medium", seed);

    const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);

    expect(instructionOf(container)).toBe(
      `Arrastra el ${exercises[0].target} a su lugar en la recta`,
    );
    expect(container.querySelector(".rct__target")?.textContent).toBe(String(exercises[0].target));
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1 / ${exercises.length}`,
    );
  });

  it("es una actividad de arrastre: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<RectaNumericaScreen {...buildProps("medium")} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("la recta se etiqueta cada `labelEvery` unidades, de 0 a `max`", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];

    const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);
    const labels = Array.from(container.querySelectorAll(".rct__svg text")).map(
      (t) => t.textContent,
    );

    for (let v = 0; v <= ex.max; v += ex.labelEvery) {
      expect(labels).toContain(String(v));
    }
  });

  it("soltar en el sitio correcto celebra y avanza solo", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const ex = exercises[0];
    const restore = mockRect();

    try {
      const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);
      dragTo(container, xOf(ex.target, ex.max));

      expect(container.querySelector(".rct__celebration")?.textContent).toContain("¡En su sitio!");
      expect(container.querySelector(".rct__hint")).toBeNull();

      runAutoAdvance();
      expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
        `2 / ${exercises.length}`,
      );
    } finally {
      restore();
    }
  });

  it("soltar en otro sitio avisa con la pista y no avanza", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];
    // Un valor claramente distinto del objetivo.
    const other = ex.target === ex.max - 1 ? ex.target - 1 : ex.target + 1;
    expect(other).not.toBe(ex.target);
    const restore = mockRect();

    try {
      const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);
      dragTo(container, xOf(other, ex.max));

      expect(container.querySelector(".rct__celebration")).toBeNull();
      expect(container.querySelector(".rct__hint")?.textContent).toContain("arrástralo");
      // Este renderer no ofrece reintentar: se puede volver a intentarlo.
      expect(container.querySelector(".activity-action--retry")).toBeNull();
      expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1 / 10");
    } finally {
      restore();
    }
  });

  it("tras un fallo se puede reintentar y acertar en el mismo ejercicio", () => {
    const seed = 4242;
    const ex = session("medium", seed)[0];
    const other = ex.target === ex.max - 1 ? ex.target - 1 : ex.target + 1;
    const restore = mockRect();

    try {
      const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);
      dragTo(container, xOf(other, ex.max));
      expect(container.querySelector(".rct__hint")).not.toBeNull();

      dragTo(container, xOf(ex.target, ex.max));
      expect(container.querySelector(".rct__celebration")).not.toBeNull();
    } finally {
      restore();
    }
  });

  it("el validador del motor acepta solo el valor exacto", () => {
    const seed = 4242;
    const ex = session("easy", seed)[0];

    expect(validateAnswer(ex, ex.target)).toBe(true);
    expect(validateAnswer(ex, ex.target + 1)).toBe(false);
    expect(validateAnswer(ex, 0)).toBe(false);
  });

  it("las cuatro dificultades mantienen el objetivo dentro de la recta", () => {
    const seed = 4242;

    (["easy", "medium", "hard", "expert"] as EngineScreenProps["difficulty"][]).forEach(
      (difficulty) => {
        session(difficulty, seed).forEach((ex: RectaExercise) => {
          // Nunca en los extremos, que ya están etiquetados.
          expect(ex.target).toBeGreaterThan(0);
          expect(ex.target).toBeLessThan(ex.max);
        });
      },
    );
  });

  it("acabar la sesión muestra el resumen", () => {
    const seed = 4242;
    const exercises = session("medium", seed);
    const restore = mockRect();

    try {
      const { container } = render(<RectaNumericaScreen {...buildProps("medium", seed)} />);

      exercises.forEach((ex) => {
        dragTo(container, xOf(ex.target, ex.max));
        runAutoAdvance();
      });

      expect(container.querySelector(".activity-header__counter")).toBeNull();
      expect(container.textContent).toContain(String(exercises.length));
    } finally {
      restore();
    }
  });
});
