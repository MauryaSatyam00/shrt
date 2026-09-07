import type { Config } from "tailwindcss";
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { fg: "var(--fg)", dim: "var(--fg-dim)", bright: "var(--fg-bright)", bg: "var(--bg)" },
      fontFamily: { mono: ['"IBM Plex Mono"', '"Fira Mono"', '"Courier New"', "monospace"] },
    },
  },
  plugins: [],
} satisfies Config;