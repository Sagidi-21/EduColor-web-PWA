import { useCallback, useEffect, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/reloj";
import type { RelojExercise } from "../../../core/activities/reloj";
// La hora en palabras viene del módulo compartido, no de `reloj`, que ya no la re-exporta.
import { timeLabel } from "../../../core/activities/shared/timeLabel";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../operations/OperationsScreen.css";
import "./RelojScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: RelojExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Valor de la opción pulsada. */
  selectedOption: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/**
 * Retardo con el que se pasa al siguiente ejercicio tras acertar.
 *
 * Son 900 ms, y no los 1300 ms que usaba el renderer de Electron: el profesor
 * los unificó con el resto de actividades de la PWA. Si alguna vez vuelve a
 * aparecer un 1300 aquí, no es un arreglo: es un retroceso a Electron.
 */
const AUTOAVANCE_MS = 900;

/**
 * Diámetro en px de las esferas de las opciones de `digital_to_analog`.
 *
 * No confundir con el reloj grande del enunciado, que va en `.reloj__analog` y
 * son 180 px dimensionados por CSS. Este tamaño es un atributo del propio SVG
 * de la opción, porque cada opción lleva el suyo.
 */
const OPTION_CLOCK_SIZE_PX = 96;

// ── Relojes ─────────────────────────────────────────────────────────────────

/** Esfera analógica del enunciado, con las 12 marcas y los 12 números. */
function AnalogClock({ hours, minutes }: { hours: number; minutes: number }) {
  const cx = 90,
    cy = 90,
    r = 82;

  // Aguja de horas: 360/12 = 30° por hora + 0.5° por minuto.
  const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
  const minAngle = minutes * 6 - 90;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const hx = cx + 38 * Math.cos(toRad(hourAngle));
  const hy = cy + 38 * Math.sin(toRad(hourAngle));
  const mx = cx + 72 * Math.cos(toRad(minAngle));
  const my = cy + 72 * Math.sin(toRad(minAngle));

  const markers = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    const x1 = cx + 70 * Math.cos(a),
      y1 = cy + 70 * Math.sin(a);
    const x2 = cx + 80 * Math.cos(a),
      y2 = cy + 80 * Math.sin(a);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={i % 3 === 0 ? 3 : 1.5}
      />
    );
  });

  const nums = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i;
    const a = ((i * 30 - 90) * Math.PI) / 180;
    const nx = cx + 56 * Math.cos(a),
      ny = cy + 56 * Math.sin(a);
    const isMain = i % 3 === 0;
    return (
      <text
        key={n}
        x={nx}
        y={ny}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={isMain ? "14" : "11"}
        fontWeight="bold"
        opacity={isMain ? "1" : "0.8"}
      >
        {n}
      </text>
    );
  });

  return (
    <svg
      className="reloj__clock-svg"
      viewBox="0 0 180 180"
      role="img"
      aria-label={`Reloj de agujas marcando las ${hours}`}
    >
      <circle cx={cx} cy={cy} r={r} fill="#1e1b4b" stroke="rgba(167,139,250,0.5)" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={r - 2}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      {markers}
      {nums}
      <line
        x1={cx}
        y1={cy}
        x2={mx}
        y2={my}
        stroke="#a78bfa"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="white" strokeWidth="5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#a78bfa" />
    </svg>
  );
}

/** Cuatro relojes en miniatura: las opciones de `digital_to_analog`. */
function MiniAnalogClock({ value }: { value: string }) {
  const [oh, om] = value.split(":").map(Number);
  const cx = 90;
  const cy = 90;
  const hourA = ((oh % 12) + om / 60) * 30 - 90;
  const minA = om * 6 - 90;
  const tr = (d: number) => (d * Math.PI) / 180;
  const hx = cx + 45 * Math.cos(tr(hourA));
  const hy = cy + 45 * Math.sin(tr(hourA));
  const mx = cx + 68 * Math.cos(tr(minA));
  const my = cy + 68 * Math.sin(tr(minA));

  return (
    <svg
      width={OPTION_CLOCK_SIZE_PX}
      height={OPTION_CLOCK_SIZE_PX}
      viewBox="0 0 180 180"
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cy}
        r={82}
        fill="#1e1b4b"
        stroke="rgba(167,139,250,0.4)"
        strokeWidth="4"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + 70 * Math.cos(a)}
            y1={cy + 70 * Math.sin(a)}
            x2={cx + 80 * Math.cos(a)}
            y2={cy + 80 * Math.sin(a)}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
          />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={mx}
        y2={my}
        stroke="#a78bfa"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="white" strokeWidth="6" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#a78bfa" />
    </svg>
  );
}

function DigitalDisplay({ hours, minutes }: { hours: number; minutes: number }) {
  return (
    <div
      className="reloj__digital-display"
      aria-label={`Reloj digital: ${hours}:${String(minutes).padStart(2, "0")}`}
    >
      {hours}:{String(minutes).padStart(2, "0")}
    </div>
  );
}

// ── Pantalla ────────────────────────────────────────────────────────────────

export function RelojScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, seed),
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
  }, [session, total]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleAnswer = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current) return;
      const ok = validateAnswer(current, value);
      playFeedback(ok);
      setSession((s) => ({
        ...s,
        answerState: ok ? "correct" : "wrong",
        selectedOption: value,
        correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
      }));
    },
    [session.answerState, current],
  );

  const handleRestart = useCallback(() => {
    setFinished(null);
    setSession({
      exercises: generateSession(difficulty, seed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selectedOption: null,
      alreadyFailed: false,
    });
  }, [difficulty, seed]);

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || activity.title}
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
      ? "reloj__stage--correct"
      : session.answerState === "wrong"
        ? "reloj__stage--wrong"
        : "";

  /** `true` cuando las opciones se pintan como relojes y no como texto. */
  const opcionesConReloj = current.type === "digital_to_analog";

  return (
    <div className="reloj">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1} / ${total}`}
      />

      <div className={`reloj__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div className="reloj__celebration">¡Correcto! ⏰⭐</div>
        )}

        <p className="reloj__question">{current.question}</p>

        <div className="reloj__clock-container">
          {/* Esfera analógica para leer un reloj y para las escenas. */}
          {(current.type === "analog_to_digital" || current.type === "match_scene") && (
            <div className="reloj__analog">
              <AnalogClock hours={current.hours} minutes={current.minutes} />
            </div>
          )}
          {/* Display digital para traducir a agujas y para leer en voz alta. */}
          {(current.type === "digital_to_analog" || current.type === "digital_read") && (
            <DigitalDisplay hours={current.hours} minutes={current.minutes} />
          )}
        </div>

        <div className="reloj__options">
          {current.options.map((opt, i) => {
            const isSelected = session.selectedOption === opt.value;
            let cls = "reloj__option";
            if (session.answerState === "correct" && opt.value === current.correctAnswer)
              cls += " reloj__option--correct";
            else if (session.answerState === "wrong" && isSelected) cls += " reloj__option--wrong";
            return (
              <button
                key={opt.value}
                type="button"
                id={`reloj-option-${i}`}
                data-value={opt.value}
                aria-label={
                  opcionesConReloj
                    ? timeLabel(Number(opt.value.split(":")[0]), Number(opt.value.split(":")[1]))
                    : undefined
                }
                className={cls}
                onClick={() => handleAnswer(opt.value)}
                disabled={session.answerState !== "idle"}
              >
                {opcionesConReloj ? <MiniAnalogClock value={opt.value} /> : opt.label}
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
