import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { applyBudgetPlanSchema, budgetPlanRequestSchema } from "../validation.js";
import { rupeesToPaise } from "../utils/money.js";
import { buildBudgetPlan } from "../services/reportService.js";

export const budgetPlannerRouter = Router();
budgetPlannerRouter.use(requireAuth);

budgetPlannerRouter.post(
  "/plan",
  asyncHandler(async (req, res) => {
    const data = budgetPlanRequestSchema.parse(req.body);
    const fixedItems = data.fixedExpenses.map((f) => ({
      label: f.label,
      amountPaise: rupeesToPaise(f.amount),
      categoryId: f.categoryId ?? null,
    }));
    const plan = await buildBudgetPlan(data.month, data.year, rupeesToPaise(data.income), fixedItems);
    res.json(plan);
  })
);

// Upserts a Budget row per category from the (possibly user-edited) plan —
// same underlying data the Budgets page manages, just filled in for you.
// Each category is an independent row, so these run in parallel rather than
// as one sequential transaction — with ~20 categories over a remote DB,
// sequential round-trips make this feel sluggish for no atomicity benefit.
budgetPlannerRouter.post(
  "/apply",
  asyncHandler(async (req, res) => {
    const data = applyBudgetPlanSchema.parse(req.body);

    const budgets = await Promise.all(
      data.allocations.map((a) =>
        prisma.budget.upsert({
          where: { categoryId_month_year: { categoryId: a.categoryId, month: data.month, year: data.year } },
          create: { categoryId: a.categoryId, month: data.month, year: data.year, amountPaise: rupeesToPaise(a.amount) },
          update: { amountPaise: rupeesToPaise(a.amount) },
          include: { category: true },
        })
      )
    );

    res.json(budgets);
  })
);
