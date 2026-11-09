import cors from "cors";
import express from "express";
import { apiRouter } from "./routes";
import { writeLog } from "./logger";

const app = express();

// On Vercel (or behind any reverse proxy) the client IP is in X-Forwarded-For.
// Without this, every user shares one IP in the rate limiter.
if (process.env.VERCEL || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim())
);
allowedOrigins.add("http://127.0.0.1:5173");
allowedOrigins.add("http://localhost:5174");
allowedOrigins.add("http://127.0.0.1:5174");

app.use(
  cors((request: express.Request, callback) => {
    const origin = request.header("origin");
    const host = request.header("x-forwarded-host") ?? request.header("host");
    let allowed = !origin || allowedOrigins.has(origin);
    if (!allowed && origin) {
      // Same-origin: frontend and API on the same Vercel domain (incl. preview URLs).
      try {
        allowed = new URL(origin).host === host;
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
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  })
);
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_request, response) => response.json({ data: { status: "ok" } }));
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
  response.status(500).json({ error: "Terjadi kesalahan pada server." });
});

export default app;
