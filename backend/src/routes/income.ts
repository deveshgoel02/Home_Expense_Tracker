import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createIncomeSchema, updateIncomeSchema } from "../validation.js";
import { rupeesToPaise } from "../utils/money.js";
import { NotFoundError } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { SAFE_USER_SELECT } from "../services/userService.js";

export const incomeRouter = Router();
incomeRouter.use(requireAuth);

const includeUser = { user: { select: SAFE_USER_SELECT } } as const;

incomeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

    const incomes = await prisma.income.findMany({
      where: {
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
        ...(userId ? { userId } : {}),
      },
      include: includeUser,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });
    res.json(incomes);
  })
);

incomeRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createIncomeSchema.parse(req.body);
    const income = await prisma.income.create({
      data: {
        month: data.month,
        year: data.year,
        amountPaise: rupeesToPaise(data.amount),
        source: data.source,
        userId: data.userId ?? null,
        notes: data.notes ?? null,
      },
      include: includeUser,
    });
    res.status(201).json(income);
  })
);

incomeRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateIncomeSchema.parse(req.body);
    const existing = await prisma.income.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Income");

    const income = await prisma.income.update({
      where: { id: req.params.id },
      data: {
        ...(data.month !== undefined ? { month: data.month } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.amount !== undefined ? { amountPaise: rupeesToPaise(data.amount) } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.userId !== undefined ? { userId: data.userId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: includeUser,
    });
    res.json(income);
  })
);

incomeRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.income.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Income");

    await prisma.income.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
