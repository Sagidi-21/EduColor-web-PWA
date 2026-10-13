import { render, screen, fireEvent } from "@testing-library/react";
import type { ActivityManifest } from "../../../core/content/contracts";
import { ExerciseSessionProvider } from "../ExerciseSessionProvider";
import { useExerciseSession } from "../ExerciseSessionContext";
import { ActivityHeader } from "./ActivityHeader";

const activity = {
  id: "lecturaNumeros",
  engineId: "lecturaNumeros",
  title: "Lectura de números",
  gradeIds: ["grade-1"],
} as unknown as ActivityManifest;

function LaunchAndHeader() {
  const { launchSession, session } = useExerciseSession();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          launchSession({
            activity,
            difficulty: "easy",
            gradeId: "grade-1",
            gradeTitle: "1º Primaria",
            className: "1A",
            difficultyStars: "⭐",
          })
        }
      >
        Lanzar
      </button>
      {session && (
        <ActivityHeader
          onExit={() => undefined}
          gradeTitle={session.gradeTitle}
          unitTitle={session.activity.title}
          difficultyStars={session.difficultyStars}
        />
      )}
      {session && <span data-testid="diff">{session.difficulty}</span>}
    </div>
  );
}

describe("ActivityHeader — chips de nivel", () => {
  it("sin sesión muestra difficultyStars y no chips", () => {
    render(<ActivityHeader onExit={() => undefined} unitTitle="Prueba" difficultyStars="⭐⭐" />);
    expect(screen.getByText("⭐⭐")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Nivel de dificultad" })).not.toBeInTheDocument();
  });

  it("con sesión muestra 4 chips y deshabilita la activa", () => {
    render(
      <ExerciseSessionProvider>
        <LaunchAndHeader />
      </ExerciseSessionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanzar" }));

    const group = screen.getByRole("group", { name: "Nivel de dificultad" });
    expect(group).toBeInTheDocument();

    const level1 = screen.getByRole("button", { name: "Nivel 1" });
    const level3 = screen.getByRole("button", { name: "Nivel 3" });
    expect(level1).toBeDisabled();
    expect(level3).not.toBeDisabled();

    fireEvent.click(level3);
    expect(screen.getByTestId("diff")).toHaveTextContent("hard");
    expect(screen.getByRole("button", { name: "Nivel 3" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Nivel 1" })).not.toBeDisabled();
  });
});
