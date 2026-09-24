import { useEffect, useCallback, useMemo, useState } from "react";
import { generateSession } from "../../../core/activities/problemas";
import type { ProblemaExercise, SessionResult, Theme } from "../../../core/activities/problemas";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import { LazyDigitCell } from "../../shared/DigitCell";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./ProblemaScreen.css";

import deportesImg from "../../../assets/problemas/temas/deportes.png";
import animalesImg from "../../../assets/problemas/temas/animales.png";
import claseImg from "../../../assets/problemas/temas/clase.png";
import naturalezaImg from "../../../assets/problemas/temas/naturaleza.png";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: ProblemaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  digits: string[];
  activeDigit: number;
  theme: Theme | null;
  alreadyFailed: boolean;
}

const THEMES: { id: Theme; label: string; image: string; color: string }[] = [
  { id: "deportes", label: "Deportes", image: deportesImg, color: "#2563eb" },
  { id: "animales", label: "Animales", image: animalesImg, color: "#ef4444" },
  { id: "clase", label: "Clase", image: claseImg, color: "#f59e0b" },
  { id: "naturaleza", label: "Naturaleza", image: naturalezaImg, color: "#22c55e" },
];

function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trimStart();
}

function slotCount(answer: number): number {
  return answer >= 10 ? 2 : 1;
}

