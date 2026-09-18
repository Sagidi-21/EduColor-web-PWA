import { useState, useCallback, useEffect, useMemo } from "react";
import {
  generateSession,
  generateSessionForLevel,
  validateAnswer,
  PRESET_CONFIGS,
  CURRICULUM_LEVELS,
  type CountingExercise,
  type SessionResult,
  type CurriculumLevelId,
  type ExerciseStep,
} from "../../../core/activities/counting";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback, playPop } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import "./CountingScreen.css";

interface SessionState {
  exercises: CountingExercise[];
  currentIndex: number;
  currentStepIndex: number;
  correctCount: number;
  startTime: number;
  answerState: "idle" | "correct" | "wrong";
  selectedOption: number | null;
  alreadyFailed: boolean;
  touchedIndices: number[]; // para TOUCH mechanic
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
    currentStepIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedOption: null,
    alreadyFailed: false,
    touchedIndices: [],
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const currentStep = current?.steps[session.currentStepIndex];

  // Identificar los pasos que deben estar visibles (el actual y los anteriores persistentes)
  const visibleSteps = useMemo(() => {
    if (!current) return [];
    return current.steps.slice(0, session.currentStepIndex + 1).filter((s, i) => 
      i === session.currentStepIndex || s.persistent
    );
  }, [current, session.currentStepIndex]);

  const handleTouch = useCallback((index: number) => {
    if (current.interactionType !== "TOUCH") return;
    if (session.touchedIndices.includes(index)) return;
    
    playPop();
    setSession(s => ({
      ...s,
      touchedIndices: [...s.touchedIndices, index]
    }));
  }, [current?.interactionType, session.touchedIndices]);

  const allTouched = current?.interactionType !== "TOUCH" || session.touchedIndices.length === current.count;

