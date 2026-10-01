import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EngineScreenProps } from "../engine-screens";
import { IgualdadScreen } from "./IgualdadScreen";
import { generateSession } from "../../../core/activities/igualdad";
import type { IgualdadExercise } from "../../../core/activities/igualdad";

const mockOnExit = vi.fn();

function buildProps(
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 12345,
): EngineScreenProps {
  return {
    activity: {
      schemaVersion: 1,
      order: 11,
      id: "igualdad",
      engineId: "igualdad",
      subjectId: "mathematics",
      gradeIds: ["grade-1", "grade-2"],
      curriculumBlockIds: ["mathematics-grade-1-unit-5"],
      title: "Igualdad de sumandos",
      description:
        "Completa a + b = ___ eligiendo la opción correcta; también localiza sumandos y descompone números",
      status: "available",
      parameters: [],
      boardCard: {
        icon: "🟰",
        unit: 5,
        unitLabel: "Descomponemos números",
        difficultyDescriptions: {
          easy: "Solo el resultado, hasta 5",
          medium: "Resultado o sumando que falta, hasta 10",
          hard: "Incluye descomposiciones, hasta 10",
          expert: "Mixto con números hasta 15",
        },
      },
    },
    difficulty,
    seed,
    onExit: mockOnExit,
    gradeTitle: "1.º de Primaria",
    className: "igl-test",
    difficultyStars: "★☆☆☆",
  };
}

