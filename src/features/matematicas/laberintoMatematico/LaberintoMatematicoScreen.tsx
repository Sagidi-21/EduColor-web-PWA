import { useEffect, useRef, useState } from "react";
import {
  generateSession,
  validateNode,
  FILLABLE_NODES,
  type LaberintoExercise,
  type LaberintoGrade,
  type NodeId,
} from "../../../core/activities/laberintoMatematico";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { ActivityHeader } from "../components/ActivityHeader";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { Numpad } from "../../shared/components/Numpad";

import "./LaberintoMatematicoScreen.css";

/**
 * Fondos + celebraciones. `bg_<slug>` ↔ `celeb_<slug>.mp4`.
 * Secuencia por ejercicio determinista; vecinos no repiten fondo (si hay ≥2).
 */
const BG_MODS = import.meta.glob<string>("../../../assets/laberinto/bg_*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});
const CELEB_MODS = import.meta.glob<string>("../../../assets/laberinto/celebraciones/celeb_*.mp4", {
  eager: true,
  import: "default",
});

type BgEntry = { url: string; slug: string };

const bgEntries: BgEntry[] = Object.entries(BG_MODS)
  .map(([path, url]) => {
    const m = path.match(/bg_([^/\\]+)\.(?:jpg|jpeg|png|webp)$/i);
    return m && url ? { url, slug: m[1] } : null;
  })
  .filter((e): e is BgEntry => e !== null)
  .sort((a, b) => a.slug.localeCompare(b.slug));

const celebBySlug: Record<string, string> = {};
for (const [path, url] of Object.entries(CELEB_MODS)) {
  const m = path.match(/celeb_([^/\\]+)\.mp4$/i);
  if (m && url) celebBySlug[m[1]] = url;
}

/** Índices de fondo por ejercicio: distintos entre vecinos. */
function bgIndexForExercise(seed: number, exIdx: number, n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 0;
  const start = ((seed % n) + n) % n;
  const step = (Math.floor(Math.abs(seed) / n) % (n - 1)) + 1;
  return (start + exIdx * step) % n;
}

// ── Geometría del tablero ──────────────────────────────────────────────────
/**
 * Paso vertical cols. 1–2 = distancia 1.er recuadro → bola de abajo
 * (antes 39.5% + 15px), repetido: caja, bola, caja, bola, caja.
 */
const COL_TOP_Y = 27;
const COL_STEP_Y = 39.5 + (15 / 675) * 100 - COL_TOP_Y; // ≈ 14.72% ≈ 99.4px
const COL_Y = {
  box1: COL_TOP_Y,
  ball1: COL_TOP_Y + COL_STEP_Y,
  box2: COL_TOP_Y + 2 * COL_STEP_Y,
  ball2: COL_TOP_Y + 3 * COL_STEP_Y,
  box3: COL_TOP_Y + 4 * COL_STEP_Y,
} as const;

const NODE_POS: Record<NodeId, [number, number]> = {
  S: [20, 27],
  A: [40, COL_Y.box1],
  B: [60, COL_Y.box1],
  C: [80, 27],
  D: [40, COL_Y.box2],
  E: [60, COL_Y.box2],
  F: [40, COL_Y.box3],
  G: [60, COL_Y.box3],
  H: [80, COL_Y.box3], // misma fila inferior que F/G
};

const OP_POS: [number, number][] = [
  [30, 27],
  [50, 27],
  [70, 27],
  [40, COL_Y.ball1], // A↔D
  [60, COL_Y.ball1], // B↔E
  [40, COL_Y.ball2], // D↔F
  [60, COL_Y.ball2], // E↔G
  [70, COL_Y.box3], // G↔H
];

/** Las tres salidas. Solo se usa para saber qué nodos se pintan como meta. */
const FIN_LABEL: Partial<Record<NodeId, string>> = { C: "FIN A", F: "FIN B", H: "FIN C" };

/**
 * Botones en la columna derecha (X = finales C/H):
 * el tramo vertical C→H se divide en 4; Siguiente en el 1.er cuarto,
 * Verificar en el 4.º (el más bajo). Gap vertical reducido 100px (50px c/u).
 */
const RIGHT_SPAN_Y = COL_Y.box3 - COL_Y.box1; // = 4 * COL_STEP_Y
const BTN_GAP_SHRINK_PX = 50;
const BTN_NEXT_POS: [number, number] = [
  NODE_POS.C[0],
  COL_Y.box1 + RIGHT_SPAN_Y / 8, // centro del 1.er cuarto
];
const BTN_VERIFY_POS: [number, number] = [
  NODE_POS.C[0],
  COL_Y.box1 + (7 * RIGHT_SPAN_Y) / 8, // centro del 4.º cuarto
];
/**
 * Numpad en tablero: X = columna Inicio; Y = 2.º recuadro de respuesta (D/E).
 * El CSS ancla el centro de la tecla 5 a esa altura.
 */
const NUMPAD_POS: [number, number] = [NODE_POS.S[0], COL_Y.box2];

/** Convierte % de alto del tablero a unidades del viewBox (675). */
const vy = (pct: number) => (pct / 100) * 675;
/** Flechas verticales: margen respecto al centro del nodo. */
const ARROW_PAD = 38;

const SVG_LINES: [number, number, number, number][] = [
  [300, 125, 420, 125],
  [540, 125, 660, 125],
  [780, 125, 900, 125],
  [358, vy(COL_Y.box1) + ARROW_PAD, 358, vy(COL_Y.box2) - ARROW_PAD], // A→D
  [658, vy(COL_Y.box1) + ARROW_PAD, 658, vy(COL_Y.box2) - ARROW_PAD], // B→E
  [358, vy(COL_Y.box2) + ARROW_PAD, 358, vy(COL_Y.box3) - ARROW_PAD], // D→F
  [658, vy(COL_Y.box2) + ARROW_PAD, 658, vy(COL_Y.box3) - ARROW_PAD], // E→G
  [780, vy(COL_Y.box3) + 57, 900, vy(COL_Y.box3) + 57], // G→H (bajo la fila)
];

/** Flecha como path cerrado: interior blanco + borde primary (sin marker). */
function arrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const halfW = 2;
  const headLen = 14;
  const headHalfW = 7;
  const bx = x2 - ux * headLen;
  const by = y2 - uy * headLen;
  const pts = [
    [x1 + px * halfW, y1 + py * halfW],
    [bx + px * halfW, by + py * halfW],
    [bx + px * headHalfW, by + py * headHalfW],
    [x2, y2],
    [bx - px * headHalfW, by - py * headHalfW],
    [bx - px * halfW, by - py * halfW],
    [x1 - px * halfW, y1 - py * halfW],
  ] as const;
  return `${pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")} Z`;
}

