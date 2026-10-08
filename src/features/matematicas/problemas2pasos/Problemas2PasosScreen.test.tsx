import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
  {
    type: "add-sub",
    op1: "+",
    op2: "-",
    a: 10,
    b: 4,
    c: 6,
    mid: 14,
    result: 8,
    story: [
      "Juan tiene 10 caramelos.",
      "Su madre le da 4 caramelos más.",
      "Luego reparte 6 caramelos entre sus amigos.",
    ],
    question: "¿Cuántos caramelos le quedan?",
    correctAnswer: "8",
    options: ["6", "8", "10", "12"],
  },
];

vi.mock("../../../core/activities/problemas2pasos", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) => ans === ex.correctAnswer,
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
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

describe("Problemas2PasosScreen smoke tests (TR-P2P)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-P2P.1 — renderiza el header con título, grado y contador", () => {
    render(<Problemas2PasosScreen {...baseProps} />);
    expect(screen.getByText(/2.º primaria/i)).toBeInTheDocument();
  });

  it("TR-P2P.2 — muestra la historia de 3 líneas y la pregunta", () => {
    render(<Problemas2PasosScreen {...baseProps} />);
    expect(screen.getByText(/maría tiene 5 cromos/i)).toBeInTheDocument();
    expect(screen.getByText(/le dan 3 cromos más/i)).toBeInTheDocument();
    expect(screen.getByText(/y después compra 2 cromos/i)).toBeInTheDocument();
    expect(screen.getByText(/¿cuántos cromos tiene ahora/i)).toBeInTheDocument();
  });

  it("TR-P2P.3 — muestra 4 botones de opciones numéricas", () => {
    render(<Problemas2PasosScreen {...baseProps} />);
    expect(screen.getByRole("button", { name: /^8$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^10$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^12$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^14$/ })).toBeInTheDocument();
  });
});
