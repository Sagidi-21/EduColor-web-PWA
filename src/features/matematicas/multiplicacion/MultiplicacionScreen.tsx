import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CHOICE_SESSION_SCREENS,
  generateChoiceSession,
  generateMatchSession,
  generateSession,
  validateAnswer,
} from "../../../core/activities/multiplicacion";
import type {
  MatchPair,
  MatchSession,
  MultiplicacionExercise,
  MultiplicacionSession,
} from "../../../core/activities/multiplicacion";
import type { EngineScreenProps } from "../engine-screens";
import { MatchColumns, type MatchReport } from "../components/MatchColumns";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import InputModeToggle from "../../shared/components/InputModeToggle";
import { Numpad } from "../../shared/components/Numpad";
import { LazyDigitCell } from "../../shared/DigitCell";
import { useInputMode } from "../../shared/hooks/useInputMode";
import "./MultiplicacionScreen.css";

/**
 * "Multiplicamos" (2.º de Primaria).
 *
 * Easy/medium: unir columnas en filas. Hard/expert: seis pantallas × tres
 * operaciones (2/3 tablero · 1/3 numpad o canvas); hard con apoyo visual.
 */

const WRITE_CHEER_MS = 1100;

type CardStatus = "idle" | "correct" | "wrong";

function digitCount(n: number): number {
  return String(n).length;
}

function emptyDigits(exercises: MultiplicacionExercise[]): string[][] {
  return exercises.map((ex) => Array.from({ length: digitCount(ex.correctAnswer) }, () => ""));
}
export function MultiplicacionScreen(props: EngineScreenProps) {
  const { difficulty, seed } = props;
  const [session] = useState<MultiplicacionSession>(() => generateSession(difficulty, seed));
  /** Semilla de la tanda: "Repetir" la reutiliza para dar la misma hoja. */
  const [sessionSeed] = useState(seed);

  return session.mode === "match" ? (
    <MatchMode {...props} sesion={session} sessionSeed={sessionSeed} />
  ) : (
    <ChoiceMode {...props} pantallas={session.screens} sessionSeed={sessionSeed} />
  );
}

/** Cómo se le pasa una semilla a la parte que rehace la hoja al repetir. */
interface ModoProps extends EngineScreenProps {
  sessionSeed: number;
}

function MatchMode(props: ModoProps & { sesion: MatchSession }) {
  const { activity, onExit, gradeTitle, className, mascotUrl, difficultyStars } = props;
  const { sesion, sessionSeed, difficulty } = props;
  const [regenerado, setRegenerado] = useState(() => sesion);
  /**
   * Cuántas veces se ha repetido, para que la hoja se remonten.
   *
   * El `key` del emparejador no puede basta con los `id` de las parejas: al
   * repetir se regenera la hoja con la misma semilla, así que los ids son los
   * mismos y React no lo remontaría. Sin remontar, el emparejador conserva el
   * aviso de "ya completada" y la segunda hoja nunca llegaría al resumen.
   */
  const [repeticiones, setRepeticiones] = useState(0);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [startTime] = useState(() => Date.now());
  /** Tras un fallo en easy/medium: Reintentar limpia; Siguiente va al resumen. */
  const [showWrongActions, setShowWrongActions] = useState(false);
  const [clearWrongKey, setClearWrongKey] = useState(0);
  const [lastWrongReport, setLastWrongReport] = useState<MatchReport | null>(null);

  const handleComplete = useCallback(
    (report: MatchReport) => {
      setShowWrongActions(false);
      setFinished({
        // Una unión solo cuenta si se acertó a la primera. Las falladas parpadean
        // y luego se rehacen, así que contar las unidas daría siempre la nota
        // perfecta.
        correct: report.aciertos,
        total: report.total,
        duration: Date.now() - startTime,
      });
    },
    [startTime],
  );

  const handleRestart = useCallback(() => {
    setFinished(null);
    setShowWrongActions(false);
    setLastWrongReport(null);
    setClearWrongKey(0);
    setRepeticiones((n) => n + 1);
    setRegenerado(generateMatchSession(difficulty, sessionSeed));
  }, [difficulty, sessionSeed]);

  const handleWrongRetry = useCallback(() => {
    setClearWrongKey((k) => k + 1);
    setShowWrongActions(false);
  }, []);

  const handleWrongNext = useCallback(() => {
    const report = lastWrongReport;
    setShowWrongActions(false);
    setFinished({
      correct: report?.aciertos ?? 0,
      total: report?.total ?? regenerado.pairs.length,
      duration: Date.now() - startTime,
    });
  }, [lastWrongReport, regenerado.pairs.length, startTime]);

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

  return (
    <div className="mul">
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        className={className}
        progress="1/1"
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      />

      <main className="mul__main">
        <p className="mul__instruction">
          Toca una operación y luego el producto que le corresponde
        </p>

        <MatchColumns<MatchPair>
          key={`${repeticiones}-${regenerado.pairs.map((p) => p.id).join("-")}`}
          prefix="mul"
          layout="rows"
          holdWrong
          clearWrongKey={clearWrongKey}
          leftClass="mul__item--op"
          rightClass="mul__item--res"
          left={regenerado.leftColumn}
          right={regenerado.rightColumn}
          renderLeft={(pair) => (
            <span className="mul__op">
              {pair.table} × {pair.factor}
            </span>
          )}
          renderRight={(pair) => <span className="mul__res">{pair.product}</span>}
          onWrong={(report) => {
            setLastWrongReport(report);
            setShowWrongActions(true);
          }}
          onComplete={handleComplete}
        />

        {showWrongActions && (
          <div className="mul__match-actions">
            <ActionButtons onRetry={handleWrongRetry} onNext={handleWrongNext} />
          </div>
        )}
      </main>
    </div>
  );
}

