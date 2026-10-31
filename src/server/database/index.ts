import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../.generated/prisma/client";
import { env } from "../env";

const shared = globalThis as typeof globalThis & { webappAuthDatabase?: PrismaClient };

export function openAuthDatabase(): PrismaClient {
  if (shared.webappAuthDatabase) return shared.webappAuthDatabase;
  let url: URL;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error("Μη έγκυρη ρύθμιση βάσης δεδομένων."); }
  if (url.protocol !== "mysql:") throw new Error("Το DATABASE_URL πρέπει να είναι MySQL URL.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const adapter = new PrismaMariaDb({
    host: url.hostname, port: Number(url.port || "3306"), user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5, timezone: "+00:00", ssl: local ? undefined : { rejectUnauthorized: true },
  });
  const database = new PrismaClient({ adapter });
  shared.webappAuthDatabase = database;
  return database;
}
