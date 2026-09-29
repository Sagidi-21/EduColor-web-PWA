import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ElKiloScreen } from "./ElKiloScreen";
import { generateSession, MAS_ITEMS, MENOS_ITEMS } from "../../../core/activities/elKilo";
import { kiloImageUrl, REFERENCE_URL } from "./kiloImages";
import { smokeProps, DIFFICULTIES } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return smokeProps("elKilo", mockOnExit, difficulty, seed);
}

const questionOf = (container: HTMLElement) =>
  container.querySelector(".kil__question")?.textContent ?? "";

const optionButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".kil__opt"));

const options = (container: HTMLElement) => optionButtons(container).map((b) => b.textContent);

const optionButton = (container: HTMLElement, text: string) => {
  const btn = optionButtons(container).find((b) => b.textContent === text);
  if (!btn) throw new Error(`No hay ninguna opción con el texto "${text}"`);
  return btn;
};

const images = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLImageElement>(".kil__img")).map((i) => i.alt);

const AUTO_ADVANCE_MS = 900;

const runAutoAdvance = (ms = AUTO_ADVANCE_MS) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("ElKiloScreen smoke", () => {
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

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);

    expect(questionOf(container)).toBe(session[0].question);
    expect(options(container)).toEqual(session[0].options);
    expect(container.querySelector(".activity-header__counter")?.textContent).toBe(
      `1/${session.length}`,
    );
  });

  it("muestra el objeto del ejercicio con su imagen y su nombre", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);

    const item = session[0].items[0];
    const cap = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    expect(images(container)).toEqual([cap]);
    expect(container.querySelector(".kil__img-name")?.textContent).toBe(cap);
  });

  it("no monta Numpad ni toggle de modo: siempre es elección múltiple", () => {
    const { container } = render(<ElKiloScreen {...buildProps("expert", 99)} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("la referencia es la pesa de 1 kg en PNG, no un emoji de icono", () => {
    const seed = 4242;
    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);

    const hint = container.querySelector(".kil__scale-hint");
    expect(hint).not.toBeNull();
    expect(hint!.querySelectorAll("img")).toHaveLength(1);
    const ref = hint!.querySelector<HTMLImageElement>(".kil__ref-img")!;
    expect(ref.getAttribute("src")).not.toBe("");
    expect(ref.getAttribute("src")).toBe(REFERENCE_URL);
    expect(hint!.querySelector(".kil__scale-icon")).toBeNull();
    expect(hint!.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(hint!.textContent?.trim()).toBe("Referencia: 1 kg");
  });

  it("la referencia aparece también en los ejercicios de comparación", () => {
    const seed = 5;
    const session = generateSession("expert", seed);
    const idx = session.findIndex((ex) => ex.type !== "classify");
    expect(idx).toBeGreaterThanOrEqual(0);

    const { container } = render(<ElKiloScreen {...buildProps("expert", seed)} />);
    for (let i = 0; i < idx; i++) {
      fireEvent.click(optionButton(container, session[i].answer));
      runAutoAdvance();
    }

    expect(container.querySelector(".kil__scale-hint")).not.toBeNull();
    expect(container.querySelectorAll(".kil__image-box")).toHaveLength(2);
    // El "VS" va entre los dos objetos, no despues.
    const vs = container.querySelector(".kil__vs");
    expect(vs).not.toBeNull();
    const boxes = Array.from(container.querySelectorAll(".kil__image-box"));
    expect(boxes[0].compareDocumentPosition(vs!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(vs!.compareDocumentPosition(boxes[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("acertar marca la opción correcta y avanza solo", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, session[0].answer));

    expect(container.querySelectorAll(".kil__opt--correct")).toHaveLength(1);

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

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, wrong));

    expect(container.querySelectorAll(".kil__opt--wrong")).toHaveLength(1);
    expect(optionButtons(container).every((b) => b.disabled)).toBe(true);
    // El original de Electron ademas highlightaba la correcta al fallar.
    expect(container.querySelector(".kil__opt--correct")).toBeNull();
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("reintentar tras fallar vuelve a la misma pregunta con las opciones activas", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);
    fireEvent.click(optionButton(container, wrong));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(questionOf(container)).toBe(session[0].question);
    expect(optionButtons(container).every((b) => !b.disabled)).toBe(true);
  });

  it("fallar y luego acertar cuenta 9 de 10 en el resumen", () => {
    const seed = 4242;
    const session = generateSession("easy", seed);
    const wrong = session[0].options.find((o) => o !== session[0].answer)!;

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);
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

    const { container } = render(<ElKiloScreen {...buildProps("easy", seed)} />);
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

describe("ElKiloScreen recursos de imagen", () => {
  it("los 41 objetos del catálogo resuelven a una imagen real", () => {
    const all = [...MAS_ITEMS, ...MENOS_ITEMS];
    expect(all).toHaveLength(41);

    const missing = all
      .map((item) => ({ item, url: kiloImageUrl(item) }))
      .filter(({ url }) => url === "");
    expect(missing).toEqual([]);
  });

  it("la pesa de 1 kg resuelve y no se confunde con la pesa de gimnasio", () => {
    expect(REFERENCE_URL).not.toBe("");
    // `pesa.png` es un objeto de +kilo; la referencia vive en la carpeta `kilo`.
    const pesaGimnasio = MAS_ITEMS.find((i) => i.file === "pesa.png")!;
    expect(kiloImageUrl(pesaGimnasio)).not.toBe(REFERENCE_URL);
  });

  it("cada imagen montada apunta a un src real, no vacío", () => {
    DIFFICULTIES.forEach((difficulty) => {
      const { container, unmount } = render(<ElKiloScreen {...buildProps(difficulty, 4242)} />);
      const srcs = Array.from(container.querySelectorAll<HTMLImageElement>(".kil__img")).map(
        (i) => i.getAttribute("src") ?? "",
      );
      expect(srcs.length).toBeGreaterThan(0);
      srcs.forEach((src) => expect(src).not.toBe(""));
      unmount();
    });
  });
});

describe("ElKiloScreen recorrido completo", () => {
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

      const { container, unmount } = render(<ElKiloScreen {...buildProps(difficulty, seed)} />);

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

describe("ElKiloScreen aviso sin ejercicios", () => {
  afterEach(() => {
    cleanup();
    vi.doUnmock("../../../core/activities/elKilo");
  });

  it("muestra el aviso y permite salir cuando el generador devuelve una sesión vacía", async () => {
    vi.resetModules();
    vi.doMock("../../../core/activities/elKilo", async () => {
      const actual = await vi.importActual<typeof import("../../../core/activities/elKilo")>(
        "../../../core/activities/elKilo",
      );
      return { ...actual, generateSession: () => [] };
    });

    const { ElKiloScreen: EmptyScreen } = await import("./ElKiloScreen");
    const { container } = render(<EmptyScreen {...buildProps("easy", 1)} />);

    const notice = container.querySelector('[role="alert"]');
    expect(notice).not.toBeNull();
    expect(container.querySelector(".act-error__btn")).not.toBeNull();

    fireEvent.click(container.querySelector<HTMLButtonElement>(".act-error__btn")!);
    expect(mockOnExit).toHaveBeenCalled();
  });
});
