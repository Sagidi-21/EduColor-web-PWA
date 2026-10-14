import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
import mostradorCenitalUrl from "../../../assets/dinero/mostrador-cenital.webp";
import "../operations/OperationsScreen.css";
import "./MonedasBilletesScreen.css";

/** Zoom del `body` (la app lo pone a 1.5 por defecto). */
function bodyZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.body).zoom) || 1;
}

/** Inclinación fija por pieza, para que no se vean en rejilla militar. */
function inclinacionDe(clave: string): number {
  let h = 0;
  for (let i = 0; i < clave.length; i++) h = (h * 31 + clave.charCodeAt(i)) | 0;
  return (h % 7) - 3;
}

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

  /** Devuelve una pieza concreta de la zona de pago al monedero. */
  const quitarDeLaCesta = useCallback(
    (index: number) => {
      if (session.answerState !== "idle") return;
      setCesta((c) => c.filter((_, i) => i !== index));
    },
    [session.answerState],
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
        {session.answerState === "correct" && current.type !== "shopping" && (
          <div className="ops__celebration">¡Correcto! 💰⭐</div>
        )}

        {current.type === "shopping" ? (
          <MostradorExpert
            exercise={current}
            cesta={cesta}
            totalCesta={totalCestaActual}
            sobra={totalCestaActual > current.precio}
            exacto={pagoExacto(current, totalCestaActual)}
            bloqueada={session.answerState !== "idle"}
            celebrando={session.answerState === "correct"}
            onElegir={ponerEnLaCesta}
            onQuitar={quitarDeLaCesta}
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

type ZonaMostrador = "monedero" | "pago";

interface DragMostrador {
  from: ZonaMostrador;
  /** Índice en `disponibles` (monedero) o en `cesta` (pago). */
  index: number;
  item: MoneyItem;
  dx: number;
  dy: number;
}

const ENUNCIADO_EXPERT = "Separa el dinero suficiente para pagar el precio exacto.";
const DRAG_TAP_PX = 10;

/**
 * Nivel experto: foto cenital anclada abajo, franja blanca arriba y dos zonas
 * sobre la madera (monedero ↔ pago) con arrastre o toque.
 */
function MostradorExpert({
  exercise,
  cesta,
  totalCesta,
  sobra,
  exacto,
  bloqueada,
  celebrando,
  onElegir,
  onQuitar,
}: {
  exercise: ShoppingExercise;
  cesta: readonly MoneyItem[];
  totalCesta: number;
  sobra: boolean;
  exacto: boolean;
  bloqueada: boolean;
  celebrando: boolean;
  onElegir: (item: MoneyItem) => void;
  onQuitar: (index: number) => void;
}) {
  const monederoRef = useRef<HTMLDivElement>(null);
  const pagoRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMostrador | null>(null);
  const dragRef = useRef<{
    from: ZonaMostrador;
    index: number;
    item: MoneyItem;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  /** Tras un arrastre, el `click` sintético no debe mover otra vez la pieza. */
  const suppressClickRef = useRef(false);

  const zonaBajoPuntero = useCallback((clientX: number, clientY: number): ZonaMostrador | null => {
    const hit = (el: HTMLDivElement | null): boolean => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    };
    if (hit(pagoRef.current)) return "pago";
    if (hit(monederoRef.current)) return "monedero";
    return null;
  }, []);

  const startDrag = useCallback(
    (from: ZonaMostrador, index: number, item: MoneyItem, e: ReactPointerEvent) => {
      if (bloqueada) return;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        from,
        index,
        item,
        originX: e.clientX,
        originY: e.clientY,
        moved: false,
      };
      setDrag({ from, index, item, dx: 0, dy: 0 });
    },
    [bloqueada],
  );

  const onMove = useCallback((e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const z = bodyZoom();
    const dx = (e.clientX - d.originX) / z;
    const dy = (e.clientY - d.originY) / z;
    if (Math.hypot(dx, dy) > DRAG_TAP_PX) d.moved = true;
    setDrag({ from: d.from, index: d.index, item: d.item, dx, dy });
  }, []);

  const onUp = useCallback(
    (e: ReactPointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d || bloqueada) return;
      // Sin movimiento: el `click` del botón hace de toque de respaldo.
      if (!d.moved) return;

      suppressClickRef.current = true;
      const destino = zonaBajoPuntero(e.clientX, e.clientY);
      if (d.from === "monedero" && destino === "pago") onElegir(d.item);
      else if (d.from === "pago" && destino === "monedero") onQuitar(d.index);
    },
    [bloqueada, onElegir, onQuitar, zonaBajoPuntero],
  );

  const onTap = useCallback(
    (from: ZonaMostrador, index: number, item: MoneyItem) => {
      if (bloqueada) return;
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (from === "monedero") onElegir(item);
      else onQuitar(index);
    },
    [bloqueada, onElegir, onQuitar],
  );

  const totalClase = exacto
    ? " mon__mostrador-total--exacto"
    : sobra
      ? " mon__mostrador-total--sobra"
      : "";

  return (
    <div className="mon__mostrador">
      <div className="mon__mostrador-franja">
        {celebrando && (
          <div className="ops__celebration activity-celebration--inline">¡Correcto! 💰⭐</div>
        )}
        <p className="mon__enunciado mon__enunciado--expert">{ENUNCIADO_EXPERT}</p>
      </div>

      <div className="mon__mostrador-escena">
        <div
          className="mon__mostrador-foto"
          style={{ backgroundImage: `url(${mostradorCenitalUrl})` }}
          role="img"
          aria-label="Mostrador visto desde arriba"
        />

        <div className="mon__mostrador-mesa">
          <div className="mon__mostrador-producto">
            <span className="mon__mostrador-emoji" aria-hidden="true">
              {exercise.producto.emoji}
            </span>
            <span className="mon__producto-nombre">{exercise.producto.nombre}</span>
            <span className="mon__mostrador-precio">{exercise.precioLabel}</span>
          </div>

          <div className="mon__mostrador-zonas">
            <div ref={monederoRef} className="mon__zona mon__zona--monedero" data-zona="monedero">
              <span className="mon__zona-titulo">Tu dinero</span>
              <div className="mon__zona-piezas">
                {exercise.disponibles.map((item, i) => {
                  const arrastrando = drag?.from === "monedero" && drag.index === i;
                  const rot = inclinacionDe(`${item.fichero}-${i}`);
                  return (
                    <button
                      key={`${item.tipo}-${item.fichero}`}
                      type="button"
                      data-value={item.corta}
                      data-zona="monedero"
                      className={`mon__pieza${arrastrando ? " mon__pieza--dragging" : ""}`}
                      disabled={bloqueada}
                      style={{
                        transform: arrastrando
                          ? `translate(${drag.dx}px, ${drag.dy}px) rotate(${rot}deg)`
                          : `rotate(${rot}deg)`,
                        zIndex: arrastrando ? 20 : undefined,
                      }}
                      onPointerDown={(e) => startDrag("monedero", i, item, e)}
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerCancel={onUp}
                      onClick={() => onTap("monedero", i, item)}
                      aria-label={`Añadir ${item.etiqueta}`}
                    >
                      <Dinero item={item} className="mon__img--pieza" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={pagoRef}
              className={`mon__zona mon__zona--pago${exacto ? " mon__zona--exacto" : ""}`}
              data-zona="pago"
            >
              <span className="mon__zona-titulo">Para pagar</span>
              <div className="mon__zona-piezas">
                {cesta.length === 0 ? (
                  <span className="mon__zona-vacia">Arrastra aquí el dinero</span>
                ) : (
                  cesta.map((item, i) => {
                    const arrastrando = drag?.from === "pago" && drag.index === i;
                    const rot = inclinacionDe(`${item.fichero}-pago-${i}`);
                    return (
                      <button
                        key={`${item.fichero}-pago-${i}`}
                        type="button"
                        data-value={item.corta}
                        data-zona="pago"
                        className={`mon__pieza${arrastrando ? " mon__pieza--dragging" : ""}`}
                        disabled={bloqueada}
                        style={{
                          transform: arrastrando
                            ? `translate(${drag.dx}px, ${drag.dy}px) rotate(${rot}deg)`
                            : `rotate(${rot}deg)`,
                          zIndex: arrastrando ? 20 : undefined,
                        }}
                        onPointerDown={(e) => startDrag("pago", i, item, e)}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        onClick={() => onTap("pago", i, item)}
                        aria-label={`Quitar ${item.etiqueta}`}
                      >
                        <Dinero item={item} className="mon__img--pieza" />
                      </button>
                    );
                  })
                )}
              </div>
              <span className={`mon__mostrador-total${totalClase}`}>
                Total: {formatearCentes(totalCesta)}
                {sobra && !exacto ? " — ¡te has pasado!" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
