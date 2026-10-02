import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ColumnCarryOperation } from "./ColumnCarryOperation";
import type { ColumnCarryOperationProps } from "./ColumnCarryOperation";

/**
 * Tests del componente compartido, no de una actividad concreta.
 *
 * Comprueban el contrato que cualquier ejercicio de cálculo encolumnado va a
 * reutilizar: dónde están las casillas de llevar, qué pasa al pulsarlas, cómo se
 * rellena y, sobre todo, que la comprobación es una sola y del ejercicio entero.
 */

const onCheck = vi.fn();

const props = (extra: Partial<ColumnCarryOperationProps> = {}): ColumnCarryOperationProps => ({
  op: "+",
  aDigits: ["3", "4", "7"],
  bDigits: ["2", "8", "6"],
  carrySlots: [0, 1],
  carryLabel: "llevar",
  mode: "numpad",
  verdict: "idle",
  resetToken: "ej1",
  onCheck,
  ...extra,
});

const c = () => document.body.querySelector(".cco") as HTMLElement;
const casillaLlevar = (i: number) => c().querySelector<HTMLButtonElement>(`#cco-llevar-${i}`)!;
const casillaResultado = (i: number) => c().querySelector<HTMLButtonElement>(`#cco-cifra-${i}`)!;
const comprobar = () => c().querySelector<HTMLButtonElement>("#cco-comprobar")!;
const bandeja = () => c().querySelector('[data-testid="cco-bandeja"]');
const filaLlevar = () => c().querySelector('[data-testid="cco-fila-llevar"]')!;

const tecla = (t: string) => {
  const boton = Array.from(c().querySelectorAll<HTMLButtonElement>(".shared-numpad__key")).find(
    (k) => k.textContent === t,
  );
  if (!boton) throw new Error(`El Numpad no tiene la tecla "${t}"`);
  fireEvent.click(boton);
};

const teclear = (n: string | number) => String(n).split("").forEach(tecla);

/**
 * Escribe un resultado como se hace a mano: empezando por las unidades.
 *
 * Las casillas se rellenan de derecha a izquierda, así que las cifras se teclean
 * en el orden inverso al que se leen. Es el mismo criterio que usa
 * `typeUnitsFirst` en `testing/smoke.ts`.
 */
const escribirResultado = (n: string | number) => teclear(String(n).split("").reverse().join(""));

/** Las tres casillas tal como están, de izquierda a derecha. */
const cifras = () => [0, 1, 2].map((i) => casillaResultado(i).textContent);

beforeEach(() => {
  onCheck.mockReset();
});

afterEach(cleanup);

