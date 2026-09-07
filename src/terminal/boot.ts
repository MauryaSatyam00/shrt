import type { LineCls } from "./types";

export const BANNER = String.raw`
 ____  _   _ ____ _____   ____  ____  ____
/ ___|| | | |  _ \_   _| | __ )| __ )/ ___|
\___ \| |_| | |_) || |   |  _ \|  _ \\___ \
 ___) |  _  |  _ < | |  _| |_) | |_) |___) |
|____/|_| |_|_| \_\|_| (_)____/|____/|____/
`.replace(/^\n/, "");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function boot(print: (t: string, c?: LineCls) => void, handle: string | null) {
  print("ATDT 1-800-SHRT-BBS", "dim"); await sleep(350);
  print("CONNECT 14400/ARQ/V32/LAPM/V42BIS", "dim"); await sleep(250);
  print(""); print(BANNER, "banner");
  print("SHRT.BBS v1.0 · URL SHORTENING & ANALYTICS BOARD · NODE 1", "bright");
  print("──────────────────────────────────────────────────────────", "dim");
  print(handle ? `Welcome back, ${handle}.` : "Welcome, guest.");
  print("Type `help` for commands. Login is optional — only needed for analytics.", "dim");
  print("");
}