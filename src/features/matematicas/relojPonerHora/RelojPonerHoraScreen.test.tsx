import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { RelojPonerHoraScreen } from "./RelojPonerHoraScreen";
import * as engine from "../../../core/activities/relojPonerHora";
import type { RelojPonerHoraExercise } from "../../../core/activities/relojPonerHora";
import { timeLabel } from "../../../core/activities/shared/timeLabel";
import { smokeProps } from "../testing/smoke";
import type { EngineScreenProps } from "../engine-screens";

const mockOnExit = vi.fn();
const props = (difficulty: EngineScreenProps["difficulty"], seed = 4242) =>
  smokeProps("relojPonerHora", mockOnExit, difficulty, seed);

/**
 * El salto al siguiente ejercicio tras acertar son 900 ms: el valor unificado
 * con el resto de actividades de la PWA, no los 1300 ms de Electron.
 */
const AUTOAVANCE_MS = 900;

const runTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

// ── El reloj en happy-dom ────────────────────────────────────────────────────

/**
 * `pointerAngle` convierte las coordenadas del puntero con el rectángulo real
 * del SVG, que en happy-dom vale 0 y daría una división por cero. Se le da al
 * reloj un rectángulo de 400×400 en el origen, de modo que las coordenadas del
 * `clientX/clientY` del evento son directamente las del `viewBox`: 400 es el
 * lado del `viewBox` y (200, 200) su centro.
 */
