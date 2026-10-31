import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Generation works before local services are configured; runtime requires an explicit URL.
  datasource: { url: process.env.DATABASE_URL ?? "mysql://localhost:3306/webapp_dev" },
});
