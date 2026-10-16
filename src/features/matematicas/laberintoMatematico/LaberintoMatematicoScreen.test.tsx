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

/** Rellena todo; el nodo `mal` queda incorrecto (para poder pulsar Verificar). */
const rellenarConErrorEn = (
  container: HTMLElement,
  answers: Record<string, number>,
  mal: string,
) => {
  for (const n of FILLABLE_NODES) {
    teclearNodo(container, n, n === mal ? answers[n] + 9 : answers[n]);
  }
};

/** Avanza la secuencia de pintado tras Verificar (8 casillas × 700 ms). */
const flushVerifyReveal = async () => {
  await vi.advanceTimersByTimeAsync(FILLABLE_NODES.length * 700);
};

const AUTOAVANCE_MS = 900;

/**
 * Tras todo correcto: 900 ms → (vídeo o avance) → si hay celebración,
 * ended + 900 ms → siguiente. Con `play` rechazado el efecto usa el
 * mismo timer de fallback.
 */
const flushSuccessAdvance = async (container: HTMLElement) => {
  await vi.advanceTimersByTimeAsync(AUTOAVANCE_MS);
  const video = container.querySelector<HTMLVideoElement>("video.lm-celeb");
  if (video) {
    fireEvent.ended(video);
    await vi.advanceTimersByTimeAsync(AUTOAVANCE_MS);
  }
};

