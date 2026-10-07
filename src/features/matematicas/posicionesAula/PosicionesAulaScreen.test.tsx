import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSession = [
  {
    container: "caja",
    object: "pelota",
    position: "dentro",
    question: "¿Dónde está la pelota?",
    options: ["Dentro", "Fuera"],
    correctAnswer: "Dentro",
  },
  {
    container: "mesa",
    object: "lápiz",
    position: "encima",
    question: "¿Dónde está el lápiz?",
    options: ["Encima", "Debajo", "Al lado", "Fuera"],
    correctAnswer: "Encima",
  },
];

vi.mock("../../../core/activities/posicionesAula", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) =>
    ans.toLowerCase() === ex.correctAnswer.toLowerCase(),
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

import PosicionesAulaScreen from "./PosicionesAulaScreen";

const baseProps = {
  activity: {
    id: "posicionesAula",
    engineId: "posicionesAula",
    subjectId: "mathematics",
    gradeIds: ["grade-1"],
    curriculumBlockIds: ["mathematics-grade-1-unit-2"],
    title: "Posiciones en el aula",
    description: "Identifica la posición de objetos: encima, debajo, dentro, fuera",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "📦",
      unit: 2,
      unitLabel: "Nos divertimos con los números",
      difficultyDescriptions: {
        easy: "Cuatro posiciones básicas: encima, debajo, dentro, fuera",
        medium: "Mismas posiciones con más variedad de objetos y recipientes",
        hard: 'Añade "al lado" con mesa y silla',
        expert: "Todas las posiciones mezcladas",
      },
    },
    order: 53,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "1.º Primaria",
  onExit: vi.fn(),
};

describe("PosicionesAulaScreen smoke tests (TR-PA)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-PA.1 — renderiza el header con título, grado y contador", () => {
    render(<PosicionesAulaScreen {...baseProps} />);
    expect(screen.getByText(/posiciones en el aula/i)).toBeInTheDocument();
  });

  it("TR-PA.2 — muestra la escena SVG con contenedor y objeto", () => {
    render(<PosicionesAulaScreen {...baseProps} />);
    expect(screen.getByTestId("posiciones-aula-svg")).toBeInTheDocument();
    expect(screen.getByText(/dónde está la pelota/i)).toBeInTheDocument();
  });

  it("TR-PA.3 — muestra botones de respuesta con las opciones", () => {
    render(<PosicionesAulaScreen {...baseProps} />);
    const opts = screen.getAllByRole("button");
    expect(opts.length).toBeGreaterThanOrEqual(2);
    for (const o of mockSession[0].options) {
      expect(screen.getByRole("button", { name: o })).toBeInTheDocument();
    }
  });
});
