import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { MonedasBilletesScreen } from "./MonedasBilletesScreen";
import {
  descomponer,
  formatearCentes,
  generateSession,
  totalCesta,
  TODO_EL_DINERO,
} from "../../../core/activities/monedasBilletes";
import { moneyImageUrl } from "./moneyImages";
import type {
  ChangeExercise,
  EquivalenceExercise,
  IdentifyExercise,
  MoneyItem,
  MonedasExercise,
  ShoppingExercise,
} from "../../../core/activities/monedasBilletes";
import type { EngineScreenProps } from "../engine-screens";
import { smokeProps } from "../testing/smoke";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("monedasBilletes", mockOnExit, difficulty, seed);

const AUTOAVANCE_MS = 1200;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const opciones = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>(".mon__opcion"));
const monedasDelMonedero = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>('.mon__pieza[data-zona="monedero"]'));
const piezasDePago = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLButtonElement>('.mon__pieza[data-zona="pago"]'));
const imagenes = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLImageElement>("img"));

const progreso = (c: HTMLElement): string =>
  c.querySelector(".activity-header__counter")?.textContent ?? "";

const enunciado = (c: HTMLElement): string => c.querySelector(".mon__enunciado")?.textContent ?? "";

/**
 * La hoja del nivel f�cil: diez ejercicios de bot�n y ninguno de compra, que es
 * lo que necesitan los tests que contestan con opciones.
 */
const hojaDeBotones = (seed = 4242) => generateSession("easy", seed) as IdentifyExercise[];

/** El primer ejercicio de esa hoja, ya tipado. */
const primeroDe = (seed = 4242) => hojaDeBotones(seed)[0]!;

/** La primera opci�n que no sea la correcta. */
const otra = (ex: { answer: string; options: string[] }): string => {
  const distinta = ex.options.find((o) => o !== ex.answer);
  if (distinta === undefined) throw new Error("No hay opciones distintas de la correcta");
  return distinta;
};

const acertar = (c: HTMLElement, v: string) => {
  const boton = c.querySelector<HTMLButtonElement>(`.mon__opcion[data-value="${v}"]`);
  if (!boton) throw new Error(`No hay ninguna opci�n con el valor "${v}"`);
  fireEvent.click(boton);
};

/** Deja el componente en el ejercicio `indice` de la hoja, resolviendo los anteriores. */
const irA = (c: HTMLElement, lista: MonedasExercise[], indice: number) => {
  for (let i = 0; i < indice; i++) {
    const ex = lista[i]!;
    if (ex.type === "shopping") {
      throw new Error("La compra no se resuelve con botones: es para otro describe");
    }
    acertar(c, ex.answer);
    runTimers(AUTOAVANCE_MS);
  }
};

const monederoDe = (c: HTMLElement, pieza: MoneyItem) => {
  const boton = c.querySelector<HTMLButtonElement>(
    `.mon__pieza[data-zona="monedero"][data-value="${pieza.corta}"]`,
  );
  if (!boton) throw new Error(`El monedero no tiene la pieza "${pieza.corta}"`);
  return boton;
};

/** Separa al pago una lista de piezas (toque en el monedero). */
const pagar = (c: HTMLElement, piezas: readonly MoneyItem[]) => {
  for (const pieza of piezas) fireEvent.click(monederoDe(c, pieza));
};

const css = readFileSync(join(__dirname, "MonedasBilletesScreen.css"), "utf8");

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  mockOnExit.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("monedasBilletes � el dinero en pantalla", () => {
  it("las im�genes de dinero no se recortan", () => {
    // El original las pintaba con `object-fit: cover` en cajas de 220�120, m�s
    // anchas que altas, y el recorte se com�a los bordes de los billetes, que
    // es justo donde est� el valor.
    expect(css).toContain("object-fit: contain");
    expect(css).not.toContain("object-fit: cover");
  });

  it("ense�a la moneda o el billete que toca, con su nombre accesible", () => {
    for (const dificultad of ["easy", "medium"] as const) {
      const lista = generateSession(dificultad, 4242) as IdentifyExercise[];
      const { container, unmount } = render(<MonedasBilletesScreen {...props(dificultad)} />);
      for (const [i, ex] of lista.entries()) {
        const img = imagenes(container)[0]!;
        expect(img.getAttribute("alt"), `${dificultad}/${i}`).toBe(ex.item.etiqueta);
        expect(img.className).toContain(
          ex.item.tipo === "moneda" ? "mon__img--moneda" : "mon__img--billete",
        );
        if (i === lista.length - 1) break;
        acertar(container, ex.answer);
        runTimers(AUTOAVANCE_MS);
      }
      unmount();
    }
  });
});

