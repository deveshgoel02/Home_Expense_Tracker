import { useState } from "react";
import toast from "react-hot-toast";
import { useBudgets, useDeleteBudget, useUpdateBudget } from "../hooks/useBudgets";
import { useDashboard } from "../hooks/useDashboard";
import { MonthSelector } from "../components/ui/MonthSelector";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { BudgetForm } from "../components/budgets/BudgetForm";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { PiggyBank, Plus, Edit, Trash } from "../components/ui/icons";
import { formatPaise } from "../lib/format";
import type { Budget } from "../types";

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: budgets = [], isLoading } = useBudgets(month, year);
  const { data: dashboard } = useDashboard(month, year);
  const deleteBudget = useDeleteBudget();
  const updateBudget = useUpdateBudget();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>(undefined);
  const [editAmount, setEditAmount] = useState("");
  const [deleting, setDeleting] = useState<Budget | undefined>(undefined);

  const spentByCategory = new Map(dashboard?.categoryBreakdown.map((b) => [b.key, b.amountPaise]) ?? []);

  function openEdit(budget: Budget) {
    setEditing(budget);
    setEditAmount(String(budget.amountPaise / 100));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editAmount || Number(editAmount) <= 0) return;
    try {
      await updateBudget.mutateAsync({ id: editing.id, amount: Number(editAmount) });
      toast.success("Budget updated");
      setEditing(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update budget");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteBudget.mutateAsync(deleting.id);
      toast.success("Budget removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500">Set monthly spending limits per category and track how close you are.</p>
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
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Budget
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && budgets.length === 0 && (
        <Card>
          <EmptyState
            icon={<PiggyBank className="h-8 w-8" />}
            title="No budgets have been configured."
            description="Set a monthly limit for categories like Groceries or Petrol to keep spending in check."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                Add your first budget
              </Button>
            }
          />
        </Card>
      )}

      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spent = spentByCategory.get(budget.categoryId) ?? 0;
            const percent = budget.amountPaise === 0 ? 0 : Math.round((spent / budget.amountPaise) * 1000) / 10;
            const tone = percent >= 100 ? "red" : percent >= 80 ? "amber" : "green";
            return (
              <Card key={budget.id}>
                <CardHeader
                  title={budget.category.name}
                  action={
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(budget)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(budget)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
                <ProgressBar percent={percent} tone={tone} />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {formatPaise(spent)} of {formatPaise(budget.amountPaise)}
                  </span>
                  <span className="font-semibold text-slate-800">{percent}%</span>
                </div>
                {percent >= 80 && (
                  <Badge tone={percent >= 100 ? "red" : "amber"} className="mt-3">
                    {percent >= 100
                      ? `${budget.category.name} budget exceeded`
                      : `${budget.category.name} budget is ${percent}% used`}
                  </Badge>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {spent > budget.amountPaise
                    ? `${formatPaise(spent - budget.amountPaise)} over budget`
                    : `${formatPaise(budget.amountPaise - spent)} remaining`}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Budget">
        <BudgetForm month={month} year={year} existingCategoryIds={budgets.map((b) => b.categoryId)} onDone={() => setAddOpen(false)} />
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(undefined)} title="Edit Budget" maxWidth="max-w-sm">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={`${editing?.category.name ?? ""} Monthly Budget`}
            type="number"
            min="0"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(undefined)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBudget.isPending}>
              {updateBudget.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove this budget?"
        message={deleting ? `This will remove the ${formatPaise(deleting.amountPaise)} budget for ${deleting.category.name}.` : ""}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(undefined)}
        isLoading={deleteBudget.isPending}
      />
    </div>
  );
}
