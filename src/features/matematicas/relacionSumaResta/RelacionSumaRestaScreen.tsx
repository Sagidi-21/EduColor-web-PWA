import { useState, useEffect, useCallback } from "react";
import {
  generateSession,
  validateAnswers,
  allCorrect,
} from "../../../core/activities/relacionSumaResta";
import type { RelacionSumaRestaExercise } from "../../../core/activities/relacionSumaResta";
import type { EngineScreenProps } from "../engine-screens";
import { playFeedback } from "../../shared/audioFeedback";
import { LazyDigitCell } from "../../shared/DigitCell";
import { SummaryScreen } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { Numpad } from "../../shared/components/Numpad";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./RelacionSumaRestaScreen.css";

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

type OpIndex = 0 | 1 | 2;
/** digits[0]=D, digits[1]=U */
type OpDigits = [string, string];
type AllDigits = [OpDigits, OpDigits, OpDigits];
type GradeResults = [boolean, boolean, boolean];

interface OpDef {
  left: number;
  right: number;
  op: "+" | "−";
  expected: number;
}

interface SessionState {
  exercises: RelacionSumaRestaExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  alreadyFailed?: boolean;
  /** selecting = eligiendo/rellenando ops; graded = las 3 evaluadas */
  phase: "selecting" | "graded";
  gradeResults: GradeResults | null;
  digits: AllDigits;
  done: [boolean, boolean, boolean];
  detailOp: OpIndex | null;
  detailDigits: OpDigits;
  detailActiveDigit: 0 | 1;
}

// ────────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────────

function emptyDigits(): AllDigits {
  return [
    ["", ""],
    ["", ""],
    ["", ""],
  ];
}

