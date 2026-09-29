import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ElLitroScreen } from "./ElLitroScreen";
import {
  generateSession,
  MAS_ITEMS,
  MENOS_ITEMS,
  LITRO_ITEMS,
} from "../../../core/activities/elLitro";
import type { LitroExercise } from "../../../core/activities/elLitro";
import { litroImageUrl, REFERENCE_ITEM } from "./litroImages";
import { smokeProps, DIFFICULTIES } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return smokeProps("elLitro", mockOnExit, difficulty, seed);
}

const questionOf = (container: HTMLElement) =>
  container.querySelector(".lit__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".lit__opt"));

const options = (container: HTMLElement) => optionButtons(container).map((b) => b.textContent);

const optionButton = (container: HTMLElement, text: string) => {
  const btn = optionButtons(container).find((b) => b.textContent === text);
  if (!btn) throw new Error(`No hay ninguna opción con el texto "${text}"`);
  return btn;
};

const images = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLImageElement>(".lit__img")).map((i) => i.alt);

/** La pantalla avanza sola 900 ms después de acertar. */
const AUTO_ADVANCE_MS = 900;

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("ElLitroScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("monta con la pregunta y las opciones del primer ejercicio del motor", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);

    expect(questionOf(container)).toBe(session[0].question);
    expect(options(container)).toEqual(session[0].options);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session.length}`,
    );
  });

  it("muestra el recipiente del ejercicio con su imagen y su nombre", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);

    const item = session[0].items[0];
    const cap = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    expect(images(container)).toEqual([cap]);
    expect(container.querySelector(".lit__img-name")?.textContent).toBe(cap);
  });

  it("no monta Numpad ni toggle de modo: siempre es elección múltiple", () => {
    const { container } = render(<ElLitroScreen {...buildProps("expert", 99)} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("clasificar muestra un solo recipiente y la referencia de 1 litro", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    expect(session[0].type).toBe("classify");

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);

    expect(container.querySelectorAll(".lit__image-box")).toHaveLength(1);
    expect(container.querySelector(".lit__scale-hint")?.textContent).toContain("Referencia: 1 L");
    expect(container.querySelector<HTMLImageElement>(".lit__ref-img")?.alt).toContain("1 litro");
  });

  it("la referencia es el PNG del litro, no un emoji de icono", () => {
    const seed = 4242;
    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);

    const hint = container.querySelector(".lit__scale-hint");
    expect(hint).not.toBeNull();
    // El PNG de referencia es la unica imagen de la pista.
    expect(hint!.querySelectorAll("img")).toHaveLength(1);
    expect(hint!.querySelector<HTMLImageElement>(".lit__ref-img")?.getAttribute("src")).not.toBe(
      "",
    );
    // Sin emoji ni icono de sistema delante.
    expect(hint!.querySelector(".lit__scale-icon")).toBeNull();
    expect(hint!.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(hint!.textContent?.trim()).toBe("Referencia: 1 L");
  });

  it("comparar muestra los dos recipientes enfrentados", () => {
    const seed = 5;
    const session = generateSession("expert", seed);
    const idx = session.findIndex((ex) => ex.type !== "classify");
    expect(idx).toBeGreaterThanOrEqual(0);

    const { container } = render(<ElLitroScreen {...buildProps("expert", seed)} />);
    // Se avanza hasta el primer ejercicio de comparación.
    for (let i = 0; i < idx; i++) {
      fireEvent.click(optionButton(container, session[i].answer));
      runAutoAdvance();
    }

    const current = session[idx] as LitroExercise;
    expect(container.querySelectorAll(".lit__image-box")).toHaveLength(2);
    expect(images(container)).toEqual(
      current.items.map((it) => it.name.charAt(0).toUpperCase() + it.name.slice(1)),
    );
    expect(container.querySelector(".lit__scale-hint")).toBeNull();
    expect(questionOf(container)).toBe(current.question);
  });

  it("acertar marca la opción correcta y avanza solo", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, session[0].answer));

    expect(container.querySelectorAll(".lit__opt--correct")).toHaveLength(1);

    runAutoAdvance();
    expect(questionOf(container)).toBe(session[1].question);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `2/${session.length}`,
    );
  });

  it("fallar marca la elegida, bloquea las opciones y ofrece reintentar", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, wrong));

    expect(container.querySelectorAll(".lit__opt--wrong")).toHaveLength(1);
    expect(optionButtons(container).every((b) => b.disabled)).toBe(true);
    expect(container.querySelector(".lit__opt--correct")).toBeNull();
    expect(container.querySelector(".activity-actions")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("reintentar tras fallar vuelve a la misma pregunta y no suma acierto", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, wrong));

    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(questionOf(container)).toBe(session[0].question);
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("fallar y luego acertar cuenta 9 de 10 en el resumen", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, wrong));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    session.forEach((ex) => {
      fireEvent.click(optionButton(container, ex.answer));
      runAutoAdvance();
    });

    const stats = Array.from(container.querySelectorAll(".summary__stat-value")).map(
      (n) => n.textContent,
    );
    expect(stats[0]).toBe("9/10");
  });

  it("acertar los 10 a mano cuenta 10 de 10 en el resumen", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElLitroScreen {...buildProps("easy", seed)} />);
    session.forEach((ex) => {
      fireEvent.click(optionButton(container, ex.answer));
      runAutoAdvance();
    });

    const stats = Array.from(container.querySelectorAll(".summary__stat-value")).map(
      (n) => n.textContent,
    );
    expect(stats[0]).toBe("10/10");
    expect(stats[1]).toBe("100%");
  });
});

describe("ElLitroScreen recursos de imagen", () => {
  it("los 25 recipientes del catálogo resuelven a una imagen real", () => {
    const all = [...MAS_ITEMS, ...MENOS_ITEMS, ...LITRO_ITEMS];
    expect(all).toHaveLength(25);

    const missing = all
      .map((item) => ({ item, url: litroImageUrl(item) }))
      .filter(({ url }) => url === "");
    expect(missing).toEqual([]);
  });

  it("la referencia de 1 litro también resuelve", () => {
    expect(litroImageUrl(REFERENCE_ITEM)).not.toBe("");
  });

  it("cada imagen montada apunta a un src real, no a un alt vacío", () => {
    DIFFICULTIES.forEach((difficulty) => {
      const session = generateSession(difficulty, 4242);
      const { container, unmount } = render(<ElLitroScreen {...buildProps(difficulty, 4242)} />);

      const srcs = Array.from(container.querySelectorAll<HTMLImageElement>(".lit__img")).map(
        (i) => i.getAttribute("src") ?? "",
      );
      expect(srcs.length).toBeGreaterThan(0);
      srcs.forEach((src) => expect(src).not.toBe(""));

      // La referencia solo aparece en los ejercicios de clasificar.
      const ref = container.querySelector<HTMLImageElement>(".lit__ref-img");
      if (session[0].type === "classify") {
        expect(ref?.getAttribute("src")).not.toBe("");
      } else {
        expect(ref).toBeNull();
      }
      unmount();
    });
  });

  it("las tres carpetas de assets son distintas entre sí", () => {
    const urls = [
      litroImageUrl(MAS_ITEMS[0]),
      litroImageUrl(LITRO_ITEMS[0]),
      litroImageUrl(MENOS_ITEMS[0]),
    ];
    expect(new Set(urls).size).toBe(3);
  });
});

describe("ElLitroScreen recorrido completo", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("las 4 dificultades se completan con 10 ejercicios y llegan al resumen", () => {
    DIFFICULTIES.forEach((difficulty) => {
      const seed = 77;
      const session = generateSession(difficulty, seed);
      expect(session).toHaveLength(10);

      const { container, unmount } = render(<ElLitroScreen {...buildProps(difficulty, seed)} />);

      session.forEach((ex) => {
        expect(questionOf(container)).toBe(ex.question);
        fireEvent.click(optionButton(container, ex.answer));
        runAutoAdvance();
      });

      const stats = Array.from(container.querySelectorAll(".summary__stat-value")).map(
        (n) => n.textContent,
      );
      expect(stats[0]).toBe("10/10");
      unmount();
    });
  });
});

describe("ElLitroScreen aviso sin ejercicios", () => {
  afterEach(() => {
    cleanup();
    vi.doUnmock("../../../core/activities/elLitro");
  });

  it("muestra el aviso y permite salir cuando el generador devuelve una sesión vacía", async () => {
    vi.resetModules();
    vi.doMock("../../../core/activities/elLitro", async () => {
      const actual = await vi.importActual<typeof import("../../../core/activities/elLitro")>(
        "../../../core/activities/elLitro",
      );
      return { ...actual, generateSession: () => [] };
    });

    const { ElLitroScreen: EmptyScreen } = await import("./ElLitroScreen");
    const { container } = render(<EmptyScreen {...buildProps("easy", 1)} />);

    const notice = container.querySelector('[role="alert"]');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toContain("El litro");
    expect(container.querySelector(".act-error__btn")).not.toBeNull();

    fireEvent.click(container.querySelector<HTMLButtonElement>(".act-error__btn")!);
    expect(mockOnExit).toHaveBeenCalled();
  });
});
