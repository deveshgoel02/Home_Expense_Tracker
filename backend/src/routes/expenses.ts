import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createExpenseSchema, expenseQuerySchema, updateExpenseSchema } from "../validation.js";
import { rupeesToPaise } from "../utils/money.js";
import { NotFoundError } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { SAFE_USER_SELECT } from "../services/userService.js";

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

function buildWhere(query: ReturnType<typeof expenseQuerySchema.parse>): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};
  if (query.userId) where.userId = query.userId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
    if (query.dateTo) where.date.lte = new Date(query.dateTo);
  }
  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    where.amountPaise = {};
    if (query.minAmount !== undefined) where.amountPaise.gte = rupeesToPaise(query.minAmount);
    if (query.maxAmount !== undefined) where.amountPaise.lte = rupeesToPaise(query.maxAmount);
  }
  if (query.search) {
    where.OR = [
      { description: { contains: query.search } },
      { notes: { contains: query.search } },
      { subcategory: { contains: query.search } },
    ];
  }
  return where;
}

function sortToOrderBy(sort: string): Prisma.ExpenseOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { date: "asc" };
    case "highest":
      return { amountPaise: "desc" };
    case "lowest":
      return { amountPaise: "asc" };
    default:
      return { date: "desc" };
  }
}

const includeRelations = { user: { select: SAFE_USER_SELECT }, category: true } as const;

expensesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = expenseQuerySchema.parse(req.query);
    const where = buildWhere(query);

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: includeRelations,
        orderBy: sortToOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    });
  })
);

expensesRouter.get(
  "/export/csv",
  asyncHandler(async (req, res) => {
    const query = expenseQuerySchema.parse({ ...req.query, pageSize: 100000, page: 1 });
    const where = buildWhere(query);
    const items = await prisma.expense.findMany({
      where,
      include: includeRelations,
      orderBy: sortToOrderBy(query.sort),
    });

    const header = ["Date", "Person", "Category", "Subcategory", "Description", "Amount (INR)", "Payment Method", "Notes"];
    const rows = items.map((e) => [
      e.date.toISOString().slice(0, 10),
      e.user.name,
      e.category.name,
      e.subcategory ?? "",
      e.description,
      (e.amountPaise / 100).toFixed(2),
      e.paymentMethod,
      e.notes ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="expenses.csv"`);
    res.send(csv);
  })
);

expensesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createExpenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        amountPaise: rupeesToPaise(data.amount),
        date: new Date(data.date),
        userId: data.userId,
        categoryId: data.categoryId,
        subcategory: data.subcategory ?? null,
        description: data.description,
        paymentMethod: data.paymentMethod,
        notes: data.notes ?? null,
      },
      include: includeRelations,
    });
    res.status(201).json(expense);
  })
);

expensesRouter.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    const original = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!original) throw new NotFoundError("Expense");

    const duplicate = await prisma.expense.create({
      data: {
        amountPaise: original.amountPaise,
        date: new Date(),
        userId: original.userId,
        categoryId: original.categoryId,
        subcategory: original.subcategory,
        description: original.description,
        paymentMethod: original.paymentMethod,
        notes: original.notes,
      },
      include: includeRelations,
    });
    res.status(201).json(duplicate);
  })
);

expensesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateExpenseSchema.parse(req.body);
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Expense");

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(data.amount !== undefined ? { amountPaise: rupeesToPaise(data.amount) } : {}),
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(data.userId !== undefined ? { userId: data.userId } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.subcategory !== undefined ? { subcategory: data.subcategory } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: includeRelations,
    });
    res.json(expense);
  })
);

expensesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Expense");

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
