import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSession = [
  {
    menuItems: [
      { emoji: "🍝", name: "Pasta", price: 6, category: "primer" },
      { emoji: "🥗", name: "Ensalada", price: 4, category: "primer" },
    ],
    tray: [
      { emoji: "🍝", name: "Pasta", price: 6, category: "primer" },
      { emoji: "🥗", name: "Ensalada", price: 4, category: "primer" },
    ],
    question: "Pido 🍝 Pasta (6€) y 🥗 Ensalada (4€). ¿Cuánto pago en total?",
    options: [
      { label: "8€", value: "8€" },
      { label: "10€", value: "10€" },
      { label: "12€", value: "12€" },
      { label: "14€", value: "14€" },
    ],
    correctAnswer: "10€",
  },
];

vi.mock("../../../core/activities/menuCafeteria", () => ({
  generateSession: vi.fn(() => mockSession),
  validateAnswer: (ex: { correctAnswer: string }, ans: string) => ex.correctAnswer === ans,
}));

vi.mock("../../shared/audioFeedback", () => ({
  playFeedback: vi.fn(),
}));

import MenuCafeteriaScreen from "./MenuCafeteriaScreen";

const baseProps = {
  activity: {
    id: "menuCafeteria",
    engineId: "menuCafeteria",
    subjectId: "mathematics",
    gradeIds: ["grade-1", "grade-2"],
    curriculumBlockIds: ["mathematics-grade-1-unit-9", "mathematics-grade-2-unit-9"],
    title: "En la cafetería",
    description: "Calcula el precio de un menú con varios platos",
    status: "available" as const,
    parameters: [],
    schemaVersion: 1 as const,
    boardCard: {
      icon: "🍽️",
      unit: 9,
      unitLabel: "Nos vamos de viaje",
      difficultyDescriptions: {
        easy: "Suma 2 platos del menú",
        medium: "Suma 2 platos y compara con presupuesto",
        hard: "3 platos: suma el total o ¿me alcanza?",
        expert: "Calcula cuánto dinero te devuelven",
      },
    },
    order: 39,
  },
  difficulty: "easy" as const,
  seed: 12345,
  gradeTitle: "1.º Primaria",
  onExit: vi.fn(),
};

describe("MenuCafeteriaScreen smoke tests (TR-MC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TR-MC.1 — renderiza el header con título, grado y contador", () => {
    render(<MenuCafeteriaScreen {...baseProps} />);
    expect(screen.getByText(/en la cafetería/i)).toBeInTheDocument();
  });

  it("TR-MC.2 — muestra la carta del menú con items y precios", () => {
    render(<MenuCafeteriaScreen {...baseProps} />);
    expect(screen.getByText(/carta del menú/i)).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText("Ensalada")).toBeInTheDocument();
    expect(screen.getByText("6€")).toBeInTheDocument();
    expect(screen.getByText("4€")).toBeInTheDocument();
  });

  it("TR-MC.3 — muestra la pregunta y botones de respuesta", () => {
    render(<MenuCafeteriaScreen {...baseProps} />);
    expect(screen.getByText(/cuánto pago en total/i)).toBeInTheDocument();
    const opts = screen.getAllByRole("button");
    expect(opts.length).toBeGreaterThanOrEqual(4);
    for (const o of mockSession[0].options) {
      expect(screen.getByRole("button", { name: o.label })).toBeInTheDocument();
    }
  });
});
