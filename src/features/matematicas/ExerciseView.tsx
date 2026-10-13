import { EngineScreen } from "./engine-screens";
import { useExerciseSession } from "./ExerciseSessionContext";

interface Props {
  onExit: () => void;
}

export function ExerciseView({ onExit }: Props) {
  const { session } = useExerciseSession();

  if (!session) return null;

  return (
    <EngineScreen
      key={`${session.difficulty}-${session.levelId ?? ""}-${session.seed}`}
      activity={session.activity}
      difficulty={session.difficulty}
      seed={session.seed}
      levelId={session.levelId}
      onExit={onExit}
      gradeTitle={session.gradeTitle}
      className={session.className}
      mascotUrl={session.mascotUrl}
      difficultyStars={session.difficultyStars}
    />
  );
}
