import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Unit/integration tests δίπλα στον κώδικα. Τα tests/ (tooling, e2e) τρέχουν με άλλους runners.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
