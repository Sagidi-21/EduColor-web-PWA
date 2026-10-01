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
import { ActionButtons } from "../components/ActivityActionButtons";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { ActivityErrorBoundary } from "../components/ActivityErrorBoundary";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import { LazyDigitCell } from "../../shared/DigitCell";

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
// Filas al 27 / 52 / 77 % (subidas para que los nodos no se junten al pie).
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

// Los círculos de operación se quedan en el CENTRO de cada hueco, alineados con
// los nodos (misma fila y mismo nivel de columna).
const OP_POS: [number, number][] = [
  [30, 27],
  [50, 27],
  [70, 27], // horizontal: fila 1
  [40, 39.5],
  [60, 39.5], // vertical: entre filas 1 y 2 (27↔52)
  [40, 64.5],
  [60, 64.5], // vertical: entre filas 2 y 3 (52↔77)
  [70, 77], // G→H: fila 3
];

/** Las tres salidas. Solo se usa para saber qué nodos se pintan como meta. */
const FIN_LABEL: Partial<Record<NodeId, string>> = { C: "FIN A", F: "FIN B", H: "FIN C" };

// Flechas del SVG: van por el LADO, nunca sobre los círculos ni sobre las casillas.
// viewBox 1200×675; nodos 100×56 (mitad 50×28); círculos ø70 centrados en cada hueco.
// Enlaces horizontales: la flecha flota ARRIBA de la fila (círculos en y≈182) → y=125.
// El enlace G→H flota ABAJO de la fila 3 (borde inferior 514) → y=545.
// Enlaces verticales: la flecha baja por la IZQUIERDA de la columna → x=398 / 638.
const SVG_LINES: [number, number, number, number][] = [
  [300, 125, 420, 125], // S→A, sobre la fila 1
  [540, 125, 660, 125], // A→B
  [780, 125, 900, 125], // B→C
  [398, 220, 398, 300], // A→D, a la izquierda de la columna A
  [638, 220, 638, 300], // B→E, a la izquierda de la columna B
  [398, 389, 398, 469], // D→F, a la izquierda de la columna A
  [638, 389, 638, 469], // E→G, a la izquierda de la columna B
  [780, 577, 900, 577], // G→H, bajo la fila 3
];

// Valores posicionales (primero las unidades): índice 0 = unidades.
const PLACE_ABBR = ["U", "D", "C", "UM"];
const PLACE_NAMES = ["unidades", "decenas", "centenas", "unidades de millar"];

type ValState = "empty" | "ok" | "err";
/** Qué está activo: un nodo del tablero, la respuesta final, o nada. */
type ActiveTgt = NodeId | "final" | null;

const emptyVals = (): Record<string, string> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, ""]));
const emptyState = (): Record<string, ValState> =>
  Object.fromEntries(FILLABLE_NODES.map((n) => [n, "empty" as ValState]));

