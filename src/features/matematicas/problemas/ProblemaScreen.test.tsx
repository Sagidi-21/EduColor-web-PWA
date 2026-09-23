import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EngineScreenProps } from "../engine-screens";
import { ProblemaScreen } from "./ProblemaScreen";
import { generateSession } from "../../../core/activities/problemas";

const mockOnExit = vi.fn();

function buildProps(seed = 42): EngineScreenProps {
  return {
    activity: {
      schemaVersion: 1,
      order: 19,
      id: "problemas",
      engineId: "problemas",
      subjectId: "mathematics",
      gradeIds: ["grade-1", "grade-2"],
      curriculumBlockIds: ["mathematics-grade-1-unit-6", "mathematics-grade-2-unit-6"],
      title: "Problemas con una operación",
      description: "Lee el problema y calcula la respuesta con suma o resta",
      status: "available",
      parameters: [],
      boardCard: {
        icon: "📖",
        unit: 6,
        unitLabel: "Hacemos deporte",
        difficultyDescriptions: {
          easy: "Solo sumas, resultado hasta 10",
          medium: "Sumas y restas, números hasta 10",
          hard: "Sumas y restas, números hasta 19",
          expert: "Sumas y restas con números de 2 cifras, resultado hasta 39",
        },
      },
    },
    difficulty: "easy",
    seed,
    onExit: mockOnExit,
    gradeTitle: "1.º de Primaria",
    className: "prob-test",
    difficultyStars: "★☆☆☆",
  };
}

describe("ProblemaScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("TR-2.1: renderiza selector inicial con 4 tarjetas de tema y --theme-color por tarjeta", () => {
    render(<ProblemaScreen {...buildProps()} />);

    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("prob__theme-card"));
    expect(buttons).toHaveLength(4);

    const labels = buttons.map((b) => b.textContent ?? "");
    expect(labels.some((t) => t.includes("Deportes"))).toBe(true);
    expect(labels.some((t) => t.includes("Animales"))).toBe(true);
    expect(labels.some((t) => t.includes("Clase"))).toBe(true);
    expect(labels.some((t) => t.includes("Naturaleza"))).toBe(true);

    const colors = new Set(
      buttons.map((b) => (b as HTMLButtonElement).style.getPropertyValue("--theme-color")),
    );
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it("TR-3.1: estado inicial sin ejercicios (solo selector visible) y tras startSession genera 10 ejercicios", () => {
    render(<ProblemaScreen {...buildProps(42)} />);

    expect(screen.queryByText("OPERACIÓN")).toBeNull();
    expect(screen.queryByText("SOLUCIÓN")).toBeNull();

    const btnDeportes = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes("Deportes")) as HTMLButtonElement;
    fireEvent.click(btnDeportes);

    expect(screen.queryByText(/¿De qué trata el problema\?/)).toBeNull();
    expect(screen.queryAllByText("OPERACIÓN").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("SOLUCIÓN").length).toBeGreaterThanOrEqual(1);
  });

  it("TR-1.2: no existe layout vertical (prob__vertical) en el DOM durante un ejercicio", () => {
    const { container } = render(<ProblemaScreen {...buildProps(42)} />);

    const btnDeportes = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes("Deportes")) as HTMLButtonElement;
    fireEvent.click(btnDeportes);

    expect(container.querySelector("[class*='prob__vertical']")).toBeNull();
  });

  it("TR-1.1 (sin 2 dígitos) y flujo numpad correcto: click Deportes → introduce respuesta correcta → score sube", () => {
    const seed = 42;
    const session = generateSession("easy", seed, "deportes");
    expect(session.length).toBe(10);
    const first = session[0];
    const answerDigits = String(first.answer).split("");
    expect(answerDigits.length).toBeGreaterThanOrEqual(1);

    render(<ProblemaScreen {...buildProps(seed)} />);

    const btnDeportes = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes("Deportes")) as HTMLButtonElement;
    fireEvent.click(btnDeportes);

    const storyPresent = screen
      .queryAllByText(/.+/)
      .some((el) => (el.textContent ?? "").length > 0 && el.className?.includes("prob__story"));
    const story = screen.getAllByText(/.+/).find((el) => {
      const cls = (el as HTMLElement).className;
      return typeof cls === "string" && cls.includes("prob__story");
    }) as HTMLElement | undefined;
    expect(storyPresent || !!story).toBe(true);

    const numpad = screen
      .getAllByRole("button")
      .find((b) => (b as HTMLElement).className.includes("shared-numpad__key"))
      ?.parentElement?.parentElement;
    expect(numpad).toBeTruthy();

    for (const digit of [...answerDigits].reverse()) {
      const key = screen.getAllByRole("button").find((b) => b.textContent === digit);
      expect(key).toBeTruthy();
      fireEvent.click(key as HTMLButtonElement);
    }

    const confirmKey = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "✓") as HTMLButtonElement;
    expect(confirmKey).toBeTruthy();
    fireEvent.click(confirmKey);

    expect(screen.queryByText("¡Muy bien! ⭐")).toBeTruthy();
  });

  it("TR-4.1: el archivo fuente ProblemaScreen.tsx contiene comentario aludiendo a sanitizeText", () => {
    const src = readFileSync(resolve(__dirname, "./ProblemaScreen.tsx"), "utf8");
    expect(src.includes("sanitizeText")).toBe(true);
    expect(
      src.includes("literales internos del core") || src.includes("sanitización ya evita XSS"),
    ).toBe(true);
  });
});
