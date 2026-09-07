// Pure, dependency-free financial calculation engine.
// Every number that reaches the frontend for a "how much has the family
// spent/saved/earned" question is derived from these functions so the
// logic exists in exactly one place and is unit-testable in isolation.

import { percent, safeDiv } from "../utils/money.js";

export type PaymentMethod = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "UPI" | "OTHER";

export interface ExpenseLike {
  id: string;
  amountPaise: number;
  date: Date;
  userId: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
}

export interface IncomeLike {
  id: string;
  amountPaise: number;
  userId: string | null;
}

export interface MonthlySummary {
  totalIncomePaise: number;
  totalExpensePaise: number;
  creditCardPaise: number;
  nonCreditPaise: number; // cash/debit/bank/upi/other - money already paid out
  remainingPaise: number; // income - expenses; can be negative
  savingsPaise: number; // same as remaining, named for the "are we saving" question
  savingsRatePercent: number; // savings / income * 100, 0 if income is 0
  expenseRatioPercent: number; // expenses / income * 100
  creditCardDependencePercent: number; // creditCard / totalExpense * 100
  transactionCount: number;
}

export function isCreditCard(method: PaymentMethod): boolean {
  return method === "CREDIT_CARD";
}

export function sumExpenses(expenses: ExpenseLike[]): number {
  return expenses.reduce((sum, e) => sum + e.amountPaise, 0);
}

export function sumIncome(incomes: IncomeLike[]): number {
  return incomes.reduce((sum, i) => sum + i.amountPaise, 0);
}

export function computeMonthlySummary(expenses: ExpenseLike[], incomes: IncomeLike[]): MonthlySummary {
  const totalIncomePaise = sumIncome(incomes);
  const totalExpensePaise = sumExpenses(expenses);
  const creditCardPaise = sumExpenses(expenses.filter((e) => isCreditCard(e.paymentMethod)));
  const nonCreditPaise = totalExpensePaise - creditCardPaise;
  const remainingPaise = totalIncomePaise - totalExpensePaise;

  return {
    totalIncomePaise,
    totalExpensePaise,
    creditCardPaise,
    nonCreditPaise,
    remainingPaise,
    savingsPaise: remainingPaise,
    savingsRatePercent: totalIncomePaise === 0 ? 0 : percent(remainingPaise, totalIncomePaise),
    expenseRatioPercent: percent(totalExpensePaise, totalIncomePaise),
    creditCardDependencePercent: percent(creditCardPaise, totalExpensePaise),
    transactionCount: expenses.length,
  };
}

export interface BreakdownItem {
  key: string;
  label: string;
  amountPaise: number;
  percentOfTotal: number;
  transactionCount: number;
}

export function breakdownBy(
  expenses: ExpenseLike[],
  keyFn: (e: ExpenseLike) => string,
  labelFn: (key: string) => string
): BreakdownItem[] {
  const total = sumExpenses(expenses);
  const groups = new Map<string, { amount: number; count: number }>();

  for (const e of expenses) {
    const key = keyFn(e);
    const g = groups.get(key) ?? { amount: 0, count: 0 };
    g.amount += e.amountPaise;
    g.count += 1;
    groups.set(key, g);
  }

  return Array.from(groups.entries())
    .map(([key, g]) => ({
      key,
      label: labelFn(key),
      amountPaise: g.amount,
      percentOfTotal: percent(g.amount, total),
      transactionCount: g.count,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);
}

export function breakdownByCategory(
  expenses: ExpenseLike[],
  categoryNames: Record<string, string>
): BreakdownItem[] {
  return breakdownBy(expenses, (e) => e.categoryId, (id) => categoryNames[id] ?? "Unknown");
}

export function breakdownByUser(expenses: ExpenseLike[], userNames: Record<string, string>): BreakdownItem[] {
  return breakdownBy(expenses, (e) => e.userId, (id) => userNames[id] ?? "Unknown");
}

export function breakdownByPaymentMethod(expenses: ExpenseLike[]): BreakdownItem[] {
  return breakdownBy(expenses, (e) => e.paymentMethod, (m) => m);
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  amountPaise: number;
}

export function dailySeries(expenses: ExpenseLike[], daysInMonth: number, month: number, year: number): DailyPoint[] {
  const buckets = new Map<string, number>();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  for (const e of expenses) {
    const d = e.date;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + e.amountPaise);
    }
  }
  return Array.from(buckets.entries()).map(([date, amountPaise]) => ({ date, amountPaise }));
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  severity: AlertSeverity;
  message: string;
}

export interface AlertThresholds {
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  creditCardWarningPaise: number;
}

