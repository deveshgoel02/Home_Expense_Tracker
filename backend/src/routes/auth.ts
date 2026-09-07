import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { changePasswordSchema, loginSchema } from "../validation.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { signSession } from "../lib/jwt.js";
import { cookieOptions, requireAuth, SESSION_COOKIE } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait a few minutes and try again." },
});

function publicUser(user: { id: string; name: string; initials: string; color: string; isActive: boolean; mustChangePassword: boolean }) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    color: user.color,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}

// Public, deliberately minimal: only what the login screen needs to let
// someone pick their name before they've authenticated. No isActive/created
// metadata, and absolutely never a password field.
authRouter.get(
  "/members",
  asyncHandler(async (_req, res) => {
    const members = await prisma.user.findMany({
      where: { isActive: true, isHousehold: false },
      select: { id: true, name: true, initials: true, color: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(members);
  })
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { name, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { name } });
    if (!user || !user.isActive || user.isHousehold) {
      throw new AppError(401, "Incorrect name or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Incorrect name or password");
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signSession({ sub: user.id });
    res.cookie(SESSION_COOKIE, token, cookieOptions());
    res.json({ user: publicUser(user) });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).send();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError(401, "Not signed in");
    res.json({ user: publicUser(user) });
  })
);

authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError(401, "Not signed in");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, "Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    res.status(204).send();
  })
);
