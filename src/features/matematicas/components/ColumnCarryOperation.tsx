import { useCallback, useState } from "react";
import { LazyDigitCell } from "../../shared/DigitCell";
import { Numpad } from "../../shared/components/Numpad";
import type { InputMode } from "../../shared/hooks/useInputMode";
import "./ColumnCarryOperation.css";

/**
 * ColumnCarryOperation
 * --------------------
 * Una operación escrita en columnas con **casillas de llevar**, y una sola
 * comprobación del resultado entero.
 *
 * Es un componente compartido y no una pantalla, porque la mecánica sirve para
 * cualquier ejercicio de cálculo encolumnado de cursos posteriores: quien lo use
 * no tiene que reescribir la interacción ni decidir otra vez cómo se corrige.
 *
 * ## Las casillas de llevar
 *
 * Hay dos casillas pequeñas, una sobre la columna de las centenas y otra sobre
 * la de las decenas, apoyadas en las cifras del primer sumando. La columna de
 * las unidades no lleva a nadie más a la derecha, así que no tiene casilla.
 *
 * Siempre están a la vista, pero son pequeñas. Si el niño quiere usar una, la
 * pulsa y **se la trae a un lado**, a una bandeja aparte de las casillas
 * principales, donde se escribe con comodidad. Al escribir una cifra vuelve a
 * su sitio, encima de su columna. Que sea opcional es deliberado: no todos los
 * ejercicios llevan, y forzar al niño a escribir una casilla que no necesita
 * solo le añade ruido.
 *
 * ## Una sola comprobación
 *
 * Las casillas principales son las tres cifras del resultado. El botón
 * "Comprobar" no se activa hasta que las tres están rellenas, y al pulsarlo se
 * evalúa **el resultado entero** de una sola vez.
 *
 * No hay corrección por partes a propósito: si el niño supiera en qué cifra se
 * ha equivocado, sabría qué corregir por su cuenta y no necesitaría al profesor.
 * Por eso este componente **no marca ninguna casilla como correcta o incorrecta**
 * por separado: `verdict` es del ejercicio entero. Lo que el niño ve tras pulsar
 * comprobar es si ha acertado el conjunto, y si no, decide el profesor si repite
 * con explicación, si le ayuda o si le deja seguir.
 *
 * ## Entrada
 *
 * Se escribe con el numpad o con el lienzo, según el `mode` que le pase quien
 * lo use. La `✓` del numpad hace lo mismo que "Comprobar"; el botón está siempre
 * presente para que en modo lienzo, donde no hay numpad, haya forma de comprobar.
 */

export type ColumnCarryVerdict = "idle" | "correct" | "wrong";

export interface ColumnCarryOperationProps {
  op: "+" | "-";
  /** Cifras del primer sumando, de izquierda a derecha. */
  aDigits: readonly string[];
  /** Cifras del segundo sumando, de izquierda a derecha. */
  bDigits: readonly string[];
  /**
   * Posiciones, contadas desde la izquierda, que tienen casilla de llevar.
   * La de las centenas es la 0 y la de las decenas la 1.
   */
  carrySlots?: readonly number[];
  /** Rótulo de las casillas de llevar: "llevar" al sumar, "prestar" al restar. */
  carryLabel?: string;
  mode: InputMode;
  /** Veredicto del ejercicio entero. Nunca se aplica a una casilla suelta. */
  verdict: ColumnCarryVerdict;
  /** Cambia al pasar de ejercicio o al reintentar: vacía casillas y bandeja. */
  resetToken: unknown;
  /** Se llama una sola vez, con las tres casillas principales ya rellenas. */
  onCheck: (digits: string[]) => void;
}

const COLUMNAS = 3;
/** Rótulo de la columna, para leer la rejilla como tabla de valor posicional. */
const ETIQUETAS = ["C", "D", "U"];

