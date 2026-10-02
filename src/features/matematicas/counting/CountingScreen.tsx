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
} from "../../../core/activities/counting";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback, playPop } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import "../components/ActivityHeader.css";
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen } from "../components/SummaryScreen";
import { useInputMode } from "../../shared/hooks/useInputMode";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { LazyDigitCell } from "../../shared/DigitCell";
import { Numpad } from "../../shared/components/Numpad";
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
  filledGroupIndices: number[]; // para GROUP mechanic (drag & drop de decenas)
  filledContainerIndices: number[]; // para rastrear qué contenedor visual se llenó
  posTableInput: { hundreds?: string; tens: string; units: string }; // para FILL_TABLE mechanic
}

interface DragState {
  gfIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  zoom: number;
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

  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: useCurriculum
      ? generateSessionForLevel(levelId!, sessionSeed)
      : generateSession(cfg, sessionSeed),
    currentIndex: 0,
    currentStepIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedOption: null,
    alreadyFailed: false,
    touchedIndices: [],
    filledGroupIndices: [],
    filledContainerIndices: [],
    posTableInput: { tens: "", units: "" },
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const { mode, toggle } = useInputMode();
  const [canvasKeys, setCanvasKeys] = useState({ hundreds: 0, tens: 0, units: 0 });
  const [activeInputCell, setActiveInputCell] = useState<"hundreds" | "tens" | "units" | null>(
    null,
  );

  const current = session.exercises[session.currentIndex];
  const isLevel2 = levelId?.startsWith("2-");
  const total = session.exercises.length;
  const currentStep = current?.steps[session.currentStepIndex];

  // Identificar los pasos que deben estar visibles (el actual y los anteriores persistentes)
  const visibleSteps = useMemo(() => {
    if (!current) return [];
    return current.steps
      .slice(0, session.currentStepIndex + 1)
      .filter((s, i) => i === session.currentStepIndex || s.persistent);
  }, [current, session.currentStepIndex]);

  const handleTouch = (index: number) => {
    if (current.interactionType !== "TOUCH") return;
    if (session.touchedIndices.includes(index)) return;

    playPop();
    setSession((s) => ({
      ...s,
      touchedIndices: [...s.touchedIndices, index],
    }));
  };

  const numCompleteGroups = useMemo(() => {
    return current?.groupFrames?.filter((gf) => gf.isComplete).length || 0;
  }, [current]);

