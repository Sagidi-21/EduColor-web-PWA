import { describe, it, expect, vi, beforeEach } from "vitest";

const axiosMocks = vi.hoisted(() => {
  const post = vi.fn();
  return {
    create: vi.fn(() => ({
      post,
      interceptors: { response: { use: vi.fn() } },
    })),
    get: vi.fn(),
    post,
  };
});

vi.mock("axios", () => ({
  default: {
    create: axiosMocks.create,
    get: axiosMocks.get,
  },
}));

import { generateMascotWithGrok, generateMascotAssetsWithGrok } from "./huggingface.service";

const mockPost = axiosMocks.post;
const IMAGE_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";

const VALID_CONFIG = {
  theme: "space",
  customTheme: "",
  characterType: "ai_choice",
  customCharacterType: "",
  personality: ["funny", "curious"],
  nameMode: "ai",
  teacherName: "",
  visualStyle: "cartoon_3d",
  specialDetails: "",
};

describe("hf.service", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  describe("generateMascotWithGrok", () => {
    it("genera prompt con el tema y personalidad del config", async () => {
      mockPost.mockResolvedValueOnce({ data: new ArrayBuffer(100) });
      mockPost.mockResolvedValueOnce({
        data: [{ generated_text: "Astro" }],
      });

      await generateMascotWithGrok(VALID_CONFIG);

      const imageCall = mockPost.mock.calls[0];
      expect(imageCall[0]).toBe(`/models/${IMAGE_MODEL}`);
      expect(imageCall[1].inputs).toContain("space");
      expect(imageCall[1].inputs).toContain("funny");
      expect(imageCall[1].inputs).toContain("curious");
      expect(imageCall[1].inputs).toContain("AI choice");
    });

    it("usa teacherName cuando nameMode es 'teacher'", async () => {
      const config = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "Max" };
      mockPost.mockResolvedValueOnce({ data: new ArrayBuffer(100) });

      const result = await generateMascotWithGrok(config);

      expect(result.name).toBe("Max");
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("solicita un nombre por IA cuando nameMode es 'ai'", async () => {
      mockPost.mockResolvedValueOnce({ data: new ArrayBuffer(100) });
      mockPost.mockResolvedValueOnce({
        data: [{ generated_text: "  Nova  " }],
      });

      const result = await generateMascotWithGrok(VALID_CONFIG);
      expect(result.name).toBe("Nova");
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it("lanza ApiError con mensaje genérico cuando HF devuelve 401", async () => {
      const error = {
        response: {
          status: 401,
          data: { error: "Invalid token" },
        },
      };
      mockPost.mockRejectedValue(error);

      const thrown = await generateMascotWithGrok(VALID_CONFIG).catch((e) => e);
      expect(thrown).toBeDefined();
    });

    it("usa el prompt del sistema (security) en la llamada", async () => {
      mockPost.mockResolvedValueOnce({ data: new ArrayBuffer(100) });
      mockPost.mockResolvedValueOnce({
        data: [{ generated_text: "Astro" }],
      });

      await generateMascotWithGrok(VALID_CONFIG);

      const prompt = mockPost.mock.calls[0][1].inputs;
      expect(prompt).toContain("children's educational mathematics application");
      expect(prompt).toContain("non-violent");
      expect(prompt).toContain("free of weapons");
    });
  });

  describe("generateMascotAssetsWithGrok", () => {
    it("genera 6 assets usando text-to-image endpoint", async () => {
      mockPost.mockResolvedValue({ data: new ArrayBuffer(100) });

      const result = await generateMascotAssetsWithGrok(
        "https://example.com/ref.png",
        VALID_CONFIG,
      );

      expect(mockPost).toHaveBeenCalledTimes(6);
      expect(result.assets).toHaveProperty("explain");
      expect(result.assets).toHaveProperty("think");
      expect(result.assets).toHaveProperty("celebrate");
      expect(result.assets).toHaveProperty("encourage");
      expect(result.assets).toHaveProperty("header");
      expect(result.assets).toHaveProperty("blackboard");

      const calls = mockPost.mock.calls;
      expect(calls[0][0]).toBe(`/models/${IMAGE_MODEL}`);
      expect(calls[0][1].inputs).toContain("explanatory teaching pose");
    });

    it("incluye instrucciones de pose en cada prompt de asset", async () => {
      mockPost.mockResolvedValue({ data: new ArrayBuffer(100) });

      await generateMascotAssetsWithGrok("https://example.com/ref.png", VALID_CONFIG);

      const firstCallPrompt = mockPost.mock.calls[0][1].inputs;
      expect(firstCallPrompt).toContain("explanatory teaching pose");
      const blackboardCall = mockPost.mock.calls.find((c: any[]) =>
        c[1].inputs.includes("blackboard"),
      );
      expect(blackboardCall).toBeDefined();
      expect(blackboardCall?.[1].inputs).toContain("completely empty");
    });

    it("propaga el error cuando la API falla", async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 500,
          data: { error: "Internal error" },
        },
      });

      await expect(
        generateMascotAssetsWithGrok("https://example.com/ref.png", VALID_CONFIG),
      ).rejects.toThrow();
    });
  });
});
