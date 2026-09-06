import { prisma } from "../lib/prisma.js";
import { monthRange } from "./period.js";
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