function initSession(difficulty: string, seed: number): SessionState {
  return {
    exercises: generateSession(difficulty as Parameters<typeof generateSession>[0], seed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    phase: "selecting",
    gradeResults: null,
    digits: emptyDigits(),
    done: [false, false, false],
    detailOp: null,
    detailDigits: ["", ""],
    detailActiveDigit: 1,
  };
}

function digitDU(n: number): { d: string; u: string } {
  const d = Math.floor(n / 10);
  return { d: d > 0 ? String(d) : "", u: String(n % 10) };
}

function pairToInput([d, u]: OpDigits): string {
  if (d === "" && u === "") return "";
  const n = parseInt(`${d}${u}`, 10);
  return Number.isNaN(n) ? "" : String(n);
}

function digitsToInputs(digits: AllDigits): [string, string, string] {
  return [pairToInput(digits[0]), pairToInput(digits[1]), pairToInput(digits[2])];
}

function opsFor(ex: RelacionSumaRestaExercise): [OpDef, OpDef, OpDef] {
  return [
    { left: ex.total, right: ex.partA, op: "−", expected: ex.partB },
    { left: ex.total, right: ex.partB, op: "−", expected: ex.partA },
    { left: ex.partA, right: ex.partB, op: "+", expected: ex.total },
  ];
}

// ────────────────────────────────────────────────────────────────
// Overview: una columna de operación (solo lectura + clic)
// ────────────────────────────────────────────────────────────────

function OverviewOp({
  def,
  digits,
  done,
  grade,
  selectable,
  onSelect,
}: {
  def: OpDef;
  digits: OpDigits;
  done: boolean;
  grade: boolean | null;
  selectable: boolean;
  onSelect: () => void;
}) {
  const top = digitDU(def.left);
  const bottom = digitDU(def.right);

  const boxClass = () => {
    const classes = ["relsr__box"];
    if (grade === true) classes.push("relsr__box--correct");
    else if (grade === false) classes.push("relsr__box--wrong");
    return classes.join(" ");
  };

  return (
    <div
      className={`relsr__op-col${selectable ? " relsr__op-col--selectable" : ""}${done ? " relsr__op-col--done" : ""}`}
      data-left={def.left}
      data-right={def.right}
      data-op={def.op === "−" ? "-" : "+"}
      data-done={done ? "1" : "0"}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={`${def.left} ${def.op} ${def.right}`}
      onClick={selectable ? onSelect : undefined}
      onKeyDown={selectable ? (e) => e.key === "Enter" && onSelect() : undefined}
    >
      <div className="relsr__grid">
        <span />
        <span className="relsr__col-label">D</span>
        <span className="relsr__col-label">U</span>

        <span />
        <span className="relsr__digit relsr__number">{top.d}</span>
        <span className="relsr__digit relsr__number">{top.u}</span>

        <span className="relsr__op">{def.op}</span>
        <span className="relsr__digit relsr__number">{bottom.d}</span>
        <span className="relsr__digit relsr__number">{bottom.u}</span>

        <span className="relsr__separator" />

        <span />
        <div className={boxClass()}>{digits[0]}</div>
        <div className={boxClass()}>{digits[1]}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Detalle: una operación grande (numpad / canvas)
// ────────────────────────────────────────────────────────────────

function DetailGrid({
  def,
  digits,
  activeDigit,
  mode,
  canvasKey,
  onBoxClick,
  onCanvasConfirm,
  onCanvasClear,
}: {
  def: OpDef;
  digits: OpDigits;
  activeDigit: 0 | 1;
  mode: "numpad" | "canvas";
  canvasKey: number;
  onBoxClick: (i: 0 | 1) => void;
  onCanvasConfirm: (i: 0 | 1, d: string) => void;
  onCanvasClear: (i: 0 | 1) => void;
}) {
  const top = digitDU(def.left);
  const bottom = digitDU(def.right);

  const boxClass = (i: 0 | 1) =>
    ["relsr__detail-box", activeDigit === i ? "relsr__detail-box--active" : ""]
      .filter(Boolean)
      .join(" ");

  return (
    <div
      className="relsr__detail-grid"
      data-left={def.left}
      data-right={def.right}
      data-op={def.op}
    >
      <span />
      <span className="relsr__col-label">D</span>
      <span className="relsr__col-label">U</span>

      <span />
      <span className="relsr__detail-digit">{top.d}</span>
      <span className="relsr__detail-digit">{top.u}</span>

      <span className="relsr__detail-op">{def.op}</span>
      <span className="relsr__detail-digit">{bottom.d}</span>
      <span className="relsr__detail-digit">{bottom.u}</span>

      <span className="relsr__detail-separator" />

      <span />
      {([0, 1] as const).map((i) => {
        const isActive = activeDigit === i;
        const val = digits[i];

        if (mode === "canvas" && isActive) {
          return (
            <LazyDigitCell
              key={`canvas-${i}-${canvasKey}`}
              isActive
              onActivate={() => {}}
              onConfirm={(d) => onCanvasConfirm(i, d)}
              onClear={() => onCanvasClear(i)}
              state="idle"
              value=""
            />
          );
        }

        return (
          <div
            key={i}
            className={boxClass(i)}
            data-digit={i === 0 ? "D" : "U"}
            onClick={() => onBoxClick(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onBoxClick(i)}
          >
            {val || (isActive ? <span className="relsr__cursor">_</span> : "")}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Pantalla principal
// ────────────────────────────────────────────────────────────────

export function RelacionSumaRestaScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const { mode, toggle } = useInputMode();
  const [canvasKey, setCanvasKey] = useState(0);
  const [session, setSession] = useState<SessionState>(() => initSession(difficulty, seed));
  const [finished, setFinished] = useState<{
    total: number;
    correct: number;
    duration: number;
  } | null>(null);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const inDetail = session.detailOp !== null;
  const ops = current ? opsFor(current) : null;

  const gradeAllIfReady = useCallback(
    (digits: AllDigits, done: [boolean, boolean, boolean], alreadyFailed?: boolean) => {
      if (!done.every(Boolean) || !current) return null;
      const results = validateAnswers(current, digitsToInputs(digits));
      const ok = allCorrect(results);
      playFeedback(ok);
      return {
        phase: "graded" as const,
        gradeResults: results,
        answerOk: ok,
        correctDelta: ok && !alreadyFailed ? 1 : 0,
      };
    },
    [current],
  );

  const openDetail = useCallback(
    (opIndex: OpIndex) => {
      if (session.phase === "graded") return;
      const prev = session.digits[opIndex];
      setSession((s) => ({
        ...s,
        detailOp: opIndex,
        detailDigits: [...prev] as OpDigits,
        detailActiveDigit: 1,
      }));
      setCanvasKey((k) => k + 1);
    },
    [session.phase, session.digits],
  );

  const commitDetail = useCallback(
    (newDigits: OpDigits) => {
      if (session.detailOp === null) return;
      const opIndex = session.detailOp;
      const digits: AllDigits = session.digits.map((p) => [...p] as OpDigits) as AllDigits;
      digits[opIndex] = newDigits;
      const done: [boolean, boolean, boolean] = [...session.done];
      done[opIndex] = true;

      const graded = gradeAllIfReady(digits, done, session.alreadyFailed);
      if (graded) {
        setSession((s) => ({
          ...s,
          digits,
          done,
          detailOp: null,
          detailDigits: ["", ""],
          detailActiveDigit: 1,
          phase: graded.phase,
          gradeResults: graded.gradeResults,
          correctCount: s.correctCount + graded.correctDelta,
          alreadyFailed: graded.answerOk ? s.alreadyFailed : true,
        }));
      } else {
        setSession((s) => ({
          ...s,
          digits,
          done,
          detailOp: null,
          detailDigits: ["", ""],
          detailActiveDigit: 1,
        }));
      }
    },
    [session, gradeAllIfReady],
  );

  const handleDetailDigit = useCallback(
    (d: string) => {
      if (session.detailOp === null) return;
      const nd: OpDigits = [...session.detailDigits];
      nd[session.detailActiveDigit] = d;
      if (session.detailActiveDigit === 1) {
        setSession((s) => ({ ...s, detailDigits: nd, detailActiveDigit: 0 }));
      } else {
        commitDetail(nd);
      }
    },
    [session.detailOp, session.detailDigits, session.detailActiveDigit, commitDetail],
  );

  const handleDetailDelete = useCallback(() => {
    if (session.detailOp === null) return;
    const nd: OpDigits = [...session.detailDigits];
    const { detailActiveDigit } = session;
    if (nd[detailActiveDigit]) {
      nd[detailActiveDigit] = "";
      setSession((s) => ({ ...s, detailDigits: nd }));
    } else if (detailActiveDigit === 0) {
      nd[1] = "";
      setSession((s) => ({ ...s, detailDigits: nd, detailActiveDigit: 1 }));
    }
  }, [session]);

  const handleDetailConfirm = useCallback(() => {
    if (session.detailOp === null) return;
    if (session.detailActiveDigit === 1) {
      setSession((s) => ({ ...s, detailActiveDigit: 0 }));
      return;
    }
    if (session.detailDigits.every((x) => x !== "")) {
      commitDetail([...session.detailDigits] as OpDigits);
    }
  }, [session, commitDetail]);

  const handleCanvasConfirm = useCallback(
    (i: 0 | 1, digit: string) => {
      const nd: OpDigits = [...session.detailDigits];
      nd[i] = digit;
      if (i === 1) {
        setSession((s) => ({ ...s, detailDigits: nd, detailActiveDigit: 0 }));
      } else {
        commitDetail(nd);
      }
      setCanvasKey((k) => k + 1);
    },
    [session.detailDigits, commitDetail],
  );

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
        phase: "selecting",
        gradeResults: null,
        digits: emptyDigits(),
        done: [false, false, false],
        detailOp: null,
        detailDigits: ["", ""],
        detailActiveDigit: 1,
        alreadyFailed: false,
      }));
    }
  }, [session, total]);

  /** Reintentar: solo limpia las operaciones incorrectas. */
  const handleRetry = useCallback(() => {
    setSession((s) => {
      if (!s.gradeResults) return s;
      const digits: AllDigits = s.digits.map((p) => [...p] as OpDigits) as AllDigits;
      const done: [boolean, boolean, boolean] = [...s.done];
      s.gradeResults.forEach((ok, i) => {
        if (!ok) {
          digits[i as OpIndex] = ["", ""];
          done[i as OpIndex] = false;
        }
      });
      return {
        ...s,
        phase: "selecting",
        gradeResults: null,
        digits,
        done,
        detailOp: null,
        detailDigits: ["", ""],
        detailActiveDigit: 1,
        alreadyFailed: true,
      };
    });
  }, []);

  useEffect(() => {
    if (session.phase !== "graded" || !session.gradeResults) return;
    if (!allCorrect(session.gradeResults)) return;
    const t = setTimeout(handleNext, 1200);
    return () => clearTimeout(t);
  }, [session.phase, session.gradeResults, handleNext]);

  if (finished) {
    return (
      <SummaryScreen
        result={{ correct: finished.correct, total: finished.total, duration: finished.duration }}
        gradeLabel={gradeTitle ?? ""}
        onRestart={() => {
          setFinished(null);
          setSession(initSession(difficulty, seed));
        }}
        onExit={onExit}
      />
    );
  }

  if (!current || !ops) return null;

  const allOk =
    session.phase === "graded" && session.gradeResults && allCorrect(session.gradeResults);
  const someWrong =
    session.phase === "graded" && session.gradeResults && !allCorrect(session.gradeResults);

  // ── Vista detalle (una operación) ─────────────────────────────
  if (inDetail && session.detailOp !== null) {
    const def = ops[session.detailOp];
    return (
      <div className={`relsr${mode === "canvas" ? " relsr--canvas" : ""}`}>
        <ActivityHeader
          onExit={onExit}
          gradeTitle={gradeTitle}
          className={className}
          unitTitle={activity.title}
          mascotUrl={mascotUrl}
          difficultyStars={difficultyStars}
          progress={`${session.currentIndex + 1}/${total}`}
        >
          <InputModeToggle mode={mode} onToggle={toggle} />
        </ActivityHeader>

        <div
          className={
            mode === "numpad"
              ? "relsr__detail relsr__detail--numpad"
              : "relsr__detail relsr__detail--canvas"
          }
        >
          <div className="relsr__detail-stage">
            <DetailGrid
              def={def}
              digits={session.detailDigits}
              activeDigit={session.detailActiveDigit}
              mode={mode}
              canvasKey={canvasKey}
              onBoxClick={(i) => {
                const nd: OpDigits = [...session.detailDigits];
                nd[i] = "";
                setSession((s) => ({ ...s, detailActiveDigit: i, detailDigits: nd }));
              }}
              onCanvasConfirm={handleCanvasConfirm}
              onCanvasClear={(i) => {
                const nd: OpDigits = [...session.detailDigits];
                nd[i] = "";
                setSession((s) => ({ ...s, detailDigits: nd }));
              }}
            />
          </div>

          {mode === "numpad" && (
            <footer className="relsr__detail-footer">
              <Numpad
                onDigit={handleDetailDigit}
                onDelete={handleDetailDelete}
                onConfirm={handleDetailConfirm}
                disabled={false}
              />
            </footer>
          )}
        </div>
      </div>
    );
  }

  // ── Vista overview (3 operaciones) ────────────────────────────
  return (
    <div className="relsr">
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div
        className={`relsr__overview${allOk ? " relsr__overview--correct" : ""}${someWrong ? " relsr__overview--wrong" : ""}`}
      >
        {allOk && (
          <div className="relsr__celebration" aria-live="polite">
            ¡Muy bien! ⭐
          </div>
        )}

        <p className="relsr__intro">
          Total {current.total}: partes {current.partA} y {current.partB}{" "}
          <span className="relsr__hint">(selecciónalas de una en una)</span>
        </p>

        <div className="relsr__ops">
          {ops.map((def, i) => {
            const idx = i as OpIndex;
            const grade =
              session.phase === "graded" && session.gradeResults ? session.gradeResults[idx] : null;
            return (
              <OverviewOp
                key={idx}
                def={def}
                digits={session.digits[idx]}
                done={session.done[idx]}
                grade={grade}
                selectable={session.phase === "selecting"}
                onSelect={() => openDetail(idx)}
              />
            );
          })}
        </div>

        {someWrong && (
          <div className="relsr__actions">
            <ActionButtons onRetry={handleRetry} onNext={handleNext} />
          </div>
        )}
      </div>
    </div>
  );
}
