import { RANGE_MS, type StatsRange } from "../../shared/constants";
import type { Bucket, StatsDTO } from "../../shared/schemas";
import { prisma } from "../db";

const top = (m: Map<string, number>, n = 8): Bucket[] =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
const inc = (m: Map<string, number>, k: string | null | undefined) => {
  const key = k || "(none)";
  m.set(key, (m.get(key) ?? 0) + 1);
};

export async function linkStats(
  link: { id: string; code: string; url: string; createdAt: Date },
  range: StatsRange,
): Promise<StatsDTO> {
  const since = new Date(Date.now() - RANGE_MS[range]);
  const clicks = await prisma.click.findMany({
    where: { linkId: link.id, ts: { gte: since } },
    orderBy: { ts: "desc" },
    take: 20_000,
    select: {
      id: true,
      linkId: true,
      ts: true,
      referrer: true,
      country: true,
      browser: true,
      os: true,
      device: true,
      visitorHash: true,
    },
  });

  const byHour: Bucket[] = Array.from({ length: 24 }, (_, h) => ({
    label: String(h).padStart(2, "0"),
    count: 0,
  }));
  const days = range === "24h" ? 1 : range === "7d" ? 7 : 30;
  const dayIdx = new Map<string, number>();
  const byDay: Bucket[] = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    dayIdx.set(key, i);
    return { label: key.slice(5), count: 0 };
  });

  const refs = new Map<string, number>(),
    br = new Map<string, number>(),
    os = new Map<string, number>(),
    dev = new Map<string, number>(),
    cty = new Map<string, number>(),
    uniq = new Set<string>();

  for (const c of clicks) {
    byHour[c.ts.getUTCHours()].count++;
    const di = dayIdx.get(c.ts.toISOString().slice(0, 10));
    if (di !== undefined) byDay[di].count++;
    inc(refs, c.referrer ?? "direct");
    inc(br, c.browser);
    inc(os, c.os);
    inc(dev, c.device);
    inc(cty, c.country);
    uniq.add(c.visitorHash);
  }

  return {
    code: link.code,
    url: link.url,
    range,
    total: clicks.length,
    unique: uniq.size,
    createdAt: link.createdAt.toISOString(),
    lastClick: clicks[0]?.ts.toISOString() ?? null,
    byHour,
    byDay,
    referrers: top(refs),
    browsers: top(br),
    os: top(os),
    devices: top(dev),
    countries: top(cty),
    recent: clicks
      .slice(0, 10)
      .map(({ id: _id, linkId: _linkId, visitorHash: _v, ts, ...r }) => ({
        ts: ts.toISOString(),
        ...r,
      })),
  };
}
