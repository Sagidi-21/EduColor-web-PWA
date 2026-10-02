import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, act } from "@testing-library/react";
import { IntervalosTiempoScreen } from "./IntervalosTiempoScreen";
import { generateSession } from "../../../core/activities/intervalosTiempo";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("intervalosTiempo", mockOnExit, difficulty, seed);

/** El renderer salta de ejercicio solo tras acertar; 900 ms es su espera. */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/** El primer ejercicio de la sesión que genera el motor con esos props. */
function primerEjercicio(difficulty: EngineScreenProps["difficulty"], seed = 4242) {
  const ex = generateSession(difficulty, seed)[0];
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} está vacía`);
  return ex;
}

/** Primer ejercicio de `classify-hour` de la sesión, o error si no hay ninguno. */
function primerClasificador(difficulty: EngineScreenProps["difficulty"], seed = 4242) {
  const ex = generateSession(difficulty, seed).find((e) => e.type === "classify-hour");
  if (!ex) throw new Error(`La sesión ${difficulty}/${seed} no tiene ningún classify-hour`);
  return ex;
}

const tarjetas = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".itm__activity"));
const botonesClasificar = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".itm__classify-btn"));
/** Índice de la tarjeta de la actividad con ese nombre. */
const indiceDe = (c: HTMLElement, nombre: string) =>
  tarjetas(c).findIndex((t) => t.dataset.name === nombre);
/** La actividad a la que corresponde la respuesta correcta, con su nombre limpio. */
const nombreCorrecto = (respuesta: string) =>
  respuesta.charAt(0).toLowerCase() + respuesta.slice(1);
/** La actividad que NO es la respuesta correcta. */
const incorrecta = (ex: ReturnType<typeof primerEjercicio>): string => {
  const otra = ex.activities.find((a) => a.name.toLowerCase() !== ex.correctAnswer.toLowerCase());
  if (!otra) throw new Error("El ejercicio tiene dos actividades distintas");
  return otra.name;
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("intervalosTiempo — comparar dos actividades", () => {
  it("muestra el enunciado del núcleo y una tarjeta por actividad", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    expect(container.querySelector(".itm__question")?.textContent).toBe(ex.question);
    expect(tarjetas(container)).toHaveLength(2);
    expect(container.querySelector(".itm__classify-opts")).toBeNull();
  });

  it("cada tarjeta lleva emoji, nombre y duración de su actividad", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    for (const act of ex.activities) {
      const i = indiceDe(container, act.name);
      expect(i, act.name).toBeGreaterThanOrEqual(0);
      const tarjeta = tarjetas(container)[i];
      expect(tarjeta.querySelector(".itm__activity-emoji")?.textContent).toBe(act.emoji);
      expect(tarjeta.querySelector(".itm__activity-name")?.textContent).toBe(act.name);
      expect(tarjeta.querySelector(".itm__activity-time")?.textContent).toBe(act.label);
    }
  });

  it("acierto: marca la tarjeta correcta, celebra y avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    fireEvent.click(tarjetas(container)[indiceDe(container, nombreCorrecto(ex.correctAnswer))]);

    expect(container.querySelector(".itm__activity--correct")).not.toBeNull();
    expect(container.querySelector(".itm__cheer")?.textContent).toContain("¡Correcto!");
    expect(container.querySelector(".itm__stage")?.className).toContain("itm__stage--correct");

    runTimers(AUTOAVANCE_MS);
    expect(container.querySelector(".itm__question")?.textContent).not.toBe(ex.question);
  });

  it("fallo: marca la elegida, ofrece reintentar y no avanza solo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    fireEvent.click(tarjetas(container)[indiceDe(container, incorrecta(ex))]);

    expect(container.querySelector(".itm__activity--wrong")).not.toBeNull();
    expect(container.querySelector(".itm__cheer")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(container.querySelector(".itm__question")?.textContent).toBe(ex.question);
  });

  it("después de reintentar se puede acertar y ya no hay que reintentar", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    fireEvent.click(tarjetas(container)[indiceDe(container, incorrecta(ex))]);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".itm__activity--wrong")).toBeNull();

    fireEvent.click(tarjetas(container)[indiceDe(container, nombreCorrecto(ex.correctAnswer))]);
    expect(container.querySelector(".itm__activity--correct")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    fireEvent.click(tarjetas(container)[indiceDe(container, incorrecta(ex))]);
    const yaRespondido = tarjetas(container).map((t) => t.disabled);
    expect(yaRespondido.every(Boolean)).toBe(true);

    // El botón está deshabilitado, pero el guardia del núcleo tampoco deja
    // cambiar la respuesta: sigue en estado "fallado", sin celebrar ni avanzar.
    fireEvent.click(tarjetas(container)[indiceDe(container, nombreCorrecto(ex.correctAnswer))]);
    expect(container.querySelector(".itm__cheer")).toBeNull();
    expect(container.querySelector(".itm__stage")?.className).not.toContain("itm__stage--correct");
    expect(container.querySelector(".itm__question")?.textContent).toBe(ex.question);
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
  });

  it("muestra las barras en easy y medium, y no en expert", () => {
    for (const dificultad of ["easy", "medium", "expert"] as const) {
      const { container, unmount } = render(<IntervalosTiempoScreen {...props(dificultad)} />);
      const barras = container.querySelector(".itm__bars");
      if (dificultad === "expert") expect(barras, dificultad).toBeNull();
      else expect(barras, dificultad).not.toBeNull();
      unmount();
    }
  });

  it("las barras son proporcionales: la más larga ocupa el ancho completo", () => {
    const ex = primerEjercicio("medium");
    const { container } = render(<IntervalosTiempoScreen {...props("medium")} />);

    const anchos = Array.from(container.querySelectorAll<HTMLElement>(".itm__bar")).map((b) =>
      parseFloat(b.style.width),
    );
    expect(anchos).toHaveLength(2);
    expect(Math.max(...anchos)).toBe(100);
    const proporcion = Math.min(...anchos) / Math.max(...anchos);
    const real =
      Math.min(...ex.activities.map((a) => a.seconds)) /
      Math.max(...ex.activities.map((a) => a.seconds));
    expect(proporcion).toBeCloseTo(real, 1);
  });

  it("el botón de siguiente sí avanza tras un fallo", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    fireEvent.click(tarjetas(container)[indiceDe(container, incorrecta(ex))]);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(container.querySelector(".itm__question")?.textContent).not.toBe(ex.question);
    expect(container.querySelector(".itm__activity--wrong")).toBeNull();
  });
});

describe("intervalosTiempo — clasificar más o menos de 1 hora", () => {
  it("muestra una sola actividad y las dos frases de respuesta", () => {
    const ex = primerClasificador("hard");
    const { container } = render(<IntervalosTiempoScreen {...props("hard")} />);

    expect(container.querySelector(".itm__question")?.textContent).toBe(ex.question);
    expect(tarjetas(container)).toHaveLength(0);
    expect(container.querySelector(".itm__single-name")?.textContent).toBe(ex.activities[0].name);
    expect(botonesClasificar(container).map((b) => b.textContent)).toEqual([
      "Más de 1 hora",
      "Menos de 1 hora",
    ]);
  });

  it("acierto en la frase correcta marca el botón verde", () => {
    const ex = primerClasificador("hard");
    const { container } = render(<IntervalosTiempoScreen {...props("hard")} />);

    const i = botonesClasificar(container).findIndex((b) => b.dataset.value === ex.correctAnswer);
    fireEvent.click(botonesClasificar(container)[i]);

    expect(container.querySelector(".itm__classify-btn--correct")?.textContent).toBe(
      ex.correctAnswer,
    );
    expect(container.querySelector(".itm__cheer")).not.toBeNull();
  });

  it("la frase acertada depende de si la actividad pasa de 1 hora", () => {
    for (const dificultad of ["hard", "expert"] as const) {
      for (const ex of generateSession(dificultad, 4242).filter(
        (e) => e.type === "classify-hour",
      )) {
        const larga = ex.activities[0].seconds > 3600;
        expect(ex.correctAnswer, ex.question).toBe(larga ? "Más de 1 hora" : "Menos de 1 hora");
      }
    }
  });

  it("no monta Numpad ni DigitCell: se responde con un toque", () => {
    const { container } = render(<IntervalosTiempoScreen {...props("hard")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
  });
});

describe("intervalosTiempo — determinismo, resumen y salida", () => {
  it("repetir regenera la misma sesión, con la misma semilla", () => {
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);
    const sesion = generateSession("easy", 4242);

    // Se recorre la sesión entera acertando siempre, para llegar al resumen.
    for (const ex of sesion) {
      fireEvent.click(tarjetas(container)[indiceDe(container, nombreCorrecto(ex.correctAnswer))]);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(container.querySelector(".itm__question")?.textContent).toBe(sesion[0].question);
    expect(container.querySelector(".itm__activity--correct")).toBeNull();
  });

  it("la cabecera muestra el progreso real de la sesión", () => {
    const { container } = render(<IntervalosTiempoScreen {...props("medium")} />);
    expect(container.textContent).toContain(`1 / ${generateSession("medium", 4242).length}`);
  });

  it("el botón de salir avisa y no cambia de ejercicio", () => {
    const ex = primerEjercicio("easy");
    const { container } = render(<IntervalosTiempoScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(container.querySelector(".itm__question")?.textContent).toBe(ex.question);
  });
});
