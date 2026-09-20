import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, resetRateLimit } from "./rateLimit.middleware";
import type { Request, Response, NextFunction } from "express";

const makeMockReq = (ip = "192.168.1.1") =>
  ({
    ip,
  }) as unknown as Request;

const makeMockRes = () =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response;

describe("rateLimit middleware", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimit();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite solicitudes hasta el máximo dentro de la ventana", () => {
    const middleware = rateLimit({ windowMs: 60000, max: 3 });
    const req = makeMockReq();
    const res = makeMockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    middleware(req, res, next);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("bloquea después de superar el máximo", () => {
    const middleware = rateLimit({ windowMs: 60000, max: 2 });
    const req = makeMockReq();
    const res = makeMockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    middleware(req, res, next);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it("resetea el contador después de que la ventana expire", () => {
    const middleware = rateLimit({ windowMs: 1000, max: 1 });
    const req = makeMockReq();
    const res = makeMockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    vi.advanceTimersByTime(1001);

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it("aplica límites por IP independientemente", () => {
    const middleware = rateLimit({ windowMs: 60000, max: 1 });
    const req1 = makeMockReq("192.168.1.1");
    const req2 = makeMockReq("192.168.1.2");
    const res = makeMockRes();
    const next = vi.fn() as NextFunction;

    middleware(req1, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    middleware(req2, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).not.toHaveBeenCalledWith(429);
  });

  it("usa el mensaje personalizado cuando se excede el límite", () => {
    const customMessage = "Límite personalizado alcanzado";
    const middleware = rateLimit({ windowMs: 60000, max: 1, message: customMessage });
    const req = makeMockReq();
    const res = makeMockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ error: customMessage });
  });
});