describe("ColumnCarryOperation — las casillas de llevar", () => {
  it("hay dos casillas pequeñas, y ninguna sobre las unidades", () => {
    render(<ColumnCarryOperation {...props()} />);

    expect(casillaLlevar(0)).not.toBeNull();
    expect(casillaLlevar(1)).not.toBeNull();
    // La columna de las unidades no deja casilla: de ella no se lleva nadie.
    expect(casillaLlevar(2)).toBeNull();
    expect(filaLlevar().querySelectorAll(".cco__carry-slot")).toHaveLength(2);
  });

  it("solo hay casilla donde el ejercicio dice que la hay", () => {
    render(<ColumnCarryOperation {...props({ carrySlots: [1] })} />);

    expect(filaLlevar().querySelectorAll(".cco__carry-slot")).toHaveLength(1);
    expect(casillaLlevar(1)).not.toBeNull();
    expect(casillaLlevar(0)).toBeNull();
  });

  it("las casillas empiezan vacías y en su sitio, sin bandeja", () => {
    render(<ColumnCarryOperation {...props()} />);

    expect(bandeja()).toBeNull();
    expect(casillaLlevar(0).textContent).toBe("·");
    expect(casillaLlevar(1).textContent).toBe("·");
  });

  it("pulsar una casilla la trae a un lado, separada de las principales", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(1));

    expect(bandeja()).not.toBeNull();
    expect(casillaLlevar(1).dataset.active).toBe("true");
    expect(casillaLlevar(1).className).toContain("cco__carry-slot--aside");
    // La otra casilla no se mueve.
    expect(casillaLlevar(0).dataset.active).toBe("false");
  });

  it("la bandeja está fuera de la rejilla, no encima de las casillas principales", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(0));

    const area = c().querySelector(".cco__area")!;
    expect(area.contains(bandeja()!)).toBe(true);
    expect(area.querySelector(".cco__grid")!.contains(bandeja()!)).toBe(false);
  });

  it("escribir una cifra devuelve la casilla a su sitio, encima de su columna", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(1));
    teclear("1");

    expect(bandeja()).toBeNull();
    expect(casillaLlevar(1).textContent).toBe("1");
    expect(casillaLlevar(1).dataset.active).toBe("false");
    expect(casillaLlevar(0).textContent).toBe("·");
  });

  it("la casilla se rellena desde la bandeja, no desde su sitio en la fila", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(0));
    expect(bandeja()!.querySelector(".cco__bandeja-celda")?.textContent).toBe("_");

    teclear("1");
    expect(casillaLlevar(0).textContent).toBe("1");
  });

  it("se puede volver a traer una casilla ya escrita y cambiarla", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(1));
    teclear("1");
    fireEvent.click(casillaLlevar(1));
    teclear("2");

    expect(casillaLlevar(1).textContent).toBe("2");
    expect(bandeja()).toBeNull();
  });

  it("la casilla se puede dejar en la bandeja sin escribir nada", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(0));
    fireEvent.click(c().querySelector<HTMLButtonElement>(".cco__bandeja-volver")!);

    expect(bandeja()).toBeNull();
    expect(casillaLlevar(0).textContent).toBe("·");
  });

  it("mientras la bandeja está abierta, las casillas principales están bloqueadas", () => {
    render(<ColumnCarryOperation {...props()} />);

    fireEvent.click(casillaLlevar(1));
    expect(casillaResultado(2).disabled).toBe(true);

    teclear("1");
    // Al escribir, la casilla vuelve a su sitio y las principales vuelven a estar
    // disponibles para continuar la operación.
    expect(casillaResultado(2).disabled).toBe(false);
  });
});

describe("ColumnCarryOperation — las casillas principales", () => {
  it("hay tres casillas, una por cifra del resultado", () => {
    render(<ColumnCarryOperation {...props()} />);

    const fila = c().querySelector('[data-testid="cco-fila-resultado"]')!;
    expect(fila.querySelectorAll(".cco__result-cell")).toHaveLength(3);
  });

  it("se rellenan de derecha a izquierda, empezando por las unidades", () => {
    render(<ColumnCarryOperation {...props()} />);

    expect(casillaResultado(2).className).toContain("cco__result-cell--active");

    teclear("3");
    expect(casillaResultado(2).textContent).toBe("3");
    expect(casillaResultado(1).className).toContain("cco__result-cell--active");

    teclear("3");
    teclear("6");

    expect(cifras()).toEqual(["6", "3", "3"]);
  });

  it("se puede volver a una casilla ya escrita y corregirla", () => {
    render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);

    fireEvent.click(casillaResultado(2));
    teclear("8");

    expect(cifras()).toEqual(["6", "3", "8"]);
  });

  it("borrar vacía la casilla activa y, si ya estaba vacía, la de su derecha", () => {
    render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);
    expect(cifras()).toEqual(["6", "3", "3"]);

    // Con las tres escritas, la activa es la de las centenas.
    tecla("←");
    expect(cifras()).toEqual(["_", "3", "3"]);

    // Ya vacía: se borra la de su derecha y el cursor pasa a ella, de modo que
    // la casilla de las centenas queda en blanco sin cursor.
    tecla("←");
    expect(cifras()).toEqual(["", "_", "3"]);
    expect(casillaResultado(1).className).toContain("cco__result-cell--active");
  });
});

