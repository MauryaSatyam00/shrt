import { Router } from "express";
import { LoginSchema, type LoginDTO, type MeDTO } from "../../shared/schemas.js";
import { prisma } from "../db.js";
import { HttpError, ah } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, newApiKey, verifyPassword } from "../services/password.js";

export const authRouter = Router();
const sysopId = async () => (await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;

authRouter.post("/login", ah(async (req, res) => {
  const { handle, password } = LoginSchema.parse(req.body);
  let user = await prisma.user.findUnique({ where: { handle } });
  let isNew = false;
  if (!user) {
    user = await prisma.user.create({ data: { handle, passwordHash: hashPassword(password), apiKey: newApiKey() } });
    isNew = true;
  } else if (!verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "ACCESS DENIED — wrong password");
  }
  const dto: LoginDTO = { handle: user.handle, apiKey: user.apiKey, isNew, isSysop: (await sysopId()) === user.id };
  res.json(dto);
}));

authRouter.get("/me", requireAuth, ah(async (req, res) => {
  const u = req.user!;
  const [linkCount, totalClicks, sysop] = await Promise.all([
    prisma.link.count({ where: { userId: u.id } }),
    prisma.click.count({ where: { link: { userId: u.id } } }),
    sysopId(),
  ]);
  const dto: MeDTO = { handle: u.handle, isSysop: sysop === u.id, linkCount, totalClicks, memberSince: u.createdAt.toISOString() };
  res.json(dto);
}));

authRouter.post("/rotate-key", requireAuth, ah(async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.user!.id }, data: { apiKey: newApiKey() } });
  res.json({ apiKey: u.apiKey });
}));