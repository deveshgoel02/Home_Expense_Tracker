import { useState } from "react";
import toast from "react-hot-toast";
import type { Expense } from "../../types";
import { formatPaise, relativeDay } from "../../lib/format";
import { PAYMENT_METHODS } from "../../types";
import { Badge } from "../ui/Badge";
import { Copy, Edit, Trash } from "../ui/icons";
import { useDeleteExpense, useDuplicateExpense } from "../../hooks/useExpenses";
import { useAddExpenseModal } from "../../context/AddExpenseModalContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function paymentLabel(method: string) {
  return PAYMENT_METHODS.find((p) => p.value === method)?.label ?? method;
}

export function TransactionRow({ expense, showActions = true }: { expense: Expense; showActions?: boolean }) {
  const { open } = useAddExpenseModal();
  const deleteExpense = useDeleteExpense();
  const duplicateExpense = useDuplicateExpense();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDuplicate() {
    try {
      await duplicateExpense.mutateAsync(expense.id);
      toast.success("Expense duplicated for today");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }

  async function handleDelete() {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success("Expense deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-100 px-1 py-3 last:border-0">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: expense.user.color }}
        >
          {expense.user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
            {expense.paymentMethod === "CREDIT_CARD" && (
              <Badge tone="amber" className="flex-shrink-0">
                Credit
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {expense.category.name} · {expense.user.name} · {relativeDay(expense.date)} · {paymentLabel(expense.paymentMethod)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <p className="text-sm font-semibold text-slate-900">{formatPaise(expense.amountPaise)}</p>
          {showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDuplicate}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Duplicate expense"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => open(expense)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Edit expense"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete expense"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this expense?"
        message={`This will permanently remove "${expense.description}" (${formatPaise(expense.amountPaise)}). This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
        isLoading={deleteExpense.isPending}
      />
    </>
  );
}