  const handleAnswer = useCallback(
    (option: number) => {
      if (session.answerState !== "idle" || !allTouched) return;

      const isCorrect = validateAnswer(currentStep, option);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedOption: option,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, allTouched, currentStep]
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
    const isLastStep = session.currentStepIndex >= current.steps.length - 1;
    
    if (!isLastStep) {
      // Avanzar al siguiente paso del mismo ejercicio
      setSession((s) => ({
        ...s,
        currentStepIndex: s.currentStepIndex + 1,
        answerState: "idle",
        selectedOption: null,
        alreadyFailed: false,
      }));
      return;
    }

    // Avanzar al siguiente ejercicio
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= total) {
      setFinished({
        total: total * current.steps.length, // Total is now exercises * steps roughly, or just total exercises
        correct: session.correctCount,
        duration: Date.now() - session.startTime,
      });
    } else {
      setSession((s) => ({
        ...s,
        currentIndex: nextIndex,
        currentStepIndex: 0,
        answerState: "idle",
        selectedOption: null,
        alreadyFailed: false,
        touchedIndices: [],
      }));
    }
  }, [session, current, total]);

  // Avance automático tras respuesta correcta (1.2s para que se vea bien la respuesta)
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: useCurriculum 
        ? generateSessionForLevel(levelId!, Date.now() % 999983)
        : generateSession(cfg, Date.now() % 999983),
      currentIndex: 0,
      currentStepIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: false,
      touchedIndices: [],
    });
  };

  if (finished || !current) {
    return (
      <SummaryScreen
        result={finished!}
        onRestart={handleRestart}
        onExit={onExit}
        gradeLabel={gradeTitle || "Matemáticas"}
      />
    );
  }

  const arrangement = current.visualArrangement;
  const isCorrect = session.answerState === "correct";

  return (
    <div className={`counting counting--${arrangement}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`counting__stage ${isCorrect && session.currentStepIndex === current.steps.length - 1 ? "counting__stage--correct" : ""}`}>
        {isCorrect && session.currentStepIndex === current.steps.length - 1 && (
          <div className="counting__celebration">¡Muy bien! ⭐</div>
        )}

        {/* Panel D|U en tiempo real para 1-L2 */}
        {arrangement === "double-row" && (
          <div className="counting__du-panel">
            <div className="counting__du-col counting__du-col--d">
              <span className="counting__du-label">DECENAS</span>
              <span className="counting__du-value">{Math.floor(session.touchedIndices.length / 10)}</span>
            </div>
            <div className="counting__du-col counting__du-col--u">
              <span className="counting__du-label">UNIDADES</span>
              <span className="counting__du-value">{session.touchedIndices.length % 10}</span>
            </div>
          </div>
        )}

        {/* Group Frames */}
        {current.groupFrames?.map((gf, i) => {
          // Calculate bounding box in %
          let minX = 100, maxX = 0, minY = 100, maxY = 0;
          gf.indices.forEach(idx => {
            const p = current.positions[idx];
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
          const paddingX = 8;
          const paddingY = 12;
          
          return (
            <div
              key={`gf-${i}`}
              className={`counting__group-frame ${gf.isComplete ? "counting__group-frame--complete" : "counting__group-frame--partial"}`}
              style={{
                left: `${Math.max(0, minX - paddingX)}%`,
                top: `${Math.max(0, minY - paddingY)}%`,
                width: `${Math.min(100, maxX - minX + paddingX * 2)}%`,
                height: `${Math.min(100, maxY - minY + paddingY * 2)}%`
              }}
            >
              {gf.size >= 10 && arrangement === "packages" && (
                <div className="counting__group-label">{gf.size}</div>
              )}
            </div>
          );
        })}

        <div className="counting__objects" aria-label={`${current.count} objetos`}>
          {current.positions.map((pos, i) => {
            const isTouched = session.touchedIndices.includes(i);
            const isInteractive = current.interactionType === "TOUCH";
            
            if ((arrangement === "packages" || arrangement === "matrix-grid") && pos.value) {
              return (
                <div 
                  key={i} 
                  className={`counting__package counting__package--${pos.value}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div className="counting__package-inner">
                    <img src={current.imageUrl} alt={current.objectLabel} className="counting__package-icon" />
                    <span className="counting__package-text">PAQUETE</span>
                    <span className="counting__package-value">{pos.value}</span>
                  </div>
                </div>
              );
            }

            return (
              <img
                key={i}
                src={current.imageUrl}
                alt={current.objectLabel}
                onClick={() => handleTouch(i)}
                className={`counting__object ${arrangement !== "scattered-large" ? `counting__object--${arrangement}` : ""} ${isInteractive ? "counting__object--touchable" : ""} ${isTouched ? "counting__object--touched" : ""}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                  animationDelay: `${i * 30}ms`,
                }}
              />
            );
          })}
        </div>
      </div>

      <footer className="counting__footer">
        {current.interactionType === "TOUCH" && !allTouched && (
          <p className="counting__instruction">Toca todos los objetos contando en voz alta.</p>
        )}

        <div className="counting__steps-container" style={{ opacity: allTouched ? 1 : 0.3, pointerEvents: allTouched ? "auto" : "none" }}>
          {visibleSteps.map((step, idx) => {
            const isCurrentStep = idx === visibleSteps.length - 1;
            
            return (
              <div key={idx} className={`counting__step ${isCurrentStep ? "counting__step--active" : "counting__step--past"}`}>
                <p className="counting__question">{step.prompt}</p>
                
                <div className="counting__options">
                  {isCurrentStep ? (
                    // Opciones interactivas para el paso actual
                    step.options.map((option) => {
                      const isSelected = session.selectedOption === option;
                      const isOptionCorrect = option === step.correctAnswer;
                      let btnClass = "counting__option";
                      if (session.answerState === "correct" && isOptionCorrect) {
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
                    })
                  ) : (
                    // Respuesta fijada para pasos anteriores
                    <div className="counting__option counting__option--correct counting__option--fixed">
                      {step.correctAnswer}
                    </div>
                  )}
                </div>
              </div>
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