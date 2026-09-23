import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EngineScreenProps } from "../engine-screens";
import { CountingScreen } from "./CountingScreen";
import { generateSession, PRESET_CONFIGS } from "../../../core/activities/counting";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 12345,
): EngineScreenProps {
  return {
    activity: {
      schemaVersion: 1,
      order: 4,
      id: "counting",
      engineId: "counting",
      subjectId: "mathematics",
      gradeIds: ["grade-1", "grade-2"],
      curriculumBlockIds: ["mathematics-grade-1-unit-1", "mathematics-grade-2-unit-1"],
      title: "Contamos objetos",
      description: "Cuenta cuántos hay y elige la respuesta",
      status: "available",
      parameters: [],
      boardCard: {
        icon: "🍎",
        unit: 1,
        unitLabel: "Nos divertimos con los números",
        difficultyDescriptions: {
          easy: "Del 1 al 5, objetos en fila",
          medium: "Del 1 al 10, objetos dispersos",
          hard: "Del 5 al 10, muy dispersos",
          expert: "Del 10 al 20, muy dispersos",
        },
      },
    },
    difficulty,
    seed,
    onExit: mockOnExit,
    gradeTitle: "1.º de Primaria",
    className: "counting-test",
    difficultyStars: "★☆☆☆",
  };
}

