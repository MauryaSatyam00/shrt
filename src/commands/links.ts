import type { Command, Ctx } from "@/terminal/types";
import { api } from "@/api/client";
import { CreateLinkSchema } from "@shared/schemas";
import { EXPIRY_OPTIONS } from "@shared/constants";
import { box } from "@/render/box";
import { table } from "@/render/table";
import { ago, shortUrl, until } from "@/render/format";

const shorten: Command = {
  name: "shorten", aliases: ["s"], usage: "shorten <url> [alias] [--expires 1h|1d|7d|30d|90d]",
  desc: "create a short link (login optional)",
  async run(ctx) {
    if (!ctx.args[0]) return ctx.print(`usage: ${this.usage}`, "err");
    if (ctx.flags.expires && !EXPIRY_OPTIONS.includes(ctx.flags.expires as never))
      return ctx.print(`--expires must be one of ${EXPIRY_OPTIONS.join("|")}`, "err");
    const parsed = CreateLinkSchema.safeParse({ url: ctx.args[0], alias: ctx.args[1], expiresIn: ctx.flags.expires ?? "never" });
    if (!parsed.success) return ctx.print(parsed.error.issues.map((i) => i.message).join("; "), "err");

    const link = await api.create(parsed.data, ctx.session?.apiKey);
    ctx.codes.add(link.code);
    ctx.qc.invalidateQueries({ queryKey: ["links"] });
    ctx.print(box([
      `short    ${shortUrl(link.code)}`,
      `target   ${link.url}`,
      `expires  ${until(link.expiresAt)}`,
      `owner    ${link.owned ? ctx.session!.handle : "anonymous"}`,
    ], "LINK CREATED"), "ok");
    if (!link.owned) ctx.print("anonymous link: no analytics. `login <handle>` before shortening to track clicks.", "dim");
    else ctx.print(`try: stats ${link.code}   qr ${link.code}   copy ${link.code}`, "dim");
  },
};

export async function fetchLinks(ctx: Ctx, sort: "date" | "clicks" = "date") {
  const key = ctx.session!.apiKey;
  const links = await ctx.qc.fetchQuery({ queryKey: ["links", key, sort], queryFn: () => api.list(key, sort), staleTime: 30_000 });
  links.forEach((l) => ctx.codes.add(l.code));
  return links;
}

const ls: Command = {
  name: "ls", usage: "ls [--sort date|clicks]", desc: "list your links", auth: true,
  async run(ctx) {
    const links = await fetchLinks(ctx, ctx.flags.sort === "clicks" ? "clicks" : "date");
    if (!links.length) return ctx.print("no links yet. try: shorten https://example.com", "dim");
    ctx.print(table(
      ["CODE", "CLICKS", "CREATED", "EXPIRES", "URL"],
      links.map((l) => [l.code, String(l.clicks), ago(l.createdAt), until(l.expiresAt), l.url]),
      [16, 6, 8, 8, 44],
    ));
    ctx.print(`${links.length} link(s) · ${links.reduce((a, l) => a + l.clicks, 0)} total clicks`, "dim");
  },
};

const rm: Command = {
  name: "rm", usage: "rm <code>", desc: "delete a link (and its analytics)", auth: true,
  async run(ctx) {
    const code = ctx.args[0]; if (!code) return ctx.print("usage: rm <code>", "err");
    const ans = await ctx.ask(`delete ${code} and all its clicks? [y/N]`);
    if (ans?.toLowerCase() !== "y") return ctx.print("aborted.", "dim");
    await api.remove(ctx.session!.apiKey, code);
    ctx.codes.delete(code);
    ctx.qc.invalidateQueries({ queryKey: ["links"] });
    ctx.print(`${code} purged.`, "ok");
  },
};

const open: Command = {
  name: "open", usage: "open <code>", desc: "open short link in a new tab (counts as a click)",
  run(ctx) {
    const code = ctx.args[0]; if (!code) return ctx.print("usage: open <code>", "err");
    window.open(shortUrl(code), "_blank", "noopener");
    ctx.print(`dialing ${shortUrl(code)} …`, "dim");
  },
};

const copy: Command = {
  name: "copy", usage: "copy <code>", desc: "copy short URL to clipboard",
  async run(ctx) {
    const code = ctx.args[0]; if (!code) return ctx.print("usage: copy <code>", "err");
    try { await navigator.clipboard.writeText(shortUrl(code)); ctx.print(`copied ${shortUrl(code)}`, "ok"); }
    catch { ctx.print(`clipboard blocked — here it is: ${shortUrl(code)}`, "err"); }
  },
};

export const linkCommands = [shorten, ls, rm, open, copy];