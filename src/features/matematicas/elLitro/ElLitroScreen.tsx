import { useState, useEffect, useCallback } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/elLitro";
import type { LitroExercise, LitroItem } from "../../../core/activities/elLitro";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { litroImageUrl, REFERENCE_ITEM } from "./litroImages";

import "../operations/OperationsScreen.css";
import "./ElLitroScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: LitroExercise[];
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

function label(item: LitroItem): string {
  return item.name.charAt(0).toUpperCase() + item.name.slice(1);
}

function ItemCard({ item, testId }: { item: LitroItem; testId: string }) {
  const url = litroImageUrl(item);
  return (
    <div className="lit__image-box" data-testid={testId}>
      <img className="lit__img" src={url} alt={label(item)} />
      <span className="lit__img-name">{label(item)}</span>
    </div>
  );
}

export function ElLitroScreen({
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
    <div className="ops">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Muy bien! ⭐</div>}

        <div className="lit__card">
          {current.type === "classify" ? (
            <>
              <div className="lit__images">
                <ItemCard item={current.items[0]} testId="lit-item-0" />
              </div>
              <div className="lit__scale-hint">
                <img
                  className="lit__ref-img"
                  src={litroImageUrl(REFERENCE_ITEM)}
                  alt={`${label(REFERENCE_ITEM)}: referencia de 1 litro`}
                />
                <span>Referencia: 1 L</span>
              </div>
            </>
          ) : (
            <div className="lit__images">
              <ItemCard item={current.items[0]} testId="lit-item-0" />
              <span className="lit__vs" aria-hidden="true">
                VS
              </span>
              <ItemCard item={current.items[1]} testId="lit-item-1" />
            </div>
          )}

          <p className="lit__question">{current.question}</p>
        </div>
      </div>

      <footer className="ops__footer">
        <div className="lit__opts">
          {current.options.map((opt, i) => {
            let cls = "lit__opt";
            if (session.answerState === "correct" && opt === current.answer)
              cls += " lit__opt--correct";
            else if (session.answerState === "wrong" && opt === session.chosen)
              cls += " lit__opt--wrong";
            return (
              <button
                key={opt}
                id={`lit-option-${i}`}
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
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