/** Cuántas cifras tiene el número que va en un nodo. */
function digitosDe(n: number): number {
  return String(n).length;
}

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
  /**
   * Curso del motor. El original lo sacaba del texto de la cabecera
   * (`gradeLabel.includes("2")`); aquí sale del manifiesto, que es donde vive el
   * dato y no depende de cómo se escriba el título. `laberintoMatematico` es de
   * 1.º y `laberintoMatematico2` de 2.º, y cada uno tiene su tabla de límites.
   */
  const grade: LaberintoGrade = activity.gradeIds.includes("grade-2") ? "2" : "1";

  const { mode, toggle } = useInputMode();

  const [exercises] = useState<LaberintoExercise[]>(() => generateSession(difficulty, seed, grade));
  const [exIdx, setExIdx] = useState(0);
  const [vals, setVals] = useState(emptyVals);
  const [states, setStates] = useState(emptyState);
  const [finalAns, setFinalAns] = useState("");
  const [finalSt, setFinalSt] = useState<ValState>("empty");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [startTime] = useState(() => Date.now());
  const [active, setActive] = useState<ActiveTgt>(null);
  const [digitIdx, setDigitIdx] = useState(0);
  const didScore = useRef(false);

  const bgUrl = bgList.length > 0 ? bgList[seed % bgList.length] : undefined;
  const ex = exercises[exIdx];
  const total = exercises.length;

  // Un setter combinado: activar un nodo deja el cursor de cifra en el principio.
  const activateNode = (t: ActiveTgt) => {
    setActive(t);
    setDigitIdx(0);
  };

  /**
   * Las cifras se guardan de unidades hacia delante (U=pos0, D=pos1, C=pos2), que
   * es como se opera en el tablero; al pintar se da la vuelta.
   */
  const assembleNum = (s: string): number => {
    if (!s) return NaN;
    return parseInt(s.split("").reverse().join(""), 10);
  };

  /** Cuántas cifras pide cada nodo, para saber cuándo dejar de aceptar más. */
  const nDigits = (nid: string): number =>
    nid === "final"
      ? digitosDe(ex?.answers[ex.correctFin] ?? 0)
      : digitosDe(ex?.answers[nid as NodeId] ?? 0);

  // ── Validación ──────────────────────────────────────────────────────────
  // `val` siempre va de unidades hacia delante (numpad y lienzo).
  const validateNodeVal = (nodeId: string, val?: string) => {
    if (!ex) return;
    const num = assembleNum(val ?? vals[nodeId] ?? "");
    if (isNaN(num)) return;
    const ok = validateNode(ex, nodeId as Exclude<NodeId, "S">, num);
    playFeedback(ok);
    setStates((s) => ({ ...s, [nodeId]: ok ? "ok" : "err" }));
    if (!ok) {
      // El error se ve unos instantes y la casilla vuelve a quedar vacía.
      setTimeout(() => setStates((s) => ({ ...s, [nodeId]: "empty" })), 380);
    }
  };

  const validateFinalVal = (ans: string) => {
    if (!ex) return;
    const num = parseInt(ans, 10);
    if (isNaN(num)) return;
    /**
     * Se compara con el nodo que el motor marca como respuesta, que puede ser
     * una salida o un nodo intermedio, y solo en el caso extremo de que el mayor
     * (o el menor) sea el número de inicio sería `S`, que no es rellenable.
     */
    const ok = num === ex.answers[ex.correctFin];
    playFeedback(ok);
    setFinalSt(ok ? "ok" : "err");
    if (ok) {
      if (!revealed && !didScore.current) {
        didScore.current = true;
        setScore((s) => s + 1);
      }
    } else {
      setTimeout(() => setFinalSt("empty"), 380);
    }
  };

  // ── Numpad ──────────────────────────────────────────────────────────────
  const handleDigit = (key: string) => {
    if (!active || revealed) return;
    if (active === "final") setFinalAns((v) => (v + key).slice(-4));
    else setVals((v) => ({ ...v, [active]: (v[active] + key).slice(-4) }));
  };

  const handleDelete = () => {
    if (!active || revealed) return;
    if (active === "final") setFinalAns((v) => v.slice(0, -1));
    else setVals((v) => ({ ...v, [active]: v[active].slice(0, -1) }));
  };

  const handleConfirm = () => {
    if (!active || revealed) return;
    if (active === "final") validateFinalVal(finalAns);
    else validateNodeVal(active);
    activateNode(null);
  };

  // ── Clic en un nodo ─────────────────────────────────────────────────────
  const handleNodeClick = (nid: NodeId) => {
    if (revealed || states[nid] === "ok") return;
    activateNode(nid);
  };

  // ── Confirmación de cifra escrita a mano (avanza y valida solo) ──────────
  const handleCanvasConfirm = (digit: string) => {
    if (!active || active === "final" || !ex) return;
    const nid = active;
    const dCount = nDigits(nid);
    const cur = vals[nid] ?? "";
    if (cur.length >= dCount) return; // ya está lleno: se ignora un confirm doble
    const newVal = cur + digit;
    setVals((v) => ({ ...v, [nid]: newVal }));
    if (newVal.length >= dCount) {
      const num = assembleNum(newVal);
      const ok = num === ex.answers[nid];
      playFeedback(ok);
      setStates((s) => ({ ...s, [nid]: ok ? "ok" : "err" }));
      if (!ok) {
        setTimeout(() => {
          setStates((s) => ({ ...s, [nid]: "empty" }));
          setVals((v) => ({ ...v, [nid]: "" }));
        }, 380);
      }
      activateNode(null);
    } else {
      setDigitIdx(newVal.length); // índice absoluto: no se pasa de largo
    }
  };

  // ── Revelar y avanzar ───────────────────────────────────────────────────
  const handleReveal = () => {
    if (!ex) return;
    const nv: Record<string, string> = {};
    const ns: Record<string, ValState> = {};
    // Se guarda de unidades hacia delante para que el nodo se pinte bien.
    FILLABLE_NODES.forEach((n) => {
      nv[n] = String(ex.answers[n]).split("").reverse().join("");
      ns[n] = "ok";
    });
    setVals(nv);
    setStates(ns);
    // La respuesta final es una cadena normal, no hay que darle la vuelta.
    setFinalAns(String(ex.answers[ex.correctFin]));
    setFinalSt("ok");
    setRevealed(true);
    activateNode(null);
  };

  /** Solo se puede pasar de exercise having acertado la pregunta o revelando. */
  const canAdvance = finalSt === "ok" || revealed;

  const handleNext = () => {
    if (!canAdvance) return;
    if (exIdx >= exercises.length - 1) {
      setFinished({ correct: score, total: exercises.length, duration: Date.now() - startTime });
    } else {
      setExIdx((i) => i + 1);
      setVals(emptyVals());
      setStates(emptyState());
      setFinalAns("");
      setFinalSt("empty");
      setRevealed(false);
      didScore.current = false;
      activateNode(null);
    }
  };

  /**
   * "Repetir" reinicia el tablero. Como en el original, la sesión es la misma:
   * el botón repite los mismos cinco laberintos, no tienta otros.
   */
  const handleRestart = () => {
    setFinished(null);
    setExIdx(0);
    setVals(emptyVals());
    setStates(emptyState());
    setFinalAns("");
    setFinalSt("empty");
    setRevealed(false);
    setScore(0);
    setActive(null);
    setDigitIdx(0);
  };

  // ── Qué se ve en cada momento ────────────────────────────────────────────
  const showNumpad = (mode === "numpad" || active === "final") && active !== null && !revealed;
  const showCanvas = mode === "canvas" && active !== null && active !== "final" && !revealed;

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

  const popupDCount = active && active !== "final" ? nDigits(active) : 1;

  const canvasState =
    active && active !== "final"
      ? states[active] === "ok"
        ? "correct"
        : states[active] === "err"
          ? "wrong"
          : "idle"
      : "idle";

  return (
    <div
      className={`lm-wrap ${className || ""}`}
      onClick={(e) => {
        // Un clic fuera de los nodos, del pie y del lienzo desactiva lo activo.
        if ((e.target as HTMLElement).closest(".lm-node,.lm-foot,.lm-canvas-overlay") === null)
          activateNode(null);
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
      >
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      {/* Tablero */}
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

          {/* Nodo de inicio: lo pone el motor y no se toca */}
          <div
            className="lm-node lm-node-start"
            style={{ left: `${NODE_POS.S[0]}%`, top: `${NODE_POS.S[1]}%` }}
          >
            <span>{ex.start}</span>
          </div>

          {/* Nodos rellenables */}
          {FILLABLE_NODES.map((nid) => {
            const isFin = nid in FIN_LABEL;
            const [l, t] = NODE_POS[nid];
            const isActive = active === nid;
            // Sin nada escrito el valor es `NaN`, que es lo que se pinta como hueco.
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

        {/* Escritura a mano */}
        {showCanvas && (
          <div className="lm-canvas-overlay" onClick={() => activateNode(null)}>
            {/*
              La escritura a mano arrastra TensorFlow.js. Va dentro de su propia
              barrera para que, si ese trozo no llega a descargarse, el laberinto
              siga en pantalla en vez de desaparecer entero.
            */}
            <ActivityErrorBoundary activityTitle={activity.title} onExit={onExit}>
              <div className="lm-canvas-popup" onClick={(e) => e.stopPropagation()}>
                <div className="lm-canvas-popup-label">
                  {popupDCount > 1 && (
                    <span className="lm-popup-digit-hint">
                      Escribe las {PLACE_NAMES[digitIdx] ?? "cifras"}
                    </span>
                  )}
                </div>
                {/* Las casillas se leen como un número: la de la izquierda es la de
                  mayor valor y la de la derecha, las unidades. Se escribe de
                  unidades hacia delante, así que la primera activa es la derecha. */}
                <div className={`lm-multi-digit lm-multi-digit-${popupDCount}`}>
                  {Array.from({ length: popupDCount }).map((_, vi) => {
                    const place = popupDCount - 1 - vi; // caja derecha → lugar 0 (unidades)
                    return (
                      <div key={vi} className="lm-digit-slot">
                        <LazyDigitCell
                          isActive={digitIdx === place}
                          onActivate={() => {
                            setDigitIdx(place);
                            setVals((v) => ({
                              ...v,
                              [active as NodeId]: v[active as NodeId].slice(0, place),
                            }));
                          }}
                          onConfirm={handleCanvasConfirm}
                          onClear={() => {
                            setVals((v) => ({
                              ...v,
                              [active as NodeId]: v[active as NodeId].slice(0, place),
                            }));
                            setDigitIdx(place);
                          }}
                          state={canvasState}
                          value={vals[active as NodeId]?.[place] ?? ""}
                        />
                        {popupDCount > 1 && (
                          <span className="lm-digit-place">{PLACE_ABBR[place]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ActivityErrorBoundary>
          </div>
        )}
      </div>

      {/* Pie */}
      <div className="lm-foot">
        {showNumpad ? (
          <Numpad
            layout="horizontal"
            onDigit={handleDigit}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
            disabled={false}
          />
        ) : (
          <>
            <span className="lm-question">{ex.question}</span>
            <input
              className={`lm-final-input lm-ns-${finalSt}`}
              type="button"
              value={finalAns || "□"}
              aria-label="Respuesta final"
              onClick={() => {
                if (!revealed) activateNode("final");
              }}
            />
            {/*
              Los dos botones del original ("Revelar" y "Siguiente →") salen del
              par compartido de la app. "Revelar" hace de reintentar: es
              idempotente, y al estar revelada ya no cambia nada.
            */}
            <ActionButtons
              onRetry={handleReveal}
              onNext={handleNext}
              retryLabel="👁 Revelar"
              nextLabel={exIdx >= exercises.length - 1 ? "Ver resultado" : "Siguiente →"}
              className="lm-actions"
            />
          </>
        )}
      </div>
    </div>
  );
}
