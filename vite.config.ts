import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const api = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@shared": `${root}shared`, "@": `${root}src` } },
  server: {
    proxy: {
      "/api": api,
      "/healthz": api,
      "^/[A-Za-z0-9_-]{3,32}(/qr)?$": api,
    },
  },
});