/** filled = confirmado en el numpad (borde primary), pendiente de Verificar. */
type ValState = "empty" | "filled" | "ok" | "err";
type ActiveTgt = (typeof FILLABLE_NODES)[number] | null;
/** Tras Verificar con errores, el botón pasa a Reintentar. */
type VerifyPhase = "idle" | "revealing" | "hasErrors" | "celebrating";

/** Desfase entre casillas al pintar el resultado de Verificar. */
const VERIFY_STAGGER_MS = 700;
/** Pausa antes/después de la celebración (patrón PWA). */
const AUTOAVANCE_MS = 900;

const emptyVals = (): Record<string, string> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, ""]));
const emptyState = (): Record<string, ValState> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, "empty" as ValState]));

type FillableNode = (typeof FILLABLE_NODES)[number];

/** Primera casilla editable (no ok); si todas están ok, la primera. */
const firstEditable = (st: Record<string, ValState>): FillableNode =>
  FILLABLE_NODES.find((nid) => st[nid] !== "ok") ?? FILLABLE_NODES[0];

/** Siguiente casilla editable tras `from` (cíclico). */
const nextEditableAfter = (from: FillableNode, st: Record<string, ValState>): FillableNode => {
  const start = FILLABLE_NODES.indexOf(from);
  for (let i = 1; i <= FILLABLE_NODES.length; i++) {
    const nid = FILLABLE_NODES[(start + i) % FILLABLE_NODES.length];
    if (st[nid] !== "ok") return nid;
  }
  return from;
};