describe("LaberintoMatematicoScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
    // jsdom no reproduce vídeo; forzamos el fallback muted→advance.
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("autoplay"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it("por defecto selecciona la primera casilla y muestra el Numpad", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    expect(nodo(container, "A")?.className).toContain("lm-node-active");
    expect(container.querySelector(".lm-board-numpad")).not.toBeNull();
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
    const keys = Array.from(container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"));
    expect(keys.map((k) => k.getAttribute("aria-label") ?? k.textContent)).toEqual([
      "7",
      "8",
      "9",
      "4",
      "5",
      "6",
      "1",
      "2",
      "3",
      "Borrar",
      "0",
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
    expect(nodo(container, "A")?.className).toContain("lm-ns-filled");
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
  });

  it("Verificar marca correctos en verde e incorrectos en rojo", async () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    rellenarConErrorEn(container, ex.answers, "B");

    fireEvent.click(boardBtn(container, "Verificar")!);
    expect(boardBtn(container, "Verificar")).toBeTruthy();
    expect(boardBtn(container, "Reintentar")).toBeUndefined();

    await flushVerifyReveal();

    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
    expect(nodo(container, "B")?.className).toContain("lm-ns-err");
    expect(boardBtn(container, "Reintentar")).toBeTruthy();
    expect(boardBtn(container, "Verificar")).toBeUndefined();
    expect(boardBtn(container, "Siguiente")).toBeTruthy();

    // Con Reintentar visible no se puede tocar el rojo.
    activarNodo(container, "B");
    expect(nodo(container, "B")?.className).toContain("lm-ns-err");
    expect(textoNodo(container, "B")).not.toBe("");
  });

  it("Reintentar solo limpia los fallados y la siguiente verificación no repinta los ok", async () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    rellenarConErrorEn(container, ex.answers, "B");
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();
    fireEvent.click(boardBtn(container, "Reintentar")!);

    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
    expect(textoNodo(container, "A")).toBe(String(ex.answers.A));
    expect(nodo(container, "B")?.className).toContain("lm-ns-empty");
    expect(textoNodo(container, "B")).toBe("");
    expect(boardBtn(container, "Verificar")).toBeTruthy();
    expect(boardBtn(container, "Verificar")).toBeDisabled();

    teclearNodo(container, "B", ex.answers.B);
    fireEvent.click(boardBtn(container, "Verificar")!);
    // A no se repinta: sigue ok desde el primer instante de la 2.ª verificación.
    expect(nodo(container, "A")?.className).toContain("lm-ns-ok");
  });

  it("un nodo ya correcto no se vuelve a seleccionar", async () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    rellenarTodoCorrecto(container, ex.answers);
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();
    activarNodo(container, "A");

    expect(nodo(container, "A")?.className).not.toContain("lm-node-active");
    expect(container.querySelector(".shared-numpad")).not.toBeNull();
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

  it("en el último ejercicio Siguiente queda deshabilitado como Último Ejercicio", () => {
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    for (let i = 0; i < 3; i++) {
      fireEvent.click(boardBtn(container, "Siguiente")!);
    }

    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("4/4");
    const ultimo = boardBtn(container, "Último Ejercicio");
    expect(ultimo).toBeTruthy();
    expect(ultimo).toBeDisabled();
    expect(boardBtn(container, "Siguiente")).toBeUndefined();
    expect(boardBtn(container, "Ver resultado")).toBeUndefined();
  });

  it("completar el último laberinto muestra el resumen", async () => {
    const session = generateSession("medium", 4242, "1");
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );

    for (let i = 0; i < 3; i++) {
      fireEvent.click(boardBtn(container, "Siguiente")!);
    }
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("4/4");

    rellenarTodoCorrecto(container, session[3].answers);
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();
    await flushSuccessAdvance(container);

    expect(container.querySelector(".activity-header__counter")).toBeNull();
    expect(container.querySelector(".summary")).not.toBeNull();
  });

  it("Verificar todo correcto deja los nodos en ok y avanza tras la celebración", async () => {
    const ex = generateSession("medium", 4242, "1")[0];

    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    rellenarTodoCorrecto(container, ex.answers);
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();

    for (const n of FILLABLE_NODES) {
      expect(nodo(container, n)?.className, `nodo ${n}`).toContain("lm-ns-ok");
    }
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("1/4");

    await flushSuccessAdvance(container);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/4");
  });

  it("cada fondo en rotación tiene su celeb_<slug>.mp4 emparejado", () => {
    const bgMods = import.meta.glob<string>("../../../assets/laberinto/bg_*.{jpg,jpeg,png,webp}", {
      eager: true,
      import: "default",
    });
    const celebMods = import.meta.glob<string>(
      "../../../assets/laberinto/celebraciones/celeb_*.mp4",
      { eager: true, import: "default" },
    );
    const celebSlugs = new Set(
      Object.keys(celebMods)
        .map((p) => p.match(/celeb_([^/\\]+)\.mp4$/i)?.[1])
        .filter((s): s is string => Boolean(s)),
    );
    const bgSlugs = Object.keys(bgMods)
      .map((p) => p.match(/bg_([^/\\]+)\.(?:jpg|jpeg|png|webp)$/i)?.[1])
      .filter((s): s is string => Boolean(s));
    const paired = bgSlugs.filter((s) => celebSlugs.has(s));

    expect(paired.length).toBeGreaterThanOrEqual(11);
    for (const slug of ["carreras", "granja", "otoño", "pirata", "verano", "bosque"] as const) {
      expect(celebSlugs.has(slug), `falta celeb_${slug}.mp4`).toBe(true);
      expect(bgSlugs.includes(slug), `falta bg_${slug}`).toBe(true);
    }
    // Lo que rota en pantalla es solo lo emparejado (p. ej. primavera sin vídeo queda fuera).
    for (const slug of paired) {
      expect(celebSlugs.has(slug)).toBe(true);
    }
  });

  it("con vídeo de celebración oculta el tablero y lo muestra tras el ended", async () => {
    // Semilla cuyo 1.er fondo es bosque (tiene celeb_bosque.mp4).
    const seedBosque = (() => {
      for (let s = 0; s < 500; s++) {
        // Misma lógica que bgIndexForExercise con n fondos ordenados.
        // Probamos montando: si aparece celeb tras acierto, sirve.
        const { container, unmount } = render(
          <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium", s)} />,
        );
        const src = container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src") ?? "";
        unmount();
        if (src.includes("bg_bosque")) return s;
      }
      return null;
    })();
    expect(seedBosque).not.toBeNull();

    const ex = generateSession("medium", seedBosque!, "1")[0];
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium", seedBosque!)} />,
    );
    rellenarTodoCorrecto(container, ex.answers);
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();
    await vi.advanceTimersByTimeAsync(AUTOAVANCE_MS);

    expect(container.querySelector(".lm-playfield")).toBeNull();
    expect(container.querySelector("video.lm-celeb")).not.toBeNull();
    expect(container.querySelector(".activity-header__counter")).toBeNull();

    fireEvent.ended(container.querySelector("video.lm-celeb")!);
    await vi.advanceTimersByTimeAsync(AUTOAVANCE_MS);

    expect(container.querySelector(".lm-playfield")).not.toBeNull();
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe("2/4");
  });

  it("la misma semilla reproduce el fondo del primer ejercicio", () => {
    const una = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoA = una.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    cleanup();

    // Busca una semilla cuyo fondo inicial difiera del de la semilla por defecto.
    let seedDistinta: number | null = null;
    let fondoB: string | null | undefined;
    for (let s = 1; s < 200; s++) {
      if (s === 4242) continue;
      const otra = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium", s)} />);
      const src = otra.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
      cleanup();
      if (src && src !== fondoA) {
        seedDistinta = s;
        fondoB = src;
        break;
      }
    }
    expect(seedDistinta).not.toBeNull();

    const tercera = render(<LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />);
    const fondoC = tercera.container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");

    expect(fondoA).toBeTruthy();
    expect(fondoA).toBe(fondoC);
    expect(fondoA).not.toBe(fondoB);
  });

  it("al cambiar de laberinto el fondo es distinto al anterior", async () => {
    const ex = generateSession("medium", 4242, "1")[0];
    const { container } = render(
      <LaberintoMatematicoScreen {...buildProps(NOMBRES[0], "medium")} />,
    );
    const fondo1 = container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");

    rellenarTodoCorrecto(container, ex.answers);
    fireEvent.click(boardBtn(container, "Verificar")!);
    await flushVerifyReveal();
    await flushSuccessAdvance(container);

    const fondo2 = container.querySelector<HTMLImageElement>(".lm-bg")?.getAttribute("src");
    expect(fondo1).toBeTruthy();
    expect(fondo2).toBeTruthy();
    expect(fondo2).not.toBe(fondo1);
  });
});