describe("CountingScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("TR-4.1 easy: 4 opciones numéricas; 10 ejercicios; rango count ∈ [1,5]", () => {
    const seed = 12345;
    const session = generateSession(PRESET_CONFIGS.easy, seed);
    expect(session).toHaveLength(10);
    session.forEach((ex) => {
      expect(ex.count).toBeGreaterThanOrEqual(1);
      expect(ex.count).toBeLessThanOrEqual(5);
      expect(ex.steps).toBeDefined();
      expect(ex.steps.length).toBeGreaterThanOrEqual(1);
      const firstStep = ex.steps[ex.steps.length - 1];
      expect(firstStep.options).toHaveLength(4);
      firstStep.options.forEach((o) => expect(Number.isInteger(o)).toBe(true));
    });

    render(<CountingScreen {...buildProps("easy", seed)} />);

    const optionBtns = screen
      .getAllByRole("button")
      .filter((b) => (b as HTMLElement).className.includes("counting__option"));
    expect(optionBtns.length).toBeGreaterThanOrEqual(4);
    for (const btn of optionBtns) {
      expect(/^\d+$/.test((btn.textContent ?? "").trim())).toBe(true);
    }
  });

  it("TR-4.2 medium: rango count ∈ [1,10]; al menos 1 ejercicio con count >= 6 en 10 ejercicios", () => {
    const seed = 12345;
    const session = generateSession(PRESET_CONFIGS.medium, seed);
    expect(session).toHaveLength(10);
    const anyAbove5 = session.some((ex) => ex.count >= 6);
    expect(anyAbove5).toBe(true);
    session.forEach((ex) => {
      expect(ex.count).toBeGreaterThanOrEqual(1);
      expect(ex.count).toBeLessThanOrEqual(10);
    });
  });

  it("TR-4.3 expert: rango count ∈ [10,20]; positions.length === count; cada imagen alt === objectLabel descriptivo", () => {
    const seed = 12345;
    const session = generateSession(PRESET_CONFIGS.expert, seed);
    expect(session).toHaveLength(10);
    session.forEach((ex) => {
      expect(ex.count).toBeGreaterThanOrEqual(10);
      expect(ex.count).toBeLessThanOrEqual(20);
      expect(ex.positions).toHaveLength(ex.count);
      expect(ex.objectLabel).toBeTruthy();
    });

    const { container } = render(<CountingScreen {...buildProps("expert", seed)} />);
    const objs = container.querySelectorAll<HTMLImageElement>("img.counting__object");
    expect(objs.length).toBeGreaterThan(0);
    objs.forEach((img) => {
      expect(img.alt).not.toBe("");
      expect(img.alt).toBeTruthy();
    });
  });

  it("TR-4.4 flujo correcto: click opción correcta → ¡Muy bien! + opción counting__option--correct", () => {
    const seed = 12345;
    const session = generateSession(PRESET_CONFIGS.easy, seed);
    const first = session[0];
    expect(first.steps).toBeDefined();
    expect(first.steps.length).toBeGreaterThanOrEqual(1);
    const firstStep = first.steps[first.steps.length - 1];
    const correct = firstStep.correctAnswer;
    expect(firstStep.options).toContain(correct);

    const { container } = render(<CountingScreen {...buildProps("easy", seed)} />);

    const allOpt = container.querySelectorAll<HTMLButtonElement>("button.counting__option");
    const target = Array.from(allOpt).find((b) => (b.textContent ?? "").trim() === String(correct));
    expect(target).toBeDefined();

    fireEvent.click(target!);

    const celebration = container.querySelector(".counting__celebration");
    expect(celebration).not.toBeNull();
    expect(celebration!.textContent).toContain("¡Muy bien!");

    const correctHighlight = container.querySelector(
      "button.counting__option.counting__option--correct",
    );
    expect(correctHighlight).not.toBeNull();
    expect((correctHighlight as HTMLButtonElement).textContent?.trim()).toBe(String(correct));
  });

  it("TR-4.5 alreadyFailed scoring: click wrong → Retry → click correct (sin wrong highlight) y celebración correct", () => {
    const seed = 99991;
    const session = generateSession(PRESET_CONFIGS.easy, seed);
    expect(session).toHaveLength(10);
    const first = session[0];
    expect(first.steps).toBeDefined();
    const firstStep = first.steps[first.steps.length - 1];
    const correct = firstStep.correctAnswer;
    const wrongOption = firstStep.options.find((o) => o !== correct);
    expect(wrongOption).toBeDefined();
    expect(wrongOption).not.toBe(correct);

    render(<CountingScreen {...buildProps("easy", seed)} />);

    const findOptionBtn = (val: number | string) =>
      screen
        .getAllByRole("button")
        .find(
          (b) =>
            (b as HTMLElement).className.includes("counting__option") &&
            (b.textContent ?? "").trim() === String(val),
        ) as HTMLButtonElement | undefined;

    const findRetryBtn = () =>
      screen.getAllByRole("button").find((b) => /retry|reintentar|↻/i.test(b.textContent ?? ""));

    const wrongBtn = findOptionBtn(wrongOption!);
    expect(wrongBtn).toBeTruthy();
    fireEvent.click(wrongBtn!);
    expect(wrongBtn!.className).toContain("counting__option--wrong");

    const retry = findRetryBtn();
    expect(retry).toBeTruthy();
    fireEvent.click(retry!);
    expect(wrongBtn!.className).not.toContain("counting__option--wrong");

    const correctBtn = findOptionBtn(correct);
    expect(correctBtn).toBeTruthy();
    fireEvent.click(correctBtn!);
    expect(screen.queryByText(/¡Muy bien!/)).toBeTruthy();
    expect(correctBtn!.className).toContain("counting__option--correct");
  });

  it("TR-4.6 Hooks Rules: 0 hooks declarados después del primer early return (if (finished))", () => {
    const src = readFileSync(resolve(__dirname, "CountingScreen.tsx"), "utf-8");
    const lines = src.split(/\r?\n/);
    const firstEarlyReturnIdx = lines.findIndex(
      (l) => l.includes("if (finished) {") || l.match(/if\s*\(\s*finished\s*\)/),
    );
    expect(firstEarlyReturnIdx).toBeGreaterThanOrEqual(0);
    const tail = lines.slice(firstEarlyReturnIdx).join("\n");
    const hookRegex =
      /\b(useState|useEffect|useCallback|useMemo|useRef|useInputMode|useTransition|useDeferredValue)\s*\(/g;
    const matches = tail.match(hookRegex);
    expect(matches).toBeNull();
  });
});
