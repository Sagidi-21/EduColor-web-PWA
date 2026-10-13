import { useCallback, useMemo, useState } from "react";
import {
  generateSession,
  type RelacionarPair,
  type RelacionarSession,
} from "../../../core/activities/relacionar";
import type { EngineScreenProps } from "../engine-screens";
import { MatchColumns, type MatchReport } from "../components/MatchColumns";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import "./RelacionarScreen.css";

const TOTAL_ROUNDS = 10;

// Genera posiciones aleatorias para el layout scattered (expert).
// Cada imagen ocupa una celda de un grid, pero el orden de las celdas se baraja.
function useScatteredSlots(count: number, seed: number): number[] {
  return useMemo(() => {
    // Cada fila contendrá hasta 10 imágenes
    const cols = Math.min(10, count);
    const rows = Math.ceil(count / 10);
    const total = cols * rows;
    let s = seed;
    const rng = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
    const slots = Array.from({ length: total }, (_, i) => i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots.slice(0, count);
  }, [count, seed]);
}

function ScatteredImages({ pair }: { pair: RelacionarPair }) {
  const cols = Math.min(10, pair.number);
  const slots = useScatteredSlots(pair.number, pair.id * 7919 + pair.number * 997);

  if (!pair.scattered) {
    return (
      <>
        {Array.from({ length: pair.number }).map((_, i) => (
          <img key={i} src={pair.imageUrl} className="rel__obj-img" alt="" />
        ))}
      </>
    );
  }

  const total = cols * Math.ceil(pair.number / cols);
  const cells = Array.from({ length: total }, () => null) as (string | null)[];
  slots.forEach((cellIdx, imgIdx) => {
    if (imgIdx < pair.number) cells[cellIdx] = pair.imageUrl;
  });

  return (
    <div className="rel__scattered-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {cells.map((url, i) =>
        url ? (
          <img key={i} src={url} className="rel__obj-img" alt="" />
        ) : (
          <span key={i} className="rel__obj-empty" />
        ),
      )}
    </div>
  );
}

/**
 * "Relacionamos" — número ↔ grupo de imágenes.
 *
 * El emparejamiento en sí lo pone `MatchColumns`, el componente compartido con
 * `multiplicacion`: aquí solo se decide qué se pinta en cada columna y cómo se
 * cuentan las rondas sin fallos.
 */
export function RelacionarScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [rounds, setRounds] = useState<RelacionarSession[]>(() =>
    generateSession(difficulty, seed, TOTAL_ROUNDS),
  );
  /** Semilla de la tanda en curso: "Repetir" la reutiliza para dar el mismo ejercicio. */
  const [sessionSeed] = useState(seed);
  const [roundIdx, setRoundIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setRounds(generateSession(difficulty, sessionSeed, TOTAL_ROUNDS));
    setRoundIdx(0);
    setCorrectCount(0);
    setStartTime(Date.now());
  }, [difficulty, sessionSeed]);

  /** Una ronda cuenta solo si se completó sin fallar ninguna unión. */
  const handleComplete = useCallback(
    (report: MatchReport) => {
      const perfecta = report.completa && report.fallos === 0;
      const nextIdx = roundIdx + 1;
      if (nextIdx >= TOTAL_ROUNDS) {
        setFinished({
          total: TOTAL_ROUNDS,
          // El acierto de esta última ronda aún no está en el estado.
          correct: perfecta ? correctCount + 1 : correctCount,
          duration: Date.now() - startTime,
        });
      } else {
        if (perfecta) setCorrectCount((c) => c + 1);
        setRoundIdx(nextIdx);
      }
    },
    [roundIdx, correctCount, startTime],
  );

  const currentRound = rounds[roundIdx];

  if (finished) {
    return (
      <SummaryScreen
        result={finished}
        gradeLabel={gradeTitle || "Matemáticas"}
        onExit={onExit}
        onRestart={handleRestart}
      />
    );
  }

  if (!currentRound) return null;

  // Easy/medium: columnas centradas en vertical. Hard/expert: arriba (más filas).
  const boardAlign = difficulty === "hard" || difficulty === "expert" ? "top" : "center";

  return (
    <div className="rel">
      <ActivityHeader
        onExit={onExit}
        exitLabel="← Salir"
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${roundIdx + 1} / ${TOTAL_ROUNDS}`}
      />

      <main className={`rel__main rel__main--side rel__main--board-${boardAlign}`}>
        <p className="rel__instruction">Toca un número y luego el grupo que le corresponde</p>

        <div className="rel__board">
          <MatchColumns
            key={roundIdx}
            prefix="rel"
            leftClass="rel__item--num"
            rightClass={(pair) =>
              pair.scattered ? "rel__item--imgs rel__item--imgs-scattered" : "rel__item--imgs"
            }
            left={currentRound.leftColumn}
            right={currentRound.rightColumn}
            renderLeft={(pair) => <span className="rel__number">{pair.number}</span>}
            renderRight={(pair) => <ScatteredImages pair={pair} />}
            onPair={() => {
              /* El sonido y el error los pone el propio emparejador. */
            }}
            onComplete={handleComplete}
          />
        </div>
      </main>
    </div>
  );
}
