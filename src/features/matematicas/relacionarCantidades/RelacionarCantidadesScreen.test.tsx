import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelacionarCantidadesScreen } from "./RelacionarCantidadesScreen";
import {
  generateSession,
  representacion,
  type RelacionarCantidadesRound,
} from "../../../core/activities/relacionarCantidades";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const TOTAL_PANTALLAS = 10;
const CELEBRACION_MS = 1500;
const ERROR_MS = 700;

const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("relacionarCantidades", mockOnExit, difficulty, seed);

const pantallas = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  generateSession(difficulty, seed, TOTAL_PANTALLAS);

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const izquierda = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>(".rel2__item--left"));
const derecha = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>(".rel2__item--right"));
const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

/** Une una pareja concreta, deduciéndola del motor y no del DOM. */
function unir(c: HTMLElement, pantalla: RelacionarCantidadesRound, id: number) {
  const i = pantalla.leftColumn.findIndex((p) => p.id === id);
  const d = pantalla.rightColumn.findIndex((p) => p.id === id);
  fireEvent.click(izquierda(c)[i]);
  fireEvent.click(derecha(c)[d]);
}

const unirTodas = (c: HTMLElement, pantalla: RelacionarCantidadesRound) => {
  for (const par of pantalla.pairs) unir(c, pantalla, par.id);
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("relacionarCantidades — la pantalla", () => {
  it("monta las dos columnas con las cuatro parejas y el contador", () => {
    const pantalla = pantallas("easy", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    expect(container.querySelector(".rel2__instruction")?.textContent).toBe(
      "Relaciona cada situación con la cantidad o el cambio correspondiente",
    );
    expect(izquierda(container)).toHaveLength(pantalla.pairs.length);
    expect(derecha(container)).toHaveLength(pantalla.pairs.length);
    expect(progreso(container)).toBe(`1 / ${TOTAL_PANTALLAS}`);
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("la izquierda muestra las situaciones y la derecha los resultados", () => {
    const pantalla = pantallas("easy", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    expect(
      izquierda(container).map((n) => n.querySelector(".rel2__text-box")?.textContent),
    ).toEqual(pantalla.leftColumn.map((p) => p.leftText));
    expect(derecha(container).map((n) => n.querySelector(".rel2__text-box")?.textContent)).toEqual(
      pantalla.rightColumn.map((p) => p.rightText),
    );
  });
});

describe("relacionarCantidades — cada tarjeta dibuja lo que dice", () => {
  it("la tarjeta derecha dibuja la cantidad que anuncia su texto", () => {
    // El original pintaba lo añadido o quitado debajo de un texto que hablaba
    // del total: «Ahora tengo 21» con cinco objetos dibujados.
    const pantalla = pantallas("medium", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    for (const [i, par] of pantalla.rightColumn.entries()) {
      const tarjeta = derecha(container)[i]!;
      const { bloques, unidades } = representacion(par.derecha.total);
      expect(tarjeta.querySelectorAll(".rel2__bloque"), par.rightText).toHaveLength(bloques);
      expect(tarjeta.querySelectorAll(".rel2__img--suelta"), par.rightText).toHaveLength(unidades);
    }
  });

  it("cada bloque de diez va rotulado como ×10", () => {
    // Un grupo de diez figuras no es «diez unidades»: es la base decimal, y
    // confundirlos es justo lo que la actividad quiere evitar.
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    const bloques = container.querySelectorAll(".rel2__bloque");
    expect(bloques.length).toBeGreaterThan(0);
    for (const bloque of bloques) {
      expect(bloque.querySelectorAll(".rel2__img")).toHaveLength(10);
      expect(bloque.querySelector(".rel2__bloque-rotulo")?.textContent).toBe("×10");
    }
  });

  it("catorce son diez figuras marcadas y cuatro sueltas", () => {
    const caso = (total: number) => {
      const { bloques, unidades } = representacion(total);
      return { bloques, unidades };
    };
    expect(caso(14)).toEqual({ bloques: 1, unidades: 4 });
    expect(caso(10)).toEqual({ bloques: 1, unidades: 0 });
    expect(caso(7)).toEqual({ bloques: 0, unidades: 7 });
    expect(caso(30)).toEqual({ bloques: 3, unidades: 0 });
  });

  it("la tarjeta izquierda dibuja entero lo que dice, sin quedarse en diez", () => {
    // El original pintaba `Math.min(10, cantidad)`: «Tengo 25» salía con diez.
    const pantalla = pantallas("medium", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    for (const [i, par] of pantalla.leftColumn.entries()) {
      const tarjeta = izquierda(container)[i]!;
      const { bloques, unidades } = representacion(par.izquierda[0]!.total);
      expect(tarjeta.querySelectorAll(".rel2__bloque"), par.leftText).toHaveLength(bloques);
      expect(tarjeta.querySelectorAll(".rel2__img--suelta"), par.leftText).toHaveLength(unidades);
    }
  });

  it("el nivel de grupos dibuja los dos grupos, con su rótulo", () => {
    const pantallasHard = pantallas("hard", 4242);
    let conDos = 0;
    for (const [n, pantalla] of pantallasHard.entries()) {
      const conGrupos = pantalla.pairs.find((p) => p.izquierda.length === 2);
      if (!conGrupos) continue;
      conDos++;

      const c = render(<RelacionarCantidadesScreen {...props("hard")} />);
      for (let i = 0; i < n; i++) unirTodas(c.container, pantallasHard[i]!);
      runTimers(CELEBRACION_MS);

      const tarjeta = izquierda(c.container).find((t) =>
        t.querySelector(".rel2__text-box")?.textContent?.startsWith("Grupo A"),
      );
      if (tarjeta) {
        expect(
          Array.from(tarjeta.querySelectorAll(".rel2__rotulo")).map((r) => r.textContent),
        ).toEqual(["Grupo A", "Grupo B"]);
        expect(tarjeta.querySelectorAll(".rel2__cantidad")).toHaveLength(2);
      }
      c.unmount();
    }
    expect(conDos).toBeGreaterThan(0);
  });

  it("en experto, cuando no cabe entero, la tarjeta declara lo que no dibuja", () => {
    // Dibujar 34 bloques de diez no cabe en una tarjeta, así que el resto se
    // declara en alto en vez de darse por dibujado.
    for (const semilla of [777, 4242, 999983]) {
      const pantalla = pantallas("expert", semilla)[0]!;
      const { container } = render(<RelacionarCantidadesScreen {...props("expert", semilla)} />);

      // Una etiqueta por tarjeta con decenas que no caben, no una por decena:
      // el rótulo dice "+N × 10" de una vez.
      const esperados = pantalla.pairs.filter(
        (par) => representacion(par.izquierda[0]!.total).decenasOcultas > 0,
      ).length;
      const etiquetas = Array.from(container.querySelectorAll(".rel2__oculto")).map(
        (n) => n.textContent,
      );
      expect(etiquetas).toHaveLength(esperados);
      // Y lo que se declara más lo que se dibuja sigue siendo la cantidad entera.
      for (const [i, par] of pantalla.leftColumn.entries()) {
        const r = representacion(par.izquierda[0]!.total);
        const tarjeta = izquierda(container)[i]!;
        const dibujado =
          tarjeta.querySelectorAll(".rel2__bloque").length * 10 +
          tarjeta.querySelectorAll(".rel2__img--suelta").length;
        const declarado = r.decenasOcultas * 10;
        expect(dibujado + declarado, par.leftText).toBe(par.izquierda[0]!.total);
      }
      container.remove();
    }
  });
});

describe("relacionarCantidades — unir", () => {
  it("acierto: une, marca ambos lados y dibuja la línea", () => {
    const pantalla = pantallas("easy", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);
    const id = pantalla.leftColumn[0]!.id;
    const i = pantalla.leftColumn.findIndex((p) => p.id === id);
    const d = pantalla.rightColumn.findIndex((p) => p.id === id);

    // Seleccionar en la izquierda y, sin volver a tocarla, elegir su pareja.
    fireEvent.click(izquierda(container)[i]);
    expect(container.querySelectorAll(".rel2__item--selected")).toHaveLength(1);

    fireEvent.click(derecha(container)[d]);

    expect(container.querySelectorAll(".rel2__item--connected")).toHaveLength(2);
    expect(container.querySelectorAll(".rel2__line")).toHaveLength(1);
  });

  it("fallo: marca el error en los dos lados y lo borra solo", () => {
    const pantalla = pantallas("easy", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);
    const i = 0;
    const otraFila = pantalla.rightColumn.findIndex((p) => p.id !== pantalla.leftColumn[i]!.id)!;

    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[otraFila]);

    expect(container.querySelectorAll(".rel2__item--wrong")).toHaveLength(2);
    expect(container.querySelectorAll(".rel2__item--connected")).toHaveLength(0);

    runTimers(ERROR_MS);
    expect(container.querySelectorAll(".rel2__item--wrong")).toHaveLength(0);
  });

  it("sin seleccionar nada a la izquierda, la derecha no responde", () => {
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);
    fireEvent.click(derecha(container)[0]);
    expect(container.querySelectorAll(".rel2__item--connected")).toHaveLength(0);
  });

  it("al completar la pantalla celebra y avanza sola", () => {
    const todas = pantallas("easy", 4242);
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    unirTodas(container, todas[0]!);
    expect(container.querySelector(".rel2__celebrate")?.textContent).toContain(
      "¡Excelente relación!",
    );

    runTimers(CELEBRACION_MS);
    expect(progreso(container)).toBe(`2 / ${TOTAL_PANTALLAS}`);
    expect(container.querySelectorAll(".rel2__item--connected")).toHaveLength(0);
  });

  it("acertarlo todo da la nota máxima", () => {
    const todas = pantallas("easy", 4242);
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    for (const pantalla of todas) {
      unirTodas(container, pantalla);
      runTimers(CELEBRACION_MS);
    }

    expect(container.textContent).toContain(`${TOTAL_PANTALLAS}/${TOTAL_PANTALLAS}`);
  });

  it("fallar una unión no impide acabar, pero la pantalla ya no cuenta", () => {
    const todas = pantallas("easy", 4242);
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);
    const pantalla = todas[0]!;

    const i = 0;
    const malElegida = pantalla.rightColumn.findIndex((p) => p.id !== pantalla.leftColumn[i]!.id)!;
    fireEvent.click(izquierda(container)[i]);
    fireEvent.click(derecha(container)[malElegida]);
    runTimers(ERROR_MS);
    unirTodas(container, pantalla);
    runTimers(CELEBRACION_MS);

    for (const p of todas.slice(1)) {
      unirTodas(container, p);
      runTimers(CELEBRACION_MS);
    }

    // Diez pantallas, nueve sin fallos.
    expect(container.textContent).toContain(`${TOTAL_PANTALLAS - 1}/${TOTAL_PANTALLAS}`);
  });
});

describe("relacionarCantidades — determinismo y salida", () => {
  it("repetir devuelve las mismas pantallas, con la misma semilla", () => {
    const todas = pantallas("easy", 4242);
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);
    const antes = izquierda(container).map((n) => n.querySelector(".rel2__text-box")?.textContent);

    for (const pantalla of todas) {
      unirTodas(container, pantalla);
      runTimers(CELEBRACION_MS);
    }

    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);
    expect(
      izquierda(container).map((n) => n.querySelector(".rel2__text-box")?.textContent),
    ).toEqual(antes);
  });

  it("se puede completar también la sesión repetida", () => {
    const todas = pantallas("easy", 4242);
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    for (const pantalla of todas) {
      unirTodas(container, pantalla);
      runTimers(CELEBRACION_MS);
    }
    fireEvent.click(container.querySelector<HTMLButtonElement>(".summary__btn--primary")!);

    for (const pantalla of todas) {
      unirTodas(container, pantalla);
      runTimers(CELEBRACION_MS);
    }
    expect(container.textContent).toContain(`${TOTAL_PANTALLAS}/${TOTAL_PANTALLAS}`);
  });

  it("el botón de salir avisa y no cambia de pantalla", () => {
    const pantalla = pantallas("easy", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay botón de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(progreso(container)).toBe(`1 / ${TOTAL_PANTALLAS}`);
    expect(container.textContent).toContain(pantalla.leftColumn[0]!.leftText);
  });
});
