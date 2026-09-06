import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMemberReport } from "../hooks/useDashboard";
import { MonthSelector } from "../components/ui/MonthSelector";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/dashboard/StatCard";
import { DailyTrendChart } from "../components/charts/DailyTrendChart";
import { CardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPaise, monthLabel } from "../lib/format";
import { ChevronRight, CreditCard, Receipt, Wallet } from "../components/ui/icons";
import { useChartPalette } from "../hooks/useChartPalette";

export default function MemberReport() {
  const { id } = useParams<{ id: string }>();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading, isError } = useMemberReport(id ?? null, month, year);
  const palette = useChartPalette();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="mb-1 flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500">
            <Link to="/family" className="hover:text-slate-600 dark:hover:text-slate-300">
              Family
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600 dark:text-slate-300">{data?.user.name ?? "Member"}</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data?.user.name ?? "Member Report"}</h1>
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
          Could not load this member's report.
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Monthly Spending"
              value={formatPaise(data.monthlySpendingPaise)}
              icon={<Wallet className="h-5 w-5 text-brand-600 dark:text-brand-400" />}
              iconBg="bg-brand-50 dark:bg-brand-500/10"
              changePercent={data.changeFromPreviousMonthPercent}
              changeLabel="vs last month"
            />
            <StatCard
              label="This Week"
              value={formatPaise(data.weekSpendingPaise)}
              icon={<Receipt className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
              iconBg="bg-slate-100 dark:bg-slate-800"
            />
            <StatCard
              label="Today"
              value={formatPaise(data.todaySpendingPaise)}
              icon={<Receipt className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
              iconBg="bg-slate-100 dark:bg-slate-800"
            />
            <StatCard
              label="Credit Card Spending"
              value={formatPaise(data.creditCardPaise)}
              icon={<CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-50 dark:bg-amber-500/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top Categories" subtitle={monthLabel(month, year)} />
              {data.topCategories.length === 0 ? (
                <EmptyState icon={<Receipt className="h-8 w-8" />} title="No expenses recorded this month." />
              ) : (
                <ul className="space-y-3">
                  {data.topCategories.map((cat, idx) => (
                    <li key={cat.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: palette.categorical[idx % palette.categorical.length] }}
                          />
                          {cat.label}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPaise(cat.amountPaise)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.percentOfTotal}%`, backgroundColor: palette.categorical[idx % palette.categorical.length] }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Cash vs Credit Card" subtitle={monthLabel(month, year)} />
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Cash / Debit / UPI / Bank Transfer</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatPaise(data.cashPaise)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Credit Card</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-300">{formatPaise(data.creditCardPaise)}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {data.transactionCount} transaction{data.transactionCount === 1 ? "" : "s"} this month
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Daily Spending" subtitle={monthLabel(month, year)} />
            <DailyTrendChart data={data.daily} />
          </Card>
        </>
      )}
    </div>
  );
}
