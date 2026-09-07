import type { Command } from "@/terminal/types";
import { THEMES, type Theme } from "@/terminal/theme";
import { BANNER } from "@/terminal/boot";
import { table } from "@/render/table";

export const help: Command = {
  name: "help", aliases: ["?", "menu"], usage: "help", desc: "this menu",
  async run(ctx) {
    const { commands } = await import("./index"); // lazy: avoids circular import
    ctx.print(table(["COMMAND", "DESCRIPTION", "AUTH"], commands.map((c) => [c.usage, c.desc, c.auth ? "yes" : ""]), [44, 46, 4]));
    ctx.print("keys: ↑/↓ history · Tab complete · Ctrl+L clear · Esc cancel prompt", "dim");
  },
};

const clear: Command = { name: "clear", aliases: ["cls"], usage: "clear", desc: "clear screen", run: (ctx) => ctx.clear() };
const banner: Command = { name: "banner", usage: "banner", desc: "show the board banner", run: (ctx) => ctx.print(BANNER, "banner") };

const theme: Command = {
  name: "theme", usage: "theme green|amber|white", desc: "phosphor colour",
  run(ctx) {
    const t = ctx.args[0] as Theme | undefined;
    if (!t) return ctx.print(`current: ${ctx.theme}. options: ${THEMES.join(" | ")}`);
    if (!THEMES.includes(t)) return ctx.print(`unknown theme. options: ${THEMES.join(" | ")}`, "err");
    ctx.setTheme(t); ctx.print(`phosphor set to ${t}.`, "ok");
  },
};

const crt: Command = {
  name: "crt", usage: "crt on|off", desc: "scanlines & flicker",
  run(ctx) {
    const v = ctx.args[0];
    if (!v) return ctx.print(`crt is ${ctx.crt ? "on" : "off"}`);
    if (v !== "on" && v !== "off") return ctx.print("usage: crt on|off", "err");
    ctx.setCrt(v === "on"); ctx.print(`crt ${v}.`, "ok");
  },
};

const uptime: Command = {
  name: "uptime", usage: "uptime", desc: "session uptime",
  run(ctx) {
    const s = Math.floor((Date.now() - ctx.bootAt) / 1000);
    ctx.print(`connected ${Math.floor(s / 60)}m ${s % 60}s · baud 14400 · node 1`);
  },
};

const date: Command = { name: "date", usage: "date", desc: "board time", run: (ctx) => ctx.print(new Date().toString()) };

export const systemCommands = [clear, banner, theme, crt, uptime, date];