export function generateAlerts(summary: MonthlySummary, thresholds: AlertThresholds): Alert[] {
  const alerts: Alert[] = [];
  const { totalIncomePaise, totalExpensePaise, remainingPaise, creditCardPaise, expenseRatioPercent } = summary;

  if (totalIncomePaise === 0 && totalExpensePaise > 0) {
    alerts.push({
      severity: "warning",
      message: "No income has been recorded for this month, but expenses are being tracked.",
    });
  } else if (totalIncomePaise > 0) {
    if (totalExpensePaise > totalIncomePaise) {
      alerts.push({
        severity: "critical",
        message: `Your family has spent ₹${formatRupees(
          totalExpensePaise - totalIncomePaise
        )} more than this month's income.`,
      });
    } else if (expenseRatioPercent >= thresholds.criticalThresholdPercent) {
      alerts.push({
        severity: "critical",
        message: `Your monthly expenses have reached ${expenseRatioPercent}% of your total income.`,
      });
    } else if (expenseRatioPercent >= thresholds.warningThresholdPercent) {
      alerts.push({
        severity: "warning",
        message: `You have already used ${expenseRatioPercent}% of this month's income.`,
      });
    } else {
      alerts.push({
        severity: "info",
        message: `Your family has saved ₹${formatRupees(remainingPaise)} this month.`,
      });
    }
  }

  if (creditCardPaise >= thresholds.creditCardWarningPaise) {
    alerts.push({
      severity: "warning",
      message: `Credit card spending is ₹${formatRupees(creditCardPaise)} this month. Review upcoming payments.`,
    });
  }

  return alerts;
}

function formatRupees(paise: number): string {
  const rupees = Math.abs(Math.round(paise / 100));
  return rupees.toLocaleString("en-IN");
}

export interface BudgetPaceStatus extends BudgetStatus {
  projectedPaise: number; // actual spend extrapolated to the full month at the current daily rate
  projectedPercentUsed: number;
  onPaceToExceed: boolean; // not yet over budget, but projected to be by month end
}

// dayOfMonth should be the current day for the month being viewed (or the full
// day count for a month that has already ended, which makes projected == actual).
export function computeBudgetPace(
  budgetStatuses: BudgetStatus[],
  dayOfMonth: number,
  daysInMonthCount: number,
  criticalPercent: number
): BudgetPaceStatus[] {
  const elapsedDays = Math.min(Math.max(dayOfMonth, 1), daysInMonthCount);

  return budgetStatuses.map((b) => {
    const projectedPaise = Math.round(b.actualPaise * (daysInMonthCount / elapsedDays));
    const projectedPercentUsed = percent(projectedPaise, b.budgetPaise);
    return {
      ...b,
      projectedPaise,
      projectedPercentUsed,
      onPaceToExceed: b.severity !== "critical" && projectedPercentUsed >= criticalPercent,
    };
  });
}

export function generateBudgetPaceAlerts(paceStatuses: BudgetPaceStatus[]): Alert[] {
  const alerts: Alert[] = [];
  for (const b of paceStatuses) {
    if (b.severity === "critical") {
      alerts.push({
        severity: "critical",
        message: `${b.categoryLabel} budget exceeded — spent ₹${formatRupees(b.actualPaise)} of ₹${formatRupees(
          b.budgetPaise
        )} (${b.percentUsed}%).`,
      });
    } else if (b.onPaceToExceed) {
      alerts.push({
        severity: "warning",
        message: `${b.categoryLabel} is on pace to exceed its budget by month end — projected ₹${formatRupees(
          b.projectedPaise
        )} vs a ₹${formatRupees(b.budgetPaise)} budget.`,
      });
    }
  }
  return alerts;
}

export interface MonthComparison {
  current: MonthlySummary;
  previous: MonthlySummary;
  incomeChangePaise: number;
  incomeChangePercent: number;
  expenseChangePaise: number;
  expenseChangePercent: number;
  savingsChangePaise: number;
  creditCardChangePaise: number;
  creditCardChangePercent: number;
}

export function compareMonths(current: MonthlySummary, previous: MonthlySummary): MonthComparison {
  return {
    current,
    previous,
    incomeChangePaise: current.totalIncomePaise - previous.totalIncomePaise,
    incomeChangePercent: percentChange(previous.totalIncomePaise, current.totalIncomePaise),
    expenseChangePaise: current.totalExpensePaise - previous.totalExpensePaise,
    expenseChangePercent: percentChange(previous.totalExpensePaise, current.totalExpensePaise),
    savingsChangePaise: current.savingsPaise - previous.savingsPaise,
    creditCardChangePaise: current.creditCardPaise - previous.creditCardPaise,
    creditCardChangePercent: percentChange(previous.creditCardPaise, current.creditCardPaise),
  };
}

export function percentChange(previous: number, current: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(safeDiv(current - previous, Math.abs(previous)) * 1000) / 10;
}

export interface CategoryChange {
  categoryLabel: string;
  previousPaise: number;
  currentPaise: number;
  changePercent: number;
}

