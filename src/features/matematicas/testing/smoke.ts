import type { ActivityManifest } from "../../../core/content/contracts";
import type { EngineScreenProps } from "../engine-screens";
import { getActivityManifest } from "../../../manifests/content-registry";
import { fireEvent } from "@testing-library/react";

/**
 * Utilidades compartidas por los smoke tests de los renderers.
 *
 * Este módulo solo lo importan los tests: no forma parte del grafo de la app.
 */

/** Carga el manifiesto real de la actividad y falla si no existe. */
export function requireManifest(id: string): ActivityManifest {
  const manifest = getActivityManifest(id);
  if (!manifest) throw new Error(`Falta el manifiesto de ${id} en src/manifests/activities`);
  return manifest;
}

/**
 * Props mínimas de `EngineScreenProps` para montar un renderer en un test.
 * El manifiesto es el real, no una copia, para que el test falle si el
 * manifiesto y el renderer se desincronizan.
 */
export function smokeProps(
  id: string,
  onExit: () => void,
  difficulty: EngineScreenProps["difficulty"] = "easy",
  seed = 4242,
): EngineScreenProps {
  return {
    activity: requireManifest(id),
    difficulty,
    seed,
    onExit,
    gradeTitle: "1.º de Primaria",
    className: "1.ºA",
    difficultyStars: "★★☆☆",
  };
}

/** Las 4 dificultades, en el orden en que las usa el catálogo. */
export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

const numpadKey = (container: HTMLElement, key: string) => {
  const alias =
    key === "←" || key === deleteKey
      ? "Borrar"
      : key === "✓" || key === confirmKey
        ? "Confirmar"
        : null;
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
  ).find(
    (k) => k.textContent === key || (alias !== null && k.getAttribute("aria-label") === alias),
  );
  if (!button) throw new Error(`El Numpad no tiene la tecla "${key}"`);
  return button;
};

/**
 * Teclea un número por el Numpad compartido.
 *
 * La familia de operaciones (suma, resta, tres sumandos y sus versiones en
 * columna) empieza con la casilla de las unidades activa y va avanzando a la
 * izquierda, así que se teclea el número en su orden de lectura habitual y la
 * última pulsación confirma sola. En los motores de casilla única hay que
 * pulsar además la tecla de confirmar.
 */
export function typeOnNumpad(container: HTMLElement, value: string | number): void {
  String(value)
    .split("")
    .forEach((d) => fireEvent.click(numpadKey(container, d)));
}

export function pressNumpad(container: HTMLElement, key: string): void {
  fireEvent.click(numpadKey(container, key));
}

/**
 * Teclea un número empezando por las unidades.
 *
 * Es lo que hacen `tresSumandosColumna` y `algoritmoColumna`: guardan
 * `digits[0] = D` y `digits[1] = U`, y la casilla activa al montar es la de
 * las unidades, que es por donde empieza la suma manual. El número se teclea
 * invertido, de la derecha a la izquierda.
 */
export function typeUnitsFirst(container: HTMLElement, value: string | number): void {
  typeOnNumpad(container, String(value).split("").reverse().join(""));
}

/**
 * Las tres cifras que pide `sumaLlevando`, en el orden de los pasos: unidades
 * del resultado, lo que se lleva y decenas del resultado. Se derivan de los
 * sumandos aplicando la regla del cálculo manual, no leyendo el estado del
 * renderer, para que el test sea independiente de la implementación.
 */
export function carryOf(addends: number[]): number {
  const units = addends.reduce((acc, n) => acc + (n % 10), 0);
  return Math.floor(units / 10);
}

/** Atajo de la tecla de confirmar del Numpad. */
export const confirmKey = "✓";

/** Atajo de la tecla de borrar del Numpad. */
export const deleteKey = "←";

/** Cambia entre Numpad y DigitCell mediante el toggle del header. */
export function switchToCanvas(container: HTMLElement): void {
  const toggle = container.querySelector<HTMLButtonElement>(".input-toggle__switch");
  if (!toggle) throw new Error("No hay toggle de modo de entrada montado");
  fireEvent.click(toggle);
}
