import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { EXPIRY_MS } from "../../shared/constants";
import { CreateLinkSchema, StatsQuerySchema, type LinkDTO } from "../../shared/schemas";
import { prisma } from "../db";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { HttpError, ah } from "../middleware/error";
import { uniqueCode } from "../services/codegen";
import { linkStats } from "../services/stats";
import { qrMatrix, qrPng, qrSvg } from "../services/qr";

export const linksRouter = Router();

export const base = () =>
  (process.env.BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173")).replace(/\/$/, "");

type LinkRow = { code: string; url: string; createdAt: Date; expiresAt: Date | null; userId: string | null; _count?: { clicks: number } };
const toDTO = (l: LinkRow, uid?: string): LinkDTO => ({
  code: l.code, url: l.url, shortUrl: `${base()}/${l.code}`, createdAt: l.createdAt.toISOString(),
  expiresAt: l.expiresAt?.toISOString() ?? null, clicks: l._count?.clicks ?? 0, owned: !!uid && l.userId === uid,
});

async function ownedLink(code: string, userId: string) {
  const link = await prisma.link.findUnique({ where: { code }, include: { _count: { select: { clicks: true } } } });
  if (!link) throw new HttpError(404, `no such link: ${code}`);
  if (link.userId !== userId) throw new HttpError(403, "not your link");
  return link;
}

const createLimiter = rateLimit({
  windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: "slow down, caller — 30 links/min" },
});

linksRouter.post("/", createLimiter, optionalAuth, ah(async (req, res) => {
  const { url, alias, expiresIn } = CreateLinkSchema.parse(req.body);
  if (alias && (await prisma.link.findUnique({ where: { code: alias } }))) throw new HttpError(409, `alias "${alias}" already taken`);
  const code = alias ?? (await uniqueCode());
  const expiresAt = expiresIn === "never" ? null : new Date(Date.now() + EXPIRY_MS[expiresIn]);
  const link = await prisma.link.create({ data: { code, url, expiresAt, userId: req.user?.id ?? null } });
  res.status(201).json(toDTO(link, req.user?.id));
}));

linksRouter.get("/", requireAuth, ah(async (req, res) => {
  const sort = z.enum(["date", "clicks"]).catch("date").parse(req.query.sort);
  const links = await prisma.link.findMany({
    where: { userId: req.user!.id }, include: { _count: { select: { clicks: true } } },
    orderBy: sort === "clicks" ? { clicks: { _count: "desc" } } : { createdAt: "desc" }, take: 200,
  });
  res.json(links.map((l) => toDTO(l, req.user!.id)));
}));

linksRouter.get("/:code", requireAuth, ah(async (req, res) => {
  res.json(toDTO(await ownedLink(req.params.code, req.user!.id), req.user!.id));
}));

linksRouter.delete("/:code", requireAuth, ah(async (req, res) => {
  const link = await ownedLink(req.params.code, req.user!.id);
  await prisma.link.delete({ where: { id: link.id } });
  res.status(204).end();
}));

linksRouter.get("/:code/stats", requireAuth, ah(async (req, res) => {
  const { range } = StatsQuerySchema.parse(req.query);
  res.json(await linkStats(await ownedLink(req.params.code, req.user!.id), range));
}));

linksRouter.get("/:code/qr", ah(async (req, res) => {
  const { format, size } = z.object({
    format: z.enum(["svg", "png", "matrix"]).default("svg"),
    size: z.coerce.number().int().min(64).max(1024).default(256),
  }).parse(req.query);
  const link = await prisma.link.findUnique({ where: { code: req.params.code }, select: { code: true } });
  if (!link) throw new HttpError(404, `no such link: ${req.params.code}`);
  const target = `${base()}/${link.code}`;
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (format === "matrix") return res.json(qrMatrix(target));
  if (format === "png") return res.type("png").send(await qrPng(target, size));
  res.type("svg").send(await qrSvg(target, size));
}));