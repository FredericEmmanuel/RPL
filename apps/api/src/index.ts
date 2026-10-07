import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import path from "node:path";
import { apiRouter } from "./routes";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const port = Number(process.env.API_PORT ?? 3001);
const app = express();
const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim())
);
allowedOrigins.add("http://127.0.0.1:5173");

app.use(cors({ origin: [...allowedOrigins] }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_request, response) => response.json({ data: { status: "ok" } }));
app.use("/api", apiRouter);
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error("Kesalahan server:", error);
  response.status(500).json({ error: "Terjadi kesalahan pada server." });
});

app.listen(port, () => console.log(`StudyBuddy API berjalan di http://localhost:${port}`));
