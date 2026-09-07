import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@shared": `${root}shared`, "@": `${root}src` } },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./server/test/setup.ts"],
    env: { HASH_SALT: "test-salt", BASE_URL: "https://sh.rt" },
  },
});