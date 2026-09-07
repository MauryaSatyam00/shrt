import type { Command } from "@/terminal/types";
import { api } from "@/api/client";
import { STATS_RANGES, type StatsRange } from "@shared/constants";
import { columns, rule } from "@/render/box";
import { hbar, vbar } from "@/render/chart";
import { ago, pad, stamp, trunc } from "@/render/format";

export const statsCommand: Command = {
  name: "stats", usage: "stats <code> [24h|7d|30d]", desc: "analytics dashboard for a link", auth: true,
  async run(ctx) {
    const code = ctx.args[0]; if (!code) return ctx.print(`usage: ${this.usage}`, "err");
    const range = (ctx.args[1] ?? "7d") as StatsRange;
    if (!STATS_RANGES.includes(range)) return ctx.print(`range must be ${STATS_RANGES.join("|")}`, "err");

    const key = ctx.session!.apiKey;
    const s = await ctx.qc.fetchQuery({ queryKey: ["stats", key, code, range], queryFn: () => api.stats(key, code, range), staleTime: 10_000 });
    const W = 30;

    ctx.print(rule(`STATS · ${s.code} · last ${s.range}`, "═", 66), "bright");
    ctx.print(`target    ${s.url}`);
    ctx.print(columns([`created   ${ago(s.createdAt)}`, `total     ${s.total} clicks`], [`last hit  ${ago(s.lastClick)}`, `unique    ${s.unique} visitors`], 30).join("\n"));
    ctx.print("");
    if (!s.total) return ctx.print("no clicks in this range. share the link, then come back.", "dim");

    ctx.print(rule("CLICKS / DAY (UTC)"), "dim");
    ctx.print(hbar(s.byDay, 34, 5).join("\n"));
    ctx.print("");
    ctx.print(rule("CLICKS / HOUR (UTC)"), "dim");
    ctx.print(vbar(s.byHour).join("\n"));
    ctx.print("");
    ctx.print(columns([rule("REFERRERS", "─", W), ...hbar(s.referrers.slice(0, 5), 10, 12)], [rule("BROWSERS", "─", W), ...hbar(s.browsers.slice(0, 5), 10, 12)], W).join("\n"));
    ctx.print("");
    ctx.print(columns([rule("OS", "─", W), ...hbar(s.os.slice(0, 5), 10, 12)], [rule("DEVICES", "─", W), ...hbar(s.devices.slice(0, 5), 10, 12)], W).join("\n"));
    ctx.print("");
    ctx.print(rule("COUNTRIES"), "dim");
    ctx.print(hbar(s.countries.slice(0, 6), 20, 8).join("\n"));
    ctx.print("");
    ctx.print(rule("RECENT HITS"), "dim");
    ctx.print(`${pad("WHEN (UTC)", 17)}${pad("CC", 4)}${pad("BROWSER / OS", 22)}${pad("DEVICE", 8)}REF`, "dim");
    for (const r of s.recent)
      ctx.print(`${pad(stamp(r.ts), 17)}${pad(r.country ?? "--", 4)}${pad(trunc(`${r.browser ?? "?"} / ${r.os ?? "?"}`, 21), 22)}${pad(r.device ?? "?", 8)}${r.referrer ?? "direct"}`);
  },
};