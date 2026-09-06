import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export const SESSION_COOKIE = "session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "Not signed in" });
  }

  const payload = verifySession(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expired or invalid, please sign in again" });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Account not found or deactivated" });
  }

  req.userId = user.id;
  next();
}

export function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  };
}