function fijarRectangulo(svg: SVGSVGElement): void {
  svg.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

const relojDe = (container: HTMLElement) => {
  const svg = container.querySelector<SVGSVGElement>(".rph__clock")!;
  fijarRectangulo(svg);
  return svg;
};

/**
 * Coordenadas de pantalla de un ángulo de reloj (0° arriba, sentido horario).
 * Es la inversa de `pointerAngle`: 0° apunta a las 12, 90° a las 3.
 */
function puntoEnElAngulo(deg: number, radio = 100): { clientX: number; clientY: number } {
  const rad = (deg * Math.PI) / 180;
  return { clientX: 200 + radio * Math.sin(rad), clientY: 200 - radio * Math.cos(rad) };
}

const knob = (container: HTMLElement, mano: "hour" | "minute") =>
  container.querySelector<SVGCircleElement>(`.rph__knob--${mano === "hour" ? "hour" : "min"}`)!;

/**
 * Deja las agujas en la hora pedida arrastrándolas, que es lo único que el niño
 * puede hacer: no hay casillas ni botones de hora.
 */
function ponerAgujas(container: HTMLElement, horas: number, minutos: number): void {
  const svg = relojDe(container);

  fireEvent.pointerDown(knob(container, "minute"), { pointerId: 1 });
  fireEvent.pointerMove(svg, puntoEnElAngulo(minutos * 6));
  fireEvent.pointerUp(svg);

  fireEvent.pointerDown(knob(container, "hour"), { pointerId: 2 });
  fireEvent.pointerMove(svg, puntoEnElAngulo(horas * 30));
  fireEvent.pointerUp(svg);
}

const comprobar = (container: HTMLElement) =>
  fireEvent.click(container.querySelector<HTMLButtonElement>(".rph__check-btn")!);

const acertar = (container: HTMLElement, ex: RelojPonerHoraExercise) => {
  ponerAgujas(container, ex.hours, ex.minutes);
  comprobar(container);
};

const contador = (c: HTMLElement) => c.querySelector(".activity-header__counter")?.textContent;

describe("RelojPonerHoraScreen smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    mockOnExit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("monta con la hora pedida en digital y el contador 1/N", () => {
    const seed = 4242;
    const sesion = engine.generateSession("easy", seed);

    const { container } = render(<RelojPonerHoraScreen {...props("easy", seed)} />);

    expect(container.querySelector(".rph__target-big")?.textContent).toBe(sesion[0].target);
    expect(contador(container)).toBe(`1 / ${sesion.length}`);
  });

  it("pinta el reloj con agujas y el título de la actividad en la cabecera", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    expect(container.querySelector(".rph__clock")).not.toBeNull();
    expect(container.querySelector(".rph__knob--hour")).not.toBeNull();
    expect(container.querySelector(".rph__knob--min")).not.toBeNull();
    expect(container.querySelector(".activity-header__title")?.textContent).toBe("Pon la hora");
  });

  it("el enunciado es el de Electron: la hora pedida con dos puntos, no en palabras", () => {
    const sesion = engine.generateSession("hard", 4242);
    const { container } = render(<RelojPonerHoraScreen {...props("hard", 4242)} />);

    expect(container.querySelector(".rph__side-label")?.textContent).toBe("Pon las agujas en");
    expect(container.querySelector(".rph__target-big")?.textContent).toBe(sesion[0].target);
    expect(container.querySelector(".rph__target-big")?.textContent).not.toContain("las ");
  });

  it("el reloj dibujado se nombra con la hora en palabras que marca", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    // Las agujas arrancan en las doce en punto, y se nombran con `timeLabel` del
    // motor `reloj`, no con una tabla propia.
    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(12, 0)}`,
    );
  });

  it("arrastrar las agujas cambia la hora que el reloj dice en palabras", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    ponerAgujas(container, 3, 30);

    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(3, 30)}`,
    );
  });

  it("acierto: celebra y avanza solo a los 900 ms", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    acertar(container, ex);

    expect(container.querySelector(".rph__celebration")?.textContent).toContain("¡Correcto!");
    expect(container.querySelector(".activity-action--retry")).toBeNull();

    runTimers(AUTOAVANCE_MS);
    expect(contador(container)).toBe(`2 / ${engine.generateSession("easy", 4242).length}`);
  });

  it("acierto: el botón de comprobar desaparece, como en Electron", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    acertar(container, ex);

    expect(container.querySelector(".rph__check-btn")).toBeNull();
  });

  it("acierto: el aviso sale encima de 'Pon las agujas en', sin taparla ni la esfera", () => {
    // El aviso de `reloj` va anclado al centro del stage, que en este motor cae
    // justo sobre el reloj. Y ya se corrigió una versión que lo solapaba con la
    // etiqueta: tiene que ocupar su propia fila, la de arriba.
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    acertar(container, ex);

    const head = container.querySelector(".rph__side-head")!;
    const slot = head.querySelector(".rph__celebration-slot")!;
    const label = head.querySelector(".rph__side-label")!;

    expect(slot.querySelector(".rph__celebration")?.textContent).toContain("¡Correcto!");
    expect(label.textContent).toContain("Pon las agujas en");

    // Filas distintas y en este orden: el aviso arriba, la frase intacta debajo.
    // Un `position: absolute` que se solapara con la frase pasaría el `closest`
    // de arriba, así que se comprueba también que la frase siga siendo hermana
    // suya y no su contenedor.
    expect(label.contains(slot)).toBe(false);
    expect(label.previousElementSibling).toBe(slot);
    expect(container.querySelector(".rph__celebration")?.closest(".rph__clock")).toBeNull();
  });

  it("la fila del aviso existe antes de acertar, para que el panel no salte", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    const slot = container.querySelector(".rph__side-head .rph__celebration-slot");
    expect(slot).not.toBeNull();
    expect(slot?.querySelector(".rph__celebration")).toBeNull();
  });

  it("acierto: a los 900 ms las agujas vuelven a las doce en punto", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    acertar(container, ex);
    runTimers(AUTOAVANCE_MS);

    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(12, 0)}`,
    );
  });

  it("fallo: no celebra, avisa con la pista y ofrece reintentar y siguiente", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    // Las doce en punto solo es la respuesta si la hora pedida es esa.
    ponerAgujas(container, ex.hours === 12 ? 1 : 12, 0);
    comprobar(container);

    expect(container.querySelector(".rph__celebration")).toBeNull();
    expect(container.querySelector(".rph__hint")?.textContent).toContain("Casi");
    expect(container.querySelector(".activity-action--retry")).not.toBeNull();
    expect(container.querySelector(".activity-action--next")).not.toBeNull();
  });

  it("fallo: el stage se tiñe de rojo con la clase compartida de `reloj`", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    ponerAgujas(container, ex.hours === 12 ? 1 : 12, 0);
    comprobar(container);

    expect(container.querySelector(".reloj__stage")?.className).toContain("reloj__stage--wrong");
  });

  it("fallo: no avanza solo, aunque pasen los 900 ms", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    ponerAgujas(container, ex.hours === 12 ? 1 : 12, 0);
    comprobar(container);
    runTimers(AUTOAVANCE_MS * 3);

    expect(contador(container)).toBe(`1 / ${engine.generateSession("easy", 4242).length}`);
    expect(container.querySelector(".summary")).toBeNull();
  });

  it("reintentar devuelve las agujas a las doce y deja comprobar otra vez", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    ponerAgujas(container, 3, 30);
    comprobar(container);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);

    expect(container.querySelector(".activity-action--retry")).toBeNull();
    expect(container.querySelector(".rph__hint")).toBeNull();
    expect(container.querySelector(".rph__check-btn")).not.toBeNull();
    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(12, 0)}`,
    );
    expect(ex.target).not.toBe("12:00");
  });

  it("siguiente salta al ejercicio siguiente sin comprobar nada", () => {
    const sesion = engine.generateSession("easy", 4242);
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    ponerAgujas(container, sesion[0].hours === 12 ? 1 : 12, 0);
    comprobar(container);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--next")!);

    expect(contador(container)).toBe(`2 / ${sesion.length}`);
    expect(container.querySelector(".rph__target-big")?.textContent).toBe(sesion[1].target);
  });

  it("acertar tras un fallo no suma a la cuenta de correctas", () => {
    const sesion = engine.generateSession("easy", 4242);
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    // El primero se falla, se reintenta y se acierta: cuenta como fallado.
    ponerAgujas(container, sesion[0].hours === 12 ? 1 : 12, 0);
    comprobar(container);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-action--retry")!);
    acertar(container, sesion[0]);
    runTimers(AUTOAVANCE_MS);

    for (const ex of sesion.slice(1)) {
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    }

    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${sesion.length - 1}/${sesion.length}`,
    );
  });

  it("recorre la sesión entera y termina en el resumen", () => {
    const sesion = engine.generateSession("expert", 4242);
    const { container } = render(<RelojPonerHoraScreen {...props("expert", 4242)} />);

    sesion.forEach((ex) => {
      expect(container.querySelector(".rph__target-big")?.textContent).toBe(ex.target);
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    });

    expect(container.querySelector(".summary__stars")).not.toBeNull();
    expect(container.querySelector(".summary__stat-value")?.textContent).toBe(
      `${sesion.length}/${sesion.length}`,
    );
  });

  it("Repetir vuelve a la misma sesión, no a una nueva al azar", () => {
    // El resumen reinicia con la semilla de la sesión en curso (AGENT_RULES.md
    // §17): con `Date.now() % 999983` el niño vería un ejercicio distinto cada
    // vez que pulsa Repetir.
    const sesion = engine.generateSession("expert", 4242);
    const { container } = render(<RelojPonerHoraScreen {...props("expert", 4242)} />);

    sesion.forEach((ex) => {
      acertar(container, ex);
      runTimers(AUTOAVANCE_MS);
    });
    expect(container.querySelector(".summary")).not.toBeNull();

    fireEvent.click(container.querySelector(".summary__btn--primary")!);

    expect(container.querySelector(".summary")).toBeNull();
    expect(contador(container)).toBe(`1 / ${sesion.length}`);
    expect(container.querySelector(".rph__target-big")?.textContent).toBe(sesion[0].target);
  });

  it("el minutero se redondea a la rejilla de 5 en 5 y la horaria, a la hora", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("expert")} />);
    const svg = relojDe(container);

    // 47° de reloj son 7,83 minutos: cae en el minuto 10 de la rejilla.
    fireEvent.pointerDown(knob(container, "minute"), { pointerId: 1 });
    fireEvent.pointerMove(svg, puntoEnElAngulo(47));
    fireEvent.pointerUp(svg);

    // 107° son 3,57 horas: cae en las 4.
    fireEvent.pointerDown(knob(container, "hour"), { pointerId: 2 });
    fireEvent.pointerMove(svg, puntoEnElAngulo(107));
    fireEvent.pointerUp(svg);

    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(4, 10)}`,
    );
  });

  it("no se puede arrastrar con el ejercicio ya acertado", () => {
    const ex = engine.generateSession("easy", 4242)[0];
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    acertar(container, ex);
    ponerAgujas(container, 7, 45);

    expect(container.querySelector(".rph__clock")?.getAttribute("aria-label")).toBe(
      `Reloj de agujas marcando ${timeLabel(ex.hours, ex.minutes)}`,
    );
    // Las doce en punto son una respuesta distinta de la acertada, así que el
    // reloj no se ha movido de verdad.
    expect(ex.target).not.toBe("12:00");
  });

  it("no monta Numpad, DigitCell ni toggle: el reloj se resuelve arrastrando", () => {
    (["easy", "medium", "hard", "expert"] as const).forEach((diff) => {
      const { container } = render(<RelojPonerHoraScreen {...props(diff)} />);
      expect(container.querySelector(".shared-numpad")).toBeNull();
      expect(container.querySelector(".dab")).toBeNull();
      expect(container.querySelector(".input-toggle")).toBeNull();
      cleanup();
    });
  });

  it("sin ejercicios avisa y ofrece volver al catálogo", () => {
    vi.spyOn(engine, "generateSession").mockReturnValue([]);

    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    expect(container.textContent).toContain("No hay ningun ejercicio que mostrar");
    fireEvent.click(container.querySelector<HTMLButtonElement>(".act-error__btn")!);
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });

  it("salir desde la cabecera llama a onExit", () => {
    const { container } = render(<RelojPonerHoraScreen {...props("easy")} />);

    fireEvent.click(container.querySelector<HTMLButtonElement>(".activity-header__exit")!);

    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });
});
