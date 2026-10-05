import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedondeoScreen } from "./RedondeoScreen";
import { smokeProps } from "../testing/smoke";

describe("RedondeoScreen smoke tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const mockProps = smokeProps("redondeo", vi.fn(), "easy", 12345);

  it("TR-RD.1: Se renderiza sin errores", () => {
    render(<RedondeoScreen {...mockProps} />);
    expect(screen.getByText(/Redondea/i)).toBeInTheDocument();
  });

  it("TR-RD.2: Permite hacer clic en una opción y evalúa la respuesta", () => {
    render(<RedondeoScreen {...mockProps} />);
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("redondeo__opt"));

    // We don't know which is correct, so we click the first one
    fireEvent.click(buttons[0]!);

    // It should either show "¡Correcto! ⭐" or a wrong feedback "Reintentar"
    const isCorrect = screen.queryByText("¡Correcto! ⭐") !== null;
    const isWrong = screen.queryByText(/Reintentar/i) !== null;

    expect(isCorrect || isWrong).toBe(true);
  });

  it("TR-RD.3: Autoavanza si la respuesta es correcta", () => {
    render(<RedondeoScreen {...mockProps} />);

    const findAndClickCorrect = () => {
      // Find the correct option by looking at the options and trying them
      const buttons = screen
        .getAllByRole("button")
        .filter((b) => b.className.includes("redondeo__opt"));

      fireEvent.click(buttons[0]!);
      if (screen.queryByText(/Reintentar/i)) {
        fireEvent.click(screen.getByText(/Reintentar/i));
        fireEvent.click(buttons[1]!);
        if (screen.queryByText(/Reintentar/i)) {
          fireEvent.click(screen.getByText(/Reintentar/i));
          fireEvent.click(buttons[2]!);
          if (screen.queryByText(/Reintentar/i)) {
            fireEvent.click(screen.getByText(/Reintentar/i));
            fireEvent.click(buttons[3]!);
          }
        }
      }
    };

    findAndClickCorrect();

    expect(screen.getByText("¡Correcto! ⭐")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Check we moved to the next exercise
    expect(screen.queryByText("¡Correcto! ⭐")).not.toBeInTheDocument();
  });

  it("TR-RD.4: Muestra el componente de Summary al terminar y permite reiniciar", () => {
    render(<RedondeoScreen {...mockProps} />);

    for (let i = 0; i < 10; i++) {
      const buttons = screen
        .getAllByRole("button")
        .filter((b) => b.className.includes("redondeo__opt"));

      fireEvent.click(buttons[0]!);
      if (screen.queryByText(/Reintentar/i)) {
        fireEvent.click(screen.getByText(/Reintentar/i));
        fireEvent.click(buttons[1]!);
        if (screen.queryByText(/Reintentar/i) && buttons.length > 2) {
          fireEvent.click(screen.getByText(/Reintentar/i));
          fireEvent.click(buttons[2]!);
          if (screen.queryByText(/Reintentar/i) && buttons.length > 3) {
            fireEvent.click(screen.getByText(/Reintentar/i));
            fireEvent.click(buttons[3]!);
          }
        }
      }

      act(() => {
        vi.advanceTimersByTime(1100);
      });
    }

    // Now it should show SummaryScreen
    expect(screen.getByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i)).toBeInTheDocument();

    // Restart
    const restartBtn = screen.getByText(/Repetir/i);
    fireEvent.click(restartBtn);

    // Should be back to first exercise
    expect(
      screen.queryByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Redondea|cerca/i)).toBeInTheDocument();
  });
});
