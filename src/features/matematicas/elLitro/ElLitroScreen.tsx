import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
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

/** Tamaño máximo del enunciado; se reduce si no cabe a una línea. */
const ENUNCIADO_MAX_PX = 40;
const ENUNCIADO_MIN_PX = 18;

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

function ItemCard({
  item,
  testId,
  onSelect,
  state = "idle",
  disabled = false,
}: {
  item: LitroItem;
  testId: string;
  onSelect?: (value: string) => void;
  state?: AnswerState;
  disabled?: boolean;
}) {
  const url = litroImageUrl(item);
  const name = label(item);
  const img = <img className="lit__img" src={url} alt={name} />;

  if (onSelect) {
    return (
      <button
        type="button"
        className={`lit__image-box lit__image-box--pick lit__image-box--${state}`}
        data-testid={testId}
        data-value={name}
        onClick={() => onSelect(name)}
        disabled={disabled}
      >
        {img}
      </button>
    );
  }

  return (
    <div className="lit__image-box" data-testid={testId}>
      {img}
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
  const questionRef = useRef<HTMLParagraphElement>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  useLayoutEffect(() => {
    const el = questionRef.current;
    if (!el) return;

    const ajustar = () => {
      let size = ENUNCIADO_MAX_PX;
      el.style.fontSize = `${size}px`;
      while (size > ENUNCIADO_MIN_PX && el.scrollWidth > el.clientWidth + 1) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };

    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [current?.question, current?.type, session.currentIndex]);

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

  const esClasificar = current.type === "classify";
  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";

  const questionText = esClasificar ? current.question : `${current.question} (pulsa sobre ella)`;

  const pickState = (item: LitroItem): AnswerState => {
    const value = label(item);
    if (session.answerState === "correct" && value === current.answer) return "correct";
    if (session.answerState === "wrong" && value === session.chosen) return "wrong";
    return "idle";
  };

  return (
    <div className={`ops lit ${className ?? ""}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div
        className={`ops__stage ${stageClass}${esClasificar ? " lit__stage--classify" : " lit__stage--compare"}`}
      >
        <p ref={questionRef} className="lit__question">
          {questionText}
        </p>

        {esClasificar ? (
          <div className="lit__body">
            <div className="lit__visual">
              <div className="lit__classify">
                <ItemCard item={current.items[0]} testId="lit-item-0" />
                <div className="lit__scale-hint">
                  <img
                    className="lit__ref-img"
                    src={litroImageUrl(REFERENCE_ITEM)}
                    alt={`${label(REFERENCE_ITEM)}: referencia de 1 litro`}
                  />
                  <span>Referencia: 1 L</span>
                </div>
              </div>
              {session.answerState === "correct" && (
                <div className="ops__celebration activity-celebration--inline">¡Correcto! 🧴⭐</div>
              )}
            </div>

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
          </div>
        ) : (
          <>
            <div className="lit__images">
              {current.items.map((item, i) => (
                <ItemCard
                  key={item.file}
                  item={item}
                  testId={`lit-item-${i}`}
                  onSelect={handleChoice}
                  state={pickState(item)}
                  disabled={session.answerState !== "idle"}
                />
              ))}
            </div>

            {session.answerState === "correct" && (
              <div className="ops__celebration activity-celebration--inline">¡Correcto! 🧴⭐</div>
            )}
          </>
        )}
      </div>

      <footer className="ops__footer">
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}
