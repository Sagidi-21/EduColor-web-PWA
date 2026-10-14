import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../operations/OperationsScreen.css";
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
/** Tamaño máximo del enunciado; se reduce si no cabe a una línea. */
const ENUNCIADO_MAX_PX = 36;
const ENUNCIADO_MIN_PX = 18;

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
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(seed);
  const [session, setSession] = useState(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  /** Ajusta el enunciado al ancho disponible sin salirse ni partir la línea. */
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
  }, [current?.question, session.currentIndex]);

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
        selectedOption: null,
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
    setSession(freshSession(sessionSeed, difficulty));
  }, [difficulty, sessionSeed]);

  const handleAnswer = useCallback(
    (val: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, val);
      playFeedback(ok);
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
    <div className={`ops mc ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1}/${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="ops__celebration">¡Correcto! 🍽️⭐</div>
        )}

        <p ref={questionRef} className="mc__question">
          {current.question}
        </p>

        <div className="mc__body">
          <div className="mc__carta">
            <MenuCard items={current.menuItems} tray={current.tray} />
          </div>

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
                  type="button"
                  className={cls}
                  onClick={() => handleAnswer(opt.value)}
                  disabled={session.answerState !== "idle"}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
