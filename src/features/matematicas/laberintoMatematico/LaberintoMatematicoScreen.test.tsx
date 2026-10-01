import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { LaberintoMatematicoScreen } from "./LaberintoMatematicoScreen";
import {
  generateSession,
  FILLABLE_NODES,
  type LaberintoGrade,
} from "../../../core/activities/laberintoMatematico";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import { confirmKey, deleteKey, pressNumpad, smokeProps, switchToCanvas } from "../testing/smoke";

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

const pregunta = (container: HTMLElement) =>
  container.querySelector(".lm-question")?.textContent ?? "";

const respuestaFinal = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>(".lm-final-input");

/** Activa un nodo y monta el Numpad (que es lo que aparece en el pie). */
const activarNodo = (container: HTMLElement, id: string) => fireEvent.click(nodo(container, id)!);

/**
 * Teclea en un nodo. Las cifras van de unidades hacia delante, que es como se
 * guarda el valor, así que el número se teclea invertido.
 */
const teclearNodo = (container: HTMLElement, id: string, valor: number) => {
  activarNodo(container, id);
  String(valor)
    .split("")
    .reverse()
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
};

/** Teclea la respuesta final, que sí se teclea en su orden de lectura. */
const teclearFinal = (container: HTMLElement, valor: number) => {
  fireEvent.click(respuestaFinal(container)!);
  String(valor)
    .split("")
    .forEach((d) => pressNumpad(container, d));
  pressNumpad(container, confirmKey);
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

  it.each(NOMBRES)("monta con la pregunta del motor y el contador 1/5 (%s)", (nombre) => {
    const grade: LaberintoGrade = nombre === "laberintoMatematico2" ? "2" : "1";
    const ejercicios = generateSession("medium", 4242, grade);
    const ex = ejercicios[0];

    const { container } = render(<LaberintoMatematicoScreen {...buildProps(nombre, "medium")} />);

    expect(pregunta(container)).toBe(ex.question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/5");
  });

  it.each(NOMBRES)("dibuja los 8 nodos, el de inicio y las 8 operaciones (%s)", (nombre) => {
    const grade: LaberintoGrade = nombre === "laberintoMatematico2" ? "2" : "1";
    const ex = generateSession("medium", 4242, grade)[0];

    const { container } = render(<LaberintoMatematicoScreen {...buildProps(nombre, "medium")} />);

    expect(container.querySelectorAll("[data-node]")).toHaveLength(FILLABLE_NODES.length);
    expect(container.querySelector(".lm-node-start")?.textContent).toBe(String(ex.start));
    expect(container.querySelectorAll(".lm-op")).toHaveLength(8);
    // El nodo de inicio no es rellenable: los 8 sí lo son.
    expect(nodo(container, "S")).toBeNull();
    expect(container.querySelector('[data-node="C"].lm-node-end')).not.toBeNull();
    expect(container.querySelector('[data-node="F"].lm-node-end')).not.toBeNull();
    expect(container.querySelector('[data-node="H"].lm-node-end')).not.toBeNull();
  });

  it("sin nada activo no hay Numpad: se ve la pregunta y la respuesta final", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(respuestaFinal(container)).not.toBeNull();
    // La respuesta final empieza con el hueco, no con un cero.
    expect(respuestaFinal(container)?.value).toBe("□");
  });

  it("activar un nodo abre el Numpad con el teclado completo", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    activarNodo(container, "A");

    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    expect(
      Array.from(container.querySelectorAll(".shared-numpad__key")).map((k) => k.textContent),
    ).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "←", "✓"]);
  });

  it("escribir la solución de un nodo lo marca en verde", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);

    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
    expect(textoNodo(container, "A")).toBe(String(ex.answers.A));
    // Confirmar desactiva el nodo y el Numpad se recoge.
    expect(container.querySelector(".shared-numpad")).toBeNull();
  });

  it("escribir mal un nodo lo marca en rojo y, pasado el aviso, lo deja vacío", () => {
    const ex = generateSession("medium", 4242, "1")[0];
    const malo = ex.answers.A + 7;

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", malo);

    expect(nodo(container, "A")?.className).toContain("lm-ns-err");

    // El aviso dura 380 ms y luego la casilla deja de pintarse en rojo.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(nodo(container, "A")?.className).toContain("lm-ns-empty");
    // Las cifras tecleadas se quedan, como en el original: el niño las corrige
    // en vez de volver a escribir el número entero. Solo el lienzo las borra.
    expect(textoNodo(container, "A")).toBe(String(malo));
  });

  it("un nodo ya acertado no se vuelve a abrir", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearNodo(container, "A", ex.answers.A);
    activarNodo(container, "A");

    expect(container.querySelector(".shared-numpad")).toBeNull();
  });

  it("borrar deshace la última cifra tecleada", () => {
    const ex = generateSession("medium", 4242, "1")[0];
    const dosCifras = ex.answers.A;
    if (dosCifras < 10) return; // con un solo dígito no hay nada que borrar

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    activarNodo(container, "A");
    // De unidades hacia delante: primero el dígito de las unidades.
    pressNumpad(container, String(dosCifras % 10));
    pressNumpad(container, String(Math.floor(dosCifras / 10) % 10));
    pressNumpad(container, deleteKey);

    // Sin la cifra de las decenas el número ya no se reconstruye bien, así que
    // confirmar lo deja en error en vez de en acierto.
    pressNumpad(container, confirmKey);
    expect(nodo(container, "A")?.className).toContain("lm-ns-err");
  });

  it("acertar la pregunta final habilita el avance", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearFinal(container, ex.answers[ex.correctFin]);

    expect(respuestaFinal(container)?.className).toContain("lm-ns-ok");
    fireEvent.click(container.querySelector(".activity-action--next")!);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/5");
  });

  it("fallar la pregunta final no deja avanzar y avisa en rojo", () => {
    const ex = generateSession("medium", 4242, "1")[0];
    const malo = ex.answers[ex.correctFin] + 5;

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    teclearFinal(container, malo);

    expect(respuestaFinal(container)?.className).toContain("lm-ns-err");
    // Aun con el botón a la vista, sin acertar no se pasa de ejercicio.
    fireEvent.click(container.querySelector(".activity-action--next")!);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/5");

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(respuestaFinal(container)?.className).toContain("lm-ns-empty");
  });

  it("revelar enseña todas las soluciones y también deja pasar", () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    fireEvent.click(container.querySelector(".activity-action--retry")!);

    for (const n of FILLABLE_NODES) {
      expect(nodo(container, n)?.className, `nodo ${n}`).toContain("lm-ns-ok");
      expect(textoNodo(container, n), `nodo ${n}`).toBe(String(ex.answers[n]));
    }
    expect(respuestaFinal(container)?.value).toBe(String(ex.answers[ex.correctFin]));
    fireEvent.click(container.querySelector(".activity-action--next")!);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/5");
  });

  it("los dos botones del pie son los compartidos", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    expect(container.querySelector(".activity-actions")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")?.textContent).toBe("👁 Revelar");
    expect(container.querySelector(".activity-action--next")?.textContent).toBe("Siguiente →");
  });

  it("el toggle de modo de entrada está siempre disponible", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    expect(container.querySelector(".input-toggle")).not.toBeNull();
  });

  it("en modo escritura se monta el DigitCell y no el Numpad", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    switchToCanvas(container);
    activarNodo(container, "A");

    expect(container.querySelector(".shared-numpad")).toBeNull();
    // Va con React.lazy: el fallback demuestra que se pidió sin cargarlo antes.
    expect(container.querySelector(".dab--loading")).not.toBeNull();
    expect(container.querySelector(".lm-canvas-overlay")).not.toBeNull();
  });

  it("acabar la sesión muestra el resumen con los cinco ejercicios", () => {
    const grade: LaberintoGrade = "1";
    const ejercicios = generateSession("medium", 4242, grade);

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    ejercicios.forEach((ex) => {
      teclearFinal(container, ex.answers[ex.correctFin]);
      fireEvent.click(container.querySelector(".activity-action--next")!);
    });

    // Ya no hay cabecera de actividad: se ve el resumen.
    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.querySelector(".summary")).not.toBeNull();
    expect(container.textContent).toContain(`${ejercicios.length}/5`);
    // Se usan todos: la sesión se reveló y pasó, así que el contador de aciertos
    // va por detrás, pero los cinco ejercicios están.
    expect(container.querySelector(".summary__stat-value")?.textContent).toContain("5");
  });

  it("el resumen vuelve a empezar por el primer laberinto", () => {
    const grade: LaberintoGrade = "1";
    const ejercicios = generateSession("medium", 4242, grade);

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    ejercicios.forEach((ex) => {
      teclearFinal(container, ex.answers[ex.correctFin]);
      fireEvent.click(container.querySelector(".activity-action--next")!);
    });

    fireEvent.click(container.querySelector(".summary__btn--primary")!);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/5");
    expect(respuestaFinal(container)?.value).toBe("□");
    expect(pregunta(container)).toBe(ejercicios[0].question);
  });

  it("el fondo del laberinto es el mismo con la misma semilla", () => {
    const una = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoA = una.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    cleanup();

    const otra = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium", 777)} />);
    const fondoB = otra.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    cleanup();

    // El fondo se elige por semilla, así que repetirla lo mantiene.
    const misma = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoC = misma.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");

    expect(fondoA).toBe(fondoC);
    // Y con 13 fondos distintos no puede ser siempre el mismo.
    expect(new Set([fondoA, fondoB]).size).toBeGreaterThan(1);
  });
});
