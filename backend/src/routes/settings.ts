import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { updateSettingsSchema } from "../validation.js";
import { requireAuth } from "../middleware/auth.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

async function getOrCreateSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton" } });
}

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getOrCreateSettings());
  })
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const data = updateSettingsSchema.parse(req.body);
    await getOrCreateSettings();
    const updated = await prisma.settings.update({ where: { id: "singleton" }, data });
    res.json(updated);
  })
);
