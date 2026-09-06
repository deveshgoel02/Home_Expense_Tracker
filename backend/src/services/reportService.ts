import { prisma } from "../lib/prisma.js";
import {
  breakdownByCategory,
  breakdownByPaymentMethod,
  breakdownByUser,
  compareMonths,
  computeBudgetPace,
  computeBudgetStatus,
  computeMonthlySummary,
  dailySeries,
  generateAlerts,
  generateBudgetPaceAlerts,
  generateInsights,
} from "./calculations.js";
import {
  getCategoryNameMap,
  getHistoricalCategoryAverages,
  getMonthExpenses,
  getMonthIncomes,
  getSettingsOrDefault,
  getUserNameMap,
} from "./dataAccess.js";
import { daysInMonth, previousMonth } from "./period.js";
import { SAFE_USER_SELECT } from "./userService.js";
import { planBudget, type FixedItem } from "./budgetPlanner.js";

const includeUserAndCategory = { user: { select: SAFE_USER_SELECT }, category: true } as const;

export async function buildMonthlySummaryBundle(month: number, year: number) {
  const [expenses, incomes, categoryNames, userNames, settings] = await Promise.all([
    getMonthExpenses(month, year),
    getMonthIncomes(month, year),
    getCategoryNameMap(),
    getUserNameMap(),
    getSettingsOrDefault(),
  ]);

  const summary = computeMonthlySummary(expenses, incomes);
  const categoryBreakdown = breakdownByCategory(expenses, categoryNames);
  const userBreakdown = breakdownByUser(expenses, userNames);
  const paymentMethodBreakdown = breakdownByPaymentMethod(expenses);
  const daily = dailySeries(expenses, daysInMonth(month, year), month, year);
  const alerts = generateAlerts(summary, settings);

  return { summary, categoryBreakdown, userBreakdown, paymentMethodBreakdown, daily, alerts, expenses };
}

export async function buildDashboard(month: number, year: number) {
  const bundle = await buildMonthlySummaryBundle(month, year);
  const prev = previousMonth(month, year);
  const [prevExpenses, prevIncomes, categoryNames] = await Promise.all([
    getMonthExpenses(prev.month, prev.year),
    getMonthIncomes(prev.month, prev.year),
    getCategoryNameMap(),
  ]);
  const previousSummary = computeMonthlySummary(prevExpenses, prevIncomes);
  const comparison = compareMonths(bundle.summary, previousSummary);
  const previousCategoryBreakdown = breakdownByCategory(prevExpenses, categoryNames);
  const insights = generateInsights(bundle.summary, bundle.categoryBreakdown, comparison, previousCategoryBreakdown);

  const recentTransactions = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: includeUserAndCategory,
  });

  const [budgets, settings] = await Promise.all([
    prisma.budget.findMany({ where: { month, year }, include: { category: true } }),
    getSettingsOrDefault(),
  ]);
  const budgetStatus = computeBudgetStatus(
    budgets.map((b) => ({ categoryId: b.categoryId, amountPaise: b.amountPaise })),
    bundle.categoryBreakdown,
    categoryNames,
    settings.budgetWarningPercent,
    settings.budgetCriticalPercent
  );

  const now = new Date();
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
  const dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth(month, year);
  const budgetPace = computeBudgetPace(budgetStatus, dayOfMonth, daysInMonth(month, year), settings.budgetCriticalPercent);
  const budgetAlerts = generateBudgetPaceAlerts(budgetPace);

  return {
    month,
    year,
    summary: bundle.summary,
    categoryBreakdown: bundle.categoryBreakdown,
    userBreakdown: bundle.userBreakdown,
    paymentMethodBreakdown: bundle.paymentMethodBreakdown,
    daily: bundle.daily,
    alerts: [...bundle.alerts, ...budgetAlerts],
    insights,
    recentTransactions,
    budgetStatus: budgetPace,
    comparison,
  };
}

export async function buildMonthlyReport(month: number, year: number) {
  const bundle = await buildMonthlySummaryBundle(month, year);
  const prev = previousMonth(month, year);
  const [prevExpenses, prevIncomes] = await Promise.all([
    getMonthExpenses(prev.month, prev.year),
    getMonthIncomes(prev.month, prev.year),
  ]);
  const previousSummary = computeMonthlySummary(prevExpenses, prevIncomes);
  const comparison = compareMonths(bundle.summary, previousSummary);

  const topExpenses = [...bundle.expenses].sort((a, b) => b.amountPaise - a.amountPaise).slice(0, 10);
  const topExpenseIds = topExpenses.map((e) => e.id);
  const topExpenseDetails = topExpenseIds.length
    ? await prisma.expense.findMany({
        where: { id: { in: topExpenseIds } },
        include: includeUserAndCategory,
      })
    : [];
  const orderedTopExpenses = topExpenseIds
    .map((id) => topExpenseDetails.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return {
    month,
    year,
    summary: bundle.summary,
    categoryBreakdown: bundle.categoryBreakdown,
    userBreakdown: bundle.userBreakdown,
    paymentMethodBreakdown: bundle.paymentMethodBreakdown,
    daily: bundle.daily,
    comparison,
    topExpenses: orderedTopExpenses,
  };
}

export async function buildMemberReport(userId: string, month: number, year: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  if (!user) return null;

  const prev = previousMonth(month, year);
  const [expenses, categoryNames, prevExpenses] = await Promise.all([
    getMonthExpenses(month, year, userId),
    getCategoryNameMap(),
    getMonthExpenses(prev.month, prev.year, userId),
  ]);

  const monthlySpendingPaise = expenses.reduce((s, e) => s + e.amountPaise, 0);
  const creditCardPaise = expenses.filter((e) => e.paymentMethod === "CREDIT_CARD").reduce((s, e) => s + e.amountPaise, 0);
  const cashPaise = monthlySpendingPaise - creditCardPaise;
  const previousMonthSpendingPaise = prevExpenses.reduce((s, e) => s + e.amountPaise, 0);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayPaise = expenses
    .filter((e) => e.date.toISOString().slice(0, 10) === todayStr)
    .reduce((s, e) => s + e.amountPaise, 0);

  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  const weekPaise = expenses.filter((e) => e.date >= weekStart).reduce((s, e) => s + e.amountPaise, 0);

  const categoryBreakdown = breakdownByCategory(expenses, categoryNames);
  const daily = dailySeries(expenses, daysInMonth(month, year), month, year);

  return {
    user,
    month,
    year,
    monthlySpendingPaise,
    weekSpendingPaise: weekPaise,
    todaySpendingPaise: todayPaise,
    transactionCount: expenses.length,
    creditCardPaise,
    cashPaise,
    previousMonthSpendingPaise,
    changeFromPreviousMonthPercent:
      previousMonthSpendingPaise === 0
        ? monthlySpendingPaise > 0
          ? 100
          : 0
        : Math.round(((monthlySpendingPaise - previousMonthSpendingPaise) / previousMonthSpendingPaise) * 1000) / 10,
    topCategories: categoryBreakdown.slice(0, 5),
    daily,
  };
}

export async function buildBudgetPlan(
  month: number,
  year: number,
  incomePaise: number,
  fixedItems: FixedItem[]
) {
  const [categories, historicalAverages] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    getHistoricalCategoryAverages(month, year),
  ]);

  return planBudget({ incomePaise, fixedItems, categories, historicalAverages });
}
