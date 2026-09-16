import { useState, useCallback, useEffect } from "react";
import {
  generateSession,
  generateSessionForLevel,
  validateAnswer,
  PRESET_CONFIGS,
  CURRICULUM_LEVELS,
  type CountingExercise,
  type SessionResult,
  type CurriculumLevelId,
} from "../../../core/activities/counting";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import "./CountingScreen.css";

interface SessionState {
  exercises: CountingExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: "idle" | "correct" | "wrong";
  selectedOption: number | null;
  alreadyFailed: boolean;
}

function cuantos(objectLabel: string): string {
  const FEMININE: Record<string, boolean> = {
    manzanas: true,
    flores: true,
  };
  return FEMININE[objectLabel] ? "Cuántas" : "Cuántos";
}

function getLevelConfig(difficulty: string, levelId?: CurriculumLevelId) {
  if (levelId && CURRICULUM_LEVELS[levelId]) {
    return CURRICULUM_LEVELS[levelId];
  }
  return PRESET_CONFIGS[difficulty as keyof typeof PRESET_CONFIGS];
}

export function CountingScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
  levelId,
}: EngineScreenProps): JSX.Element {
  const cfg = getLevelConfig(difficulty, levelId);
  const useCurriculum = !!levelId && !!CURRICULUM_LEVELS[levelId];
  
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: useCurriculum ? generateSessionForLevel(levelId!, seed) : generateSession(cfg, seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedOption: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleAnswer = useCallback(
    (option: number) => {
      if (session.answerState !== "idle") return;

      const isCorrect = validateAnswer(current, option);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedOption: option,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= total) {
      setFinished({
        total,
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: nextIndex,
        answerState: "idle",
        selectedOption: null,
      }));
    }
  }, [session, total]);

  // Avance automático tras respuesta correcta (800ms)
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: useCurriculum 
        ? generateSessionForLevel(levelId!, Date.now() % 999983)
        : generateSession(cfg, Date.now() % 999983),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: false,
    });
  };

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

  const arrangement = current.visualArrangement || (useCurriculum ? cfg.visualArrangement : "default");

  return (
    <div className={`counting counting--${arrangement}`}>
      {/* ── Barra superior ── */}
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      {/* ── Área de objetos ── */}
      <div
        className={`counting__stage ${session.answerState === "correct" ? "counting__stage--correct" : ""}`}
      >
        {session.answerState === "correct" && (
          <div className="counting__celebration">¡Muy bien! ⭐</div>
        )}

        <div className="counting__objects" aria-label={`${current.count} objetos`}>
          {current.positions.map((pos, i) => (
            <img
              key={i}
              src={current.imageUrl}
              alt={current.objectLabel}
              className={`counting__object ${arrangement !== "default" ? `counting__object--${arrangement}` : ""}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Pregunta y opciones ── */}
      <footer className="counting__footer">
        <p className="counting__question">
          ¿{cuantos(current.objectLabel)} <strong>{current.objectLabel}</strong> hay?
        </p>

        <div className="counting__options">
          {current.options.map((option) => {
            const isSelected = session.selectedOption === option;
            const isCorrect = option === current.correctAnswer;
            let btnClass = "counting__option";
            if (session.answerState === "correct" && isCorrect) {
              btnClass += " counting__option--correct";
            } else if (session.answerState === "wrong" && isSelected) {
              btnClass += " counting__option--wrong";
            }
            return (
              <button
                key={option}
                className={btnClass}
                onClick={() => handleAnswer(option)}
                disabled={session.answerState !== "idle"}
              >
                {option}
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