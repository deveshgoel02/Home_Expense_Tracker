import { useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { MonthSelector } from "../components/ui/MonthSelector";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader } from "../components/ui/Card";
import { ProgressBar, toneForPercent } from "../components/ui/ProgressBar";
import { AlertBanner } from "../components/ui/AlertBanner";
import { CategoryDonutChart } from "../components/charts/CategoryDonutChart";
import { MemberBarChart } from "../components/charts/MemberBarChart";
import { DailyTrendChart } from "../components/charts/DailyTrendChart";
import { TransactionRow } from "../components/expenses/TransactionRow";
import { EmptyState } from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";
import { formatPaise, monthLabel } from "../lib/format";
import { CheckCircle, CreditCard, PiggyBank, Receipt, Wallet } from "../components/ui/icons";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading, isError, error } = useDashboard(month, year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your family's financial snapshot for {monthLabel(month, year)}</p>
        </div>
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          Failed to load dashboard: {error?.message}
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total Income"
              value={formatPaise(data.summary.totalIncomePaise)}
              icon={<Wallet className="h-5 w-5 text-brand-600 dark:text-brand-400" />}
              iconBg="bg-brand-50 dark:bg-brand-500/10"
            />
            <StatCard
              label="Total Expenses"
              value={formatPaise(data.summary.totalExpensePaise)}
              icon={<Receipt className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
              iconBg="bg-slate-100 dark:bg-slate-800"
              changePercent={data.comparison.expenseChangePercent}
              changeLabel="vs last month"
            />
            <StatCard
              label={data.summary.remainingPaise >= 0 ? "Remaining Balance" : "Overspent By"}
              value={formatPaise(Math.abs(data.summary.remainingPaise))}
              icon={<PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-50 dark:bg-emerald-500/10"
              tone={data.summary.remainingPaise < 0 ? "danger" : "default"}
            />
            <StatCard
              label="Savings"
              value={formatPaise(data.summary.savingsPaise)}
              icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              iconBg="bg-emerald-50 dark:bg-emerald-500/10"
              tone={data.summary.savingsPaise < 0 ? "danger" : "default"}
            />
            <StatCard
              label="Credit Card Spending"
              value={formatPaise(data.summary.creditCardPaise)}
              icon={<CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-50 dark:bg-amber-500/10"
              changePercent={data.comparison.creditCardChangePercent}
              changeLabel="vs last month"
            />
          </div>

          <Card>
            <CardHeader
              title="Monthly Spending Progress"
              subtitle={`${formatPaise(data.summary.totalExpensePaise)} of ${formatPaise(data.summary.totalIncomePaise)} income used`}
            />
            <ProgressBar percent={data.summary.expenseRatioPercent} tone={toneForPercent(data.summary.expenseRatioPercent)} />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{data.summary.expenseRatioPercent}% used</p>
          </Card>

          {data.overallBudget ? (
            <Card>
              <CardHeader
                title="Monthly Budget"
                subtitle={`${formatPaise(data.overallBudget.actualPaise)} of ${formatPaise(data.overallBudget.budgetPaise)} budget used`}
                action={
                  <Link to="/budgets" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                    Manage budgets
                  </Link>
                }
              />
              <ProgressBar percent={data.overallBudget.percentUsed} tone={toneForPercent(data.overallBudget.percentUsed)} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium text-slate-600 dark:text-slate-300">{data.overallBudget.percentUsed}% used</p>
                <p
                  className={
                    data.overallBudget.remainingPaise < 0
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "text-slate-500 dark:text-slate-400"
                  }
                >
                  {data.overallBudget.remainingPaise < 0
                    ? `${formatPaise(Math.abs(data.overallBudget.remainingPaise))} over budget`
                    : `${formatPaise(data.overallBudget.remainingPaise)} remaining`}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="text-sm text-slate-500 dark:text-slate-400">
              No budget set for {monthLabel(month, year)} yet.{" "}
              <Link to="/budgets" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Set category budgets
              </Link>{" "}
              to track overall spending against a monthly budget here.
            </Card>
          )}

          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert, idx) => (
                <AlertBanner key={idx} alert={alert} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Spending by Category" />
              <CategoryDonutChart data={data.categoryBreakdown} />
            </Card>
            <Card>
              <CardHeader title="Spending by Family Member" />
              <MemberBarChart data={data.userBreakdown} />
            </Card>
          </div>

          <Card>
            <CardHeader title="Daily Spending" subtitle={monthLabel(month, year)} />
            <DailyTrendChart data={data.daily} />
          </Card>

          {data.insights.length > 0 && (
            <Card>
              <CardHeader title="Insights" subtitle="Automatically generated from this month's data" />
              <ul className="space-y-2">
                {data.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500 dark:bg-brand-400" />
                    {insight}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Recent Transactions"
              action={
                <Link to="/expenses" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  View all
                </Link>
              }
            />
            {data.recentTransactions.length === 0 ? (
              <EmptyState icon={<Receipt className="h-8 w-8" />} title="No expenses recorded today." />
            ) : (
              <div>
                {data.recentTransactions.slice(0, 10).map((expense) => (
                  <TransactionRow key={expense.id} expense={expense} />
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
