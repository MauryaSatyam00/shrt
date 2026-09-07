import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { ah } from "../middleware/error";
import { buildClick } from "../services/analytics";
import { qrPng } from "../services/qr";
import { base } from "./links";

export const redirectRouter = Router();
const CODE = "([A-Za-z0-9_-]{3,32})";

const page = (title: string, body: string, status: number) => `<!doctype html><meta charset=utf-8><title>${title}</title>
<style>body{background:#050805;color:#33ff66;font:15px/1.4 "IBM Plex Mono",monospace;padding:40px;text-shadow:0 0 6px rgba(51,255,102,.5)}a{color:#aaffbb}</style>
<pre>
╔══════════════════════════════════════╗
║  SHRT.BBS  ·  STATUS ${String(status).padEnd(16)}║
╚══════════════════════════════════════╝

${body}

<a href="/">[ return to main menu ]</a></pre>`;

const hitLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false } });

redirectRouter.get(`/:code${CODE}/qr`, ah(async (req, res) => {
  const link = await prisma.link.findUnique({ where: { code: req.params.code }, select: { code: true } });
  if (!link) return res.status(404).type("html").send(page("NO CARRIER", "NO CARRIER\n\nthat code does not exist on this board.", 404));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.type("png").send(await qrPng(`${base()}/${link.code}`, 256));
}));

redirectRouter.get(`/:code${CODE}`, hitLimiter, ah(async (req, res) => {
  const link = await prisma.link.findUnique({ where: { code: req.params.code } });
  if (!link) return res.status(404).type("html").send(page("NO CARRIER", "NO CARRIER\n\nthat code does not exist on this board.", 404));
  if (link.expiresAt && link.expiresAt < new Date())
    return res.status(410).type("html").send(page("LINE DISCONNECTED", `LINE DISCONNECTED\n\nthis link expired on ${link.expiresAt.toISOString()}.`, 410));

  try { await prisma.click.create({ data: buildClick(req, link.id) }); } catch (e) { console.error("click log failed", e); }

  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, link.url);
}));