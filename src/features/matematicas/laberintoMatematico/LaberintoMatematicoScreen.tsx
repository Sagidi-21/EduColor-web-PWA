import { useRef, useState } from "react";
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
 * Fondo del laberinto. El original elige uno por semilla, así que la misma
 * semilla da el mismo fondo: es parte del determinismo de la sesión.
 */
const BG_MODS = import.meta.glob<string>("../../../assets/laberinto/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});
const bgList: string[] = Object.values(BG_MODS).filter(Boolean);

// ── Geometría del tablero ──────────────────────────────────────────────────
const NODE_POS: Record<NodeId, [number, number]> = {
  S: [20, 27],
  A: [40, 27],
  B: [60, 27],
  C: [80, 27],
  D: [40, 52],
  E: [60, 52],
  F: [40, 77],
  G: [60, 77],
  H: [80, 77],
};

const OP_POS: [number, number][] = [
  [30, 27],
  [50, 27],
  [70, 27],
  [40, 39.5],
  [60, 39.5],
  [40, 64.5],
  [60, 64.5],
  [70, 77],
];

/** Las tres salidas. Solo se usa para saber qué nodos se pintan como meta. */
const FIN_LABEL: Partial<Record<NodeId, string>> = { C: "FIN A", F: "FIN B", H: "FIN C" };

/**
 * Botones sobre el dibujo (mismos % que los nodos):
 * Y = 2.ª fila de columnas (D/E, 52%); Verificar X = INICIO (20%); Siguiente X = finales (80%).
 */
const BTN_VERIFY_POS: [number, number] = [NODE_POS.S[0], NODE_POS.D[1]];
const BTN_NEXT_POS: [number, number] = [NODE_POS.C[0], NODE_POS.D[1]];

const SVG_LINES: [number, number, number, number][] = [
  [300, 125, 420, 125],
  [540, 125, 660, 125],
  [780, 125, 900, 125],
  [398, 220, 398, 300],
  [638, 220, 638, 300],
  [398, 389, 398, 469],
  [638, 389, 638, 469],
  [780, 577, 900, 577],
];

type ValState = "empty" | "ok" | "err";
type ActiveTgt = NodeId | null;
/** Tras Verificar con errores, el botón pasa a Reintentar. */
type VerifyPhase = "idle" | "hasErrors";

const emptyVals = (): Record<string, string> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, ""]));
const emptyState = (): Record<string, ValState> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, "empty" as ValState]));

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
  const [active, setActive] = useState<ActiveTgt>(null);
  const didScore = useRef(false);

  const bgUrl = bgList.length > 0 ? bgList[seed % bgList.length] : undefined;
  const ex = exercises[exIdx];
  const total = exercises.length;

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

  // ── Numpad: solo escribe; la corrección es con Verificar ─────────────────
  const handleDigit = (key: string) => {
    if (!active || states[active] === "ok") return;
    setVals((v) => ({ ...v, [active]: (v[active] + key).slice(-4) }));
    if (states[active] === "err") {
      setStates((s) => ({ ...s, [active]: "empty" }));
    }
  };

  const handleDelete = () => {
    if (!active || states[active] === "ok") return;
    setVals((v) => ({ ...v, [active]: v[active].slice(0, -1) }));
    if (states[active] === "err") {
      setStates((s) => ({ ...s, [active]: "empty" }));
    }
  };

  const handleConfirm = () => {
    if (!active) return;
    activateNode(null);
  };

  const handleNodeClick = (nid: NodeId) => {
    if (states[nid] === "ok") return;
    activateNode(nid);
  };

  /** Comprueba todos los nodos rellenables y pinta ok / err. */
  const handleVerify = () => {
    if (!ex) return;
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

    setStates(next);
    activateNode(null);
    playFeedback(allOk);

    if (allOk) {
      if (!didScore.current) {
        didScore.current = true;
        setScore((s) => s + 1);
      }
      setVerifyPhase("idle");
    } else if (anyErr) {
      setVerifyPhase("hasErrors");
    }
  };

  /** Solo limpia los nodos fallados; los correctos se mantienen. */
  const handleRetryFailed = () => {
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
    activateNode(null);
  };

  /** Pasa al siguiente laberinto sin exigir verificar. */
  const handleNext = () => {
    if (exIdx >= exercises.length - 1) {
      setFinished({ correct: score, total: exercises.length, duration: Date.now() - startTime });
    } else {
      setExIdx((i) => i + 1);
      setVals(emptyVals());
      setStates(emptyState());
      setVerifyPhase("idle");
      didScore.current = false;
      activateNode(null);
    }
  };

  const handleRestart = () => {
    setFinished(null);
    setExIdx(0);
    setVals(emptyVals());
    setStates(emptyState());
    setVerifyPhase("idle");
    setScore(0);
    setActive(null);
    didScore.current = false;
  };

  const showNumpad = active !== null;

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
    <div
      className={`lm-wrap ${className || ""}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".lm-node,.lm-foot,.lm-board-btn") === null) {
          activateNode(null);
        }
      }}
    >
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${exIdx + 1}/${total}`}
      />

      <div className="lm-canvas">
        {bgUrl && <img className="lm-layer lm-bg" src={bgUrl} alt="" />}

        <svg
          className="lm-layer lm-svg"
          viewBox="0 0 1200 675"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="lm-arr"
              markerWidth="18"
              markerHeight="13"
              refX="18"
              refY="6.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <polygon points="0 0,18 6.5,0 13" fill="#1a2a6c" />
            </marker>
          </defs>
          {SVG_LINES.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#1a2a6c"
              strokeWidth="4"
              markerEnd="url(#lm-arr)"
            />
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

          <span className="lm-lbl lm-lbl-start" style={{ left: "20%", top: "calc(27% - 7%)" }}>
            INICIO
          </span>

          <div
            className="lm-node lm-node-start"
            style={{ left: `${NODE_POS.S[0]}%`, top: `${NODE_POS.S[1]}%` }}
          >
            <span>{ex.start}</span>
          </div>

          <button
            type="button"
            className="lm-board-btn lm-board-btn--verify"
            style={{ left: `${BTN_VERIFY_POS[0]}%`, top: `${BTN_VERIFY_POS[1]}%` }}
            onClick={(e) => {
              e.stopPropagation();
              if (verifyPhase === "hasErrors") handleRetryFailed();
              else handleVerify();
            }}
          >
            {verifyPhase === "hasErrors" ? "Reintentar" : "Verificar"}
          </button>
          <button
            type="button"
            className="lm-board-btn lm-board-btn--next"
            style={{ left: `${BTN_NEXT_POS[0]}%`, top: `${BTN_NEXT_POS[1]}%` }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            {exIdx >= exercises.length - 1 ? "Ver resultado" : "Siguiente"}
          </button>

          {FILLABLE_NODES.map((nid) => {
            const isFin = nid in FIN_LABEL;
            const [l, t] = NODE_POS[nid];
            const isActive = active === nid;
            const displayVal = assembleNum(vals[nid] ?? "");
            return (
              <div
                key={nid}
                className={`lm-node ${isFin ? "lm-node-end" : "lm-node-reg"} lm-ns-${states[nid]} ${isActive ? "lm-node-active" : ""}`}
                style={{ left: `${l}%`, top: `${t}%` }}
                data-node={nid}
                onClick={() => handleNodeClick(nid)}
              >
                <span>{isNaN(displayVal) ? "" : displayVal}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showNumpad && (
        <div className="lm-foot">
          <Numpad
            layout="horizontal"
            onDigit={handleDigit}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
            disabled={false}
          />
        </div>
      )}
    </div>
  );
}
