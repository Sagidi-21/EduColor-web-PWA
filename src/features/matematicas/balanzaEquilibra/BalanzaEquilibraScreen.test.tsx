import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { BalanzaEquilibraScreen } from "./BalanzaEquilibraScreen";
import { generateSession, SESSION_SIZE } from "../../../core/activities/balanzaEquilibra";
import { smokeProps, DIFFICULTIES } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("balanzaEquilibra", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 1400;

const PAN = { FULCRUM_X: 300, FULCRUM_Y: 120, ARM: 190, DROP: 120 };

/** Posición del platillo derecho en coordenadas SVG, dada la carga y el total derecho. */
function panRight(target: number, rightTotal: number): { x: number; y: number } {
  const diff = target - rightTotal;
  const angle = Math.max(-14, Math.min(14, diff * 4));
  const rad = (angle * Math.PI) / 180;
  return {
    x: PAN.FULCRUM_X + PAN.ARM * Math.cos(rad),
    y: PAN.FULCRUM_Y - PAN.ARM * Math.sin(rad) + PAN.DROP,
  };
}

/** Mock del rectángulo del SVG: mapea 1:1 coordenadas cliente ↔ coordenadas SVG. */
function mockSvgRect(svg: SVGSVGElement) {
  vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 600,
    height: 460,
    right: 600,
    bottom: 460,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/** Arrastra una pesa de 1 kg desde la bandeja hasta el platillo derecho. */
function dragOneKgToPan(container: HTMLElement, target: number, rightTotal: number) {
  const svg = container.querySelector("svg.blz__svg") as SVGSVGElement;
  const token = container.querySelector(".be__token") as SVGSVGElement;
  const pan = panRight(target, rightTotal);

  act(() => {
    fireEvent.pointerDown(token, { clientX: pan.x, clientY: pan.y, pointerId: 1 });
  });
  act(() => {
    fireEvent.pointerUp(svg);
  });
}

describe("BalanzaEquilibraScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("monta la balanza SVG, la instrucción y la bandeja de pesas", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);

    expect(container.querySelector("svg.blz__svg")).not.toBeNull();
    expect(container.querySelector(".blz__brazo")).not.toBeNull();
    expect(container.querySelector(".blz__colgador")).not.toBeNull();
    expect(container.querySelector(".blz__bandeja")).not.toBeNull();
    expect(container.querySelector(".be__instruction")?.textContent).toContain("equilibrar");
    expect(container.querySelector(".be__tray")).not.toBeNull();
  });

  it("respeta el tamaño real de sesión en el contador de progreso", () => {
    for (const d of DIFFICULTIES) {
      const { container } = render(<BalanzaEquilibraScreen {...props(d)} />);
      const session = generateSession(d, 4242);
      expect(container.querySelector(".activity-header__counter")?.getAttribute("aria-label")).toBe(
        `Ejercicio 1/${session.length}`,
      );
      expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
        `1/${session.length}`,
      );
      cleanup();
    }
  });

  it("en easy dibuja una pila de bloques de pesa en el plato izquierdo", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    const ex = generateSession("easy", 4242)[0];
    expect(ex.leftKind).toBe("weights");

    // Cuenta solo los objetos dentro del SVG principal (no la bandeja).
    const mainSvg = container.querySelector("svg.blz__svg")!;
    const blocks = mainSvg.querySelectorAll(".blz__objeto");
    expect(blocks.length).toBe(ex.target);
  });

  it("en medium dibuja un objeto en el plato izquierdo", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("medium")} />);
    const ex = generateSession("medium", 4242)[0];
    expect(ex.leftKind).toBe("object");

    const mainSvg = container.querySelector("svg.blz__svg")!;
    const objetos = mainSvg.querySelectorAll(".blz__objeto");
    expect(objetos.length).toBe(1);
    expect(objetos[0].textContent).toBe(ex.leftEmoji);
  });

  it("la balanza se inclina hacia el lado más pesado", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);

    const brazo = container.querySelector(".blz__brazo")!;

    // Sin pesas en el derecho, la izquierda es más pesada: el brazo baja a la izquierda (y1 > y2).
    const yIzq = Number(brazo.getAttribute("y1"));
    const yDer = Number(brazo.getAttribute("y2"));
    expect(yIzq).toBeGreaterThan(yDer);
  });

  it("la bandeja ofrece las denominaciones arrastrables del motor", () => {
    for (const d of DIFFICULTIES) {
      const { container } = render(<BalanzaEquilibraScreen {...props(d)} />);
      const ex = generateSession(d, 4242)[0];
      const tokens = container.querySelectorAll(".be__token");

      expect(tokens.length, d).toBe(ex.allowed.length);
      Array.from(tokens).forEach((token, i) => {
        const texts = Array.from(token.querySelectorAll("text"));
        const kgLabel = texts.find((t) => t.textContent?.includes("kg"));
        expect(kgLabel?.textContent, `token ${i} en ${d}`).toContain(`${ex.allowed[i]} kg`);
      });
      cleanup();
    }
  });

  it("equilibra al arrastrar pesas hasta el target y celebra", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    const ex = generateSession("easy", 4242)[0];
    const svg = container.querySelector("svg.blz__svg") as SVGSVGElement;
    mockSvgRect(svg);

    let rightTotal = 0;
    for (let i = 0; i < ex.target; i++) {
      dragOneKgToPan(container, ex.target, rightTotal);
      rightTotal += 1;
    }

    expect(container.querySelector(".blz__celebration")).not.toBeNull();
    expect(container.querySelector(".blz__celebration")?.textContent).toContain("Equilibrada");
  });

  it("al equilibrar, el contador del plato derecho pasa a verde", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    const ex = generateSession("easy", 4242)[0];
    const svg = container.querySelector("svg.blz__svg") as SVGSVGElement;
    mockSvgRect(svg);

    let rightTotal = 0;
    for (let i = 0; i < ex.target; i++) {
      dragOneKgToPan(container, ex.target, rightTotal);
      rightTotal += 1;
    }

    expect(container.querySelector(".be__right-label--balanced")).not.toBeNull();
    expect(container.querySelector(".be__right-label")?.textContent).toBe(`${ex.target} kg`);
  });

  it("avanza automáticamente tras equilibrar y termina en el resumen", () => {
    const seed = 7;
    const session = generateSession("easy", seed);
    const { container } = render(<BalanzaEquilibraScreen {...props("easy", seed)} />);
    const svg = container.querySelector("svg.blz__svg") as SVGSVGElement;
    mockSvgRect(svg);

    for (let i = 0; i < session.length; i++) {
      const ex = session[i];
      let rightTotal = 0;
      for (let j = 0; j < ex.target; j++) {
        dragOneKgToPan(container, ex.target, rightTotal);
        rightTotal += 1;
      }

      // El contador avanza con cada ejercicio completado.
      expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
        `${i + 1}/${session.length}`,
      );
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${session.length}/${session.length}`,
    );
  });

  it("no celebra si la suma de pesas no llega al target", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    const ex = generateSession("easy", 4242)[0];
    const svg = container.querySelector("svg.blz__svg") as SVGSVGElement;
    mockSvgRect(svg);

    // Colocar solo una pesa (target >= 2 en easy).
    dragOneKgToPan(container, ex.target, 0);

    expect(container.querySelector(".blz__celebration")).toBeNull();
    expect(container.querySelector(".be__right-label")?.textContent).toBe("1 kg");
  });

  it("el renderer no monta Numpad ni DigitCell: es arrastrar, no teclear", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });

  it("describe la balanza para quien no ve el dibujo", () => {
    const { container } = render(<BalanzaEquilibraScreen {...props("easy")} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toContain("Balanza");
  });

  it("SESSION_SIZE refleja el número de targets distintos por dificultad", () => {
    expect(SESSION_SIZE.easy).toBe(3); // 2-4 kg
    expect(SESSION_SIZE.medium).toBe(5); // 2-6 kg
    expect(SESSION_SIZE.hard).toBe(6); // 5-10 kg
    expect(SESSION_SIZE.expert).toBe(9); // 8-16 kg
  });
});
