import { useCallback, useEffect, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type MenuCafeteriaExercise,
  type MenuItem,
} from "../../../core/activities/menuCafeteria";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./MenuCafeteriaScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: MenuCafeteriaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selectedOption: string | null;
  alreadyFailed: boolean;
}

/** Tiempo en ms que se muestra el feedback de acierto antes de autoavanzar. */
const AUTOAVANCE_MS = 900;

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  return {
    exercises: generateSession(difficulty, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedOption: null,
    alreadyFailed: false,
  };
}

function MenuCard({ items, tray }: { items: MenuItem[]; tray: MenuItem[] }) {
  const trayNames = new Set(tray.map((t) => t.name));
  return (
    <div className="mc__menu-card">
      <p className="mc__menu-title">🍽️ Carta del menú</p>
      <div className="mc__menu-grid">
        {items.map((item, i) => {
          const inTray = trayNames.has(item.name);
          return (
            <div key={i} className={`mc__menu-item ${inTray ? "mc__menu-item--selected" : ""}`}>
              <span className="mc__emoji">{item.emoji}</span>
              <span className="mc__name">{item.name}</span>
              <span className="mc__price">{item.price}€</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuCafeteriaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
}: EngineScreenProps) {
  const [session, setSession] = useState(() => freshSession(seed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      const duration = Date.now() - session.startTime;
      setFinished({ correct: session.correctCount, total, duration });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        selectedOption: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession(freshSession(Date.now() % 999983, difficulty));
  }, [difficulty]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle") return;
      const ok = validateAnswer(current, val);
      if (ok) playFeedback(true);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selectedOption: val,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

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

  if (!current) return <></>;

  const stageClass =
    session.answerState === "correct"
      ? "mc__stage--correct"
      : session.answerState === "wrong"
        ? "mc__stage--wrong"
        : "";

  return (
    <div className="mc">
      <ActivityHeader
        title={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
      />

      <div className={`mc__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="mc__cheer">¡Correcto! 🍽️⭐</div>}

        <MenuCard items={current.menuItems} tray={current.tray} />

        <p className="mc__question">{current.question}</p>

        <div className="mc__options">
          {current.options.map((opt) => {
            let cls = "mc__opt";
            if (session.answerState === "correct" && opt.value === current.correctAnswer)
              cls += " mc__opt--correct";
            else if (session.answerState === "wrong" && opt.value === session.selectedOption)
              cls += " mc__opt--wrong";
            return (
              <button
                key={opt.value}
                className={cls}
                onClick={() => handleAnswer(opt.value)}
                disabled={session.answerState !== "idle"}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {session.answerState === "wrong" && (
          <div className="mc__wrong-feedback">
            <span>¡Inténtalo de nuevo!</span>
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
