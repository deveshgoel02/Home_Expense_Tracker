import { prisma } from "../lib/prisma.js";
import { monthRange, previousMonth } from "./period.js";
import type { ExpenseLike, IncomeLike, PaymentMethod } from "./calculations.js";

export async function getMonthExpenses(month: number, year: number, userId?: string): Promise<ExpenseLike[]> {
  const { start, end } = monthRange(month, year);
  const rows = await prisma.expense.findMany({
    where: { date: { gte: start, lt: end }, ...(userId ? { userId } : {}) },
    select: { id: true, amountPaise: true, date: true, userId: true, categoryId: true, paymentMethod: true },
  });
  return rows.map((r) => ({ ...r, paymentMethod: r.paymentMethod as PaymentMethod }));
}

export async function getMonthIncomes(month: number, year: number): Promise<IncomeLike[]> {
  return prisma.income.findMany({
    where: { month, year },
    select: { id: true, amountPaise: true, userId: true },
  });
}

export async function getCategoryNameMap(): Promise<Record<string, string>> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(categories.map((c) => [c.id, c.name]));
}

export async function getUserNameMap(): Promise<Record<string, string>> {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(users.map((u) => [u.id, u.name]));
}

export async function getSettingsOrDefault() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  return prisma.settings.create({ data: { id: "singleton" } });
}

// Average monthly spend per category over the `monthsBack` months strictly
// before (month, year) — used to personalize the budget planner's suggestions
// with the household's actual behavior instead of pure benchmark guesses.
export async function getHistoricalCategoryAverages(
  month: number,
  year: number,
  monthsBack = 3
): Promise<Record<string, number>> {
  const totals = new Map<string, number>();
  let cursor = { month, year };
  for (let i = 0; i < monthsBack; i++) {
    cursor = previousMonth(cursor.month, cursor.year);
    const expenses = await getMonthExpenses(cursor.month, cursor.year);
    for (const e of expenses) {
      totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amountPaise);
    }
  }
  const result: Record<string, number> = {};
  for (const [categoryId, total] of totals) result[categoryId] = Math.round(total / monthsBack);
  return result;
}
