import { useState } from "react";
import toast from "react-hot-toast";
import { useCategories } from "../hooks/useCategories";
import { useIncome } from "../hooks/useIncome";
import { useApplyBudgetPlan, useGenerateBudgetPlan } from "../hooks/useBudgetPlanner";
import { MonthSelector } from "../components/ui/MonthSelector";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { AlertBanner } from "../components/ui/AlertBanner";
import { CategoryDonutChart } from "../components/charts/CategoryDonutChart";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Plus, Sparkles, Trash } from "../components/ui/icons";
import { formatPaise, monthLabel } from "../lib/format";
import type { BreakdownItem, BudgetPlan, BudgetPlanGroup } from "../types";

interface FixedRow {
  key: string;
  label: string;
  amount: string;
  categoryId: string;
}

const QUICK_FIXED_LABELS = ["Rent", "Education", "Medical"];

const GROUP_META: Record<BudgetPlanGroup, { title: string; subtitle: string; tone: "slate" | "brand" | "amber" }> = {
  fixed: { title: "Fixed Expenses", subtitle: "Locked in — rent, fees, EMIs. Not adjustable by the planner.", tone: "slate" },
  essential: { title: "Essential / Needs", subtitle: "Groceries, utilities, commute — the recommended \"Needs\" band.", tone: "brand" },
  discretionary: { title: "Discretionary / Wants", subtitle: "Dining, entertainment, shopping — the recommended \"Wants\" band.", tone: "amber" },
};

function emptyRow(): FixedRow {
  return { key: Math.random().toString(36).slice(2), label: "", amount: "", categoryId: "" };
}

