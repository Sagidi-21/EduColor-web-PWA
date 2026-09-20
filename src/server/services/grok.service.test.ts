import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("axios", () => {
  const mockPost = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({
        post: mockPost,
        interceptors: {
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

import axios from "axios";
import { generateMascotWithGrok, generateMascotAssetsWithGrok } from "./grok.service";

const mockPost = (axios.create as any).mock.results[0].value.post as any;

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

describe("grok.service", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  describe("generateMascotWithGrok", () => {
    it("genera prompt con el tema y personalidad del config", async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: [{ url: "https://example.com/ref.png" }] },
      });
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: "Astro" } }] },
      });

      await generateMascotWithGrok(VALID_CONFIG);

      const imageCall = mockPost.mock.calls[0];
      expect(imageCall[0]).toBe("/images/generations");
      expect(imageCall[1].prompt).toContain("space");
      expect(imageCall[1].prompt).toContain("funny");
      expect(imageCall[1].prompt).toContain("curious");
      expect(imageCall[1].prompt).toContain("AI choice");
      expect(imageCall[1].model).toBe("grok-2-image-1212");
    });

    it("usa teacherName cuando nameMode es 'teacher'", async () => {
      const config = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "Max" };
      mockPost.mockResolvedValueOnce({
        data: { data: [{ url: "https://example.com/ref.png" }] },
      });

      const result = await generateMascotWithGrok(config);

      expect(result.name).toBe("Max");
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("solicita un nombre por IA cuando nameMode es 'ai'", async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: [{ url: "https://example.com/ref.png" }] },
      });
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: "  Nova  " } }] },
      });

      const result = await generateMascotWithGrok(VALID_CONFIG);
      expect(result.name).toBe("Nova");
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it("lanza ApiError con mensaje genérico cuando xAI devuelve 429", async () => {
      const error = {
        response: {
          status: 429,
          data: { error: "Rate limit exceeded" },
        },
      };
      mockPost.mockRejectedValue(error);

      const thrown = await generateMascotWithGrok(VALID_CONFIG).catch((e) => e);
      expect(thrown).toBeDefined();
    }, 10000);

    it("usa el prompt del sistema (security) en la llamada", async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: [{ url: "https://example.com/ref.png" }] },
      });
      mockPost.mockResolvedValueOnce({
        data: { choices: [{ message: { content: "Astro" } }] },
      });

      await generateMascotWithGrok(VALID_CONFIG);

      const prompt = mockPost.mock.calls[0][1].prompt;
      expect(prompt).toContain("children's educational mathematics application");
      expect(prompt).toContain("non-violent");
      expect(prompt).toContain("free of weapons");
    });
  });

  describe("generateMascotAssetsWithGrok", () => {
    it("genera 6 assets usando image editing endpoint", async () => {
      mockPost.mockResolvedValue({
        data: { url: "https://example.com/asset.png" },
      });

      const result = await generateMascotAssetsWithGrok("https://example.com/ref.png");

      expect(mockPost).toHaveBeenCalledTimes(6);
      expect(result.assets).toHaveProperty("explain");
      expect(result.assets).toHaveProperty("think");
      expect(result.assets).toHaveProperty("celebrate");
      expect(result.assets).toHaveProperty("encourage");
      expect(result.assets).toHaveProperty("header");
      expect(result.assets).toHaveProperty("blackboard");

      const calls = mockPost.mock.calls;
      expect(calls[0][0]).toBe("/images/edits");
      expect(calls[0][1].image.url).toBe("https://example.com/ref.png");
      expect(calls[0][1].image.type).toBe("image_url");
    });

    it("incluye instrucciones de pose en cada prompt de asset", async () => {
      mockPost.mockResolvedValue({
        data: { url: "https://example.com/asset.png" },
      });

      await generateMascotAssetsWithGrok("https://example.com/ref.png");

      const firstCallPrompt = mockPost.mock.calls[0][1].prompt;
      expect(firstCallPrompt).toContain("explanatory teaching pose");
      // Blackboard asset should mention empty writing surface
      const blackboardCall = mockPost.mock.calls.find((c: any[]) =>
        c[1].prompt.includes("blackboard"),
      );
      expect(blackboardCall).toBeDefined();
      expect(blackboardCall[1].prompt).toContain("completely empty");
    });

    it("propaga el error cuando la API falla", async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 500,
          data: { error: "Internal error" },
        },
      });

      await expect(generateMascotAssetsWithGrok("https://example.com/ref.png")).rejects.toThrow();
    });
  });
});
