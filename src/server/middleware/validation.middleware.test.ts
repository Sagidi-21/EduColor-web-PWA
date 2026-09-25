import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateMascotConfig, validateMascotGeneration } from "./validation.middleware";
import type { Request, Response, NextFunction } from "express";

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

const makeMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const makeMockReq = (body: unknown) =>
  ({
    body,
    ip: "127.0.0.1",
  }) as unknown as Request;

const makeNext = () => vi.fn() as NextFunction;

describe("validation middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = makeMockReq(VALID_CONFIG);
    res = makeMockRes();
    next = makeNext();
  });

  describe("validateMascotConfig", () => {
    it("permite una configuración válida y llama a next", () => {
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("rechaza theme que no está en la lista permitida", () => {
      req.body = { ...VALID_CONFIG, theme: "invalid_theme" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validación fallida",
          details: expect.arrayContaining(["theme: valor no permitido"]),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("requiere customTheme cuando theme es 'other'", () => {
      req.body = { ...VALID_CONFIG, theme: "other", customTheme: "" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(["customTheme: requerido cuando theme es 'other'"]),
        }),
      );
    });

    it("rechaza customTheme demasiado largo (>100)", () => {
      req.body = { ...VALID_CONFIG, theme: "other", customTheme: "x".repeat(101) };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza characterType no permitido", () => {
      req.body = { ...VALID_CONFIG, characterType: "invalid" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("requiere customCharacterType cuando characterType es 'other'", () => {
      req.body = { ...VALID_CONFIG, characterType: "other", customCharacterType: "" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza personality con menos de 2 elementos", () => {
      req.body = { ...VALID_CONFIG, personality: ["funny"] };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza personality con más de 3 elementos", () => {
      req.body = { ...VALID_CONFIG, personality: ["funny", "curious", "brave", "kind"] };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza valores de personality no permitidos", () => {
      req.body = { ...VALID_CONFIG, personality: ["funny", "invalid"] };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("requiere teacherName cuando nameMode es 'teacher'", () => {
      req.body = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza teacherName demasiado corto (1 carácter)", () => {
      req.body = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "X" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza teacherName demasiado largo (>20)", () => {
      req.body = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "x".repeat(21) };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza visualStyle no permitido", () => {
      req.body = { ...VALID_CONFIG, visualStyle: "invalid" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza specialDetails > 250 caracteres", () => {
      req.body = { ...VALID_CONFIG, specialDetails: "x".repeat(251) };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rechaza campos desconocidos", () => {
      req.body = { ...VALID_CONFIG, maliciousField: "hack" };
      validateMascotConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(["Campos desconocidos: maliciousField"]),
        }),
      );
    });

    it("acepta teacherName de 2-20 caracteres", () => {
      req.body = { ...VALID_CONFIG, nameMode: "teacher", teacherName: "Astro" };
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("acepta specialDetails con 100 caracteres", () => {
      req.body = { ...VALID_CONFIG, specialDetails: "x".repeat(100) };
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("acepta personality con exactamente 2 elementos", () => {
      req.body = { ...VALID_CONFIG, personality: ["funny", "curious"] };
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("acepta personality con exactamente 3 elementos", () => {
      req.body = { ...VALID_CONFIG, personality: ["funny", "curious", "brave"] };
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("establece valores por defecto para campos faltantes", () => {
      req.body = {
        theme: "space",
        personality: ["funny", "curious"],
        characterType: "ai_choice",
        nameMode: "ai",
        visualStyle: "cartoon_3d",
      };
      validateMascotConfig(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body).toMatchObject({
        theme: "space",
        customTheme: "",
        characterType: "ai_choice",
        customCharacterType: "",
        personality: ["funny", "curious"],
        nameMode: "ai",
        teacherName: "",
        visualStyle: "cartoon_3d",
        specialDetails: "",
      });
    });
  });

  describe("validateMascotGeneration", () => {
    it("permite request con id y referenceImage válidos", () => {
      req.body = { id: "test-id", referenceImage: "https://example.com/img.png", ...VALID_CONFIG };
      validateMascotGeneration(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rechaza request sin id", () => {
      req.body = { referenceImage: "https://example.com/img.png" };
      validateMascotGeneration(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("rechaza request sin referenceImage", () => {
      req.body = { id: "test-id" };
      validateMascotGeneration(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
