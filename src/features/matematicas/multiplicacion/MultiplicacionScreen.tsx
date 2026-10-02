import { useCallback, useEffect, useState } from "react";
import {
  generateChoiceSession,
  generateMatchSession,
  generateSession,
  validateAnswer,
} from "../../../core/activities/multiplicacion";
import type {
  MatchPair,
  MatchSession,
  MultiplicacionExercise,
  MultiplicacionSession,
} from "../../../core/activities/multiplicacion";
import type { EngineScreenProps } from "../engine-screens";
import { MatchColumns, type MatchReport } from "../components/MatchColumns";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./MultiplicacionScreen.css";

/**
 * "Multiplicamos" (2.º de Primaria).
 *
 * La aritmética es la de
 * `electron-reference/Colegio/src/renderer/src/core/engines/multiplicacion/`, y
 * las diferencias están todas anotadas en el núcleo. Aquí se compone.
 *
 * Los niveles bajos llegan como una unión y los altos como una tanda de
 * ejercicios, así que el `mode` decide qué mitad de la pantalla se monta. El
 * reparto no es arbitrario: en `easy` y `medium` se ve la tabla entera, que es
 * como se aprende en la pizarra, y en `hard` y `expert` ya se eluden turno a
 * turno, que es lo único que puede pedirse cuando la tabla ya está automatizada.
 */
export function MultiplicacionScreen(props: EngineScreenProps) {
  const { difficulty, seed } = props;
  const [session] = useState<MultiplicacionSession>(() => generateSession(difficulty, seed));
  /** Semilla de la tanda: "Repetir" la reutiliza para dar la misma hoja. */
  const [sessionSeed] = useState(seed);

  return session.mode === "match" ? (
    <MatchMode {...props} sesion={session} sessionSeed={sessionSeed} />
  ) : (
    <ChoiceMode {...props} sesion={session.exercises} sessionSeed={sessionSeed} />
  );
}

/** Cómo se le pasa una semilla a la parte que rehace la hoja al repetir. */
interface ModoProps extends EngineScreenProps {
  sessionSeed: number;
}

function MatchMode(props: ModoProps & { sesion: MatchSession }) {
  const { activity, onExit, gradeTitle, className, mascotUrl, difficultyStars } = props;
  const { sesion, sessionSeed, difficulty } = props;
  const [regenerado, setRegenerado] = useState(() => sesion);
  /**
   * Cuántas veces se ha repetido, para que la hoja se remonten.
   *
   * El `key` del emparejador no puede basta con los `id` de las parejas: al
   * repetir se regenera la hoja con la misma semilla, así que los ids son los
   * mismos y React no lo remontaría. Sin remontar, el emparejador conserva el
   * aviso de "ya completada" y la segunda hoja nunca llegaría al resumen.
   */
  const [repeticiones, setRepeticiones] = useState(0);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [startTime] = useState(() => Date.now());

  const handleComplete = useCallback(
    (report: MatchReport) => {
      setFinished({
        // Una unión solo cuenta si se acertó a la primera. Las falladas parpadean
        // y luego se rehacen, así que contar las unidas daría siempre la nota
        // perfecta.
        correct: report.aciertos,
        total: report.total,
        duration: Date.now() - startTime,
      });
    },
    [startTime],
  );

  const handleRestart = useCallback(() => {
    setFinished(null);
    setRepeticiones((n) => n + 1);
    setRegenerado(generateMatchSession(difficulty, sessionSeed));
  }, [difficulty, sessionSeed]);

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

  return (
    <div className={`mul ${className ?? ""}`}>
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        onExit={onExit}
        className={className}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <main className="mul__main">
        <p className="mul__instruction">
          Toca una operación y luego el producto que le corresponde
        </p>

        <MatchColumns<MatchPair>
          key={`${repeticiones}-${regenerado.pairs.map((p) => p.id).join("-")}`}
          prefix="mul"
          leftClass="mul__item--op"
          rightClass="mul__item--res"
          left={regenerado.leftColumn}
          right={regenerado.rightColumn}
          renderLeft={(pair) => (
            <span className="mul__op">
              {pair.table} × {pair.factor}
            </span>
          )}
          renderRight={(pair) => <span className="mul__res">{pair.product}</span>}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}

function ChoiceMode(props: ModoProps & { sesion: MultiplicacionExercise[] }) {
  const { activity, onExit, gradeTitle, className, mascotUrl, difficultyStars } = props;
  const { sesion, sessionSeed, difficulty } = props;

  const [session, setSession] = useState(() => ({
    exercises: sesion,
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle" as "idle" | "correct" | "wrong",
    selected: null as number | null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleAnswer = useCallback(
    (value: number) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, value);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selected: value,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRetry = useCallback(() => {
    setSession((s) => ({ ...s, answerState: "idle", selected: null, alreadyFailed: true }));
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
        selected: null,
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  // Al acertar se pasa solo al siguiente; al fallar no, porque el niño tiene que
  // decidir si reintenta o sigue con el botón.
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, 900);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateChoiceSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selected: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

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

  // Los grupos de puntos solo cuando son manejables: en `expert` llegan a
  // 10 grupos de 10, que no caben en una tarjeta.
  const showGroups = current.type === "product" && current.a <= 10 && current.b <= 10;
  // La pista solo si no regala la respuesta. En `count-groups` el enunciado ya
  // dice cuántos grupos hay y cuántos objetos, así que dividirlo sería la respuesta.
  const showPista = current.type === "product";

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
        {session.answerState === "correct" && <div className="ops__celebration">¡Correcto! ⭐</div>}

        <p className="mul__equation">{current.question}</p>

        {showGroups && (
          <div className="mul__groups" aria-hidden="true">
            {Array.from({ length: current.a }).map((_, g) => (
              <div key={`grupo-${g}`} className="mul__group">
                {Array.from({ length: current.b }).map((_, d) => (
                  <span key={`punto-${g}-${d}`} className="mul__dot" />
                ))}
              </div>
            ))}
          </div>
        )}

        {showPista && <p className="mul__pista">Piensa en la tabla del {current.table}</p>}

        <div className="mul__options">
          {current.options.map((opt) => {
            const elegida = session.selected === opt;
            const clase =
              session.answerState === "correct" && opt === current.correctAnswer
                ? " mul__opt--correct"
                : session.answerState === "wrong" && elegida
                  ? " mul__opt--wrong"
                  : "";
            return (
              <button
                key={opt}
                type="button"
                data-value={opt}
                className={`mul__opt${clase}`}
                disabled={session.answerState !== "idle"}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            );
          })}
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
