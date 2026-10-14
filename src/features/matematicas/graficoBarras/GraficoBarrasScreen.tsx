import { useCallback, useEffect, useState } from "react";
import {
  esBarraHueca,
  generateSession,
  validateAnswer,
} from "../../../core/activities/graficoBarras";
import type { GraficoBarrasExercise } from "../../../core/activities/graficoBarras";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import "../operations/OperationsScreen.css";
import "./GraficoBarrasScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/**
 * Cuánto se tarda en pasar de exercise al siguiente. Es más que en
 * `dobleYMitad` porque aquí hay que mirar el gráfico entero antes de decidir.
 */
const AUTOAVANCE_MS = 1100;

/** Un color por barra, en el orden en que se pintan. */
const COLORES = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"] as const;

interface SessionState {
  exercises: GraficoBarrasExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Opción pulsada, para pintarla. `null` mientras no se ha contestado. */
  selected: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/**
 * Una barra del gráfico.
 *
 * La altura sale de `valor / escalaMax`, con `escalaMax` del nivel y no del
 * ejercicio: es la corrección que pedía el eje, y además la que hace que el
 * niño pueda aprender que en este nivel la barra más alta siempre es la misma.
 *
 * La rejilla y las barras se miden en la misma caja (`.gb__zona`), así que la
 * línea de la marca y el borde superior de la barra no pueden separarse: en el
 * original, las marcas se posicionaban con `bottom: 20 + pct * 1.6` y las barras
 * con `valor / maxVal * 140`, dos fórmulas distintas para la misma altura.
 */
function Columna({
  barra,
  escalaMax,
  hueco,
  color,
}: {
  barra: GraficoBarrasExercise["bars"][number];
  escalaMax: number;
  hueco: boolean;
  color: string;
}) {
  const altura = `${(barra.valor / escalaMax) * 100}%`;
  return (
    <div
      className={`gb__columna${hueco ? " gb__columna--hueco" : ""}`}
      data-etiqueta={barra.etiqueta}
    >
      <div className="gb__zona">
        <span
          className={`gb__valor${hueco ? " gb__valor--hueco" : ""}`}
          data-valor={hueco ? "" : barra.valor}
        >
          {hueco ? "?" : barra.valor}
        </span>
        <div
          className={`gb__barra${hueco ? " gb__barra--hueca" : ""}`}
          style={{ height: altura, background: hueco ? undefined : color }}
          data-hueco={hueco ? "true" : undefined}
        />
      </div>
      <div className="gb__pie">
        <span className="gb__emoji" aria-hidden="true">
          {barra.emoji}
        </span>
        <span className="gb__etiqueta">{barra.etiqueta}</span>
      </div>
    </div>
  );
}

/** El gráfico: gutter del eje, rejilla de marcas y las columnas. */
function Grafico({ exercise }: { exercise: GraficoBarrasExercise }) {
  const { marcas, escalaMax, bars } = exercise;
  const alturaMarca = (marca: number) => `${(marca / escalaMax) * 100}%`;

  return (
    <div className="gb__grafico">
      <div className="gb__marcas" aria-hidden="true">
        {marcas.map((marca) => (
          <span key={marca} className="gb__marca" style={{ bottom: alturaMarca(marca) }}>
            {marca}
          </span>
        ))}
      </div>

      <div className="gb__lienzo">
        <div className="gb__rejilla" aria-hidden="true">
          {marcas.map((marca) => (
            <div key={marca} className="gb__linea" style={{ bottom: alturaMarca(marca) }} />
          ))}
        </div>

        {bars.map((barra, i) => (
          <Columna
            key={barra.etiqueta}
            barra={barra}
            escalaMax={escalaMax}
            hueco={esBarraHueca(exercise, i)}
            color={COLORES[i % COLORES.length]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * "Leemos el gráfico" — gráficos de barras.
 *
 * El enunciado y los datos salen del núcleo, que es donde están anotadas las
 * diferencias con el renderer de Electron. Aquí se compone: gráfico con eje
 * coherente con las alturas, cuatro opciones y el resumen de la sesión.
 *
 * Respuesta por cuatro botones, sin numpad: el enunciado siempre trae las
 * opciones, así que escribir sería un rodeo.
 */
export function GraficoBarrasScreen({
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
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const handleAnswer = useCallback(
    (value: string) => {
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

  // Al acertar se pasa solo; al fallar no, porque el niño tiene que decidir si
  // reintenta o sigue con el botón.
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      // La misma semilla: "Repetir" da la misma hoja, no una tirada nueva.
      exercises: generateSession(difficulty, sessionSeed),
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

  return (
    <div className={`ops gb ${className ?? ""}`}>
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
          <div className="ops__celebration">¡Correcto! 📊⭐</div>
        )}

        <p className="gb__enunciado">{current.question}</p>

        <Grafico exercise={current} />

        <div className="gb__opciones">
          {current.options.map((opt) => {
            const clase =
              session.answerState === "correct" && opt === current.correctAnswer
                ? " gb__opcion--correcta"
                : session.answerState === "wrong" && opt === session.selected
                  ? " gb__opcion--fallada"
                  : "";
            return (
              <button
                key={opt}
                type="button"
                data-value={opt}
                className={`gb__opcion${clase}`}
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
