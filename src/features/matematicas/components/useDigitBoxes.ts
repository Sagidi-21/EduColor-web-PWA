import { useCallback, useState } from "react";
/**
 * Direccion en la que se rellenan las casillas de un numero.
 *
 * La regla acordada depende de **como se ve el ejercicio**, no de que actividad
 * sea: si esta en formato vertical de operacion, se escribe de derecha a
 * izquierda, porque en la tabla de valor posicional se lee desde las unidades.
 * Si no esta en vertical (una serie, una descomposicion, comparar), se escribe
 * de izquierda a derecha, que es como se leen los numeros.
 *
 * - `"ltr"`: izquierda a derecha. Es el caso de la familia de numeracion.
 * - `"rtl"`: derecha a izquierda. Es el caso de las sumas y restas en vertical.
 */
export type DigitOrder = "ltr" | "rtl";

interface Args {
  /** Una casilla por cada cifra que la operacion requiera, ni una mas. */
  length: number;
  order: DigitOrder;
  /** Se llama al completar la ultima casilla: es el momento de validar. */
  onComplete: (joined: string) => void;
  /** Cambia al reiniciar el ejercicio o al reintentar. */
  resetToken: unknown;
}

export interface DigitBoxes {
  /** Valor de cada casilla, en el orden en que se muestran (de izquierda a derecha). */
  values: string[];
  /** Indice de la casilla activa, medido de izquierda a derecha. */
  activeIndex: number;
  /** Todas las casillas tienen ya una cifra. */
  isComplete: boolean;
  /** Las cifras escritas tal cual se leen, para validar. */
  joined: string;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSelect: (index: number) => void;
  /** `✓` del numpad: valida solo si estan todas las casillas rellenas. */
  onConfirm: () => void;
  /** Vacia las casillas y vuelve al principio. */
  reset: () => void;
}

/**
 * Maquina de estados de "una casilla por cifra".
 *
 * Sustituye a la casilla unica en la que antes se tecleaba el numero entero, y
 * centraliza el avance casilla a casilla, el borrado y la validacion al
 * completar, que antes cada renderer repetia por su cuenta.
 */
export function useDigitBoxes({ length, order, onComplete, resetToken }: Args): DigitBoxes {
  const first = order === "ltr" ? 0 : length - 1;
  const step = order === "ltr" ? 1 : -1;

  const [state, setState] = useState<{ values: string[]; activeIndex: number }>(() => ({
    values: Array.from({ length }, () => ""),
    activeIndex: first,
  }));

  // Si cambia el numero de casillas, la direccion o el ejercicio, la entrada se
  // rehace desde el principio: si no, las casillas conservarian las cifras del
  // ejercicio anterior, que es un fallo que no se ve hasta que se valida mal.
  const [shape, setShape] = useState(`${length}:${order}:${String(resetToken)}`);
  const actual = `${length}:${order}:${String(resetToken)}`;
  if (shape !== actual) {
    setShape(actual);
    setState({ values: Array.from({ length }, () => ""), activeIndex: first });
  }

  const inRange = useCallback((i: number) => i >= 0 && i < length, [length]);

  const onSelect = useCallback(
    (index: number) => {
      setState((s) => (inRange(index) ? { ...s, activeIndex: index } : s));
    },
    [inRange],
  );

  const onDigit = useCallback(
    (digit: string) => {
      setState((s) => {
        const values = [...s.values];
        values[s.activeIndex] = digit;
        const siguiente = s.activeIndex + step;
        if (inRange(siguiente)) return { values, activeIndex: siguiente };
        // Se ha rellenado la ultima casilla: se valida la respuesta entera.
        onComplete(values.join(""));
        return { values, activeIndex: s.activeIndex };
      });
    },
    [step, inRange, onComplete],
  );

  const onDelete = useCallback(() => {
    setState((s) => {
      const values = [...s.values];
      if (values[s.activeIndex] !== "") {
        values[s.activeIndex] = "";
        return { values, activeIndex: s.activeIndex };
      }
      // La casilla activa ya estaba vacia: se borra la anterior en la direccion
      // de escritura y se vuelve a ella.
      const anterior = s.activeIndex - step;
      if (!inRange(anterior)) return s;
      values[anterior] = "";
      return { values, activeIndex: anterior };
    });
  }, [step, inRange]);

  const joined = state.values.join("");
  const isComplete = state.values.every((v) => v !== "");

  const onConfirm = useCallback(() => {
    if (!isComplete) return;
    onComplete(joined);
  }, [isComplete, joined, onComplete]);

  const reset = useCallback(() => {
    setState({ values: Array.from({ length }, () => ""), activeIndex: first });
  }, [length, first]);

  return {
    values: state.values,
    activeIndex: state.activeIndex,
    isComplete,
    joined,
    onDigit,
    onDelete,
    onSelect,
    onConfirm,
    reset,
  };
}
