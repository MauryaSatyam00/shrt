import type { Command } from "@/terminal/types";
import { api } from "@/api/client";
import { LoginSchema } from "@shared/schemas";
import { box } from "@/render/box";
import { ago } from "@/render/format";

const login: Command = {
  name: "login", usage: "login <handle>", desc: "log in or register (analytics unlocked)",
  async run(ctx) {
    const handle = ctx.args[0];
    if (!handle) return ctx.print("usage: login <handle>", "err");
    if (ctx.session) return ctx.print(`already online as ${ctx.session.handle}. logout first.`, "err");
    const password = ctx.args[1] ?? (await ctx.ask("PASSWORD:", { mask: true }));
    if (password === null) return ctx.print("aborted.", "dim");
    const parsed = LoginSchema.safeParse({ handle, password });
    if (!parsed.success) return ctx.print(parsed.error.issues.map((i) => i.message).join("; "), "err");

    const r = await api.login(parsed.data);
    ctx.setSession({ handle: r.handle, apiKey: r.apiKey, isSysop: r.isSysop });
    ctx.print(r.isNew ? `NEW USER REGISTERED: ${r.handle} — remember that password, there is no reset.` : `ACCESS GRANTED. Welcome back, ${r.handle}.`, "ok");
    if (r.isSysop) ctx.print("★ You hold SYSOP privileges on this board.", "bright");
    ctx.qc.clear();
  },
};

const logout: Command = {
  name: "logout", usage: "logout", desc: "hang up the session",
  run(ctx) {
    if (!ctx.session) return ctx.print("not logged in.", "dim");
    ctx.setSession(null); ctx.qc.clear(); ctx.codes.clear();
    ctx.print("+++ NO CARRIER", "dim");
  },
};

const whoami: Command = {
  name: "whoami", usage: "whoami", desc: "show current user & totals",
  async run(ctx) {
    if (!ctx.session) return ctx.print("guest — anonymous links only, no analytics. `login <handle>` to upgrade.", "dim");
    const me = await api.me(ctx.session.apiKey);
    ctx.print(box([
      `handle    ${me.handle}${me.isSysop ? "  [SYSOP]" : ""}`,
      `member    ${ago(me.memberSince)}`,
      `links     ${me.linkCount}`,
      `clicks    ${me.totalClicks}`,
    ], "USER RECORD"));
  },
};

export const authCommands = [login, logout, whoami];