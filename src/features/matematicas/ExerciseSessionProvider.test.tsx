import { render, screen, fireEvent } from "@testing-library/react";
import type { ActivityManifest } from "../../core/content/contracts";
import { ExerciseSessionProvider } from "./ExerciseSessionProvider";
import { useExerciseSession } from "./ExerciseSessionContext";

const activity = {
  id: "suma",
  engineId: "suma",
  title: "Suma",
  gradeIds: ["grade-1", "grade-2"],
} as unknown as ActivityManifest;

function Probe() {
  const { catalogGradeId, setCatalogGradeId, launchSession } = useExerciseSession();
  return (
    <div>
      <span data-testid="grade">{catalogGradeId ?? "none"}</span>
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
