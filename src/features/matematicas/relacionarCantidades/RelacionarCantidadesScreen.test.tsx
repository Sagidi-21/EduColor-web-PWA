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

describe("relacionarCantidades — la tarjeta derecha ya no dibuja", () => {
  it("la tarjeta derecha se pinta solo con el texto, sin figuras", () => {
    // El original pintaba lo añadido o quitado debajo de un texto que hablaba
    // del total: «Ahora tengo 21» con cinco objetos dibujados. Y en el pase en
    // pizarra el dibujo se retiró del todo de la columna derecha para que el
    // enunciado cupiera entero.
    const pantalla = pantallas("medium", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    for (const [i, par] of pantalla.rightColumn.entries()) {
      const tarjeta = derecha(container)[i]!;
      expect(tarjeta.querySelectorAll(".rel2__cantidad"), par.rightText).toHaveLength(0);
      expect(tarjeta.querySelectorAll("img"), par.rightText).toHaveLength(0);
      expect(tarjeta.querySelector(".rel2__text-box")?.textContent).toBe(par.rightText);
    }
  });

  it("cada caja lleva una sola figura y su rótulo debajo: ×100 o ×10", () => {
    // Una caja de cien no es cien veces una figura suelta, ni una de diez es
    // diez veces: son los tres órdenes de la base decimal, y confundirlos es
    // justo lo que la actividad quiere evitar. Por eso la caja lleva el rótulo
    // y no las cien figuras que representa.
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    const cajas = container.querySelectorAll(".rel2__bloque");
    expect(cajas.length).toBeGreaterThan(0);
    for (const caja of cajas) {
      const esCien = caja.classList.contains("rel2__bloque--cien");
      expect(caja.querySelectorAll("img"), esCien ? "×100" : "×10").toHaveLength(1);
      expect(caja.querySelector(".rel2__bloque-rotulo")?.textContent).toBe(esCien ? "×100" : "×10");
    }
  });

  it("catorce son una caja de diez y cuatro sueltas; 347, tres de cien y cuatro de diez", () => {
    expect(representacion(14)).toEqual({ centenas: 0, decenas: 1, unidades: 4 });
    expect(representacion(10)).toEqual({ centenas: 0, decenas: 1, unidades: 0 });
    expect(representacion(7)).toEqual({ centenas: 0, decenas: 0, unidades: 7 });
    expect(representacion(30)).toEqual({ centenas: 0, decenas: 3, unidades: 0 });
    expect(representacion(347)).toEqual({ centenas: 3, decenas: 4, unidades: 7 });
    expect(representacion(999)).toEqual({ centenas: 9, decenas: 9, unidades: 9 });
  });

  it("la tarjeta izquierda dibuja entero lo que dice, sin quedarse en diez", () => {
    // El original pintaba `Math.min(10, cantidad)`: «Tengo 25» salía con diez.
    const pantalla = pantallas("medium", 4242)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("medium")} />);

    for (const [i, par] of pantalla.leftColumn.entries()) {
      const tarjeta = izquierda(container)[i]!;
      const { decenas, unidades } = representacion(par.izquierda[0]!.total);
      expect(
        tarjeta.querySelectorAll(".rel2__cajas .rel2__bloque:not(.rel2__bloque--cien)").length,
        par.leftText,
      ).toBe(decenas);
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

  it("en experto la cantidad entera sale en cajas de cien, de diez y sueltas", () => {
    // Ya no existe la etiqueta «+N × 10»: todo se dibuja. 457 son cuatro cajas
    // de cien, cinco de diez y siete figuras sueltas.
    for (const semilla of [777, 4242, 999983]) {
      const pantalla = pantallas("expert", semilla)[0]!;
      const { container } = render(<RelacionarCantidadesScreen {...props("expert", semilla)} />);

      // La etiqueta antigua no debe reaparecer por ningún lado.
      expect(container.querySelectorAll(".rel2__oculto")).toHaveLength(0);

      for (const [i, par] of pantalla.leftColumn.entries()) {
        const r = representacion(par.izquierda[0]!.total);
        const tarjeta = izquierda(container)[i]!;

        const cajasDeCien = tarjeta.querySelectorAll(".rel2__bloque--cien");
        expect(cajasDeCien.length, par.leftText).toBe(r.centenas);
        for (const caja of cajasDeCien) {
          expect(caja.querySelectorAll("img")).toHaveLength(1);
          expect(caja.querySelector(".rel2__bloque-rotulo")?.textContent).toBe("×100");
        }

        const cajasDeDiez = tarjeta.querySelectorAll(
          ".rel2__cajas .rel2__bloque:not(.rel2__bloque--cien)",
        );
        expect(cajasDeDiez.length, par.leftText).toBe(r.decenas);
        for (const caja of cajasDeDiez) {
          expect(caja.querySelectorAll("img")).toHaveLength(1);
          expect(caja.querySelector(".rel2__bloque-rotulo")?.textContent).toBe("×10");
        }

        expect(tarjeta.querySelectorAll(".rel2__img--suelta").length, par.leftText).toBe(
          r.unidades,
        );

        // Y la suma de lo dibujado es la cantidad entera, sin nada declarado.
        const dibujado = r.centenas * 100 + r.decenas * 10 + r.unidades;
        expect(dibujado, par.leftText).toBe(par.izquierda[0]!.total);
      }
      container.remove();
    }
  });

  it("las unidades van en su propio grupo, aparte de las cajas", () => {
    // Si compartieran envoltorio, las unidades que no cabían caían debajo de una
    // caja de ×10 o ×100 y se leían como si fueran parte de ella.
    const pantalla = pantallas("expert", 777)[0]!;
    const { container } = render(<RelacionarCantidadesScreen {...props("expert", 777)} />);

    for (const tarjeta of izquierda(container)) {
      const cajas = tarjeta.querySelector(".rel2__cajas");
      const unidades = tarjeta.querySelector(".rel2__unidades");
      // Ninguno de los dos grupos contiene elementos del otro.
      expect(cajas?.querySelectorAll(".rel2__img--suelta")).toHaveLength(0);
      expect(unidades?.querySelectorAll(".rel2__bloque")).toHaveLength(0);
      // Y los dos están dentro del mismo contenedor de figuras.
      expect(tarjeta.querySelectorAll(".rel2__figuras")).toHaveLength(1);
      expect(cajas, "grupo de cajas").not.toBeNull();
      if (unidades) expect(unidades, "grupo de unidades").not.toBeNull();
    }

    expect(pantalla.leftColumn.length).toBeGreaterThan(0);
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