describe("ColumnCarryOperation — una sola comprobación", () => {
  it("comprobar no se activa hasta que las tres casillas están rellenas", () => {
    render(<ColumnCarryOperation {...props()} />);
    expect(comprobar().disabled).toBe(true);

    teclear("3");
    expect(comprobar().disabled).toBe(true);
    teclear("3");
    expect(comprobar().disabled).toBe(true);

    teclear("6");
    expect(comprobar().disabled).toBe(false);
  });

  it("comprobar avisa una sola vez, con las tres cifras en su sitio", () => {
    render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);

    fireEvent.click(comprobar());

    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenCalledWith(["6", "3", "3"]);
  });

  it("la ✓ del numpad hace lo mismo que comprobar", () => {
    render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);

    tecla("✓");

    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenCalledWith(["6", "3", "3"]);
  });

  it("no comprueba nada si falta una casilla, ni aunque se pulse la ✓", () => {
    render(<ColumnCarryOperation {...props()} />);
    teclear("33");

    tecla("✓");
    fireEvent.click(comprobar());

    expect(onCheck).not.toHaveBeenCalled();
  });

  it("comprobar no vuelve a disparar con el veredicto ya resuelto", () => {
    const { rerender } = render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);

    fireEvent.click(comprobar());
    expect(onCheck).toHaveBeenCalledTimes(1);

    rerender(<ColumnCarryOperation {...props({ verdict: "wrong" })} />);
    fireEvent.click(comprobar());
    tecla("✓");

    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("la casilla de llevar no cuenta para poder comprobar", () => {
    render(<ColumnCarryOperation {...props()} />);

    // Rellenada la de llevar, las tres principales siguen vacías.
    fireEvent.click(casillaLlevar(1));
    teclear("1");
    expect(comprobar().disabled).toBe(true);

    escribirResultado(633);
    expect(comprobar().disabled).toBe(false);
  });

  it("un fallo en una sola cifra falla el ejercicio entero", () => {
    render(<ColumnCarryOperation {...props()} />);

    // El resultado es 633. Se escriben 600: solo falla la casilla de las decenas.
    teclear("6");
    teclear("0");
    teclear("0");
    fireEvent.click(comprobar());

    expect(onCheck).toHaveBeenCalledWith(["0", "0", "6"]);
    // Y el componente no juzga nada por su cuenta: el veredicto es del padre,
    // que aún no ha contestado.
    expect(c().className).not.toContain("cco--wrong");
    expect(c().className).not.toContain("cco--correct");
  });
});

describe("ColumnCarryOperation — no corrige por partes", () => {
  it("con el veredicto fallido, ninguna casilla lleva marca de correcta o incorrecta", () => {
    render(<ColumnCarryOperation {...props({ verdict: "wrong" })} />);

    for (const i of [0, 1, 2]) {
      expect(casillaResultado(i).className).not.toMatch(/correct|wrong/);
    }
    for (const i of [0, 1]) {
      expect(casillaLlevar(i).className).not.toMatch(/correct|wrong/);
    }
    // El color va en la rejilla entera: el veredicto es del ejercicio entero.
    expect(c().className).toContain("cco--wrong");
  });

  it("la casilla de llevar no se corrige ni se enseña al fallar", () => {
    render(<ColumnCarryOperation {...props()} />);

    // El niño escribe un 7 en la casilla de llevar aunque el cálculo diga otra cosa.
    fireEvent.click(casillaLlevar(1));
    teclear("7");
    teclear("6");
    teclear("0");
    teclear("0");
    fireEvent.click(comprobar());

    // Lo que escribió se queda tal cual, sin juzgar.
    expect(casillaLlevar(1).textContent).toBe("7");
    expect(casillaLlevar(1).className).not.toMatch(/correct|wrong/);
    expect(onCheck).toHaveBeenCalledWith(["0", "0", "6"]);
  });

  it("un acierto tampoco repinta las casillas una a una", () => {
    render(<ColumnCarryOperation {...props({ verdict: "correct" })} />);

    for (const i of [0, 1, 2]) {
      expect(casillaResultado(i).className).not.toMatch(/correct|wrong/);
    }
    expect(c().className).toContain("cco--correct");
  });

  it("al resolverse, las casillas se bloquean y no se puede seguir escribiendo", () => {
    const { rerender } = render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);
    fireEvent.click(comprobar());

    rerender(<ColumnCarryOperation {...props({ verdict: "wrong" })} />);

    expect(comprobar().disabled).toBe(true);
    expect(casillaLlevar(0).disabled).toBe(true);
    expect(casillaResultado(0).disabled).toBe(true);
  });

  it("dar el veredicto deja lo escrito en pantalla: el niño tiene que poder verlo", () => {
    const { rerender } = render(<ColumnCarryOperation {...props()} />);
    fireEvent.click(casillaLlevar(0));
    teclear("1");
    escribirResultado(633);

    rerender(<ColumnCarryOperation {...props({ verdict: "wrong" })} />);

    expect(cifras().join("")).toBe("633");
    expect(casillaLlevar(0).textContent).toBe("1");
    expect(casillaLlevar(1).textContent).toBe("·");
  });
});