export function categoryChanges(
  currentBreakdown: BreakdownItem[],
  previousBreakdown: BreakdownItem[]
): CategoryChange[] {
  const prevByKey = new Map(previousBreakdown.map((b) => [b.key, b]));
  const results: CategoryChange[] = [];
  for (const cur of currentBreakdown) {
    const prev = prevByKey.get(cur.key);
    const previousPaise = prev?.amountPaise ?? 0;
    results.push({
      categoryLabel: cur.label,
      previousPaise,
      currentPaise: cur.amountPaise,
      changePercent: percentChange(previousPaise, cur.amountPaise),
    });
  }
  return results;
}

export function generateInsights(
  summary: MonthlySummary,
  categoryBreakdown: BreakdownItem[],
  comparison: MonthComparison | null,
  previousCategoryBreakdown: BreakdownItem[] = []
): string[] {
  const insights: string[] = [];

  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    insights.push(`${top.label} is your highest spending category this month at ${top.percentOfTotal}% of total expenses.`);
  }

  if (summary.totalIncomePaise > 0 && summary.savingsPaise >= 0) {
    insights.push(`You are currently saving ${summary.savingsRatePercent}% of family income.`);
  }

  if (summary.totalExpensePaise > 0 && summary.creditCardPaise > 0) {
    insights.push(
      `Credit card spending represents ${summary.creditCardDependencePercent}% of total expenses.`
    );
  }

  if (comparison && comparison.previous.totalExpensePaise > 0) {
    const direction = comparison.expenseChangePercent >= 0 ? "more" : "less";
    insights.push(
      `Your family spent ${Math.abs(comparison.expenseChangePercent)}% ${direction} this month than last month.`
    );

    const changes = categoryChanges(categoryBreakdown, previousCategoryBreakdown)
      .filter((c) => c.previousPaise > 0 && Math.abs(c.changePercent) >= 25)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    for (const change of changes.slice(0, 2)) {
      const changeDirection = change.changePercent >= 0 ? "increased" : "decreased";
      insights.push(
        `${change.categoryLabel} expenses ${changeDirection} ${Math.abs(change.changePercent)}% compared with last month.`
      );
    }
  }

  return insights;
}

export interface BudgetLike {
  categoryId: string;
  amountPaise: number;
}

export interface BudgetStatus {
  categoryId: string;
  categoryLabel: string;
  budgetPaise: number;
  actualPaise: number;
  remainingPaise: number;
  percentUsed: number;
  severity: AlertSeverity;
}

export interface OverallBudgetStatus {
  budgetPaise: number;
  actualPaise: number;
  remainingPaise: number;
  percentUsed: number;
  severity: AlertSeverity;
}

// Family-wide budget for the month (the sum of every category budget set for
// it), compared against actual spending — distinct from computeBudgetStatus,
// which tracks each category budget individually.
export function computeOverallBudgetStatus(
  totalBudgetPaise: number,
  totalExpensePaise: number,
  warningPercent: number,
  criticalPercent: number
): OverallBudgetStatus | null {
  if (totalBudgetPaise <= 0) return null;

  const percentUsed = percent(totalExpensePaise, totalBudgetPaise);
  let severity: AlertSeverity = "info";
  if (percentUsed >= criticalPercent) severity = "critical";
  else if (percentUsed >= warningPercent) severity = "warning";

  return {
    budgetPaise: totalBudgetPaise,
    actualPaise: totalExpensePaise,
    remainingPaise: totalBudgetPaise - totalExpensePaise,
    percentUsed,
    severity,
  };
}

export function generateOverallBudgetAlert(status: OverallBudgetStatus | null): Alert | null {
  if (!status) return null;

  if (status.severity === "critical") {
    return {
      severity: "critical",
      message: `Monthly budget exceeded — spent ₹${formatRupees(status.actualPaise)} of ₹${formatRupees(
        status.budgetPaise
      )} (${status.percentUsed}%).`,
    };
  }
  if (status.severity === "warning") {
    return {
      severity: "warning",
      message: `You've used ${status.percentUsed}% of this month's ₹${formatRupees(
        status.budgetPaise
      )} budget — ₹${formatRupees(status.remainingPaise)} remaining.`,
    };
  }
  return null;
}

export function computeBudgetStatus(
  budgets: BudgetLike[],
  categoryBreakdown: BreakdownItem[],
  categoryNames: Record<string, string>,
  warningPercent: number,
  criticalPercent: number
): BudgetStatus[] {
  const actualByCategory = new Map(categoryBreakdown.map((b) => [b.key, b.amountPaise]));

  return budgets.map((budget) => {
    const actualPaise = actualByCategory.get(budget.categoryId) ?? 0;
    const percentUsed = percent(actualPaise, budget.amountPaise);
    let severity: AlertSeverity = "info";
    if (percentUsed >= criticalPercent) severity = "critical";
    else if (percentUsed >= warningPercent) severity = "warning";

    return {
      categoryId: budget.categoryId,
      categoryLabel: categoryNames[budget.categoryId] ?? "Unknown",
      budgetPaise: budget.amountPaise,
      actualPaise,
      remainingPaise: budget.amountPaise - actualPaise,
      percentUsed,
      severity,
    };
  });
}
