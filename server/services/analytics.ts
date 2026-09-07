import { createHash } from "node:crypto";
import type { Request } from "express";
import { UAParser } from "ua-parser-js";

const SALT = process.env.HASH_SALT ?? "dev-salt";

export function clientIp(req: Request) {
  const xff = req.headers["x-forwarded-for"];
  const first = Array.isArray(xff) ? xff[0] : xff?.split(",")[0];
  return (first ?? req.socket.remoteAddress ?? "0.0.0.0").trim();
}

export function buildClick(req: Request, linkId: string) {
  const ua = req.headers["user-agent"] ?? "";
  const p = new UAParser(ua).getResult();
  const ref = req.headers.referer ?? req.headers.referrer;
  let referrer: string | null = null;
  try { if (ref) referrer = new URL(String(ref)).hostname.replace(/^www\./, ""); } catch { /* ignore */ }

  const ch = req.headers["x-vercel-ip-country"];
  const country = (Array.isArray(ch) ? ch[0] : ch) ?? null;

  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256").update(`${SALT}|${clientIp(req)}|${ua}|${day}`).digest("hex").slice(0, 32);

  return {
    linkId, referrer, country, visitorHash,
    browser: p.browser.name ?? (ua ? "Unknown" : "None"),
    os: p.os.name ?? "Unknown",
    device: p.device.type ?? "desktop",
  };
}