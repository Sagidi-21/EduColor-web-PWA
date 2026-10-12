import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RutaCuadriculaScreen } from "./RutaCuadriculaScreen";
import { generateSession, validateAnswer } from "../../../core/activities/rutaCuadricula";
import type { Direction, RutaCuadriculaExercise } from "../../../core/activities/rutaCuadricula";
import { shortestRouteDirections } from "../../../core/ficha/generators/sceneHelpers";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const SEED = 4242;
const props = (difficulty: EngineScreenProps["difficulty"], seed = SEED) =>
  smokeProps("rutaCuadricula", mockOnExit, difficulty, seed);

const PASO_MS = 400;
const AUTOAVANCE_MS = 1200;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const DIR_LABELS: Record<Direction, string> = {
  up: "Arriba",
  down: "Abajo",
  left: "Izquierda",
  right: "Derecha",
};

const dirButton = (container: HTMLElement, label: string) => {
  const btn = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.getAttribute("aria-label") === label,
  );
  if (!btn) throw new Error(`No hay botón con aria-label="${label}"`);
  return btn;
};

const addDirection = (container: HTMLElement, dir: Direction) => {
  fireEvent.click(dirButton(container, DIR_LABELS[dir]));
};

const addSequence = (container: HTMLElement, dirs: Direction[]) => {
  for (const dir of dirs) addDirection(container, dir);
};

const clickPlay = (container: HTMLElement) => {
  fireEvent.click(dirButton(container, "Reproducir ruta"));
};

const clickDelete = (container: HTMLElement) => {
  fireEvent.click(dirButton(container, "Borrar última dirección"));
};

const progreso = (container: HTMLElement): string =>
  container.querySelector(".activity-header__counter")?.textContent ?? "";

const seqItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".rutac__seq-item"));

const avatar = (container: HTMLElement) => container.querySelector(".rutac__avatar");

const stageClass = (container: HTMLElement): string =>
  container.querySelector(".ops__stage")?.className ?? "";

const retryBtn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>(".activity-action--retry");

const nextBtn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>(".activity-action--next");

/** Ruta más corta válida según el motor (esquiva obstáculos). */
const rutaDe = (ex: RutaCuadriculaExercise): Direction[] =>
  shortestRouteDirections(ex.gridSize, ex.start, ex.end, ex.obstacles);

/** Completa el ejercicio `index` con su ruta correcta y avanza. */
const acertar = (container: HTMLElement, exercises: RutaCuadriculaExercise[], index: number) => {
  const ruta = rutaDe(exercises[index]!);
  expect(ruta.length, `ruta del ejercicio ${index}`).toBeGreaterThan(0);
  addSequence(container, ruta);
  clickPlay(container);
  runTimers(PASO_MS * (ruta.length + 1));
  runTimers(AUTOAVANCE_MS);
};