describe("monedasBilletes � identificar", () => {
  it("muestra el enunciado que genera el n�cleo, con sus cuatro opciones", () => {
    const ex = primeroDe();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    expect(enunciado(container)).toBe(ex.question);
    expect(opciones(container).map((b) => b.dataset.value)).toEqual(ex.options);
    expect(progreso(container)).toBe("1/10");
  });

  it("es una actividad de clic: nunca monta Numpad ni DigitCell", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    expect(container.querySelector(".shared-numpad")).toBeNull();
    expect(container.querySelector(".dab")).toBeNull();
    expect(container.querySelector(".input-toggle")).toBeNull();
  });

  it("acertar marca la correcta y pasa sola al siguiente", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, lista[0]!.answer);
    expect(container.querySelector(".mon__opcion--correcta")).not.toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("fallar marca la opci�n pulsada, no la correcta, y no avanza solo", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));

    expect(container.querySelector(".mon__opcion--fallada")).not.toBeNull();
    expect(container.querySelector(".mon__opcion--correcta")).toBeNull();
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--wrong");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();

    runTimers(AUTOAVANCE_MS * 3);
    expect(progreso(container)).toBe("1/10");
  });

  it("no deja contestar dos veces el mismo ejercicio", () => {
    const ex = primeroDe();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, otra(ex));
    for (const boton of opciones(container)) expect(boton.disabled).toBe(true);

    acertar(container, ex.answer);
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
    expect(progreso(container)).toBe("1/10");
  });

  it("tras reintentar se puede acertar y desaparece el reintento", () => {
    const ex = primeroDe();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, otra(ex));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    expect(container.querySelector(".mon__opcion--fallada")).toBeNull();

    acertar(container, ex.answer);
    expect(container.querySelector(".mon__opcion--correcta")).not.toBeNull();
    expect(container.querySelector(".activity-action--retry")).toBeNull();
  });

  it("el bot�n de siguiente avanza tras un fallo", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".mon__opcion--fallada")).toBeNull();
  });
});

describe("monedasBilletes � la equivalencia", () => {
  it("ense�a las monedas que hay que sumar, sin su valor debajo", () => {
    // Con el valor escrito bajo cada moneda, sumar era leer.
    const lista = generateSession("hard", 4242);
    const indice = lista.findIndex((ex) => ex.type === "equivalence");
    expect(indice).toBeGreaterThanOrEqual(0);

    const { container } = render(<MonedasBilletesScreen {...props("hard")} />);
    irA(container, lista, indice);

    const ex = lista[indice] as EquivalenceExercise;
    expect(enunciado(container)).toBe(ex.question);
    expect(imagenes(container)).toHaveLength(ex.items.length);

    const texto = container.querySelector(".ops__stage")!.textContent ?? "";
    for (const item of ex.items) {
      // La etiqueta corta (�50c�) solo puede aparecer en las opciones.
      expect(texto.includes(` ${item.corta}`), `se ve el valor de ${item.etiqueta}`).toBe(false);
    }
    expect(container.querySelector(".mon__moneda-corta")).toBeNull();
  });

  it("acertar el total cuenta y pasa al ejercicio siguiente, que es un cambio", () => {
    const lista = generateSession("hard", 4242);
    const { container } = render(<MonedasBilletesScreen {...props("hard")} />);
    const ex = lista[0] as EquivalenceExercise;

    acertar(container, ex.answer);
    expect(container.querySelector(".mon__opcion--correcta")).not.toBeNull();

    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
    expect(lista[1]!.type).toBe("change");
  });
});

