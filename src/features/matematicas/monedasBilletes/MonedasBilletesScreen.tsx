import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatearCentes,
  generateSession,
  pagoExacto,
  totalCesta,
  validateAnswer,
} from "../../../core/activities/monedasBilletes";
import type {
  ChangeExercise,
  MoneyItem,
  MonedasChoiceExercise,
  MonedasExercise,
  ShoppingExercise,
} from "../../../core/activities/monedasBilletes";
import type { EngineScreenProps } from "../engine-screens";
import { SummaryScreen, type SessionResult } from "../components/SummaryScreen";
import { ActivityHeader } from "../components/ActivityHeader";
import { ActionButtons } from "../components/ActivityActionButtons";
import { NoExerciseNotice } from "../components/NoExerciseNotice";
import { playFeedback } from "../../shared/audioFeedback";
import { moneyImageUrl } from "./moneyImages";
import "../operations/OperationsScreen.css";
import "./MonedasBilletesScreen.css";

type AnswerState = "idle" | "correct" | "wrong";

/** El salto de nivel, como el tiempo que se tarda en leer el «¡Correcto!». */
const AUTOAVANCE_MS = 1200;

interface SessionState {
  exercises: MonedasExercise[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
  answerState: AnswerState;
  /** Opción pulsada, para pintarla. `null` mientras no se ha contestado. */
  selected: string | null;
  /** Ya se falló este ejercicio: acertar después ya no suma a la cuenta. */
  alreadyFailed: boolean;
}

/** Una moneda o un billete, con su imagen y su nombre accesible. */
function Dinero({ item, className }: { item: MoneyItem; className: string }) {
  return (
    <img
      src={moneyImageUrl(item)}
      alt={item.etiqueta}
      className={`${className} ${item.tipo === "billete" ? "mon__img--billete" : "mon__img--moneda"}`}
      title={item.etiqueta}
    />
  );
}

/** Fila de monedas o billetes, sin el valor escrito debajo (ver el módulo). */
function FilaDinero({ items, className }: { items: readonly MoneyItem[]; className: string }) {
  return (
    <div className={className}>
      {items.map((item, i) => (
        <Dinero key={`${item.fichero}-${i}`} item={item} className="mon__img--fila" />
      ))}
    </div>
  );
}

/** Los tres tipos de opción múltiple: enunciado, imagen y cuatro botones. */
function ConOpciones({
  exercise,
  answer,
  selected,
  answerState,
  onAnswer,
}: {
  exercise: MonedasChoiceExercise;
  answer: string;
  selected: string | null;
  answerState: AnswerState;
  onAnswer: (value: string) => void;
}) {
  return (
    <>
      <p className="mon__enunciado">{exercise.question}</p>

      {exercise.type === "identify" && (
        <div className="mon__escenario">
          <Dinero item={exercise.item} className="mon__img--grande" />
        </div>
      )}

      {exercise.type === "equivalence" && (
        <FilaDinero items={exercise.items} className="mon__fila" />
      )}

      {exercise.type === "change" && <Vuelta exercise={exercise} />}

      <div className="mon__opciones">
        {exercise.options.map((opcion) => {
          const clase =
            answerState === "correct" && opcion === answer
              ? " mon__opcion--correcta"
              : answerState === "wrong" && opcion === selected
                ? " mon__opcion--fallada"
                : "";
          return (
            <button
              key={opcion}
              type="button"
              data-value={opcion}
              className={`mon__opcion${clase}`}
              disabled={answerState !== "idle"}
              onClick={() => onAnswer(opcion)}
            >
              {opcion}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** La tarjeta del producto y el dinero que se entrega, con sus imágenes. */
function Vuelta({ exercise }: { exercise: ChangeExercise }) {
  return (
    <div className="mon__tarjeta">
      <div className="mon__producto">
        <span className="mon__producto-emoji" aria-hidden="true">
          {exercise.producto.emoji}
        </span>
        <span className="mon__producto-nombre">{exercise.producto.nombre}</span>
        <span className="mon__producto-precio">
          Precio: <strong>{exercise.precioLabel}</strong>
        </span>
      </div>

      <div className="mon__pago">
        <span className="mon__pago-titulo">Pagas</span>
        {/* El dinero que se entrega, no solo su cantidad en texto: sin él, la
         * pregunta del cambio no tiene el dato a la vista. */}
        <FilaDinero items={exercise.pagado} className="mon__fila mon__fila--pagada" />
        <span className="mon__pago-total">{exercise.pagadoLabel}</span>
      </div>
    </div>
  );
}

/**
 * "Monedas y billetes" — reconocer el dinero, sumarlo y pagar.
 *
 * El enunciado y los datos salen del núcleo, donde están anotadas las diferencias
 * con el renderer de Electron. Aquí se compone, y son dos las correcciones que
 * son de pantalla:
 *
 * 1. **En la equivalencia no se escribe el valor debajo de cada moneda.** El
 *    original lo hacía, con lo que sumar era leer.
 * 2. **Los billetes no se recortan.** El original los pintaba con
 *    `object-fit: cover` en una caja de 220×120, más ancha que alta, y el
 *    recorte se comía los bordes de los billetes. Aquí es `contain`.
 *
 * El nivel experto no se contesta eligiendo: se paga el precio exacto con el
 * dinero disponible, y la pantalla da el acierto en cuanto la suma da el precio.
 */
export function MonedasBilletesScreen({
  activity,
  difficulty,
  seed,
  onExit,
  gradeTitle,
  className,
  mascotUrl,
  difficultyStars,
}: EngineScreenProps) {
  const [sessionSeed] = useState(seed);
  const [session, setSession] = useState<SessionState>(() => ({
    exercises: generateSession(difficulty, sessionSeed),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
    answerState: "idle",
    selected: null,
    alreadyFailed: false,
  }));
  const [finished, setFinished] = useState<SessionResult | null>(null);
  /** Lo que lleva puesto en la cesta del nivel experto. */
  const [cesta, setCesta] = useState<MoneyItem[]>([]);

  const current = session.exercises[session.currentIndex];
  const total = session.exercises.length;
  const totalCestaActual = useMemo(() => totalCesta(cesta), [cesta]);

  /** Puntúa la respuesta y la pinta. La usan tanto las opciones como la compra. */
  const responder = useCallback((ok: boolean, seleccion: string | null) => {
    playFeedback(ok);
    setSession((s) => ({
      ...s,
      answerState: ok ? "correct" : "wrong",
      selected: seleccion,
      correctCount: ok && !s.alreadyFailed ? s.correctCount + 1 : s.correctCount,
    }));
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      if (session.answerState !== "idle" || !current || current.type === "shopping") return;
      responder(validateAnswer(current, value), value);
    },
    [session.answerState, current, responder],
  );

  /**
   * Pone una pieza en la cesta y da el acierto si con ella ya se paga el precio
   * exacto.
   *
   * El nivel experto no tiene botón de «enviar»: no hay forma de pagar de más, y
   * la comprobación va en el gesto del niño —cada moneda que elige— en vez de en
   * un efecto aparte, que además avisaría dos veces.
   */
  const ponerEnLaCesta = useCallback(
    (item: MoneyItem) => {
      if (session.answerState !== "idle" || !current || current.type !== "shopping") return;
      const nuevoTotal = totalCestaActual + item.valor;
      setCesta((c) => [...c, item]);
      if (pagoExacto(current, nuevoTotal)) responder(true, null);
    },
    [session.answerState, current, totalCestaActual, responder],
  );

  const handleRetry = useCallback(() => {
    setCesta([]);
    setSession((s) => ({ ...s, answerState: "idle", selected: null, alreadyFailed: true }));
  }, []);

  const handleNext = useCallback(() => {
    setCesta([]);
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
        selected: null,
        alreadyFailed: false,
      }));
    }
  }, [session.currentIndex, session.correctCount, session.startTime, total]);

  // Al acertar se pasa solo; al fallar no, porque el niño tiene que decidir si
  // reintenta o sigue con el botón.
  useEffect(() => {
    if (session.answerState !== "correct") return;
    const t = setTimeout(handleNext, AUTOAVANCE_MS);
    return () => clearTimeout(t);
  }, [session.answerState, handleNext]);

  const handleRestart = useCallback(() => {
    setFinished(null);
    setCesta([]);
    setSession({
      // La misma semilla: "Repetir" da la misma hoja, no una tirada nueva.
      exercises: generateSession(difficulty, sessionSeed),
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
      answerState: "idle",
      selected: null,
      alreadyFailed: false,
    });
  }, [difficulty, sessionSeed]);

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

  if (!current) {
    return <NoExerciseNotice activityTitle={activity.title} onExit={onExit} />;
  }

  const stageClass =
    session.answerState === "correct"
      ? "ops__stage--correct"
      : session.answerState === "wrong"
        ? "ops__stage--wrong"
        : "";
  return (
    <div className={`ops mon mon--${difficulty}`}>
      <ActivityHeader
        onExit={onExit}
        gradeTitle={gradeTitle}
        className={className}
        unitTitle={activity.title}
        difficultyStars={difficultyStars}
        mascotUrl={mascotUrl}
        progress={`${session.currentIndex + 1}/${total}`}
      />

      <div className={`ops__stage ${stageClass}`}>
        {session.answerState === "correct" && (
          <div
            className={`ops__celebration${
              difficulty === "expert" ? " activity-celebration--inline" : ""
            }`}
          >
            ¡Correcto! 💰⭐
          </div>
        )}

        {current.type === "shopping" ? (
          <Compra
            exercise={current}
            cesta={cesta}
            totalCesta={totalCestaActual}
            sobra={totalCestaActual > current.precio}
            bloqueada={session.answerState !== "idle"}
            onElegir={ponerEnLaCesta}
            onQuitarUltima={() => setCesta((c) => c.slice(0, -1))}
            onLimpiar={() => setCesta([])}
          />
        ) : (
          <ConOpciones
            exercise={current}
            answer={current.answer}
            selected={session.selected}
            answerState={session.answerState}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      <footer className="ops__footer">
        {session.answerState === "wrong" && (
          <ActionButtons onRetry={handleRetry} onNext={handleNext} />
        )}
      </footer>
    </div>
  );
}

/** El nivel experto: la tienda. */
function Compra({
  exercise,
  cesta,
  totalCesta,
  sobra,
  bloqueada,
  onElegir,
  onQuitarUltima,
  onLimpiar,
}: {
  exercise: ShoppingExercise;
  cesta: readonly MoneyItem[];
  totalCesta: number;
  sobra: boolean;
  bloqueada: boolean;
  onElegir: (item: MoneyItem) => void;
  onQuitarUltima: () => void;
  onLimpiar: () => void;
}) {
  return (
    <>
      <div className="mon__tarjeta">
        <div className="mon__producto">
          <span className="mon__producto-emoji" aria-hidden="true">
            {exercise.producto.emoji}
          </span>
          <span className="mon__producto-nombre">{exercise.producto.nombre}</span>
          <span className="mon__producto-precio">
            Precio: <strong>{exercise.precioLabel}</strong>
          </span>
        </div>
      </div>

      <p className="mon__enunciado">Selecciona el dinero para pagar el precio exacto:</p>

      <div className="mon__monedero">
        {exercise.disponibles.map((item) => (
          <button
            key={`${item.tipo}-${item.fichero}`}
            type="button"
            data-value={item.corta}
            className="mon__moneda"
            disabled={bloqueada}
            onClick={() => onElegir(item)}
          >
            <Dinero item={item} className="mon__img--monedero" />
            <span className="mon__moneda-corta">{item.corta}</span>
          </button>
        ))}
      </div>

      <div className="mon__cesta">
        <div className="mon__cesta-piezas">
          {cesta.length === 0 ? (
            <span className="mon__cesta-vacia">No has puesto nada todavía</span>
          ) : (
            <FilaDinero items={cesta} className="mon__fila mon__fila--cesta" />
          )}
        </div>

        <div className="mon__cesta-pie">
          <span className={`mon__cesta-total${sobra ? " mon__cesta-total--sobra" : ""}`}>
            Total: {formatearCentes(totalCesta)}
            {sobra && " — ¡te has pasado!"}
          </span>
          <div className="mon__cesta-botones">
            <button
              type="button"
              className="mon__cesta-btn"
              onClick={onQuitarUltima}
              disabled={cesta.length === 0 || bloqueada}
            >
              Quitar la última
            </button>
            <button
              type="button"
              className="mon__cesta-btn"
              onClick={onLimpiar}
              disabled={cesta.length === 0 || bloqueada}
            >
              Vaciar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
