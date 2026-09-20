import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public userMessage: string = "No hemos podido crear el personaje esta vez.",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("[mascot-api]", err);

  const apiErr = err as { statusCode?: number; isOperational?: boolean; userMessage?: string };

  if (apiErr?.isOperational && apiErr.statusCode && apiErr.statusCode < 500) {
    res.status(apiErr.statusCode).json({ error: apiErr.userMessage });
    return;
  }

  res.status(500).json({ error: "No hemos podido crear el personaje esta vez." });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
