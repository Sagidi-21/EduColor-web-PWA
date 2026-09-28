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
  const button = Array.from(
    container.querySelectorAll<HTMLButtonElement>(".shared-numpad__key"),
  ).find((k) => k.textContent === key);
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