  const allTouched =
    current?.interactionType === "TOUCH"
      ? session.touchedIndices.length === current.count
      : current?.interactionType === "GROUP"
        ? session.filledGroupIndices.length === numCompleteGroups
        : current?.interactionType === "DRAG"
          ? session.filledGroupIndices.length === (current.groupFrames?.length || 0)
          : current?.interactionType === "FILL_TABLE"
            ? true
            : true; // Para SELECT, SLIDER, etc, siempre pueden responder

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
    [session.answerState, allTouched, currentStep],
  );

  const submitTableAnswer = useCallback(() => {
    if (session.answerState !== "idle" || !currentStep) return;
    const ans =
      currentStep.answerType === "COUNT_TENS"
        ? session.posTableInput.tens
        : currentStep.answerType === "COUNT_UNITS"
          ? session.posTableInput.units
          : currentStep.answerType === "COUNT_HUNDREDS"
            ? session.posTableInput.hundreds || ""
            : (session.posTableInput.hundreds || "") +
              session.posTableInput.tens +
              session.posTableInput.units;
    if (ans !== "") {
      handleAnswer(parseInt(ans, 10));
    }
  }, [session.answerState, currentStep, session.posTableInput, handleAnswer]);

  const handleRetry = useCallback(() => {
    const field =
      currentStep?.answerType === "COUNT_TENS"
        ? "tens"
        : currentStep?.answerType === "COUNT_UNITS"
          ? "units"
          : currentStep?.answerType === "COUNT_HUNDREDS"
            ? "hundreds"
            : null;
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: true,
      ...(field ? { posTableInput: { ...s.posTableInput, [field]: "" } } : {}),
    }));
    if (field === "tens") setCanvasKeys((k) => ({ ...k, tens: k.tens + 1 }));
    else if (field === "units") setCanvasKeys((k) => ({ ...k, units: k.units + 1 }));
    else if (field === "hundreds") setCanvasKeys((k) => ({ ...k, hundreds: k.hundreds + 1 }));
  }, [currentStep]);

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
        filledGroupIndices: [],
        filledContainerIndices: [],
        posTableInput: { hundreds: "", tens: "", units: "" },
      }));
      setCanvasKeys({ hundreds: 0, tens: 0, units: 0 });
      setActiveInputCell(isLevel2 ? "hundreds" : "tens");
    }
  }, [session, current.steps.length, total, isLevel2]);

  // Avance automático tras respuesta correcta (solo pasos intermedios de FILL_TABLE y otros modos)
  useEffect(() => {
    if (session.answerState !== "correct") return;
    // COMPOSE_NUMBER en FILL_TABLE: el niño avanza manualmente con el botón "Siguiente"
    const isTotal =
      current?.interactionType === "FILL_TABLE" && currentStep?.answerType === "COMPOSE_NUMBER";
    if (isTotal) return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext, current?.interactionType, currentStep?.answerType]);

  // Auto-respuesta del total en FILL_TABLE (paso COMPOSE_NUMBER)
  useEffect(() => {
    if (current?.interactionType !== "FILL_TABLE") return;
    if (currentStep?.answerType !== "COMPOSE_NUMBER") return;
    if (session.answerState !== "idle") return;
    const t = setTimeout(submitTableAnswer, 400);
    return () => clearTimeout(t);
  }, [current?.interactionType, currentStep?.answerType, session.answerState, submitTableAnswer]);

  // Celda activa efectiva: en numpad+FILL_TABLE+idle siempre se deriva del paso actual
  // (evita setState dentro de un effect — react-hooks/set-state-in-effect)
  const resolvedActiveCell = useMemo(() => {
    if (
      current?.interactionType === "FILL_TABLE" &&
      mode === "numpad" &&
      session.answerState === "idle"
    ) {
      if (currentStep?.answerType === "COUNT_TENS") return "tens" as const;
      if (currentStep?.answerType === "COUNT_UNITS") return "units" as const;
      if (currentStep?.answerType === "COUNT_HUNDREDS") return "hundreds" as const;
      return null;
    }
    return activeInputCell;
  }, [
    current?.interactionType,
    currentStep?.answerType,
    mode,
    session.answerState,
    activeInputCell,
  ]);

  const handleRestart = () => {
    setFinished(null);
    setSession({
      exercises: useCurriculum
        ? generateSessionForLevel(levelId!, sessionSeed)
        : generateSession(cfg, sessionSeed),
      currentIndex: 0,
      currentStepIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: false,
      touchedIndices: [],
      filledGroupIndices: [],
      filledContainerIndices: [],
      posTableInput: { hundreds: "", tens: "", units: "" },
    });
    setCanvasKeys({ hundreds: 0, tens: 0, units: 0 });
    setActiveInputCell(isLevel2 ? "hundreds" : "tens");
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
  if (!current) {
    return (
      <div className="counting counting--loading">
        <ActivityHeader
          onExit={onExit}
          gradeTitle={gradeTitle}
          className={className}
          unitTitle={activity.title}
          mascotUrl={mascotUrl}
          difficultyStars={difficultyStars}
          progress="0/0"
        />
        <div className="counting__loading">Cargando sesión de conteo…</div>
      </div>
    );
  }

  const arrangement = current.visualArrangement;
  const isCorrect = session.answerState === "correct";

  return (
    <div
      className={`counting counting--${arrangement}`}
      onPointerMove={(e) => {
        if (dragState) {
          setDragState((prev) =>
            prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null,
          );
        }
      }}
      onPointerUp={(e) => {
        if (!dragState) return;

        if (current.interactionType === "GROUP") {
          const containers = Array.from(
            document.querySelectorAll<HTMLElement>(
              ".counting__ten-container:not(.counting__ten-container--filled)",
            ),
          );

          const target = containers.find((container) => {
            const rect = container.getBoundingClientRect();
            return (
              e.clientX >= rect.left &&
              e.clientX <= rect.right &&
              e.clientY >= rect.top &&
              e.clientY <= rect.bottom
            );
          });

          if (target) {
            const containerIndex = parseInt(target.getAttribute("data-container-index") || "-1");
            playPop();
            setSession((s) => {
              if (s.filledGroupIndices.includes(dragState.gfIndex)) return s;
              return {
                ...s,
                filledGroupIndices: [...s.filledGroupIndices, dragState.gfIndex],
                filledContainerIndices: [...(s.filledContainerIndices || []), containerIndex],
              };
            });
          }
        } else if (current.interactionType === "DRAG") {
          const dropZones = Array.from(document.querySelectorAll<HTMLElement>("[data-drop-zone]"));

          const target = dropZones.find((zone) => {
            const rect = zone.getBoundingClientRect();
            return (
              e.clientX >= rect.left &&
              e.clientX <= rect.right &&
              e.clientY >= rect.top &&
              e.clientY <= rect.bottom
            );
          });

          if (target) {
            const zoneType = target.getAttribute("data-drop-zone");
            const gf = current.groupFrames![dragState.gfIndex];

            // Validar: Decenas a decenas, unidades a unidades
            if (
              (zoneType === "tens" && gf.isComplete) ||
              (zoneType === "units" && !gf.isComplete)
            ) {
              playPop();
              setSession((s) => {
                if (s.filledGroupIndices.includes(dragState.gfIndex)) return s;
                return {
                  ...s,
                  filledGroupIndices: [...s.filledGroupIndices, dragState.gfIndex],
                };
              });
            } else {
              // Feedback sonoro de error si suelta en la columna equivocada
              import("../../shared/audioFeedback").then((m) => m.playFeedback(false));
            }
          }
        }

        setDragState(null);
      }}
      onPointerCancel={() => {
        if (dragState) {
          setDragState(null);
        }
      }}
    >
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      >
        {/* Toggle numpad/canvas solo visible en FILL_TABLE */}
        {current.interactionType === "FILL_TABLE" && (
          <InputModeToggle mode={mode} onToggle={toggle} />
        )}
      </ActivityHeader>

      <div
        className={`counting__body ${
          mode === "numpad" && current.interactionType === "FILL_TABLE" && !allTouched
            ? "counting__body--with-numpad"
            : ""
        }`}
      >
        <div
          className={`counting__stage ${isCorrect && session.currentStepIndex === current.steps.length - 1 ? "counting__stage--correct" : ""}`}
        >
          {isCorrect && session.currentStepIndex === current.steps.length - 1 && (
            <div className="counting__celebration">¡Muy bien! ⭐</div>
          )}

          {/* Background labels for mass-vs-blocks */}
          {arrangement === "mass-vs-blocks" && (
            <div className="counting__zone-labels">
              <div className="counting__zone-label counting__zone-label--c">C</div>
              <div className="counting__zone-label counting__zone-label--d">D</div>
              <div className="counting__zone-label counting__zone-label--u">U</div>
            </div>
          )}

          {/* Panel D|U en tiempo real para 1-L2 */}
          {arrangement === "double-row" && (
            <div className="counting__du-panel">
              <div className="counting__du-col counting__du-col--d">
                <span className="counting__du-label">DECENAS</span>
                <span className="counting__du-value">
                  {Math.floor(session.touchedIndices.length / 10)}
                </span>
              </div>
              <div className="counting__du-col counting__du-col--u">
                <span className="counting__du-label">UNIDADES</span>
                <span className="counting__du-value">{session.touchedIndices.length % 10}</span>
              </div>
            </div>
          )}

          {/* Group Frames */}
          {current.groupFrames?.map((gf, i) => {
            const isFilled = session.filledGroupIndices.includes(i);
            if (isFilled) return null;

            // FILL_TABLE: los paquetes se renderizan solos como objetos (pos.value=10)
            // No necesitamos el bounding box del GroupFrame
            if (current.interactionType === "FILL_TABLE") return null;

            // Para DRAG con paquetes de decena: renderizamos una caja compacta draggable
            // (el GroupFrame tiene un solo índice que apunta al paquete pos.value=10)
            if (current.interactionType === "DRAG" && gf.isComplete) {
              const pos = current.positions[gf.indices[0]];
              const isDragging = dragState?.gfIndex === i;
              return (
                <div
                  key={`gf-drag-${i}`}
                  className={`counting__ten-bundle ${
                    isDragging ? "counting__ten-bundle--dragging" : ""
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) ${
                      isDragging
                        ? `translate(${(dragState.currentX - dragState.startX) / dragState.zoom}px, ${(dragState.currentY - dragState.startY) / dragState.zoom}px) scale(1.05)`
                        : ""
                    }`,
                    zIndex: isDragging ? 100 : 3,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDragState({
                      gfIndex: i,
                      startX: e.clientX,
                      startY: e.clientY,
                      currentX: e.clientX,
                      currentY: e.clientY,
                      zoom: parseFloat(document.body.style.getPropertyValue("--zoom") || "1"),
                    });
                  }}
                >
                  <img
                    src={current.imageUrl}
                    alt={current.objectLabel}
                    className="counting__ten-bundle-icon"
                  />
                  <span className="counting__ten-bundle-label">10</span>
                </div>
              );
            }

            // Para DRAG con unidades sueltas (gf.isComplete = false):
            // No renderizamos bounding box, los objetos individuales se arrastran como grupo
            if (current.interactionType === "DRAG" && !gf.isComplete) {
              // Usamos el primer objeto como manejador de arrastre visual
              const isDragging = dragState?.gfIndex === i;
              // Calculamos el bbox para posicionarlo
              let minX = 100,
                maxX = 0,
                minY = 100,
                maxY = 0;
              gf.indices.forEach((idx) => {
                const p = current.positions[idx];
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
              });
              return (
                <div
                  key={`gf-units-${i}`}
                  className={`counting__group-frame counting__group-frame--partial counting__group-frame--draggable ${
                    isDragging ? "counting__group-frame--dragging" : ""
                  }`}
                  style={{
                    left: `${Math.max(0, minX - 3)}%`,
                    top: `${Math.max(0, minY - 4)}%`,
                    width: `${Math.min(100, maxX - minX + 6)}%`,
                    height: `${Math.min(100, maxY - minY + 8)}%`,
                    transform: isDragging
                      ? `translate(${(dragState.currentX - dragState.startX) / dragState.zoom}px, ${(dragState.currentY - dragState.startY) / dragState.zoom}px) scale(0.95)`
                      : "none",
                    zIndex: isDragging ? 100 : 3,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDragState({
                      gfIndex: i,
                      startX: e.clientX,
                      startY: e.clientY,
                      currentX: e.clientX,
                      currentY: e.clientY,
                      zoom: parseFloat(document.body.style.getPropertyValue("--zoom") || "1"),
                    });
                  }}
                />
              );
            }

            // --- Caso genérico GROUP: bounding box invisible sobre los objetos ---
            // Calculate bounding box in %
            let minX = 100,
              maxX = 0,
              minY = 100,
              maxY = 0;
            gf.indices.forEach((idx) => {
              const p = current.positions[idx];
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            });
            const paddingX = 2;
            const paddingY = 3;

            const isDraggable = current.interactionType === "GROUP" && gf.isComplete;
            const isDragging = dragState?.gfIndex === i;

            return (
              <div
                key={`gf-${i}`}
                className={`counting__group-frame ${gf.isComplete ? "counting__group-frame--complete" : "counting__group-frame--partial"} ${isDraggable ? "counting__group-frame--draggable" : ""} ${isDragging ? "counting__group-frame--dragging" : ""}`}
                style={{
                  left: `${Math.max(0, minX - paddingX)}%`,
                  top: `${Math.max(0, minY - paddingY)}%`,
                  width: `${Math.min(100, maxX - minX + paddingX * 2)}%`,
                  height: `${Math.min(100, maxY - minY + paddingY * 2)}%`,
                  transform: isDragging
                    ? `translate(${(dragState.currentX - dragState.startX) / dragState.zoom}px, ${(dragState.currentY - dragState.startY) / dragState.zoom}px) scale(0.95)`
                    : "none",
                  zIndex: isDragging ? 100 : isDraggable ? 3 : 1,
                  pointerEvents: isDraggable ? "auto" : "none",
                }}
                onPointerDown={(e) => {
                  if (!isDraggable) return;
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setDragState({
                    gfIndex: i,
                    startX: e.clientX,
                    startY: e.clientY,
                    currentX: e.clientX,
                    currentY: e.clientY,
                    zoom: parseFloat(document.body.style.getPropertyValue("--zoom") || "1"),
                  });
                }}
              >
                {gf.size >= 10 && arrangement === "packages" && (
                  <div className="counting__group-label">{gf.size}</div>
                )}
              </div>
            );
          })}

          {/* Zona de contenedores para GROUP mechanic */}
          {current.interactionType === "GROUP" && (
            <div className="counting__containers-zone">
              {Array.from({ length: numCompleteGroups }).map((_, i) => {
                const isFilled = (session.filledContainerIndices || []).includes(i);
                return (
                  <div
                    key={`container-${i}`}
                    className={`counting__ten-container ${isFilled ? "counting__ten-container--filled" : ""}`}
                    data-container-index={i}
                    data-is-filled={isFilled}
                  >
                    {isFilled && <span className="counting__ten-container-value">10</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="counting__objects" aria-label={`${current.count} objetos`}>
            {/* ... objects rendered here ... */}
            {current.positions.map((pos, i) => {
              const isTouched = session.touchedIndices.includes(i);
              const isInteractive = current.interactionType === "TOUCH";

              // En GROUP, ocultamos los objetos que pertenecen a grupos ya arrastrados
              const belongsToFilledGroup =
                (current.interactionType === "GROUP" || current.interactionType === "DRAG") &&
                current.groupFrames?.some(
                  (gf, gfIdx) =>
                    gf.indices.includes(i) && session.filledGroupIndices.includes(gfIdx),
                );

              if (belongsToFilledGroup) return null;

              if (
                (arrangement === "packages" ||
                  arrangement === "matrix-grid" ||
                  arrangement === "bundles-tens-units") &&
                pos.value
              ) {
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
                      <img
                        src={current.imageUrl}
                        alt={current.objectLabel}
                        className="counting__package-icon"
                      />
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
          {/* ── Caja flotante de escritura (FILL_TABLE canvas mode) ─────── */}
          {current.interactionType === "FILL_TABLE" &&
            mode !== "numpad" &&
            currentStep?.answerType !== "COMPOSE_NUMBER" && (
              <div
                className={`counting__ft-float ${
                  currentStep.answerType === "COUNT_UNITS"
                    ? "counting__ft-float--left"
                    : "counting__ft-float--right"
                } ${
                  session.answerState !== "idle" ? `counting__ft-float--${session.answerState}` : ""
                }`}
              >
                <div className="counting__ft-float-label">
                  {currentStep.answerType === "COUNT_HUNDREDS"
                    ? "C"
                    : currentStep.answerType === "COUNT_TENS"
                      ? "D"
                      : "U"}
                </div>
                <LazyDigitCell
                  key={`ft-${session.currentStepIndex}-${
                    canvasKeys[
                      currentStep.answerType === "COUNT_HUNDREDS"
                        ? "hundreds"
                        : currentStep.answerType === "COUNT_TENS"
                          ? "tens"
                          : "units"
                    ]
                  }`}
                  isActive={session.answerState === "idle"}
                  onActivate={() => {}}
                  onConfirm={(digit) => {
                    const field =
                      currentStep.answerType === "COUNT_HUNDREDS"
                        ? "hundreds"
                        : currentStep.answerType === "COUNT_TENS"
                          ? "tens"
                          : "units";
                    setSession((s) => ({
                      ...s,
                      posTableInput: { ...s.posTableInput, [field]: digit },
                    }));
                    handleAnswer(parseInt(digit, 10));
                  }}
                  onClear={() => {
                    const field =
                      currentStep.answerType === "COUNT_HUNDREDS"
                        ? "hundreds"
                        : currentStep.answerType === "COUNT_TENS"
                          ? "tens"
                          : "units";
                    setSession((s) => ({
                      ...s,
                      posTableInput: { ...s.posTableInput, [field]: "" },
                    }));
                  }}
                  state={
                    session.answerState === "idle"
                      ? "idle"
                      : session.answerState === "correct"
                        ? "correct"
                        : "wrong"
                  }
                  value={
                    currentStep.answerType === "COUNT_HUNDREDS"
                      ? session.posTableInput.hundreds || ""
                      : currentStep.answerType === "COUNT_TENS"
                        ? session.posTableInput.tens
                        : session.posTableInput.units
                  }
                />
              </div>
            )}

          {/* ── Numpad flotante: derecha para decenas, izquierda para unidades ── */}
          {current.interactionType === "FILL_TABLE" &&
            mode === "numpad" &&
            currentStep?.answerType !== "COMPOSE_NUMBER" && (
              <div
                className={`counting__ft-numpad-float ${
                  currentStep.answerType === "COUNT_UNITS"
                    ? "counting__ft-numpad-float--left"
                    : "counting__ft-numpad-float--right"
                } ${
                  session.answerState !== "idle"
                    ? `counting__ft-numpad-float--${session.answerState}`
                    : ""
                }`}
              >
                <Numpad
                  layout="grid"
                  onDigit={(d) => {
                    if (session.answerState !== "idle" || !resolvedActiveCell) return;
                    setSession((s) => ({
                      ...s,
                      posTableInput: { ...s.posTableInput, [resolvedActiveCell]: d },
                    }));
                  }}
                  onDelete={() => {
                    if (session.answerState !== "idle" || !resolvedActiveCell) return;
                    setSession((s) => ({
                      ...s,
                      posTableInput: { ...s.posTableInput, [resolvedActiveCell]: "" },
                    }));
                  }}
                  onConfirm={submitTableAnswer}
                  disabled={session.answerState !== "idle"}
                />
              </div>
            )}
        </div>

        {current.interactionType === "FILL_TABLE" ? (
          /* ── FILL_TABLE: faldón secuencial con badges ─────────────────── */
          <footer className="counting__footer counting__ft-footer">
            {/* Pregunta a la izquierda */}
            <div className="counting__ft-question">
              <p className="counting__question">{currentStep?.prompt}</p>
            </div>

            {/* Badges confirmados de pasos anteriores + paso actual si es correct */}
            <div className="counting__ft-badges">
              {current.steps.slice(0, session.currentStepIndex).map((step, i) => {
                const label =
                  step.answerType === "COUNT_HUNDREDS"
                    ? "C"
                    : step.answerType === "COUNT_TENS"
                      ? "D"
                      : step.answerType === "COUNT_UNITS"
                        ? "U"
                        : "N";
                return (
                  <div
                    key={i}
                    className={`counting__ft-badge counting__ft-badge--${label.toLowerCase()}`}
                  >
                    <span className="counting__ft-badge-label">{label}</span>
                    <span className="counting__ft-badge-num">{step.correctAnswer}</span>
                  </div>
                );
              })}

              {session.answerState === "correct" &&
                currentStep?.answerType !== "COMPOSE_NUMBER" &&
                (() => {
                  const label =
                    currentStep?.answerType === "COUNT_HUNDREDS"
                      ? "C"
                      : currentStep?.answerType === "COUNT_TENS"
                        ? "D"
                        : currentStep?.answerType === "COUNT_UNITS"
                          ? "U"
                          : "N";
                  return (
                    <div
                      className={`counting__ft-badge counting__ft-badge--${label.toLowerCase()} counting__ft-badge--appear`}
                    >
                      <span className="counting__ft-badge-label">{label}</span>
                      <span className="counting__ft-badge-num">{currentStep?.correctAnswer}</span>
                    </div>
                  );
                })()}

              {currentStep?.answerType === "COMPOSE_NUMBER" &&
                session.answerState === "correct" && (
                  <div className="counting__ft-badge counting__ft-badge--total counting__ft-badge--appear">
                    <span className="counting__ft-badge-label">=</span>
                    <span className="counting__ft-badge-num">{currentStep.correctAnswer}</span>
                  </div>
                )}
            </div>

            {/* Panel numpad (solo en modo numpad, no durante COMPOSE_NUMBER) */}
            {mode === "numpad" && currentStep?.answerType !== "COMPOSE_NUMBER" && (
              <div className="counting__ft-numpad-panel">
                <div className="counting__ft-numcells">
                  {current.steps
                    .filter((s) => s.answerType !== "COMPOSE_NUMBER")
                    .map((step, i) => {
                      const label =
                        step.answerType === "COUNT_HUNDREDS"
                          ? "C"
                          : step.answerType === "COUNT_TENS"
                            ? "D"
                            : step.answerType === "COUNT_UNITS"
                              ? "U"
                              : "N";
                      const field =
                        step.answerType === "COUNT_HUNDREDS"
                          ? "hundreds"
                          : step.answerType === "COUNT_TENS"
                            ? "tens"
                            : "units";
                      const isConfirmed = i < session.currentStepIndex;
                      const isCurrent = i === session.currentStepIndex;
                      return (
                        <div
                          key={i}
                          className={`counting__ft-numcell counting__ft-numcell--${label.toLowerCase()} ${
                            isCurrent && resolvedActiveCell === field
                              ? "counting__ft-numcell--active"
                              : ""
                          }`}
                          onClick={() => {
                            if (session.answerState === "idle" && isCurrent)
                              setActiveInputCell(field as "hundreds" | "tens" | "units");
                          }}
                        >
                          <span className="counting__ft-numcell-label">{label}</span>
                          <span className="counting__ft-numcell-val">
                            {isConfirmed
                              ? step.correctAnswer
                              : session.posTableInput[
                                  field as keyof typeof session.posTableInput
                                ] || "?"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Botón "Siguiente" tras completar el total */}
            {session.answerState === "correct" && currentStep?.answerType === "COMPOSE_NUMBER" && (
              <button className="counting__ft-next-btn" onClick={handleNext}>
                Siguiente →
              </button>
            )}

            {/* Botones de error */}
            {session.answerState === "wrong" && (
              <ActionButtons onRetry={handleRetry} onNext={handleNext} />
            )}
          </footer>
        ) : (
          /* ── Otros modos: faldón original ───────────────────────────── */
          <footer className="counting__footer">
            {current.interactionType === "TOUCH" && !allTouched && (
              <p className="counting__instruction">Toca todos los objetos contando en voz alta.</p>
            )}
            {current.interactionType === "GROUP" && !allTouched && (
              <p className="counting__instruction">
                Arrastra las decenas completas a los contenedores.
              </p>
            )}
            {current.interactionType === "DRAG" && !allTouched && (
              <p className="counting__instruction">Arrastra las decenas y unidades a su columna.</p>
            )}

            <div
              className="counting__steps-container"
              style={{ pointerEvents: allTouched ? "auto" : "none" }}
            >
              {visibleSteps.map((step, idx) => {
                const isCurrentStep = idx === visibleSteps.length - 1;
                return (
                  <div
                    key={idx}
                    className={`counting__step ${
                      isCurrentStep ? "counting__step--active" : "counting__step--past"
                    }`}
                  >
                    <p className="counting__question">{step.prompt}</p>
                    <div className="counting__options" style={{ opacity: allTouched ? 1 : 0.5 }}>
                      {isCurrentStep ? (
                        step.options.map((option) => {
                          const isSelected = session.selectedOption === option;
                          const isOptionCorrect = option === step.correctAnswer;
                          let btnClass = "counting__option";
                          if (session.answerState === "correct" && isOptionCorrect)
                            btnClass += " counting__option--correct";
                          else if (session.answerState === "wrong" && isSelected)
                            btnClass += " counting__option--wrong";
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
        )}
      </div>
    </div>
  );
}
