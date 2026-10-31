import "server-only";
import { env } from "./env";

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

function threshold(): number {
  const configured = env.LOG_LEVEL as Level;
  return levels[configured] ?? levels.info;
}

function log(level: Level, message: string, context?: Record<string, unknown>) {
  if (levels[level] < threshold()) return;
  const entry = { level, message, time: new Date().toISOString(), ...context };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};
