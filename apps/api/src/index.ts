import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import path from "node:path";
import { apiRouter } from "./routes";
import { initializeLogger, writeLog } from "./logger";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const port = Number(process.env.API_PORT ?? 3001);
const app = express();
const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim())
);
allowedOrigins.add("http://127.0.0.1:5173");
allowedOrigins.add("http://localhost:5174");
allowedOrigins.add("http://127.0.0.1:5174");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhostOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
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
    console.error("Gagal menyimpan log diagnostik ke logs/studybuddy-api.log.");
  });
  response.status(500).json({ error: "Terjadi kesalahan pada server." });
});

async function startServer(): Promise<void> {
  await initializeLogger();
  app.listen(port, () => {
    void writeLog({
      level: "info",
      event: "api.started"
    }).catch(() => {
      console.error("Gagal menyimpan log diagnostik ke logs/studybuddy-api.log.");
    });
    console.log(`StudyBuddy API berjalan di http://localhost:${port}`);
  });
}

startServer().catch(() => {
  console.error("API gagal dimulai karena direktori log tidak dapat disiapkan.");
  process.exitCode = 1;
});
