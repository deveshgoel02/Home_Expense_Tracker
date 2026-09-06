import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { updateUserSchema } from "../validation.js";
import { NotFoundError } from "../utils/errors.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const users = await prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  })
);

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("User");

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(user);
  })
);
