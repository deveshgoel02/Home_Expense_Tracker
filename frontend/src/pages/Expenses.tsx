import { useState } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { ExpenseFilters } from "../components/expenses/ExpenseFilters";
import { TransactionRow } from "../components/expenses/TransactionRow";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { Receipt, Plus } from "../components/ui/icons";
import { useAddExpenseModal } from "../context/AddExpenseModalContext";
import type { ExpenseFilters as Filters } from "../lib/api";
import { formatPaise } from "../lib/format";

export default function Expenses() {
  const [filters, setFilters] = useState<Filters>({ sort: "newest", page: 1, pageSize: 25 });
  const { data, isLoading } = useExpenses(filters);
  const { open } = useAddExpenseModal();

  const hasActiveFilters = Boolean(
    filters.userId || filters.categoryId || filters.paymentMethod || filters.dateFrom || filters.dateTo || filters.search
  );

  const total = data?.items.reduce((s, e) => s + e.amountPaise, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">Browse, search, and manage every expense your family has logged.</p>
        </div>
        <Button onClick={() => open()}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <ExpenseFilters filters={filters} onChange={setFilters} />
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm text-slate-500">
            {data ? `${data.pagination.total} transaction${data.pagination.total === 1 ? "" : "s"}` : "Loading..."}
          </p>
          {data && data.items.length > 0 && (
            <p className="text-sm font-semibold text-slate-800">Page total: {formatPaise(total)}</p>
          )}
        </div>

        <div className="px-5">
          {isLoading && (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="py-6">
              <EmptyState
                icon={<Receipt className="h-8 w-8" />}
                title={hasActiveFilters ? "No transactions match your filters." : "No expenses recorded yet."}
                action={
                  !hasActiveFilters && (
                    <Button onClick={() => open()} size="sm">
                      Add your first expense
                    </Button>
                  )
                }
              />
            </div>
          )}

          {data && data.items.length > 0 && (
            <div>
              {data.items.map((expense) => (
                <TransactionRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <p className="text-sm text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
