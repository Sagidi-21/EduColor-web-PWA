import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateSession,
  validateAnswer,
  type Direction,
  type RutaCuadriculaExercise,
} from "../../../core/activities/rutaCuadricula";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./RutaCuadriculaScreen.css";

const DIR_SYMBOLS: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

/** Duración de cada paso de la animación del avatar. */
const PASO_MS = 400;
/** Tiempo que se muestra el feedback de acierto antes de avanzar. */
const AUTOAVANCE_MS = 1200;

type AnswerState = "idle" | "playing" | "correct" | "wrong";

interface SessionState {
  exercises: RutaCuadriculaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  sequence: Direction[];
  avatarPos: { x: number; y: number };
  alreadyFailed: boolean;
}

function freshSession(seed: number, difficulty: EngineScreenProps["difficulty"]): SessionState {
  const exercises = generateSession(difficulty, seed);
  return {
    exercises,
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    sequence: [],
    avatarPos: { ...exercises[0].start },
    alreadyFailed: false,
  };
}

export function RutaCuadriculaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const [sessionSeed] = useState(seed);
  const [session, setSession] = useState<SessionState>(() => freshSession(sessionSeed, difficulty));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  // Referencia a la sesión en curso para que la animación (que se dispara por
  // setTimeouts encadenados) lea siempre los valores de la partida en la que
  // se pulsó " reproducir ", no los de rendus que ocurren entre tiempo.
  const playCtxRef = useRef<{ ex: RutaCuadriculaExercise; seq: Direction[] } | null>(null);

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
        sequence: [],
        avatarPos: { ...session.exercises[next].start },
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  // Auto-advance after correct
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAddDirection = useCallback(
    (dir: Direction) => {
      if (session.answerState !== "idle") return;
      setSession((s) => ({ ...s, sequence: [...s.sequence, dir] }));
    },
    [session.answerState],
  );

  const handleDelete = useCallback(() => {
    if (session.answerState !== "idle") return;
    setSession((s) => ({ ...s, sequence: s.sequence.slice(0, -1) }));
  }, [session.answerState]);

  const handleRetry = useCallback(() => {
    if (!current) return;
    setSession((s) => ({
      ...s,
      answerState: "idle",
      sequence: [],
      avatarPos: { ...current.start },
    }));
  }, [current]);

  const handlePlay = useCallback(() => {
    if (session.answerState !== "idle" || session.sequence.length === 0 || !current) return;

    playCtxRef.current = { ex: current, seq: session.sequence };
    setSession((s) => ({ ...s, answerState: "playing" }));

    let step = 0;
    let curX = current.start.x;
    let curY = current.start.y;

    const animate = () => {
      const ctx = playCtxRef.current;
      if (!ctx) return;
      const { ex, seq } = ctx;

      if (step < seq.length) {
        const dir = seq[step];
        if (dir === "up") curY -= 1;
        if (dir === "down") curY += 1;
        if (dir === "left") curX -= 1;
        if (dir === "right") curX += 1;

        setSession((s) => ({ ...s, avatarPos: { x: curX, y: curY } }));
        step++;
        setTimeout(animate, PASO_MS);
      } else {
        // Animación terminada: validar y mostrar resultado.
        const ok = validateAnswer(ex, seq);
        playFeedback(ok);
        setSession((s) => ({
          ...s,
          answerState: ok ? "correct" : "wrong",
          correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
          alreadyFailed: !ok ? true : s.alreadyFailed,
        }));
        playCtxRef.current = null;
      }
    };

    setTimeout(animate, PASO_MS);
  }, [session.answerState, session.sequence, current]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession(freshSession(sessionSeed, difficulty));
  }, [sessionSeed, difficulty]);

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
        : session.answerState === "playing"
          ? "ops__stage--playing"
          : "";

  return (
    <div className={`ops ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        progress={`${session.currentIndex + 1} / ${total}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && <div className="ops__celebration">¡Llegaste! ⭐</div>}

        <div className="rutac__container" role="group" aria-label="Tablero de la ruta">
          <div
            className="rutac__grid"
            style={{ gridTemplateColumns: `repeat(${current.gridSize.cols}, 50px)` }}
          >
            {Array.from({ length: current.gridSize.rows * current.gridSize.cols }).map((_, i) => {
              const x = i % current.gridSize.cols;
              const y = Math.floor(i / current.gridSize.cols);

              const isStart = x === current.start.x && y === current.start.y;
              const isEnd = x === current.end.x && y === current.end.y;
              const isObstacle = current.obstacles.some((o) => o.x === x && o.y === y);

              let cls = "rutac__cell";
              if (isStart) cls += " rutac__cell--start";
              if (isEnd) cls += " rutac__cell--end";

              return (
                <div key={`${x}-${y}`} className={cls}>
                  {isObstacle && (
                    <span className="rutac__obstacle" aria-hidden="true">
                      🌳
                    </span>
                  )}
                  {isEnd && !isObstacle && <span aria-hidden="true">🏫</span>}
                  {session.avatarPos.x === x && session.avatarPos.y === y && (
                    <span className="rutac__avatar" aria-hidden="true">
                      🚶
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rutac__sequence" aria-label="Secuencia de direcciones">
            {session.sequence.length === 0 && (
              <span className="rutac__seq-vacio">Añade flechas…</span>
            )}
            {session.sequence.map((dir, i) => (
              <div key={i} className="rutac__seq-item">
                {DIR_SYMBOLS[dir]}
              </div>
            ))}
          </div>

          <div className="rutac__controls">
            <button
              type="button"
              className="rutac__btn"
              disabled={session.answerState !== "idle"}
              aria-label="Arriba"
              onClick={() => handleAddDirection("up")}
            >
              ↑
            </button>
            <button
              type="button"
              className="rutac__btn"
              disabled={session.answerState !== "idle"}
              aria-label="Abajo"
              onClick={() => handleAddDirection("down")}
            >
              ↓
            </button>
            <button
              type="button"
              className="rutac__btn"
              disabled={session.answerState !== "idle"}
              aria-label="Izquierda"
              onClick={() => handleAddDirection("left")}
            >
              ←
            </button>
            <button
              type="button"
              className="rutac__btn"
              disabled={session.answerState !== "idle"}
              aria-label="Derecha"
              onClick={() => handleAddDirection("right")}
            >
              →
            </button>
            <div style={{ width: "1rem" }} />
            <button
              type="button"
              className="rutac__btn rutac__btn--delete"
              disabled={session.answerState !== "idle" || session.sequence.length === 0}
              aria-label="Borrar última dirección"
              onClick={handleDelete}
            >
              ⌫
            </button>
            <button
              type="button"
              className="rutac__btn rutac__btn--play"
              disabled={session.answerState !== "idle" || session.sequence.length === 0}
              aria-label="Reproducir ruta"
              onClick={handlePlay}
            >
              ▶
            </button>
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
