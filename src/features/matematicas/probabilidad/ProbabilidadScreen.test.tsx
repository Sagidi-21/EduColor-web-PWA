import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSession = [
  {
    type: "classify",
    context: "Mañana saldrá el sol por el este",
    question: "¿Es este suceso seguro, posible o imposible?",
    correctAnswer: "seguro",
    options: ["Seguro", "Posible", "Imposible"],
  },
  {
    type: "bag",
    context: "Bolsa: 3 pelotas roja, 2 pelotas azul.",
    question: "¿Es posible sacar una pelota roja?",
    correctAnswer: "posible",
    options: ["Seguro", "Posible", "Imposible"],
  },
];

vi.mock("../../../core/activities/probabilidad", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) =>
    ans.toLowerCase() === ex.correctAnswer.toLowerCase(),
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

import ProbabilidadScreen from "./ProbabilidadScreen";

const baseProps = {
  activity: {
    id: "probabilidad",
    engineId: "probabilidad",
    subjectId: "mathematics",
    gradeIds: ["grade-2"],
    curriculumBlockIds: ["mathematics-grade-2-unit-15"],
    title: "Probabilidad",
    description: "Clasifica sucesos como seguros, posibles o imposibles",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "🎲",
      unit: 15,
      unitLabel: "La probabilidad",
      difficultyDescriptions: {
        easy: "Solo sucesos seguros e imposibles (sin posibles)",
        medium: "Los tres tipos con situaciones cotidianas",
        hard: "Incluye ejercicios con bolsas de pelotas de colores",
        expert: "Todos los tipos mezclados",
      },
    },
    order: 51,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "2.º Primaria",
  onExit: vi.fn(),
};

describe("ProbabilidadScreen smoke tests (TR-PR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-PR.1 — renderiza el header con título, grado y contador", () => {
    render(<ProbabilidadScreen {...baseProps} />);
    expect(screen.getByText(/probabilidad/i)).toBeInTheDocument();
  });

  it("TR-PR.2 — muestra la tarjeta de evento con contexto y pregunta", () => {
    render(<ProbabilidadScreen {...baseProps} />);
    expect(screen.getByText(/mañana saldrá el sol/i)).toBeInTheDocument();
    expect(screen.getByText(/es este suceso seguro/i)).toBeInTheDocument();
  });

  it("TR-PR.3 — muestra 3 botones de respuesta con iconos", () => {
    render(<ProbabilidadScreen {...baseProps} />);
    const buttons = screen.getAllByRole("button", { name: /seguro|posible|imposible/i });
    expect(buttons.length).toBe(3);
  });
});