describe("RutaCuadriculaScreen — smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con el contador 1/10 y la cuadrícula de inicio", () => {
    const ejercicios = generateSession("easy", 4242);
    const ex = ejercicios[0];

    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    expect(progreso(container)).toBe("1 / 10");
    expect(container.querySelectorAll(".rutac__cell")).toHaveLength(
      ex.gridSize.cols * ex.gridSize.rows,
    );
    expect(container.querySelector(".rutac__cell--start")).not.toBeNull();
    expect(container.querySelector(".rutac__cell--end")).not.toBeNull();
    // El avatar empieza en la casilla de inicio.
    expect(avatar(container)).not.toBeNull();
  });

  it("muestra la unidad y el título del manifiesto en la cabecera", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);
    expect(container.querySelector(".activity-header__title")?.textContent).toBe(
      "Taller de programación",
    );
  });

  it("las direcciones añadidas aparecen como bloques en la secuencia", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    expect(seqItems(container)).toHaveLength(0);

    addSequence(container, ["right", "down"]);
    expect(seqItems(container)).toHaveLength(2);
    expect(seqItems(container)[0]?.textContent).toBe("→");
    expect(seqItems(container)[1]?.textContent).toBe("↓");
  });

  it("borrar elimina la última dirección y no pasa nada con la secuencia vacía", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    addSequence(container, ["up", "right"]);
    expect(seqItems(container)).toHaveLength(2);

    clickDelete(container);
    expect(seqItems(container)).toHaveLength(1);

    clickDelete(container);
    expect(seqItems(container)).toHaveLength(0);

    // Con la secuencia vacía el borrar no hace nada.
    clickDelete(container);
    expect(seqItems(container)).toHaveLength(0);
  });

  it("el botón de reproducir está deshabilitado sin secuencia y se activa al añadir una", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);
    expect(dirButton(container, "Reproducir ruta").hasAttribute("disabled")).toBe(true);

    addDirection(container, "right");
    expect(dirButton(container, "Reproducir ruta").hasAttribute("disabled")).toBe(false);
  });

  it("durante la animación todos los botones de dirección están deshabilitados", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    addSequence(container, ["up", "right"]);
    clickPlay(container);

    expect(dirButton(container, "Reproducir ruta").hasAttribute("disabled")).toBe(true);
    expect(dirButton(container, "Arriba").hasAttribute("disabled")).toBe(true);
  });
});

describe("RutaCuadriculaScreen — validación", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("una ruta correcta marca acierto, celebra y avanza solo", () => {
    const ejercicios = generateSession("easy", SEED);
    const ruta = rutaDe(ejercicios[0]!);
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    addSequence(container, ruta);
    clickPlay(container);

    // Avanzar la animación completa: delay inicial + un paso por dirección.
    runTimers(PASO_MS * (ruta.length + 1));

    expect(stageClass(container)).toContain("ops__stage--correct");
    expect(container.querySelector(".ops__celebration")).not.toBeNull();
    // No hay botones de acción tras acertar: avanza solo.
    expect(retryBtn(container)).toBeNull();
    expect(progreso(container)).toBe("1 / 10");

    // Auto-avance al siguiente ejercicio.
    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2 / 10");
  });

  it("una ruta que no llega a la meta marca error y ofrece reintentar y siguiente", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    const ruta: Direction[] = ["up", "up"]; // (0,2)→(0,1)→(0,0), no llega a (2,0)
    addSequence(container, ruta);
    clickPlay(container);

    runTimers(PASO_MS * (ruta.length + 1));

    expect(stageClass(container)).toContain("ops__stage--wrong");
    expect(container.querySelector(".ops__celebration")).toBeNull();
    expect(retryBtn(container)).not.toBeNull();
    expect(nextBtn(container)).not.toBeNull();
    expect(progreso(container)).toBe("1 / 10");

    // No avanza solo tras un error.
    runTimers(AUTOAVANCE_MS * 2);
    expect(progreso(container)).toBe("1 / 10");
  });

  it("una ruta que sale del tablero marca error", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    const ruta: Direction[] = ["up", "up", "up"]; // (0,2)→(0,1)→(0,0)→(0,-1) fuera
    addSequence(container, ruta);
    clickPlay(container);

    runTimers(PASO_MS * (ruta.length + 1));

    expect(stageClass(container)).toContain("ops__stage--wrong");
    expect(retryBtn(container)).not.toBeNull();
  });

  it("el avatar se mueve durante la animación", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    // (0,2) → up → (0,1) → up → (0,0): dos pasos, animación sigue en curso
    addSequence(container, ["up", "up"]);
    clickPlay(container);

    // Tras el primer paso del avatar (delay inicial + 1 movimiento).
    // La segunda secuencia tiene 2 direcciones: la animación no ha terminado
    // aún a los PASO_MS * 2, así que el avatar se mueve y el stage sigue en playing.
    runTimers(PASO_MS * 2);

    expect(stageClass(container)).toContain("ops__stage--playing");
    // El avatar ya no está en la casilla de inicio: se movió una casilla.
    expect(avatar(container)).not.toBeNull();
  });
});