describe("monedasBilletes � la vuelta", () => {
  const vuelta = (c: HTMLElement) => c.querySelector<HTMLElement>(".mon__pago")!;

  it("ense�a el producto, el precio y el dinero que se entrega", () => {
    const lista = generateSession("hard", 4242);
    const { container } = render(<MonedasBilletesScreen {...props("hard")} />);
    irA(container, lista, 1);

    const ex = lista[1] as ChangeExercise;
    expect(container.querySelector(".mon__producto-nombre")?.textContent).toBe(ex.producto.nombre);
    expect(container.querySelector(".mon__producto-precio")?.textContent).toContain(ex.precioLabel);
    expect(enunciado(container)).toBe(ex.question);

    // El dinero del pago, pieza a pieza, y no solo la cantidad en texto.
    const entregadas = imagenes(vuelta(container));
    expect(entregadas).toHaveLength(ex.pagado.length);
    for (const [i, pieza] of ex.pagado.entries()) {
      expect(entregadas[i]!.getAttribute("alt")).toBe(pieza.etiqueta);
    }
    expect(totalCesta(ex.pagado)).toBe(ex.pagadoCents);
    expect(vuelta(container).querySelector(".mon__pago-total")?.textContent).toBe(ex.pagadoLabel);
  });

  it("el cambio es lo que falta por pagar, y se puede acertar", () => {
    const lista = generateSession("hard", 4242);
    const { container } = render(<MonedasBilletesScreen {...props("hard")} />);
    irA(container, lista, 1);

    const ex = lista[1] as ChangeExercise;
    // Lo que el enunciado promete y la respuesta que ofrece son lo mismo.
    expect(ex.pagadoCents - ex.precio).toBe(ex.cambioCents);
    acertar(container, ex.answer);
    expect(container.querySelector(".mon__opcion--correcta")).not.toBeNull();
  });
});

