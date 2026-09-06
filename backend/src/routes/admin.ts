import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createFamilyMember } from "../services/userService.js";
import { generateTempPassword } from "../lib/passwords.js";
import { AppError } from "../utils/errors.js";

export const adminRouter = Router();

const DEFAULT_CATEGORIES = [
  "Medical", "Travel", "Petrol", "Rent", "Groceries", "Electronics", "Fruits", "Vegetables",
  "Education", "Shopping", "Household", "Utilities", "Internet", "Mobile", "Insurance",
  "Dining", "Entertainment", "Subscriptions", "Repairs", "Domestic Help", "Other",
];

const DEFAULT_MEMBERS = ["Vivek", "Rekha", "Dhruv", "Devesh", "Aruna (Dadi)", "Vinti"];

// One-time setup for a freshly deployed, empty database: creates the default
// family members (with generated temporary passwords, returned once in the
// response) and the default category list. Refuses to run if any user
// already exists, so a leaked/guessed secret can't be replayed to do damage.
adminRouter.post(
  "/bootstrap",
  asyncHandler(async (req, res) => {
    const providedSecret = req.header("x-bootstrap-secret");
    const expectedSecret = process.env.BOOTSTRAP_SECRET;

    if (!expectedSecret) {
      throw new AppError(503, "Bootstrap is not configured on this server");
    }
    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new AppError(401, "Invalid bootstrap secret");
    }

    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      throw new AppError(409, "This database has already been bootstrapped");
    }

    const createdMembers: { name: string; tempPassword: string }[] = [];
    for (const name of DEFAULT_MEMBERS) {
      const tempPassword = generateTempPassword();
      await createFamilyMember({ name, password: tempPassword });
      createdMembers.push({ name, tempPassword });
    }

    for (const name of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    res.status(201).json({
      message: "Bootstrap complete. Save these temporary passwords now — they will not be shown again. Each member should change their password after first login.",
      members: createdMembers,
    });
  })
);
