import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateSession,
  type RelacionarPair,
  type RelacionarSession,
} from "../../../core/activities/relacionar";
import { playFeedback } from "../../shared/audioFeedback";
import type { EngineScreenProps } from "../engine-screens";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import "./RelacionarScreen.css";

const TOTAL_ROUNDS = 10;

// Genera posiciones aleatorias para el layout scattered (expert).
// Cada imagen ocupa una celda de un grid, pero el orden de las celdas se baraja.
function useScatteredSlots(count: number, seed: number): number[] {
  return useMemo(() => {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
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
  const cols = Math.ceil(Math.sqrt(pair.number));
  const slots = useScatteredSlots(pair.number, pair.id * 7919 + pair.number * 997);

  if (!pair.scattered) {
    return (
      <>
        {Array.from({ length: pair.number }, (_, i) => (
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

type Line = { id: number; x1: number; y1: number; x2: number; y2: number };

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
  const [roundIdx, setRoundIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundFailed, setRoundFailed] = useState(false);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [finished, setFinished] = useState<SessionResult | null>(null);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [connections, setConnections] = useState<Map<number, number>>(new Map());
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rightRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [lines, setLines] = useState<Line[]>([]);

  const computeLines = useCallback(() => {
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return;
    const next: Line[] = [];
    connections.forEach((rightId, leftId) => {
      const lEl = leftRefs.current.get(leftId);
      const rEl = rightRefs.current.get(rightId);
      if (!lEl || !rEl) return;
      const lr = lEl.getBoundingClientRect();
      const rr = rEl.getBoundingClientRect();
      next.push({
        id: leftId,
        x1: lr.right - cr.left,
        y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left - cr.left,
        y2: rr.top + rr.height / 2 - cr.top,
      });
    });
    setLines(next);
  }, [connections]);

  useEffect(() => {
    computeLines();
  }, [computeLines]);

  useEffect(() => {
    window.addEventListener("resize", computeLines);
    return () => window.removeEventListener("resize", computeLines);
  }, [computeLines]);

  const handleRestart = () => {
    setFinished(null);
    setRounds(generateSession(difficulty, Date.now() % 999983, TOTAL_ROUNDS));
    setRoundIdx(0);
    setCorrectCount(0);
    setRoundFailed(false);
    setStartTime(Date.now());
    setSelectedLeft(null);
    setConnections(new Map());
    setWrongPair(null);
    setCelebrating(false);
    leftRefs.current.clear();
    rightRefs.current.clear();
    setLines([]);
  };

  const handleLeftClick = (pair: RelacionarPair) => {
    if (celebrating || wrongPair) return;
    if (connections.has(pair.id)) return;
    setSelectedLeft((prev) => (prev === pair.id ? null : pair.id));
  };

  const handleRightClick = (pair: RelacionarPair) => {
    if (celebrating || wrongPair || selectedLeft === null) return;
    const alreadyUsed = Array.from(connections.values()).includes(pair.id);
    if (alreadyUsed) return;

    const isCorrect = selectedLeft === pair.id;

    if (isCorrect) {
      const next = new Map(connections);
      next.set(selectedLeft, pair.id);
      setConnections(next);
      setSelectedLeft(null);
      playFeedback(true);

      if (next.size === currentRound.pairs.length) {
        setCelebrating(true);
        const isPerfectRound = !roundFailed;
        const updatedCorrect = isPerfectRound ? correctCount + 1 : correctCount;
        if (isPerfectRound) {
          setCorrectCount((c) => c + 1);
        }

        setTimeout(() => {
          const nextIdx = roundIdx + 1;
          if (nextIdx >= rounds.length) {
            setFinished({
              total: rounds.length,
              correct: updatedCorrect,
              duration: Date.now() - startTime,
            });
          } else {
            setRoundIdx(nextIdx);
            setSelectedLeft(null);
            setConnections(new Map());
            setWrongPair(null);
            setCelebrating(false);
            setRoundFailed(false);
            leftRefs.current.clear();
            rightRefs.current.clear();
            setLines([]);
          }
        }, 1500);
      }
    } else {
      setRoundFailed(true);
      setWrongPair([selectedLeft, pair.id]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 700);
    }
  };

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

  const currentRound = rounds[roundIdx];
  if (!currentRound) return null;

  const { leftColumn, rightColumn } = currentRound;

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

      <main className="rel__main">
        <p className="rel__instruction">Toca un número y luego el grupo que le corresponde</p>

        <div className="rel__columns" ref={containerRef}>
          <svg className="rel__svg" aria-hidden="true">
            {lines.map((l) => (
              <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="rel__line" />
            ))}
          </svg>

          <div className="rel__col rel__col--left">
            {leftColumn.map((pair) => {
              const isSelected = selectedLeft === pair.id;
              const isConnected = connections.has(pair.id);
              const isWrong = wrongPair?.[0] === pair.id;
              return (
                <div
                  key={pair.id}
                  ref={(el) => {
                    if (el) leftRefs.current.set(pair.id, el);
                  }}
                  className={[
                    "rel__item rel__item--num",
                    isSelected && "rel__item--selected",
                    isConnected && "rel__item--connected",
                    isWrong && "rel__item--wrong",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleLeftClick(pair)}
                >
                  <span className="rel__number">{pair.number}</span>
                </div>
              );
            })}
          </div>

          <div className="rel__col rel__col--right">
            {rightColumn.map((pair) => {
              const isConnected = Array.from(connections.values()).includes(pair.id);
              const isWrong = wrongPair?.[1] === pair.id;
              const isHintable = selectedLeft !== null && !isConnected && !isWrong;
              return (
                <div
                  key={pair.id}
                  ref={(el) => {
                    if (el) rightRefs.current.set(pair.id, el);
                  }}
                  className={[
                    "rel__item rel__item--imgs",
                    pair.scattered && "rel__item--imgs-scattered",
                    isConnected && "rel__item--connected",
                    isWrong && "rel__item--wrong",
                    isHintable && "rel__item--hintable",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleRightClick(pair)}
                >
                  <ScatteredImages pair={pair} />
                </div>
              );
            })}
          </div>
        </div>

        {celebrating && <div className="rel__celebrate">¡Muy bien! 🎉</div>}
      </main>
    </div>
  );
}
