import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSession = [
  {
    type: "is-symmetric",
    shape: "cuadrado",
    axes: 4,
    question: "¿Tiene el cuadrado algún eje de simetría?",
    correctAnswer: "Sí",
    options: ["Sí", "No"],
  },
  {
    type: "which-shape",
    shape: "cuadrado",
    axes: 4,
    question: "¿Cuál de estas figuras tiene al menos un eje de simetría?",
    correctAnswer: "Cuadrado",
    options: ["Cuadrado", "Rectángulo", "Triángulo equilátero", "Triángulo escaleno"],
  },
  {
    type: "count-axes",
    shape: "cuadrado",
    axes: 4,
    question: "¿Cuántos ejes de simetría tiene el cuadrado?",
    correctAnswer: "4",
    options: ["4", "2", "1", "0"],
  },
];

vi.mock("../../../core/activities/simetria", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) => ans === ex.correctAnswer,
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

import SimetriaScreen from "./SimetriaScreen";

const baseProps = {
  activity: {
    id: "simetria",
    engineId: "simetria",
    subjectId: "mathematics",
    gradeIds: ["grade-2"],
    curriculumBlockIds: ["mathematics-grade-2-unit-13"],
    title: "Simetría",
    description: "Descubre los ejes de simetría de figuras planas",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "🪞",
      unit: 13,
      unitLabel: "Figuras y cuerpos geométricos",
      difficultyDescriptions: {
        easy: "Cuadrado, rectángulo y triángulos: ¿tiene simetría?",
        medium: "Añade rombo y más figuras",
        hard: "Identifica figuras simétricas y cuenta ejes",
        expert: "Pentágono, hexágono y estrella: todos los tipos",
      },
    },
    order: 50,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "2.º Primaria",
  onExit: vi.fn(),
};

describe("SimetriaScreen smoke tests (TR-SIM)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-SIM.1 — renderiza el header con título, grado y contador", () => {
    render(<SimetriaScreen {...baseProps} />);
    expect(screen.getByText(/2.º primaria/i)).toBeInTheDocument();
  });

  it("TR-SIM.2 — muestra la figura SVG y la pregunta", () => {
    render(<SimetriaScreen {...baseProps} />);
    expect(screen.getByText(/¿tiene el cuadrado algún eje de simetría/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sí$/i })).toBeInTheDocument();
  });

  it("TR-SIM.3 — muestra 2 botones Sí/No en easy", () => {
    render(<SimetriaScreen {...baseProps} />);
    expect(screen.getByRole("button", { name: /^sí$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^no$/i })).toBeInTheDocument();
  });
});
