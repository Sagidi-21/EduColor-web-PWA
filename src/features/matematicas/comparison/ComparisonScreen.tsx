import { useMemo, useState } from "react";
import {
  createComparisonExercise,
  isCorrectComparison,
  type ComparisonChoice,
} from "../../../core/activities/comparison";
import type { EngineScreenProps } from "../engine-screens";
import "./ComparisonScreen.css";

const objectImages = import.meta.glob<string>("../../../assets/objects/*/*.png", {
  eager: true,
  import: "default",
});

function objectSrc(objectSet: string, objectIndex: number): string {
  const matches = Object.entries(objectImages)
    .filter(([path]) => path.includes(`/objects/${objectSet}/`))
    .sort(([left], [right]) => left.localeCompare(right));
  return matches[objectIndex % Math.max(1, matches.length)]?.[1] ?? "";
}

function groupClass(
  side: "left" | "right",
  choice: ComparisonChoice | null,
  answer: ComparisonChoice,
): string {
  const evaluated = choice !== null;
  const classes = ["cmp__group"];
  if (choice === side) classes.push("cmp__group--picked");
  if (evaluated && answer === side) classes.push("cmp__group--correct");
  if (evaluated && choice === side && answer !== side) classes.push("cmp__group--wrong");
  return classes.join(" ");
}

export function ComparisonScreen({ activity, difficulty, seed, onExit }: EngineScreenProps) {
  const [exerciseSeed, setExerciseSeed] = useState(seed);
  const [choice, setChoice] = useState<ComparisonChoice | null>(null);
  const exercise = useMemo(
    () => createComparisonExercise(exerciseSeed, difficulty),
    [difficulty, exerciseSeed],
  );
  const imageSrc = objectSrc(exercise.objectSet, exercise.objectIndex);
  const evaluated = choice !== null;
  const correct = choice !== null && isCorrectComparison(exercise, choice);
  const prompt =
    exercise.answer === "equal"
      ? "¿Tienen los mismos objetos?"
      : `¿Qué grupo tiene ${exercise.question === "more" ? "más" : "menos"} objetos?`;

  const pick = (next: ComparisonChoice) => {
    if (evaluated) return;
    setChoice(next);
  };

  return (
    <div className="cmp">
      <header className="cmp__header">
        <button className="cmp__back" onClick={onExit}>
          ← Actividades
        </button>
        <h1 className="cmp__title">{activity.title}</h1>
      </header>
      <p className="cmp__prompt">{prompt}</p>
      <div className="cmp__groups">
        <button
          className={groupClass("left", choice, exercise.answer)}
          onClick={() => pick("left")}
          disabled={evaluated}
          aria-label={`Grupo de la izquierda, ${exercise.leftCount} objetos`}
        >
          <span className="cmp__group-label">Izquierda</span>
          <span className="cmp__objects">
            {Array.from({ length: exercise.leftCount }, (_, index) => (
              <img key={index} src={imageSrc} alt="" />
            ))}
          </span>
        </button>
        <button
          className={groupClass("right", choice, exercise.answer)}
          onClick={() => pick("right")}
          disabled={evaluated}
          aria-label={`Grupo de la derecha, ${exercise.rightCount} objetos`}
        >
          <span className="cmp__group-label">Derecha</span>
          <span className="cmp__objects">
            {Array.from({ length: exercise.rightCount }, (_, index) => (
              <img key={index} src={imageSrc} alt="" />
            ))}
          </span>
        </button>
      </div>
      {exercise.allowEqual && (
        <button
          className={`cmp__equal ${choice === "equal" ? "cmp__equal--picked" : ""}`}
          onClick={() => pick("equal")}
          disabled={evaluated}
        >
          Tienen los mismos
        </button>
      )}
      {evaluated && (
        <div className="cmp__feedback" role="status">
          <p className={correct ? "cmp__result cmp__result--ok" : "cmp__result cmp__result--ko"}>
            {correct ? "¡Correcto!" : "No es esa. Mira de nuevo los grupos."}
          </p>
          <button
            className="cmp__next"
            onClick={() => {
              setChoice(null);
              setExerciseSeed((current) => current + 1);
            }}
          >
            Otro ejercicio
          </button>
        </div>
      )}
    </div>
  );
}