export function ProblemaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const { mode, toggle } = useInputMode();

  const [canvasKey, setCanvasKey] = useState(0);

  const [session, setSession] = useState<SessionState>(() => ({
    exercises: [],
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    digits: [""],
    activeDigit: 0,
    theme: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const safeStory = useMemo(() => (current ? sanitizeText(current.story) : ""), [current]);
  const safeQuestion = useMemo(() => (current ? sanitizeText(current.question) : ""), [current]);
  const solutionText = useMemo(() => {
    if (!current) return "";
    const stageOk = session.answerState === "correct";
    return sanitizeText(
      stageOk
        ? current.solutionTemplate.replace("___", String(current.answer))
        : current.solutionTemplate,
    );
  }, [current, session.answerState]);

  const submitDigits = useCallback(
    (newDigits: string[]) => {
      if (!current) return;
      const combined = newDigits.join("");
      const answer = parseInt(combined, 10);
      const isCorrect = !isNaN(answer) && answer === current.answer;
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        digits: newDigits,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
        alreadyFailed: !isCorrect ? true : s.alreadyFailed,
      }));
    },
    [current],
  );

  const handleCanvasConfirm = useCallback(
    (i: number, digit: string) => {
      const newDigits = [...session.digits];
      newDigits[i] = digit;
      if (i > 0) {
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: i - 1 }));
      } else {
        submitDigits(newDigits);
      }
      setCanvasKey((k) => k + 1);
    },
    [session.digits, submitDigits],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (session.answerState !== "idle") return;
      const { digits, activeDigit } = session;
      if (activeDigit < 0) return;
      const newDigits = [...digits];
      newDigits[activeDigit] = d;
      if (activeDigit > 0) {
        setSession((s) => ({ ...s, digits: newDigits, activeDigit: activeDigit - 1 }));
      } else {
        submitDigits(newDigits);
      }
    },
    [session, submitDigits],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    const { digits, activeDigit } = session;
    const nd = [...digits];
    if (nd[activeDigit]) {
      nd[activeDigit] = "";
      setSession((s) => ({ ...s, digits: nd }));
    } else if (activeDigit > 0) {
      nd[activeDigit - 1] = "";
      setSession((s) => ({ ...s, digits: nd, activeDigit: activeDigit - 1 }));
    }
  }, [session]);

  const handleConfirm = useCallback(() => {
    if (session.answerState !== "idle") return;
    if (session.digits.every((d) => d !== "")) submitDigits([...session.digits]);
  }, [session, submitDigits]);

  const handleRetry = useCallback(() => {
    if (!current) return;
    const curLen = slotCount(current.answer);
    setSession((s) => ({
      ...s,
      answerState: "idle",
      digits: Array(curLen).fill(""),
      activeDigit: curLen - 1,
      alreadyFailed: true,
    }));
  }, [current]);

  const handleNext = useCallback(() => {
    const next = session.currentIndex + 1;
    if (next >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else if (session.exercises[next]) {
      const nextLen = slotCount(session.exercises[next].answer);
      setSession((s) => ({
        ...s,
        currentIndex: next,
        answerState: "idle",
        digits: Array(nextLen).fill(""),
        activeDigit: nextLen - 1,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1500);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    if (!session.theme) return;
    const exs = generateSession(difficulty, Date.now() % 999983, session.theme);
    const firstLen = exs.length > 0 ? slotCount(exs[0].answer) : 1;
    setFinished(null);
    setSession({
      exercises: exs,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      digits: Array(firstLen).fill(""),
      activeDigit: firstLen - 1,
      theme: session.theme,
      alreadyFailed: false,
    });
  }, [difficulty, session.theme]);

  const startSession = useCallback(
    (t: Theme) => {
      const exs = generateSession(difficulty, seed, t);
      const firstLen = exs.length > 0 ? slotCount(exs[0].answer) : 1;
      setSession({
        exercises: exs,
        currentIndex: 0,
        correctCount: 0,
        startTime: Date.now(),
        answerState: "idle",
        digits: Array(firstLen).fill(""),
        activeDigit: firstLen - 1,
        theme: t,
        alreadyFailed: false,
      });
    },
    [difficulty, seed],
  );

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        onRestart={handleRestart}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  if (!session.theme || session.exercises.length === 0) {
    return (
      <div className="prob">
        <ActivityHeader
          onExit={onExit}
          gradeTitle={gradeTitle}
          className={className}
          unitTitle={activity.title}
          mascotUrl={mascotUrl}
          difficultyStars={difficultyStars}
        >
          <InputModeToggle mode={mode} onToggle={toggle} />
        </ActivityHeader>
        <div className="prob__theme-screen">
          <p className="prob__theme-title">¿De qué trata el problema?</p>
          <div className="prob__theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="prob__theme-card"
                style={{ ["--theme-color" as never]: t.color }}
                onClick={() => startSession(t.id)}
              >
                <img className="prob__theme-image" src={t.image} alt={t.label} />
                <span className="prob__theme-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  // NOTE: story, question y solutionTemplate hoy se generan con literales internos
  // del core (generateSession), así que sanitizeText es una capa preventiva. Si
  // en el futuro estos textos aceptan parámetros externos (backend/plantillas),
  // esta sanitización ya evita XSS por HTML, `javascript:` o atributos on*= .

  const isTwoDigits = slotCount(current.answer) === 2;
  const opSym = current.op === "suma" ? "+" : "−";
  const stageOk = session.answerState === "correct";
  const stageBad = session.answerState === "wrong";

  return (
    <div className="prob">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className="prob__body">
        <div
          className={`prob__stage ${stageOk ? "prob__stage--correct" : stageBad ? "prob__stage--wrong" : ""}`}
        >
          {stageOk && <div className="prob__celebration">¡Muy bien! ⭐</div>}

          <div className="prob__card">
            <span className="prob__emoji">{current.emoji}</span>
            <div className="prob__card-texts">
              <p className="prob__story">{safeStory}</p>
              <p className="prob__question">{safeQuestion}</p>
            </div>
          </div>

          <div className="prob__section-block">
            <span className="prob__section-label">OPERACIÓN</span>
            <div className="prob__op-row">
              <div className="prob__operand">
                <div className="prob__num-box">{current.a}</div>
              </div>

              <span className="prob__op-sym">{opSym}</span>

              <div className="prob__operand">
                <div className="prob__num-box">{current.b}</div>
              </div>

              <span className="prob__op-sym">=</span>

              <div className="prob__answer-slots">
                {session.digits.map((val, slot) => {
                  const isActiveBox =
                    session.answerState === "idle" && session.activeDigit === slot;
                  const showCanvas = mode === "canvas" && isActiveBox;
                  return (
                    <div key={slot} className="prob__dab-slot">
                      {isTwoDigits && (
                        <span className="prob__du-label">{slot === 0 ? "D" : "U"}</span>
                      )}
                      {showCanvas ? (
                        <LazyDigitCell
                          key={`dab-${slot}-${canvasKey}`}
                          isActive={true}
                          onActivate={() => {}}
                          onConfirm={(dig) => handleCanvasConfirm(slot, dig)}
                          onClear={() => {
                            const nd = [...session.digits];
                            nd[slot] = "";
                            setSession((s) => ({ ...s, digits: nd }));
                          }}
                          state={session.answerState !== "idle" ? session.answerState : "idle"}
                          value={val}
                        />
                      ) : (
                        <div
                          className={[
                            "prob__answer-box",
                            isActiveBox ? "prob__answer-box--active" : "",
                            session.answerState === "correct" ? "prob__answer-box--correct" : "",
                            session.answerState === "wrong" ? "prob__answer-box--wrong" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            if (session.answerState !== "idle") return;
                            const nd = [...session.digits];
                            nd[slot] = "";
                            setSession((s) => ({ ...s, activeDigit: slot, digits: nd }));
                          }}
                        >
                          {stageOk
                            ? String(current.answer).padStart(slotCount(current.answer), "0")[slot]
                            : val}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="prob__section-block">
            <span className="prob__section-label">SOLUCIÓN</span>
            <p className={`prob__solution-text ${stageOk ? "prob__solution-text--filled" : ""}`}>
              {solutionText}
            </p>
          </div>

          {stageBad && <ActionButtons onRetry={handleRetry} onNext={handleNext} />}
        </div>

        {mode === "numpad" && (
          <footer className="prob__footer">
            <Numpad
              onDigit={handleDigit}
              onDelete={handleDelete}
              onConfirm={handleConfirm}
              disabled={session.answerState !== "idle"}
            />
          </footer>
        )}
      </div>
    </div>
  );
}
