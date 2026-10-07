import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSession = [
  {
    type: "identify-name",
    shape: "cubo",
    question: "¿Cómo se llama este cuerpo geométrico?",
    correctAnswer: "Cubo",
    options: ["Cono", "Cubo", "Esfera", "Cilindro"],
  },
  {
    type: "real-object",
    shape: "esfera",
    question: "¿Qué cuerpo geométrico tiene la forma de una pelota?",
    correctAnswer: "Esfera",
    options: ["Cilindro", "Esfera", "Cubo", "Cono"],
  },
];

vi.mock("../../../core/activities/cuerpos3d", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) => ex.correctAnswer === ans,
  CUERPOS: {
    cubo: { name: "Cubo", faces: 6, edges: 12, vertices: 8, realObjects: ["un dado"] },
    esfera: { name: "Esfera", faces: 0, edges: 0, vertices: 0, realObjects: ["una pelota"] },
    cilindro: { name: "Cilindro", faces: 3, edges: 2, vertices: 0, realObjects: ["una lata"] },
    cono: { name: "Cono", faces: 2, edges: 1, vertices: 1, realObjects: ["un cucurucho"] },
    prisma: {
      name: "Prisma triangular",
      faces: 5,
      edges: 9,
      vertices: 6,
      realObjects: ["una tienda"],
    },
    piramide: {
      name: "Pirámide",
      faces: 5,
      edges: 8,
      vertices: 5,
      realObjects: ["pirámide Egipto"],
    },
  },
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

import Cuerpos3DScreen from "./Cuerpos3DScreen";

const baseProps = {
  activity: {
    id: "cuerpos3d",
    engineId: "cuerpos3d",
    subjectId: "mathematics",
    gradeIds: ["grade-2"],
    curriculumBlockIds: ["mathematics-grade-2-unit-13"],
    title: "Cuerpos geométricos",
    description: "Identifica y analiza cuerpos en tres dimensiones",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "📦",
      unit: 13,
      unitLabel: "Figuras y cuerpos geométricos",
      difficultyDescriptions: {
        easy: "Identifica el nombre del cuerpo",
        medium: "Cuenta caras y objetos reales",
        hard: "Cuenta vértices, caras y objetos",
        expert: "Todos los tipos: aristas, vértices, caras, objetos",
      },
    },
    order: 58,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "2.º Primaria",
  onExit: vi.fn(),
};

describe("Cuerpos3DScreen smoke tests (TR-C3D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-C3D.1 — renderiza el header con título", () => {
    render(<Cuerpos3DScreen {...baseProps} />);
    expect(screen.getByText(/cuerpos geométricos/i)).toBeInTheDocument();
  });

  it("TR-C3D.2 — muestra el SVG del cuerpo y la pregunta", () => {
    render(<Cuerpos3DScreen {...baseProps} />);
    expect(screen.getByText(mockSession[0].question)).toBeInTheDocument();
    expect(screen.getByTestId("cuerpos3d-svg")).toBeInTheDocument();
  });

  it("TR-C3D.3 — muestra botones de respuesta", () => {
    render(<Cuerpos3DScreen {...baseProps} />);
    const opts = screen.getAllByRole("button");
    expect(opts.length).toBeGreaterThanOrEqual(4);
  });
});
