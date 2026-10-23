import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ActivityManifest } from "../../core/content/contracts";
import { clearLocalDemoFlags, enterLocalDemoFlags } from "../../core/demo/demoMode";
import { ExerciseSessionProvider } from "./ExerciseSessionProvider";
import { useExerciseSession } from "./ExerciseSessionContext";

const activity = {
  id: "suma",
  engineId: "suma",
  title: "Suma",
  gradeIds: ["grade-1", "grade-2"],
} as unknown as ActivityManifest;

const demoAllowedActivity = {
  id: "counting",
  engineId: "counting",
  title: "Contamos objetos",
  gradeIds: ["grade-1", "grade-2"],
} as unknown as ActivityManifest;

function Probe() {
  const { catalogGradeId, setCatalogGradeId, launchSession, session } = useExerciseSession();
  return (
    <div>
      <span data-testid="grade">{catalogGradeId ?? "none"}</span>
      <span data-testid="session">{session?.activity.id ?? "none"}</span>
      <button type="button" onClick={() => setCatalogGradeId("grade-1")}>
        Elegir 1.º
      </button>
      <button
        type="button"
        onClick={() =>
          launchSession({
            activity,
            difficulty: "easy",
            gradeId: "grade-1",
            gradeTitle: "1.º de Primaria",
            className: "1A",
            difficultyStars: "⭐",
          })
        }
      >
        Lanzar 1.º
      </button>
      <button
        type="button"
        onClick={() =>
          launchSession({
            activity,
            difficulty: "easy",
            gradeId: "grade-2",
            gradeTitle: "2.º de Primaria",
            className: "2A",
            difficultyStars: "⭐",
          })
        }
      >
        Lanzar 2.º
      </button>
      <button
        type="button"
        onClick={() =>
          launchSession({
            activity: demoAllowedActivity,
            difficulty: "easy",
            gradeId: "grade-1",
            gradeTitle: "1.º de Primaria",
            className: "1A",
            difficultyStars: "⭐",
          })
        }
      >
        Lanzar counting
      </button>
      <button
        type="button"
        onClick={() =>
          launchSession({
            activity,
            difficulty: "easy",
            gradeId: "grade-1",
            gradeTitle: "1.º de Primaria",
            className: "1A",
            difficultyStars: "⭐",
          })
        }
      >
        Lanzar suma restringida
      </button>
    </div>
  );
}

describe("ExerciseSessionProvider — curso del catálogo", () => {
  it("parte sin curso recordado", () => {
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    expect(screen.getByTestId("grade")).toHaveTextContent("none");
  });

  it("recuerda el curso al cambiarlo en el filtro", () => {
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Elegir 1.º" }));
    expect(screen.getByTestId("grade")).toHaveTextContent("grade-1");
  });

  it("al lanzar un ejercicio de 1.º deja el catálogo en grade-1 al salir", () => {
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar 1.º" }));
    expect(screen.getByTestId("grade")).toHaveTextContent("grade-1");
  });

  it("un lanzamiento posterior de 2.º actualiza el curso recordado", () => {
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar 1.º" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanzar 2.º" }));
    expect(screen.getByTestId("grade")).toHaveTextContent("grade-2");
  });
});

describe("ExerciseSessionProvider — contención DEMO", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    clearLocalDemoFlags();
    sessionStorage.clear();
  });

  it("en DEMO rechaza launchSession de un activityId no allowlisted", () => {
    enterLocalDemoFlags();
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar suma restringida" }));
    expect(screen.getByTestId("session")).toHaveTextContent("none");
    expect(screen.getByTestId("grade")).toHaveTextContent("none");
  });

  it("en DEMO permite launchSession de un activityId allowlisted", () => {
    enterLocalDemoFlags();
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar counting" }));
    expect(screen.getByTestId("session")).toHaveTextContent("counting");
    expect(screen.getByTestId("grade")).toHaveTextContent("grade-1");
  });

  it("sin DEMO permite lanzar actividades fuera de la allowlist (usuario registrado)", () => {
    clearLocalDemoFlags();
    render(
      <ExerciseSessionProvider>
        <Probe />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar 1.º" }));
    expect(screen.getByTestId("session")).toHaveTextContent("suma");
  });
});
