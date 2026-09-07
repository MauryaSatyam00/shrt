import type { Command } from "@/terminal/types";
import { api } from "@/api/client";
import { qrAscii } from "@/render/qr";
import { shortUrl } from "@/render/format";

export const qrCommand: Command = {
  name: "qr", usage: "qr <code>", desc: "render QR code for a short link (public)",
  async run(ctx) {
    const code = ctx.args[0]; if (!code) return ctx.print("usage: qr <code>", "err");
    const m = await ctx.qc.fetchQuery({ queryKey: ["qr", code], queryFn: () => api.qrMatrix(code), staleTime: Infinity });
    ctx.print("");
    ctx.print(qrAscii(m).join("\n"), "qr");
    ctx.print("");
    ctx.print(shortUrl(code), "bright");
    ctx.print(`png: ${location.origin}/api/links/${code}/qr?format=png&size=512   svg: ${location.origin}/api/links/${code}/qr?format=svg`, "dim");
    ctx.print("tip: `theme white` and `crt off` if your camera struggles.", "dim");
  },
};