describe("monedasBilletes � el mostrador expert", () => {
  it("monta la foto, el enunciado y el dinero disponible", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    const ex = generateSession("expert", 4242)[0] as ShoppingExercise;

    expect(enunciado(container)).toBe("Separa el dinero suficiente para pagar el precio exacto.");
    expect(container.querySelector(".mon__mostrador-foto")).not.toBeNull();
    expect(container.querySelector(".mon__producto-nombre")?.textContent).toBe(ex.producto.nombre);
    expect(container.querySelector(".mon__mostrador-precio")?.textContent).toBe(ex.precioLabel);
    expect(monedasDelMonedero(container)).toHaveLength(ex.disponibles.length);
    expect(container.querySelector(".mon__zona-vacia")).not.toBeNull();
  });

  it("cada toque en el monedero suma en el total y aparece en el pago", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    const ex = generateSession("expert", 4242)[0] as ShoppingExercise;
    const primera = ex.disponibles[0]!;

    fireEvent.click(monederoDe(container, primera));
    fireEvent.click(monederoDe(container, primera));

    const total = container.querySelector(".mon__mostrador-total")!.textContent ?? "";
    expect(total).toContain(formatearCentes(primera.valor * 2));
    expect(piezasDePago(container)).toHaveLength(2);
    expect(container.querySelector(".mon__zona-vacia")).toBeNull();
  });

  it("avisa cuando se pasa del precio, sin dar el acierto", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    const ex = generateSession("expert", 4242)[0] as ShoppingExercise;
    // Un c�ntimo m�s que el precio, descompuesto de menor a mayor: as� ninguna
    // suma intermedia cae justo en el precio, que es lo que disparar�a el
    // acierto.
    const piezas = [...descomponer(ex.precio + 1)].reverse();
    pagar(container, piezas);

    expect(totalCesta(piezas)).toBeGreaterThan(ex.precio);
    expect(container.querySelector(".mon__mostrador-total--sobra")).not.toBeNull();
    expect(container.querySelector(".mon__mostrador-total")?.textContent).toContain(
      "te has pasado",
    );
    expect(container.querySelector(".ops__stage")?.className).not.toContain("ops__stage--correct");
  });

  it("se corrige solo en cuanto el pago es el precio exacto", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    const ex = generateSession("expert", 4242)[0] as ShoppingExercise;

    pagar(container, descomponer(ex.precio));

    expect(totalCesta(descomponer(ex.precio))).toBe(ex.precio);
    expect(container.querySelector(".ops__stage")?.className).toContain("ops__stage--correct");
    expect(container.querySelector(".mon__zona--exacto")).not.toBeNull();
    runTimers(AUTOAVANCE_MS);
    expect(progreso(container)).toBe("2/10");
  });

  it("un toque en la zona de pago devuelve la pieza al monedero", () => {
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);
    const ex = generateSession("expert", 4242)[0] as ShoppingExercise;
    const primera = ex.disponibles[0]!;
    const segunda = ex.disponibles[1]!;

    fireEvent.click(monederoDe(container, primera));
    fireEvent.click(monederoDe(container, segunda));
    expect(piezasDePago(container)).toHaveLength(2);

    fireEvent.click(piezasDePago(container)[0]!);
    expect(piezasDePago(container)).toHaveLength(1);
    expect(container.querySelector(".mon__mostrador-total")?.textContent).toContain(
      formatearCentes(segunda.valor),
    );

    fireEvent.click(piezasDePago(container)[0]!);
    expect(container.querySelector(".mon__zona-vacia")).not.toBeNull();
  });

  it("la zona de pago se vac�a al pasar al producto siguiente", () => {
    const lista = generateSession("expert", 4242) as ShoppingExercise[];
    const { container } = render(<MonedasBilletesScreen {...props("expert")} />);

    pagar(container, descomponer(lista[0]!.precio));
    expect(container.querySelector(".mon__zona-vacia")).toBeNull();

    runTimers(AUTOAVANCE_MS);

    expect(progreso(container)).toBe("2/10");
    expect(container.querySelector(".mon__zona-vacia")).not.toBeNull();
    expect(container.querySelector(".mon__producto-nombre")?.textContent).toBe(
      lista[1]!.producto.nombre,
    );
  });
});

describe("monedasBilletes � determinismo y salida", () => {
  it("acertar los diez muestra la nota m�xima", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("10/10");
  });

  it("acertar tras fallar no punt�a doble", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    acertar(container, otra(lista[0]!));
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, lista[0]!.answer);
    runTimers(AUTOAVANCE_MS);
    for (const ex of lista.slice(1)) {
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe("9/10");
  });

  it("repetir regenera la misma sesi�n, con la misma semilla", () => {
    const lista = hojaDeBotones();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    for (const ex of lista) {
      acertar(container, ex.answer);
      runTimers(AUTOAVANCE_MS);
    }

    const repetir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Repetir"),
    );
    if (!repetir) throw new Error("El resumen no ofrece el bot�n de repetir");
    fireEvent.click(repetir);

    expect(enunciado(container)).toBe((lista[0]! as IdentifyExercise).question);
    expect(container.querySelector(".mon__opcion--correcta")).toBeNull();
  });

  it("el bot�n de salir avisa y no cambia de ejercicio", () => {
    const ex = primeroDe();
    const { container } = render(<MonedasBilletesScreen {...props("easy")} />);

    const salir = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
      b.textContent?.includes("Salir"),
    );
    if (!salir) throw new Error("No hay bot�n de salir en la cabecera");
    fireEvent.click(salir);

    expect(mockOnExit).toHaveBeenCalled();
    expect(enunciado(container)).toBe(ex.question);
  });
});

describe("monedasBilletes � las im�genes resueltas", () => {
  it("cada pieza del cat�logo tiene su fichero en el sitio que le toca", () => {
    // Un `""` en el `src` es un asset que no se empaquet�, que es como se
    // rompe esta actividad sin que se note en los tests.
    const vacias = TODO_EL_DINERO.filter((m) => moneyImageUrl(m) === "");
    expect(vacias.map((m) => m.fichero)).toEqual([]);
  });
});
