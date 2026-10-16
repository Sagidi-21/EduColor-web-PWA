import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSession = [
  {
    type: "add-add",
    op1: "+",
    op2: "+",
    a: 5,
    b: 3,
    c: 2,
    mid: 8,
    result: 10,
    story: [
      "María tiene 5 cromos.",
      "Le dan 3 cromos más por su cumpleaños",
      "y después compra 2 cromos más en la tienda.",
    ],
    question: "¿Cuántos cromos tiene ahora?",
    correctAnswer: "10",
    options: ["8", "10", "12", "14"],
  },
];

vi.mock("../../../core/activities/problemas2pasos", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) => ans === ex.correctAnswer,
  validateSteps: (ex: { mid: number; result: number }, mid: string, result: string) =>
    String(ex.mid) === mid && String(ex.result) === result,
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

const inputModeMock = vi.hoisted(() => ({
  mode: "numpad" as "numpad" | "canvas",
  toggle: vi.fn(),
}));

vi.mock("../../shared/hooks/useInputMode", () => ({
  useInputMode: () => inputModeMock,
}));

vi.mock("../../shared/components/InputModeToggle", () => ({
  default: () => <div data-testid="input-mode-toggle" />,
}));

vi.mock("../../shared/DigitCell", () => ({
  LazyDigitCell: ({ isActive }: { isActive?: boolean }) => (
    <div data-testid="digit-cell" data-active={isActive ? "1" : "0"} />
  ),
}));

import Problemas2PasosScreen from "./Problemas2PasosScreen";

const baseProps = {
  activity: {
    id: "problemas2pasos",
    engineId: "problemas2pasos",
    subjectId: "mathematics",
    gradeIds: ["grade-2"],
    curriculumBlockIds: ["mathematics-grade-2-unit-16"],
    title: "Problemas de 2 pasos",
    description: "Resuelve problemas que necesitan dos operaciones",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "🧩",
      unit: 16,
      unitLabel: "Resolvemos problemas",
      difficultyDescriptions: {
        easy: "Dos sumas con números hasta 20",
        medium: "Suma y resta con números hasta 50",
        hard: "Todos los tipos con números hasta 100",
        expert: "Todos los tipos con números hasta 200",
      },
    },
    order: 52,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "2.º Primaria",
  onExit: vi.fn(),
};

describe("Problemas2PasosScreen — layout B", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inputModeMock.mode = "numpad";
  });

  it("renderiza historia, pregunta y dos pasos", () => {
    const { container } = render(<Problemas2PasosScreen {...baseProps} />);
    expect(
      screen.getByText(/maría tiene 5 cromos.*le dan 3 cromos más.*compra 2 cromos/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/¿cuántos cromos tiene ahora/i)).toBeInTheDocument();
    expect(screen.getByText("Paso 1")).toBeInTheDocument();
    expect(screen.getByText("Paso 2")).toBeInTheDocument();
    expect(container.querySelectorAll(".p2p__op")).toHaveLength(2);
  });

  it("usa split 2/3–1/3 con numpad", () => {
    const { container } = render(<Problemas2PasosScreen {...baseProps} />);
    expect(container.querySelector(".p2p__body--split")).toBeTruthy();
    expect(container.querySelector(".p2p__panel")).toBeTruthy();
    expect(container.querySelector(".shared-numpad")).toBeTruthy();
  });

  it("muestra un recuadro por dígito (mid 1 cifra, result 2 cifras)", () => {
    const { container } = render(<Problemas2PasosScreen {...baseProps} />);
    const ops = container.querySelectorAll(".p2p__op");
    expect(ops[0]!.querySelectorAll(".p2p__box")).toHaveLength(1); // mid = 8
    expect(ops[1]!.querySelectorAll(".p2p__box")).toHaveLength(2); // result = 10
  });

  it("empieza por las unidades (casilla derecha activa)", () => {
    const { container } = render(<Problemas2PasosScreen {...baseProps} />);
    // mid de 1 cifra: la única casilla está activa
    const midBoxes = container.querySelectorAll(".p2p__op")[0]!.querySelectorAll(".p2p__box");
    expect(midBoxes[0]!.classList.contains("p2p__box--active")).toBe(true);

    const keys = Array.from(container.querySelectorAll(".shared-numpad__key"));
    fireEvent.click(keys.find((k) => k.textContent === "8")!);

    // result = 10 → activa la de la derecha (unidades)
    const resultBoxes = container.querySelectorAll(".p2p__op")[1]!.querySelectorAll(".p2p__box");
    expect(resultBoxes[0]!.classList.contains("p2p__box--active")).toBe(false);
    expect(resultBoxes[1]!.classList.contains("p2p__box--active")).toBe(true);
  });

  it("en modo canvas monta un DigitCell por dígito del paso activo", () => {
    inputModeMock.mode = "canvas";
    const { rerender } = render(<Problemas2PasosScreen {...baseProps} />);
    // Paso 1: mid = 8 → 1 canvas
    expect(screen.getAllByTestId("digit-cell")).toHaveLength(1);

    // Tras completar mid, paso 2: result = 10 → 2 canvases
    inputModeMock.mode = "numpad";
    rerender(<Problemas2PasosScreen {...baseProps} />);
    const keys = Array.from(document.querySelectorAll(".shared-numpad__key"));
    const digit = (n: string) => {
      const btn = keys.find((k) => k.textContent === n);
      if (!btn) throw new Error(`Falta tecla ${n}`);
      fireEvent.click(btn);
    };
    digit("8");
    inputModeMock.mode = "canvas";
    rerender(<Problemas2PasosScreen {...baseProps} />);
    expect(screen.getAllByTestId("digit-cell")).toHaveLength(2);
  });

  it("no muestra chips de opción múltiple", () => {
    render(<Problemas2PasosScreen {...baseProps} />);
    expect(screen.queryByRole("button", { name: /^14$/ })).toBeNull();
  });

  it("al escribir mid y resultado correctos celebra", () => {
    const { container } = render(<Problemas2PasosScreen {...baseProps} />);
    const keys = Array.from(container.querySelectorAll(".shared-numpad__key"));
    const digit = (n: string) => {
      const btn = keys.find((k) => k.textContent === n);
      if (!btn) throw new Error(`Falta tecla ${n}`);
      fireEvent.click(btn);
    };
    digit("8"); // mid
    digit("0"); // unidades de 10
    digit("1"); // decenas de 10
    expect(screen.getByText(/¡Correcto!/i)).toBeInTheDocument();
  });
});
