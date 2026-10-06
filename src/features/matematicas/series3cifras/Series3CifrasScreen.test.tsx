import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Series3CifrasScreen } from "./Series3CifrasScreen";
import { smokeProps } from "../testing/smoke";

describe("Series3CifrasScreen smoke tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const mockProps = smokeProps("series3cifras", vi.fn(), "easy", 12345);

  it("TR-S3C.1: Se renderiza sin errores", () => {
    render(<Series3CifrasScreen {...mockProps} />);
    expect(screen.getByText(/¿Qué número falta\?/i)).toBeInTheDocument();
  });

  it("TR-S3C.2: Permite hacer clic en una opción y evalúa la respuesta", () => {
    render(<Series3CifrasScreen {...mockProps} />);
    const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("ser3c__opt"));

    fireEvent.click(buttons[0]!);

    const isCorrect = screen.queryByText("¡Correcto! ⭐") !== null;
    const isWrong = screen.queryByText(/Reintentar/i) !== null;
    expect(isCorrect || isWrong).toBe(true);
  });

  it("TR-S3C.3: Autoavanza si la respuesta es correcta", () => {
    render(<Series3CifrasScreen {...mockProps} />);
    const findAndClickCorrect = () => {
      const buttons = screen
        .getAllByRole("button")
        .filter((b) => b.className.includes("ser3c__opt"));

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

    expect(screen.queryByText("¡Correcto! ⭐")).not.toBeInTheDocument();
  });

  it("TR-S3C.4: Muestra el componente de Summary al terminar y permite reiniciar", () => {
    render(<Series3CifrasScreen {...mockProps} />);

    for (let i = 0; i < 10; i++) {
      const buttons = screen
        .getAllByRole("button")
        .filter((b) => b.className.includes("ser3c__opt"));

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

    expect(screen.getByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i)).toBeInTheDocument();

    const restartBtn = screen.getByText(/Repetir/i);
    fireEvent.click(restartBtn);

    expect(
      screen.queryByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/¿Qué número falta\?/i)).toBeInTheDocument();
  });
});
