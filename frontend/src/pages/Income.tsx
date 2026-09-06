import { useState } from "react";
import toast from "react-hot-toast";
import { useIncome, useDeleteIncome } from "../hooks/useIncome";
import { MonthSelector } from "../components/ui/MonthSelector";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { IncomeForm } from "../components/income/IncomeForm";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Plus, Wallet, Edit, Trash } from "../components/ui/icons";
import { formatPaise, monthLabel } from "../lib/format";
import type { Income as IncomeRecord } from "../types";

export default function Income() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: incomes = [], isLoading } = useIncome({ month, year });
  const deleteIncome = useDeleteIncome();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRecord | undefined>(undefined);
  const [deleting, setDeleting] = useState<IncomeRecord | undefined>(undefined);

  const total = incomes.reduce((s, i) => s + i.amountPaise, 0);

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(income: IncomeRecord) {
    setEditing(income);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteIncome.mutateAsync(deleting.id);
      toast.success("Income record deleted");
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Income</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track how much the family earns each month.</p>
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
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Income
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Family Income — {monthLabel(month, year)}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatPaise(total)}</p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {!isLoading && incomes.length === 0 && (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="No income recorded for this month."
            action={
              <Button size="sm" onClick={openAdd}>
                Add income
              </Button>
            }
          />
        )}

        {!isLoading && incomes.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {incomes.map((income) => (
              <div key={income.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{income.source}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{income.user ? income.user.name : "Family / Other"}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPaise(income.amountPaise)}</p>
                  <button
                    onClick={() => openEdit(income)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(income)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Income" : "Add Income"}>
        <IncomeForm existing={editing} defaultMonth={month} defaultYear={year} onDone={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this income record?"
        message={deleting ? `This will permanently remove "${deleting.source}" (${formatPaise(deleting.amountPaise)}).` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(undefined)}
        isLoading={deleteIncome.isPending}
      />
    </div>
  );
}
