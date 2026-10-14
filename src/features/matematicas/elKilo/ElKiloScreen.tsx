import { Fragment, useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/elKilo";
import type { KiloExercise, KiloItem } from "../../../core/activities/elKilo";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { kiloImageUrl, REFERENCE_URL } from "./kiloImages";

import "../operations/OperationsScreen.css";
import "./ElKiloScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: KiloExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  chosen: string | null;
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    chosen: null,
    alreadyFailed: false,
  };
}

function label(item: KiloItem): string {
  return item.name.charAt(0).toUpperCase() + item.name.slice(1);
}

function ItemCard({ item, testId }: { item: KiloItem; testId: string }) {
  return (
    <div className="kil__image-box" data-testid={testId}>
      <img className="kil__img" src={kiloImageUrl(item)} alt={label(item)} />
      <span className="kil__img-name">{label(item)}</span>
    </div>
  );
}

export function ElKiloScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleNext = useCallback(() => {
    setSession((s) => {
      const next = s.currentIndex + 1;
      if (next >= s.exercises.length) {
        setFinished({
          total: s.exercises.length,
          correct: s.correctCount,
          duration: Date.now() - s.startTime,
        });
        return s;
      }
      return { ...s, currentIndex: next, answerState: "idle", chosen: null, alreadyFailed: false };
    });
  }, []);

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", chosen: null, alreadyFailed: true }));
  }, []);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleChoice = useCallback(
    (opt: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, opt);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        chosen: opt,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: ok ? s.alreadyFailed : true,
      }));
    },
    [session.answerState, current],
  );

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || activity.title}
        onRestart={() => {
          setFinished(null);
          setSession(freshSession(sessionSeed, difficulty));
        }}
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
    <div className={`ops kil ${className ?? ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="ops__celebration">¡Correcto! ⚖️⭐</div>
        )}

        <p className="kil__question">{current.question}</p>

        <div className="kil__card">
          <div className="kil__scale-hint">
            <img className="kil__ref-img" src={REFERENCE_URL} alt="Pesa de 1 kg: referencia" />
            <span>Referencia: 1 kg</span>
          </div>

          <div className="kil__images">
            {current.items.map((item, i) => (
              <Fragment key={item.file}>
                {i > 0 && (
                  <span className="kil__vs" aria-hidden="true">
                    VS
                  </span>
                )}
                <ItemCard item={item} testId={`kil-item-${i}`} />
              </Fragment>
            ))}
          </div>
        </div>

        <div className="kil__opts">
          {current.options.map((opt, i) => {
            let cls = "kil__opt";
            if (session.answerState === "correct" && opt === current.answer)
              cls += " kil__opt--correct";
            else if (session.answerState === "wrong" && opt === session.chosen)
              cls += " kil__opt--wrong";
            return (
              <button
                key={opt}
                id={`kil-option-${i}`}
                type="button"
                className={cls}
                onClick={() => handleChoice(opt)}
                disabled={session.answerState !== "idle"}
              >
                {opt}
              </button>
            );
          })}
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
