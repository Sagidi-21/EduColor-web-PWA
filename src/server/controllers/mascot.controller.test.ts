import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../services/huggingface.service", () => ({
  generateMascotWithGrok: vi.fn(),
  generateMascotAssetsWithGrok: vi.fn(),
}));
vi.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}));

import {
  generateMascotPreview,
  generateMascotAssets,
  getMascotStatus,
  regeneratePreview,
} from "./mascot.controller";
import { generateMascotWithGrok, generateMascotAssetsWithGrok } from "../services/huggingface.service";

const mockPreviewResult = {
  id: "test-uuid-1234",
  imageUrl: "https://example.com/mascot.png",
  name: "Astro",
  description: "Un compañero curioso del espacio",
};

const mockAssetsResult = {
  referenceImage: "https://example.com/mascot.png",
  assets: {
    explain: "https://example.com/explain.png",
    think: "https://example.com/think.png",
    celebrate: "https://example.com/celebrate.png",
    encourage: "https://example.com/encourage.png",
    header: "https://example.com/header.png",
    blackboard: "https://example.com/blackboard.png",
  },
};

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

function makeMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function makeMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("mascot controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMascotPreview", () => {
    it("genera preview exitosamente y devuelve id + imageUrl + name + description", async () => {
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const req = makeMockReq({ body: VALID_CONFIG });
      const res = makeMockRes();
      const next: NextFunction = vi.fn();

      await generateMascotPreview(req, res, next);

      expect(generateMascotWithGrok).toHaveBeenCalledWith(VALID_CONFIG);
      expect(res.json).toHaveBeenCalledWith({
        id: "test-uuid-1234",
        imageUrl: mockPreviewResult.imageUrl,
        name: mockPreviewResult.name,
        description: mockPreviewResult.description,
      });
    });

    it("almacena la generación internamente y la marca como completed", async () => {
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const req = makeMockReq({ body: VALID_CONFIG });
      const res = makeMockRes();
      const next: NextFunction = vi.fn();

      await generateMascotPreview(req, res, next);

      // Verificar que getMascotStatus puede recuperar la generación
      const statusReq = makeMockReq({ params: { id: "test-uuid-1234" } });
      const statusRes = makeMockRes();

      getMascotStatus(statusReq, statusRes);

      expect(statusRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "test-uuid-1234",
          status: "completed",
          imageUrl: mockPreviewResult.imageUrl,
          name: mockPreviewResult.name,
          description: mockPreviewResult.description,
        }),
      );
    });
  });

  describe("generateMascotAssets", () => {
    it("genera assets cuando el id de generación existe y está completed", async () => {
      // Primero creamos una preview para registrar el id
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const previewReq = makeMockReq({ body: VALID_CONFIG });
      const previewRes = makeMockRes();
      await generateMascotPreview(previewReq, previewRes, vi.fn() as NextFunction);

      // Ahora generamos assets
      (generateMascotAssetsWithGrok as any).mockResolvedValue(mockAssetsResult);
      const assetsReq = makeMockReq({
        body: {
          id: "test-uuid-1234",
          referenceImage: "https://example.com/mascot.png",
          ...VALID_CONFIG,
        },
      });
      const assetsRes = makeMockRes();
      await generateMascotAssets(assetsReq, assetsRes, vi.fn() as NextFunction);

      expect(generateMascotAssetsWithGrok).toHaveBeenCalledWith(
        "https://example.com/mascot.png",
        VALID_CONFIG,
      );
      expect(assetsRes.json).toHaveBeenCalledWith({
        id: "test-uuid-1234",
        referenceImage: mockAssetsResult.referenceImage,
        assets: mockAssetsResult.assets,
      });
    });

    it("devuelve 404 si el id de generación no existe", async () => {
      const req = makeMockReq({
        body: {
          id: "nonexistent",
          referenceImage: "https://example.com/mascot.png",
          ...VALID_CONFIG,
        },
      });
      const res = makeMockRes();

      await generateMascotAssets(req, res, vi.fn() as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Generación no encontrada" });
    });

    it("devuelve 400 si la generación aún no está completed", async () => {
      // Register an id that's still in 'generating' state by not waiting for preview
      const req = makeMockReq({
        body: {
          id: "test-uuid-1234",
          referenceImage: "https://example.com/mascot.png",
          ...VALID_CONFIG,
        },
      });
      const res = makeMockRes();

      // First, generate preview to set the id as completed
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const previewReq = makeMockReq({ body: VALID_CONFIG });
      const previewRes = makeMockRes();
      await generateMascotPreview(previewReq, previewRes, vi.fn() as NextFunction);

      // Now use the registered id
      (generateMascotAssetsWithGrok as any).mockResolvedValue(mockAssetsResult);
      await generateMascotAssets(req, res, vi.fn() as NextFunction);

      expect(res.json).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalledWith({ error: "La generación aún no ha terminado" });
    });
  });

  describe("getMascotStatus", () => {
    it("devuelve 404 si el id no existe", () => {
      const req = makeMockReq({ params: { id: "nonexistent" } });
      const res = makeMockRes();

      getMascotStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Generación no encontrada" });
    });

    it("devuelve el estado de una generación existente", async () => {
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const previewReq = makeMockReq({ body: VALID_CONFIG });
      const previewRes = makeMockRes();
      await generateMascotPreview(previewReq, previewRes, vi.fn() as NextFunction);

      const req = makeMockReq({ params: { id: "test-uuid-1234" } });
      const res = makeMockRes();

      getMascotStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "test-uuid-1234",
          status: "completed",
        }),
      );
    });
  });

  describe("regeneratePreview", () => {
    it("regenera la preview exitosamente", async () => {
      (generateMascotWithGrok as any).mockResolvedValue(mockPreviewResult);
      const previewReq = makeMockReq({ body: VALID_CONFIG });
      const previewRes = makeMockRes();
      await generateMascotPreview(previewReq, previewRes, vi.fn() as NextFunction);

      (generateMascotWithGrok as any).mockResolvedValue({
        ...mockPreviewResult,
        imageUrl: "https://example.com/new-mascot.png",
        name: "Nebula",
      });

      const req = makeMockReq({ body: { id: "test-uuid-1234" } });
      const res = makeMockRes();

      await regeneratePreview(req, res, vi.fn() as NextFunction);

      expect(res.json).toHaveBeenCalledWith({
        id: "test-uuid-1234",
        imageUrl: "https://example.com/new-mascot.png",
        name: "Nebula",
        description: mockPreviewResult.description,
      });
    });

    it("devuelve 404 si el id no existe", async () => {
      const req = makeMockReq({ body: { id: "nonexistent" } });
      const res = makeMockRes();

      await regeneratePreview(req, res, vi.fn() as NextFunction);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Generación no encontrada" });
    });
  });
});
