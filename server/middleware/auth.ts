import type { Request, RequestHandler } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../db.js";
import { HttpError, ah } from "./error.js";

declare global { namespace Express { interface Request { user?: User } } }

async function resolveUser(req: Request): Promise<User | undefined> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return undefined;
  return (await prisma.user.findUnique({ where: { apiKey: h.slice(7).trim() } })) ?? undefined;
}

export const optionalAuth: RequestHandler = ah(async (req, _res, next) => {
  req.user = await resolveUser(req);
  next();
});

export const requireAuth: RequestHandler = ah(async (req, _res, next) => {
  req.user = await resolveUser(req);
  if (!req.user) throw new HttpError(401, "NO CARRIER — login required (login <handle>)");
  next();
});