import { Request, Response } from "express";
import {
  generateMascotWithGrok,
  generateMascotAssetsWithGrok,
  checkHfConnection,
} from "../services/huggingface.service.ts";
import { v4 as uuidv4 } from "uuid";
import { MascotConfig, MascotPreviewResult, MascotAssetsResult } from "../types.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";

interface GenerationEntry {
  id: string;
  status: "pending" | "generating" | "completed" | "failed";
  config: MascotConfig;
  imageUrl?: string;
  name?: string;
  description?: string;
  error?: string;
  createdAt: Date;
}

const generationStore = new Map<string, GenerationEntry>();

export const generateMascotPreview = asyncHandler(async (req: Request, res: Response) => {
  const generationId = uuidv4();
  const config = req.body as MascotConfig;

  generationStore.set(generationId, {
    id: generationId,
    status: "generating",
    config,
    createdAt: new Date(),
  });

  const result: MascotPreviewResult = await generateMascotWithGrok(config);

  const entry = generationStore.get(generationId);
  if (entry) {
    entry.status = "completed";
    entry.imageUrl = result.imageUrl;
    entry.name = result.name;
    entry.description = result.description;
  }

  res.json({
    id: generationId,
    imageUrl: result.imageUrl,
    name: result.name,
    description: result.description,
  });
});

export const generateMascotAssets = asyncHandler(async (req: Request, res: Response) => {
  const { id, referenceImage, ...config } = req.body as {
    id: string;
    referenceImage: string;
  } & MascotConfig;

  const status = generationStore.get(id);
  if (!status) {
    res.status(404).json({ error: "Generación no encontrada" });
    return;
  }

  if (status.status !== "completed") {
    res.status(400).json({ error: "La generación aún no ha terminado" });
    return;
  }

  status.status = "generating";

  const result: MascotAssetsResult = await generateMascotAssetsWithGrok(referenceImage, config);

  status.status = "completed";
  generationStore.set(id, status);

  res.json({
    id,
    referenceImage: result.referenceImage,
    assets: result.assets,
  });
});

export const getMascotStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const status = generationStore.get(id);

  if (!status) {
    res.status(404).json({ error: "Generación no encontrada" });
    return;
  }

  res.json({
    id: status.id,
    status: status.status,
    imageUrl: status.imageUrl,
    name: status.name,
    description: status.description,
  });
};

export const regeneratePreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.body as { id: string };

  const status = generationStore.get(id);
  if (!status) {
    res.status(404).json({ error: "Generación no encontrada" });
    return;
  }

  status.status = "generating";

  const result: MascotPreviewResult = await generateMascotWithGrok(status.config);

  status.status = "completed";
  status.imageUrl = result.imageUrl;
  status.name = result.name;
  status.description = result.description;
  status.error = undefined;

  res.json({
    id,
    imageUrl: result.imageUrl,
    name: result.name,
    description: result.description,
  });
});

export const checkHfHealth = asyncHandler(async (req: Request, res: Response) => {
  const result = await checkHfConnection();
  if (result.ok) {
    res.json({ ok: true, message: "Conexión a Hugging Face OK", models: result.models });
  } else {
    res.status(502).json({ ok: false, error: result.error });
  }
});
