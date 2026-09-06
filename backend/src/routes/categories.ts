import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createCategorySchema } from "../validation.js";
import { ConflictError } from "../utils/errors.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  })
);

categoriesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createCategorySchema.parse(req.body);
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError("A category with this name already exists");

    const category = await prisma.category.create({
      data: { name: data.name, icon: data.icon ?? "Tag", isCustom: true },
    });
    res.status(201).json(category);
  })
);
