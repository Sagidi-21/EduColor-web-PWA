import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = store.get(key);

    if (entry && entry.resetAt <= now) {
      store.delete(key);
    }

    const current = store.get(key);
    if (current) {
      if (current.count >= max) {
        res.status(429).json({ error: message });
        return;
      }
      current.count += 1;
    } else {
      store.set(key, { count: 1, resetAt: now + windowMs });
    }

    next();
  };
}

export function cleanupRateLimit(): void {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  });
}

export function resetRateLimit(): void {
  store.clear();
}

setInterval(cleanupRateLimit, 60_000).unref();
