import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CintaMetricaScreen } from "./CintaMetricaScreen";

describe("CintaMetricaScreen smoke tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // @ts-expect-error Mock minimal for testing
  const mockActivity = { id: "cintaMetrica", title: "Cinta Métrica", type: "game" as const };
  const mockProps = {
    activity: mockActivity,
    difficulty: "easy" as const,
    seed: 12345,
    onExit: vi.fn(),
  };

  it("TR-CM.1: Se renderiza sin errores", () => {
    render(<CintaMetricaScreen {...mockProps} />);
    expect(screen.getByText(/mide/i)).toBeInTheDocument();
  });

  it("TR-CM.2: Permite hacer clic en una opción y evalúa la respuesta", () => {
    render(<CintaMetricaScreen {...mockProps} />);

    // easy difficulty -> type is choose-unit, options are 'cm' and 'm'
    const cmButton = screen.getByText("cm");
    fireEvent.click(cmButton);

    // Some hint should appear since answer state is no longer 'idle'
    expect(screen.getByText(/mide \d+ (cm|m)/i)).toBeInTheDocument();
  });

  it("TR-CM.3: Autoavanza si la respuesta es correcta", () => {
    render(<CintaMetricaScreen {...mockProps} />);

    // Test need to find the correct one or we simulate both (one is wrong)
    const cmButton = screen.getByText("cm");
    const mButton = screen.getByText("m");

    // Just click one, if wrong click Retry then the other
    fireEvent.click(cmButton);
    if (screen.queryByText(/Reintentar/)) {
      fireEvent.click(screen.getByText(/Reintentar/));
      fireEvent.click(mButton);
    }

    expect(screen.getByText("¡Correcto! ⭐")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Check we moved to the next exercise
    expect(screen.queryByText("¡Correcto! ⭐")).not.toBeInTheDocument();
  });
});
