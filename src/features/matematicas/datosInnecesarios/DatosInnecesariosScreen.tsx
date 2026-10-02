import { useCallback, useEffect, useState } from "react";
import { generateSession, validar } from "../../../core/activities/datosInnecesarios";
import type { DatosInnecesariosExercise } from "../../../core/activities/datosInnecesarios";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./DatosInnecesariosScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

const AUTOAVANCE_MS = 1200;

interface SessionState {
  exercises: DatosInnecesariosExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selected: number | null;
  alreadyFailed: boolean;
}

function Frase({
  texto,
  indice,
  seleccionada,
  estado,
  onClick,
}: {
  texto: string;
  indice: number;
  seleccionada: number | null;
  estado: AnswerState;
  onClick: (indice: number) => void;
}) {
  let clase = "di__frase";
  if (estado === "correct" && seleccionada === indice) {
    clase += " di__frase--correcta";
  } else if (estado === "wrong" && seleccionada === indice) {
    clase += " di__frase--fallada";
  }
  return (
    <button
      type="button"
      className={clase}
      onClick={() => onClick(indice)}
      disabled={estado !== "idle"}
      data-indice={indice}
    >
      <span className="di__frase-num" aria-hidden="true">
        {indice + 1}.
      </span>
      <span className="di__frase-texto">{texto}</span>
    </button>
  );
}

export function DatosInnecesariosScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleAnswer = useCallback(
    (indice: number) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validar(current, indice);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: indice,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", selected: null, alreadyFailed: true }));
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        selected: null,
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selected: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle ?? ""}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  return (
    <div className={`ops ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="ops__celebration">¡Correcto! 📖⭐</div>
        )}

        <p className="di__pregunta">{current.pregunta}</p>

        <div className="di__historia" role="group" aria-label="Lee las frases y tacha la que sobra">
          {current.historia.map((frase, i) => (
            <Frase
              key={i}
              texto={frase}
              indice={i}
              seleccionada={session.selected}
              estado={session.answerState}
              onClick={handleAnswer}
            />
          ))}
        </div>
      </div>

      <footer className="ops__footer">
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
