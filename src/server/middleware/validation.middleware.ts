import { Request, Response, NextFunction } from "express";
import {
  ALLOWED_THEMES,
  ALLOWED_CHARACTER_TYPES,
  ALLOWED_PERSONALITY,
  ALLOWED_NAME_MODES,
  ALLOWED_VISUAL_STYLES,
  MascotConfig,
} from "../types";

export function validateMascotConfig(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Partial<MascotConfig>;
  const errors: string[] = [];

  if (!body.theme || !ALLOWED_THEMES.includes(body.theme as any)) {
    errors.push("theme: valor no permitido");
  }
  if (body.theme === "other" && !body.customTheme?.trim()) {
    errors.push("customTheme: requerido cuando theme es 'other'");
  }
  if (body.customTheme && body.customTheme.length > 100) {
    errors.push("customTheme: máximo 100 caracteres");
  }

  if (!body.characterType || !ALLOWED_CHARACTER_TYPES.includes(body.characterType as any)) {
    errors.push("characterType: valor no permitido");
  }
  if (body.characterType === "other" && !body.customCharacterType?.trim()) {
    errors.push("customCharacterType: requerido cuando characterType es 'other'");
  }
  if (body.customCharacterType && body.customCharacterType.length > 100) {
    errors.push("customCharacterType: máximo 100 caracteres");
  }

  if (
    !Array.isArray(body.personality) ||
    body.personality.length < 2 ||
    body.personality.length > 3
  ) {
    errors.push("personality: debe tener entre 2 y 3 elementos");
  } else {
    body.personality.forEach((p) => {
      if (!ALLOWED_PERSONALITY.includes(p as any)) {
        errors.push(`personality: valor no permitido '${p}'`);
      }
    });
  }

  if (!body.nameMode || !ALLOWED_NAME_MODES.includes(body.nameMode as any)) {
    errors.push("nameMode: valor no permitido");
  }
  if (body.nameMode === "teacher") {
    if (!body.teacherName?.trim()) {
      errors.push("teacherName: requerido cuando nameMode es 'teacher'");
    } else if (body.teacherName.length < 2 || body.teacherName.length > 20) {
      errors.push("teacherName: debe tener entre 2 y 20 caracteres");
    }
  }

  if (!body.visualStyle || !ALLOWED_VISUAL_STYLES.includes(body.visualStyle as any)) {
    errors.push("visualStyle: valor no permitido");
  }

  if (body.specialDetails && body.specialDetails.length > 250) {
    errors.push("specialDetails: máximo 250 caracteres");
  }

  const allowedKeys: (keyof MascotConfig)[] = [
    "theme",
    "customTheme",
    "characterType",
    "customCharacterType",
    "personality",
    "nameMode",
    "teacherName",
    "visualStyle",
    "specialDetails",
  ];
  const extraKeys = Object.keys(body).filter((k) => !(allowedKeys as string[]).includes(k));
  if (extraKeys.length > 0) {
    errors.push(`Campos desconocidos: ${extraKeys.join(", ")}`);
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validación fallida", details: errors });
    return;
  }

  req.body = stripUnknownFields(body) as MascotConfig;
  next();
}

export function validateMascotGeneration(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  const errors: string[] = [];

  if (!body.id || typeof body.id !== "string") {
    errors.push("id: es requerido");
  }
  if (!body.referenceImage || typeof body.referenceImage !== "string") {
    errors.push("referenceImage: es requerido");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validación fallida", details: errors });
    return;
  }

  const allowedKeys = [
    "id",
    "referenceImage",
    "theme",
    "customTheme",
    "characterType",
    "customCharacterType",
    "personality",
    "nameMode",
    "teacherName",
    "visualStyle",
    "specialDetails",
  ];
  const clean: Record<string, unknown> = {};
  allowedKeys.forEach((k) => {
    if (body[k] !== undefined) clean[k] = body[k];
  });
  req.body = clean;
  next();
}

function stripUnknownFields(config: Partial<MascotConfig>): MascotConfig {
  return {
    theme: config.theme ?? "space",
    customTheme: config.customTheme ?? "",
    characterType: config.characterType ?? "ai_choice",
    customCharacterType: config.customCharacterType ?? "",
    personality: config.personality ?? [],
    nameMode: config.nameMode ?? "ai",
    teacherName: config.teacherName ?? "",
    visualStyle: config.visualStyle ?? "cartoon_3d",
    specialDetails: config.specialDetails ?? "",
  };
}
