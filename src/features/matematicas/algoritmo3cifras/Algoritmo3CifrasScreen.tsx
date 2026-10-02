import { useCallback, useEffect, useState } from "react";
import {
  CARRY_SLOTS,
  generateSession,
  validateDigits,
} from "../../../core/activities/algoritmo3cifras";
import type { Algoritmo3Exercise } from "../../../core/activities/algoritmo3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { ColumnCarryOperation } from "../components/ColumnCarryOperation";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./Algoritmo3CifrasScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: Algoritmo3Exercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
  /**
   * Número de intento dentro del ejercicio actual.
   *
   * Es lo único que limpia la operación, junto al índice del ejercicio. El
   * veredicto no puede formar parte de la limpieza: si se borrara la operación
   * al comprobar, el niño vería desaparecer lo que acaba de escribir.
   */
  attempt: number;
}

/** Espera antes de pasar al siguiente ejercicio cuando el alumno acierta. */
const AUTOAVANCE_MS = 900;

/**
 * "Algoritmo de tres cifras".
 *
 * La aritmética es la de `electron-reference/Colegio/src/renderer/src/core/engines/algoritmo3cifras/`,
 * pero la respuesta ya no se elige entre cuatro opciones: se escribe, casilla a
 * casilla, y se comprueba **una sola vez** contra el resultado entero, sin decir
 * en qué cifra se ha equivocado. Es una decisión del profesorado (2026-10-02),
 * y la mecánica entera vive en el componente compartido `ColumnCarryOperation`,
 * para que cualquier ejercicio de cálculo encolumnado de cursos posteriores la
 * reutilice sin volver a escribirla.
 *
 * Esta pantalla solo compone: cabecera, la operación compartida, el resumen y
 * los botones de reintentar o pasar. Lo único que decide es si el ejercicio se
 * acierta o se falla, y eso lo hace el núcleo con `validateDigits`, sobre las
 * tres cifras enteras.
 */
export function Algoritmo3CifrasScreen({
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
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    alreadyFailed: false,
    attempt: 0,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  /**
   * El momento único de comprobación.
   *
   * No recibe las casillas de llevar: no se corrigen. Solo las tres cifras del
   * resultado, y enteras: si una falla, el ejercicio falla, y no se sabe cuál.
   */
  const comprobar = useCallback(
    (digits: string[]) => {
      if (session.answerState !== "idle" || !current) return;
      const isCorrect = validateDigits(current, digits);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

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
        alreadyFailed: false,
        attempt: 0,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    // Subir el intento es lo que deja la operación limpia: la caja del número
    // anterior no puede quedarse ahí al volver a contestar.
    setSession((s) => ({
      ...s,
      answerState: "idle",
      alreadyFailed: true,
      attempt: s.attempt + 1,
    }));
  }, []);

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
      alreadyFailed: false,
      attempt: 0,
    });
  }, [difficulty, sessionSeed]);

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

  // La sesión siempre trae ejercicios, pero un `render` sin ellos dejaría la
  // pantalla en blanco sin explicación. Se muestra el motivo y la salida.
  if (!current) {
    return (
      <div className="a3c a3c--vacio" role="alert">
        <p className="a3c__vacio-texto">No hay ningún ejercicio que mostrar en esta sesión.</p>
        <button type="button" className="a3c__btn" onClick={handleRestart}>
          🔄 Generar otra
        </button>
      </div>
    );
  }

  return (
    <div className={`a3c ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={`a3c__stage a3c__stage--${session.answerState}`}>
        {session.answerState === "correct" && <div className="a3c__cheer">¡Correcto! ⭐</div>}

        <p className="a3c__question">{current.question}</p>

        <ColumnCarryOperation
          op={current.op}
          aDigits={[String(current.aC), String(current.aD), String(current.aU)]}
          bDigits={[String(current.bC), String(current.bD), String(current.bU)]}
          carrySlots={CARRY_SLOTS}
          carryLabel={current.op === "+" ? "llevar" : "prestar"}
          mode={mode}
          verdict={session.answerState}
          // Identifica el intento, y con él lo que hay que limpiar de la
          // operación: cambia al pasar de ejercicio y al reintentar, pero **no**
          // al dar el veredicto. Si el veredicto fuera parte del token, la
          // operación se borraría en cuanto se pulsara comprobar y el niño
          // perdería lo que acaba de escribir justo cuando más le sirve verlo.
          resetToken={`${session.currentIndex}-${session.attempt}`}
          onCheck={comprobar}
        />

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
