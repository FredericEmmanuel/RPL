import cors from "cors";
import express from "express";
import { apiRouter } from "./routes";
import { writeLog } from "./logger";
import { prisma } from "./db";

const app = express();

// On Vercel (or behind any reverse proxy) the client IP is in X-Forwarded-For.
// Without this, every user shares one IP in the rate limiter.
if (process.env.VERCEL || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, "");
const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",").map(normalizeOrigin).filter(Boolean)
);
allowedOrigins.add("http://127.0.0.1:5173");
allowedOrigins.add("http://localhost:5174");
allowedOrigins.add("http://127.0.0.1:5174");

app.use(
  cors((request: express.Request, callback) => {
    const origin = request.header("origin");
    const normalizedOrigin = origin ? normalizeOrigin(origin) : undefined;
    const host = request.header("x-forwarded-host") ?? request.header("host");
    let allowed = !normalizedOrigin || allowedOrigins.has(normalizedOrigin);
    if (!allowed && origin) {
      // Same-origin: frontend and API on the same Vercel domain (incl. preview URLs).
      try {
        allowed = Boolean(normalizedOrigin) && new URL(normalizedOrigin as string).host === host;
      } catch {
        allowed = false;
      }
    }
    if (!allowed) {
      allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? "");
    }
    if (allowed) {
      callback(null, { origin: true });
      return;
    }
    const error = new Error(`Origin not allowed by CORS: ${origin}`);
    Object.assign(error, { statusCode: 403 });
    callback(error);
  })
);
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ data: { status: "ok", database: "ok" } });
  } catch {
    response.status(503).json({ error: "Database tidak tersedia.", data: { status: "degraded", database: "unavailable" } });
  }
});
app.use("/api", apiRouter);
app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
  void writeLog({
    level: "error",
    event: "http.request.failed",
    method: request.method,
    statusCode: 500,
    errorType: error instanceof Error ? error.name : "UnknownError"
  }).catch(() => {
    console.error("Gagal menyimpan log diagnostik.");
  });
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;
  response.status(statusCode).json({
    error: statusCode === 403 ? "Origin tidak diizinkan." : "Terjadi kesalahan pada server."
  });
});

export default app;
