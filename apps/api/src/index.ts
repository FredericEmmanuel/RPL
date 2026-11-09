import dotenv from "dotenv";
import path from "node:path";

// Must load before other modules read process.env.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import app from "./app";
import { initializeLogger, writeLog } from "./logger";

const port = Number(process.env.API_PORT ?? 3001);

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
