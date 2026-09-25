import express from "express";
import {
  generateMascotPreview,
  generateMascotAssets,
  generateMascotPoseGrid,
  getMascotStatus,
  regeneratePreview,
  checkHfHealth,
  getMascotPromptDev,
} from "../controllers/mascot.controller.ts";
import {
  validateMascotConfig,
  validateMascotConfigDev,
  validateMascotGeneration,
} from "../middleware/validation.middleware.ts";
import { rateLimit } from "../middleware/rateLimit.middleware.ts";

const router = express.Router();

const previewRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Demasiadas solicitudes de generación, por favor inténtalo más tarde.",
});

const assetsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Demasiadas solicitudes de assets, por favor inténtalo más tarde.",
});

router.post("/preview", previewRateLimit, validateMascotConfig, generateMascotPreview);

router.post("/regenerate-preview", previewRateLimit, regeneratePreview);

router.post(
  "/generate-pose-grid",
  assetsRateLimit,
  validateMascotGeneration,
  generateMascotPoseGrid,
);

router.post("/generate-assets", assetsRateLimit, validateMascotGeneration, generateMascotAssets);

router.get("/status/:id", getMascotStatus);

router.get("/health-hf", checkHfHealth);

// Dev-only: get the exact prompt that would be sent to HF
router.post("/prompt-dev", validateMascotConfigDev, getMascotPromptDev);

export default router;
