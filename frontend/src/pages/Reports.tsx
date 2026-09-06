import { useState } from "react";
import { useMonthlyReport } from "../hooks/useDashboard";
import { MonthSelector } from "../components/ui/MonthSelector";
import { Card, CardHeader } from "../components/ui/Card";
import { CardSkeleton } from "../components/ui/Skeleton";
import { CategoryDonutChart } from "../components/charts/CategoryDonutChart";
import { MemberBarChart } from "../components/charts/MemberBarChart";
import { PaymentMethodBreakdown } from "../components/charts/PaymentMethodBreakdown";
import { DailyTrendChart } from "../components/charts/DailyTrendChart";
import { TransactionRow } from "../components/expenses/TransactionRow";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Receipt } from "../components/ui/icons";
import { formatPaise, monthLabel } from "../lib/format";

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = useMonthlyReport(month, year);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Monthly Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A complete financial picture for the selected month.</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          <Button variant="secondary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          <div className="hidden print:block">
            <h1 className="text-xl font-bold">Family Home Expense Tracker — Monthly Report</h1>
            <p className="text-sm text-slate-500">{monthLabel(month, year)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryTile label="Income" value={formatPaise(data.summary.totalIncomePaise)} />
            <SummaryTile label="Expenses" value={formatPaise(data.summary.totalExpensePaise)} />
            <SummaryTile
              label="Savings"
              value={formatPaise(data.summary.savingsPaise)}
              tone={data.summary.savingsPaise < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
            />
            <SummaryTile label="Credit Card" value={formatPaise(data.summary.creditCardPaise)} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <SummaryTile label="Savings Rate" value={`${data.summary.savingsRatePercent}%`} />
            <SummaryTile label="Expense-to-Income Ratio" value={`${data.summary.expenseRatioPercent}%`} />
            <SummaryTile label="Credit Card Dependence" value={`${data.summary.creditCardDependencePercent}%`} />
          </div>

          <Card>
            <CardHeader title="Compared with Previous Month" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ComparisonRow label="Income" changePaise={data.comparison.incomeChangePaise} changePercent={data.comparison.incomeChangePercent} />
              <ComparisonRow
                label="Expenses"
                changePaise={data.comparison.expenseChangePaise}
                changePercent={data.comparison.expenseChangePercent}
                inverse
              />
              <ComparisonRow
                label="Credit Card"
                changePaise={data.comparison.creditCardChangePaise}
                changePercent={data.comparison.creditCardChangePercent}
                inverse
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Category Breakdown" />
              <CategoryDonutChart data={data.categoryBreakdown} />
            </Card>
            <Card>
              <CardHeader title="Family Member Breakdown" />
              <MemberBarChart data={data.userBreakdown} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Payment Method Breakdown" />
              <PaymentMethodBreakdown data={data.paymentMethodBreakdown} />
            </Card>
            <Card>
              <CardHeader title="Daily Spending" />
              <DailyTrendChart data={data.daily} />
            </Card>
          </div>

          <Card className="print:break-inside-avoid">
            <CardHeader title="Top 10 Expenses" subtitle={monthLabel(month, year)} />
            {data.topExpenses.length === 0 ? (
              <EmptyState icon={<Receipt className="h-8 w-8" />} title="No expenses recorded this month." />
            ) : (
              <div>
                {data.topExpenses.map((expense) => (
                  <TransactionRow key={expense.id} expense={expense} showActions={false} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone ?? "text-slate-900 dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  changePaise,
  changePercent,
  inverse = false,
}: {
  label: string;
  changePaise: number;
  changePercent: number;
  inverse?: boolean;
}) {
  const isGoodDirection = inverse ? changePaise <= 0 : changePaise >= 0;
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          isGoodDirection ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {changePaise >= 0 ? "+" : "-"}
        {formatPaise(Math.abs(changePaise))} ({changePercent >= 0 ? "+" : ""}
        {changePercent}%)
      </p>
    </div>
  );
}