function ChoiceMode(props: ModoProps & { pantallas: MultiplicacionExercise[][] }) {
  const { activity, onExit, gradeTitle, className, mascotUrl, difficultyStars } = props;
  const { pantallas: iniciales, sessionSeed, difficulty } = props;
  const { mode, toggle } = useInputMode();
  const showVisual = difficulty === "hard";

  const [pantallas, setPantallas] = useState(iniciales);
  const [indice, setIndice] = useState(0);
  const [acertadas, setAcertadas] = useState(0);
  const exercises = useMemo(() => pantallas[indice] ?? [], [pantallas, indice]);

  const [digits, setDigits] = useState(() => emptyDigits(exercises));
  const [status, setStatus] = useState<CardStatus[]>(() => exercises.map(() => "idle"));
  const [failedOnce, setFailedOnce] = useState(() => exercises.map(() => false));
  const [active, setActive] = useState<{ ei: number; di: number } | null>(() =>
    exercises.length > 0 ? { ei: 0, di: 0 } : null,
  );
  const [phase, setPhase] = useState<"idle" | "wrong" | "done">("idle");
  /** Tras celebrar una pantalla: avanzar o ir al resumen. */
  const [pendingAdvance, setPendingAdvance] = useState<{
    nextIndex: number;
    score: number;
  } | null>(null);
  const [startTime] = useState(() => Date.now());
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  const resetScreen = useCallback((lista: MultiplicacionExercise[]) => {
    setDigits(emptyDigits(lista));
    setStatus(lista.map(() => "idle"));
    setFailedOnce(lista.map(() => false));
    setActive(lista.length > 0 ? { ei: 0, di: 0 } : null);
    setPhase("idle");
    setPendingAdvance(null);
    setCanvasKey((k) => k + 1);
  }, []);

  const selectCell = useCallback(
    (ei: number, di: number) => {
      if (phase !== "idle" || status[ei] === "correct") return;
      setActive({ ei, di });
      if (mode === "canvas") setCanvasKey((k) => k + 1);
    },
    [phase, status, mode],
  );

  const writeDigit = useCallback(
    (digit: string) => {
      if (phase !== "idle" || !active) return;
      const { ei, di } = active;
      if (status[ei] === "correct") return;
      const ex = exercises[ei];
      if (!ex) return;
      setDigits((prev) => {
        const next = prev.map((row) => [...row]);
        next[ei]![di] = digit;
        return next;
      });
      const len = digitCount(ex.correctAnswer);
      if (di + 1 < len) setActive({ ei, di: di + 1 });
    },
    [phase, active, status, exercises],
  );

  const handleDelete = useCallback(() => {
    if (phase !== "idle" || !active) return;
    const { ei, di } = active;
    if (status[ei] === "correct") return;
    setDigits((prev) => {
      const next = prev.map((row) => [...row]);
      const row = next[ei]!;
      if (row[di]) {
        row[di] = "";
      } else if (di > 0) {
        row[di - 1] = "";
        setActive({ ei, di: di - 1 });
      }
      return next;
    });
  }, [phase, active, status]);

  const handleConfirm = useCallback(() => {
    if (phase !== "idle") return;

    let anyWrong = false;
    let newlyCorrect = 0;
    const nextStatus = [...status];
    const nextFailed = [...failedOnce];

    for (let ei = 0; ei < exercises.length; ei++) {
      if (nextStatus[ei] === "correct") continue;
      const row = digits[ei]!;
      if (row.some((d) => d === "")) continue;
      const value = Number(row.join(""));
      const ok = validateAnswer(exercises[ei]!, value);
      if (ok) {
        nextStatus[ei] = "correct";
        newlyCorrect++;
      } else {
        nextStatus[ei] = "wrong";
        nextFailed[ei] = true;
        anyWrong = true;
      }
    }

    if (newlyCorrect === 0 && !anyWrong) return;

    setStatus(nextStatus);
    setFailedOnce(nextFailed);

    const allDone = nextStatus.every((s) => s === "correct");
    if (allDone) {
      playFeedback(true);
      const perfecta = nextFailed.every((f) => !f);
      const score = perfecta ? acertadas + 1 : acertadas;
      setAcertadas(score);
      setPendingAdvance({ nextIndex: indice + 1, score });
      setPhase("done");
      return;
    }
    if (anyWrong) {
      playFeedback(false);
      setPhase("wrong");
      setActive(null);
    } else if (newlyCorrect > 0) {
      playFeedback(true);
      const nextIdle = nextStatus.findIndex((s) => s === "idle");
      if (nextIdle >= 0) setActive({ ei: nextIdle, di: 0 });
    }
  }, [phase, status, failedOnce, exercises, digits, acertadas, indice]);

  const handleCanvasConfirm = useCallback(
    (digit: number) => {
      writeDigit(String(digit));
      setCanvasKey((k) => k + 1);
    },
    [writeDigit],
  );

  const handleRetry = useCallback(() => {
    setDigits((prev) => prev.map((row, ei) => (status[ei] === "wrong" ? row.map(() => "") : row)));
    setStatus((prev) => prev.map((s) => (s === "wrong" ? "idle" : s)));
    setPhase("idle");
    const first = status.findIndex((s) => s === "wrong" || s === "idle");
    const ei = first >= 0 ? first : 0;
    setActive({ ei, di: 0 });
  }, [status]);

  /** Siguiente abandona con la puntuación ya acumulada. */
  const handleSkip = useCallback(() => {
    setFinished({
      total: CHOICE_SESSION_SCREENS,
      correct: acertadas,
      duration: Date.now() - startTime,
    });
  }, [acertadas, startTime]);

  useEffect(() => {
    if (phase !== "done" || !pendingAdvance) return;
    const { nextIndex, score } = pendingAdvance;
    const t = setTimeout(() => {
      if (nextIndex >= CHOICE_SESSION_SCREENS) {
        setFinished({
          total: CHOICE_SESSION_SCREENS,
          correct: score,
          duration: Date.now() - startTime,
        });
        return;
      }
      const siguiente = pantallas[nextIndex] ?? [];
      setIndice(nextIndex);
      resetScreen(siguiente);
    }, WRITE_CHEER_MS);
    return () => clearTimeout(t);
  }, [phase, pendingAdvance, pantallas, startTime, resetScreen]);

  const handleRestart = useCallback(() => {
    const nuevas = generateChoiceSession(difficulty, sessionSeed);
    setFinished(null);
    setPantallas(nuevas);
    setIndice(0);
    setAcertadas(0);
    resetScreen(nuevas[0] ?? []);
  }, [difficulty, sessionSeed, resetScreen]);

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

  if (exercises.length === 0) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const bodyClass =
    phase === "done" ? " mul__write--correct" : phase === "wrong" ? " mul__write--wrong" : "";

  return (
    <div className="mul mul--write">
      <ActivityHeader
        unitTitle={activity.title}
        gradeTitle={gradeTitle}
        className={className}
        progress={`${indice + 1}/${CHOICE_SESSION_SCREENS}`}
        onExit={onExit}
        mascotUrl={mascotUrl}
        difficultyStars={difficultyStars}
      >
        {/* Misma ubicación que La suma / OperationsScreen: centro de la cabecera. */}
        <InputModeToggle mode={mode} onToggle={toggle} />
      </ActivityHeader>

      <div className={`mul__write${bodyClass}`}>
        <div className="mul__write-board">
          <p className="mul__write-hint">Selecciona la casilla para escribir en ella</p>
          <div className="mul__cards" key={indice}>
            {/* Fórmulas arriba (2); count-groups siempre abajo a ancho completo. */}
            {[...exercises.map((ex, ei) => ({ ex, ei }))]
              .sort((a, b) => {
                const aText = a.ex.type === "count-groups" ? 1 : 0;
                const bText = b.ex.type === "count-groups" ? 1 : 0;
                return aText - bText;
              })
              .map(({ ex, ei }, order) => {
                const isText = ex.type === "count-groups";
                const formulaCount = exercises.filter((e) => e.type !== "count-groups").length;
                const isLoneBottom = !isText && order === formulaCount - 1 && formulaCount === 3;
                return (
                  <OperationCard
                    key={`${indice}-${ex.type}-${ex.a}-${ex.b}-${ei}`}
                    ex={ex}
                    digits={digits[ei]!}
                    status={status[ei]!}
                    activeDigit={active?.ei === ei ? active.di : null}
                    showVisual={showVisual && ex.type === "product"}
                    wide={isText}
                    loneBottom={isLoneBottom}
                    onSelectDigit={(di) => selectCell(ei, di)}
                  />
                );
              })}
          </div>
        </div>

        <aside className="mul__write-panel">
          {phase === "done" && (
            <div className="mul__cheer" role="status">
              ¡Correcto! ⭐
            </div>
          )}
          {phase === "wrong" ? (
            <ActionButtons onRetry={handleRetry} onNext={handleSkip} />
          ) : phase === "idle" || phase === "done" ? (
            mode === "numpad" ? (
              <Numpad
                onDigit={writeDigit}
                onDelete={handleDelete}
                onConfirm={handleConfirm}
                disabled={!active || phase === "done"}
              />
            ) : (
              <LazyDigitCell
                key={`mul-canvas-${indice}-${active?.ei}-${active?.di}-${canvasKey}`}
                isActive={Boolean(active) && phase === "idle"}
                onActivate={() => {}}
                onConfirm={handleCanvasConfirm}
                onClear={() => {}}
                state="idle"
                value=""
              />
            )
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function OperationCard({
  ex,
  digits,
  status,
  activeDigit,
  showVisual,
  wide,
  loneBottom,
  onSelectDigit,
}: {
  ex: MultiplicacionExercise;
  digits: string[];
  status: CardStatus;
  activeDigit: number | null;
  showVisual: boolean;
  wide?: boolean;
  loneBottom?: boolean;
  onSelectDigit: (di: number) => void;
}) {
  const boxes = (
    <span className="mul__answer-slots">
      {digits.map((d, di) => (
        <button
          key={di}
          type="button"
          className={[
            "mul__digit",
            activeDigit === di && status === "idle" ? "mul__digit--active" : "",
            status === "correct" ? "mul__digit--correct" : "",
            status === "wrong" ? "mul__digit--wrong" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={status === "correct" || status === "wrong"}
          onClick={() => onSelectDigit(di)}
        >
          {d || ""}
        </button>
      ))}
    </span>
  );

  let expression: ReactNode;
  if (ex.type === "product") {
    expression = (
      <>
        <span className="mul__token">{ex.a}</span>
        <span className="mul__token">×</span>
        <span className="mul__token">{ex.b}</span>
        <span className="mul__token">=</span>
        {boxes}
      </>
    );
  } else if (ex.type === "missing-factor-b") {
    expression = (
      <>
        <span className="mul__token">{ex.a}</span>
        <span className="mul__token">×</span>
        {boxes}
        <span className="mul__token">=</span>
        <span className="mul__token">{ex.result}</span>
      </>
    );
  } else if (ex.type === "missing-factor-a") {
    expression = (
      <>
        {boxes}
        <span className="mul__token">×</span>
        <span className="mul__token">{ex.b}</span>
        <span className="mul__token">=</span>
        <span className="mul__token">{ex.result}</span>
      </>
    );
  } else {
    expression = (
      <>
        <span className="mul__card-q">{ex.question}</span>
        {boxes}
      </>
    );
  }

  return (
    <div
      className={[
        "mul__card",
        wide ? "mul__card--wide" : "",
        loneBottom ? "mul__card--lone-bottom" : "",
        status === "correct" ? "mul__card--correct" : "",
        status === "wrong" ? "mul__card--wrong" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mul__card-expr">{expression}</div>
      {showVisual && (
        <div className="mul__groups mul__groups--card" aria-hidden="true">
          {Array.from({ length: ex.a }).map((_, g) => (
            <div key={`g-${g}`} className="mul__group">
              {Array.from({ length: ex.b }).map((_, d) => (
                <span key={`d-${g}-${d}`} className="mul__dot" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
