import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createBudgetSchema, updateBudgetSchema } from "../validation.js";
import { rupeesToPaise } from "../utils/money.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

export const budgetsRouter = Router();

budgetsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const budgets = await prisma.budget.findMany({
      where: { ...(month ? { month } : {}), ...(year ? { year } : {}) },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });
    res.json(budgets);
  })
);

budgetsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createBudgetSchema.parse(req.body);
    const existing = await prisma.budget.findUnique({
      where: { categoryId_month_year: { categoryId: data.categoryId, month: data.month, year: data.year } },
    });
    if (existing) throw new ConflictError("A budget for this category and month already exists");

    const budget = await prisma.budget.create({
      data: {
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        amountPaise: rupeesToPaise(data.amount),
      },
      include: { category: true },
    });
    res.status(201).json(budget);
  })
);

budgetsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateBudgetSchema.parse(req.body);
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Budget");

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amountPaise: rupeesToPaise(data.amount) },
      include: { category: true },
    });
    res.json(budget);
  })
);

budgetsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Budget");

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
