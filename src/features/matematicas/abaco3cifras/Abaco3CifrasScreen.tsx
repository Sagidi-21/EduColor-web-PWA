import { useCallback, useEffect, useState } from "react";
import {
  decodeOption,
  generateSession,
  validateAnswer,
} from "../../../core/activities/abaco3cifras";
import type { AbacoExercise } from "../../../core/activities/abaco3cifras";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import "./Abaco3CifrasScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: AbacoExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  selectedAnswer: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/** Espera antes de pasar al siguiente ejercicio cuando el alumno acierta. */
const AUTOAVANCE_MS = 900;

/** Bolitas que caben como máximo en una columna de un ábaco decimal. */
const BOLITAS_POR_COLUMNA = 9;

/**
 * Un ábaco de tres columnas.
 *
 * **Por qué la altura se calcula y no es fija.** En Electron el `viewBox` era
 * siempre de 220 unidades de alto y las bolitas se apilaban hacia arriba desde
 * la base. Con nueve bolitas en una columna, la novena caía en `cy = -70`, es
 * decir, por encima del recuadro: el ábaco se recortaba justo en el caso que la
 * actividad pretende enseñar. Aquí el altoNeeded se deriva de las nueve bolitas
 * que caben en la columna, de modo que la barra más llena nunca toca el borde
 * superior. El resto de la geometría es la de Electron.
 */
function AbacoVisual({
  c,
  d,
  u,
  size,
}: {
  c: number;
  d: number;
  u: number;
  size: "full" | "mini";
}): JSX.Element {
  const mini = size === "mini";
  const beadR = mini ? 7 : 14;
  const gap = mini ? 2 : 4;
  const baseH = mini ? 10 : 20;
  const rodW = mini ? 5 : 10;
  const margenSuperior = mini ? 6 : 12;

  const W = mini ? 84 : 168;
  // Alto de la barra: el hueco que ocupa la columna llena del todo.
  const rodH = BOLITAS_POR_COLUMNA * (beadR * 2 + gap);
  const H = margenSuperior + rodH + baseH;
  const rodY = margenSuperior;

  const xs = mini ? [18, 42, 66] : [36, 84, 132];
  const columnas = [c, d, u];
  const colores = ["#06b6d4", "#fbbf24", "#f472b6"];
  const etiquetas = ["C", "D", "U"];

  return (
    <svg
      className="aba__svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Ábaco con ${c} bolitas en las centenas, ${d} en las decenas y ${u} en las unidades`}
    >
      <rect x={2} y={H - baseH} width={W - 4} height={baseH} rx={mini ? 4 : 8} fill="#78350f" />
      {xs.map((x, i) => (
        <rect
          key={`barra-${i}`}
          className="aba__barra"
          x={x - rodW / 2}
          y={rodY}
          width={rodW}
          height={rodH}
          rx={mini ? 2 : 4}
          fill="#92400e"
        />
      ))}
      {columnas.map((cuenta, ci) =>
        Array.from({ length: cuenta }, (_, b) => {
          const cy = H - baseH - beadR - b * (beadR * 2 + gap);
          return (
            <circle
              key={`bolita-${ci}-${b}`}
              className="aba__bolita"
              cx={xs[ci]}
              cy={cy}
              r={beadR}
              fill={colores[ci]}
              stroke="rgba(0,0,0,.25)"
              strokeWidth={1}
            />
          );
        }),
      )}
      {xs.map((x, i) => (
        <text
          key={`rotulo-${i}`}
          x={x}
          y={H - baseH / 2 + (mini ? 3 : 6)}
          textAnchor="middle"
          fontSize={mini ? 8 : 11}
          fontWeight="700"
          fill="#fef3c7"
          letterSpacing=".05em"
        >
          {etiquetas[i]}
        </text>
      ))}
    </svg>
  );
}

/**
 * Migra 1:1 de
 * `electron-reference/Colegio/src/renderer/src/core/engines/abaco3cifras/Abaco3CifrasRenderer.tsx`,
 * con el recorte del ábaco corregido (ver `AbacoVisual`) y estas diferencias
 * deliberadas: la semilla llega por props y "Repetir" la reutiliza en vez de tirar
 * una nueva, el autoavance baja de 1200 ms a los 900 ms unificados, y cabecera,
 * resumen y botones de reintentar son los componentes compartidos.
 */
export function Abaco3CifrasScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(() => seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selectedAnswer: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

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
        selectedAnswer: null,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  const handleRetry = useCallback(() => {
    setSession((s) => ({
      ...s,
      answerState: "idle",
      selectedAnswer: null,
      alreadyFailed: true,
    }));
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current) return;
      const isCorrect = validateAnswer(current, value);
      playFeedback(isCorrect);
      setSession((s) => ({
        ...s,
        answerState: isCorrect ? "correct" : "wrong",
        selectedAnswer: value,
        correctCount: isCorrect && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

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
      selectedAnswer: null,
      alreadyFailed: false,
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
      <div className="aba aba--vacio" role="alert">
        <p className="aba__vacio-texto">No hay ningún ejercicio que mostrar en esta sesión.</p>
        <button type="button" className="aba__btn" onClick={handleRestart}>
          🔄 Generar otra
        </button>
      </div>
    );
  }

  const esFindAbaco = current.type === "find-abaco";

  /** Estado visual de una opción: correcto, fallado o sin tocar. */
  const estado = (opcion: string): "idle" | "correct" | "wrong" => {
    if (session.answerState === "correct" && opcion === current.correctAnswer) return "correct";
    if (session.answerState === "wrong" && opcion === session.selectedAnswer) return "wrong";
    return "idle";
  };

  return (
    <div className={`aba ${className || ""}`}>
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`aba__stage aba__stage--${session.answerState}`}>
        {session.answerState === "correct" && <div className="aba__cheer">¡Correcto! ⭐</div>}

        <p className="aba__question">{current.question}</p>

        {/* En `read-abaco` y `valor-posicional` se enseña el ábaco; en
            `find-abaco` se enseña el número y los ábacos son las opciones. */}
        {!esFindAbaco && (
          <div className="aba__abacus">
            <AbacoVisual
              c={current.centenas}
              d={current.decenas}
              u={current.unidades}
              size="full"
            />
          </div>
        )}

        {esFindAbaco && <div className="aba__number-badge">{current.number}</div>}

        <div className="aba__options">
          {current.options.map((opcion) => {
            const clase = `aba__opt aba__opt--${estado(opcion)}`;
            if (!esFindAbaco) {
              return (
                <button
                  key={opcion}
                  type="button"
                  id={`aba-opt-${opcion}`}
                  data-value={opcion}
                  className={clase}
                  onClick={() => handleAnswer(opcion)}
                  disabled={session.answerState !== "idle"}
                >
                  {opcion}
                </button>
              );
            }
            const { c, d, u } = decodeOption(opcion);
            return (
              <button
                key={opcion}
                type="button"
                className={`${clase} aba__opt--abaco`}
                onClick={() => handleAnswer(opcion)}
                disabled={session.answerState !== "idle"}
              >
                <AbacoVisual c={c} d={d} u={u} size="mini" />
              </button>
            );
          })}
        </div>

        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </div>
    </div>
  );
}
