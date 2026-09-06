import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createUserSchema, updateUserSchema } from "../validation.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { createFamilyMember, SAFE_USER_SELECT } from "../services/userService.js";
import { generateTempPassword } from "../lib/passwords.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const users = await prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: "asc" },
      select: SAFE_USER_SELECT,
    });
    res.json(users);
  })
);

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const tempPassword = data.password ?? generateTempPassword();
    const user = await createFamilyMember({ name: data.name, password: tempPassword, color: data.color });

    const { passwordHash: _omit, ...safeUser } = user;
    res.status(201).json({
      user: safeUser,
      // Only returned when the caller didn't supply a password themselves,
      // so it can be shown once and handed to the new member.
      temporaryPassword: data.password ? undefined : tempPassword,
    });
  })
);

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("User");

    if (req.params.id === req.userId && data.isActive === false) {
      throw new ValidationError("You cannot deactivate your own account while signed in as them");
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: SAFE_USER_SELECT });
    res.json(user);
  })
);