export default function BudgetPlanner() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: categories = [] } = useCategories();
  const { data: incomeRecords = [] } = useIncome({ month, year });
  const recordedIncomeRupees = incomeRecords.reduce((s, i) => s + i.amountPaise, 0) / 100;

  const [income, setIncome] = useState("");
  const [fixedRows, setFixedRows] = useState<FixedRow[]>([emptyRow()]);
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const generatePlan = useGenerateBudgetPlan();
  const applyPlan = useApplyBudgetPlan();

  function updateRow(key: string, patch: Partial<FixedRow>) {
    setFixedRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setFixedRows((rows) => rows.filter((r) => r.key !== key));
  }

  function quickAddFixed(label: string) {
    if (fixedRows.some((r) => r.label.trim().toLowerCase() === label.toLowerCase())) return;
    const match = categories.find((c) => c.name.toLowerCase() === label.toLowerCase());
    setFixedRows((rows) => [
      ...rows.filter((r) => r.label.trim() || r.amount),
      { key: Math.random().toString(36).slice(2), label, amount: "", categoryId: match?.id ?? "" },
    ]);
  }

  async function handleGenerate() {
    const incomeNum = Number(income);
    if (!incomeNum || incomeNum <= 0) {
      toast.error("Enter this month's income first");
      return;
    }
    const fixedExpenses = fixedRows
      .filter((r) => r.label.trim() && Number(r.amount) > 0)
      .map((r) => ({ label: r.label.trim(), amount: Number(r.amount), categoryId: r.categoryId || null }));

    try {
      const result = await generatePlan.mutateAsync({ month, year, income: incomeNum, fixedExpenses });
      setPlan(result);
      const initialAmounts: Record<string, string> = {};
      for (const c of result.categories) initialAmounts[c.categoryId] = String(Math.round(c.suggestedPaise / 100));
      setAmounts(initialAmounts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate plan");
    }
  }

  async function handleApply() {
    if (!plan) return;
    const allocations = plan.categories
      .filter((c) => Number(amounts[c.categoryId]) > 0)
      .map((c) => ({ categoryId: c.categoryId, amount: Number(amounts[c.categoryId]) }));
    if (allocations.length === 0) return;

    try {
      await applyPlan.mutateAsync({ month, year, allocations });
      toast.success(`Applied ${allocations.length} category budgets for ${monthLabel(month, year)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply plan");
    }
  }

  const needsTotalPaise = plan
    ? plan.fixedTotalPaise + plan.categories.filter((c) => c.group === "essential").reduce((s, c) => s + c.suggestedPaise, 0)
    : 0;
  const wantsTotalPaise = plan ? plan.categories.filter((c) => c.group === "discretionary").reduce((s, c) => s + c.suggestedPaise, 0) : 0;
  const allocationBreakdown: BreakdownItem[] = plan
    ? (() => {
        const total = needsTotalPaise + wantsTotalPaise + plan.savingsTargetPaise || 1;
        const pct = (v: number) => Math.round((v / total) * 1000) / 10;
        return [
          { key: "needs", label: "Needs (fixed + essential)", amountPaise: needsTotalPaise, percentOfTotal: pct(needsTotalPaise), transactionCount: 0 },
          { key: "wants", label: "Wants (discretionary)", amountPaise: wantsTotalPaise, percentOfTotal: pct(wantsTotalPaise), transactionCount: 0 },
          { key: "savings", label: "Savings", amountPaise: plan.savingsTargetPaise, percentOfTotal: pct(plan.savingsTargetPaise), transactionCount: 0 },
        ];
      })()
    : [];

  const groupedCategories = plan
    ? (["fixed", "essential", "discretionary"] as BudgetPlanGroup[]).map((group) => ({
        group,
        items: plan.categories.filter((c) => c.group === group),
      }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            Budget Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter income and fixed costs — get a suggested monthly budget per category, personalized to your spending history.
          </p>
        </div>
        <MonthSelector
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
            setPlan(null);
          }}
        />
      </div>

      <Card>
        <CardHeader title="Monthly Income" subtitle={`For ${monthLabel(month, year)}`} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input type="number" min="0" placeholder="e.g. 200000" value={income} onChange={(e) => setIncome(e.target.value)} />
          </div>
          {recordedIncomeRupees > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setIncome(String(recordedIncomeRupees))}>
              Use recorded income ({formatPaise(recordedIncomeRupees * 100)})
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Fixed Expenses"
          subtitle="Rent, education fees, medical bills, loan EMIs — costs that don't change month to month."
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_FIXED_LABELS.map((label) => (
            <Button key={label} type="button" variant="secondary" size="sm" onClick={() => quickAddFixed(label)}>
              <Plus className="h-3.5 w-3.5" /> {label}
            </Button>
          ))}
        </div>
        <div className="space-y-3">
          {fixedRows.map((row) => (
            <div key={row.key} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="w-full sm:flex-1">
                <Input
                  label="Label"
                  placeholder="e.g. Rent"
                  value={row.label}
                  onChange={(e) => updateRow(row.key, { label: e.target.value })}
                />
              </div>
              <div className="w-full sm:w-36">
                <Input
                  label="Amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select label="Category (optional)" value={row.categoryId} onChange={(e) => updateRow(row.key, { categoryId: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="mb-0.5 rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                aria-label="Remove"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setFixedRows((rows) => [...rows, emptyRow()])}>
          <Plus className="h-4 w-4" /> Add fixed expense
        </Button>
      </Card>

      <Button onClick={handleGenerate} disabled={generatePlan.isPending}>
        <Sparkles className="h-4 w-4" /> {generatePlan.isPending ? "Generating..." : "Generate Plan"}
      </Button>

      {generatePlan.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {plan && (
        <>
          {plan.warnings.length > 0 && (
            <div className="space-y-2">
              {plan.warnings.map((message, idx) => (
                <AlertBanner key={idx} alert={{ severity: "warning", message }} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">Needs (fixed + essential)</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPaise(needsTotalPaise)}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">Wants (discretionary)</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPaise(wantsTotalPaise)}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recommended Savings</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPaise(plan.savingsTargetPaise)}</p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{plan.savingsRatePercent}% of income</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recommended Allocation" subtitle={plan.framework} />
            <CategoryDonutChart data={allocationBreakdown} />
          </Card>

          {groupedCategories.map(
            ({ group, items }) =>
              items.length > 0 && (
                <Card key={group}>
                  <CardHeader title={GROUP_META[group].title} subtitle={GROUP_META[group].subtitle} />
                  <div className="space-y-2">
                    {items.map((c) => (
                      <div key={c.categoryId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{c.categoryName}</span>
                          {c.group !== "fixed" && (
                            <Badge tone={GROUP_META[group].tone}>{c.benchmarkPercentOfIncome}% benchmark</Badge>
                          )}
                          {c.historicalAveragePaise > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">avg {formatPaise(c.historicalAveragePaise)}/mo</span>
                          )}
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            value={amounts[c.categoryId] ?? ""}
                            disabled={c.group === "fixed"}
                            onChange={(e) => setAmounts((a) => ({ ...a, [c.categoryId]: e.target.value }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Applying will set (or update) the {monthLabel(month, year)} budget for each category above, tracked on the Budgets page.
              </p>
              <Button onClick={handleApply} disabled={applyPlan.isPending}>
                {applyPlan.isPending ? "Applying..." : `Apply to ${monthLabel(month, year)} Budgets`}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
