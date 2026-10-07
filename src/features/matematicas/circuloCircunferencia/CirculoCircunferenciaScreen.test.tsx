import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CirculoCircunferenciaScreen } from "./CirculoCircunferenciaScreen";
import { smokeProps } from "../testing/smoke";

describe("CirculoCircunferenciaScreen smoke tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const mockProps = smokeProps("circuloCircunferencia", vi.fn(), "easy", 12345);

  it("TR-CC.1: Se renderiza sin errores", () => {
    render(<CirculoCircunferenciaScreen {...mockProps} />);
    expect(screen.getByText(/¿Es un círculo o una circunferencia\?/i)).toBeInTheDocument();
  });

  it("TR-CC.2: Permite hacer clic en una opción y evalúa la respuesta", () => {
    render(<CirculoCircunferenciaScreen {...mockProps} />);
    const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("cc__opt"));

    fireEvent.click(buttons[0]!);

    const isCorrect = screen.queryByText("¡Correcto! ⭐") !== null;
    const isWrong = screen.queryByText(/Reintentar/i) !== null;
    expect(isCorrect || isWrong).toBe(true);
  });

  it("TR-CC.3: Autoavanza si la respuesta es correcta", () => {
    render(<CirculoCircunferenciaScreen {...mockProps} />);
    const findAndClickCorrect = () => {
      const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("cc__opt"));

      fireEvent.click(buttons[0]!);
      if (screen.queryByText(/Reintentar/i)) {
        fireEvent.click(screen.getByText(/Reintentar/i));
        fireEvent.click(buttons[1]!);
      }
    };

    findAndClickCorrect();
    expect(screen.getByText("¡Correcto! ⭐")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.queryByText("¡Correcto! ⭐")).not.toBeInTheDocument();
  });

  it("TR-CC.4: Muestra el componente de Summary al terminar y permite reiniciar", () => {
    render(<CirculoCircunferenciaScreen {...mockProps} />);

    for (let i = 0; i < 10; i++) {
      const buttons = screen.getAllByRole("button").filter((b) => b.className.includes("cc__opt"));

      fireEvent.click(buttons[0]!);
      if (screen.queryByText(/Reintentar/i)) {
        fireEvent.click(screen.getByText(/Reintentar/i));
        fireEvent.click(buttons[1]!);
      }

      act(() => {
        vi.advanceTimersByTime(900);
      });
    }

    expect(screen.getByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i)).toBeInTheDocument();

    const restartBtn = screen.getByText(/Repetir/i);
    fireEvent.click(restartBtn);

    expect(
      screen.queryByText(/¡Sigue practicando!|¡Bien hecho!|¡Excelente!/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/¿Es un círculo o una circunferencia\?/i)).toBeInTheDocument();
  });
});