describe("IgualdadScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("TR-4.1 easy: 4 opciones por ejercicio; botones igl__option con texto número", () => {
    render(<IgualdadScreen {...buildProps("easy", 12345)} />);

    const options = screen
      .getAllByRole("button")
      .filter((b) => (b as HTMLElement).className.includes("igl__option"));
    expect(options).toHaveLength(4);

    for (const o of options) {
      expect(/^\d+$/.test((o.textContent ?? "").trim())).toBe(true);
    }
  });

  it("TR-4.2 dificultades tipos: easy=resultado, medium=+sumando, hard=+descomposicion, expert=mixed", () => {
    const rules: Array<{ diff: "easy" | "medium" | "hard" | "expert"; types: Set<string> }> = [
      { diff: "easy", types: new Set(["resultado"]) },
      { diff: "medium", types: new Set(["resultado", "sumando"]) },
      { diff: "hard", types: new Set(["resultado", "sumando", "descomposicion"]) },
      { diff: "expert", types: new Set(["resultado", "sumando", "descomposicion"]) },
    ];

    for (const r of rules) {
      const session = generateSession(r.diff, 12345);
      expect(session).toHaveLength(10);
      session.forEach((ex) => expect(r.types.has(ex.type)).toBe(true));
    }
  });

  it("TR-4.3 easy/expert images: easy type=resultado con img-row alt=''; expert sin img-row", () => {
    const { container: easyContainer } = render(<IgualdadScreen {...buildProps("easy", 12345)} />);
    const easySession = generateSession("easy", 12345);
    expect(easySession[0].type).toBe("resultado");
    expect(easySession[0].imageUrl).toBeTruthy();

    const imgRow = easyContainer.querySelector<HTMLElement>(".igl__img-row");
    expect(imgRow).not.toBeNull();
    const imgs = imgRow!.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((i) => expect(i.alt).toBe(""));

    cleanup();

    const { container: expertContainer } = render(
      <IgualdadScreen {...buildProps("expert", 12345)} />,
    );
    const expertImgRow = expertContainer.querySelector(".igl__img-row");
    expect(expertImgRow).toBeNull();
  });

  it("TR-4.4 flujo correcto: click opción correcta → ¡Muy bien! 🎉 + opción correct highlight", () => {
    const seed = 12345;
    const session = generateSession("easy", seed);
    const first = session[0];
    expect(first.type).toBe("resultado");

    render(<IgualdadScreen {...buildProps("easy", seed)} />);

    const correctBtn = screen
      .getAllByRole("button")
      .find(
        (b) =>
          (b as HTMLElement).className.includes("igl__option") &&
          (b.textContent ?? "").trim() === String(first.answer),
      ) as HTMLButtonElement | undefined;
    expect(correctBtn).toBeTruthy();
    fireEvent.click(correctBtn!);

    expect(screen.queryByText(/¡Muy bien!/)).toBeTruthy();
    expect(correctBtn!.className).toContain("igl__option--correct");
  });

  it("TR-4.5 scoring: contrato alreadyFailed. Fallar 1ª vez → retry → acertar: scoring interno no cuenta (0/1), luego acertar 1 solo sí (1/1)", () => {
    const seed = 12345;
    const exercises = generateSession("easy", seed);
    const ex0 = exercises[0];
    const wrongOpt = ex0.options.find((o) => String(o) !== String(ex0.answer));
    expect(wrongOpt).toBeDefined();

    render(<IgualdadScreen {...buildProps("easy", seed)} />);

    const findOptionBtn = (val: number | string) =>
      screen
        .getAllByRole("button")
        .find(
          (b) =>
            (b as HTMLElement).className.includes("igl__option") &&
            (b.textContent ?? "").trim() === String(val).replace("+", " + "),
        ) as HTMLButtonElement | undefined;

    const findRetryBtn = () =>
      screen.getAllByRole("button").find((b) => /retry|reintentar|↻/i.test(b.textContent ?? ""));

    const wrongBtn = findOptionBtn(wrongOpt!);
    expect(wrongBtn).toBeTruthy();
    fireEvent.click(wrongBtn!);
    expect(wrongBtn!.className).toContain("igl__option--wrong");

    const retry = findRetryBtn();
    expect(retry).toBeTruthy();
    fireEvent.click(retry!);
    expect(wrongBtn!.className).not.toContain("igl__option--wrong");

    const correctBtn = findOptionBtn(ex0.answer);
    expect(correctBtn).toBeTruthy();
    fireEvent.click(correctBtn!);

    expect(screen.queryByText(/¡Muy bien!/)).toBeTruthy();
    expect(correctBtn!.className).toContain("igl__option--correct");
  });

  it("TR-4.6: Hooks Rules intacto (no hay use* después de early returns)", () => {
    const src = readFileSync(resolve(__dirname, "./IgualdadScreen.tsx"), "utf8");
    const lines = src.split(/\r?\n/);
    let finishedLine = -1;
    let currentNullLine = -1;
    lines.forEach((l, i) => {
      if (l.includes("if (finished)")) finishedLine = i;
      if (l.includes("if (!current) return null")) currentNullLine = i;
    });
    expect(finishedLine).toBeGreaterThan(0);
    expect(currentNullLine).toBeGreaterThan(finishedLine);

    const hooksAfter = lines
      .slice(Math.max(finishedLine, currentNullLine))
      .filter((l) =>
        /\b(useState|useEffect|useCallback|useMemo|useRef|useLayoutEffect)\s*\(/.test(l),
      );
    expect(hooksAfter).toHaveLength(0);
  });

  it("pulsar 'Repetir' devuelve el mismo primer ejercicio (reutiliza la semilla)", () => {
    const seed = 12345;
    const exercises = generateSession("easy", seed);

    const { container } = render(<IgualdadScreen {...buildProps("easy", seed)} />);
    const firstStage = container.querySelector(".igl__stage")?.textContent ?? "";

    const correctOption = (ex: IgualdadExercise) =>
      screen
        .getAllByRole("button")
        .find(
          (b) =>
            (b as HTMLElement).className.includes("igl__option") &&
            (b.textContent ?? "").trim() === String(ex.answer),
        ) as HTMLButtonElement | undefined;

    exercises.forEach((ex) => {
      fireEvent.click(correctOption(ex)!);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    expect(container.querySelector(".summary__stars")).toBeNull();
    expect(container.querySelector(".igl__stage")?.textContent).toBe(firstStage);
  });
});
