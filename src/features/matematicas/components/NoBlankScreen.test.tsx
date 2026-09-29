import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ActivityErrorBoundary } from "./ActivityErrorBoundary";
import { NoExerciseNotice } from "./NoExerciseNotice";
import { smokeProps } from "../testing/smoke";
import { SeriesScreen } from "../series/SeriesScreen";
import { Numeracion1119Screen } from "../numeracion1119/Numeracion1119Screen";
import * as seriesEngine from "../../../core/activities/series";
import * as n1119 from "../../../core/activities/numeracion1119";

describe("pantalla en blanco: ninguna actividad se queda sin decir nada", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("un fallo al renderizar muestra aviso en vez de pantalla vacia", () => {
    const onExit = vi.fn();
    const Explosivo = () => {
      throw new Error("fallo de carga del trozo");
    };
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ActivityErrorBoundary activityTitle="Números del 11 al 19" onExit={onExit}>
        <Explosivo />
      </ActivityErrorBoundary>,
    );

    expect(container.textContent).toContain("No se ha podido cargar la actividad");
    // Y hay una salida, que antes no habia: el onExit vive en la cabecera.
    const salir = screen.getByText("Volver al catalogo");
    fireEvent.click(salir);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("el aviso registra el fallo en consola para poder diagnosticarlo", () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});
    const Explosivo = () => {
      throw new Error("se rompio el trozo de TF.js");
    };

    render(
      <ActivityErrorBoundary activityTitle="Series numéricas" onExit={vi.fn()}>
        <Explosivo />
      </ActivityErrorBoundary>,
    );

    expect(espia).toHaveBeenCalled();
    const mensaje = espia.mock.calls.map((c) => c.map(String).join(" ")).join("\n");
    expect(mensaje).toContain("Series numéricas");
  });

  it("una sesion vacia de series avisa y permite volver al catalogo", () => {
    const onExit = vi.fn();
    vi.spyOn(seriesEngine, "generateSeriesSession").mockReturnValue([]);

    const { container } = render(
      <SeriesScreen {...smokeProps("seriesNumericas", onExit, "medium", 4242)} />,
    );

    expect(container.textContent).toContain("No hay ningun ejercicio que mostrar");
    fireEvent.click(screen.getByText("Volver al catalogo"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("una sesion vacia de numeracion avisa y permite volver al catalogo", () => {
    const onExit = vi.fn();
    vi.spyOn(n1119, "generateNumeracion1119Session").mockReturnValue([]);

    const { container } = render(
      <Numeracion1119Screen {...smokeProps("numeracion1119", onExit, "medium", 4242)} />,
    );

    expect(container.textContent).toContain("No hay ningun ejercicio que mostrar");
    fireEvent.click(screen.getByText("Volver al catalogo"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("el aviso es utilizable con el dedo: botones grandes y texto legible", () => {
    const { container } = render(
      <NoExerciseNotice activityTitle="Números del 60 al 99" onExit={vi.fn()} />,
    );

    const boton = container.querySelector(".act-error__btn");
    expect(boton).not.toBeNull();
    // Se comprueba que hay un boton real con su clase, sin fijar medidas en
    // pixeles, que dependen del CSS.
    expect(boton?.className).toContain("act-error__btn");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