export function LaberintoMatematicoScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps): JSX.Element {
  const grade: LaberintoGrade = activity.gradeIds.includes("grade-2") ? "2" : "1";

  const [exercises] = useState<LaberintoExercise[]>(() => generateSession(difficulty, seed, grade));
  const [exIdx, setExIdx] = useState(0);
  const [vals, setVals] = useState(emptyVals);
  const [states, setStates] = useState(emptyState);
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("idle");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [startTime] = useState(() => Date.now());
  const [active, setActive] = useState<ActiveTgt>(FILLABLE_NODES[0]);
  const didScore = useRef(false);
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scoreRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const celebUrlRef = useRef<string | undefined>(undefined);

  const bgEntry =
    bgEntries.length > 0 ? bgEntries[bgIndexForExercise(seed, exIdx, bgEntries.length)] : undefined;
  const bgUrl = bgEntry?.url;
  const celebUrl = bgEntry ? celebBySlug[bgEntry.slug] : undefined;
  const ex = exercises[exIdx];
  const total = exercises.length;
  const celebrating = verifyPhase === "celebrating";

  const clearRevealTimers = () => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
  };

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    celebUrlRef.current = celebUrl;
  }, [celebUrl]);

  useEffect(() => () => clearRevealTimers(), []);

  /** Precarga el vídeo del fondo actual mientras el niño completa el ejercicio. */
  useEffect(() => {
    if (!celebUrl) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "video";
    link.href = celebUrl;
    document.head.appendChild(link);
    void fetch(celebUrl).catch(() => undefined);
    const warm = document.createElement("video");
    warm.preload = "auto";
    warm.muted = true;
    warm.src = celebUrl;
    warm.load();
    return () => {
      link.remove();
      warm.removeAttribute("src");
      warm.load();
    };
  }, [celebUrl]);

  const activateNode = (t: ActiveTgt) => {
    setActive(t);
  };

  /**
   * Las cifras se guardan de unidades hacia delante (U=pos0, D=pos1, C=pos2);
   * al pintar se da la vuelta.
   */
  const assembleNum = (s: string): number => {
    if (!s) return NaN;
    return parseInt(s.split("").reverse().join(""), 10);
  };

  // ── Numpad fijo: solo escribe; la corrección es con Verificar ────────────
  const handleDigit = (key: string) => {
    if (!active || states[active] === "ok") return;
    setVals((v) => ({ ...v, [active]: (v[active] + key).slice(-4) }));
    if (states[active] === "err" || states[active] === "filled") {
      setStates((s) => ({ ...s, [active]: "empty" }));
    }
  };

  const handleDelete = () => {
    if (!active || states[active] === "ok") return;
    setVals((v) => ({ ...v, [active]: v[active].slice(0, -1) }));
    if (states[active] === "err" || states[active] === "filled") {
      setStates((s) => ({ ...s, [active]: "empty" }));
    }
  };

  const handleConfirm = () => {
    if (!active) return;
    const confirmed: ValState = vals[active] ? "filled" : "empty";
    const afterConfirm = { ...states, [active]: confirmed };
    setStates(afterConfirm);
    const allDone = FILLABLE_NODES.every((nid) => {
      const st = afterConfirm[nid];
      return st === "filled" || st === "ok";
    });
    // Con todas chekeadas no queda ninguna seleccionada.
    activateNode(allDone ? null : nextEditableAfter(active, afterConfirm));
  };

  const handleNodeClick = (nid: NodeId) => {
    if (states[nid] === "ok") return;
    // Con Reintentar visible no se puede tocar ningún recuadro (ni los rojos).
    if (verifyPhase === "hasErrors") return;
    if (!FILLABLE_NODES.includes(nid as FillableNode)) return;
    // Fallados en rojo (tras Reintentar ya están vacíos): por si quedara alguno.
    if (states[nid] === "err") {
      setVals((v) => ({ ...v, [nid]: "" }));
      setStates((s) => ({ ...s, [nid]: "empty" }));
    }
    activateNode(nid as FillableNode);
  };

  /**
   * Comprueba nodos y pinta solo los pendientes uno a uno (0.7s):
   * ok = verde, err = rojo. Las ya correctas se saltan y siguen en verde.
   * Al terminar, si hay errores el botón pasa a Reintentar.
   */
  const allChecked = FILLABLE_NODES.every(
    (nid) => states[nid] === "filled" || states[nid] === "ok",
  );

  const handleVerify = () => {
    if (!ex || verifyPhase === "revealing" || !allChecked) return;
    clearRevealTimers();

    const next: Record<string, ValState> = { ...states };
    FILLABLE_NODES.forEach((nid) => {
      if (states[nid] === "ok") {
        next[nid] = "ok";
        return;
      }
      const num = assembleNum(vals[nid] ?? "");
      const ok = !isNaN(num) && validateNode(ex, nid as Exclude<NodeId, "S">, num);
      next[nid] = ok ? "ok" : "err";
    });

    const allOk = FILLABLE_NODES.every((nid) => next[nid] === "ok");
    const anyErr = FILLABLE_NODES.some((nid) => next[nid] === "err");
    // Solo las no validadas aún entran en la secuencia de pintado.
    const toReveal = FILLABLE_NODES.filter((nid) => states[nid] !== "ok");

    const finishReveal = () => {
      playFeedback(allOk);
      if (allOk) {
        activateNode(null);
        if (!didScore.current) {
          didScore.current = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
        setVerifyPhase("idle");
        // 900 ms → celebración (fondo cobra vida) o avance si no hay vídeo.
        const t = setTimeout(() => {
          if (celebUrlRef.current) setVerifyPhase("celebrating");
          else advanceAfterSuccess();
        }, AUTOAVANCE_MS);
        revealTimers.current.push(t);
      } else if (anyErr) {
        activateNode(null);
        setVerifyPhase("hasErrors");
      } else {
        activateNode(firstEditable(next));
        setVerifyPhase("idle");
      }
    };

    if (toReveal.length === 0) {
      finishReveal();
      return;
    }

    // Pendientes: vacío hasta que les toque; las ok se mantienen verdes.
    setStates((s) => {
      const ns = { ...s };
      toReveal.forEach((nid) => {
        ns[nid] = "empty";
      });
      return ns;
    });
    setVerifyPhase("revealing");

    toReveal.forEach((nid, i) => {
      const t = setTimeout(() => {
        setStates((s) => ({ ...s, [nid]: next[nid] }));
        if (i < toReveal.length - 1) return;
        finishReveal();
      }, i * VERIFY_STAGGER_MS);
      revealTimers.current.push(t);
    });
  };

  /** Solo limpia los nodos fallados; los correctos se mantienen. */
  const handleRetryFailed = () => {
    if (verifyPhase === "revealing") return;
    const firstFailed = FILLABLE_NODES.find((nid) => states[nid] === "err") ?? FILLABLE_NODES[0];
    clearRevealTimers();
    setVals((v) => {
      const nv = { ...v };
      FILLABLE_NODES.forEach((nid) => {
        if (states[nid] === "err") nv[nid] = "";
      });
      return nv;
    });
    setStates((s) => {
      const ns = { ...s };
      FILLABLE_NODES.forEach((nid) => {
        if (s[nid] === "err") ns[nid] = "empty";
      });
      return ns;
    });
    setVerifyPhase("idle");
    activateNode(firstFailed);
  };

  /** Avanza tras acierto (siguiente laberinto o resumen). */
  const advanceAfterSuccess = () => {
    clearRevealTimers();
    if (exIdx >= exercises.length - 1) {
      setFinished({
        correct: scoreRef.current,
        total: exercises.length,
        duration: Date.now() - startTime,
      });
    } else {
      setExIdx((i) => i + 1);
      setVals(emptyVals());
      setStates(emptyState());
      setVerifyPhase("idle");
      didScore.current = false;
      activateNode(FILLABLE_NODES[0]);
    }
  };

  /** Pasa al siguiente laberinto sin exigir verificar (no disponible en el último). */
  const handleNext = () => {
    if (exIdx >= exercises.length - 1) return;
    advanceAfterSuccess();
  };

  const isLastExercise = exIdx >= exercises.length - 1;

  const handleCelebEnded = () => {
    // Cancela el fallback de autoplay fallido si el vídeo sí llegó a terminar.
    clearRevealTimers();
    const t = setTimeout(() => advanceAfterSuccess(), AUTOAVANCE_MS);
    revealTimers.current.push(t);
  };

  /** Al entrar en celebración: play del vídeo (muted si el autoplay lo exige). */
  useEffect(() => {
    if (verifyPhase !== "celebrating") return;
    const el = videoRef.current;
    if (!el || !celebUrl) {
      const t = setTimeout(() => advanceAfterSuccess(), AUTOAVANCE_MS);
      revealTimers.current.push(t);
      return;
    }
    el.currentTime = 0;
    el.muted = false;
    const tryPlay = el.play();
    if (tryPlay) {
      tryPlay.catch(() => {
        el.muted = true;
        void el.play().catch(() => {
          const t = setTimeout(() => advanceAfterSuccess(), AUTOAVANCE_MS);
          revealTimers.current.push(t);
        });
      });
    }
  }, [verifyPhase, celebUrl, exIdx]);

  const handleRestart = () => {
    clearRevealTimers();
    setFinished(null);
    setExIdx(0);
    setVals(emptyVals());
    setStates(emptyState());
    setVerifyPhase("idle");
    setScore(0);
    setActive(FILLABLE_NODES[0]);
    didScore.current = false;
  };

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

  if (!ex) return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;

  return (
    <div className={`lm-wrap ${celebrating ? "lm-wrap--celebrating" : ""} ${className || ""}`}>
      {!celebrating && (
        <ActivityHeader
          onExit={onExit}
          gradeTitle={gradeTitle}
          className={className}
          unitTitle={activity.title}
          difficultyStars={difficultyStars}
          mascotUrl={mascotUrl}
          progress={`${exIdx + 1}/${total}`}
        />
      )}

      <div className="lm-canvas">
        {bgUrl && <img className="lm-layer lm-bg" src={bgUrl} alt="" />}

        {celebrating && celebUrl && (
          <video
            ref={videoRef}
            className="lm-layer lm-celeb"
            src={celebUrl}
            playsInline
            preload="auto"
            onEnded={handleCelebEnded}
            aria-label="Celebración"
          />
        )}

        {!celebrating && (
          <div className="lm-playfield">
            <svg
              className="lm-layer lm-svg"
              viewBox="0 0 1200 675"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {SVG_LINES.map(([x1, y1, x2, y2], i) => (
                <path key={i} className="lm-arrow" d={arrowPath(x1, y1, x2, y2)} />
              ))}
            </svg>

            <div className="lm-layer lm-nodes-layer">
              {ex.edges.map((edge, i) => (
                <div
                  key={i}
                  className="lm-op"
                  style={{ left: `${OP_POS[i][0]}%`, top: `${OP_POS[i][1]}%` }}
                >
                  {edge.op}
                  {edge.value}
                </div>
              ))}

              <span
                className="lm-lbl lm-lbl-start"
                style={{ left: "20%", top: "calc(27% - 7% - 60px)" }}
              >
                Inicio
              </span>

              <div
                className="lm-node lm-node-start"
                style={{ left: `${NODE_POS.S[0]}%`, top: `${NODE_POS.S[1]}%` }}
              >
                <span>{ex.start}</span>
              </div>

              <button
                type="button"
                className={`lm-board-btn lm-board-btn--verify${
                  verifyPhase === "idle" && !allChecked
                    ? " lm-board-btn--waiting"
                    : verifyPhase === "idle" && allChecked
                      ? " lm-board-btn--ready"
                      : ""
                }`}
                style={{
                  left: `${BTN_VERIFY_POS[0]}%`,
                  top: `calc(${BTN_VERIFY_POS[1]}% - ${BTN_GAP_SHRINK_PX}px)`,
                }}
                disabled={verifyPhase === "revealing" || (verifyPhase === "idle" && !allChecked)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (verifyPhase === "hasErrors") handleRetryFailed();
                  else handleVerify();
                }}
              >
                <span className="lm-board-btn__label">
                  {verifyPhase === "hasErrors" ? "Reintentar" : "Verificar"}
                </span>
              </button>
              <button
                type="button"
                className={`lm-board-btn lm-board-btn--next${isLastExercise ? " lm-board-btn--last" : ""}`}
                style={{
                  left: `${BTN_NEXT_POS[0]}%`,
                  top: `calc(${BTN_NEXT_POS[1]}% + ${BTN_GAP_SHRINK_PX}px)`,
                }}
                disabled={isLastExercise}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                {isLastExercise ? "Último Ejercicio" : "Siguiente"}
              </button>

              {FILLABLE_NODES.map((nid) => {
                const isFin = nid in FIN_LABEL;
                const [l, t] = NODE_POS[nid];
                const isActive = active === nid && states[nid] !== "ok" && !allChecked;
                const isLockedErr = verifyPhase === "hasErrors" && states[nid] === "err";
                const displayVal = assembleNum(vals[nid] ?? "");
                return (
                  <div
                    key={nid}
                    className={`lm-node ${isFin ? "lm-node-end" : "lm-node-reg"} lm-ns-${states[nid]} ${isActive ? "lm-node-active" : ""}${isLockedErr ? " lm-node-locked" : ""}`}
                    style={{ left: `${l}%`, top: `${t}%` }}
                    data-node={nid}
                    onClick={() => handleNodeClick(nid)}
                  >
                    <span>{isNaN(displayVal) ? "" : displayVal}</span>
                  </div>
                );
              })}

              <div
                className="lm-board-numpad"
                style={{ left: `${NUMPAD_POS[0]}%`, top: `${NUMPAD_POS[1]}%` }}
              >
                <Numpad
                  onDigit={handleDigit}
                  onDelete={handleDelete}
                  onConfirm={handleConfirm}
                  disabled={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
