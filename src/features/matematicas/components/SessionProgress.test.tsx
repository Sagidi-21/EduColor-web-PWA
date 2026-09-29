// Invariante del avance de sesión: la pantalla NUNCA se queda vacía y nunca se
// juegan más ejercicios de los que genera el motor.
//
// Esto sustituye a buscar `return null` con expresiones regulares en el código:
// aquí se juega la sesión entera de verdad y se comprueba lo que ve el niño.
//
// Qué comprueba, punto por punto:
//   1. En cada paso hay algo pintado; el contenedor nunca está vacío.
//   2. El contador "3/10" de la cabecera nunca pasa de 10.
//   3. El total que ve el niño coincide con lo que genera el motor.
//   4. Se ven los N ejercicios, en orden, y ni uno más.
//   5. El total no cambia a mitad de sesión.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { Numeracion1119Screen } from "../numeracion1119/Numeracion1119Screen";
import { Numeracion4059Screen } from "../numeracion4059/Numeracion4059Renderer";
import { Numeracion6099Screen } from "../numeracion6099/Numeracion6099Renderer";
import * as n1119 from "../../../core/activities/numeracion1119";
import * as n4059 from "../../../core/activities/numeracion4059";
import * as n6099 from "../../../core/activities/numeracion6099";
import type { ActivityDifficulty } from "../../../core/content/contracts";
import type { EngineScreenProps } from "../engine-screens";
import { confirmKey, pressNumpad, smokeProps } from "../testing/smoke";

const onExit = vi.fn();

/**
 * Ejercicios que debe tener toda sesión. Es también lo que dice la tarjeta de
 * la actividad, así que si cambia uno tiene que cambiar el otro.
 */
const EJERCICIOS_ESPERADOS = 10;

type Ejercicio = { options?: (string | number)[]; answer: string | number };

/** Las pantallas de actividad reciben siempre las mismas props. */
type Pantalla = React.ComponentType<EngineScreenProps>;

interface Caso {
  id: string;
  Pantalla: Pantalla;
  generar: (dificultad: ActivityDifficulty, seed: number) => Ejercicio[];
}

const CASOS: Caso[] = [
  {
    id: "numeracion1119",
    Pantalla: Numeracion1119Screen,
    // Ojo: esta es la única de la familia que invierte el orden de argumentos.
    generar: (d, s) => n1119.generateNumeracion1119Session(s, d),
  },
  {
    id: "numeracion4059",
    Pantalla: Numeracion4059Screen,
    generar: (d, s) => n4059.generateSession(d, s),
  },
  {
    id: "numeracion6099",
    Pantalla: Numeracion6099Screen,
    generar: (d, s) => n6099.generateSession(d, s),
  },
];

/**
 * Pulsa la opción correcta si el ejercicio es de opciones; si no, teclea.
 *
 * Cada pantalla de la familia nombra sus opciones distinto (`.num__options` en
 * 1119, `.n4059__options` en 4059, `.n6099__options` en 6099), así que se
 * busca por comodín en vez de fijar tres selectores.
 */
function responder(container: HTMLElement, ejercicio: Ejercicio) {
  const opciones = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[class*="options"] button, .num__option'),
  );
  if (opciones.length > 0) {
    const buena = opciones.find((o) => o.textContent === String(ejercicio.answer));
    if (buena) {
      buena.click();
      return;
    }
  }
  String(ejercicio.answer)
    .split("")
    .forEach((d) => pressNumpad(container, d));
  // Las casillas validan solas al completarse; el ✓ solo hace falta si quedan.
  if (container.querySelector(".shared-numpad__key")) pressNumpad(container, confirmKey);
}

const avanzar = () =>
  act(() => {
    vi.advanceTimersByTime(1600);
  });

/** El contador "3/10" que ve el niño en la cabecera. */
function progreso(container: HTMLElement): { actual: number; total: number } {
  const texto =
    container.querySelector(".activity-header__counter")?.getAttribute("aria-label") ??
    container.querySelector(".activity-header__counter")?.textContent ??
    "";
  const m = texto.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) throw new Error(`No se encuentra el contador de progreso en "${texto}"`);
  return { actual: Number(m[1]), total: Number(m[2]) };
}

const hayAlgoPintado = (c: HTMLElement) => (c.textContent ?? "").trim().length > 0;

describe("El avance de sesión no se pasa de los ejercicios", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    onExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  for (const caso of CASOS) {
    for (const dificultad of ["easy", "medium", "hard", "expert"] as ActivityDifficulty[]) {
      it(`${caso.id} (${dificultad})`, () => {
        const seed = 20260929;
        const ejercicios = caso.generar(dificultad, seed);

        // 0) El motor genera los 10 ejercicios que anuncia la tarjeta.
        expect(
          ejercicios.length,
          `${caso.id} (${dificultad}) genera ${ejercicios.length}, la tarjeta dice ${EJERCICIOS_ESPERADOS}`,
        ).toBe(EJERCICIOS_ESPERADOS);

        const { container } = render(
          <caso.Pantalla {...smokeProps(caso.id, onExit, dificultad, seed)} />,
        );

        const vistos: number[] = [];
        let totalInicial: number | null = null;

        for (let i = 0; i < ejercicios.length; i++) {
          // 1) Nunca hay una pantalla vacía.
          expect(hayAlgoPintado(container), `pantalla vacía en el paso ${i + 1}`).toBe(true);

          const p = progreso(container);
          if (totalInicial === null) totalInicial = p.total;
          expect(p.total, "el total cambia durante la sesión").toBe(totalInicial);
          expect(p.total, "el total no es el que genera el motor").toBe(ejercicios.length);
          expect(p.actual, `el contador se pasa: ${p.actual} > ${p.total}`).toBeLessThanOrEqual(
            p.total,
          );
          vistos.push(p.actual);

          act(() => responder(container, ejercicios[i]));
          avanzar();
        }

        // 2) Se ha visto cada ejercicio, en orden, y ninguno de más.
        expect(vistos).toEqual(ejercicios.map((_, i) => i + 1));

        // 3) Al terminar aparece el resumen, no una pantalla en blanco.
        expect(
          container.querySelector(".summary"),
          "no aparece el resumen al terminar",
        ).not.toBeNull();
        expect(hayAlgoPintado(container), "el resumen está en blanco").toBe(true);
      });
    }
  }
});
