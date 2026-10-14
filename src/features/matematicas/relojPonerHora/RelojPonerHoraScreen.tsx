import { useCallback, useEffect, useRef, useState } from "react";
import { generateSession, validateAnswer } from "../../../core/activities/relojPonerHora";
import type { RelojPonerHoraExercise } from "../../../core/activities/relojPonerHora";
import { timeLabel } from "../../../core/activities/shared/timeLabel";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import "../reloj/RelojScreen.css";
import "./RelojPonerHoraScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

interface SessionState {
  exercises: RelojPonerHoraExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

const CX = 200,
  CY = 200;
const R = 185;

/**
 * Retardo con el que se pasa al siguiente ejercicio tras acertar.
 *
 * Son 900 ms, el valor unificado con el resto de actividades de la PWA, y no
 * los 1300 ms del renderer de Electron.
 */
const AUTOAVANCE_MS = 900;

/**
 * Convierte la posición del puntero (en píxeles de pantalla) a un ángulo de reloj
 * (0° arriba = las 12, sentido horario), usando el viewBox 400×400 del SVG.
 */
function pointerAngle(clientX: number, clientY: number, svg: SVGSVGElement): number {
  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 400 - CX;
  const y = ((clientY - rect.top) / rect.height) * 400 - CY;
  let deg = (Math.atan2(x, -y) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function RelojPonerHoraScreen({
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
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);

  // Posición de las agujas. Empiezan las doce en punto, como en Electron.
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<"hour" | "minute" | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;

  const resetHands = useCallback(() => {
    setH(12);
    setM(0);
  }, []);

  const handleRetry = useCallback(() => {
    // Reintentar devuelve las agujas a las doce en punto: es el "vaciar la
    // respuesta" de esta actividad, aquí sobre el reloj en vez de sobre una casilla.
    resetHands();
    setSession((s) => ({ ...s, answerState: "idle", alreadyFailed: true }));
  }, [resetHands]);

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
      }));
      resetHands();
    }
  }, [session, total, resetHands]);

  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  // ── Arrastre de agujas ─────────────────────────────────────────────────────

  const applyAngle = (deg: number) => {
    if (dragRef.current === "minute") {
      const snapped = (Math.round(deg / 6 / 5) * 5) % 60; // minuto redondeado a 5
      setM(snapped);
    } else if (dragRef.current === "hour") {
      const hr = Math.round(deg / 30) % 12; // hora 1-12 (0 → 12)
      setH(hr === 0 ? 12 : hr);
    }
  };

  const onPointerDown = (e: React.PointerEvent, hand: "hour" | "minute") => {
    if (session.answerState === "correct") return;
    e.preventDefault();
    dragRef.current = hand;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !svgRef.current) return;
    applyAngle(pointerAngle(e.clientX, e.clientY, svgRef.current));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // ── Comprobación ───────────────────────────────────────────────────────────

  const check = useCallback(() => {
    if (session.answerState === "correct" || !current) return;
    const ok = validateAnswer(current, h, m);
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      alreadyFailed: ok ? s.alreadyFailed : true,
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
    }));
  }, [session.answerState, current, h, m]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    resetHands();
    setSession({
      // Misma semilla que la sesión en curso (AGENT_RULES.md §17): reiniciar es
      // repetir el mismo ejercicio, no tirar uno nuevo al azar.
      exercises: generateSession(difficulty, seed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      alreadyFailed: false,
    });
  }, [difficulty, seed, resetHands]);

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

  // Ángulos de las agujas (la horaria avanza con los minutos, como un reloj real)
  const minAngle = m * 6;
  const hourAngle = ((h % 12) + m / 60) * 30;
  const toXY = (angleDeg: number, len: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CX + len * Math.cos(a), y: CY + len * Math.sin(a) };
  };
  const mh = toXY(minAngle, 150);
  const hh = toXY(hourAngle, 105);

  const markers = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return (
      <line
        key={i}
        x1={CX + (R - 18) * Math.cos(a)}
        y1={CY + (R - 18) * Math.sin(a)}
        x2={CX + (R - 4) * Math.cos(a)}
        y2={CY + (R - 4) * Math.sin(a)}
        stroke="#1e293b"
        strokeWidth={i % 3 === 0 ? 5 : 2.5}
      />
    );
  });
  const nums = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i;
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return (
      <text
        key={n}
        x={CX + (R - 42) * Math.cos(a)}
        y={CY + (R - 42) * Math.sin(a)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1e293b"
        fontSize={i % 3 === 0 ? 30 : 22}
        fontWeight="bold"
      >
        {n}
      </text>
    );
  });

  const stageClass =
    session.answerState === "correct"
      ? "reloj__stage--correct"
      : session.answerState === "wrong"
        ? "reloj__stage--wrong"
        : "";

  return (
    <div className="reloj rph">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`reloj__stage rph__stage ${stageClass}`}>
        <div className="rph__layout">
          {/* Panel lateral: hora pedida + botón (fuera de donde sale la celebración) */}
          <aside className="rph__side">
            {/* El aviso de acierto va ENCIMA de la etiqueta "Pon las agujas en",
                dentro del panel lateral, y no centrado sobre el stage: ahí caía
                sobre la esfera, que es la única parte del ejercicio que hay que ver
                al celebrar. El hueco de arriba está siempre reservado (`.rph__celebration-slot`),
                así que el texto aparece en esa fila sin tapar la frase y sin que el
                panel salte al acertar. */}
            <div className="rph__side-head">
              <div className="rph__celebration-slot">
                {session.answerState === "correct" && (
                  <div className="rph__celebration" role="status">
                    ¡Correcto! ⏰⭐
                  </div>
                )}
              </div>
              <p className="rph__side-label">Pon las agujas en</p>
            </div>
            <div className="rph__target-big" aria-label={`Reloj digital: ${current.target}`}>
              {current.target}
            </div>
            {session.answerState !== "correct" && (
              <button type="button" className="rph__check-btn" onClick={check}>
                Comprobar
              </button>
            )}
            {session.answerState === "wrong" && (
              <p className="rph__hint">Casi… mueve las agujas y vuelve a comprobar.</p>
            )}
            {/* Reintentar y Siguiente van aquí y no al pie del stage como en el resto
                de actividades: en el panel lateral no caben en horizontal. Siguen
                siendo el `ActionButtons` compartido, solo se apilan. */}
            {session.answerState === "wrong" && (
              <ActionButtons className="rph__actions" onRetry={handleRetry} onNext={handleNext} />
            )}

            {/* Leyenda de las agujas con su propio `label`, al pie del panel lateral:
                explica qué aguja es cuál sin ocupar una franja sobre el reloj, que es
                lo que antes empujaba el layout y obligaba a hacer scroll vertical. */}
            <label className="rph__legend" aria-label="Leyenda de las agujas del reloj">
              <span className="rph__legend-item">
                <span className="rph__dot rph__dot--hour" /> aguja corta = horas
              </span>
              <span className="rph__legend-item">
                <span className="rph__dot rph__dot--min" /> aguja larga = minutos
              </span>
            </label>
          </aside>

          <div className="rph__board">
            <svg
              ref={svgRef}
              className="rph__clock"
              viewBox="0 0 400 400"
              role="img"
              aria-label={`Reloj de agujas marcando ${timeLabel(h, m)}`}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{ touchAction: "none" }}
            >
              <circle cx={CX} cy={CY} r={R} fill="#fff" stroke="#000" strokeWidth="6" />
              {markers}
              {nums}

              {/* Aguja de los minutos (larga, primary) */}
              <line
                x1={CX}
                y1={CY}
                x2={mh.x}
                y2={mh.y}
                strokeWidth="7"
                strokeLinecap="round"
                style={{ stroke: "var(--color-primary, #2563eb)" }}
              />
              <circle
                cx={mh.x}
                cy={mh.y}
                r={22}
                className="rph__knob rph__knob--min"
                aria-label="Aguja de los minutos"
                onPointerDown={(e) => onPointerDown(e, "minute")}
              />

              {/* Aguja de las horas (corta, oscura) */}
              <line
                x1={CX}
                y1={CY}
                x2={hh.x}
                y2={hh.y}
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <circle
                cx={hh.x}
                cy={hh.y}
                r={26}
                className="rph__knob rph__knob--hour"
                aria-label="Aguja de las horas"
                onPointerDown={(e) => onPointerDown(e, "hour")}
              />

              <circle cx={CX} cy={CY} r={10} fill="#1e293b" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
