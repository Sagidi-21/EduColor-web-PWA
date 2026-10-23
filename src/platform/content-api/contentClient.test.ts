import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();

vi.mock("../supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    functions: { invoke },
  }),
}));

describe("contentClient", () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockReset();
  });

  it("fetchSumaSession parsea exercises del servidor", async () => {
    invoke.mockResolvedValue({
      data: {
        exercises: [{ a: 1, b: 2, op: "suma", answer: 3, imageUrl: "" }],
      },
      error: null,
    });
    const { fetchSumaSession } = await import("./contentClient");
    const ex = await fetchSumaSession({ difficulty: "easy", seed: 42 });
    expect(ex).toEqual([{ a: 1, b: 2, op: "suma", answer: 3, imageUrl: "" }]);
    expect(invoke).toHaveBeenCalledWith("content-session", {
      body: { activityId: "suma", difficulty: "easy", seed: 42 },
    });
  });

  it("fetchSumaFichaExercises mapea a OperationSheetExercise", async () => {
    invoke.mockResolvedValue({
      data: {
        exercises: [{ kind: "operation", a: 2, b: 3, op: "+", imageUrl: "", answer: 5 }],
      },
      error: null,
    });
    const { fetchSumaFichaExercises } = await import("./contentClient");
    const ex = await fetchSumaFichaExercises({
      difficulty: "easy",
      seed: 1,
      count: 1,
      modes: ["soluciones"],
      withImages: false,
    });
    expect(ex[0]).toMatchObject({ kind: "operation", a: 2, b: 3, op: "+", answer: 5 });
  });

  it("propaga 403 como ContentClientError forbidden", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        message: "Forbidden",
        context: {
          status: 403,
          json: async () => ({ error: "Forbidden" }),
        },
      },
    });
    const { fetchSumaSession, ContentClientError } = await import("./contentClient");
    await expect(fetchSumaSession({ difficulty: "easy", seed: 1 })).rejects.toMatchObject({
      name: "ContentClientError",
      code: "forbidden",
    });
    expect(ContentClientError).toBeDefined();
  });
});