export function ColumnCarryOperation({
  op,
  aDigits,
  bDigits,
  carrySlots = [0, 1],
  carryLabel = "llevar",
  mode,
  verdict,
  resetToken,
  onCheck,
}: ColumnCarryOperationProps): JSX.Element {
  // Las casillas de llevar, por columna. `null` es "todavía vacía".
  const [carry, setCarry] = useState<(string | null)[]>(() =>
    Array.from({ length: COLUMNAS }, () => null),
  );
  /** La casilla de llevar que el niño ha traído a la bandeja, o ninguna. */
  const [activeCarry, setActiveCarry] = useState<number | null>(null);
  // Las tres casillas del resultado. Se rellenan de derecha a izquierda, que es
  // como se leen las operaciones en vertical (regla de D-017).
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: COLUMNAS }, () => ""));
  const [activeDigit, setActiveDigit] = useState(COLUMNAS - 1);
  const [canvasKey, setCanvasKey] = useState(0);

  const escribiendo = verdict === "idle";
  const completo = digits.every((d) => d !== "");

  // Cambiar de ejercicio o reintentar deja las casillas limpias. Sin esto, las
  // cifras del ejercicio anterior se quedarían en pantalla y se comprobarían
  // contra el nuevo: un fallo que no se ve hasta que sale mal.
  const [forma, setForma] = useState(String(resetToken));
  const formaActual = String(resetToken);
  if (forma !== formaActual) {
    setForma(formaActual);
    setCarry(Array.from({ length: COLUMNAS }, () => null));
    setActiveCarry(null);
    setDigits(Array.from({ length: COLUMNAS }, () => ""));
    setActiveDigit(COLUMNAS - 1);
    setCanvasKey((k) => k + 1);
  }

  const onDigit = useCallback(
    (d: string) => {
      if (!escribiendo) return;

      // Una casilla de llevar abierta en la bandeja manda sobre las principales.
      if (activeCarry !== null) {
        setCarry((s) => s.map((v, i) => (i === activeCarry ? d : v)));
        setActiveCarry(null);
        return;
      }

      setDigits((s) => {
        const siguiente = [...s];
        siguiente[activeDigit] = d;
        return siguiente;
      });
      // Se avanza hacia la izquierda. Al llegar a la izquierda se queda en la
      // casilla: comprobar es un acto aparte, con su botón.
      setActiveDigit((i) => Math.max(0, i - 1));
    },
    [escribiendo, activeCarry, activeDigit],
  );

  const onDelete = useCallback(() => {
    if (!escribiendo) return;

    if (activeCarry !== null) {
      setCarry((s) => s.map((v, i) => (i === activeCarry ? null : v)));
      return;
    }

    setDigits((s) => {
      const siguiente = [...s];
      if (siguiente[activeDigit] !== "") {
        siguiente[activeDigit] = "";
        return siguiente;
      }
      // La casilla activa ya estaba vacía: se borra la de su derecha.
      const anterior = activeDigit + 1;
      if (anterior >= COLUMNAS) return s;
      siguiente[anterior] = "";
      setActiveDigit(anterior);
      return siguiente;
    });
  }, [escribiendo, activeCarry, activeDigit]);

  const comprobar = useCallback(() => {
    if (!escribiendo || !completo) return;
    onCheck(digits);
  }, [escribiendo, completo, digits, onCheck]);

  const confirmarLienzo = useCallback(
    (d: string) => {
      onDigit(d);
      setCanvasKey((k) => k + 1);
    },
    [onDigit],
  );

  /** Una cifra escrita o el cursor, según toca. */
  const celda = (valor: string, activa: boolean) =>
    valor || (activa ? <span className="cco__cursor">_</span> : "");

  return (
    <div className={`cco cco--${verdict}`} data-testid="column-carry">
      <div className="cco__area">
        <div className="cco__grid">
          <div className="cco__row cco__row--labels">
            <span className="cco__hueco" />
            {ETIQUETAS.map((c) => (
              <span key={c} className="cco__col-label">
                {c}
              </span>
            ))}
          </div>

          {/* Las casillas de llevar, pequeñas, sobre las cifras del primer sumando. */}
          <div className="cco__row cco__row--carry" data-testid="cco-fila-llevar">
            <span className="cco__carry-label">{carryLabel}</span>
            {ETIQUETAS.map((_, i) => {
              const tieneCasilla = carrySlots.includes(i);
              if (!tieneCasilla) return <span key={`hueco-${i}`} className="cco__hueco-casilla" />;
              const traida = activeCarry === i;
              return (
                <button
                  key={`llevar-${i}`}
                  type="button"
                  id={`cco-llevar-${i}`}
                  data-slot={i}
                  data-active={traida ? "true" : "false"}
                  className={`cco__carry-slot${traida ? " cco__carry-slot--aside" : ""}`}
                  disabled={!escribiendo}
                  title={`Traer la casilla de ${carryLabel} a las ${nombreColumna(i)}`}
                  onClick={() => {
                    if (activeCarry === i) return;
                    setActiveCarry(i);
                    setCanvasKey((k) => k + 1);
                  }}
                >
                  {carry[i] ?? (traida ? <span className="cco__cursor">_</span> : "·")}
                </button>
              );
            })}
          </div>

          <div className="cco__row">
            <span className="cco__hueco cco__hueco--op" />
            {aDigits.map((d, i) => (
              <span key={`a-${i}`} className="cco__digit">
                {d}
              </span>
            ))}
          </div>

          <div className="cco__row">
            <span className="cco__op-symbol">{op === "+" ? "+" : "−"}</span>
            {bDigits.map((d, i) => (
              <span key={`b-${i}`} className="cco__digit">
                {d}
              </span>
            ))}
          </div>

          <div className="cco__divider" />

          {/* Las casillas principales: las tres cifras del resultado. */}
          <div className="cco__row cco__row--result" data-testid="cco-fila-resultado">
            <span className="cco__hueco cco__hueco--op" />
            {digits.map((d, i) => {
              const activa = escribiendo && activeCarry === null && i === activeDigit;
              return (
                <button
                  key={`r-${i}`}
                  type="button"
                  id={`cco-cifra-${i}`}
                  data-slot={i}
                  className={`cco__result-cell${activa ? " cco__result-cell--active" : ""}`}
                  disabled={!escribiendo || activeCarry !== null}
                  onClick={() => {
                    setActiveDigit(i);
                    setCanvasKey((k) => k + 1);
                  }}
                >
                  {celda(d, activa)}
                </button>
              );
            })}
          </div>
        </div>

        {/* La bandeja: aquí aterriza la casilla de llevar que el niño ha pulsado. */}
        {activeCarry !== null && (
          <aside className="cco__bandeja" data-testid="cco-bandeja">
            <p className="cco__bandeja-titulo">
              {carryLabel} a las {nombreColumna(activeCarry)}
            </p>
            {mode === "canvas" ? (
              <LazyDigitCell
                key={`canvas-llevar-${activeCarry}-${canvasKey}`}
                isActive
                onActivate={() => {}}
                onConfirm={confirmarLienzo}
                onClear={onDelete}
                state="idle"
                value=""
              />
            ) : (
              <div className="cco__bandeja-celda">{celda(carry[activeCarry] ?? "", true)}</div>
            )}
            <button
              type="button"
              className="cco__bandeja-volver"
              onClick={() => {
                setActiveCarry(null);
                setCanvasKey((k) => k + 1);
              }}
            >
              Dejar aquí
            </button>
          </aside>
        )}
      </div>

      <div className="cco__pie">
        {mode === "numpad" && (
          <Numpad
            onDigit={onDigit}
            onDelete={onDelete}
            onConfirm={comprobar}
            disabled={!escribiendo}
            layout="horizontal"
          />
        )}

        {mode === "canvas" && escribiendo && (
          <p className="cco__pista">
            {activeCarry !== null
              ? `Dibuja la cifra que va ${carryLabel} a las ${nombreColumna(activeCarry)}.`
              : activaTexto(digits, activeDigit)}
          </p>
        )}

        <button
          type="button"
          id="cco-comprobar"
          className="cco__comprobar"
          disabled={!escribiendo || !completo}
          onClick={comprobar}
        >
          Comprobar
        </button>
      </div>

      {/* El lienzo solo se monta en la casilla principal activa: el resto de la
          fila no dibuja, así que no hay cinco lienzos abiertos a la vez. */}
      {mode === "canvas" && escribiendo && activeCarry === null && (
        <div className="cco__lienzo" data-testid="cco-lienzo">
          <LazyDigitCell
            key={`canvas-cifra-${activeDigit}-${canvasKey}`}
            isActive
            onActivate={() => {}}
            onConfirm={confirmarLienzo}
            onClear={onDelete}
            state="idle"
            value=""
          />
        </div>
      )}
    </div>
  );
}

/** Qué casilla toca, para que el niño sepa dónde escribir. */
function activaTexto(digits: string[], activeDigit: number): string {
  const nombre = nombreColumna(activeDigit);
  return digits[activeDigit]
    ? `Corrige la casilla de las ${nombre}.`
    : `Escribe la cifra de las ${nombre}.`;
}

/** Nombre de la columna por su posición desde la izquierda. */
function nombreColumna(indice: number): string {
  return indice === 0 ? "centenas" : indice === 1 ? "decenas" : "unidades";
}
