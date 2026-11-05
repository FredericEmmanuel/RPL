import type { NextFunction, Request, Response } from "express";
import { writeLog } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly options: { limit: number; windowMs: number }
  ) {}

  consume(key: string, now = Date.now()): number | null {
    let entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + this.options.windowMs };
      this.entries.set(key, entry);
    }

    entry.count += 1;
    this.entries.delete(key);
    this.entries.set(key, entry);
    if (this.entries.size > 10_000) {
      for (const [entryKey, value] of this.entries) {
        if (value.resetAt <= now) {
          this.entries.delete(entryKey);
        }
      }
      while (this.entries.size > 10_000) {
        const oldest = this.entries.keys().next();
        if (oldest.done) {
          break;
        }
        this.entries.delete(oldest.value);
      }
    }

    if (entry.count > this.options.limit) {
      return Math.ceil((entry.resetAt - now) / 1000);
    }

    return null;
  }
}

export function createRateLimiter(options: { limit: number; windowMs: number }) {
  const limiter = new InMemoryRateLimiter(options);

  return (request: Request, response: Response, next: NextFunction): void => {
    const key = request.ip || request.socket.remoteAddress || "unknown";
    const retryAfterSeconds = limiter.consume(key);
    if (retryAfterSeconds !== null) {
      void writeLog({
        level: "warn",
        event: "auth.rate_limit.exceeded",
        method: request.method,
        statusCode: 429
      }).catch(() => console.error("Gagal menyimpan log diagnostik."));
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({ error: "Terlalu banyak permintaan. Silakan coba lagi nanti." });
      return;
    }

    next();
  };
}
