import { useState } from "react";
import { useUsers } from "../../hooks/useUsers";
import { useCategories } from "../../hooks/useCategories";
import { Select, Input } from "../ui/Field";
import { Button } from "../ui/Button";
import { Search, Filter, Download } from "../ui/icons";
import { PAYMENT_METHODS } from "../../types";
import { toDateInputValue } from "../../lib/format";
import type { ExpenseFilters as Filters } from "../../lib/api";
import { expensesApi } from "../../lib/api";

interface ExpenseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function todayRange(): [string, string] {
  const today = toDateInputValue();
  return [today, today];
}

function weekRange(): [string, string] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  return [toDateInputValue(start), toDateInputValue(now)];
}

function monthRange(): [string, string] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return [toDateInputValue(start), toDateInputValue(now)];
}

export function ExpenseFilters({ filters, onChange }: ExpenseFiltersProps) {
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState(filters.search ?? "");

  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial, page: 1 });
  }

  function applyShortcut(range: [string, string]) {
    update({ dateFrom: range[0], dateTo: range[1] });
  }

  const isShortcutActive = (range: [string, string]) => filters.dateFrom === range[0] && filters.dateTo === range[1];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && update({ search })}
            onBlur={() => update({ search })}
            placeholder="Search description or notes..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900/40"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowAdvanced((s) => !s)}>
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <a href={expensesApi.exportCsvUrl(filters)} download>
            <Button variant="secondary" size="sm" type="button">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["Today", "This Week", "This Month"] as const).map((label) => {
          const range = label === "Today" ? todayRange() : label === "This Week" ? weekRange() : monthRange();
          return (
            <button
              key={label}
              onClick={() => applyShortcut(range)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isShortcutActive(range)
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          );
        })}
        {(filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => update({ dateFrom: undefined, dateTo: undefined })}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Clear dates
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-700 dark:bg-slate-800/50">
          <Select label="Person" value={filters.userId ?? ""} onChange={(e) => update({ userId: e.target.value || undefined })}>
            <option value="">All</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Select label="Category" value={filters.categoryId ?? ""} onChange={(e) => update({ categoryId: e.target.value || undefined })}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Payment Method"
            value={filters.paymentMethod ?? ""}
            onChange={(e) => update({ paymentMethod: (e.target.value || undefined) as Filters["paymentMethod"] })}
          >
            <option value="">All</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </Select>
          <Select label="Sort By" value={filters.sort ?? "newest"} onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </Select>
          <Input
            label="From Date"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => update({ dateFrom: e.target.value || undefined })}
          />
          <Input label="To Date" type="date" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || undefined })} />
          <Input
            label="Min Amount"
            type="number"
            value={filters.minAmount ?? ""}
            onChange={(e) => update({ minAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Input
            label="Max Amount"
            type="number"
            value={filters.maxAmount ?? ""}
            onChange={(e) => update({ maxAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      )}
    </div>
  );
}
