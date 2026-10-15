import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { LaberintoMatematicoScreen } from "./LaberintoMatematicoScreen";
import {
  generateSession,
  FILLABLE_NODES,
  type LaberintoGrade,
} from "../../../core/activities/laberintoMatematico";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { confirmKey, deleteKey, pressNumpad, smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();

const NOMBRES = ["laberintoMatematico", "laberintoMatematico2"] as const;

/**
 * `laberintoMatematico` es de 1.º y `laberintoMatematico2` de 2.º, y comparten
 * motor. Los tests se apoyan en el manifiesto real, así que el curso que usa el
 * renderer sale de ahí y no de un parámetro del test.
 */
const buildProps = (
  nombre: (typeof NOMBRES)[number],
  difficulty: ActivityDifficulty,
  seed = 4242,
) => smokeProps(nombre, mockOnExit, difficulty, seed);

const nodo = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-node="${id}"]`);

const textoNodo = (container: HTMLElement, id: string) => nodo(container, id)?.textContent ?? "";

const boardBtn = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".lm-board-btn")).find(
    (b) => b.textContent === label,
  );

/** Activa un nodo y monta el Numpad. */
const activarNodo = (container: HTMLElement, id: string) => fireEvent.click(nodo(container, id)!);

/**
 * Teclea en un nodo (unidades → delante) y confirma sin validar todavía.
 */
const teclearNodo = (container: HTMLElement, id: string, valor: number) => {
  activarNodo(container, id);
  String(valor)
    .split("")
    .reverse()
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
};

const rellenarTodoCorrecto = (container: HTMLElement, answers: Record<string, number>) => {
  for (const n of FILLABLE_NODES) {
    teclearNodo(container, n, answers[n]);
  }
};

describe("LaberintoMatematicoScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each(NOMBRES)("monta el tablero, contador y botones sobre el dibujo (%s)", (nombre) => {
    const { container } = render(<LaberintoMatematicoScreen {...buildProps(nombre, "medium")} />);

    expect(container.querySelector(".lm-canvas")).not.toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/4");
    expect(boardBtn(container, "Verificar")).toBeTruthy();
    expect(boardBtn(container, "Siguiente")).toBeTruthy();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it.each(NOMBRES)("dibuja los 8 nodos, el de inicio y las 8 operaciones (%s)", (nombre) => {
    const grade: LaberintoGrade = nombre === "laberintoMatematico2" ? "2" : "1";
    const ex = generateSession("medium", 4242, grade)[0];

    const { container } = render(<LaberintoMatematicoScreen {...buildProps(nombre, "medium")} />);

    expect(container.querySelectorAll("[data-node]")).toHaveLength(FILLABLE_NODES.length);
    expect(container.querySelector(".lm-node-start")?.textContent).toBe(String(ex.start));
    expect(container.querySelectorAll(".lm-op")).toHaveLength(8);
    expect(nodo(container, "S")).toBeNull();
    expect(container.querySelector('[data-node="C"].lm-node-end')).not.toBeNull();
    expect(container.querySelector('[data-node="F"].lm-node-end')).not.toBeNull();
    expect(container.querySelector('[data-node="H"].lm-node-end')).not.toBeNull();
  });

  it("sin nada activo no hay Numpad", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".lm-foot")).toBeNull();
  });

  it("activar un nodo abre el Numpad con el teclado completo", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    activarNodo(container, "A");

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    const keys = Array.from(container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"));
    expect(keys.map((k) => k.getAttribute("aria-label") ?? k.textContent)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "Borrar",
      "Confirmar",
    ]);
  });

  it("escribir un nodo no lo valida hasta pulsar Verificar", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);

    expect(textoNodo(container, "A")).toBe(String(ex.answers.A));
    expect(nodo(container, "A")?.className).toContain("lm-ns-empty");
    expect(container.querySelector(".shared-numpad")).toBeNull();
  });

  it("Verificar marca correctos en verde e incorrectos en rojo", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);
    teclearNodo(container, "B", ex.answers.B + 9);

    fireEvent.click(boardBtn(container, "Verificar")!);

    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
    expect(nodo(container, "B")?.className).toContain("lm-ns-err");
    expect(boardBtn(container, "Reintentar")).toBeTruthy();
    expect(boardBtn(container, "Verificar")).toBeUndefined();
    expect(boardBtn(container, "Siguiente")).toBeTruthy();
  });

  it("Reintentar solo limpia los fallados", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);
    teclearNodo(container, "B", ex.answers.B + 9);
    fireEvent.click(boardBtn(container, "Verificar")!);
    fireEvent.click(boardBtn(container, "Reintentar")!);

    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
    expect(textoNodo(container, "A")).toBe(String(ex.answers.A));
    expect(nodo(container, "B")?.className).toContain("lm-ns-empty");
    expect(textoNodo(container, "B")).toBe("");
    expect(boardBtn(container, "Verificar")).toBeTruthy();
  });

  it("un nodo ya correcto no se vuelve a abrir", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);
    fireEvent.click(boardBtn(container, "Verificar")!);
    activarNodo(container, "A");

    expect(container.querySelector(".shared-numpad")).toBeNull();
  });

  it("borrar en el Numpad quita la última cifra", () => {
    const ex = generateSession("medium", 4242, "1")[0];
    const dosCifras = ex.answers.A >= 10 ? ex.answers.A : ex.answers.A + 10;

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    activarNodo(container, "A");
    pressNumpad(container, String(dosCifras % 10));
    pressNumpad(container, String(Math.floor(dosCifras / 10) % 10));
    pressNumpad(container, deleteKey);
    pressNumpad(container, confirmKey);

    expect(textoNodo(container, "A")).toBe(String(dosCifras % 10));
  });

  it("Siguiente pasa al siguiente laberinto sin verificar", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    fireEvent.click(boardBtn(container, "Siguiente")!);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/4");
  });

  it("acabar la sesión con Siguiente muestra el resumen", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    for (let i = 0; i < 4; i++) {
      fireEvent.click(boardBtn(container, i < 3 ? "Siguiente" : "Ver resultado")!);
    }

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.querySelector(".summary")).not.toBeNull();
  });

  it("Verificar todo correcto deja los nodos en ok", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    rellenarTodoCorrecto(container, ex.answers);
    fireEvent.click(boardBtn(container, "Verificar")!);

    for (const n of FILLABLE_NODES) {
      expect(nodo(container, n)?.className, `nodo ${n}`).toContain("lm-ns-ok");
    }
    expect(boardBtn(container, "Verificar")).toBeTruthy();
  });

  it("el fondo del laberinto es el mismo con la misma semilla", () => {
    const una = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoA = una.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    cleanup();

    const otra = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium", 777)} />);
    const fondoB = otra.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    cleanup();

    const tercera = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoC = tercera.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");

    expect(fondoA).toBeTruthy();
    expect(fondoA).toBe(fondoC);
    expect(fondoA).not.toBe(fondoB);
  });
});
