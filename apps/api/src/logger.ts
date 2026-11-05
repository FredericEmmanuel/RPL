import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const logDirectory = path.resolve(__dirname, "../../../logs");
const logFile = path.join(logDirectory, "studybuddy-api.log");

export async function initializeLogger(): Promise<void> {
  await mkdir(logDirectory, { recursive: true });
}

export async function writeLog(entry: {
  level: "info" | "warn" | "error";
  event: string;
  method?: string;
  statusCode?: number;
  errorType?: string;
}): Promise<void> {
  const record = JSON.stringify({ timestamp: new Date().toISOString(), ...entry });
  await appendFile(logFile, `${record}\n`, { encoding: "utf8", mode: 0o600 });
  if (entry.level === "error") {
    console.error(record);
  } else if (entry.level === "warn") {
    console.warn(record);
  } else {
    console.log(record);
  }
}