describe("ColumnCarryOperation — cambiar de ejercicio", () => {
  it("un resetToken nuevo vacía las casillas y la bandeja", () => {
    const { rerender } = render(<ColumnCarryOperation {...props()} />);
    fireEvent.click(casillaLlevar(1));
    teclear("1");
    escribirResultado(633);

    rerender(<ColumnCarryOperation {...props({ resetToken: "ej2" })} />);

    expect(bandeja()).toBeNull();
    for (const i of [0, 1]) expect(casillaLlevar(i).textContent).toBe("·");
    expect(cifras().join("")).not.toBe("633");
    expect(comprobar().disabled).toBe(true);
  });

  it("tras el cambio, la casilla activa vuelve a ser la de las unidades", () => {
    const { rerender } = render(<ColumnCarryOperation {...props()} />);
    escribirResultado(633);

    rerender(<ColumnCarryOperation {...props({ resetToken: "ej2" })} />);

    expect(casillaResultado(2).className).toContain("cco__result-cell--active");
    expect(casillaResultado(2).textContent).toBe("_");
  });
});

describe("ColumnCarryOperation — lienzo", () => {
  it("en modo lienzo no monta numpad y sí un lienzo para la casilla activa", () => {
    const { container } = render(<ColumnCarryOperation {...props({ mode: "canvas" })} />);

    expect(container.querySelector(".shared-numpad")).toBeNull();
    // LazyDigitCell se carga de forma diferida; su marca de carga es lo que hay.
    expect(container.querySelector(".dab, .dab--loading")).not.toBeNull();
  });

  it("en modo lienzo el botón comprobar sigue estando", () => {
    render(<ColumnCarryOperation {...props({ mode: "canvas" })} />);

    expect(c().querySelector("#cco-comprobar")).not.toBeNull();
    expect(comprobar().disabled).toBe(true);
  });

  it("en modo lienzo solo hay un lienzo abierto, el de la casilla activa", () => {
    const { container } = render(<ColumnCarryOperation {...props({ mode: "canvas" })} />);
    expect(container.querySelectorAll('[data-testid="cco-lienzo"]')).toHaveLength(1);
  });

  it("traer una casilla de llevar a la bandeja pasa el lienzo a la bandeja", () => {
    const { container } = render(<ColumnCarryOperation {...props({ mode: "canvas" })} />);

    fireEvent.click(casillaLlevar(0));

    expect(bandeja()!.querySelector(".dab, .dab--loading")).not.toBeNull();
    // La casilla principal ya no dibuja: hay una sola escritura a la vez.
    expect(container.querySelector('[data-testid="cco-lienzo"]')).toBeNull();
  });
});

describe("ColumnCarryOperation — rótulos", () => {
  it("el rótulo de las casillas de llevar es el que le pasa quien lo usa", () => {
    const { unmount } = render(<ColumnCarryOperation {...props({ carryLabel: "llevar" })} />);
    expect(c().querySelector(".cco__carry-label")?.textContent).toBe("llevar");
    unmount();

    render(<ColumnCarryOperation {...props({ carryLabel: "prestar" })} />);
    expect(c().querySelector(".cco__carry-label")?.textContent).toBe("prestar");
  });

  it("el signo de la operación es el que toca", () => {
    const { unmount } = render(<ColumnCarryOperation {...props({ op: "+" })} />);
    expect(c().querySelector(".cco__op-symbol")?.textContent).toBe("+");
    unmount();

    render(<ColumnCarryOperation {...props({ op: "-" })} />);
    expect(c().querySelector(".cco__op-symbol")?.textContent).toBe("−");
  });

  it("la bandeja nombra la columna a la que se lleva", () => {
    const { unmount } = render(<ColumnCarryOperation {...props()} />);
    fireEvent.click(casillaLlevar(0));
    expect(bandeja()!.querySelector(".cco__bandeja-titulo")?.textContent).toBe(
      "llevar a las centenas",
    );
    unmount();

    render(<ColumnCarryOperation {...props()} />);
    fireEvent.click(casillaLlevar(1));
    expect(bandeja()!.querySelector(".cco__bandeja-titulo")?.textContent).toBe(
      "llevar a las decenas",
    );
  });

  it("las columnas se rotulan C, D y U de izquierda a derecha", () => {
    render(<ColumnCarryOperation {...props()} />);
    const rotulos = Array.from(c().querySelectorAll(".cco__col-label")).map((r) => r.textContent);
    expect(rotulos).toEqual(["C", "D", "U"]);
  });
});