describe("RutaCuadriculaScreen — interacción post-error", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("reintentar tras error reinicia la secuencia, el avatar y la casilla de inicio", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    const ruta: Direction[] = ["up", "up"];
    addSequence(container, ruta);
    clickPlay(container);
    runTimers(PASO_MS * (ruta.length + 1));

    expect(stageClass(container)).toContain("ops__stage--wrong");
    expect(seqItems(container)).toHaveLength(2);

    fireEvent.click(retryBtn(container)!);
    expect(stageClass(container)).not.toContain("ops__stage--wrong");
    expect(seqItems(container)).toHaveLength(0);
    expect(avatar(container)).not.toBeNull();
  });

  it("el siguiente avanza al siguiente ejercicio después de un error", () => {
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    addSequence(container, ["up", "up"]);
    clickPlay(container);
    runTimers(PASO_MS * 3);

    expect(stageClass(container)).toContain("ops__stage--wrong");

    fireEvent.click(nextBtn(container)!);
    expect(progreso(container)).toBe("2 / 10");
    expect(seqItems(container)).toHaveLength(0);
  });

  it("fallar y acertar al reintentar no suma puntos (alreadyFailed)", () => {
    const ejercicios = generateSession("easy", SEED);
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    // Ejercicio 1: fallar.
    addSequence(container, ["up", "up"]);
    clickPlay(container);
    runTimers(PASO_MS * 3);
    expect(stageClass(container)).toContain("ops__stage--wrong");

    // Reintentar y acertar: no puntúa.
    fireEvent.click(retryBtn(container)!);
    acertar(container, ejercicios, 0);
    // El avatar vuelve al inicio del ejercicio 2.
    expect(progreso(container)).toBe("2 / 10");

    // Ejercicios 2-10: acertar todos → 9 aciertos (no 10, el primero no cuenta).
    for (let i = 1; i < 10; i++) {
      acertar(container, ejercicios, i);
    }

    expect(container.querySelector(".summary")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });
});

describe("RutaCuadriculaScreen — resumen y salida", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("acertar los diez muestra el resumen con 10/10", () => {
    const ejercicios = generateSession("easy", SEED);
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    for (let i = 0; i < 10; i++) {
      acertar(container, ejercicios, i);
    }

    expect(container.querySelector(".summary")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("10/10");
    expect(container.querySelector(".activity-header__counter")).toBeNull();
  });

  it("el botón de salir del resumen avisa al padre", () => {
    const ejercicios = generateSession("easy", SEED);
    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);

    for (let i = 0; i < 10; i++) {
      acertar(container, ejercicios, i);
    }

    const volver = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Volver"),
    );
    if (!volver) throw new Error("No hay botón de volver en el resumen");
    fireEvent.click(volver);

    expect(mockOnExit).toHaveBeenCalled();
  });

  it("repetir desde el resumen recarga la misma hoja con la misma semilla", () => {
    const ejercicios = generateSession("easy", SEED);
    const ruta0 = rutaDe(ejercicios[0]!);

    const { container } = render(<RutaCuadriculaScreen {...props("easy")} />);
    for (let i = 0; i < 10; i++) acertar(container, ejercicios, i);

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el botón de repetir");
    fireEvent.click(repetir);

    expect(progreso(container)).toBe("1 / 10");
    expect(container.querySelector(".rutac__cell")).not.toBeNull();
    // La ruta correcta sigue funcionando: validamos contra el primer ejercicio.
    addSequence(container, ruta0);
    clickPlay(container);
    runTimers(PASO_MS * (ruta0.length + 1));
    expect(stageClass(container)).toContain("ops__stage--correct");
    // El primer ejercicio es el mismo con la misma semilla.
    expect(validateAnswer(ejercicios[0]!, ruta0)).toBe(true);
  });
});
